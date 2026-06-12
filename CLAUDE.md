# SHR Activity Tracker

Strava group challenge tracker for the SHR HR running club. Static site hosted on GitHub Pages with automated data syncing via GitHub Actions.

**Repo**: github.com/jimjam007/HRStravaTracker (public — required for free GitHub Pages)
**Live site**: https://jimjam007.github.io/HRStravaTracker/
**Strava Club ID**: 2172779
**Challenge period**: June 2026 onwards

## Architecture

```
index.html          — Single-page app with 4 tabs
css/styles.css      — Full design system (sage/white/teal theme from SHR2.png)
js/app.js           — Frontend logic (awards, leaderboard, tabs, rendering)
data/activities.json — Activity data store (committed by GitHub Actions)
scripts/fetch-strava.js — Strava API sync script (runs in GitHub Actions)
.github/workflows/fetch-data.yml — Cron job: every 15 minutes
```

### Static assets
- `SHR2.png` — Club logo (sage/teal with Strava-style chevron)
- `run.png` / `walk.png` — Custom activity type icons matching sage theme
- `run.jpg` / `walk.jpg` — Source images (not used in production)
- `Screenshots/` — Reference screenshots (not deployed)

## Strava API: Critical Limitations

### The Club API does NOT return dates
The endpoint `/api/v3/clubs/{id}/activities` returns distance, time, elevation, and athlete name — but **no activity dates**. This is the single biggest constraint of the project.

**Workaround**: Activities detected by the sync get `start_date` set to the sync detection time. For accuracy, the first ~30 activities (Jun 1-10) were manually curated from Strava screenshots with correct dates. New activities picked up by the 15-minute sync will be dated correctly to within the same day, assuming the person uploads promptly.

**When dates will be wrong**: If someone uploads an old activity to Strava days later, the sync stamps it with the upload day. This requires manual correction in `data/activities.json`.

### The API returns slightly different values each call
The same activity can return different distance/time values across API calls (e.g. 2880m one call, 2883m the next). This caused duplicate detection issues — see Deduplication below.

### API rate limits
- 1000 requests/day
- 100 requests per 15 minutes
- Current usage: 1 token refresh + 1 page fetch = 2 requests per sync = ~192/day

## Deduplication System

The sync has two layers to prevent old activities being re-added as new:

### Layer 1: Known Keys (exact match)
Every activity the API has ever returned gets a key stored in `data/activities.json` under `known_keys`:
```
{athlete_name}|{activity_name}|{distance_rounded_to_100m}|{moving_time}
```
Distance is rounded to nearest 100m to tolerate Strava's API value drift.

### Layer 2: Fuzzy Matching
If a "new" activity (not in known_keys) matches an existing activity by:
- Same `athlete_name`
- Same `name`
- Distance within 10% (or 200m, whichever is larger)
- Moving time within **10 seconds**

...it's skipped as a likely duplicate. This specifically handles athletes like Cintia who run the same route daily with near-identical stats.

### Layer 3: Per-Sync Cap
Maximum 5 new activities per sync cycle. With ~7 members syncing every 15 minutes, more than 5 genuinely new activities in one run is almost certainly old data resurfacing from the API. Keys are still remembered even when capped, so they won't reappear on the next sync.

## Date Handling: UTC vs Local Time

**Critical**: All date filtering and week grouping in the frontend must use **local time**, not UTC. The `getMonday()` helper calculates weeks in local time, so any code that converts dates to strings for comparison must also use local time.

- `localDateStr(d)` — formats a Date as `YYYY-MM-DD` in local time (NOT `toISOString()` which converts to UTC)
- `start_date_local` — always preferred over `start_date` for filtering/display (falls back to `start_date` then `first_seen`)
- Week filter boundaries use `new Date(weekFilter + 'T00:00:00')` (no `Z` suffix = local time)

**Why this matters**: In BST (UTC+1), `toISOString().slice(0,10)` shifts dates back by one day (local midnight = 23:00 UTC the previous day). This caused activities on e.g. Saturday June 7 to appear in the following week's filter.

## Data File Format (data/activities.json)

```json
{
  "club_id": "2172779",
  "last_updated": "2026-06-12T13:50:13.983Z",
  "total_activities": 37,
  "activities": [
    {
      "athlete_name": "Rebecca H",
      "firstname": "Rebecca",
      "lastname": "H.",
      "name": "8km Long Run",
      "type": "Run",
      "distance": 8120,
      "moving_time": 3255,
      "elapsed_time": 3255,
      "total_elevation_gain": 30,
      "start_date": "2026-06-12T06:08:00Z",
      "start_date_local": "2026-06-12T07:08:00",
      "first_seen": "2026-06-12T07:08:00Z",
      "workout_type": null
    }
  ],
  "known_keys": ["Rebecca H|8km Long Run|8100|3255", ...]
}
```

