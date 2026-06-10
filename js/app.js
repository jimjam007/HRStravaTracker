// Strava Group Tracker - Frontend Application

const DATA_URL = 'data/activities.json';

// Award definitions
const PERFORMANCE_AWARDS = [
    {
        id: 'trailblazer',
        name: 'Trailblazer Award',
        description: 'Highest combined distance',
        icon: '🏔️',
        color: 'orange',
        compute: (athletes) => {
            const totals = sumByAthlete(athletes, 'distance');
            const winner = topEntry(totals);
            return winner ? { winner: winner[0], value: `${(winner[1] / 1000).toFixed(1)} km total` } : null;
        }
    },
    {
        id: 'peak_performer',
        name: 'Peak Performer',
        description: 'Most elevation climbed',
        icon: '⛰️',
        color: 'purple',
        compute: (athletes) => {
            const totals = sumByAthlete(athletes, 'total_elevation_gain');
            const winner = topEntry(totals);
            return winner ? { winner: winner[0], value: `${Math.round(winner[1])} m elevation` } : null;
        }
    },
    {
        id: 'mileage_master',
        name: 'Mileage Master',
        description: 'Longest single activity',
        icon: '🏅',
        color: 'gold',
        compute: (athletes) => {
            let best = null;
            for (const [name, acts] of Object.entries(athletes)) {
                for (const a of acts) {
                    if (!best || a.distance > best.distance) {
                        best = { name, distance: a.distance, actName: a.name };
                    }
                }
            }
            return best ? { winner: best.name, value: `${(best.distance / 1000).toFixed(1)} km — ${best.actName}` } : null;
        }
    },
    {
        id: 'consistency',
        name: 'Consistency Champion',
        description: 'Most active days logged',
        icon: '📅',
        color: 'green',
        compute: (athletes) => {
            const dayCounts = {};
            for (const [name, acts] of Object.entries(athletes)) {
                const days = new Set();
                for (const a of acts) {
                    if (a.start_date) days.add(a.start_date.slice(0, 10));
                    else days.add(`act-${acts.indexOf(a)}`); // fallback: each activity = 1 day
                }
                dayCounts[name] = days.size;
            }
            const winner = topEntry(Object.entries(dayCounts));
            return winner ? { winner: winner[0], value: `${winner[1]} active days` } : null;
        }
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Most sunrise activities (before 8am)',
        icon: '🌅',
        color: 'orange',
        compute: (athletes) => {
            const counts = {};
            for (const [name, acts] of Object.entries(athletes)) {
                counts[name] = acts.filter(a => {
                    if (!a.start_date_local) return false;
                    const hour = new Date(a.start_date_local).getHours();
                    return hour < 8;
                }).length;
            }
            const winner = topEntry(Object.entries(counts));
            return winner && winner[1] > 0 ? { winner: winner[0], value: `${winner[1]} early morning activities` } : null;
        }
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Most late-evening activities (after 8pm)',
        icon: '🦉',
        color: 'purple',
        compute: (athletes) => {
            const counts = {};
            for (const [name, acts] of Object.entries(athletes)) {
                counts[name] = acts.filter(a => {
                    if (!a.start_date_local) return false;
                    const hour = new Date(a.start_date_local).getHours();
                    return hour >= 20;
                }).length;
            }
            const winner = topEntry(Object.entries(counts));
            return winner && winner[1] > 0 ? { winner: winner[0], value: `${winner[1]} late evening activities` } : null;
        }
    },
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Highest weekend activity total',
        icon: '🎉',
        color: 'blue',
        compute: (athletes) => {
            const totals = {};
            for (const [name, acts] of Object.entries(athletes)) {
                totals[name] = acts.filter(a => {
                    if (!a.start_date) return false;
                    const day = new Date(a.start_date).getDay();
                    return day === 0 || day === 6;
                }).reduce((sum, a) => sum + (a.distance || 0), 0);
            }
            const winner = topEntry(Object.entries(totals));
            return winner && winner[1] > 0 ? { winner: winner[0], value: `${(winner[1] / 1000).toFixed(1)} km on weekends` } : null;
        }
    }
];

