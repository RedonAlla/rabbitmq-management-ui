// Fixtures for the mock RabbitMQ Management API.
// Everything here is shaped like the responses of a real broker, so the
// frontend can talk to this server and a real broker without branching.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MB = 1024 ** 2
const GB = 1024 ** 3

const now = Date.now()
const ago = (ms) => now - ms

const NODE_1 = "rabbit@qoder-mq-01"
const NODE_2 = "rabbit@qoder-mq-02"
const NODE_3 = "rabbit@qoder-mq-03"

export function createState() {
  const vhosts = [
    {
      name: "/",
      description: "Default virtual host",
      tags: [],
      tracing: false,
      default_queue_type: "classic",
      cluster_state: { [NODE_1]: "running", [NODE_2]: "running", [NODE_3]: "running" },
    },
    {
      name: "staging",
      description: "Pre-production workloads",
      tags: [],
      tracing: false,
      default_queue_type: "classic",
      cluster_state: { [NODE_1]: "running", [NODE_2]: "running", [NODE_3]: "running" },
    },
    {
      name: "analytics",
      description: "Event ingestion and rollups",
      tags: ["analytics"],
      tracing: true,
      default_queue_type: "classic",
      cluster_state: { [NODE_1]: "running", [NODE_2]: "running", [NODE_3]: "running" },
    },
  ]

  const nodes = [
    {
      name: NODE_1,
      type: "disc",
      uptime: 26 * DAY + 4 * HOUR + 12 * MINUTE,
      mem_used: 1.82 * GB,
      mem_limit: 8 * GB,
      mem_alarm: false,
      disk_free: 42.6 * GB,
      disk_free_limit: 57.4 * GB,
      disk_free_alarm: false,
      fd_used: 128,
      fd_total: 65536,
      sockets_used: 96,
      proc_used: 512,
      proc_total: 1048576,
      run_queue: 0,
      processors: 8,
      running: true,
      partitions: [],
      rates_mode: "basic",
    },
    {
      name: NODE_2,
      type: "disc",
      uptime: 26 * DAY + 4 * HOUR + 10 * MINUTE,
      mem_used: 1.46 * GB,
      mem_limit: 8 * GB,
      mem_alarm: false,
      disk_free: 41.9 * GB,
      disk_free_limit: 58.1 * GB,
      disk_free_alarm: false,
      fd_used: 112,
      fd_total: 65536,
      sockets_used: 84,
      proc_used: 468,
      proc_total: 1048576,
      run_queue: 0,
      processors: 8,
      running: true,
      partitions: [],
      rates_mode: "basic",
    },
    {
      name: NODE_3,
      type: "ram",
      uptime: 12 * DAY + 7 * HOUR + 41 * MINUTE,
      mem_used: 2.08 * GB,
      mem_limit: 8 * GB,
      mem_alarm: false,
      disk_free: 38.2 * GB,
      disk_free_limit: 61.8 * GB,
      disk_free_alarm: false,
      fd_used: 143,
      fd_total: 65536,
      sockets_used: 108,
      proc_used: 604,
      proc_total: 1048576,
      run_queue: 0,
      processors: 8,
      running: true,
      partitions: [],
      rates_mode: "basic",
    },
  ]

  const listeners = [
    { node: NODE_1, protocol: "amqp", ip_address: "0.0.0.0", port: 5672, tls: false },
    { node: NODE_1, protocol: "amqp/ssl", ip_address: "0.0.0.0", port: 5671, tls: true },
    { node: NODE_1, protocol: "http", ip_address: "0.0.0.0", port: 15672, tls: false },
    { node: NODE_1, protocol: "https", ip_address: "0.0.0.0", port: 15671, tls: true },
    { node: NODE_1, protocol: "clustering", ip_address: "0.0.0.0", port: 25672, tls: false },
    { node: NODE_1, protocol: "mqtt", ip_address: "0.0.0.0", port: 1883, tls: false },
    { node: NODE_1, protocol: "web-mqtt", ip_address: "0.0.0.0", port: 15675, tls: false },
    { node: NODE_1, protocol: "stream", ip_address: "0.0.0.0", port: 5552, tls: false },
    { node: NODE_2, protocol: "amqp", ip_address: "0.0.0.0", port: 5672, tls: false },
    { node: NODE_2, protocol: "clustering", ip_address: "0.0.0.0", port: 25672, tls: false },
    { node: NODE_2, protocol: "http/prometheus", ip_address: "0.0.0.0", port: 15692, tls: false },
    { node: NODE_2, protocol: "mqtt", ip_address: "0.0.0.0", port: 1883, tls: false },
    { node: NODE_2, protocol: "stream", ip_address: "0.0.0.0", port: 5552, tls: false },
    { node: NODE_3, protocol: "amqp", ip_address: "0.0.0.0", port: 5672, tls: false },
    { node: NODE_3, protocol: "clustering", ip_address: "0.0.0.0", port: 25672, tls: false },
    { node: NODE_3, protocol: "stream", ip_address: "0.0.0.0", port: 5552, tls: false },
  ]

  const contexts = [
    {
      node: NODE_1,
      description: "Management UI and HTTP API",
      path: "/",
      port: 15672,
      protocol: "http",
    },
    {
      node: NODE_1,
      description: "Management UI over TLS",
      path: "/",
      port: 15671,
      protocol: "https",
    },
    {
      node: NODE_2,
      description: "Prometheus metrics",
      path: "/metrics",
      port: 15692,
      protocol: "http/prometheus",
    },
    {
      node: NODE_1,
      description: "MQTT over WebSocket",
      path: "/mqtt",
      port: 15675,
      protocol: "web-mqtt",
    },
  ]

  const queues = [
    queue({
      name: "orders.created", ready: 1284, unacked: 12, consumers: 4, state: "running",
      policy: "orders-dlx", publishRate: 42.8, deliverRate: 39.2, ackRate: 38.9,
      redelivered: 3, memoryMb: 2.4,
    }),
    queue({
      name: "orders.processed", type: "quorum", ready: 86, unacked: 0, consumers: 2,
      state: "running", publishRate: 16.6, deliverRate: 16.1, ackRate: 16.0, memoryMb: 1.1,
    }),
    queue({
      name: "payments.authorized", type: "quorum", ready: 420, unacked: 3, consumers: 2,
      state: "running", publishRate: 21.4, deliverRate: 19.8, ackRate: 19.4,
      redelivered: 1, memoryMb: 1.7,
    }),
    queue({
      name: "payments.capture", ready: 0, unacked: 0, consumers: 2, state: "running",
      publishRate: 8.2, deliverRate: 8.2, ackRate: 8.2, memoryMb: 0.4,
    }),
    queue({
      name: "notifications.email", ready: 1250, unacked: 8, consumers: 6, state: "running",
      policy: "email-retry", publishRate: 31.2, deliverRate: 29.4, ackRate: 29.0,
      redelivered: 6, memoryMb: 3.1,
    }),
    queue({
      name: "notifications.push", ready: 312, unacked: 0, consumers: 6, state: "running",
      publishRate: 14.8, deliverRate: 14.2, ackRate: 14.1, memoryMb: 0.8,
    }),
    queue({
      name: "inventory.sync", type: "quorum", ready: 5420, unacked: 40, consumers: 3,
      state: "degraded", publishRate: 12.1, deliverRate: 9.8, ackRate: 9.6,
      redelivered: 12, memoryMb: 8.6,
    }),
    queue({
      name: "search.index", type: "stream", ready: 9820, unacked: 0, consumers: 2,
      state: "running", publishRate: 56.3, deliverRate: 54.0, ackRate: 54.0,
      memoryMb: 14.2, args: { "x-max-age": "7D" },
    }),
    queue({
      name: "dead-letter.orders", ready: 64, unacked: 0, consumers: 0, state: "idle",
      publishRate: 0.8, deliverRate: 0.8, ackRate: 0.7, memoryMb: 0.2,
    }),
    queue({
      name: "audit.log", type: "quorum", ready: 120, unacked: 0, consumers: 1,
      state: "running", policy: "audit-retention", publishRate: 3.4, deliverRate: 3.3,
      ackRate: 3.3, memoryMb: 4.8,
    }),
    queue({
      name: "session.events", ready: 0, unacked: 0, consumers: 1, state: "running",
      publishRate: 4.6, deliverRate: 4.6, ackRate: 4.6, memoryMb: 0.1,
    }),
    queue({
      name: "image.resize", vhost: "staging", ready: 18, unacked: 2, consumers: 1,
      state: "running", policy: "ha-staging", publishRate: 1.2, deliverRate: 1.1,
      ackRate: 1.1, memoryMb: 0.3,
    }),
    queue({
      name: "billing.invoices", vhost: "staging", type: "quorum", ready: 34, unacked: 0,
      consumers: 1, state: "running", policy: "ha-staging", publishRate: 2.3,
      deliverRate: 2.2, ackRate: 2.2, memoryMb: 0.5,
    }),
    queue({
      name: "analytics.clicks", vhost: "analytics", type: "stream", ready: 182340,
      unacked: 0, consumers: 1, state: "running", publishRate: 120.4, deliverRate: 118.9,
      ackRate: 118.9, memoryMb: 86.4, args: { "x-max-age": "30D" },
    }),
    queue({
      name: "metrics.rollup", vhost: "analytics", ready: 0, unacked: 0, consumers: 1,
      state: "running", policy: "stream-rollup", publishRate: 0.4, deliverRate: 0.4,
      ackRate: 0.4, memoryMb: 0.1,
    }),
  ]

  const exchanges = [
    exchange({ name: "", type: "direct", publishRate: 4.2, deliverRate: 4.0 }),
    exchange({ name: "amq.direct", type: "direct" }),
    exchange({ name: "amq.fanout", type: "fanout" }),
    exchange({ name: "amq.topic", type: "topic", publishRate: 12.6, deliverRate: 12.4 }),
    exchange({ name: "amq.headers", type: "headers" }),
    exchange({ name: "amq.rabbitmq.trace", type: "topic", internal: true }),
    exchange({
      name: "orders", type: "topic", publishRate: 59.4, deliverRate: 55.7,
      args: { "alternate-exchange": "dead-letter" },
    }),
    exchange({ name: "payments", type: "direct", publishRate: 29.6, deliverRate: 28.4 }),
    exchange({ name: "notifications", type: "fanout", publishRate: 46.0, deliverRate: 43.8 }),
    exchange({ name: "dead-letter", type: "fanout", publishRate: 0.8, deliverRate: 0.8 }),
    exchange({ name: "audit", type: "topic", publishRate: 3.4, deliverRate: 3.3 }),
    exchange({ name: "", vhost: "staging", type: "direct", publishRate: 3.5, deliverRate: 3.3 }),
    exchange({ name: "", vhost: "analytics", type: "direct", publishRate: 120.8, deliverRate: 119.3 }),
    exchange({ name: "amq.direct", vhost: "staging", type: "direct" }),
    exchange({ name: "amq.fanout", vhost: "staging", type: "fanout" }),
    exchange({ name: "amq.topic", vhost: "staging", type: "topic" }),
    exchange({ name: "amq.direct", vhost: "analytics", type: "direct" }),
    exchange({ name: "amq.fanout", vhost: "analytics", type: "fanout" }),
    exchange({ name: "amq.topic", vhost: "analytics", type: "topic" }),
    exchange({
      name: "staging.orders", vhost: "staging", type: "topic", publishRate: 3.5,
      deliverRate: 3.3,
    }),
    exchange({
      name: "analytics.ingest", vhost: "analytics", type: "topic", publishRate: 120.8,
      deliverRate: 119.3,
    }),
  ]

  const bindings = [
    binding("orders", "orders.created", "orders.created"),
    binding("orders", "orders.processed", "orders.processed"),
    binding("orders", "audit.log", "orders.#"),
    binding("payments", "payments.authorized", "authorize"),
    binding("payments", "payments.capture", "capture"),
    binding("notifications", "notifications.email", ""),
    binding("notifications", "notifications.push", ""),
    binding("dead-letter", "dead-letter.orders", ""),
    binding("audit", "audit.log", "audit.#"),
    binding("amq.topic", "search.index", "search.*"),
    binding("staging.orders", "image.resize", "image.resize", "staging"),
    binding("staging.orders", "billing.invoices", "billing.invoice", "staging"),
    binding("analytics.ingest", "analytics.clicks", "clicks.#", "analytics"),
    binding("analytics.ingest", "metrics.rollup", "metrics.#", "analytics"),
  ]

  const connectionSpecs = [
    {
      providedName: "web-frontend-1", user: "app_worker", vhost: "/", node: NODE_1,
      ssl: false, timeout: 60, peer: "10.12.4.21:51244", localPort: 5672,
      connectedAt: ago(134 * MINUTE), recvRate: 4200, sendRate: 620,
      client: { product: "rabbitmq-js", platform: "Node", version: "7.1.0" },
      channels: [
        channel(1, 32, 8, "running", 12.4, 11.9, true),
        channel(2, 16, 2, "running", 21.8, 20.4, true),
        channel(3, 0, 0, "idle", 1.2, 0, false),
        channel(4, 32, 1, "running", 4.2, 4.1, true),
        channel(5, 32, 1, "running", 6.4, 0.8, true),
        channel(6, 0, 0, "running", 0, 1.1, false),
      ],
    },
    {
      providedName: "worker-pool-3", user: "app_worker", vhost: "/", node: NODE_2,
      ssl: false, timeout: 60, peer: "10.12.5.8:40322", localPort: 5672,
      connectedAt: ago(242 * MINUTE), recvRate: 6100, sendRate: 2400,
      client: { product: "pika", platform: "Python", version: "1.3.2" },
      channels: [
        channel(1, 64, 12, "running", 2.1, 16.8, true),
        channel(2, 64, 0, "running", 0.4, 8.4, true),
        channel(3, 16, 0, "running", 0.2, 5.4, false),
        channel(4, 0, 0, "idle", 0, 0, false),
      ],
    },
    {
      providedName: "billing-svc", user: "billing_svc", vhost: "/", node: NODE_3,
      ssl: true, timeout: 30, peer: "10.12.6.33:55110", localPort: 5671,
      connectedAt: ago(52 * MINUTE), recvRate: 1800, sendRate: 540,
      client: { product: "aio-pika", platform: "Python", version: "9.4.1" },
      channels: [
        channel(1, 10, 3, "running", 6.2, 9.6, true),
        channel(2, 10, 0, "running", 3.4, 0, true),
      ],
      sslProtocol: "tlsv1.3", sslCipher: "TLS_AES_256_GCM_SHA384",
      sslKeyExchange: "x25519", sslHash: "sha256",
      peerCertSubject: "CN=billing-svc", peerCertIssuer: "CN=qoder-internal-ca",
      peerCertSerialNumber: "04:A1:7C:22", peerCertValidity: "2027-04-01",
    },
    {
      providedName: "analytics-etl", user: "analytics_etl", vhost: "analytics", node: NODE_1,
      ssl: false, timeout: 60, peer: "10.12.7.2:33812", localPort: 5672,
      connectedAt: ago(19 * MINUTE), recvRate: 950, sendRate: 11800,
      client: { product: "go-amqp", platform: "Go", version: "1.6.0" },
      channels: [
        channel(1, 100, 0, "running", 0.2, 41.2, false),
        channel(2, 500, 0, "running", 0.1, 78.4, false),
        channel(3, 0, 0, "idle", 0, 0, false),
      ],
    },
    {
      providedName: "notifier", user: "app_worker", vhost: "/", node: NODE_2,
      ssl: false, timeout: 60, peer: "10.12.5.19:60210", localPort: 5672,
      connectedAt: ago(451 * MINUTE), recvRate: 420, sendRate: 180,
      client: { product: "amqplib", platform: "Node", version: "0.10.5" },
      channels: [
        channel(1, 20, 0, "running", 0.1, 12.3, false),
        channel(2, 20, 8, "running", 0.1, 9.1, false),
      ],
    },
    {
      providedName: "staging-ci", user: "deploy-bot", vhost: "staging", node: NODE_3,
      ssl: false, timeout: 20, peer: "10.12.9.14:47120", localPort: 5672,
      connectedAt: ago(4 * MINUTE), recvRate: 140, sendRate: 45,
      client: { product: "qoder-runner", platform: "Node", version: "2.1" },
      channels: [channel(1, 0, 0, "running", 0.4, 0.4, false)],
    },
    {
      providedName: "management-ui", user: "admin", vhost: "/", node: NODE_1,
      protocol: "HTTP", ssl: true, timeout: 0, peer: "127.0.0.1:49812", localPort: 15672,
      connectedAt: ago(26 * MINUTE), recvRate: 90, sendRate: 260,
      client: { product: "qoder-rabbit-ui", platform: "Browser", version: "1.0" },
      channels: [channel(1, 0, 0, "idle", 0, 0, false), channel(2, 0, 0, "idle", 0, 0, false)],
    },
    {
      providedName: "grafana-scraper", user: "monitoring", vhost: "/", node: NODE_1,
      protocol: "HTTP", ssl: true, timeout: 0, peer: "10.12.10.5:51902", localPort: 15672,
      connectedAt: ago(724 * MINUTE), recvRate: 55, sendRate: 30,
      client: { product: "prometheus", platform: "Go", version: "2.54" },
      channels: [channel(1, 0, 0, "idle", 0, 0, false)],
    },
    {
      providedName: "orders-edge", user: "app_worker", vhost: "/", node: NODE_3,
      ssl: false, timeout: 60, peer: "10.12.4.40:50002", localPort: 5672,
      connectedAt: ago(68 * MINUTE), recvRate: 3300, sendRate: 820,
      client: { product: "amqplib", platform: "Node", version: "0.10.5" },
      channels: [
        channel(1, 32, 5, "running", 7.8, 10.2, true),
        channel(2, 32, 0, "running", 4.6, 5.8, true),
        channel(3, 0, 0, "idle", 0, 0, false),
      ],
    },
  ]

  const connections = connectionSpecs.map((spec) => {
    const host = spec.node.replace("rabbit@", "")
    const localPort = spec.localPort ?? 5672
    const name = `${spec.peer} -> ${host}:${localPort}`
    return {
      name,
      node: spec.node,
      vhost: spec.vhost,
      user: spec.user,
      user_provided_name: spec.providedName,
      auth_mechanism: "PLAIN",
      ssl: Boolean(spec.ssl),
      protocol: spec.protocol ?? "AMQP 0-9-1",
      host,
      port: localPort,
      peer_host: spec.peer.split(":")[0],
      peer_port: Number(spec.peer.split(":")[1]),
      state: "running",
      channels: spec.channels.length,
      connected_at: spec.connectedAt,
      timeout: spec.timeout,
      frame_max: 131072,
      channel_max: 2047,
      recv_oct: Math.round(spec.recvRate * 3600),
      send_oct: Math.round(spec.sendRate * 3600),
      recv_cnt: Math.round(spec.recvRate / 12),
      send_cnt: Math.round(spec.sendRate / 12),
      send_pend: 0,
      reductions: Math.round(spec.recvRate * 8),
      type: "network",
      recv_oct_details: { rate: spec.recvRate },
      send_oct_details: { rate: spec.sendRate },
      reductions_details: { rate: Math.round(spec.recvRate / 6) },
      client_properties: {
        product: spec.client.product,
        platform: spec.client.platform,
        version: spec.client.version,
        connection_name: spec.providedName,
        capabilities: {
          authentication_failure_close: true,
          basic_nack: true,
          consumer_cancel_notify: true,
          exchange_exchange_bindings: true,
          publisher_confirms: true,
        },
      },
      ssl_protocol: spec.ssl ? (spec.sslProtocol ?? "tlsv1.3") : undefined,
      ssl_cipher: spec.ssl ? (spec.sslCipher ?? "TLS_AES_256_GCM_SHA384") : undefined,
      ssl_key_exchange: spec.ssl ? (spec.sslKeyExchange ?? "x25519") : undefined,
      ssl_hash: spec.ssl ? (spec.sslHash ?? "sha256") : undefined,
      peer_cert_subject: spec.peerCertSubject,
      peer_cert_issuer: spec.peerCertIssuer,
      peer_cert_serial_number: spec.peerCertSerialNumber,
      peer_cert_validity: spec.peerCertValidity,
      user_who_performed_action: "admin",
      garbage_collection: {
        max_heap_size: 0,
        min_heap_size: 233,
        min_bin_vheap_size: 46422,
        max_bin_vheap_size: 46422,
        fullsweep_after: 65535,
        minor_gcs: 4211,
      },
      _channels: spec.channels,
    }
  })

  const channels = []
  for (const connection of connections) {
    for (const spec of connection._channels) {
      channels.push({
        name: `${connection.name} (${spec.number})`,
        number: spec.number,
        node: connection.node,
        user: connection.user,
        vhost: connection.vhost,
        connection_details: {
          name: connection.name,
          peer_host: connection.peer_host,
          peer_port: connection.peer_port,
        },
        state: spec.state,
        confirm: spec.confirm,
        transactional: false,
        prefetch_count: spec.prefetch,
        messages_unacknowledged: spec.unacked,
        consumer_count: 0,
        message_stats: {
          publish_details: { rate: spec.publishRate },
          deliver_details: { rate: spec.deliverRate },
          ack_details: { rate: Math.max(0, spec.deliverRate - 0.3) },
        },
      })
    }
    delete connection._channels
  }

  const consumerSpecs = [
    ["ctag-orders-00", "orders.created", 0, 1, 32, true],
    ["ctag-orders-01", "orders.created", 1, 1, 64, true],
    ["ctag-orders-02", "orders.created", 8, 1, 32, true],
    ["ctag-orders-03", "orders.created", 8, 2, 32, true],
    ["ctag-processed-00", "orders.processed", 1, 2, 64, true],
    ["ctag-processed-01", "orders.processed", 8, 2, 32, true],
    ["ctag-payments-auth-00", "payments.authorized", 2, 1, 10, true],
    ["ctag-payments-auth-01", "payments.authorized", 2, 1, 10, true],
    ["ctag-capture-00", "payments.capture", 2, 2, 10, true],
    ["ctag-capture-01", "payments.capture", 0, 6, 0, true],
    ["ctag-email-00", "notifications.email", 0, 1, 32, true],
    ["ctag-email-01", "notifications.email", 0, 1, 32, true],
    ["ctag-email-02", "notifications.email", 1, 3, 16, true],
    ["ctag-email-03", "notifications.email", 4, 1, 20, true],
    ["ctag-email-04", "notifications.email", 4, 1, 20, true],
    ["ctag-email-05", "notifications.email", 4, 2, 20, true],
    ["ctag-push-00", "notifications.push", 0, 2, 16, true],
    ["ctag-push-01", "notifications.push", 0, 2, 16, true],
    ["ctag-push-02", "notifications.push", 0, 2, 16, true],
    ["ctag-push-03", "notifications.push", 4, 1, 20, true],
    ["ctag-push-04", "notifications.push", 4, 1, 20, true],
    ["ctag-push-05", "notifications.push", 4, 2, 20, true],
    ["ctag-inventory-00", "inventory.sync", 1, 1, 64, true],
    ["ctag-inventory-01", "inventory.sync", 1, 4, 0, true],
    ["ctag-inventory-02", "inventory.sync", 8, 3, 32, true],
    ["ctag-search-00", "search.index", 3, 1, 100, false],
    ["ctag-search-01", "search.index", 3, 3, 100, false],
    ["ctag-audit-00", "audit.log", 4, 2, 20, true],
    ["ctag-session-00", "session.events", 5, 1, 0, true],
    ["ctag-resize-00", "image.resize", 5, 1, 0, true],
    ["ctag-invoice-00", "billing.invoices", 2, 1, 10, true],
    ["ctag-clicks-00", "analytics.clicks", 3, 2, 500, false],
    ["ctag-rollup-00", "metrics.rollup", 3, 2, 500, true],
  ]

  const consumers = consumerSpecs.map(([tag, queueName, connectionIndex, number, prefetch, ack]) => {
    const connection = connections[connectionIndex]
    const channel = channels.find(
      (entry) => entry.connection_details.name === connection.name && entry.number === number
    )
    return {
      consumer_tag: tag,
      queue: { name: queueName, vhost: connection.vhost },
      channel_details: {
        name: channel.name,
        connection_name: connection.name,
        number,
        node: connection.node,
        peer_host: connection.peer_host,
        peer_port: connection.peer_port,
      },
      ack_required: ack,
      exclusive: false,
      prefetch_count: prefetch,
      active: true,
      activity_status: "up",
      connected_at: connection.connected_at,
      arguments: {},
    }
  })

  for (const channel of channels) {
    channel.consumer_count = consumers.filter(
      (consumer) => consumer.channel_details.name === channel.name
    ).length
  }
  for (const queueEntry of queues) {
    queueEntry.consumers = consumers.filter(
      (consumer) =>
        consumer.queue.name === queueEntry.name && consumer.queue.vhost === queueEntry.vhost
    ).length
  }

  const users = [
    { name: "admin", tags: "administrator", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
    { name: "guest", tags: "administrator", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
    { name: "app_worker", tags: "management,policymaker", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
    { name: "billing_svc", tags: "management", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
    { name: "analytics_etl", tags: "management", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
    { name: "monitoring", tags: "monitoring", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
    { name: "deploy-bot", tags: "management,policymaker", password_hash: "rabbit_password_hashing_sha256", hashing_algorithm: "rabbit_password_hashing_sha256" },
  ]

  const permissions = [
    permission("admin", "/"),
    permission("admin", "staging"),
    permission("admin", "analytics"),
    permission("guest", "/"),
    permission("app_worker", "/"),
    permission("app_worker", "staging"),
    permission("billing_svc", "/"),
    permission("analytics_etl", "analytics"),
    permission("monitoring", "/"),
    permission("deploy-bot", "staging"),
  ]

  const policies = [
    policy("orders-dlx", "/", "^orders\\.", "queues", 2, {
      "dead-letter-exchange": "dead-letter",
      "message-ttl": 86_400_000,
    }),
    policy("email-retry", "/", "^notifications\\.email$", "queues", 0, {
      "max-length": 50_000,
      overflow: "reject-publish",
    }),
    policy("audit-retention", "/", "^audit\\.", "queues", 1, { "max-length": 500_000 }),
    policy("ha-staging", "staging", ".*", "queues", 0, {
      "ha-mode": "all",
      "ha-sync-mode": "automatic",
    }),
    policy("stream-rollup", "analytics", "^metrics\\.", "queues", 1, {
      "max-length-bytes": 1_073_741_824,
    }),
  ]

  const operatorPolicies = [
    policy("operator-email-cap", "/", "^notifications\\.", "queues", 10, {
      "max-length": 100_000,
      overflow: "reject-publish",
    }),
    policy("operator-audit-retention", "/", "^audit\\.", "queues", 10, {
      "max-length": 250_000,
    }),
  ]

  const vhostLimits = [
    { vhost: "/", value: { "max-connections": 1024, "max-queues": 2048 } },
    { vhost: "staging", value: { "max-connections": 256, "max-queues": 512 } },
    { vhost: "analytics", value: { "max-connections": 512, "max-queues": 1024 } },
  ]

  const featureFlags = [
    featureFlag("rabbitmq_management", true, "stable", "Management plugin and HTTP API"),
    featureFlag("rabbitmq_quorum_queue", true, "stable", "Replicated, durable queues for critical workloads"),
    featureFlag("rabbitmq_stream", true, "stable", "Stream protocol and stream queues"),
    featureFlag("rabbitmq_stream_management", true, "stable", "Management integration for stream queues"),
    featureFlag("rabbitmq_shovels", true, "stable", "Move messages between brokers"),
    featureFlag("rabbitmq_consistent_hash_exchange", true, "stable", "Consistent hash exchange routing"),
    featureFlag("rabbitmq_mqtt", true, "stable", "MQTT protocol adapter"),
    featureFlag("rabbitmq_amqp1_0", false, "experimental", "AMQP 1.0 protocol adapter"),
    featureFlag("rabbitmq_web_mqtt", false, "experimental", "MQTT over WebSocket transport"),
  ]

  const deprecatedFeatures = [
    deprecated(
      "amqp_address_v1",
      "denied_by_default",
      "The version 1 AMQP 0-9-1 address format is denied by default. Use AMQP address v2."
    ),
    deprecated(
      "classic_queue_mirroring",
      "removed",
      "Classic mirrored queues were removed in RabbitMQ 4.0. Use quorum queues or streams for replication."
    ),
    deprecated(
      "global_qos",
      "removed",
      "Global QoS was removed in RabbitMQ 4.0. Set prefetch per consumer instead."
    ),
    deprecated(
      "management_metrics_collection",
      "permitted_by_default",
      "Legacy management metrics collection is deprecated in favour of the Prometheus plugin."
    ),
    deprecated(
      "ram_node_type",
      "permitted_by_default",
      "RAM nodes are deprecated. Use disk nodes only."
    ),
    deprecated(
      "transient_nonexcl_queues",
      "permitted_by_default",
      "Queues that are both non-durable and non-exclusive are deprecated. Use durable queues with a TTL."
    ),
  ]

  return {
    overview: {
      management_version: "4.1.2",
      rabbitmq_version: "4.1.2",
      erlang_version: "27.1.2",
      erlang_full_version: "Erlang/OTP 27 [erts-15.1.2]",
      product_name: "RabbitMQ",
      product_version: "4.1.2",
      cluster_name: "qoder-rabbit",
      node: NODE_1,
      rates_mode: "basic",
      default_queue_type: "classic",
      disable_stats: false,
      enable_queue_totals: true,
      is_op_policy_updating_enabled: true,
      listeners,
      contexts,
      exchange_types: [
        { name: "direct", description: "AMQP direct exchange", enabled: true },
        { name: "fanout", description: "AMQP fanout exchange", enabled: true },
        { name: "topic", description: "AMQP topic exchange", enabled: true },
        { name: "headers", description: "AMQP headers exchange", enabled: true },
      ],
      sample_retention_policies: {
        global: [600, 3600, 28_800, 86_400],
        basic: [600, 3600, 28_800, 86_400],
        detailed: [600, 3600, 28_800, 86_400],
      },
    },
    nodes,
    vhosts,
    queues,
    exchanges,
    bindings,
    consumers,
    channels,
    connections,
    users,
    permissions,
    policies,
    operatorPolicies,
    vhostLimits,
    featureFlags,
    deprecatedFeatures,
  }
}

function queue({
  name,
  vhost = "/",
  type = "classic",
  durable = true,
  autoDelete = false,
  exclusive = false,
  state = "running",
  ready = 0,
  unacked = 0,
  consumers = 0,
  policy = null,
  args = {},
  publishRate = 0,
  deliverRate = 0,
  ackRate = 0,
  redelivered = 0,
  memoryMb = 0,
}) {
  return {
    name,
    vhost,
    type,
    durable,
    auto_delete: autoDelete,
    exclusive,
    state,
    messages_ready: ready,
    messages_unacknowledged: unacked,
    consumers,
    consumer_utilisation: null,
    memory: memoryMb * MB,
    policy,
    arguments: { "x-queue-type": type, ...args },
    exclusive_consumer_tag: null,
    node: NODE_1,
    message_stats: {
      publish: 0,
      publish_details: { rate: publishRate },
      deliver: 0,
      deliver_details: { rate: deliverRate },
      ack: 0,
      ack_details: { rate: ackRate },
      redeliver: redelivered,
      redeliver_details: { rate: 0 },
    },
  }
}

function exchange({ name, vhost = "/", type = "direct", durable = true, autoDelete = false, internal = false, args = {}, publishRate = 0, deliverRate = 0 }) {
  return {
    name,
    vhost,
    type,
    durable,
    auto_delete: autoDelete,
    internal,
    arguments: args,
    message_stats: {
      publish: 0,
      publish_details: { rate: publishRate },
      deliver: 0,
      deliver_details: { rate: deliverRate },
    },
  }
}

function binding(source, destination, routingKey, vhost = "/", destinationType = "queue") {
  return {
    source,
    vhost,
    destination,
    destination_type: destinationType,
    routing_key: routingKey,
    arguments: {},
  }
}

function channel(number, prefetch, unacked, state, publishRate, deliverRate, confirm) {
  return { number, prefetch, unacked, state, publishRate, deliverRate, confirm }
}

function permission(user, vhost) {
  return { user, vhost, configure: ".*", write: ".*", read: ".*" }
}

function policy(name, vhost, pattern, applyTo, priority, definition) {
  return { name, vhost, pattern, "apply-to": applyTo, priority, definition }
}

function featureFlag(name, enabled, stability, desc) {
  return { name, state: enabled ? "enabled" : "disabled", stability, desc }
}

function deprecated(name, state, desc) {
  return { name, state, desc }
}
