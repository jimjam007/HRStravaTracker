// SHR Activity Tracker — Frontend Application

const DATA_URL = 'data/activities.json';

// SVG icon templates (Lucide-style, 20x20)
const ICONS = {
    mountain:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
    trophy:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    medal:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    calendar:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    sun:       '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    party:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>',
    trending:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    target:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    shoe:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 12h7"/><path d="M13 18h7"/><path d="M13 6h7"/><path d="M3 12h1"/><path d="M3 18h1"/><path d="M3 6h1"/><path d="M8 12h1"/><path d="M8 18h1"/><path d="M8 6h1"/></svg>',
    heart:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    star:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    clock:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    zap:       '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    run:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="4" r="2"/><path d="M15.59 13.51l2.78 4.57a1 1 0 0 1-.36 1.37 1 1 0 0 1-1.37-.36L14 14.5V20a1 1 0 0 1-2 0v-5.5l-2.64-4.34L6.18 13.6a1 1 0 0 1-1.42 0 1 1 0 0 1 0-1.42l4.24-4.24a1 1 0 0 1 .71-.29h2.58a1 1 0 0 1 .85.47z"/></svg>',
    walk:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13.5 8.5L15 12l-3 3 2 5"/><path d="M10 8.5L8.5 12l1.5 3-2.5 5"/><path d="M9.5 8.5h4"/></svg>',
    hike:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13.5 8.5L15 12l-3 3 2 5"/><path d="M10 8.5L8.5 12l1.5 3-2.5 5"/><path d="M9.5 8.5h4"/><line x1="5" y1="5" x2="5" y2="21"/><path d="M5 5l4 2"/></svg>',
};

// Activity type icon/class mapping
function actTypeIcon(type) {
    if (type === 'Walk') return { icon: '<img src="walk.png" alt="Walk" class="act-type-img">', cls: 'walk' };
    if (type === 'Hike') return { icon: '<img src="walk.png" alt="Hike" class="act-type-img">', cls: 'hike' };
    return { icon: '<img src="run.png" alt="Run" class="act-type-img">', cls: '' };
}

// Award definitions
const PERFORMANCE_AWARDS = [
    {
        id: 'trailblazer', name: 'Trailblazer Award', desc: 'Highest combined distance',
        icon: ICONS.mountain, style: '',
        compute: (ath) => {
            const t = sumBy(ath, 'distance');
            const w = topEntry(t);
            return w ? { winner: w[0], value: `${km(w[1])} km total` } : null;
        }
    },
    {
        id: 'peak', name: 'Peak Performer', desc: 'Most elevation climbed',
        icon: ICONS.trending, style: '',
        compute: (ath) => {
            const t = sumBy(ath, 'total_elevation_gain');
            const w = topEntry(t);
            return w ? { winner: w[0], value: `${Math.round(w[1])} m elevation` } : null;
        }
    },
    {
        id: 'mileage', name: 'Mileage Master', desc: 'Longest single activity',
        icon: ICONS.medal, style: 'gold',
        compute: (ath) => {
            let best = null;
            for (const [n, acts] of Object.entries(ath))
                for (const a of acts)
                    if (!best || a.distance > best.d) best = { n, d: a.distance, t: a.name };
            return best ? { winner: best.n, value: `${km(best.d)} km — ${best.t}` } : null;
        }
    },
    {
        id: 'consistency', name: 'Consistency Champion', desc: 'Most active days logged',
        icon: ICONS.calendar, style: '',
        compute: (ath) => {
            const dc = {};
            for (const [n, acts] of Object.entries(ath)) {
                const days = new Set(acts.map(a => (a.start_date || a.first_seen || '').slice(0, 10)).filter(Boolean));
                dc[n] = days.size;
            }
            const w = topEntry(Object.entries(dc));
            return w ? { winner: w[0], value: `${w[1]} active days` } : null;
        }
    },
    {
        id: 'weekend', name: 'Weekend Warrior', desc: 'Highest weekend distance',
        icon: ICONS.party, style: '',
        compute: (ath) => {
            const t = {};
            for (const [n, acts] of Object.entries(ath)) {
                t[n] = acts.filter(a => {
                    const ds = a.start_date || a.first_seen;
                    if (!ds) return false;
                    const d = new Date(ds).getDay();
                    return d === 0 || d === 6;
                }).reduce((s, a) => s + (a.distance || 0), 0);
            }
            const w = topEntry(Object.entries(t));
            return w && w[1] > 0 ? { winner: w[0], value: `${km(w[1])} km on weekends` } : null;
        }
    },
    {
        id: 'hero_hiker', name: 'Hero Hiker', desc: 'Furthest total walk distance',
        icon: ICONS.shoe, style: '',
        compute: (ath) => {
            const t = {};
            for (const [n, acts] of Object.entries(ath)) {
                t[n] = acts.filter(a => a.type === 'Walk' || a.type === 'Hike')
                    .reduce((s, a) => s + (a.distance || 0), 0);
            }
            const w = topEntry(Object.entries(t));
            return w && w[1] > 0 ? { winner: w[0], value: `${km(w[1])} km walked` } : null;
        }
    },
];