const MOTIVATIONAL_AWARDS = [
    {
        id: 'most_improved',
        name: 'Most Improved',
        description: 'Biggest increase from first to latest week',
        icon: '📈',
        color: 'green',
        compute: (athletes) => {
            let bestImprovement = null;
            for (const [name, acts] of Object.entries(athletes)) {
                const weeks = groupByWeek(acts);
                const weekKeys = Object.keys(weeks).sort();
                if (weekKeys.length < 2) continue;
                const firstWeekDist = weeks[weekKeys[0]].reduce((s, a) => s + (a.distance || 0), 0);
                const lastWeekDist = weeks[weekKeys[weekKeys.length - 1]].reduce((s, a) => s + (a.distance || 0), 0);
                if (firstWeekDist <= 0) continue;
                const pctIncrease = ((lastWeekDist - firstWeekDist) / firstWeekDist) * 100;
                if (!bestImprovement || pctIncrease > bestImprovement.pct) {
                    bestImprovement = { name, pct: pctIncrease };
                }
            }
            return bestImprovement && bestImprovement.pct > 0
                ? { winner: bestImprovement.name, value: `${bestImprovement.pct.toFixed(0)}% improvement` }
                : null;
        }
    },
    {
        id: 'steady_strider',
        name: 'Steady Strider',
        description: 'Most consistent weekly participation',
        icon: '🚶',
        color: 'blue',
        compute: (athletes) => {
            let bestConsistency = null;
            for (const [name, acts] of Object.entries(athletes)) {
                const weeks = groupByWeek(acts);
                const weekKeys = Object.keys(weeks);
                if (weekKeys.length === 0) continue;
                // Calculate coefficient of variation (lower = more consistent)
                const counts = weekKeys.map(w => weeks[w].length);
                const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
                if (avg === 0) continue;
                const stdDev = Math.sqrt(counts.reduce((sum, c) => sum + (c - avg) ** 2, 0) / counts.length);
                const cv = stdDev / avg;
                const score = weekKeys.length * (1 / (1 + cv)); // weeks active * consistency
                if (!bestConsistency || score > bestConsistency.score) {
                    bestConsistency = { name, score, weeks: weekKeys.length, avg: avg.toFixed(1) };
                }
            }
            return bestConsistency
                ? { winner: bestConsistency.name, value: `${bestConsistency.weeks} weeks active, avg ${bestConsistency.avg}/week` }
                : null;
        }
    },
    {
        id: 'every_step',
        name: 'Every Step Counts',
        description: 'Staying engaged with shorter, regular activities',
        icon: '👟',
        color: 'pink',
        compute: (athletes) => {
            // Person with the most activities under 5km (showing up matters)
            const counts = {};
            for (const [name, acts] of Object.entries(athletes)) {
                counts[name] = acts.filter(a => a.distance > 0 && a.distance <= 5000).length;
            }
            const winner = topEntry(Object.entries(counts));
            return winner && winner[1] > 0 ? { winner: winner[0], value: `${winner[1]} activities under 5km` } : null;
        }
    },
    {
        id: 'comeback',
        name: 'Comeback Award',
        description: 'Returned after 14+ day gap',
        icon: '💪',
        color: 'orange',
        compute: (athletes) => {
            let bestComeback = null;
            for (const [name, acts] of Object.entries(athletes)) {
                const dates = acts
                    .filter(a => a.start_date)
                    .map(a => new Date(a.start_date))
                    .sort((a, b) => a - b);
                for (let i = 1; i < dates.length; i++) {
                    const gap = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
                    if (gap >= 14 && (!bestComeback || gap > bestComeback.gap)) {
                        bestComeback = { name, gap: Math.round(gap) };
                    }
                }
            }
            return bestComeback
                ? { winner: bestComeback.name, value: `Came back after ${bestComeback.gap} days` }
                : null;
        }
    },
    {
        id: 'first_adventure',
        name: 'First Adventure',
        description: 'First activity ever logged in the group',
        icon: '🌟',
        color: 'gold',
        compute: (athletes) => {
            let earliest = null;
            for (const [name, acts] of Object.entries(athletes)) {
                for (const a of acts) {
                    if (a.start_date) {
                        const d = new Date(a.start_date);
                        if (!earliest || d < earliest.date) {
                            earliest = { name, date: d, actName: a.name };
                        }
                    }
                }
            }
            return earliest
                ? { winner: earliest.name, value: `${earliest.actName} on ${earliest.date.toLocaleDateString()}` }
                : null;
        }
    },
    {
        id: 'breaktime_mover',
        name: 'Breaktime Mover',
        description: 'Best lunchtime walker (11am-2pm)',
        icon: '🥪',
        color: 'green',
        compute: (athletes) => {
            const counts = {};
            for (const [name, acts] of Object.entries(athletes)) {
                counts[name] = acts.filter(a => {
                    if (!a.start_date_local) return false;
                    const hour = new Date(a.start_date_local).getHours();
                    return hour >= 11 && hour < 14;
                }).length;
            }
            const winner = topEntry(Object.entries(counts));
            return winner && winner[1] > 0 ? { winner: winner[0], value: `${winner[1]} lunchtime activities` } : null;
        }
    }
];

