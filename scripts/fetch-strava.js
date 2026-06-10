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

async function fetchAllClubActivities(accessToken) {
    let allActivities = [];
    let page = 1;
    const perPage = 200;

    while (true) {
        const activities = await fetchClubActivities(accessToken, page, perPage);
        if (!activities || activities.length === 0) break;

        // Normalize the data
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

        allActivities = allActivities.concat(normalized);
        console.log(`  Page ${page}: ${activities.length} activities fetched`);

        if (activities.length < perPage) break;
        page++;

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return allActivities;
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
        // Load existing data to merge (keep historical data)
        let existingActivities = [];
        if (fs.existsSync(DATA_FILE)) {
            try {
                const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                existingActivities = existing.activities || [];
                console.log(`Loaded ${existingActivities.length} existing activities.`);
            } catch {
                console.log('Could not parse existing data file, starting fresh.');
            }
        }

        const accessToken = await refreshAccessToken();
        const newActivities = await fetchAllClubActivities(accessToken);
        console.log(`Fetched ${newActivities.length} activities from Strava.`);

        // Filter out activities before the start date
        const startCutoff = new Date(START_DATE);
        const filteredNew = newActivities.filter(a => {
            if (!a.start_date) return true; // keep activities without dates (can't filter them)
            return new Date(a.start_date) >= startCutoff;
        });
        console.log(`${filteredNew.length} activities after filtering from ${START_DATE}`);

        // Merge: use a composite key to deduplicate
        const activityKey = (a) =>
            `${a.athlete_name}|${a.name}|${a.distance}|${a.moving_time}`;

        const seen = new Set();
        const merged = [];

        // New activities take priority
        for (const a of filteredNew) {
            const key = activityKey(a);
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(a);
            }
        }

        // Add old activities that aren't duplicates and are after start date
        for (const a of existingActivities) {
            if (a.start_date && new Date(a.start_date) < startCutoff) continue;
            const key = activityKey(a);
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(a);
            }
        }

        const output = {
            club_id: CLUB_ID,
            last_updated: new Date().toISOString(),
            total_activities: merged.length,
            activities: merged
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