const MOTIVATIONAL_AWARDS = [
    {
        id: 'improved', name: 'Most Improved', desc: 'Biggest % increase week-on-week',
        icon: ICONS.trending, style: 'warm',
        compute: (ath) => {
            let best = null;
            for (const [n, acts] of Object.entries(ath)) {
                const wk = groupByWeek(acts);
                const keys = Object.keys(wk).sort();
                if (keys.length < 2) continue;
                const f = wk[keys[0]].reduce((s, a) => s + (a.distance || 0), 0);
                const l = wk[keys[keys.length - 1]].reduce((s, a) => s + (a.distance || 0), 0);
                if (f <= 0) continue;
                const pct = ((l - f) / f) * 100;
                if (!best || pct > best.pct) best = { n, pct };
            }
            return best && best.pct > 0 ? { winner: best.n, value: `${best.pct.toFixed(0)}% improvement` } : null;
        }
    },
    {
        id: 'steady', name: 'Steady Strider', desc: 'Most consistent weekly participation',
        icon: ICONS.target, style: 'warm',
        compute: (ath) => {
            let best = null;
            for (const [n, acts] of Object.entries(ath)) {
                const wk = groupByWeek(acts);
                const keys = Object.keys(wk);
                if (!keys.length) continue;
                const counts = keys.map(w => wk[w].length);
                const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
                if (avg === 0) continue;
                const sd = Math.sqrt(counts.reduce((s, c) => s + (c - avg) ** 2, 0) / counts.length);
                const score = keys.length * (1 / (1 + sd / avg));
                if (!best || score > best.score) best = { n, score, wk: keys.length, avg: avg.toFixed(1) };
            }
            return best ? { winner: best.n, value: `${best.wk} weeks, avg ${best.avg}/week` } : null;
        }
    },
    {
        id: 'every_step', name: 'Every Step Counts', desc: 'Most activities under 5 km',
        icon: ICONS.shoe, style: 'warm',
        compute: (ath) => {
            const c = {};
            for (const [n, acts] of Object.entries(ath))
                c[n] = acts.filter(a => a.distance > 0 && a.distance <= 5000).length;
            const w = topEntry(Object.entries(c));
            return w && w[1] > 0 ? { winner: w[0], value: `${w[1]} activities under 5 km` } : null;
        }
    },
    {
        id: 'comeback', name: 'Comeback Award', desc: 'Returned after 14+ day gap',
        icon: ICONS.zap, style: 'warm',
        compute: (ath) => {
            let best = null;
            for (const [n, acts] of Object.entries(ath)) {
                const dates = acts.map(a => new Date(a.start_date || a.first_seen)).filter(d => !isNaN(d)).sort((a, b) => a - b);
                for (let i = 1; i < dates.length; i++) {
                    const gap = (dates[i] - dates[i - 1]) / 864e5;
                    if (gap >= 14 && (!best || gap > best.gap)) best = { n, gap: Math.round(gap) };
                }
            }
            return best ? { winner: best.n, value: `Came back after ${best.gap} days` } : null;
        }
    },
    {
        id: 'first', name: 'First Adventure', desc: 'First activity logged in the group',
        icon: ICONS.star, style: 'gold',
        compute: (ath) => {
            let earliest = null;
            for (const [n, acts] of Object.entries(ath))
                for (const a of acts) {
                    const ds = a.start_date || a.first_seen;
                    if (!ds) continue;
                    const d = new Date(ds);
                    if (!earliest || d < earliest.d) earliest = { n, d, t: a.name };
                }
            return earliest ? { winner: earliest.n, value: `${earliest.t} on ${earliest.d.toLocaleDateString('en-GB')}` } : null;
        }
    },
];