// Helper functions
function sumByAthlete(athletes, field) {
    return Object.entries(athletes).map(([name, acts]) => [
        name,
        acts.reduce((sum, a) => sum + (a[field] || 0), 0)
    ]);
}

function topEntry(entries) {
    if (!entries || entries.length === 0) return null;
    return entries.reduce((best, curr) => (!best || curr[1] > best[1]) ? curr : best, null);
}

function groupByWeek(activities) {
    const weeks = {};
    for (const a of activities) {
        const dateStr = a.start_date || a.first_seen;
        if (!dateStr) continue;
        const d = new Date(dateStr);
        const weekStart = getMonday(d);
        const key = weekStart.toISOString().slice(0, 10);
        if (!weeks[key]) weeks[key] = [];
        weeks[key].push(a);
    }
    return weeks;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getActivityIcon(type) {
    const icons = { Run: '🏃', Walk: '🚶', Hike: '🥾', Ride: '🚴', Swim: '🏊' };
    return icons[type] || '🏃';
}

function getActivityClass(type) {
    const classes = { Run: 'run', Walk: 'walk', Hike: 'hike', Ride: 'ride' };
    return classes[type] || 'run';
}

// Group activities by athlete name
function groupByAthlete(activities) {
    const athletes = {};
    for (const a of activities) {
        const name = a.athlete_name || `${a.firstname || 'Unknown'} ${(a.lastname || '').charAt(0)}`.trim();
        if (!athletes[name]) athletes[name] = [];
        athletes[name].push(a);
    }
    return athletes;
}

// Render functions
function renderAwards(athletes) {
    renderAwardGroup('performanceAwards', PERFORMANCE_AWARDS, athletes);
    renderAwardGroup('motivationalAwards', MOTIVATIONAL_AWARDS, athletes);
}

function renderAwardGroup(containerId, awards, athletes) {
    const container = document.getElementById(containerId);
    container.innerHTML = awards.map(award => {
        const result = award.compute(athletes);
        if (result) {
            return `
                <div class="award-card">
                    <div class="award-icon ${award.color}">${award.icon}</div>
                    <div class="award-info">
                        <div class="award-name">${award.name}</div>
                        <div class="award-winner">${escapeHtml(result.winner)}</div>
                        <div class="award-value">${escapeHtml(result.value)}</div>
                    </div>
                </div>`;
        }
        return `
            <div class="award-card no-data">
                <div class="award-icon ${award.color}">${award.icon}</div>
                <div class="award-info">
                    <div class="award-name">${award.name}</div>
                    <div class="award-winner">${award.description}</div>
                    <div class="award-value">Not enough data yet</div>
                </div>
            </div>`;
    }).join('');
}

function renderLeaderboard(athletes, metric = 'distance', period = 'all') {
    const container = document.getElementById('leaderboardTable');
    let filteredAthletes = {};

    // Filter by period
    const now = new Date();
    for (const [name, acts] of Object.entries(athletes)) {
        let filtered = acts;
        if (period === 'week') {
            const monday = getMonday(now);
            filtered = acts.filter(a => {
                const d = a.start_date || a.first_seen;
                return d && new Date(d) >= monday;
            });
        } else if (period === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            filtered = acts.filter(a => {
                const d = a.start_date || a.first_seen;
                return d && new Date(d) >= monthAgo;
            });
        }
        if (filtered.length > 0) filteredAthletes[name] = filtered;
    }

    // Calculate metric
    let rows = Object.entries(filteredAthletes).map(([name, acts]) => {
        let value;
        switch (metric) {
            case 'distance':
                value = acts.reduce((s, a) => s + (a.distance || 0), 0);
                break;
            case 'elevation':
                value = acts.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
                break;
            case 'activities':
                value = acts.length;
                break;
            case 'moving_time':
                value = acts.reduce((s, a) => s + (a.moving_time || 0), 0);
                break;
            default:
                value = 0;
        }
        return { name, value };
    });

    rows.sort((a, b) => b.value - a.value);
    const maxValue = rows.length > 0 ? rows[0].value : 1;

    if (rows.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No data for this period</p></div>';
        return;
    }

    container.innerHTML = rows.map((row, i) => {
        let displayValue;
        switch (metric) {
            case 'distance': displayValue = `${(row.value / 1000).toFixed(1)} km`; break;
            case 'elevation': displayValue = `${Math.round(row.value)} m`; break;
            case 'activities': displayValue = `${row.value} activities`; break;
            case 'moving_time': displayValue = formatDuration(row.value); break;
            default: displayValue = row.value;
        }
        const pct = maxValue > 0 ? (row.value / maxValue) * 100 : 0;
        const rankClass = i < 3 ? ` rank-${i + 1}` : '';

        return `
            <div class="leaderboard-row">
                <div class="leaderboard-rank${rankClass}">${i + 1}</div>
                <div class="leaderboard-name">${escapeHtml(row.name)}</div>
                <div class="leaderboard-bar-wrapper">
                    <div class="leaderboard-bar">
                        <div class="leaderboard-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
                <div class="leaderboard-value">${displayValue}</div>
            </div>`;
    }).join('');
}

function renderActivities(activities, typeFilter = 'all') {
    const container = document.getElementById('activitiesList');
    let filtered = typeFilter === 'all' ? activities : activities.filter(a => a.type === typeFilter);

    // Sort by date descending (most recent first)
    filtered = [...filtered].sort((a, b) => {
        if (a.start_date && b.start_date) return new Date(b.start_date) - new Date(a.start_date);
        return 0;
    });

    // Show max 50
    filtered = filtered.slice(0, 50);

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏃</div><p>No activities found</p></div>';
        return;
    }

    container.innerHTML = filtered.map(a => {
        const name = a.athlete_name || `${a.firstname || 'Unknown'} ${(a.lastname || '').charAt(0)}`.trim();
        const distance = a.distance ? `${(a.distance / 1000).toFixed(1)} km` : '--';
        const duration = a.moving_time ? formatDuration(a.moving_time) : '--';
        const elevation = a.total_elevation_gain ? `${Math.round(a.total_elevation_gain)} m` : '';
        const icon = getActivityIcon(a.type);
        const iconClass = getActivityClass(a.type);

        return `
            <div class="activity-item">
                <div class="activity-type-icon ${iconClass}">${icon}</div>
                <div class="activity-main">
                    <div class="activity-title">${escapeHtml(a.name || a.type || 'Activity')}</div>
                    <div class="activity-athlete">${escapeHtml(name)}${a.start_date ? ' · ' + new Date(a.start_date).toLocaleDateString() : ''}</div>
                </div>
                <div class="activity-stats">
                    <div class="activity-stat">
                        <div class="activity-stat-value">${distance}</div>
                        <div class="activity-stat-label">Distance</div>
                    </div>
                    <div class="activity-stat">
                        <div class="activity-stat-value">${duration}</div>
                        <div class="activity-stat-label">Time</div>
                    </div>
                    ${elevation ? `<div class="activity-stat"><div class="activity-stat-value">${elevation}</div><div class="activity-stat-label">Elev</div></div>` : ''}
                </div>
            </div>`;
    }).join('');
}

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday = 1
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + diff);
    return date;
}

