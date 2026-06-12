/**
 * Strava Club Activity Fetcher
 *
 * Runs via GitHub Actions to pull club activities from the Strava API
 * and save them to data/activities.json for the static site.
 *
 * Required environment variables:
 *   STRAVA_CLIENT_ID       - Your Strava API app client ID
 *   STRAVA_CLIENT_SECRET   - Your Strava API app client secret
 *   STRAVA_REFRESH_TOKEN   - A refresh token with read_all scope
 *   STRAVA_CLUB_ID         - Your Strava club ID (numeric)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
const CLUB_ID = process.env.STRAVA_CLUB_ID;
const DATA_FILE = path.join(__dirname, '..', 'data', 'activities.json');

// Only include activities from this date onwards
const START_DATE = '2026-06-01T00:00:00Z';

function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function refreshAccessToken() {
    console.log('Refreshing access token...');
    const postData = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN
    }).toString();

    const resp = await httpsRequest({
        hostname: 'www.strava.com',
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, postData);

    if (resp.status !== 200) {
        throw new Error(`Token refresh failed (${resp.status}): ${JSON.stringify(resp.data)}`);
    }

    console.log('Token refreshed successfully.');
    return resp.data.access_token;
}

async function fetchClubActivities(accessToken, page = 1, perPage = 200) {
    console.log(`Fetching club activities page ${page}...`);
    const resp = await httpsRequest({
        hostname: 'www.strava.com',
        path: `/api/v3/clubs/${CLUB_ID}/activities?page=${page}&per_page=${perPage}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (resp.status !== 200) {
        throw new Error(`API request failed (${resp.status}): ${JSON.stringify(resp.data)}`);
    }

    return resp.data;
}

async function fetchRecentClubActivities(accessToken) {
    // Only fetch page 1 (most recent activities) to find genuinely new ones
    // This avoids re-adding hundreds of old activities from the full club history
    const activities = await fetchClubActivities(accessToken, 1, 200);
    if (!activities || activities.length === 0) return [];

    const normalized = activities.map(a => ({
        athlete_name: `${a.athlete?.firstname || 'Unknown'} ${(a.athlete?.lastname || '').charAt(0)}`.trim(),
        firstname: a.athlete?.firstname,
        lastname: a.athlete?.lastname,
        name: a.name,
        type: a.type || a.sport_type,
        distance: a.distance || 0,
        moving_time: a.moving_time || 0,
        elapsed_time: a.elapsed_time || 0,
        total_elevation_gain: a.total_elevation_gain || 0,
        start_date: a.start_date || null,
        start_date_local: a.start_date_local || null,
        workout_type: a.workout_type
    }));

    console.log(`  Fetched ${normalized.length} recent activities`);
    return normalized;
}

async function main() {
    // Validate env
    const missing = [];
    if (!CLIENT_ID) missing.push('STRAVA_CLIENT_ID');
    if (!CLIENT_SECRET) missing.push('STRAVA_CLIENT_SECRET');
    if (!REFRESH_TOKEN) missing.push('STRAVA_REFRESH_TOKEN');
    if (!CLUB_ID) missing.push('STRAVA_CLUB_ID');

    if (missing.length > 0) {
        console.error(`Missing environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    try {
        // Load existing data and known keys (keys of ALL activities ever seen from API)
        let existingActivities = [];
        let knownKeys = [];
        if (fs.existsSync(DATA_FILE)) {
            try {
                const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                existingActivities = existing.activities || [];
                knownKeys = existing.known_keys || [];
                console.log(`Loaded ${existingActivities.length} activities and ${knownKeys.length} known keys.`);
            } catch {
                console.log('Could not parse existing data file, starting fresh.');
            }
        }

        const accessToken = await refreshAccessToken();
        const newActivities = await fetchRecentClubActivities(accessToken);
        console.log(`Fetched ${newActivities.length} activities from Strava.`);

        // Round distance to nearest 100m to avoid duplicates from Strava API
        // returning slightly different values for the same activity across calls
        const activityKey = (a) =>
            `${a.athlete_name}|${a.name}|${Math.round(a.distance / 100) * 100}|${a.moving_time}`;

        // Build set of ALL known keys (existing activities + previously seen API activities)
        const knownSet = new Set(knownKeys);
        for (const a of existingActivities) {
            knownSet.add(activityKey(a));
        }

        const now = new Date().toISOString();

        // Start with ALL existing activities (these have curated/correct dates)
        const merged = [...existingActivities];

        // Fuzzy match: check if an activity closely matches any existing one.
        // This catches cases where Strava returns old activities with slightly
        // different stats (especially common for athletes with repetitive routes
        // like daily morning runs with near-identical distances).
        function fuzzyMatchExists(a) {
            return existingActivities.some(e =>
                e.athlete_name === a.athlete_name &&
                e.name === a.name &&
                Math.abs(e.distance - a.distance) < Math.max(a.distance * 0.1, 200) &&
                Math.abs(e.moving_time - a.moving_time) < 120
            );
        }

        // Only add activities we have NEVER seen before in any sync
        let newCount = 0;
        let skippedFuzzy = 0;
        for (const a of newActivities) {
            const key = activityKey(a);

            // Remember this key for future syncs (even if we don't add the activity)
            knownSet.add(key);

            // Skip if we've seen this key before (exact match after rounding)
            if (knownSet.has(key) && (knownKeys.includes(key) || existingActivities.some(e => activityKey(e) === key))) continue;

            // Skip if it fuzzy-matches an existing activity (same person, same name,
            // similar distance within 10% or 200m, and time within 2 minutes)
            if (fuzzyMatchExists(a)) {
                console.log(`  Skipped fuzzy duplicate: ${a.athlete_name} "${a.name}" ${Math.round(a.distance)}m`);
                skippedFuzzy++;
                continue;
            }

            // This is a genuinely new activity - stamp it with current time
            a.first_seen = now;
            a.start_date = now;
            a.start_date_local = now;

            merged.push(a);
            newCount++;
        }

        console.log(`Found ${newCount} genuinely new activities (${skippedFuzzy} fuzzy duplicates skipped).`);

        const output = {
            club_id: CLUB_ID,
            last_updated: new Date().toISOString(),
            total_activities: merged.length,
            activities: merged,
            known_keys: [...knownSet]
        };

        // Ensure data directory exists
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

        fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));
        console.log(`Saved ${merged.length} total activities to ${DATA_FILE}`);

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