- **Curated activities** have clean timestamps (no milliseconds): `"2026-06-01T17:07:00Z"`
- **Sync-detected activities** previously had millisecond timestamps: `"2026-06-12T10:14:02.968Z"` — these should be cleaned up to proper times when correcting dates
- `first_seen` is when the activity was first detected by the sync
- `distance` is in metres, `moving_time` in seconds

## Frontend (js/app.js)

### Key functions
- `topEntry()` — helper to get top-ranked athlete (named to avoid conflict with Strava iframe's `top` variable)
- `actTypeIcon(type)` — returns custom PNG icons for Run/Walk/Hike
- `buildWeekOptions()` — dynamically creates week selector dropdown (Monday-based weeks)
- `renderActivities()` — accepts typeFilter and weekFilter parameters
- `getMonday()` — helper for Monday-based week calculations
- `groupByAthlete()` — groups activities by `athlete_name`
- `initTabs()` — tab switching, looks for `id="tab-" + tab.dataset.tab`

### Awards system
- `PERFORMANCE_AWARDS` — 6 awards including "Hero Hiker" (most hiking elevation)
- `MOTIVATIONAL_AWARDS` — 5 awards
- Each award has a `compute(athletes)` function that auto-calculates the winner

### Important: `top()` function conflict
Strava embed iframes inject JavaScript that declares a `top` variable. If app.js defines a function called `top()`, it crashes with "Identifier 'top' has already been declared". Always use `topEntry()` instead.

## CSS Design System (css/styles.css)

### Colour palette (derived from SHR2.png)
```
--sage-400: #6AACAE   (primary accent)
--sage-600: #3d757a   (hover/dark accent)
```

### Layout
- `.panel-with-sidebar` — CSS Grid: `1fr 320px` (sidebar for Strava embed)
- `.activity-scroll-container` — max-height: 501px, scrollable activity list
- `.sidebar-widget-fill iframe` — height: 462px (aligned with activity list)
- Responsive breakpoint at 768px: sidebar stacks below main content

### Strava embed
- Iframe `width="320"` matches the 320px sidebar column
- The embed is served by Strava and has its own caching — updates can lag behind the API by hours
- We cannot control embed content

## GitHub Actions Workflow

**File**: `.github/workflows/fetch-data.yml`
- Runs every 15 minutes (`*/15 * * * *`)
- Also supports manual trigger (`workflow_dispatch`)
- Only commits when data actually changes (`git diff --staged --quiet ||`)

### Required secrets
- `STRAVA_CLIENT_ID` — Strava API app client ID
- `STRAVA_CLIENT_SECRET` — Strava API app client secret
- `STRAVA_REFRESH_TOKEN` — OAuth refresh token (scope: `read,activity:read_all`)
- `STRAVA_CLUB_ID` — Numeric club ID (2172779)

### Token refresh
The script uses the refresh token to get a short-lived access token on each run. If the refresh token expires or is revoked, the workflow will fail. To re-authorize:
1. Go to: `https://www.strava.com/oauth/authorize?client_id={ID}&response_type=code&redirect_uri=http://localhost&scope=read,activity:read_all`
2. Copy the `code` from the redirect URL
3. Exchange for tokens via POST to `https://www.strava.com/oauth/token`
4. Update the `STRAVA_REFRESH_TOKEN` secret in GitHub

**Important**: The scope must be exactly `read,activity:read_all` — using `read_all` instead of `read` returns "Bad Request".

## Common Issues and Fixes

### Sync adds old activities as new
- Check the activity's `start_date` — if it has milliseconds, it was sync-detected
- Remove the duplicate from `activities` array in the JSON
- The `known_keys` and fuzzy matching should prevent recurrence

### Git conflicts with auto-sync
The 15-minute sync commits to main while you may be pushing code. Use:
```bash
git stash && git pull --rebase && git stash pop
```

### Activity dates need correcting
Manually edit `data/activities.json` — update `start_date`, `start_date_local`, and `first_seen` fields. Use clean timestamps without milliseconds.

### Sync workflow failing (exit code 1)
Usually a token issue. Check the Actions log. If token expired, re-authorize (see Token refresh above).

## Current Club Members
Rebecca H, Cintia J, James A, Will D, Jess F, Ana E, Ali K
