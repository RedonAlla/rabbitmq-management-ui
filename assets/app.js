/* RabbitMQ Management, Qoder UI — application core
   Routing, shared components, charts, command palette, actions and simulation.
   View markup lives in views.js (window.RMViews). */
(function () {
  'use strict';

  const db = window.RM_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------------ Icons */
  const ICONS = {
    overview: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M17 13.7v6.8M13.6 17h6.8"/>',
    connections: '<path d="M10 13.5 14 9.5"/><path d="M8.4 16.6l-.7.7a3.3 3.3 0 0 1-4.7-4.7l2.4-2.4a3.3 3.3 0 0 1 4.7 0"/><path d="M15.6 7.4l.7-.7a3.3 3.3 0 0 1 4.7 4.7l-2.4 2.4a3.3 3.3 0 0 1-4.7 0"/>',
    channels: '<path d="M4 7h5a3 3 0 0 1 3 3v4a3 3 0 0 0 3 3h5"/><path d="m17 14 3 3-3 3"/><path d="M4 17h3"/><path d="M4 12h3"/>',
    exchanges: '<path d="M3 7h4l4 5 4-5h6"/><path d="M3 17h4l4-5"/><path d="M15 17h6"/><path d="m18 14 3 3-3 3"/>',
    queues: '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v5.5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6"/><path d="M4.5 11.5V17c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-5.5"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3.4 19.5c.4-3.1 2.7-5 5.6-5s5.2 1.9 5.6 5"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.4"/><path d="M17.6 14.8c2 .5 3.3 2.2 3.6 4.7"/>',
    vhosts: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5Z"/>',
    policies: '<path d="M12 3.2 19 6v5.4c0 4.4-2.8 7.7-7 9.4-4.2-1.7-7-5-7-9.4V6l7-2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    limits: '<path d="M4 7h7M15 7h5M4 12h13M19 12h1M4 17h3M11 17h9"/><circle cx="13" cy="7" r="2"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="12" r="2"/>',
    flags: '<path d="M5.5 21V4"/><path d="M5.5 4.5c4-2 7 2 13 0v9c-6 2-9-2-13 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    more: '<circle cx="5" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.15" fill="currentColor" stroke="none"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
    chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
    arrowRight: '<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    plus: '<path d="M12 4.5v15M4.5 12h15"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.1 6"/><path d="M20 4.5V11h-6.5"/>',
    download: '<path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 17.5V21h16v-3.5"/>',
    send: '<path d="m21 3-9.5 9.5"/><path d="M21 3 15.2 21l-3.7-8.5L3 9 21 3Z"/>',
    purge: '<path d="m4.5 14.5 7-7a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8l-6 6H7.5l-3-3a1.2 1.2 0 0 1 0-2Z"/><path d="m9 10 5 5M13 19h7"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l.8 13h9.4l.8-13"/><path d="M10.5 11v5M13.5 11v5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none"/>',
    alert: '<path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4.5"/><circle cx="12" cy="16.7" r=".9" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 6.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    activity: '<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>',
    server: '<rect x="3.5" y="4" width="17" height="6" rx="1.6"/><rect x="3.5" y="14" width="17" height="6" rx="1.6"/><path d="M7 7h.01M7 17h.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r=".9" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r=".9" fill="currentColor" stroke="none"/>',
    edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 6.5 3 3"/>',
    userPlus: '<circle cx="9" cy="8" r="3.4"/><path d="M3.4 19.5c.4-3.1 2.7-5 5.6-5 1.2 0 2.3.3 3.2.9"/><path d="M17.5 13.5v6M14.5 16.5h6"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M18 10h.01M8 14h8"/>',
    zap: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    link: '<path d="M10 13.5 14 9.5"/><path d="M8.4 16.6l-.7.7a3.3 3.3 0 0 1-4.7-4.7l2.4-2.4a3.3 3.3 0 0 1 4.7 0"/><path d="M15.6 7.4l.7-.7a3.3 3.3 0 0 1 4.7 4.7l-2.4 2.4a3.3 3.3 0 0 1-4.7 0"/>',
    shield: '<path d="M12 3.2 19 6v5.4c0 4.4-2.8 7.7-7 9.4-4.2-1.7-7-5-7-9.4V6l7-2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5Z"/>',
    book: '<path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5Z"/><path d="M17 7h2v12.5h-9"/><path d="M8.5 8.5h5M8.5 11.5h5"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-12A1.5 1.5 0 0 1 3 18.5v-12A1.5 1.5 0 0 1 4.5 5H9"/>',
    moon: '<path d="M20 14.2A7.6 7.6 0 0 1 9.8 4 7.8 7.8 0 1 0 20 14.2Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.1.9-1.1 1.8"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>'
  };

  function icon(name, cls = '') {
    return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  /* ---------------------------------------------------------------- Format */
  const NF = new Intl.NumberFormat('en-US');

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function fmtInt(n) { return NF.format(Math.round(Number(n) || 0)); }
  function compact(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(0) + 'k';
    if (n >= 1000) return (n / 1e3).toFixed(1) + 'k';
    return fmtInt(n);
  }
  function fmtRate(n) {
    n = Math.max(0, Number(n) || 0);
    if (n === 0) return '0/s';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k/s';
    if (n >= 100) return Math.round(n) + '/s';
    return n.toFixed(1) + '/s';
  }
  function fmtAxis(n) {
    n = Number(n) || 0;
    if (n >= 1000) return compact(n);
    if (n >= 10) return String(Math.round(n));
    if (n === Math.round(n)) return String(n);
    return n.toFixed(1);
  }
  function fmtMB(mb) {
    mb = Number(mb) || 0;
    if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB';
    return mb.toFixed(1) + ' MB';
  }
  function fmtUptime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
  function fmtSince(ts) {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  }
  function timeAgo(ts) {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 45) return 'just now';
    if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }
  function fmtValue(v, fmt) {
    if (fmt === 'rate') return fmtRate(v);
    if (fmt === 'mb') return fmtMB(v);
    return fmtInt(v);
  }
  const round1 = n => Math.round(n * 10) / 10;

  /* ------------------------------------------------------------- Determinism */
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function histSeries(seed, n, base, spread = 0.16) {
    const rnd = mulberry32(hashStr(seed));
    const out = [];
    let v = base * (0.88 + rnd() * 0.24);
    for (let i = 0; i < n; i++) {
      v += (base - v) * 0.09 + (rnd() - 0.5) * Math.max(base, 0.8) * spread * 0.5;
      out.push(Math.max(0, v));
    }
    if (n > 1) out[n - 1] = Math.max(0, base);
    return out;
  }

  /* --------------------------------------------------------------- Derived */
  function computeTotals() {
    const qs = db.queues;
    const sum = key => qs.reduce((a, q) => a + (q[key] || 0), 0);
    return {
      ready: sum('ready'),
      unacked: sum('unacked'),
      messages: sum('ready') + sum('unacked'),
      consumers: sum('consumers'),
      queues: qs.length,
      exchanges: db.exchanges.length,
      connections: db.connections.length,
      channels: db.channels.length,
      publish: round1(sum('publishRate')),
      deliver: round1(sum('deliverRate')),
      ack: round1(sum('ackRate')),
      vhosts: db.vhosts.length
    };
  }
  function findQueue(name) { return db.queues.find(q => q.name === name); }
  function findExchange(name, vhost) {
    return db.exchanges.find(e => e.name === name && (vhost === undefined || e.vhost === vhost));
  }
  function findConnection(id) { return db.connections.find(c => c.id === id); }
  function findChannel(id) { return db.channels.find(c => c.id === id); }
  function findUser(name) { return db.users.find(u => u.username === name); }
  function findPolicy(name) { return db.policies.find(p => p.name === name); }
  function findVhost(name) { return db.vhosts.find(v => v.name === name); }

  function getVhostStats(name) {
    const qs = db.queues.filter(q => q.vhost === name);
    return {
      queues: qs.length,
      messages: qs.reduce((a, q) => a + q.ready + q.unacked, 0),
      connections: db.connections.filter(c => c.vhost === name).length,
      exchanges: db.exchanges.filter(e => e.vhost === name).length
    };
  }
  function buildPermissions() {
    const out = [];
    db.users.forEach(u => {
      const vhosts = u.vhosts[0] === '*' ? db.vhosts.map(v => v.name) : u.vhosts;
      const monitorOnly = u.tags.includes('monitoring') && !u.tags.includes('administrator');
      vhosts.forEach(v => out.push({
        user: u.username, vhost: v,
        configure: monitorOnly ? '' : '.*',
        write: monitorOnly ? '' : '.*',
        read: '.*'
      }));
    });
    return out;
  }
  function bindingsForQueue(q) {
    return db.bindings.filter(b => b.vhost === q.vhost && b.destination === q.name && b.destType === 'queue');
  }
  function bindingsForExchange(ex) {
    return db.bindings.filter(b => b.vhost === ex.vhost && b.source === ex.name);
  }
  function consumersForQueue(name) {
    return db.consumers.filter(c => c.queue === name);
  }

  /* ------------------------------------------------------------------ State */
  const state = {
    theme: 'light',
    live: true,
    route: null,
    routeSig: '',
    filters: {
      queues: { q: '', vhost: 'all', type: 'all' },
      exchanges: { q: '', vhost: 'all' },
      connections: { q: '' },
      channels: { q: '' },
      users: { q: '' },
      vhosts: { q: '' },
      policies: { q: '' }
    },
    sort: {
      queues: { key: 'name', dir: 1 },
      exchanges: { key: 'name', dir: 1 },
      connections: { key: 'name', dir: 1 },
      channels: { key: 'number', dir: 1 },
      users: { key: 'username', dir: 1 },
      policies: { key: 'name', dir: 1 }
    },
    page: { queues: 1, exchanges: 1, connections: 1, channels: 1 },
    pageSize: 10,
    detailTab: { queue: 'overview', exchange: 'overview', connection: 'overview' },
    range: { overview: '5m', queue: '5m', exchange: '5m' },
    charts: [],
    spark: {},
    lastTick: Date.now(),
    palette: { open: false, query: '', active: 0, items: [] },
    menuOpen: false,
    menuItems: []
  };

  let pendingCharts = [];
  let activeModalEl = null;
  let lastFocused = null;

  const DEFAULT_TABS = { queue: 'overview', exchange: 'overview', connection: 'overview' };

  /* --------------------------------------------------------------- Components */
  const TYPE_CHIP = type => `<span class="chip chip--type chip--${esc(type)}">${esc(type)}</span>`;

  const STATE_MAP = {
    running: ['ok', 'running'],
    degraded: ['warn', 'degraded'],
    idle: ['idle', 'idle'],
    closed: ['err', 'closed']
  };
  function stateCell(s) {
    const [tone, label] = STATE_MAP[s] || ['idle', s];
    return `<span class="queue-state"><span class="status-dot status-dot--${tone}"></span>${esc(label)}</span>`;
  }
  function stateBadge(s) {
    const [tone, label] = STATE_MAP[s] || ['idle', s];
    return `<span class="status-badge status-badge--${tone === 'idle' ? 'muted' : tone}">${esc(label)}</span>`;
  }
  function featureChips(item) {
    const feats = [];
    if (item.durable) feats.push(['D', 'Durable']);
    if (item.autoDelete) feats.push(['AD', 'Auto-delete']);
    if (item.internal) feats.push(['I', 'Internal']);
    if (item.args && item.args['alternate-exchange']) feats.push(['AE', 'Alternate exchange']);
    if (item.policy) {
      const p = findPolicy(item.policy);
      if (p) {
        const d = p.definition || {};
        if (d['message-ttl']) feats.push(['TTL', 'Message TTL']);
        if (d['dead-letter-exchange']) feats.push(['DLX', 'Dead-letter routing']);
        if (d['max-length']) feats.push(['L', 'Max length']);
      }
    }
    if (!feats.length) return '<span class="muted">—</span>';
    return `<span class="feature-chips">${feats.slice(0, 4).map(f =>
      `<span class="fchip fchip--on" title="${esc(f[1])}">${esc(f[0])}</span>`).join('')}</span>`;
  }
  function crumbs(items) {
    return items.map((it, i) => {
      if (i === items.length - 1) return `<span class="crumbs-current">${esc(it.label)}</span>`;
      return `<a href="${it.href}">${esc(it.label)}</a><span class="sep">/</span>`;
    }).join('');
  }
  function subJoin(parts) {
    return parts.filter(Boolean).join('<span class="sep"></span>');
  }
  function pageHead(o) {
    return `<div class="page-head">
      <div>
        ${o.crumb ? `<div class="breadcrumbs">${o.crumb}</div>` : ''}
        <div class="page-title-row">
          <h1 class="page-title${o.mono ? ' page-title--mono' : ''}">${o.titleHtml || esc(o.title)}</h1>
          ${o.badge || ''}
        </div>
        ${o.sub ? `<div class="page-sub">${o.sub}</div>` : ''}
      </div>
      <div class="page-actions">
        ${o.updated ? `<span class="updated"><span class="status-dot status-dot--ok"></span>updated <span id="updated-label">just now</span></span>` : ''}
        ${o.actions || ''}
      </div>
    </div>`;
  }
  function tabsHTML(active, items) {
    return `<div class="tabs" role="tablist">${items.map(it =>
      `<button type="button" class="tab${it.id === active ? ' is-active' : ''}" data-tab="${it.id}" role="tab" aria-selected="${it.id === active}">
        ${esc(it.label)}${it.count != null ? `<span class="tab__count">${it.count}</span>` : ''}
      </button>`).join('')}</div>`;
  }
  function pagerHTML(view, total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    page = Math.min(Math.max(1, page), pages);
    const start = total ? (page - 1) * size + 1 : 0;
    const end = Math.min(total, page * size);
    let from = Math.max(1, Math.min(page - 2, pages - 4));
    const to = Math.min(pages, from + 4);
    from = Math.max(1, Math.min(from, to - 4));
    const nums = [];
    for (let i = from; i <= to; i++) nums.push(i);
    const btn = (n, label, disabled, active) =>
      `<button type="button" data-page-go="${n}" ${disabled ? 'disabled' : ''} class="${active ? 'is-active' : ''}" aria-label="Page ${n}">${label}</button>`;
    return `<div class="table-foot">
      <span>Showing ${fmtInt(start)}–${fmtInt(end)} of ${fmtInt(total)}${total !== db.queues.length && view === 'queues' ? ' · filtered' : ''}</span>
      <div class="pager">
        ${btn(page - 1, icon('chevronLeft'), page <= 1, false)}
        ${from > 1 ? btn(1, '1', false, page === 1) + (from > 2 ? '<span class="ellipsis">…</span>' : '') : ''}
        ${nums.map(n => btn(n, String(n), false, n === page)).join('')}
        ${to < pages ? (to < pages - 1 ? '<span class="ellipsis">…</span>' : '') + btn(pages, String(pages), false, page === pages) : ''}
        ${btn(page + 1, icon('chevronRight'), page >= pages, false)}
      </div>
      <div class="page-size">
        <span>Rows</span>
        <div class="select-wrap">
          <select data-page-size aria-label="Rows per page">
            ${[10, 25, 50].map(n => `<option value="${n}" ${n === size ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
          ${icon('chevronDown')}
        </div>
      </div>
    </div>`;
  }
  function sortItems(items, sort) {
    const dir = sort.dir;
    return items.slice().sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === 'total') { av = a.ready + a.unacked; bv = b.ready + b.unacked; }
      if (sort.key === 'bindings') { av = bindingsForExchange(a).length; bv = bindingsForExchange(b).length; }
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
      }
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
    });
  }
  function emptyState(title, desc, action = '') {
    return `<div class="empty"><div class="empty__inner"><div class="empty__icon">${icon('search')}</div>
      <div class="empty__title">${esc(title)}</div><div class="empty__desc">${esc(desc)}</div>${action}</div></div>`;
  }
  function sparkSVG(values, color) {
    if (!values || values.length < 2) return '';
    const w = 58, h = 20, min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `<svg viewBox="0 0 58 20" width="58" height="20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M${pts.join(' L')}" style="stroke:${color}"/></svg>`;
  }

  const METRICS = {
    publish: { key: 'publish', label: 'Published', color: 'var(--coral)' },
    deliver: { key: 'deliver', label: 'Delivered', color: 'var(--green)' },
    ack: { key: 'ack', label: 'Acknowledged', color: 'var(--text-3)' }
  };
  const METRIC_KEYS = ['publish', 'deliver', 'ack'];

  function ratesCard(o) {
    const range = state.range[o.rangeKey] || '5m';
    const metrics = o.metrics.map(k => METRICS[k]);
    pendingCharts.push({
      id: o.id,
      rangeKey: o.rangeKey,
      metrics: o.metrics,
      getValues: o.getValues
    });
    const legend = metrics.map(m => `
      <button type="button" class="chart-legend__item" data-legend-toggle="${o.id}:${m.key}" title="Toggle ${esc(m.label)}">
        <span class="chart-legend__swatch" style="background:${m.color}"></span>
        ${esc(m.label)}
        <span class="chart-legend__val" data-legend-val="${o.id}:${m.key}">—</span>
      </button>`).join('');
    const ranges = ['1m', '5m', '1h', '1d'].map(r =>
      `<button type="button" class="${r === range ? 'is-active' : ''}" data-range-key="${o.rangeKey}" data-range-value="${r}">${r}</button>`).join('');
    return `<div class="card">
      <div class="chart-panel__top">
        <div>
          <div class="card__title">${esc(o.title || 'Message rates')}</div>
          <div class="card__desc">${esc(o.desc || 'Publish, deliver and acknowledgement rates across the cluster')}</div>
          <div class="chart-legend">${legend}</div>
        </div>
        <div class="seg" role="group" aria-label="Chart range">${ranges}</div>
      </div>
      <div class="chart" data-chart-host="${o.id}">
        <div class="chart__empty">loading samples…</div>
      </div>
    </div>`;
  }

  function statTile(o) {
    const t = computeTotals();
    const v = t[o.key] || 0;
    const d = o.delta || 0;
    const delta = d === 0
      ? `<span class="stat__delta">0.0%</span>`
      : `<span class="stat__delta"><span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '↑' : '↓'} ${Math.abs(d).toFixed(1)}%</span></span>`;
    return `<div class="stat">
      <div class="stat__label">${icon(o.iconName || 'activity')}${esc(o.label)}</div>
      <div class="stat__value" data-live-total="${o.key}" data-fmt="${o.fmt || 'int'}">${fmtValue(v, o.fmt)}</div>
      <div class="stat__bottom">
        ${delta}
        <span class="stat__spark" data-spark="${o.sparkKey}">${sparkSVG(state.spark[o.sparkKey], o.color || 'var(--text-3)')}</span>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- Charts */
  const RANGE_META = {
    '1m': { samples: 30, seconds: 60 },
    '5m': { samples: 60, seconds: 300 },
    '1h': { samples: 60, seconds: 3600 },
    '1d': { samples: 60, seconds: 86400 }
  };
  function niceNum(x) {
    if (!isFinite(x) || x <= 0) return 1;
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    const nf = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5
      : f <= 3 ? 3 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
    return nf * Math.pow(10, exp);
  }
  function relativeShort(sec) {
    if (sec <= 0) return 'now';
    if (sec < 60) return `-${Math.round(sec)}s`;
    if (sec < 3600) return `-${Math.round(sec / 60)}m`;
    if (sec < 86400) return `-${Math.round(sec / 3600)}h`;
    return `-${Math.round(sec / 86400)}d`;
  }
  function xAxisLabels(range) {
    const total = RANGE_META[range].seconds;
    if (range === '5m') {
      return ['-5m', '-4m', '-3m', '-2m', '-1m', 'now'];
    }
    return [0, 1, 2, 3, 4].map(i => relativeShort(total * (1 - i / 4)));
  }
  function pointAgo(range, idx, n) {
    const sec = RANGE_META[range].seconds * (1 - idx / (n - 1));
    if (sec <= 2) return 'now';
    if (sec < 60) return `${Math.round(sec)}s ago`;
    if (sec < 3600) {
      const m = Math.floor(sec / 60), s = Math.round(sec % 60);
      return s ? `${m}m ${s}s ago` : `${m}m ago`;
    }
    if (sec < 86400) {
      const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
      return m ? `${h}h ${m}m ago` : `${h}h ago`;
    }
    return `${Math.round(sec / 86400)}d ago`;
  }

  function mountChart(host, cfg) {
    const range = state.range[cfg.rangeKey] || '5m';
    const n = RANGE_META[range].samples;
    const baseVals = cfg.getValues() || [];
    const series = cfg.metrics.map((k, i) => ({
      ...METRICS[k],
      values: histSeries(cfg.id + ':' + k, n, baseVals[i] || 0, 0.2)
    }));
    host.innerHTML = `
      <div class="chart__frame">
        <div class="chart__y" data-y></div>
        <div class="chart__main">
          <div class="chart__plot"><svg viewBox="0 0 1000 200" preserveAspectRatio="none" data-svg></svg></div>
          <div class="chart__x" data-x></div>
          <div class="chart__tip" data-tip></div>
          <div class="chart__hair" data-hair></div>
        </div>
      </div>`;
    const chart = {
      id: cfg.id, cfg, series, hidden: new Set(), n, range,
      host,
      yEl: host.querySelector('[data-y]'),
      main: host.querySelector('.chart__main'),
      plot: host.querySelector('.chart__plot'),
      svg: host.querySelector('[data-svg]'),
      xEl: host.querySelector('[data-x]'),
      tip: host.querySelector('[data-tip]'),
      hair: host.querySelector('[data-hair]'),
      xLabels: xAxisLabels(range)
    };

    chart.render = function () { renderChart(chart); };
    chart.toggle = function (key) {
      if (chart.hidden.has(key)) chart.hidden.delete(key);
      else chart.hidden.add(key);
      const btn = document.querySelector(`[data-legend-toggle="${chart.id}:${key}"]`);
      if (btn) btn.classList.toggle('is-off', chart.hidden.has(key));
      renderChart(chart);
    };

    chart.main.addEventListener('pointermove', ev => {
      const rect = chart.plot.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const idx = Math.round(ratio * (chart.n - 1));
      const mainRect = chart.main.getBoundingClientRect();
      const px = ev.clientX - mainRect.left;
      const visible = chart.series.filter(s => !chart.hidden.has(s.key));
      chart.xEl.dataset.hover = '1';
      chart.hair.style.left = `${(idx / (chart.n - 1)) * 100}%`;
      chart.hair.style.height = `${rect.height}px`;
      chart.hair.style.opacity = '1';
      chart.tip.innerHTML = `<div class="chart__tip-time">${pointAgo(chart.range, idx, chart.n)}</div>` +
        visible.map(s => `<div class="chart__tip-row">
          <span class="chart__tip-dot" style="background:${s.color}"></span>${esc(s.label)}
          <b>${fmtRate(s.values[idx])}</b></div>`).join('');
      chart.tip.style.left = `${Math.min(Math.max(8, px + 14), Math.max(8, mainRect.width - 158))}px`;
      chart.tip.classList.add('is-on');
    });
    chart.main.addEventListener('pointerleave', () => {
      chart.tip.classList.remove('is-on');
      chart.hair.style.opacity = '0';
    });

    renderChart(chart);
    return chart;
  }

  function renderChart(chart) {
    const visible = chart.series.filter(s => !chart.hidden.has(s.key));
    const n = chart.n;
    let rawMax = 1;
    visible.forEach(s => s.values.forEach(v => { if (v > rawMax) rawMax = v; }));
    const step = niceNum((rawMax * 1.08) / 4);
    const max = step * 4;
    chart.yEl.innerHTML = [4, 3, 2, 1, 0].map(i => `<span>${fmtAxis(step * i)}</span>`).join('');
    const grid = [];
    for (let i = 0; i <= 4; i++) {
      const y = i * 50;
      grid.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}" class="${i === 4 ? '' : 'grid-dash'}"/>`);
    }
    [250, 500, 750].forEach(x => grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="200" class="grid-dash"/>`));
    const counts = n > 1 ? n - 1 : 1;
    let shapes = '';
    visible.forEach((s, idx) => {
      const pts = s.values.map((v, i) =>
        `${((i / counts) * 1000).toFixed(2)},${(200 - Math.min(1, v / max) * 200).toFixed(2)}`).join(' L');
      const d = 'M' + pts;
      if (idx === 0) shapes += `<path d="${d} L1000 200 L0 200 Z" style="fill:${s.color}" fill-opacity=".055" stroke="none"/>`;
      shapes += `<path d="${d}" fill="none" style="stroke:${s.color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    });
    chart.svg.innerHTML = `<g class="chart__grid">${grid.join('')}</g>${visible.length ? shapes : ''}`;
    chart.xEl.innerHTML = chart.xLabels.map(l => `<span>${esc(l)}</span>`).join('');
    chart.cfg.metrics.forEach(k => {
      const s = chart.series.find(x => x.key === k);
      const el = document.querySelector(`[data-legend-val="${chart.id}:${k}"]`);
      if (el && s) el.textContent = fmtRate(s.values[n - 1]);
    });
    chart.tip.classList.remove('is-on');
    chart.hair.style.opacity = '0';
  }

  function tickCharts() {
    state.charts.forEach(ch => {
      const vals = ch.cfg.getValues() || [];
      ch.series.forEach((s, i) => {
        const next = Math.max(0, (vals[i] || 0) * (0.955 + Math.random() * 0.09));
        s.values.push(next);
        while (s.values.length > ch.n) s.values.shift();
      });
      renderChart(ch);
    });
  }

  /* ---------------------------------------------------------------- Routing */
  function resolveRoute() {
    const raw = (location.hash || '#/overview').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean).map(p => {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
    const root = parts[0] || 'overview';
    const id = parts.slice(1).join('/');
    switch (root) {
      case 'overview': return { view: 'overview', nav: 'overview' };
      case 'queues': return id ? { view: 'queue', id, nav: 'queues' } : { view: 'queues', nav: 'queues' };
      case 'exchanges': return id ? { view: 'exchange', id, nav: 'exchanges' } : { view: 'exchanges', nav: 'exchanges' };
      case 'connections': return id ? { view: 'connection', id, nav: 'connections' } : { view: 'connections', nav: 'connections' };
      case 'channels': return id ? { view: 'channel', id, nav: 'channels' } : { view: 'channels', nav: 'channels' };
      case 'users': return { view: 'users', nav: 'users' };
      case 'vhosts': return { view: 'vhosts', nav: 'vhosts' };
      case 'policies': return { view: 'policies', nav: 'policies' };
      case 'limits': return { view: 'limits', nav: 'limits' };
      case 'flags': return { view: 'flags', nav: 'flags' };
      default: return { view: 'notfound', nav: '' };
    }
  }
  const TITLES = {
    overview: 'Overview', queues: 'Queues', exchanges: 'Exchanges', connections: 'Connections',
    channels: 'Channels', users: 'Users', vhosts: 'Virtual hosts', policies: 'Policies',
    limits: 'Limits', flags: 'Feature flags'
  };
  function pageTitleFor(route) {
    if (route.view === 'notfound') return 'Not found · RabbitMQ';
    if (route.id) return `${route.id} · ${TITLES[route.nav] || 'RabbitMQ'}`;
    return `${TITLES[route.view] || 'RabbitMQ'} · RabbitMQ Management`;
  }

  function renderPage(scroll = true) {
    closeMenu();
    const route = resolveRoute();
    const sig = `${route.view}|${route.id || ''}`;
    if (sig !== state.routeSig) {
      state.routeSig = sig;
      state.detailTab = { ...DEFAULT_TABS };
    }
    state.route = route;
    const holder = $('#view');
    pendingCharts = [];
    const fn = window.RMViews && window.RMViews[route.view];
    holder.innerHTML = fn ? fn(route.id, route) :
      emptyState('View unavailable', 'The interface is still loading. Refresh the page.');
    document.title = pageTitleFor(route);
    updateNav(route.nav);
    updateHeaderCounts();
    updateLivePill();
    updateUpdatedLabel();
    afterRender();
    if (scroll) window.scrollTo(0, 0);
  }

  function renderCurrent() { renderPage(false); }

  function afterRender() {
    const cfgs = pendingCharts;
    pendingCharts = [];
    state.charts = [];
    cfgs.forEach(cfg => {
      const host = document.querySelector(`[data-chart-host="${cfg.id}"]`);
      if (!host) return;
      const chart = mountChart(host, cfg);
      if (chart) state.charts.push(chart);
    });
  }

  function updateNav(active) {
    $$('.nav__item').forEach(a => a.classList.toggle('is-active', a.dataset.nav === active));
  }
  function updateHeaderCounts() {
    const counts = {
      connections: db.connections.length,
      channels: db.channels.length,
      exchanges: db.exchanges.length,
      queues: db.queues.length
    };
    $$('[data-count]').forEach(el => {
      if (counts[el.dataset.count] != null) el.textContent = counts[el.dataset.count];
    });
  }

  /* ------------------------------------------------------------------- Theme */
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('rmq-theme', theme); } catch (e) { /* no-op */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f0f0e' : '#f4f1eb');
    const btn = $('#theme-btn');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem('rmq-theme'); } catch (e) { /* no-op */ }
    setTheme(stored === 'dark' ? 'dark' : 'light');
  }

  function updateLivePill() {
    const pill = $('.live-pill');
    const label = $('#live-label');
    if (pill) {
      pill.classList.toggle('is-paused', !state.live);
      pill.setAttribute('aria-pressed', String(state.live));
      pill.title = state.live ? 'Pause live updates' : 'Resume live updates';
    }
    if (label) label.textContent = state.live ? 'Live' : 'Paused';
  }
  function toggleLive() {
    state.live = !state.live;
    state.lastTick = Date.now();
    updateLivePill();
    updateUpdatedLabel();
  }
  function openNav() {
    const sb = $('#sidebar');
    const scrim = $('#nav-scrim');
    if (!sb) return;
    sb.classList.add('is-open');
    document.body.classList.add('nav-open');
    if (scrim) scrim.hidden = false;
    const btn = $('[data-action="toggle-nav"]');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }
  function closeNav() {
    const sb = $('#sidebar');
    const scrim = $('#nav-scrim');
    if (sb) sb.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    if (scrim) scrim.hidden = true;
    const btn = $('[data-action="toggle-nav"]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  function toggleNav() {
    const sb = $('#sidebar');
    if (sb && sb.classList.contains('is-open')) closeNav();
    else openNav();
  }
  function updateUpdatedLabel() {
    const el = $('#updated-label');
    if (!el) return;
    if (!state.live) { el.textContent = 'paused'; return; }
    const s = Math.floor((Date.now() - state.lastTick) / 1000);
    el.textContent = s < 3 ? 'just now' : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
  }

  /* ------------------------------------------------------------------- Toasts */
  function showToast(title, desc, type = 'success', timeout = 4200) {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__dot"></span>
      <div class="toast__body"><div class="toast__title">${esc(title)}</div>${desc ? `<div class="toast__desc">${esc(desc)}</div>` : ''}</div>
      <button class="toast__close" type="button" aria-label="Dismiss">${icon('close')}</button>`;
    root.appendChild(el);
    const dismiss = () => {
      if (el.classList.contains('is-leaving')) return;
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 180);
    };
    el.querySelector('.toast__close').addEventListener('click', dismiss);
    setTimeout(dismiss, timeout);
  }

  /* --------------------------------------------------------------------- Menu */
  function closeMenu() {
    const root = $('#menu-root');
    if (root) root.innerHTML = '';
    state.menuOpen = false;
    state.menuItems = [];
  }
  function openMenu(anchor, opts) {
    closeMenu();
    const root = $('#menu-root');
    const items = opts.items || [];
    state.menuItems = items;
    const html = items.map((it, i) => {
      if (it.sep) return '<div class="popmenu__sep"></div>';
      return `<button type="button" class="${it.danger ? 'is-danger' : ''}" data-menu-index="${i}">
        ${icon(it.icon || 'arrowRight')}${esc(it.label)}</button>`;
    }).join('');
    root.innerHTML = `<div class="popmenu" role="menu">
      ${opts.title ? `<div class="popmenu__label">${esc(opts.title)}</div>` : ''}${html}</div>`;
    const menu = root.firstElementChild;
    const rect = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth || 184;
    const mh = menu.offsetHeight || 100;
    let left = Math.min(rect.right - mw, window.innerWidth - mw - 8);
    left = Math.max(8, left);
    let top = rect.bottom + 5;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 5);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    state.menuOpen = true;
    const first = menu.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }

  function openEntityMenu(kind, id, anchor) {
    if (kind === 'queue') {
      const q = findQueue(id);
      if (!q) return;
      openMenu(anchor, {
        title: q.name,
        items: [
          { label: 'View queue', icon: 'queues', run: () => { location.hash = `#/queues/${encodeURIComponent(q.name)}`; } },
          { label: 'Publish message', icon: 'send', run: () => openPublish('queue', q.name) },
          { sep: true },
          { label: 'Purge messages', icon: 'purge', run: () => confirmPurgeQueue(q.name) },
          { label: 'Delete queue', icon: 'trash', danger: true, run: () => confirmDeleteQueue(q.name) },
          { sep: true },
          { label: 'Copy name', icon: 'copy', run: () => copyText(q.name, 'Queue name') }
        ]
      });
    } else if (kind === 'exchange') {
      const ex = findExchange(id);
      if (!ex) return;
      openMenu(anchor, {
        title: ex.name || '(default exchange)',
        items: [
          { label: 'View exchange', icon: 'exchanges', run: () => { location.hash = `#/exchanges/${encodeURIComponent(ex.name)}`; } },
          { label: 'Publish message', icon: 'send', run: () => openPublish('exchange', ex.name, ex.vhost) },
          { sep: true },
          { label: 'Delete exchange', icon: 'trash', danger: true, run: () => confirmDeleteExchange(ex.name, ex.vhost) },
          { label: 'Copy name', icon: 'copy', run: () => copyText(ex.name, 'Exchange name') }
        ]
      });
    } else if (kind === 'connection') {
      const c = findConnection(id);
      if (!c) return;
      openMenu(anchor, {
        title: c.name,
        items: [
          { label: 'View connection', icon: 'connections', run: () => { location.hash = `#/connections/${encodeURIComponent(c.id)}`; } },
          { label: 'Close connection', icon: 'close', danger: true, run: () => confirmCloseConnection(c.id) },
          { sep: true },
          { label: 'Copy client', icon: 'copy', run: () => copyText(c.from, 'Client address') }
        ]
      });
    } else if (kind === 'channel') {
      const ch = findChannel(id);
      if (!ch) return;
      openMenu(anchor, {
        title: `Channel ${ch.number}`,
        items: [
          { label: 'View channel', icon: 'channels', run: () => { location.hash = `#/channels/${encodeURIComponent(ch.id)}`; } },
          { label: 'Close channel', icon: 'close', danger: true, run: () => confirmCloseChannel(ch.id) },
          { sep: true },
          { label: 'Copy channel id', icon: 'copy', run: () => copyText(ch.id, 'Channel id') }
        ]
      });
    } else if (kind === 'user') {
      const u = findUser(id);
      if (!u) return;
      openMenu(anchor, {
        title: u.username,
        items: [
          { label: 'Copy username', icon: 'copy', run: () => copyText(u.username, 'Username') },
          { sep: true },
          { label: 'Delete user', icon: 'trash', danger: true, run: () => confirmDeleteUser(u.username) }
        ]
      });
    } else if (kind === 'policy') {
      const p = findPolicy(id);
      if (!p) return;
      openMenu(anchor, {
        title: p.name,
        items: [
          { label: 'Copy pattern', icon: 'copy', run: () => copyText(p.pattern, 'Pattern') },
          { sep: true },
          { label: 'Delete policy', icon: 'trash', danger: true, run: () => confirmDeletePolicy(p.name) }
        ]
      });
    } else if (kind === 'vhost') {
      const v = findVhost(id);
      if (!v) return;
      openMenu(anchor, {
        title: v.name,
        items: [
          { label: 'Copy name', icon: 'copy', run: () => copyText(v.name, 'Virtual host') },
          { sep: true },
          { label: 'Delete virtual host', icon: 'trash', danger: true, run: () => confirmDeleteVhost(v.name) }
        ]
      });
    } else if (kind === 'limit') {
      openMenu(anchor, {
        title: `Limits · ${id}`,
        items: [
          { label: 'Edit limits', icon: 'edit', run: () => openLimitForm(id) },
          { label: 'Copy vhost', icon: 'copy', run: () => copyText(id, 'Virtual host') }
        ]
      });
    }
  }

  /* ------------------------------------------------------------------ Palette */
  function openPalette() {
    if (activeModalEl) closeModal();
    closeMenu();
    state.palette.open = true;
    state.palette.query = '';
    state.palette.active = 0;
    lastFocused = document.activeElement;
    document.body.classList.add('modal-open');
    $('#overlay-root').innerHTML = `
      <div class="overlay overlay--palette" data-palette-overlay>
        <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
          <div class="palette__row">
            ${icon('search')}
            <input id="palette-input" class="palette__input" type="text" placeholder="Search queues, exchanges, pages or run a command…"
              autocomplete="off" spellcheck="false" aria-label="Search or run a command" />
            <kbd class="kbd">Esc</kbd>
          </div>
          <div class="palette__results" id="palette-results"></div>
          <div class="palette__foot">
            <span><kbd class="kbd kbd--tiny">↑</kbd><kbd class="kbd kbd--tiny">↓</kbd> navigate</span>
            <span><kbd class="kbd kbd--tiny">↵</kbd> open</span>
            <span class="spacer"></span>
            <span>Try <b class="cmd">/</b> commands</span>
          </div>
        </div>
      </div>`;
    renderPaletteResults();
    const input = $('#palette-input');
    if (input) {
      input.focus();
      input.addEventListener('input', () => {
        state.palette.query = input.value;
        state.palette.active = 0;
        renderPaletteResults();
      });
    }
  }
  function closePalette() {
    if (!state.palette.open) return;
    state.palette.open = false;
    const root = $('#overlay-root');
    if (root) root.innerHTML = '';
    if (!activeModalEl) document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  }

  function paletteItems(query) {
    const q = (query || '').trim().toLowerCase();
    const match = (...vals) => !q || vals.some(v => String(v).toLowerCase().includes(q));
    const items = [];
    const pages = [
      { label: 'Overview', sub: 'Cluster health and message rates', icon: 'overview', hash: '#/overview' },
      { label: 'Queues', sub: 'Ready, unacked, consumers and rates', icon: 'queues', hash: '#/queues' },
      { label: 'Exchanges', sub: 'Routing topology and bindings', icon: 'exchanges', hash: '#/exchanges' },
      { label: 'Connections', sub: 'Client connections and traffic', icon: 'connections', hash: '#/connections' },
      { label: 'Channels', sub: 'AMQP channels and prefetch', icon: 'channels', hash: '#/channels' },
      { label: 'Users', sub: 'Accounts, tags and permissions', icon: 'users', hash: '#/users' },
      { label: 'Virtual hosts', sub: 'Isolation domains', icon: 'vhosts', hash: '#/vhosts' },
      { label: 'Policies', sub: 'Pattern-based queue and exchange policy', icon: 'policies', hash: '#/policies' },
      { label: 'Feature flags', sub: 'Enable broker capabilities', icon: 'flags', hash: '#/flags' }
    ];
    pages.forEach(p => {
      if (match(p.label, p.sub)) items.push({ group: 'Jump to', ...p, hint: 'Page', run: () => { location.hash = p.hash; } });
    });
    const resources = [];
    db.queues.forEach(qq => resources.push({
      group: 'Resources', label: qq.name, sub: `${qq.vhost} · ${qq.type} queue`, icon: 'queues', hint: 'Queue',
      run: () => { location.hash = `#/queues/${encodeURIComponent(qq.name)}`; }
    }));
    db.exchanges.forEach(ex => resources.push({
      group: 'Resources', label: ex.name || '(default exchange)', sub: `${ex.vhost} · ${ex.type} exchange`, icon: 'exchanges', hint: 'Exchange',
      run: () => { location.hash = `#/exchanges/${encodeURIComponent(ex.name)}`; }
    }));
    db.connections.forEach(c => resources.push({
      group: 'Resources', label: c.name, sub: `from ${c.from} · ${c.user}`, icon: 'connections', hint: 'Connection',
      run: () => { location.hash = `#/connections/${encodeURIComponent(c.id)}`; }
    }));
    db.users.forEach(u => resources.push({
      group: 'Resources', label: u.username, sub: u.tags.join(', ') || 'no tags', icon: 'users', hint: 'User',
      run: () => { location.hash = '#/users'; }
    }));
    resources
      .filter(r => match(r.label, r.sub, r.hint))
      .slice(0, q ? 8 : 6)
      .forEach(r => items.push(r));
    const actions = [
      { label: 'Toggle theme', sub: state.theme === 'dark' ? 'Switch to light' : 'Switch to dark', icon: 'moon', hint: 'Action', run: () => setTheme(state.theme === 'dark' ? 'light' : 'dark') },
      { label: state.live ? 'Pause live updates' : 'Resume live updates', sub: 'Simulated metric stream', icon: state.live ? 'pause' : 'play', hint: 'Action', run: toggleLive },
      { label: 'Export definitions', sub: 'Download cluster topology as JSON', icon: 'download', hint: 'Action', run: exportDefinitions },
      { label: 'Keyboard shortcuts', sub: 'Help and cluster information', icon: 'help', hint: 'Action', run: openHelp }
    ];
    actions.filter(a => match(a.label, a.sub)).forEach(a => items.push({ group: 'Actions', ...a }));
    return items.slice(0, 22);
  }

  function highlight(label, query) {
    const q = (query || '').trim();
    if (!q) return esc(label);
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + '<mark>' + esc(label.slice(i, i + q.length)) + '</mark>' + esc(label.slice(i + q.length));
  }

  function renderPaletteResults() {
    const results = $('#palette-results');
    if (!results) return;
    const items = paletteItems(state.palette.query);
    state.palette.items = items;
    if (!items.length) {
      results.innerHTML = `<div class="palette__empty">No matches for “${esc(state.palette.query)}”.</div>`;
      return;
    }
    state.palette.active = Math.max(0, Math.min(state.palette.active, items.length - 1));
    let html = '';
    let group = '';
    items.forEach((it, idx) => {
      if (it.group !== group) {
        group = it.group;
        html += `<div class="palette__group">${esc(group)}</div>`;
      }
      html += `<button type="button" class="palette__item${idx === state.palette.active ? ' is-active' : ''}" data-palette-index="${idx}">
        ${icon(it.icon)}
        <span class="palette__label">${highlight(it.label, state.palette.query)}</span>
        <span class="palette__hint"><span class="cmd">${esc(it.hint)}</span></span>
      </button>`;
    });
    results.innerHTML = html;
    const active = results.querySelector('.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }
  function movePalette(delta) {
    const items = state.palette.items;
    if (!items.length) return;
    state.palette.active = (state.palette.active + delta + items.length) % items.length;
    renderPaletteResults();
  }
  function runPaletteItem(index) {
    const it = state.palette.items[index];
    if (!it) return;
    closePalette();
    setTimeout(() => { try { it.run(); } catch (e) { console.error(e); } }, 0);
  }

  /* ------------------------------------------------------------------ Modals */
  function openModal(o) {
    closeMenu();
    if (state.palette.open) closePalette();
    lastFocused = document.activeElement;
    const root = $('#overlay-root');
    root.innerHTML = `<div class="overlay" data-overlay>
      <div class="modal${o.size === 'lg' ? ' modal--lg' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal__head">
          ${o.icon ? `<div class="icon-badge${o.tone ? ' icon-badge--' + o.tone : ''}">${icon(o.icon)}</div>` : ''}
          <div>
            <div class="modal__title" id="modal-title">${o.title}</div>
            ${o.sub ? `<div class="modal__sub">${o.sub}</div>` : ''}
          </div>
          <button class="icon-btn" type="button" data-close aria-label="Close dialog">${icon('close')}</button>
        </div>
        <div class="modal__body">${o.body}</div>
        ${o.foot ? `<div class="modal__foot">${o.foot}</div>` : ''}
      </div>
    </div>`;
    activeModalEl = root.querySelector('.overlay');
    document.body.classList.add('modal-open');
    const overlay = activeModalEl;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
    setTimeout(() => {
      const f = overlay.querySelector('[autofocus]') || overlay.querySelector('input:not([type=hidden]), textarea, select, .modal__foot .btn--primary');
      if (f) f.focus({ preventScroll: true });
    }, 40);
  }
  function closeModal() {
    if (!activeModalEl) return;
    const root = $('#overlay-root');
    if (root) root.innerHTML = '';
    activeModalEl = null;
    if (!state.palette.open) document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  }

  function openConfirm(o) {
    openModal({
      title: o.title,
      sub: o.sub || '',
      icon: o.icon || 'alert',
      tone: o.tone || 'warn',
      body: `<div class="confirm-body">${o.body}</div>${o.note ? `<div class="danger-note">${o.note}</div>` : ''}`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>
        <button class="btn ${o.danger === false ? 'btn--primary' : 'btn--danger-solid'}" type="button" data-confirm>${esc(o.confirmLabel || 'Confirm')}</button>`
    });
    const btn = activeModalEl && activeModalEl.querySelector('[data-confirm]');
    if (btn) btn.addEventListener('click', () => {
      closeModal();
      try { o.onConfirm(); } catch (e) { console.error(e); showToast('Action failed', String(e.message || e), 'error'); }
    });
  }

  function openHelp() {
    openModal({
      title: 'Keyboard shortcuts',
      sub: `RabbitMQ ${db.cluster.version} · Qoder console`,
      icon: 'keyboard',
      body: `<div class="form-section">Navigation</div>
        <div class="shortcut-list">
          ${[['⌘K', 'Open command palette'], ['/', 'Search or jump to'], ['?', 'This help dialog'], ['Esc', 'Close overlay or menu']].map(([k, l]) =>
            `<div class="shortcut"><span>${esc(l)}</span><kbd class="kbd">${esc(k)}</kbd></div>`).join('')}
        </div>
        <div class="form-section">Console</div>
        <div class="shortcut-list">
          ${[['T', 'Toggle light / dark theme'], ['L', 'Pause or resume live metrics'], ['↑ ↓', 'Move through palette results'], ['↵', 'Open selected result']].map(([k, l]) =>
            `<div class="shortcut"><span>${esc(l)}</span><kbd class="kbd">${esc(k)}</kbd></div>`).join('')}
        </div>
        <div class="form-section">Cluster</div>
        <dl class="kv-list kv-list--flush">
          <div class="kv"><dt>Cluster</dt><dd class="mono">${esc(db.cluster.name)}</dd></div>
          <div class="kv"><dt>Node</dt><dd class="mono">${esc(db.cluster.node)}</dd></div>
          <div class="kv"><dt>Version</dt><dd class="mono">RabbitMQ ${esc(db.cluster.version)} · Erlang ${esc(db.cluster.erlang)}</dd></div>
          <div class="kv"><dt>Mode</dt><dd>Simulated management console — no broker is connected.</dd></div>
        </dl>`,
      foot: `<span class="foot-note">Qoder UI · warm monochrome</span><button class="btn btn--primary" type="button" data-close>Got it</button>`
    });
  }

  function openAccountMenu(anchor) {
    openMenu(anchor, {
      title: 'admin · administrator',
      items: [
        { label: 'Keyboard shortcuts', icon: 'keyboard', run: openHelp },
        { label: 'Toggle theme', icon: 'moon', run: () => setTheme(state.theme === 'dark' ? 'light' : 'dark') },
        { label: 'Export definitions', icon: 'download', run: exportDefinitions }
      ]
    });
  }

  /* ------------------------------------------------------------------ Actions */
  function handleAction(action, el) {
    switch (action) {
      case 'toggle-theme': setTheme(state.theme === 'dark' ? 'light' : 'dark'); break;
      case 'toggle-live': toggleLive(); break;
      case 'toggle-nav': toggleNav(); break;
      case 'help': openHelp(); break;
      case 'account': openAccountMenu(el); break;
      case 'export': exportDefinitions(); break;
      case 'refresh':
        simulateTick(true);
        renderCurrent();
        showToast('Statistics refreshed', 'Metrics pulled from all three nodes', 'info', 2400);
        break;
      case 'add-queue': openAddQueue(); break;
      case 'add-exchange': openAddExchange(); break;
      case 'add-user': openAddUser(); break;
      case 'add-vhost': openAddVhost(); break;
      case 'add-policy': openAddPolicy(); break;
      case 'publish': openPublish(el.dataset.kind, el.dataset.id, el.dataset.vhost); break;
      case 'purge-queue': confirmPurgeQueue(el.dataset.id); break;
      case 'delete-queue': confirmDeleteQueue(el.dataset.id); break;
      case 'delete-exchange': confirmDeleteExchange(el.dataset.id, el.dataset.vhost); break;
      case 'close-connection': confirmCloseConnection(el.dataset.id); break;
      case 'close-channel': confirmCloseChannel(el.dataset.id); break;
      case 'delete-user': confirmDeleteUser(el.dataset.id); break;
      case 'delete-policy': confirmDeletePolicy(el.dataset.id); break;
      case 'delete-vhost': confirmDeleteVhost(el.dataset.id); break;
      case 'edit-limit': openLimitForm(el.dataset.id); break;
      case 'enable-flag': confirmEnableFlag(el.dataset.id); break;
      case 'copy': copyText(el.dataset.copy, el.dataset.copyLabel || 'Value'); break;
      default: break;
    }
  }

  function copyText(text, label) {
    const done = () => showToast('Copied to clipboard', label, 'info', 2200);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { showToast('Copy failed', 'Clipboard access is unavailable', 'error'); }
    ta.remove();
  }

  function exportDefinitions() {
    const perms = buildPermissions();
    const payload = {
      rabbit_version: db.cluster.version,
      exported_at: new Date().toISOString(),
      source: 'qoder-rabbit',
      users: db.users.map(u => ({ name: u.username, tags: u.tags, hashing_algorithm: u.hash })),
      vhosts: db.vhosts.map(v => ({ name: v.name, description: v.description, tracing: v.tracing })),
      permissions: perms,
      policies: db.policies,
      queues: db.queues.map(q => ({ name: q.name, vhost: q.vhost, durable: q.durable, auto_delete: q.autoDelete, arguments: q.args, type: q.type })),
      exchanges: db.exchanges,
      bindings: db.bindings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qoder-rabbit-definitions.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logEvent('info', 'Definitions exported', `${db.queues.length} queues · ${db.exchanges.length} exchanges`);
    showToast('Definitions exported', 'qoder-rabbit-definitions.json', 'info');
  }

  function logEvent(type, title, detail) {
    db.events.unshift({ type, title, detail, time: Date.now() });
    db.events = db.events.slice(0, 8);
  }

  function samplePayload(name = '') {
    const now = new Date().toISOString();
    if (name.startsWith('orders')) return JSON.stringify({
      event: 'order.created', order_id: 'ord_9F2C41', customer_id: 'cus_10482',
      amount: 129.5, currency: 'USD', items: [{ sku: 'QM-14', quantity: 2 }], occurred_at: now
    }, null, 2);
    if (name.startsWith('payments')) return JSON.stringify({
      event: 'payment.authorized', payment_id: 'pay_51A0D2', order_id: 'ord_9F2C41',
      amount: 129.5, currency: 'USD', provider: 'stripe', occurred_at: now
    }, null, 2);
    if (name.startsWith('notifications')) return JSON.stringify({
      channel: 'email', template: 'order_confirmation', to: 'ada@example.com',
      subject: 'Your order is on the way', occurred_at: now
    }, null, 2);
    return JSON.stringify({ message: 'Hello from the Qoder console', queue: name || 'demo', published_at: now }, null, 2);
  }

  function openPublish(kind, id, vhost) {
    let target, routeField = '';
    if (kind === 'queue') {
      const q = findQueue(id);
      if (!q) return showToast('Queue not found', id, 'error');
      target = `<div class="pub-target"><span class="pub-target__icon">${icon('queues')}</span>
        <div><div class="pub-target__name">${esc(q.name)}</div>
        <div class="pub-target__meta">${esc(q.vhost)} · ${esc(q.type)} queue</div></div>
        <span class="chip">Direct</span></div>`;
    } else {
      const ex = findExchange(id, vhost);
      if (!ex) return showToast('Exchange not found', id || 'default exchange', 'error');
      target = `<div class="pub-target"><span class="pub-target__icon">${icon('exchanges')}</span>
        <div><div class="pub-target__name">${esc(ex.name || '(default exchange)')}</div>
        <div class="pub-target__meta">${esc(ex.vhost)} · ${esc(ex.type)} exchange</div></div>
        <span class="chip">Routed</span></div>`;
      routeField = `<div class="field">
        <label class="field__label" for="pub-rk">Routing key <span>required for direct / topic</span></label>
        <input class="input input-mono" id="pub-rk" name="routingKey" value="${esc(kind === 'queue' ? id : '')}" placeholder="e.g. orders.created" autofocus />
      </div>`;
    }
    openModal({
      title: 'Publish message',
      sub: kind === 'queue' ? 'Deliver one message directly to this queue' : 'Route one message through this exchange',
      icon: 'send',
      size: 'lg',
      body: `<form id="modal-form" data-form="publish" data-kind="${kind}" data-id="${esc(id)}" data-vhost="${esc(vhost || '')}">
        <div class="field">
          <div class="field__label">Destination</div>
          ${target}
        </div>
        ${routeField}
        <div class="field__row">
          <div class="field">
            <label class="field__label" for="pub-delivery">Delivery mode</label>
            <div class="select-wrap"><select id="pub-delivery" name="deliveryMode">
              <option value="2">2 · Persistent</option>
              <option value="1">1 · Transient</option>
            </select>${icon('chevronDown')}</div>
          </div>
          <div class="field">
            <label class="field__label" for="pub-priority">Priority</label>
            <input class="input input-mono" id="pub-priority" name="priority" value="0" inputmode="numeric" />
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="pub-headers">Headers <span>JSON</span></label>
          <textarea class="input input-mono" id="pub-headers" name="headers" rows="4" spellcheck="false">{
  "content-type": "application/json",
  "x-source": "qoder-console"
}</textarea>
        </div>
        <div class="field">
          <label class="field__label" for="pub-payload">Payload <span>UTF-8 text</span></label>
          <textarea class="input code-input" id="pub-payload" name="payload" spellcheck="false">${esc(samplePayload(kind === 'queue' ? id : ''))}</textarea>
        </div>
      </form>`,
      foot: `<span class="foot-note">One message · ${kind === 'queue' ? 'queue delivery' : 'exchange routing'}</span>
        <button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">${icon('send')} Publish message</button>`
    });
  }

  function topicMatch(pattern, key) {
    const p = pattern.split('.'), k = key.split('.');
    const walk = (i, j) => {
      if (i === p.length) return j === k.length;
      if (p[i] === '#') return walk(i + 1, j) || (j < k.length && walk(i, j + 1));
      if (j >= k.length) return false;
      if (p[i] !== '*' && p[i] !== k[j]) return false;
      return walk(i + 1, j + 1);
    };
    return walk(0, 0);
  }

  function confirmPurgeQueue(name) {
    const q = findQueue(name);
    if (!q) return;
    if (q.ready === 0) return showToast('Queue is already empty', `${name} has no ready messages`, 'info');
    openConfirm({
      title: 'Purge queue?',
      sub: `${q.vhost} · ${q.name}`,
      icon: 'purge',
      body: `<p>This will discard all <strong>${fmtInt(q.ready)}</strong> ready messages in
        <span class="mono">${esc(name)}</span>. Unacknowledged messages and consumers are not affected.</p>`,
      note: 'Purged messages cannot be recovered.',
      confirmLabel: 'Purge messages',
      onConfirm: () => {
        const removed = q.ready;
        q.ready = 0;
        logEvent('warn', 'Queue purged', `${fmtInt(removed)} messages removed from ${name}`);
        renderCurrent();
        showToast('Queue purged', `${fmtInt(removed)} messages removed from ${name}`, 'warn');
      }
    });
  }

  function confirmDeleteQueue(name) {
    const q = findQueue(name);
    if (!q) return;
    openConfirm({
      title: 'Delete queue?',
      sub: `${q.vhost} · ${q.name}`,
      icon: 'trash',
      tone: 'danger',
      body: `<p>Queue <span class="mono">${esc(name)}</span> has
        <strong>${fmtInt(q.ready + q.unacked)}</strong> messages,
        <strong>${q.consumers}</strong> consumers and
        <strong>${bindingsForQueue(q).length}</strong> bindings. Everything will be removed immediately.</p>`,
      note: 'This action cannot be undone.',
      confirmLabel: 'Delete queue',
      onConfirm: () => {
        db.consumers = db.consumers.filter(c => c.queue !== name);
        db.bindings = db.bindings.filter(b => !(b.destination === name && b.destType === 'queue'));
        db.queues = db.queues.filter(x => x.name !== name);
        logEvent('warn', 'Queue deleted', `${name} removed from ${q.vhost}`);
        if (state.route && state.route.view === 'queue') location.hash = '#/queues';
        else renderCurrent();
        showToast('Queue deleted', name, 'warn');
      }
    });
  }

  function confirmDeleteExchange(name, vhost) {
    const ex = findExchange(name, vhost);
    if (!ex) return;
    if (!ex.name || ex.name.startsWith('amq.')) return showToast('System exchange', 'Default and amq.* exchanges cannot be deleted', 'error');
    const bound = bindingsForExchange(ex).length;
    openConfirm({
      title: 'Delete exchange?',
      sub: `${ex.vhost} · ${ex.name}`,
      icon: 'trash',
      tone: 'danger',
      body: `<p>Exchange <span class="mono">${esc(ex.name)}</span> has <strong>${bound}</strong> bindings.
        Messages routed after deletion will be lost unless an alternate exchange is configured.</p>`,
      note: 'This action cannot be undone.',
      confirmLabel: 'Delete exchange',
      onConfirm: () => {
        db.bindings = db.bindings.filter(b => !(b.source === ex.name && b.vhost === ex.vhost));
        db.exchanges = db.exchanges.filter(e => !(e.name === ex.name && e.vhost === ex.vhost));
        logEvent('warn', 'Exchange deleted', `${ex.name} removed from ${ex.vhost}`);
        location.hash = '#/exchanges';
        if (state.route.view !== 'exchange') renderCurrent();
        showToast('Exchange deleted', ex.name, 'warn');
      }
    });
  }

  function confirmCloseConnection(id) {
    const c = findConnection(id);
    if (!c) return;
    if (c.name === 'management-ui') return showToast('Connection is in use', 'You cannot close the connection serving this console', 'error');
    const chans = db.channels.filter(ch => ch.connection === id);
    const cons = db.consumers.filter(co => co.connection === id);
    openConfirm({
      title: 'Close connection?',
      sub: `${c.user} · ${c.vhost}`,
      icon: 'close',
      tone: 'danger',
      body: `<p>Close <span class="mono">${esc(c.name)}</span> from
        <span class="mono">${esc(c.from)}</span>? Its <strong>${chans.length}</strong> channels and
        <strong>${cons.length}</strong> consumers will be closed.</p>`,
      note: 'Clients may reconnect automatically.',
      confirmLabel: 'Close connection',
      onConfirm: () => {
        cons.forEach(co => {
          const q = findQueue(co.queue);
          if (q) q.consumers = Math.max(0, q.consumers - 1);
        });
        db.consumers = db.consumers.filter(co => co.connection !== id);
        db.channels = db.channels.filter(ch => ch.connection !== id);
        db.connections = db.connections.filter(x => x.id !== id);
        logEvent('warn', 'Connection closed', `${c.name} (${c.from})`);
        if (state.route.view === 'connection') location.hash = '#/connections';
        else renderCurrent();
        showToast('Connection closed', c.name, 'warn');
      }
    });
  }

  function confirmCloseChannel(id) {
    const ch = findChannel(id);
    if (!ch) return;
    const cons = db.consumers.filter(co => co.channel === id);
    openConfirm({
      title: 'Close channel?',
      sub: `Channel ${ch.number} · ${ch.user}`,
      icon: 'close',
      tone: 'danger',
      body: `<p>Close channel <span class="mono">${esc(ch.id)}</span> on connection
        <span class="mono">${esc(ch.connection)}</span>? <strong>${cons.length}</strong> consumers will stop.</p>`,
      confirmLabel: 'Close channel',
      onConfirm: () => {
        cons.forEach(co => {
          const q = findQueue(co.queue);
          if (q) q.consumers = Math.max(0, q.consumers - 1);
        });
        db.consumers = db.consumers.filter(co => co.channel !== id);
        db.channels = db.channels.filter(x => x.id !== id);
        const conn = findConnection(ch.connection);
        if (conn) conn.channels = db.channels.filter(x => x.connection === conn.id).length;
        logEvent('warn', 'Channel closed', `Channel ${ch.number} on ${ch.connection}`);
        if (state.route.view === 'channel') location.hash = '#/channels';
        else renderCurrent();
        showToast('Channel closed', `#${ch.number} on ${ch.connection}`, 'warn');
      }
    });
  }

  function confirmDeleteUser(username) {
    if (username === 'admin') return showToast('Cannot delete admin', 'The signed-in account cannot be removed', 'error');
    const u = findUser(username);
    if (!u) return;
    openConfirm({
      title: 'Delete user?',
      sub: u.tags.join(', ') || 'no tags',
      icon: 'trash',
      tone: 'danger',
      body: `<p>Delete user <span class="mono">${esc(username)}</span>? Existing connections will not be closed, but credentials can no longer authenticate.</p>`,
      confirmLabel: 'Delete user',
      onConfirm: () => {
        db.users = db.users.filter(x => x.username !== username);
        logEvent('warn', 'User deleted', username);
        renderCurrent();
        showToast('User deleted', username, 'warn');
      }
    });
  }

  function confirmDeletePolicy(name) {
    const p = findPolicy(name);
    if (!p) return;
    openConfirm({
      title: 'Delete policy?',
      sub: `${p.vhost} · ${p.pattern}`,
      icon: 'trash',
      tone: 'danger',
      body: `<p>Removing <span class="mono">${esc(name)}</span> will unapply its definition from all matching queues and exchanges.</p>`,
      confirmLabel: 'Delete policy',
      onConfirm: () => {
        db.policies = db.policies.filter(x => x.name !== name);
        db.queues.forEach(q => { if (q.policy === name) q.policy = null; });
        logEvent('info', 'Policy deleted', name);
        renderCurrent();
        showToast('Policy deleted', name, 'warn');
      }
    });
  }

  function confirmDeleteVhost(name) {
    if (name === '/') return showToast('Cannot delete default vhost', 'The default virtual host is protected in this demo', 'error');
    const v = findVhost(name);
    if (!v) return;
    const stats = getVhostStats(name);
    openConfirm({
      title: 'Delete virtual host?',
      sub: name,
      icon: 'trash',
      tone: 'danger',
      body: `<p>Delete <span class="mono">${esc(name)}</span> and everything inside it —
        <strong>${stats.queues}</strong> queues, <strong>${stats.exchanges}</strong> exchanges,
        <strong>${stats.connections}</strong> connections and related policies.</p>`,
      note: 'This action cannot be undone.',
      confirmLabel: 'Delete virtual host',
      onConfirm: () => {
        const qNames = db.queues.filter(q => q.vhost === name).map(q => q.name);
        const connIds = db.connections.filter(c => c.vhost === name).map(c => c.id);
        db.queues = db.queues.filter(q => q.vhost !== name);
        db.exchanges = db.exchanges.filter(e => e.vhost !== name);
        db.bindings = db.bindings.filter(b => b.vhost !== name);
        db.policies = db.policies.filter(p => p.vhost !== name);
        db.limits = db.limits.filter(l => l.vhost !== name);
        db.connections = db.connections.filter(c => c.vhost !== name);
        db.channels = db.channels.filter(c => !connIds.includes(c.connection));
        db.consumers = db.consumers.filter(c => !qNames.includes(c.queue));
        db.vhosts = db.vhosts.filter(x => x.name !== name);
        logEvent('warn', 'Virtual host deleted', name);
        renderCurrent();
        showToast('Virtual host deleted', name, 'warn');
      }
    });
  }

  function confirmEnableFlag(flagName) {
    const flag = db.flags.find(f => f.name === flagName);
    if (!flag || flag.enabled) return;
    openConfirm({
      title: `Enable ${flag.name}?`,
      sub: `${flag.stability} feature flag`,
      icon: 'zap',
      danger: false,
      body: `<p>${esc(flag.desc)}. Enabling a feature flag is a cluster-wide operation and cannot be disabled while the broker is running.</p>`,
      note: flag.stability === 'experimental' ? 'This flag is experimental. Test it outside production first.' : '',
      confirmLabel: 'Enable flag',
      onConfirm: () => {
        flag.enabled = true;
        logEvent('ok', 'Feature flag enabled', flag.name);
        renderCurrent();
        showToast('Feature flag enabled', flag.name);
      }
    });
  }

  function openAddQueue() {
    openModal({
      title: 'Declare a queue',
      sub: 'Create a durable or transient queue in a virtual host',
      icon: 'queues',
      body: `<form id="modal-form" data-form="add-queue">
        <div class="field">
          <label class="field__label" for="q-name">Name</label>
          <input class="input input-mono" id="q-name" name="name" placeholder="orders.created" autofocus required />
          <div class="field__hint">Dots and hyphens are common; the name must be unique within the virtual host.</div>
        </div>
        <div class="field__row">
          <div class="field">
            <label class="field__label" for="q-vhost">Virtual host</label>
            <div class="select-wrap"><select id="q-vhost" name="vhost">${db.vhosts.map(v => `<option value="${esc(v.name)}">${esc(v.name)}</option>`).join('')}</select>${icon('chevronDown')}</div>
          </div>
          <div class="field">
            <label class="field__label" for="q-type">Type</label>
            <div class="select-wrap"><select id="q-type" name="type"><option value="classic">Classic</option><option value="quorum">Quorum</option><option value="stream">Stream</option></select>${icon('chevronDown')}</div>
          </div>
        </div>
        <div class="field">
          <div class="check-row"><input type="checkbox" id="q-durable" name="durable" checked /><label for="q-durable">Durable — survive broker restart</label></div>
        </div>
        <div class="field">
          <div class="check-row"><input type="checkbox" id="q-auto" name="autoDelete" /><label for="q-auto">Auto-delete — remove when the last consumer disconnects</label></div>
        </div>
        <div class="field">
          <label class="field__label" for="q-args">Arguments <span>JSON, optional</span></label>
          <textarea class="input input-mono" id="q-args" name="args" rows="3" spellcheck="false">{
  "x-max-length": 100000
}</textarea>
        </div>
      </form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">${icon('plus')} Declare queue</button>`
    });
  }

  function openAddExchange() {
    openModal({
      title: 'Declare an exchange',
      sub: 'Add a routing exchange to a virtual host',
      icon: 'exchanges',
      body: `<form id="modal-form" data-form="add-exchange">
        <div class="field">
          <label class="field__label" for="ex-name">Name</label>
          <input class="input input-mono" id="ex-name" name="name" placeholder="orders.retry" autofocus required />
        </div>
        <div class="field__row">
          <div class="field">
            <label class="field__label" for="ex-vhost">Virtual host</label>
            <div class="select-wrap"><select id="ex-vhost" name="vhost">${db.vhosts.map(v => `<option value="${esc(v.name)}">${esc(v.name)}</option>`).join('')}</select>${icon('chevronDown')}</div>
          </div>
          <div class="field">
            <label class="field__label" for="ex-type">Type</label>
            <div class="select-wrap"><select id="ex-type" name="type"><option>direct</option><option>topic</option><option>fanout</option><option>headers</option></select>${icon('chevronDown')}</div>
          </div>
        </div>
        <div class="field">
          <div class="check-row"><input type="checkbox" id="ex-durable" name="durable" checked /><label for="ex-durable">Durable — survive broker restart</label></div>
        </div>
        <div class="field">
          <label class="field__label" for="ex-args">Arguments <span>JSON, optional</span></label>
          <textarea class="input input-mono" id="ex-args" name="args" rows="2" spellcheck="false">{}</textarea>
        </div>
      </form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">${icon('plus')} Declare exchange</button>`
    });
  }

  function openAddUser() {
    openModal({
      title: 'Add a user',
      sub: 'Create credentials and assign tags',
      icon: 'userPlus',
      body: `<form id="modal-form" data-form="add-user">
        <div class="field">
          <label class="field__label" for="u-name">Username</label>
          <input class="input input-mono" id="u-name" name="username" placeholder="e.g. report-worker" autofocus required />
        </div>
        <div class="field">
          <label class="field__label" for="u-pass">Password</label>
          <input class="input" id="u-pass" name="password" type="password" placeholder="At least 4 characters" required minlength="4" />
          <div class="field__hint">Stored using rabbit_password_hashing_sha256.</div>
        </div>
        <div class="field">
          <div class="field__label">Tags</div>
          <div class="tag-choices">
            ${[['management', 'Access the management UI'], ['monitoring', 'Read-only metrics'], ['policymaker', 'Create policies'], ['administrator', 'Full control']].map(([tag, desc]) =>
              `<label class="tag-choice"><input type="checkbox" name="tags" value="${tag}" /><span><b>${tag}</b><small>${desc}</small></span></label>`).join('')}
          </div>
        </div>
      </form>`,
      foot: `<span class="foot-note">Permissions are granted per virtual host.</span>
        <button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">${icon('userPlus')} Add user</button>`
    });
  }

  function openAddVhost() {
    openModal({
      title: 'Add a virtual host',
      sub: 'Isolate exchanges, queues and permissions',
      icon: 'vhosts',
      body: `<form id="modal-form" data-form="add-vhost">
        <div class="field">
          <label class="field__label" for="v-name">Name</label>
          <input class="input input-mono" id="v-name" name="name" placeholder="e.g. reporting" autofocus required />
        </div>
        <div class="field">
          <label class="field__label" for="v-desc">Description</label>
          <input class="input" id="v-desc" name="description" placeholder="What runs in this virtual host?" />
        </div>
        <div class="field">
          <div class="check-row"><input type="checkbox" id="v-trace" name="tracing" /><label for="v-trace">Enable message tracing</label></div>
        </div>
      </form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">${icon('plus')} Add virtual host</button>`
    });
  }

  function openAddPolicy() {
    openModal({
      title: 'Add a policy',
      sub: 'Apply a definition to matching queues or exchanges',
      icon: 'policies',
      size: 'lg',
      body: `<form id="modal-form" data-form="add-policy">
        <div class="field__row">
          <div class="field">
            <label class="field__label" for="p-name">Name</label>
            <input class="input input-mono" id="p-name" name="name" placeholder="ttl-orders" autofocus required />
          </div>
          <div class="field">
            <label class="field__label" for="p-vhost">Virtual host</label>
            <div class="select-wrap"><select id="p-vhost" name="vhost">${db.vhosts.map(v => `<option value="${esc(v.name)}">${esc(v.name)}</option>`).join('')}</select>${icon('chevronDown')}</div>
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="p-pattern">Pattern <span>regular expression</span></label>
          <input class="input input-mono" id="p-pattern" name="pattern" value="^orders\\." required />
        </div>
        <div class="field__row">
          <div class="field">
            <label class="field__label" for="p-apply">Apply to</label>
            <div class="select-wrap"><select id="p-apply" name="applyTo"><option value="queues">Queues</option><option value="exchanges">Exchanges</option><option value="all">All</option></select>${icon('chevronDown')}</div>
          </div>
          <div class="field">
            <label class="field__label" for="p-priority">Priority</label>
            <input class="input input-mono" id="p-priority" name="priority" value="0" inputmode="numeric" />
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="p-def">Definition <span>JSON</span></label>
          <textarea class="input input-mono code-input" id="p-def" name="definition" spellcheck="false">{
  "max-length": 10000,
  "overflow": "reject-publish"
}</textarea>
        </div>
      </form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">${icon('plus')} Add policy</button>`
    });
  }

  function openLimitForm(vhost) {
    const limit = db.limits.find(l => l.vhost === vhost);
    if (!limit) return;
    openModal({
      title: 'Edit limits',
      sub: `Virtual host ${vhost}`,
      icon: 'limits',
      body: `<form id="modal-form" data-form="edit-limit" data-vhost="${esc(vhost)}">
        <div class="field">
          <label class="field__label" for="l-conn">Max connections</label>
          <input class="input input-mono" id="l-conn" name="maxConnections" value="${limit.maxConnections}" inputmode="numeric" required autofocus />
        </div>
        <div class="field">
          <label class="field__label" for="l-queue">Max queues</label>
          <input class="input input-mono" id="l-queue" name="maxQueues" value="${limit.maxQueues}" inputmode="numeric" required />
        </div>
        <div class="callout">${icon('info')}<div>Limits are enforced by the broker. Existing resources above the limit are not removed.</div></div>
      </form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>
        <button class="btn btn--primary" type="submit" form="modal-form">Save limits</button>`
    });
  }

  /* ------------------------------------------------------------ Form handlers */
  const FORM_HANDLERS = {
    publish(form) {
      const kind = form.dataset.kind;
      const id = form.dataset.id;
      const vhost = form.dataset.vhost;
      const fd = new FormData(form);
      let headers;
      try {
        headers = JSON.parse(String(fd.get('headers') || '{}'));
        if (headers === null || typeof headers !== 'object' || Array.isArray(headers)) throw new Error('Headers must be a JSON object');
      } catch (e) {
        return showToast('Invalid headers', 'Headers must be valid JSON: ' + e.message, 'error');
      }
      const payload = String(fd.get('payload') || '');
      if (!payload.trim()) return showToast('Payload required', 'Add a message body before publishing.', 'error');
      const routingKey = String(fd.get('routingKey') || '');
      let routed = 0;
      let targetLabel = id;
      if (kind === 'queue') {
        const q = findQueue(id);
        if (!q) return showToast('Queue not found', id, 'error');
        q.ready += 1;
        q.publishRate = round1(q.publishRate + 0.4);
        routed = 1;
        targetLabel = q.name;
      } else {
        const ex = findExchange(id, vhost);
        if (!ex) return showToast('Exchange not found', id, 'error');
        let targets = db.bindings.filter(b => b.vhost === ex.vhost && b.source === ex.name && b.destType === 'queue');
        if (ex.type === 'direct' || !ex.name) targets = targets.filter(b => b.routingKey === routingKey);
        else if (ex.type === 'topic') targets = targets.filter(b => topicMatch(b.routingKey, routingKey));
        else if (ex.type === 'headers') targets = [];
        targets.forEach(b => {
          const q = findQueue(b.destination);
          if (q) { q.ready += 1; q.publishRate = round1(q.publishRate + 0.4); routed++; }
        });
        ex.publishRate = round1(ex.publishRate + 0.6);
        targetLabel = ex.name || '(default exchange)';
      }
      closeModal();
      logEvent('info', 'Message published', `${payload.length} bytes → ${targetLabel}`);
      renderCurrent();
      if (kind === 'exchange' && routed === 0) {
        showToast('Published, unrouted', `No bindings matched routing key “${routingKey}”`, 'warn');
      } else {
        showToast('Message published', `${payload.length} bytes · ${routed} queue${routed === 1 ? '' : 's'} via ${targetLabel}`);
      }
    },

    'add-queue'(form) {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const vhost = String(fd.get('vhost'));
      const type = String(fd.get('type') || 'classic');
      if (!name) return showToast('Name required', 'Enter a queue name.', 'error');
      if (!/^[A-Za-z0-9._:-]+$/.test(name)) return showToast('Invalid name', 'Use letters, numbers, dots, underscores, colons or hyphens.', 'error');
      if (findQueue(name)) return showToast('Queue already exists', name, 'error');
      let args = {};
      try {
        args = JSON.parse(String(fd.get('args') || '{}')) || {};
        if (Array.isArray(args) || typeof args !== 'object') throw new Error('Arguments must be an object');
      } catch (e) {
        return showToast('Invalid arguments', e.message, 'error');
      }
      if (type === 'quorum') args['x-queue-type'] = 'quorum';
      if (type === 'stream') args['x-queue-type'] = 'stream';
      db.queues.push({
        name, vhost, type,
        durable: fd.get('durable') === 'on',
        autoDelete: fd.get('autoDelete') === 'on',
        exclusive: false, state: 'idle', ready: 0, unacked: 0, consumers: 0,
        publishRate: 0, deliverRate: 0, ackRate: 0, redelivered: 0, memory: 0.1,
        policy: null, args, created: Date.now()
      });
      closeModal();
      logEvent('ok', 'Queue declared', `${name} created in ${vhost}`);
      showToast('Queue declared', `${name} in ${vhost}`);
      location.hash = `#/queues/${encodeURIComponent(name)}`;
      setTimeout(() => { if (state.route && state.route.view === 'queue' && state.route.id === name) renderCurrent(); }, 0);
    },

    'add-exchange'(form) {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const vhost = String(fd.get('vhost'));
      const type = String(fd.get('type') || 'direct');
      if (!name) return showToast('Name required', 'Enter an exchange name.', 'error');
      if (!/^[A-Za-z0-9._:-]+$/.test(name)) return showToast('Invalid name', 'Use letters, numbers, dots, underscores, colons or hyphens.', 'error');
      if (findExchange(name, vhost)) return showToast('Exchange already exists', `${name} in ${vhost}`, 'error');
      let args = {};
      try {
        args = JSON.parse(String(fd.get('args') || '{}')) || {};
        if (Array.isArray(args) || typeof args !== 'object') throw new Error('Arguments must be an object');
      } catch (e) {
        return showToast('Invalid arguments', e.message, 'error');
      }
      db.exchanges.push({ name, vhost, type, durable: fd.get('durable') === 'on', autoDelete: false, internal: false, publishRate: 0, deliverRate: 0, args });
      closeModal();
      logEvent('ok', 'Exchange declared', `${name} (${type}) in ${vhost}`);
      showToast('Exchange declared', `${name} in ${vhost}`);
      location.hash = `#/exchanges/${encodeURIComponent(name)}`;
    },

    'add-user'(form) {
      const fd = new FormData(form);
      const username = String(fd.get('username') || '').trim();
      const tags = fd.getAll('tags').map(String);
      if (!username) return showToast('Username required', 'Enter a username.', 'error');
      if (!/^[A-Za-z0-9._-]+$/.test(username)) return showToast('Invalid username', 'Use letters, numbers, dots, underscores or hyphens.', 'error');
      if (findUser(username)) return showToast('User already exists', username, 'error');
      db.users.push({ username, tags, vhosts: ['/'], hash: 'rabbit_password_hashing_sha256' });
      closeModal();
      logEvent('ok', 'User created', `${username} with ${tags.length} tag${tags.length === 1 ? '' : 's'}`);
      renderCurrent();
      showToast('User added', `${username} · ${tags.join(', ') || 'no tags'}`);
    },

    'add-vhost'(form) {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      if (!name) return showToast('Name required', 'Enter a virtual host name.', 'error');
      if (!/^[A-Za-z0-9._:/-]+$/.test(name)) return showToast('Invalid name', 'Use letters, numbers, dots, underscores, colons, slashes or hyphens.', 'error');
      if (findVhost(name)) return showToast('Virtual host exists', name, 'error');
      db.vhosts.push({ name, description: String(fd.get('description') || ''), tracing: fd.get('tracing') === 'on' });
      closeModal();
      logEvent('ok', 'Virtual host created', name);
      renderCurrent();
      showToast('Virtual host added', name);
    },

    'add-policy'(form) {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const vhost = String(fd.get('vhost'));
      const pattern = String(fd.get('pattern') || '').trim();
      const applyTo = String(fd.get('applyTo') || 'queues');
      const priority = Number(fd.get('priority')) || 0;
      if (!name) return showToast('Name required', 'Enter a policy name.', 'error');
      if (!pattern) return showToast('Pattern required', 'Enter a regular expression.', 'error');
      if (db.policies.some(p => p.name === name && p.vhost === vhost)) return showToast('Policy already exists', name, 'error');
      let definition;
      try {
        definition = JSON.parse(String(fd.get('definition') || '{}'));
        if (!definition || typeof definition !== 'object' || Array.isArray(definition)) throw new Error('Definition must be a JSON object');
      } catch (e) {
        return showToast('Invalid definition', e.message, 'error');
      }
      db.policies.push({ name, vhost, pattern, applyTo, priority, definition });
      closeModal();
      logEvent('ok', 'Policy created', `${name} · ${pattern}`);
      renderCurrent();
      showToast('Policy added', `${name} applies to ${applyTo}`);
    },

    'edit-limit'(form) {
      const fd = new FormData(form);
      const vhost = form.dataset.vhost;
      const limit = db.limits.find(l => l.vhost === vhost);
      if (!limit) return;
      const mc = Number(fd.get('maxConnections'));
      const mq = Number(fd.get('maxQueues'));
      if (!Number.isFinite(mc) || mc < 1) return showToast('Invalid connection limit', 'Use a positive whole number.', 'error');
      if (!Number.isFinite(mq) || mq < 1) return showToast('Invalid queue limit', 'Use a positive whole number.', 'error');
      limit.maxConnections = Math.round(mc);
      limit.maxQueues = Math.round(mq);
      closeModal();
      logEvent('info', 'Limits updated', `${vhost}: ${limit.maxConnections} connections · ${limit.maxQueues} queues`);
      renderCurrent();
      showToast('Limits updated', vhost);
    }
  };

  /* ------------------------------------------------------------------- Events */
  function onDocumentClick(e) {
    if (e.target.id === 'nav-scrim') { closeNav(); return; }
    if (e.target.closest('.sidebar [data-nav]') || e.target.closest('.sidebar a[href^="#/"]')) closeNav();
    if (state.palette.open) {
      if (e.target.matches('[data-palette-overlay]')) { closePalette(); return; }
      const p = e.target.closest('[data-palette-index]');
      if (p) { runPaletteItem(Number(p.dataset.paletteIndex)); return; }
    }
    if (state.menuOpen) {
      const m = e.target.closest('[data-menu-index]');
      if (m) {
        const item = state.menuItems[Number(m.dataset.menuIndex)];
        closeMenu();
        if (item && item.run) item.run();
        return;
      }
      if (!e.target.closest('.popmenu')) closeMenu();
    }
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    if (e.target.closest('[data-open-palette]')) { e.preventDefault(); openPalette(); return; }
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) { e.preventDefault(); handleAction(actionEl.dataset.action, actionEl); return; }
    const menuBtn = e.target.closest('[data-menu-kind]');
    if (menuBtn) { e.preventDefault(); openEntityMenu(menuBtn.dataset.menuKind, menuBtn.dataset.menuId, menuBtn); return; }
    const sortEl = e.target.closest('[data-sort]');
    if (sortEl) {
      const [view, key] = sortEl.dataset.sort.split(':');
      const s = state.sort[view];
      if (!s) return;
      if (s.key === key) s.dir = -s.dir;
      else { s.key = key; s.dir = 1; }
      state.page[view] = 1;
      renderListRegion(view);
      return;
    }
    const pageEl = e.target.closest('[data-page-go]');
    if (pageEl) {
      const view = state.route && state.route.view;
      state.page[view] = Number(pageEl.dataset.pageGo);
      renderListRegion(view);
      return;
    }
    const tabEl = e.target.closest('[data-tab]');
    if (tabEl) {
      const key = state.route && state.route.view;
      if (key) state.detailTab[key] = tabEl.dataset.tab;
      renderCurrent();
      return;
    }
    const rangeEl = e.target.closest('[data-range-value]');
    if (rangeEl) {
      state.range[rangeEl.dataset.rangeKey] = rangeEl.dataset.rangeValue;
      renderCurrent();
      return;
    }
    const legendEl = e.target.closest('[data-legend-toggle]');
    if (legendEl) {
      const [chartId, seriesKey] = legendEl.dataset.legendToggle.split(':');
      const chart = state.charts.find(c => c.id === chartId);
      if (chart) chart.toggle(seriesKey);
      return;
    }
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a,button,input,select,textarea')) {
      location.hash = row.dataset.href;
    }
  }

  function onInput(e) {
    if (e.target.id === 'palette-input') return;
    const f = e.target.closest('[data-filter]');
    if (!f) return;
    const [view, key] = f.dataset.filter.split(':');
    if (!state.filters[view]) return;
    state.filters[view][key] = f.value;
    if (state.page[view] != null) state.page[view] = 1;
    renderListRegion(view);
  }
  function onChange(e) {
    const f = e.target.closest('[data-filter]');
    if (f) {
      const [view, key] = f.dataset.filter.split(':');
      if (state.filters[view]) {
        state.filters[view][key] = f.value;
        state.page[view] = 1;
        renderListRegion(view);
      }
      return;
    }
    if (e.target.matches('[data-page-size]')) {
      state.pageSize = Number(e.target.value) || 10;
      Object.keys(state.page).forEach(k => { state.page[k] = 1; });
      const view = state.route && state.route.view;
      if (window.RMViews && window.RMViews.regions[view]) renderListRegion(view);
    }
  }
  function onSubmit(e) {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const handler = FORM_HANDLERS[form.dataset.form];
    if (handler) handler(form);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (state.palette.open) { e.preventDefault(); closePalette(); return; }
      if (state.menuOpen) { closeMenu(); return; }
      if (activeModalEl) { e.preventDefault(); closeModal(); return; }
      if (document.body.classList.contains('nav-open')) { closeNav(); return; }
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      state.palette.open ? closePalette() : openPalette();
      return;
    }
    if (state.palette.open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); movePalette(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); movePalette(-1); return; }
      if (e.key === 'Enter') { e.preventDefault(); runPaletteItem(state.palette.active); return; }
      return;
    }
    if (activeModalEl && e.key === 'Tab') {
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', activeModalEl)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (document.activeElement && document.activeElement.isContentEditable);
    if (typing || activeModalEl) return;
    if (e.key === '/') { e.preventDefault(); openPalette(); }
    else if (e.key === '?') { e.preventDefault(); openHelp(); }
    else if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) { setTheme(state.theme === 'dark' ? 'light' : 'dark'); }
    else if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) { toggleLive(); }
  }

  /* --------------------------------------------------------------- Simulation */
  function jitter(v, amount = 0.07) {
    return Math.max(0, v * (1 + (Math.random() * 2 - 1) * amount));
  }
  function simulateTick(force = false) {
    if (!state.live && !force) return;
    db.queues.forEach(q => {
      q.publishRate = round1(jitter(q.publishRate, 0.06));
      q.deliverRate = round1(Math.min(jitter(q.deliverRate, 0.08), q.publishRate * 1.22 + 0.4));
      q.ackRate = round1(Math.min(jitter(q.ackRate, 0.06), q.deliverRate + 0.25));
      const inflow = q.publishRate * 2.5 * (0.82 + Math.random() * 0.36);
      const outflow = q.deliverRate * 2.5 * (0.82 + Math.random() * 0.36);
      q.ready = Math.max(0, Math.round(q.ready + inflow - outflow));
      if (q.consumers > 0 && Math.random() < 0.4) q.unacked = Math.max(0, q.unacked + (Math.random() < 0.45 ? -1 : 1));
      if (q.state === 'degraded' && q.ready < 1200) q.state = 'running';
      if (q.state === 'running' && q.ready > 6000 && q.type !== 'stream') q.state = 'degraded';
    });
    db.exchanges.forEach(ex => {
      ex.publishRate = round1(jitter(ex.publishRate, 0.07));
      ex.deliverRate = round1(jitter(ex.deliverRate, 0.08));
    });
    db.connections.forEach(c => {
      c.recvRate = round1(jitter(c.recvRate, 0.1));
      c.sendRate = round1(jitter(c.sendRate, 0.1));
    });
    db.channels.forEach(ch => {
      ch.publishRate = round1(jitter(ch.publishRate, 0.12));
      ch.deliverRate = round1(jitter(ch.deliverRate, 0.12));
    });
    state.lastTick = Date.now();
    const t = computeTotals();
    ['ready', 'unacked', 'consumers', 'connections', 'queues', 'exchanges'].forEach(k => {
      const arr = state.spark[k];
      if (arr) { arr.push(t[k]); while (arr.length > 24) arr.shift(); }
    });
    updateUpdatedLabel();
    patchLive();
    tickCharts();
  }

  function patchLive() {
    const t = computeTotals();
    $$('[data-live-total]').forEach(el => {
      const key = el.dataset.liveTotal;
      const v = t[key] == null ? 0 : t[key];
      el.textContent = fmtValue(v, el.dataset.fmt || 'int');
    });
    $$('[data-spark]').forEach(el => {
      const key = el.dataset.spark;
      const colors = {
        ready: 'var(--coral)', unacked: 'var(--amber)', consumers: 'var(--green)',
        connections: 'var(--text-2)', queues: 'var(--slate)', exchanges: 'var(--text-3)'
      };
      el.innerHTML = sparkSVG(state.spark[key], colors[key] || 'var(--text-3)');
    });
    $$('[data-live]').forEach(el => {
      const parts = el.dataset.live.split('|');
      if (parts.length < 3) return;
      const [kind, id, field] = parts;
      let obj = null;
      if (kind === 'queue') obj = findQueue(id);
      else if (kind === 'exchange') obj = findExchange(id);
      else if (kind === 'connection') obj = findConnection(id);
      else if (kind === 'channel') obj = findChannel(id);
      if (!obj) return;
      let v = obj[field];
      if (field === 'total') v = (obj.ready || 0) + (obj.unacked || 0);
      if (v == null) v = 0;
      el.textContent = fmtValue(v, el.dataset.fmt || 'int');
      if (el.dataset.fmt === 'rate') el.classList.toggle('rate--zero', !v);
      else if (el.classList.contains('num')) el.classList.toggle('num--zero', !v);
    });
  }

  /* --------------------------------------------------------------------- Boot */
  function initSparks() {
    const t = computeTotals();
    state.spark = {
      ready: histSeries('spark-ready', 24, t.ready, 0.06),
      unacked: histSeries('spark-unacked', 24, t.unacked, 0.08),
      consumers: histSeries('spark-consumers', 24, t.consumers, 0.03),
      connections: histSeries('spark-connections', 24, t.connections, 0.02),
      queues: histSeries('spark-queues', 24, t.queues, 0.01),
      exchanges: histSeries('spark-exchanges', 24, t.exchanges, 0.01)
    };
  }

  function renderListRegion(view) {
    const holder = $('#list-region');
    const regions = window.RMViews && window.RMViews.regions;
    if (!holder || !regions || !regions[view]) return;
    holder.innerHTML = regions[view]();
  }

  window.RMUI = {
    state, db, $, $$, esc, icon, fmtInt, fmtRate, fmtAxis, fmtMB, fmtUptime, fmtSince, timeAgo, fmtValue,
    compact, round1, computeTotals, findQueue, findExchange, findConnection, findChannel, findUser, findPolicy,
    findVhost, getVhostStats, buildPermissions, bindingsForQueue, bindingsForExchange, consumersForQueue,
    typeChip: TYPE_CHIP, stateCell, stateBadge, featureChips, crumbs, subJoin, pageHead, tabsHTML, pagerHTML,
    sortItems, emptyState, sparkSVG, ratesCard, statTile, METRICS, METRIC_KEYS, renderListRegion, showToast,
    copyText, logEvent, openPublish, simulateTick, renderCurrent
  };

  function boot() {
    initTheme();
    initSparks();
    if (!location.hash) {
      try { history.replaceState(null, '', '#/overview'); } catch (e) { location.hash = '#/overview'; }
    }
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('hashchange', () => { closeNav(); renderPage(true); });
    window.addEventListener('scroll', () => { if (state.menuOpen) closeMenu(); }, true);
    window.addEventListener('resize', () => { if (state.menuOpen) closeMenu(); if (window.innerWidth > 620) closeNav(); });
    setInterval(() => { if (state.live) simulateTick(); }, 2500);
    setInterval(updateUpdatedLabel, 1000);
    renderPage(true);
    updateLivePill();
  }

  window.RMBoot = boot;
})();