// Helpers
function sumBy(ath, field) {
    return Object.entries(ath).map(([n, acts]) => [n, acts.reduce((s, a) => s + (a[field] || 0), 0)]);
}
function topEntry(entries) {
    if (!entries || !entries.length) return null;
    return entries.reduce((b, c) => (!b || c[1] > b[1]) ? c : b, null);
}
function km(m) { return (m / 1000).toFixed(1); }
function dur(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function getMonday(d) {
    const dt = new Date(d);
    const day = dt.getDay();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
    return dt;
}
// Format a Date as YYYY-MM-DD in local time (not UTC)
function localDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function groupByWeek(acts) {
    const w = {};
    for (const a of acts) {
        const ds = a.start_date_local || a.start_date || a.first_seen;
        if (!ds) continue;
        const key = localDateStr(getMonday(new Date(ds)));
        (w[key] = w[key] || []).push(a);
    }
    return w;
}
function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
function groupByAthlete(activities) {
    const ath = {};
    for (const a of activities) {
        const n = a.athlete_name || `${a.firstname || 'Unknown'} ${(a.lastname || '').charAt(0)}`.trim();
        (ath[n] = ath[n] || []).push(a);
    }
    return ath;
}

// ===== RENDER =====

function renderHeroStats(activities, athletes) {
    document.getElementById('totalMembers').textContent = Object.keys(athletes).length;
    document.getElementById('totalActivities').textContent = activities.length;
    document.getElementById('totalDistance').textContent = (activities.reduce((s, a) => s + (a.distance || 0), 0) / 1000).toFixed(0);
    document.getElementById('totalElevation').textContent = Math.round(activities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0)).toLocaleString();
}

function renderThisWeek(activities) {
    const now = new Date();
    const mon = getMonday(now);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
    const opts = { day: 'numeric', month: 'short' };
    document.getElementById('weekDates').textContent = `${mon.toLocaleDateString('en-GB', opts)} \u2013 ${sun.toLocaleDateString('en-GB', opts)}`;

    const week = activities.filter(a => {
        const ds = a.start_date_local || a.start_date || a.first_seen;
        if (!ds) return false;
        const d = new Date(ds);
        return d >= mon && d <= sun;
    });

    const statsEl = document.getElementById('thisWeekStats');
    const members = new Set(week.map(a => a.athlete_name || `${a.firstname} ${(a.lastname || '').charAt(0)}`));
    const dist = week.reduce((s, a) => s + (a.distance || 0), 0);
    const elev = week.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
    const time = week.reduce((s, a) => s + (a.moving_time || 0), 0);

    statsEl.innerHTML = [
        ['Active', members.size],
        ['Activities', week.length],
        [`km`, km(dist)],
        [`m Climbed`, Math.round(elev).toLocaleString()],
        ['Moving', dur(time)],
    ].map(([l, v]) => `<div class="week-stat-card"><div class="week-stat-value">${v}</div><div class="week-stat-label">${l}</div></div>`).join('');

    const listEl = document.getElementById('thisWeekActivities');
    if (!week.length) { listEl.innerHTML = '<div class="week-empty">No activities logged this week yet.</div>'; return; }
    const sorted = [...week].sort((a, b) => new Date(b.start_date_local || b.start_date || b.first_seen) - new Date(a.start_date_local || a.start_date || a.first_seen));
    listEl.innerHTML = sorted.map(a => activityRow(a)).join('');
}