function renderThisWeek(activities) {
    const now = new Date();
    const monday = getMonday(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Set week date range label
    const opts = { day: 'numeric', month: 'short' };
    document.getElementById('weekDates').textContent =
        `(${monday.toLocaleDateString('en-GB', opts)} — ${sunday.toLocaleDateString('en-GB', opts)})`;

    // Filter activities to this week (use first_seen as fallback for date)
    const weekActivities = activities.filter(a => {
        const dateStr = a.start_date || a.first_seen;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= monday && d <= sunday;
    });

    // Render week summary stats
    const statsContainer = document.getElementById('thisWeekStats');
    const weekAthletes = new Set(weekActivities.map(a => a.athlete_name || `${a.firstname || 'Unknown'} ${(a.lastname || '').charAt(0)}`.trim()));
    const weekDist = weekActivities.reduce((s, a) => s + (a.distance || 0), 0);
    const weekElev = weekActivities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
    const weekTime = weekActivities.reduce((s, a) => s + (a.moving_time || 0), 0);

    statsContainer.innerHTML = `
        <div class="week-stat-card">
            <div class="week-stat-value">${weekAthletes.size}</div>
            <div class="week-stat-label">Active Members</div>
        </div>
        <div class="week-stat-card">
            <div class="week-stat-value">${weekActivities.length}</div>
            <div class="week-stat-label">Activities</div>
        </div>
        <div class="week-stat-card">
            <div class="week-stat-value">${(weekDist / 1000).toFixed(1)}</div>
            <div class="week-stat-label">km Total</div>
        </div>
        <div class="week-stat-card">
            <div class="week-stat-value">${Math.round(weekElev).toLocaleString()}</div>
            <div class="week-stat-label">m Climbed</div>
        </div>
        <div class="week-stat-card">
            <div class="week-stat-value">${formatDuration(weekTime)}</div>
            <div class="week-stat-label">Moving Time</div>
        </div>`;

    // Render this week's activities (most recent first)
    const listContainer = document.getElementById('thisWeekActivities');
    if (weekActivities.length === 0) {
        listContainer.innerHTML = '<div class="this-week-empty">No activities logged this week yet. Get moving!</div>';
        return;
    }

    const sorted = [...weekActivities].sort((a, b) => new Date(b.start_date || b.first_seen) - new Date(a.start_date || a.first_seen));

    listContainer.innerHTML = sorted.map(a => {
        const name = a.athlete_name || `${a.firstname || 'Unknown'} ${(a.lastname || '').charAt(0)}`.trim();
        const distance = a.distance ? `${(a.distance / 1000).toFixed(1)} km` : '--';
        const duration = a.moving_time ? formatDuration(a.moving_time) : '--';
        const elevation = a.total_elevation_gain ? `${Math.round(a.total_elevation_gain)} m` : '';
        const icon = getActivityIcon(a.type);
        const iconClass = getActivityClass(a.type);
        const dateStr = a.start_date || a.first_seen;
        const dayName = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';

        return `
            <div class="activity-item">
                <div class="activity-type-icon ${iconClass}">${icon}</div>
                <div class="activity-main">
                    <div class="activity-title">${escapeHtml(a.name || a.type || 'Activity')}</div>
                    <div class="activity-athlete">${escapeHtml(name)} · ${dayName}</div>
                </div>
                <div class="activity-stats">
                    <div class="activity-stat">
                        <div class="activity-stat-value">${distance}</div>
                        <div class="activity-stat-label">Distance</div>
                    </div>
                    <div class="activity-stat">
                        <div class="activity-stat-value">${duration}</div>
                        <div class="activity-stat-label">Time</div>
                    </div>
                    ${elevation ? `<div class="activity-stat"><div class="activity-stat-value">${elevation}</div><div class="activity-stat-label">Elev</div></div>` : ''}
                </div>
            </div>`;
    }).join('');
}

function renderHeroStats(activities, athletes) {
    document.getElementById('totalMembers').textContent = Object.keys(athletes).length;
    document.getElementById('totalActivities').textContent = activities.length;
    const totalDist = activities.reduce((s, a) => s + (a.distance || 0), 0);
    document.getElementById('totalDistance').textContent = (totalDist / 1000).toFixed(0);
    const totalElev = activities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
    document.getElementById('totalElevation').textContent = Math.round(totalElev).toLocaleString();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// Main init
let allActivities = [];
let allAthletes = {};

async function init() {
    try {
        const resp = await fetch(DATA_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        allActivities = data.activities || [];
        allAthletes = groupByAthlete(allActivities);

        renderHeroStats(allActivities, allAthletes);
        renderThisWeek(allActivities);
        renderAwards(allAthletes);
        renderLeaderboard(allAthletes);
        renderActivities(allActivities);

        if (data.last_updated) {
            document.getElementById('lastUpdated').textContent =
                `Last updated: ${new Date(data.last_updated).toLocaleString()}`;
        }
    } catch (err) {
        console.error('Failed to load data:', err);
        document.getElementById('performanceAwards').innerHTML =
            '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>No data available yet. Set up the Strava sync to get started.</p></div>';
    }
}

// Leaderboard controls
document.getElementById('leaderboardMetric').addEventListener('change', () => {
    renderLeaderboard(allAthletes,
        document.getElementById('leaderboardMetric').value,
        document.getElementById('leaderboardPeriod').value);
});

document.getElementById('leaderboardPeriod').addEventListener('change', () => {
    renderLeaderboard(allAthletes,
        document.getElementById('leaderboardMetric').value,
        document.getElementById('leaderboardPeriod').value);
});

// Activity filter
document.getElementById('activityTypeFilter').addEventListener('change', () => {
    renderActivities(allActivities, document.getElementById('activityTypeFilter').value);
});

init();
