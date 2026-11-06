/* RabbitMQ Management, Qoder UI — views
   All page and table-region markup. Consumes helpers from window.RMUI. */
(function () {
  'use strict';
  const U = window.RMUI;
  const {
    state, db, icon, esc, fmtInt, fmtRate, fmtValue, compact, fmtUptime, fmtSince, timeAgo, fmtMB,
    computeTotals, findQueue, findExchange, findConnection, findChannel, findUser, findPolicy, findVhost,
    getVhostStats, buildPermissions, bindingsForQueue, bindingsForExchange, consumersForQueue,
    typeChip, stateCell, stateBadge, featureChips, crumbs, subJoin, pageHead, tabsHTML, pagerHTML,
    sortItems, emptyState, ratesCard, statTile
  } = U;

  /* --------------------------------------------------------------- Utilities */
  const qLink = name => `<a class="name-link" href="#/queues/${encodeURIComponent(name)}">${esc(name)}</a>`;
  const exLink = (name, vhost) => name
    ? `<a class="name-link" href="#/exchanges/${encodeURIComponent(name)}">${esc(name)}</a>`
    : `<span class="muted">(AMQ default)</span>`;
  const chLink = id => {
    const ch = findChannel(id);
    return ch ? `<a class="name-link" href="#/channels/${encodeURIComponent(id)}">#${ch.number}</a>` : `<span class="muted">${esc(id)}</span>`;
  };
  const connLink = id => {
    const c = findConnection(id);
    return c ? `<a class="name-link" href="#/connections/${encodeURIComponent(id)}">${esc(c.name)}</a>` : `<span class="muted">${esc(id)}</span>`;
  };
  const thSort = (view, key, label, opts = {}) => {
    const s = state.sort[view];
    const active = s && s.key === key;
    return `<th scope="col" class="${opts.num ? 'is-num ' : ''}sortable" data-sort="${view}:${key}">${esc(label)}${active ? `<span class="sort-glyph">${s.dir > 0 ? '↑' : '↓'}</span>` : ''}</th>`;
  };
  const th = (label, opts = {}) => `<th scope="col" class="${opts.num ? 'is-num' : ''}">${esc(label)}</th>`;
  const argChips = (args) => {
    const entries = Object.entries(args || {});
    if (!entries.length) return '<span class="muted">none</span>';
    return `<span class="tag-list">${entries.map(([k, v]) =>
      `<span class="arg-code" title="${esc(k)}">${esc(k)}=${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</span>`).join('')}</span>`;
  };
  const defChips = (definition) => {
    const entries = Object.entries(definition || {});
    if (!entries.length) return '<span class="muted">none</span>';
    return `<span class="tag-list">${entries.slice(0, 3).map(([k, v]) =>
      `<span class="arg-code">${esc(k)}=${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</span>`).join('')}${entries.length > 3 ? `<span class="arg-code">+${entries.length - 3}</span>` : ''}</span>`;
  };
  const tagChips = tags => tags.length
    ? `<span class="tag-list">${tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</span>`
    : '<span class="muted">none</span>';
  const toolbarSearch = (view, placeholder) =>
    `<div class="input-icon-wrap">
      ${icon('search')}
      <input class="input input-search" data-filter="${view}:q" value="${esc(state.filters[view].q)}" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" />
    </div>`;
  const refreshBtn = `<button class="icon-btn" type="button" data-action="refresh" title="Refresh statistics" aria-label="Refresh statistics">${icon('refresh')}</button>`;

  function vhostSelect(view, label = 'All virtual hosts') {
    return `<div class="select-wrap"><select data-filter="${view}:vhost" aria-label="Filter by virtual host">
      <option value="all">${esc(label)}</option>
      ${db.vhosts.map(v => `<option value="${esc(v.name)}" ${state.filters[view].vhost === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
    </select>${icon('chevronDown')}</div>`;
  }

  function notFound(title, desc) {
    return `${pageHead({
      crumb: crumbs([{ label: 'RabbitMQ', href: '#/overview' }, { label: 'Not found' }]),
      title,
      sub: 'The resource may have been deleted or the link is stale.'
    })}
    <div class="card">${emptyState(title, desc, `<a class="btn btn--sm mt-12" href="#/overview">Back to overview</a>`)}</div>`;
  }

  /* ---------------------------------------------------------------- Overview */
  function overview() {
    const t = computeTotals();
    const trends = db.cluster.trends;
    const started = Date.now() - db.cluster.startedAt;
    return `${pageHead({
      crumb: crumbs([{ label: 'Cluster', href: '#/overview' }, { label: 'Overview' }]),
      title: 'Overview',
      badge: `<span class="status-badge status-badge--ok">healthy</span>`,
      sub: subJoin([
        `<strong>${esc(db.cluster.name)}</strong>`,
        `RabbitMQ ${esc(db.cluster.version)}`,
        `Erlang ${esc(db.cluster.erlang)}`,
        `${db.nodes.length} nodes`,
        `up ${fmtUptime(started)}`
      ]),
      updated: true,
      actions: `<button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh')} Refresh</button>
        <button class="btn" type="button" data-action="export">${icon('download')} Export definitions</button>`
    })}

    <div class="stats">
      ${statTile({ key: 'ready', label: 'Ready messages', iconName: 'queues', delta: trends.ready, sparkKey: 'ready', color: 'var(--coral)' })}
      ${statTile({ key: 'unacked', label: 'Unacked', iconName: 'clock', delta: trends.unacked, sparkKey: 'unacked', color: 'var(--amber)' })}
      ${statTile({ key: 'consumers', label: 'Consumers', iconName: 'users', delta: trends.consumers, sparkKey: 'consumers', color: 'var(--green)' })}
      ${statTile({ key: 'connections', label: 'Connections', iconName: 'connections', delta: trends.connections, sparkKey: 'connections', color: 'var(--text-2)' })}
      ${statTile({ key: 'queues', label: 'Queues', iconName: 'queues', delta: trends.queues, sparkKey: 'queues', color: 'var(--slate)' })}
      ${statTile({ key: 'exchanges', label: 'Exchanges', iconName: 'exchanges', delta: trends.exchanges, sparkKey: 'exchanges', color: 'var(--text-3)' })}
    </div>

    <div class="dash-grid">
      ${ratesCard({
        id: 'cluster-rates',
        rangeKey: 'overview',
        metrics: ['publish', 'deliver', 'ack'],
        title: 'Message rates',
        desc: 'Aggregated publish, deliver and acknowledgement activity',
        getValues: () => { const x = computeTotals(); return [x.publish, x.deliver, x.ack]; }
      })}
      <div class="card">
        <div class="card__head">
          <div>
            <div class="card__title">${icon('activity')} Cluster health</div>
            <div class="card__desc">Resource pressure across all nodes</div>
          </div>
          <span class="status-badge status-badge--ok">no alarms</span>
        </div>
        <div>
          ${db.nodes.map(n => {
            const pct = Math.round((n.memory / n.memoryMax) * 100);
            return `<div class="health-row">
              <span class="status-dot status-dot--ok"></span>
              <div class="health-row__body">
                <div class="health-row__name">${esc(n.name)}</div>
                <div class="health-row__sub">${n.memory.toFixed(2)} / ${n.memoryMax} GB memory</div>
              </div>
              <span class="bar ${pct > 75 ? 'bar--warn' : 'bar--ok'}"><span style="width:${pct}%"></span></span>
              <span class="health-row__pct">${pct}%</span>
            </div>`;
          }).join('')}
        </div>
        <div class="card__foot">
          <span class="inline"><span class="status-dot status-dot--ok"></span>All 3 nodes running</span>
          <span>${db.nodes.reduce((a, n) => a + n.sockets, 0)} sockets</span>
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card__head">
          <div>
            <div class="card__title">${icon('server')} Nodes</div>
            <div class="card__desc">Broker processes in the cluster</div>
          </div>
          <a class="btn btn--sm btn--ghost" href="#/limits">${icon('limits')} Limits</a>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr>
              ${th('Node')}${th('Type')}${th('Uptime')}${th('Memory')}${th('Disk free')}${th('FDs', { num: true })}${th('Sockets', { num: true })}${th('Status')}
            </tr></thead>
            <tbody>
              ${db.nodes.map(n => {
                const pct = Math.round((n.memory / n.memoryMax) * 100);
                const diskPct = Math.round((n.diskFree / n.diskMax) * 100);
                return `<tr>
                  <td><span class="name-link" style="border:0">${esc(n.name)}</span><span class="cell-sub">${esc(n.type)} node</span></td>
                  <td>${typeChip(n.type)}</td>
                  <td><span class="mono-sm">${fmtUptime(n.uptime)}</span></td>
                  <td><div class="mem-cell"><span class="num">${n.memory.toFixed(2)} GB</span><span class="bar ${pct > 75 ? 'bar--warn' : 'bar--ok'}"><span style="width:${pct}%"></span></span></div></td>
                  <td><div class="mem-cell"><span class="num">${n.diskFree.toFixed(1)} GB</span><span class="bar ${diskPct < 15 ? 'bar--warn' : 'bar--ok'}"><span style="width:${diskPct}%"></span></span></div></td>
                  <td class="is-num"><span class="num">${fmtInt(n.fd)}</span><span class="cell-sub">of ${compact(n.fdMax)}</span></td>
                  <td class="is-num"><span class="num">${fmtInt(n.sockets)}</span></td>
                  <td>${stateCell('running')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="card__foot">
          <span>RabbitMQ ${esc(db.cluster.version)} · Erlang ${esc(db.cluster.erlang)}</span>
          <span>${db.nodes.filter(n => n.running).length} of ${db.nodes.length} running</span>
        </div>
      </div>

      <div class="dash-stack">
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title">${icon('link')} Listeners</div>
              <div class="card__desc">Open ports and protocol contexts</div>
            </div>
          </div>
          <div class="listener-list">
            ${db.ports.map(p => `<div class="listener-row">
              <span class="listener-port">${p.port}</span>
              <div class="listener-main"><span>${esc(p.protocol)}${p.tls ? ' · TLS' : ''}</span><span class="listener-ctx">${esc(p.context)}</span></div>
              <span class="listener-nodes">${p.nodes} ${p.nodes === 1 ? 'node' : 'nodes'}</span>
              <span class="status-dot status-dot--ok" title="listening"></span>
            </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title">${icon('zap')} Recent activity</div>
              <div class="card__desc">Cluster events from the last hour</div>
            </div>
          </div>
          <div class="activity">
            ${db.events.map(ev => `<div class="activity__item">
              <span class="activity__dot activity__dot--${ev.type === 'warn' ? 'warn' : ev.type === 'ok' ? 'ok' : 'info'}"></span>
              <div class="activity__body">
                <div class="activity__title">${esc(ev.title)}</div>
                <div class="activity__detail">${esc(ev.detail)}</div>
              </div>
              <span class="activity__time">${timeAgo(ev.time)}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="view-foot">
      ${icon('info')}
      <span>Simulated cluster · metrics refresh every 2.5s · ${fmtInt(t.messages)} messages in flight</span>
      <span class="view-foot__right"><kbd class="kbd kbd--tiny">⌘K</kbd> command palette · <kbd class="kbd kbd--tiny">?</kbd> shortcuts</span>
    </div>`;
  }

  /* ------------------------------------------------------------------ Queues */
  function queues() {
    const t = computeTotals();
    return `${pageHead({
      crumb: crumbs([{ label: 'Topology', href: '#/queues' }, { label: 'Queues' }]),
      title: 'Queues',
      sub: subJoin([
        `${fmtInt(db.queues.length)} queues`,
        `${db.vhosts.length} virtual hosts`,
        `${fmtInt(t.ready)} ready`,
        `${fmtInt(t.unacked)} unacked`,
        `${fmtInt(t.consumers)} consumers`
      ]),
      actions: `<button class="btn" type="button" data-action="add-queue">${icon('plus')} Add queue</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('queues', 'Filter queues…')}
        ${vhostSelect('queues')}
        <div class="select-wrap"><select data-filter="queues:type" aria-label="Filter by queue type">
          <option value="all">All types</option>
          ${['classic', 'quorum', 'stream'].map(tp => `<option value="${tp}" ${state.filters.queues.type === tp ? 'selected' : ''}>${tp}</option>`).join('')}
        </select>${icon('chevronDown')}</div>
        <div class="toolbar__right">
          <span class="mono-sm muted">live</span>
          <span class="status-dot status-dot--ok"></span>
          ${refreshBtn}
        </div>
      </div>
      <div id="list-region">${regions.queues()}</div>
    </div>`;
  }

  function queuesRegion() {
    const f = state.filters.queues;
    let items = db.queues.filter(q =>
      (f.vhost === 'all' || q.vhost === f.vhost) &&
      (f.type === 'all' || q.type === f.type) &&
      (!f.q || [q.name, q.vhost, q.type, q.policy || ''].join(' ').toLowerCase().includes(f.q.toLowerCase()))
    );
    items = sortItems(items, state.sort.queues);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page.queues > pages) state.page.queues = pages;
    const page = state.page.queues;
    const slice = items.slice((page - 1) * state.pageSize, page * state.pageSize);
    if (!total) {
      return emptyState('No queues match', 'Adjust the search, virtual host or type filter to see queues again.');
    }
    return `<div class="table-wrap">
      <table class="table">
        <thead><tr>
          ${thSort('queues', 'name', 'Name')}
          ${thSort('queues', 'vhost', 'Vhost')}
          ${thSort('queues', 'type', 'Type')}
          ${th('Features')}
          ${thSort('queues', 'state', 'State')}
          ${thSort('queues', 'ready', 'Ready', { num: true })}
          ${thSort('queues', 'unacked', 'Unacked', { num: true })}
          ${thSort('queues', 'total', 'Total', { num: true })}
          ${thSort('queues', 'publishRate', 'Incoming', { num: true })}
          ${thSort('queues', 'deliverRate', 'Deliver', { num: true })}
          ${thSort('queues', 'ackRate', 'Ack', { num: true })}
          ${thSort('queues', 'consumers', 'Consumers', { num: true })}
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr></thead>
        <tbody>
          ${slice.map(q => `<tr data-href="#/queues/${encodeURIComponent(q.name)}">
            <td>${qLink(q.name)}<span class="cell-sub">${q.policy ? 'policy · ' + esc(q.policy) : 'no policy'}</span></td>
            <td><span class="mono-sm">${esc(q.vhost)}</span></td>
            <td>${typeChip(q.type)}</td>
            <td>${featureChips(q)}</td>
            <td>${stateCell(q.state)}</td>
            <td class="is-num"><span class="num" data-live="queue|${esc(q.name)}|ready" data-fmt="int">${fmtInt(q.ready)}</span></td>
            <td class="is-num"><span class="num" data-live="queue|${esc(q.name)}|unacked" data-fmt="int">${fmtInt(q.unacked)}</span></td>
            <td class="is-num"><span class="num" data-live="queue|${esc(q.name)}|total" data-fmt="int">${fmtInt(q.ready + q.unacked)}</span></td>
            <td class="is-num"><span class="rate" data-live="queue|${esc(q.name)}|publishRate" data-fmt="rate">${fmtRate(q.publishRate)}</span></td>
            <td class="is-num"><span class="rate" data-live="queue|${esc(q.name)}|deliverRate" data-fmt="rate">${fmtRate(q.deliverRate)}</span></td>
            <td class="is-num"><span class="rate" data-live="queue|${esc(q.name)}|ackRate" data-fmt="rate">${fmtRate(q.ackRate)}</span></td>
            <td class="is-num"><span class="num" data-live="queue|${esc(q.name)}|consumers" data-fmt="int">${fmtInt(q.consumers)}</span></td>
            <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="queue" data-menu-id="${esc(q.name)}" aria-label="Actions for ${esc(q.name)}">${icon('more')}</button></div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${pagerHTML('queues', total, page, state.pageSize)}`;
  }

  /* ------------------------------------------------------------- Queue detail */
  function queue(id) {
    const q = findQueue(id);
    if (!q) return notFound('Queue not found', `No queue named “${id}” exists in this cluster.`);
    const tab = state.detailTab.queue;
    const bindings = bindingsForQueue(q);
    const consumers = consumersForQueue(q.name);
    return `${pageHead({
      crumb: crumbs([{ label: 'Topology', href: '#/queues' }, { label: 'Queues', href: '#/queues' }, { label: q.name }]),
      title: q.name,
      mono: true,
      badge: `${stateBadge(q.state)} ${typeChip(q.type)}`,
      sub: subJoin([
        `vhost <strong>${esc(q.vhost)}</strong>`,
        `${q.durable ? 'durable' : 'transient'} · ${q.autoDelete ? 'auto-delete' : 'no auto-delete'}`,
        `${fmtInt(q.consumers)} consumers`,
        q.policy ? `policy <a href="#/policies" class="text-mono">${esc(q.policy)}</a>` : 'no policy',
        `declared ${timeAgo(q.created)}`
      ]),
      actions: `<button class="btn" type="button" data-action="publish" data-kind="queue" data-id="${esc(q.name)}">${icon('send')} Publish message</button>
        <button class="btn" type="button" data-action="purge-queue" data-id="${esc(q.name)}">${icon('purge')} Purge</button>
        <button class="btn btn--danger" type="button" data-action="delete-queue" data-id="${esc(q.name)}">${icon('trash')} Delete</button>`
    })}

    <div class="card">
      <div class="mini-stats mini-stats--4">
        <div class="mini-stat"><div class="mini-stat__label">Ready</div><div class="mini-stat__value" data-live="queue|${esc(q.name)}|ready" data-fmt="int">${fmtInt(q.ready)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Unacked</div><div class="mini-stat__value" data-live="queue|${esc(q.name)}|unacked" data-fmt="int">${fmtInt(q.unacked)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Total messages</div><div class="mini-stat__value" data-live="queue|${esc(q.name)}|total" data-fmt="int">${fmtInt(q.ready + q.unacked)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Consumers</div><div class="mini-stat__value" data-live="queue|${esc(q.name)}|consumers" data-fmt="int">${fmtInt(q.consumers)}</div></div>
      </div>
    </div>

    ${tabsHTML(tab, [
      { id: 'overview', label: 'Overview' },
      { id: 'bindings', label: 'Bindings', count: bindings.length },
      { id: 'consumers', label: 'Consumers', count: consumers.length },
      { id: 'rates', label: 'Message rates' }
    ])}

    ${tab === 'overview' ? queueOverview(q) : ''}
    ${tab === 'bindings' ? queueBindings(q, bindings) : ''}
    ${tab === 'consumers' ? queueConsumers(q, consumers) : ''}
    ${tab === 'rates' ? queueRates(q) : ''}`;
  }

  function queueOverview(q) {
    return `<div class="detail-grid detail-grid--wide">
      ${ratesCard({
        id: 'queue-rates',
        rangeKey: 'queue',
        metrics: ['publish', 'deliver', 'ack'],
        title: 'Message rates',
        desc: `Activity for ${q.name}`,
        getValues: () => {
          const x = findQueue(q.name);
          return x ? [x.publishRate, x.deliverRate, x.ackRate] : [0, 0, 0];
        }
      })}
      <div class="card">
        <div class="card__head">
          <div class="card__title">${icon('queues')} Queue details</div>
          <span class="chip">${esc(q.vhost)}</span>
        </div>
        <dl class="kv-list">
          <div class="kv"><dt>Virtual host</dt><dd class="mono">${esc(q.vhost)}</dd></div>
          <div class="kv"><dt>Type</dt><dd>${typeChip(q.type)} <span class="muted">${q.durable ? 'durable' : 'transient'}</span></dd></div>
          <div class="kv"><dt>Policy</dt><dd>${q.policy ? `<a href="#/policies" class="name-link">${esc(q.policy)}</a>` : '<span class="muted">none</span>'}</dd></div>
          <div class="kv"><dt>Auto-delete</dt><dd>${q.autoDelete ? 'Yes' : '<span class="muted">No</span>'}</dd></div>
          <div class="kv"><dt>Exclusive</dt><dd>${q.exclusive ? 'Yes' : '<span class="muted">No</span>'}</dd></div>
          <div class="kv"><dt>Arguments</dt><dd>${argChips(q.args)}</dd></div>
          <div class="kv"><dt>Memory</dt><dd class="mono">${fmtMB(q.memory)}</dd></div>
          <div class="kv"><dt>Owner node</dt><dd class="mono">${esc(db.cluster.node)}</dd></div>
          <div class="kv"><dt>Declared</dt><dd>${timeAgo(q.created)}</dd></div>
        </dl>
        <div class="card__foot">
          <span>${bindingsForQueue(q).length} bindings · ${consumersForQueue(q.name).length} consumers</span>
          <button class="btn btn--sm btn--ghost" type="button" data-action="publish" data-kind="queue" data-id="${esc(q.name)}">${icon('send')} Publish</button>
        </div>
      </div>
    </div>
    ${q.state === 'degraded' ? `<div class="callout callout--warn mt-12">${icon('alert')}
      <div><strong>Backlog growing.</strong> Incoming rate (${fmtRate(q.publishRate)}) exceeds delivery rate (${fmtRate(q.deliverRate)}).
      ${fmtInt(q.ready)} messages are waiting. Consider scaling consumers or applying a max-length policy.</div></div>` : ''}`;
  }

  function queueBindings(q, bindings) {
    return `<div class="card">
      <div class="card__head">
        <div><div class="card__title">Bindings</div><div class="card__desc">Exchanges that route messages into ${esc(q.name)}</div></div>
        <span class="chip">${bindings.length}</span>
      </div>
      ${bindings.length ? `<div class="table-wrap"><table class="table">
        <thead><tr>${th('Source exchange')}${th('Routing key')}${th('Destination')}${th('Arguments')}</tr></thead>
        <tbody>${bindings.map(b => `<tr>
          <td>${exLink(b.source, b.vhost)}</td>
          <td><span class="arg-code">${b.routingKey ? esc(b.routingKey) : '""'}</span></td>
          <td>${qLink(b.destination)} <span class="chip" style="margin-left:4px">queue</span></td>
          <td>${argChips(b.args)}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : emptyState('No bindings', 'This queue receives messages only through the default exchange (queue name routing).')}
      <div class="card__foot"><span>Binding changes take effect immediately.</span><span class="mono-sm">${esc(q.vhost)}</span></div>
    </div>`;
  }

  function queueConsumers(q, consumers) {
    return `<div class="card">
      <div class="card__head">
        <div><div class="card__title">Consumers</div><div class="card__desc">Clients currently subscribed to ${esc(q.name)}</div></div>
        <span class="chip">${consumers.length}</span>
      </div>
      ${consumers.length ? `<div class="table-wrap"><table class="table">
        <thead><tr>${th('Consumer tag')}${th('Channel')}${th('Connection')}${th('Ack required')}${th('Prefetch', { num: true })}${th('Exclusive')}${th('Active since')}</tr></thead>
        <tbody>${consumers.map(c => `<tr>
          <td><span class="mono-sm" style="color:var(--text)">${esc(c.tag)}</span></td>
          <td>${chLink(c.channel)}</td>
          <td>${connLink(c.connection)}</td>
          <td>${c.ackRequired ? '<span class="status-badge status-badge--warn">manual</span>' : '<span class="chip">auto</span>'}</td>
          <td class="is-num"><span class="num">${fmtInt(c.prefetch)}</span></td>
          <td>${c.exclusive ? '<span class="chip">exclusive</span>' : '<span class="muted">no</span>'}</td>
          <td><span class="mono-sm">${fmtSince(c.since)} ago</span></td>
        </tr>`).join('')}</tbody>
      </table></div>` : emptyState('No active consumers', 'Messages accumulate in the queue until a consumer attaches.')}
      <div class="card__foot"><span>Prefetch 0 means unlimited.</span><span>${fmtInt(consumers.reduce((a, c) => a + c.prefetch, 0))} total prefetch</span></div>
    </div>`;
  }

  function queueRates(q) {
    return `<div class="detail-grid detail-grid--wide">
      ${ratesCard({
        id: 'queue-rates-full',
        rangeKey: 'queue',
        metrics: ['publish', 'deliver', 'ack'],
        title: 'Message rates',
        desc: `Full rate history for ${q.name}`,
        getValues: () => {
          const x = findQueue(q.name);
          return x ? [x.publishRate, x.deliverRate, x.ackRate] : [0, 0, 0];
        }
      })}
      <div class="card">
        <div class="card__head"><div class="card__title">Rate semantics</div></div>
        <div class="card__body stack-sm">
          <div class="callout">${icon('info')}<div><strong>Publish</strong> counts messages entering the queue. <strong>Deliver</strong> counts messages sent to consumers. <strong>Ack</strong> counts broker confirmations.</div></div>
          <div class="callout">${icon('info')}<div>Values are sampled across all cluster nodes and can lag by one collection interval.</div></div>
          <div class="kv-list kv-list--flush">
            <div class="kv"><dt>Incoming</dt><dd class="mono">${fmtRate(q.publishRate)}</dd></div>
            <div class="kv"><dt>Deliver / get</dt><dd class="mono">${fmtRate(q.deliverRate)}</dd></div>
            <div class="kv"><dt>Redelivered</dt><dd class="mono">${fmtInt(q.redelivered)}</dd></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* --------------------------------------------------------------- Exchanges */
  function exchanges() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Topology', href: '#/exchanges' }, { label: 'Exchanges' }]),
      title: 'Exchanges',
      sub: subJoin([
        `${db.exchanges.length} exchanges`,
        `${db.bindings.length} bindings`,
        `${db.vhosts.length} virtual hosts`,
        '4 routing types'
      ]),
      actions: `<button class="btn" type="button" data-action="add-exchange">${icon('plus')} Add exchange</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('exchanges', 'Filter exchanges…')}
        ${vhostSelect('exchanges')}
        <div class="toolbar__right">${refreshBtn}</div>
      </div>
      <div id="list-region">${regions.exchanges()}</div>
    </div>`;
  }

  function exchangesRegion() {
    const f = state.filters.exchanges;
    let items = db.exchanges.filter(e =>
      (f.vhost === 'all' || e.vhost === f.vhost) &&
      (!f.q || [e.name || '(default exchange)', e.vhost, e.type].join(' ').toLowerCase().includes(f.q.toLowerCase()))
    );
    items = sortItems(items, state.sort.exchanges);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page.exchanges > pages) state.page.exchanges = pages;
    const page = state.page.exchanges;
    const slice = items.slice((page - 1) * state.pageSize, page * state.pageSize);
    if (!total) return emptyState('No exchanges match', 'Adjust the search or virtual host filter.');
    return `<div class="table-wrap"><table class="table">
      <thead><tr>
        ${thSort('exchanges', 'name', 'Name')}
        ${thSort('exchanges', 'vhost', 'Vhost')}
        ${thSort('exchanges', 'type', 'Type')}
        ${th('Features')}
        ${thSort('exchanges', 'bindings', 'Bindings', { num: true })}
        ${thSort('exchanges', 'publishRate', 'Incoming', { num: true })}
        ${thSort('exchanges', 'deliverRate', 'Deliver', { num: true })}
        <th scope="col"><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>
        ${slice.map(e => {
          const bound = bindingsForExchange(e).length;
          const builtin = !e.name || e.name.startsWith('amq.');
          return `<tr data-href="#/exchanges/${encodeURIComponent(e.name)}">
            <td>${exLink(e.name, e.vhost)}<span class="cell-sub">${builtin ? 'reserved by RabbitMQ' : e.internal ? 'internal' : 'user-declared'}</span></td>
            <td><span class="mono-sm">${esc(e.vhost)}</span></td>
            <td><span class="chip chip--type chip--${esc(e.type)}">${esc(e.type)}</span></td>
            <td>${featureChips(e)}</td>
            <td class="is-num"><span class="num">${fmtInt(bound)}</span></td>
            <td class="is-num"><span class="rate" data-live="exchange|${esc(e.name)}|publishRate" data-fmt="rate">${fmtRate(e.publishRate)}</span></td>
            <td class="is-num"><span class="rate" data-live="exchange|${esc(e.name)}|deliverRate" data-fmt="rate">${fmtRate(e.deliverRate)}</span></td>
            <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="exchange" data-menu-id="${esc(e.name)}" aria-label="Actions for ${esc(e.name || 'default exchange')}">${icon('more')}</button></div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
    ${pagerHTML('exchanges', total, page, state.pageSize)}`;
  }

  function exchange(id) {
    const ex = findExchange(id);
    if (!ex) return notFound('Exchange not found', `No exchange named “${id || '(default)'}” exists in this cluster.`);
    const tab = state.detailTab.exchange;
    const bindings = bindingsForExchange(ex);
    const builtin = !ex.name || ex.name.startsWith('amq.');
    const ae = ex.args && ex.args['alternate-exchange'];
    return `${pageHead({
      crumb: crumbs([{ label: 'Topology', href: '#/exchanges' }, { label: 'Exchanges', href: '#/exchanges' }, { label: ex.name || '(default exchange)' }]),
      title: ex.name || '(default exchange)',
      mono: true,
      badge: `${typeChip(ex.type)} ${ex.internal ? '<span class="chip">internal</span>' : ''}`,
      sub: subJoin([
        `vhost <strong>${esc(ex.vhost)}</strong>`,
        `${ex.durable ? 'durable' : 'transient'}`,
        `${bindings.length} bindings`,
        builtin ? 'reserved exchange' : 'user-declared'
      ]),
      actions: `${ex.internal || builtin ? '' : `<button class="btn" type="button" data-action="publish" data-kind="exchange" data-id="${esc(ex.name)}" data-vhost="${esc(ex.vhost)}">${icon('send')} Publish message</button>`}
        ${builtin ? '' : `<button class="btn btn--danger" type="button" data-action="delete-exchange" data-id="${esc(ex.name)}" data-vhost="${esc(ex.vhost)}">${icon('trash')} Delete</button>`}`
    })}

    ${tabsHTML(tab, [
      { id: 'overview', label: 'Overview' },
      { id: 'bindings', label: 'Bindings', count: bindings.length }
    ])}

    ${tab === 'overview' ? `<div class="detail-grid detail-grid--wide">
      ${ratesCard({
        id: 'exchange-rates',
        rangeKey: 'exchange',
        metrics: ['publish', 'deliver'],
        title: 'Message rates',
        desc: `Traffic through ${ex.name || 'the default exchange'}`,
        getValues: () => {
          const x = findExchange(ex.name, ex.vhost);
          return x ? [x.publishRate, x.deliverRate] : [0, 0];
        }
      })}
      <div class="card">
        <div class="card__head"><div class="card__title">${icon('exchanges')} Exchange details</div><span class="chip">${esc(ex.vhost)}</span></div>
        <dl class="kv-list">
          <div class="kv"><dt>Virtual host</dt><dd class="mono">${esc(ex.vhost)}</dd></div>
          <div class="kv"><dt>Type</dt><dd>${typeChip(ex.type)}</dd></div>
          <div class="kv"><dt>Durable</dt><dd>${ex.durable ? 'Yes' : '<span class="muted">No</span>'}</dd></div>
          <div class="kv"><dt>Auto-delete</dt><dd>${ex.autoDelete ? 'Yes' : '<span class="muted">No</span>'}</dd></div>
          <div class="kv"><dt>Internal</dt><dd>${ex.internal ? 'Yes' : '<span class="muted">No</span>'}</dd></div>
          <div class="kv"><dt>Alternate</dt><dd>${ae ? exLink(ae, ex.vhost) : '<span class="muted">none</span>'}</dd></div>
          <div class="kv"><dt>Arguments</dt><dd>${argChips(ex.args)}</dd></div>
          <div class="kv"><dt>Bindings</dt><dd class="mono">${bindings.length}</dd></div>
        </dl>
        <div class="card__foot"><span>Routing type: ${esc(ex.type)}</span><span class="mono-sm">${esc(ex.name || '(default)')}</span></div>
      </div>
    </div>
    ${ae ? `<div class="callout mt-12">${icon('info')}<div>Unroutable messages are re-published to the alternate exchange <strong>${esc(ae)}</strong>.</div></div>` : ''}` : ''}

    ${tab === 'bindings' ? `<div class="card">
      <div class="card__head">
        <div><div class="card__title">Bindings</div><div class="card__desc">Queues that receive messages routed by ${esc(ex.name || 'this exchange')}</div></div>
        <span class="chip">${bindings.length}</span>
      </div>
      ${bindings.length ? `<div class="table-wrap"><table class="table">
        <thead><tr>${th('Destination')}${th('Destination type')}${th('Routing key')}${th('Arguments')}</tr></thead>
        <tbody>${bindings.map(b => `<tr>
          <td>${b.destType === 'queue' ? qLink(b.destination) : esc(b.destination)}</td>
          <td><span class="chip">${esc(b.destType)}</span></td>
          <td><span class="arg-code">${b.routingKey ? esc(b.routingKey) : '""'}</span></td>
          <td>${argChips(b.args)}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : emptyState('No bindings', 'Messages published to this exchange will be unroutable until a binding is declared.')}
      <div class="card__foot"><span>${ex.type === 'fanout' ? 'Fanout ignores routing keys.' : 'Routing keys are evaluated per binding.'}</span><span class="mono-sm">${esc(ex.vhost)}</span></div>
    </div>` : ''}`;
  }

  /* -------------------------------------------------------------- Connections */
  function connections() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Monitor', href: '#/connections' }, { label: 'Connections' }]),
      title: 'Connections',
      sub: subJoin([
        `${db.connections.length} connections`,
        `${db.channels.length} channels`,
        `${db.connections.filter(c => c.protocol.startsWith('AMQP')).length} AMQP`,
        `${db.connections.filter(c => c.ssl).length} TLS`
      ]),
      actions: `<button class="btn" type="button" data-action="refresh">${icon('refresh')} Refresh</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('connections', 'Filter connections…')}
        <div class="toolbar__right"><span class="mono-sm muted">${db.connections.length} open</span><span class="status-dot status-dot--ok"></span>${refreshBtn}</div>
      </div>
      <div id="list-region">${regions.connections()}</div>
    </div>`;
  }

  function connectionsRegion() {
    const f = state.filters.connections;
    let items = db.connections.filter(c =>
      !f.q || [c.name, c.user, c.vhost, c.from, c.protocol].join(' ').toLowerCase().includes(f.q.toLowerCase())
    );
    items = sortItems(items, state.sort.connections);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page.connections > pages) state.page.connections = pages;
    const page = state.page.connections;
    const slice = items.slice((page - 1) * state.pageSize, page * state.pageSize);
    if (!total) return emptyState('No connections match', 'Adjust the search filter.');
    return `<div class="table-wrap"><table class="table">
      <thead><tr>
        ${thSort('connections', 'name', 'Name')}
        ${thSort('connections', 'user', 'User')}
        ${thSort('connections', 'vhost', 'Vhost')}
        ${thSort('connections', 'node', 'Node')}
        ${thSort('connections', 'protocol', 'Protocol')}
        ${thSort('connections', 'channels', 'Channels', { num: true })}
        ${th('State')}
        ${th('From')}
        ${th('Connected')}
        <th scope="col"><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>
        ${slice.map(c => {
          const channelCount = db.channels.filter(ch => ch.connection === c.id).length;
          return `<tr data-href="#/connections/${encodeURIComponent(c.id)}">
            <td><a class="name-link" href="#/connections/${encodeURIComponent(c.id)}">${esc(c.name)}</a><span class="cell-sub">${esc(c.client)}</span></td>
            <td><span class="mono-sm">${esc(c.user)}</span></td>
            <td><span class="mono-sm">${esc(c.vhost)}</span></td>
            <td><span class="mono-sm text-truncate">${esc(c.node)}</span></td>
            <td><span class="chip">${esc(c.protocol)}</span>${c.ssl ? '<span class="chip" style="margin-left:3px">tls</span>' : ''}</td>
            <td class="is-num"><span class="num">${fmtInt(channelCount)}</span></td>
            <td>${stateCell(c.state)}</td>
            <td><span class="mono-sm">${esc(c.from)}</span></td>
            <td><span class="mono-sm">${fmtSince(c.connectedAt)}</span></td>
            <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="connection" data-menu-id="${esc(c.id)}" aria-label="Actions for ${esc(c.name)}">${icon('more')}</button></div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
    ${pagerHTML('connections', total, page, state.pageSize)}`;
  }

  function connection(id) {
    const c = findConnection(id);
    if (!c) return notFound('Connection not found', 'This connection has been closed or does not exist.');
    const tab = state.detailTab.connection;
    const chans = db.channels.filter(ch => ch.connection === c.id);
    return `${pageHead({
      crumb: crumbs([{ label: 'Monitor', href: '#/connections' }, { label: 'Connections', href: '#/connections' }, { label: c.name }]),
      title: c.name,
      mono: true,
      badge: `${stateBadge(c.state)} <span class="chip">${esc(c.protocol)}</span>${c.ssl ? '<span class="chip">tls</span>' : ''}`,
      sub: subJoin([
        `from <span class="text-mono">${esc(c.from)}</span>`,
        `user <strong>${esc(c.user)}</strong>`,
        `vhost <strong>${esc(c.vhost)}</strong>`,
        `connected ${fmtSince(c.connectedAt)} ago`
      ]),
      actions: `<button class="btn btn--danger" type="button" data-action="close-connection" data-id="${esc(c.id)}">${icon('close')} Close connection</button>`
    })}
    <div class="card">
      <div class="mini-stats mini-stats--4">
        <div class="mini-stat"><div class="mini-stat__label">Channels</div><div class="mini-stat__value">${chans.length}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Received</div><div class="mini-stat__value">${fmtRate(c.recvRate)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Sent</div><div class="mini-stat__value">${fmtRate(c.sendRate)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Heartbeat</div><div class="mini-stat__value">${c.heartbeat}s</div></div>
      </div>
    </div>

    ${tabsHTML(tab, [
      { id: 'overview', label: 'Overview' },
      { id: 'channels', label: 'Channels', count: chans.length }
    ])}

    ${tab === 'overview' ? `<div class="detail-grid">
      <div class="card">
        <div class="card__head"><div class="card__title">${icon('connections')} Connection</div></div>
        <dl class="kv-list">
          <div class="kv"><dt>Name</dt><dd class="mono">${esc(c.name)}</dd></div>
          <div class="kv"><dt>User</dt><dd class="mono">${esc(c.user)}</dd></div>
          <div class="kv"><dt>Virtual host</dt><dd class="mono">${esc(c.vhost)}</dd></div>
          <div class="kv"><dt>Node</dt><dd class="mono">${esc(c.node)}</dd></div>
          <div class="kv"><dt>Protocol</dt><dd>${esc(c.protocol)}${c.ssl ? ' · TLS' : ''}</dd></div>
          <div class="kv"><dt>From</dt><dd class="mono">${esc(c.from)}</dd></div>
          <div class="kv"><dt>Peer</dt><dd class="mono">${esc(c.peer)}</dd></div>
          <div class="kv"><dt>Connected</dt><dd>${fmtSince(c.connectedAt)} ago</dd></div>
        </dl>
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">${icon('terminal')} Client &amp; protocol</div></div>
        <dl class="kv-list">
          <div class="kv"><dt>Client</dt><dd class="mono">${esc(c.client)}</dd></div>
          <div class="kv"><dt>Heartbeat</dt><dd class="mono">${c.heartbeat ? c.heartbeat + ' s' : 'disabled'}</dd></div>
          <div class="kv"><dt>Auth mechanism</dt><dd class="mono">PLAIN</dd></div>
          <div class="kv"><dt>Frame max</dt><dd class="mono">131072</dd></div>
          <div class="kv"><dt>Channel max</dt><dd class="mono">2047</dd></div>
          <div class="kv"><dt>TLS</dt><dd>${c.ssl ? 'TLS 1.3 · peer verified' : '<span class="muted">not encrypted</span>'}</dd></div>
          <div class="kv"><dt>Channels</dt><dd class="mono">${chans.length} open</dd></div>
        </dl>
        <div class="card__foot"><span>Receiving ${fmtRate(c.recvRate)}</span><span>Sending ${fmtRate(c.sendRate)}</span></div>
      </div>
    </div>` : ''}

    ${tab === 'channels' ? `<div class="card">
      <div class="card__head">
        <div><div class="card__title">Channels on this connection</div><div class="card__desc">Multiplexed AMQP channels</div></div>
        <span class="chip">${chans.length}</span>
      </div>
      ${chans.length ? `<div class="table-wrap"><table class="table">
        <thead><tr>${th('Channel')}${th('Prefetch', { num: true })}${th('Unacked', { num: true })}${th('Consumers', { num: true })}${th('Publish', { num: true })}${th('Deliver', { num: true })}${th('State')}<th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${chans.map(ch => `<tr data-href="#/channels/${encodeURIComponent(ch.id)}">
          <td><a class="name-link" href="#/channels/${encodeURIComponent(ch.id)}">#${ch.number}</a></td>
          <td class="is-num"><span class="num">${fmtInt(ch.prefetch)}</span></td>
          <td class="is-num"><span class="num">${fmtInt(ch.unacked)}</span></td>
          <td class="is-num"><span class="num">${fmtInt(ch.consumers)}</span></td>
          <td class="is-num"><span class="rate">${fmtRate(ch.publishRate)}</span></td>
          <td class="is-num"><span class="rate">${fmtRate(ch.deliverRate)}</span></td>
          <td>${stateCell(ch.state)}</td>
          <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="channel" data-menu-id="${esc(ch.id)}" aria-label="Actions for channel ${ch.number}">${icon('more')}</button></div></td>
        </tr>`).join('')}</tbody>
      </table></div>` : emptyState('No channels', 'This connection has no multiplexed channels open.')}
    </div>` : ''}`;
  }

  /* ----------------------------------------------------------------- Channels */
  function channels() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Monitor', href: '#/channels' }, { label: 'Channels' }]),
      title: 'Channels',
      sub: subJoin([
        `${db.channels.length} channels`,
        `${db.channels.filter(c => c.state === 'running').length} running`,
        `${db.channels.filter(c => c.consumers > 0).length} with consumers`,
        `${fmtInt(db.channels.reduce((a, c) => a + c.unacked, 0))} unacked`
      ]),
      actions: `<button class="btn" type="button" data-action="refresh">${icon('refresh')} Refresh</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('channels', 'Filter channels…')}
        <div class="toolbar__right">${refreshBtn}</div>
      </div>
      <div id="list-region">${regions.channels()}</div>
    </div>`;
  }

  function channelsRegion() {
    const f = state.filters.channels;
    let items = db.channels.filter(c =>
      !f.q || [c.id, c.user, c.vhost, c.connection, String(c.number)].join(' ').toLowerCase().includes(f.q.toLowerCase())
    );
    items = sortItems(items, state.sort.channels);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page.channels > pages) state.page.channels = pages;
    const page = state.page.channels;
    const slice = items.slice((page - 1) * state.pageSize, page * state.pageSize);
    if (!total) return emptyState('No channels match', 'Adjust the search filter.');
    return `<div class="table-wrap"><table class="table">
      <thead><tr>
        ${thSort('channels', 'number', 'Channel')}
        ${th('Connection')}
        ${thSort('channels', 'user', 'User')}
        ${thSort('channels', 'vhost', 'Vhost')}
        ${thSort('channels', 'prefetch', 'Prefetch', { num: true })}
        ${thSort('channels', 'unacked', 'Unacked', { num: true })}
        ${thSort('channels', 'consumers', 'Consumers', { num: true })}
        ${th('Publish', { num: true })}${th('Deliver', { num: true })}
        ${th('State')}
        <th scope="col"><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>
        ${slice.map(ch => `<tr data-href="#/channels/${encodeURIComponent(ch.id)}">
          <td><a class="name-link" href="#/channels/${encodeURIComponent(ch.id)}">#${ch.number}</a><span class="cell-sub">${esc(ch.id)}</span></td>
          <td>${connLink(ch.connection)}</td>
          <td><span class="mono-sm">${esc(ch.user)}</span></td>
          <td><span class="mono-sm">${esc(ch.vhost)}</span></td>
          <td class="is-num"><span class="num">${fmtInt(ch.prefetch)}</span></td>
          <td class="is-num"><span class="num" data-live="channel|${esc(ch.id)}|unacked" data-fmt="int">${fmtInt(ch.unacked)}</span></td>
          <td class="is-num"><span class="num">${fmtInt(ch.consumers)}</span></td>
          <td class="is-num"><span class="rate" data-live="channel|${esc(ch.id)}|publishRate" data-fmt="rate">${fmtRate(ch.publishRate)}</span></td>
          <td class="is-num"><span class="rate" data-live="channel|${esc(ch.id)}|deliverRate" data-fmt="rate">${fmtRate(ch.deliverRate)}</span></td>
          <td>${stateCell(ch.state)}</td>
          <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="channel" data-menu-id="${esc(ch.id)}" aria-label="Actions for channel ${ch.number}">${icon('more')}</button></div></td>
        </tr>`).join('')}
      </tbody>
    </table></div>
    ${pagerHTML('channels', total, page, state.pageSize)}`;
  }

  function channel(id) {
    const ch = findChannel(id);
    if (!ch) return notFound('Channel not found', 'This channel has been closed or does not exist.');
    const cons = db.consumers.filter(c => c.channel === id);
    const conn = findConnection(ch.connection);
    return `${pageHead({
      crumb: crumbs([{ label: 'Monitor', href: '#/channels' }, { label: 'Channels', href: '#/channels' }, { label: '#' + ch.number }]),
      title: `Channel ${ch.number}`,
      mono: true,
      badge: stateBadge(ch.state),
      sub: subJoin([
        `connection ${conn ? connLink(conn.id) : esc(ch.connection)}`,
        `user <strong>${esc(ch.user)}</strong>`,
        `vhost <strong>${esc(ch.vhost)}</strong>`,
        `id <span class="text-mono">${esc(ch.id)}</span>`
      ]),
      actions: `<button class="btn btn--danger" type="button" data-action="close-channel" data-id="${esc(ch.id)}">${icon('close')} Close channel</button>`
    })}
    <div class="card">
      <div class="mini-stats mini-stats--4">
        <div class="mini-stat"><div class="mini-stat__label">Prefetch</div><div class="mini-stat__value">${fmtInt(ch.prefetch)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Unacked</div><div class="mini-stat__value" data-live="channel|${esc(ch.id)}|unacked" data-fmt="int">${fmtInt(ch.unacked)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Consumers</div><div class="mini-stat__value">${fmtInt(ch.consumers)}</div></div>
        <div class="mini-stat"><div class="mini-stat__label">Deliver rate</div><div class="mini-stat__value">${fmtRate(ch.deliverRate)}</div></div>
      </div>
    </div>
    <div class="detail-grid mt-12">
      <div class="card">
        <div class="card__head"><div class="card__title">${icon('channels')} Channel details</div></div>
        <dl class="kv-list">
          <div class="kv"><dt>Channel id</dt><dd class="mono">${esc(ch.id)}</dd></div>
          <div class="kv"><dt>Number</dt><dd class="mono">${ch.number}</dd></div>
          <div class="kv"><dt>Connection</dt><dd>${conn ? connLink(conn.id) : '<span class="muted">closed</span>'}</dd></div>
          <div class="kv"><dt>Node</dt><dd class="mono">${esc(ch.node)}</dd></div>
          <div class="kv"><dt>User</dt><dd class="mono">${esc(ch.user)}</dd></div>
          <div class="kv"><dt>Virtual host</dt><dd class="mono">${esc(ch.vhost)}</dd></div>
          <div class="kv"><dt>Prefetch</dt><dd class="mono">${fmtInt(ch.prefetch)}</dd></div>
          <div class="kv"><dt>Confirm mode</dt><dd>${ch.confirmMode ? 'enabled' : '<span class="muted">disabled</span>'}</dd></div>
          <div class="kv"><dt>Transactional</dt><dd>${ch.transactional ? 'yes' : '<span class="muted">no</span>'}</dd></div>
          <div class="kv"><dt>Publish rate</dt><dd class="mono">${fmtRate(ch.publishRate)}</dd></div>
        </dl>
      </div>
      <div class="card">
        <div class="card__head">
          <div><div class="card__title">Consumers on this channel</div><div class="card__desc">Subscriptions multiplexed here</div></div>
          <span class="chip">${cons.length}</span>
        </div>
        ${cons.length ? `<div class="table-wrap"><table class="table">
          <thead><tr>${th('Consumer tag')}${th('Queue')}${th('Ack')}${th('Prefetch', { num: true })}</tr></thead>
          <tbody>${cons.map(c => `<tr>
            <td><span class="mono-sm" style="color:var(--text)">${esc(c.tag)}</span></td>
            <td>${qLink(c.queue)}</td>
            <td>${c.ackRequired ? '<span class="status-badge status-badge--warn">manual</span>' : '<span class="chip">auto</span>'}</td>
            <td class="is-num"><span class="num">${fmtInt(c.prefetch)}</span></td>
          </tr>`).join('')}</tbody>
        </table></div>` : emptyState('No consumers', 'This channel has no active subscriptions.')}
      </div>
    </div>`;
  }

  /* -------------------------------------------------------------------- Users */
  function users() {
    const perms = buildPermissions();
    return `${pageHead({
      crumb: crumbs([{ label: 'Admin', href: '#/users' }, { label: 'Users' }]),
      title: 'Users',
      sub: subJoin([
        `${db.users.length} accounts`,
        `${db.users.filter(u => u.tags.includes('administrator')).length} administrators`,
        `${perms.length} permissions across ${db.vhosts.length} vhosts`
      ]),
      actions: `<button class="btn" type="button" data-action="add-user">${icon('userPlus')} Add user</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('users', 'Filter users…')}
        <div class="toolbar__right">${refreshBtn}</div>
      </div>
      <div id="list-region">${regions.users()}</div>
    </div>

    <div class="card mt-16">
      <div class="card__head">
        <div><div class="card__title">${icon('shield')} Permissions</div><div class="card__desc">Configure, write and read grants per virtual host</div></div>
        <span class="chip">${perms.length}</span>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>${th('User')}${th('Virtual host')}${th('Configure')}${th('Write')}${th('Read')}</tr></thead>
        <tbody>${perms.map(p => `<tr>
          <td><span class="mono-sm" style="color:var(--text)">${esc(p.user)}</span></td>
          <td><span class="mono-sm">${esc(p.vhost)}</span></td>
          <td><span class="arg-code">${p.configure ? esc(p.configure) : '—'}</span></td>
          <td><span class="arg-code">${p.write ? esc(p.write) : '—'}</span></td>
          <td><span class="arg-code">${p.read ? esc(p.read) : '—'}</span></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="card__foot"><span>Regular expressions are matched against queue and exchange names.</span><span>administrator implies full access</span></div>
    </div>`;
  }

  function usersRegion() {
    const f = state.filters.users;
    let items = db.users.filter(u =>
      !f.q || [u.username, ...u.tags, ...u.vhosts].join(' ').toLowerCase().includes(f.q.toLowerCase())
    );
    items = items.slice().sort((a, b) => a.username.localeCompare(b.username) * state.sort.users.dir);
    if (!items.length) return emptyState('No users match', 'Adjust the search filter.');
    return `<div class="table-wrap"><table class="table">
      <thead><tr>${thSort('users', 'username', 'Username')}${th('Tags')}${th('Virtual hosts')}${th('Password hash')}<th><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${items.map(u => `<tr>
        <td><span class="mono-sm" style="color:var(--text);font-size:12px">${esc(u.username)}</span>${u.username === 'admin' ? '<span class="cell-sub">signed in</span>' : ''}</td>
        <td>${tagChips(u.tags)}</td>
        <td><span class="tag-list">${u.vhosts.map(v => `<span class="chip">${esc(v)}</span>`).join('')}</span></td>
        <td><span class="mono-sm muted">${esc(u.hash)}</span></td>
        <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="user" data-menu-id="${esc(u.username)}" aria-label="Actions for ${esc(u.username)}">${icon('more')}</button></div></td>
      </tr>`).join('')}</tbody>
    </table></div>
    <div class="table-foot"><span>Showing all ${items.length} accounts</span><span>Passwords are never displayed</span></div>`;
  }

  /* ------------------------------------------------------------ Virtual hosts */
  function vhosts() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Admin', href: '#/vhosts' }, { label: 'Virtual hosts' }]),
      title: 'Virtual hosts',
      sub: subJoin([
        `${db.vhosts.length} virtual hosts`,
        `${db.queues.length} queues`,
        `${db.connections.length} connections`,
        `${db.vhosts.filter(v => v.tracing).length} with tracing`
      ]),
      actions: `<button class="btn" type="button" data-action="add-vhost">${icon('plus')} Add virtual host</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('vhosts', 'Filter virtual hosts…')}
        <div class="toolbar__right">${refreshBtn}</div>
      </div>
      <div id="list-region">${regions.vhosts()}</div>
    </div>`;
  }

  function vhostsRegion() {
    const f = state.filters.vhosts;
    let items = db.vhosts.filter(v =>
      !f.q || [v.name, v.description].join(' ').toLowerCase().includes(f.q.toLowerCase())
    );
    if (!items.length) return emptyState('No virtual hosts match', 'Adjust the search filter.');
    return `<div class="table-wrap"><table class="table">
      <thead><tr>${th('Name')}${th('Description')}${th('Tracing')}${th('Queues', { num: true })}${th('Connections', { num: true })}${th('Messages', { num: true })}<th><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${items.map(v => {
        const stats = getVhostStats(v.name);
        return `<tr>
          <td><a class="name-link" href="#/queues">${esc(v.name)}</a><span class="cell-sub">${v.name === '/' ? 'default' : 'isolated namespace'}</span></td>
          <td>${v.description ? esc(v.description) : '<span class="muted">no description</span>'}</td>
          <td>${v.tracing ? '<span class="status-badge status-badge--warn">enabled</span>' : '<span class="muted">off</span>'}</td>
          <td class="is-num"><span class="num">${fmtInt(stats.queues)}</span></td>
          <td class="is-num"><span class="num">${fmtInt(stats.connections)}</span></td>
          <td class="is-num"><span class="num">${fmtInt(stats.messages)}</span></td>
          <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="vhost" data-menu-id="${esc(v.name)}" aria-label="Actions for ${esc(v.name)}">${icon('more')}</button></div></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div class="table-foot"><span>${items.length} namespaces</span><span>Tracing copies messages to amq.rabbitmq.trace</span></div>`;
  }

  /* ---------------------------------------------------------------- Policies */
  function policyApplied(p) {
    let list;
    if (p.applyTo === 'queues') list = db.queues.filter(q => q.vhost === p.vhost);
    else if (p.applyTo === 'exchanges') list = db.exchanges.filter(e => e.vhost === p.vhost);
    else list = db.queues.filter(q => q.vhost === p.vhost).concat(db.exchanges.filter(e => e.vhost === p.vhost));
    try {
      const re = new RegExp(p.pattern);
      return list.filter(x => re.test(x.name)).length;
    } catch (e) { return 0; }
  }

  function policies() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Admin', href: '#/policies' }, { label: 'Policies' }]),
      title: 'Policies',
      sub: subJoin([
        `${db.policies.length} policies`,
        `across ${new Set(db.policies.map(p => p.vhost)).size} virtual hosts`,
        'pattern-based application'
      ]),
      actions: `<button class="btn" type="button" data-action="add-policy">${icon('plus')} Add policy</button>`
    })}
    <div class="card">
      <div class="toolbar">
        ${toolbarSearch('policies', 'Filter policies…')}
        <div class="toolbar__right">${refreshBtn}</div>
      </div>
      <div id="list-region">${regions.policies()}</div>
    </div>`;
  }

  function policiesRegion() {
    const f = state.filters.policies;
    let items = db.policies.filter(p =>
      !f.q || [p.name, p.vhost, p.pattern, p.applyTo].join(' ').toLowerCase().includes(f.q.toLowerCase())
    );
    items = items.slice().sort((a, b) => a.name.localeCompare(b.name) * state.sort.policies.dir);
    if (!items.length) return emptyState('No policies match', 'Adjust the search filter.');
    return `<div class="table-wrap"><table class="table">
      <thead><tr>${th('Name')}${th('Virtual host')}${th('Pattern')}${th('Apply to')}${th('Priority', { num: true })}${th('Definition')}${th('Applied', { num: true })}<th><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${items.map(p => `<tr>
        <td><span class="mono-sm" style="color:var(--text)">${esc(p.name)}</span></td>
        <td><span class="mono-sm">${esc(p.vhost)}</span></td>
        <td><span class="arg-code">${esc(p.pattern)}</span></td>
        <td><span class="chip">${esc(p.applyTo)}</span></td>
        <td class="is-num"><span class="num">${p.priority}</span></td>
        <td>${defChips(p.definition)}</td>
        <td class="is-num"><span class="num">${fmtInt(policyApplied(p))}</span></td>
        <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="policy" data-menu-id="${esc(p.name)}" aria-label="Actions for ${esc(p.name)}">${icon('more')}</button></div></td>
      </tr>`).join('')}</tbody>
    </table></div>
    <div class="table-foot"><span>Lower priority values are applied first.</span><span>Queue policies override exchange policies</span></div>`;
  }

  /* ------------------------------------------------------------------ Limits */
  function limits() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Admin', href: '#/limits' }, { label: 'Limits' }]),
      title: 'Limits',
      sub: subJoin([
        `${db.limits.length} virtual host limits`,
        `${db.vhosts.length} namespaces`,
        'enforced by the broker'
      ]),
      actions: `<button class="btn" type="button" data-action="refresh">${icon('refresh')} Refresh</button>`
    })}
    <div class="card">
      <div class="card__head">
        <div><div class="card__title">${icon('limits')} Per-virtual-host limits</div><div class="card__desc">Current usage against configured maximums</div></div>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>${th('Virtual host')}${th('Connections')}${th('Usage')}${th('Queues')}${th('Usage')}${th('Messages', { num: true })}<th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${db.limits.map(l => {
          const stats = getVhostStats(l.vhost);
          const cPct = Math.min(100, Math.round((stats.connections / l.maxConnections) * 100));
          const qPct = Math.min(100, Math.round((stats.queues / l.maxQueues) * 100));
          return `<tr>
            <td><span class="mono-sm" style="color:var(--text);font-size:11.5px">${esc(l.vhost)}</span><span class="cell-sub">${l.vhost === '/' ? 'default' : 'custom limits'}</span></td>
            <td><span class="num">${stats.connections}</span> <span class="muted">/ ${fmtInt(l.maxConnections)}</span></td>
            <td><div class="limit-usage"><span class="bar ${cPct > 75 ? 'bar--warn' : 'bar--ok'}"><span style="width:${cPct}%"></span></span><span class="mono-sm muted">${cPct}%</span></div></td>
            <td><span class="num">${stats.queues}</span> <span class="muted">/ ${fmtInt(l.maxQueues)}</span></td>
            <td><div class="limit-usage"><span class="bar ${qPct > 75 ? 'bar--warn' : 'bar--ok'}"><span style="width:${qPct}%"></span></span><span class="mono-sm muted">${qPct}%</span></div></td>
            <td class="is-num"><span class="num">${fmtInt(stats.messages)}</span></td>
            <td><div class="row-actions"><button class="icon-btn" type="button" data-menu-kind="limit" data-menu-id="${esc(l.vhost)}" aria-label="Edit limits for ${esc(l.vhost)}">${icon('more')}</button></div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      <div class="card__foot"><span>Limits protect cluster resources from noisy neighbours.</span><span>Enforced per virtual host</span></div>
    </div>`;
  }

  /* ----------------------------------------------------------- Feature flags */
  function flags() {
    return `${pageHead({
      crumb: crumbs([{ label: 'Admin', href: '#/flags' }, { label: 'Feature flags' }]),
      title: 'Feature flags',
      sub: subJoin([
        `${db.flags.length} flags`,
        `${db.flags.filter(f => f.enabled).length} enabled`,
        `${db.flags.filter(f => f.stability === 'experimental').length} experimental`,
        'cluster-wide'
      ])
    })}
    <div class="card">
      <div class="card__head">
        <div><div class="card__title">${icon('flags')} Broker capabilities</div><div class="card__desc">Flags can be enabled but not disabled while the node is running</div></div>
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>${th('Flag')}${th('State')}${th('Stability')}${th('Description')}<th><span class="sr-only">Action</span></th></tr></thead>
        <tbody>${db.flags.map(f => `<tr>
          <td><span class="mono-sm" style="color:var(--text);font-size:11px">${esc(f.name)}</span></td>
          <td>${f.enabled ? '<span class="status-badge status-badge--ok">enabled</span>' : '<span class="status-badge status-badge--muted">disabled</span>'}</td>
          <td><span class="chip ${f.stability === 'experimental' ? 'chip--stream' : ''}">${esc(f.stability)}</span></td>
          <td>${esc(f.desc)}</td>
          <td><div class="row-actions" style="opacity:1">${f.enabled ? '' : `<button class="btn btn--sm" type="button" data-action="enable-flag" data-id="${esc(f.name)}">Enable</button>`}</div></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="card__foot"><span>${db.flags.filter(f => f.enabled).length} capabilities active</span><span>Some flags require a rolling restart</span></div>
    </div>`;
  }

  /* ------------------------------------------------------------------ Export */
  const regions = { queues: queuesRegion, exchanges: exchangesRegion, connections: connectionsRegion, channels: channelsRegion, users: usersRegion, vhosts: vhostsRegion, policies: policiesRegion };

  window.RMViews = {
    overview, queues, queue, exchanges, exchange, connections, connection, channels, channel,
    users, vhosts, policies, limits, flags,
    notfound: () => notFound('Page not found', 'The requested console route does not exist.'),
    regions
  };

  if (window.RMBoot) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.RMBoot);
    else window.RMBoot();
  }
})();