function activityRow(a) {
    const name = a.athlete_name || `${a.firstname || ''} ${(a.lastname || '').charAt(0)}`.trim();
    const ds = a.start_date_local || a.start_date || a.first_seen;
    const dateStr = ds ? new Date(ds).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
    const { icon, cls } = actTypeIcon(a.type);
    const distance = a.distance ? `${km(a.distance)} km` : '--';
    const duration = a.moving_time ? dur(a.moving_time) : '--';
    const elev = a.total_elevation_gain ? `${Math.round(a.total_elevation_gain)} m` : '';

    return `<div class="act-item">
        <div class="act-type ${cls}">${icon}</div>
        <div class="act-main">
            <div class="act-title">${esc(a.name || a.type || 'Activity')}</div>
            <div class="act-meta">${esc(name)}${dateStr ? ' &middot; ' + dateStr : ''}</div>
        </div>
        <div class="act-stats">
            <div class="act-stat"><div class="act-stat-val">${distance}</div><div class="act-stat-lbl">Dist</div></div>
            <div class="act-stat"><div class="act-stat-val">${duration}</div><div class="act-stat-lbl">Time</div></div>
            ${elev ? `<div class="act-stat"><div class="act-stat-val">${elev}</div><div class="act-stat-lbl">Elev</div></div>` : ''}
        </div>
    </div>`;
}

function renderAwards(athletes) {
    renderAwardGroup('performanceAwards', PERFORMANCE_AWARDS, athletes);
    renderAwardGroup('motivationalAwards', MOTIVATIONAL_AWARDS, athletes);
}

function renderAwardGroup(id, awards, athletes) {
    document.getElementById(id).innerHTML = awards.map(aw => {
        const r = aw.compute(athletes);
        const iconStyle = aw.style || '';
        if (r) return `<div class="award-card">
            <div class="award-icon ${iconStyle}">${aw.icon}</div>
            <div class="award-info">
                <div class="award-label">${aw.name}</div>
                <div class="award-winner">${esc(r.winner)}</div>
                <div class="award-value">${esc(r.value)}</div>
                <div class="award-desc">${aw.desc}</div>
            </div>
        </div>`;
        return `<div class="award-card empty">
            <div class="award-icon ${iconStyle}">${aw.icon}</div>
            <div class="award-info">
                <div class="award-label">${aw.name}</div>
                <div class="award-winner">—</div>
                <div class="award-value">Not enough data yet</div>
                <div class="award-desc">${aw.desc}</div>
            </div>
        </div>`;
    }).join('');
}

function renderLeaderboard(athletes, metric = 'distance', period = 'all') {
    const el = document.getElementById('leaderboardTable');
    const now = new Date();
    let filt = {};

    for (const [n, acts] of Object.entries(athletes)) {
        let fa = acts;
        if (period === 'week') {
            const mon = getMonday(now);
            fa = acts.filter(a => { const d = a.start_date_local || a.start_date || a.first_seen; return d && new Date(d) >= mon; });
        } else if (period === 'month') {
            const mAgo = new Date(now); mAgo.setMonth(now.getMonth() - 1);
            fa = acts.filter(a => { const d = a.start_date_local || a.start_date || a.first_seen; return d && new Date(d) >= mAgo; });
        }
        if (fa.length) filt[n] = fa;
    }

    let rows = Object.entries(filt).map(([n, acts]) => {
        let v;
        switch (metric) {
            case 'distance': v = acts.reduce((s, a) => s + (a.distance || 0), 0); break;
            case 'elevation': v = acts.reduce((s, a) => s + (a.total_elevation_gain || 0), 0); break;
            case 'activities': v = acts.length; break;
            case 'moving_time': v = acts.reduce((s, a) => s + (a.moving_time || 0), 0); break;
            default: v = 0;
        }
        return { n, v };
    }).sort((a, b) => b.v - a.v);

    const max = rows.length ? rows[0].v : 1;
    if (!rows.length) {
        el.innerHTML = '<div class="empty-state"><p>No data for this period</p></div>';
        return;
    }

    el.innerHTML = rows.map((r, i) => {
        let dv;
        switch (metric) {
            case 'distance': dv = `${km(r.v)} km`; break;
            case 'elevation': dv = `${Math.round(r.v)} m`; break;
            case 'activities': dv = `${r.v} activities`; break;
            case 'moving_time': dv = dur(r.v); break;
            default: dv = r.v;
        }
        const pct = max > 0 ? (r.v / max) * 100 : 0;
        const rc = i < 3 ? ` r${i + 1}` : '';
        return `<div class="lb-row">
            <div class="lb-rank${rc}">${i + 1}</div>
            <div class="lb-name">${esc(r.n)}</div>
            <div class="lb-bar-wrap"><div class="lb-bar"><div class="lb-bar-fill" style="width:${pct}%"></div></div></div>
            <div class="lb-value">${dv}</div>
        </div>`;
    }).join('');
}

function buildWeekOptions(activities) {
    const sel = document.getElementById('weekFilter');
    const weeks = {};
    for (const a of activities) {
        const ds = a.start_date_local || a.start_date || a.first_seen;
        if (!ds) continue;
        const mon = getMonday(new Date(ds));
        const key = localDateStr(mon);
        if (!weeks[key]) weeks[key] = mon;
    }
    const sorted = Object.keys(weeks).sort().reverse();
    sel.innerHTML = '<option value="all">All Weeks</option>' +
        sorted.map(key => {
            const mon = weeks[key];
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
            const fmt = { day: 'numeric', month: 'short' };
            const label = `${mon.toLocaleDateString('en-GB', fmt)} \u2013 ${sun.toLocaleDateString('en-GB', fmt)}`;
            return `<option value="${key}">${label}</option>`;
        }).join('');
}

function renderActivities(activities, typeFilter = 'all', weekFilter = 'all') {
    const el = document.getElementById('activitiesList');
    let fa = activities;
    if (typeFilter !== 'all') fa = fa.filter(a => a.type === typeFilter);
    if (weekFilter !== 'all') {
        const mon = new Date(weekFilter + 'T00:00:00');
        const sun = new Date(mon); sun.setDate(mon.getDate() + 7);
        fa = fa.filter(a => {
            const ds = a.start_date_local || a.start_date || a.first_seen;
            if (!ds) return false;
            const d = new Date(ds);
            return d >= mon && d < sun;
        });
    }
    fa = [...fa].sort((a, b) => new Date(b.start_date_local || b.start_date || b.first_seen || 0) - new Date(a.start_date_local || a.start_date || a.first_seen || 0));
    if (!fa.length) { el.innerHTML = '<div class="empty-state"><p>No activities found for this selection</p></div>'; return; }
    el.innerHTML = fa.map(a => activityRow(a)).join('');
}

// ===== TABS =====
function initTabs() {
    const tabs = document.querySelectorAll('.tab[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            // Activate selected
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const panel = document.getElementById('tab-' + tab.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
}

// ===== INIT =====
let allActivities = [];
let allAthletes = {};

async function init() {
    initTabs();
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
        buildWeekOptions(allActivities);
        renderActivities(allActivities);

        if (data.last_updated) {
            document.getElementById('lastUpdated').textContent =
                `Last updated: ${new Date(data.last_updated).toLocaleString()}`;
        }
    } catch (err) {
        console.error('Failed to load data:', err);
        document.getElementById('performanceAwards').innerHTML =
            '<div class="empty-state"><p>No data available yet. Set up the Strava sync to get started.</p></div>';
    }
}

// Controls
document.getElementById('leaderboardMetric').addEventListener('change', () => {
    renderLeaderboard(allAthletes, document.getElementById('leaderboardMetric').value, document.getElementById('leaderboardPeriod').value);
});
document.getElementById('leaderboardPeriod').addEventListener('change', () => {
    renderLeaderboard(allAthletes, document.getElementById('leaderboardMetric').value, document.getElementById('leaderboardPeriod').value);
});
document.getElementById('activityTypeFilter').addEventListener('change', () => {
    renderActivities(allActivities, document.getElementById('activityTypeFilter').value, document.getElementById('weekFilter').value);
});
document.getElementById('weekFilter').addEventListener('change', () => {
    renderActivities(allActivities, document.getElementById('activityTypeFilter').value, document.getElementById('weekFilter').value);
});

init();
