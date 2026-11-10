import type {
  ClusterInfo,
  Connection,
  NodeInfo,
  PortInfo,
  Queue,
  WebContext,
} from "@/data/types"
import { apiDelete, apiGet, apiPostForm } from "@/lib/api"
import type { ClusterTotals } from "@/lib/format"

interface ApiSample {
  sample: number
  timestamp: number
}

interface ApiRateDetails {
  rate: number
  samples?: ApiSample[]
  avg_rate?: number
  avg?: number
}

interface ApiExchangeType {
  name: string
  description: string
  enabled: boolean
}

interface ApiChurnRates {
  connection_closed: number
  connection_created: number
  channel_closed: number
  channel_created: number
  queue_created: number
  queue_deleted: number
  queue_declared: number
  connection_closed_details?: ApiRateDetails
  connection_created_details?: ApiRateDetails
  channel_closed_details?: ApiRateDetails
  channel_created_details?: ApiRateDetails
  queue_created_details?: ApiRateDetails
  queue_deleted_details?: ApiRateDetails
  queue_declared_details?: ApiRateDetails
}

interface ApiQueueTotals {
  messages?: number
  messages_ready?: number
  messages_unacknowledged?: number
  message_stats?: Record<string, number | ApiRateDetails>
}

interface ApiOverview {
  crypto_lib_version?: string
  product_name?: string
  product_version?: string
  rabbitmq_version: string
  management_version?: string
  erlang_version: string
  erlang_full_version?: string
  cluster_name: string
  rates_mode?: string
  sample_retention_policies?: {
    global: number[]
    basic: number[]
    detailed: number[]
  }
  exchange_types?: ApiExchangeType[]
  cluster_tags?: Record<string, string[]>
  node_tags?: Record<string, string[]>
  disable_stats?: boolean
  default_queue_type?: string
  is_op_policy_updating_enabled?: boolean
  enable_queue_totals?: boolean
  definitions?: {
    require_definition_json_extension: boolean
  }
  require_definition_json_extension?: boolean
  message_stats?: Record<string, number | ApiRateDetails>
  churn_rates?: ApiChurnRates
  queue_totals?: ApiQueueTotals
  object_totals: {
    queues: number
    exchanges: number
    channels: number
    consumers: number
    connections: number
  }
  statistics_db_event_queue?: number
  node: string
  listeners?: ApiListener[]
  contexts?: ApiContext[]
}

interface ApiListener {
  node: string
  protocol: string
  ip_address?: string
  port: number
  socket_opts?: unknown[] | Record<string, unknown>
  tls: boolean
}

interface ApiContext {
  node: string
  description: string
  path: string
  port: number | string
  protocol?: string
  ssl_opts?: unknown[]
  cowboy_opts?: string
}

interface ApiNode {
  name: string
  type: "disc" | "ram"
  uptime: number
  mem_used: number
  mem_limit: number
  disk_free: number
  disk_free_limit: number
  fd_used: number
  fd_total: number
  sockets_used: number
  proc_used: number
  running: boolean
}

interface ApiQueue {
  name: string
  vhost: string
  type?: string
  durable: boolean
  auto_delete: boolean
  exclusive: boolean
  state?: string
  messages_ready?: number
  messages_unacknowledged?: number
  consumers?: number
  memory?: number
  policy?: string
  arguments?: Record<string, unknown>
  message_stats?: {
    publish_details?: { rate: number }
    deliver_details?: { rate: number }
    ack_details?: { rate: number }
    redeliver?: number
  }
}

interface ApiConnection {
  name: string
  user: string
  vhost: string
  node: string
  protocol: string
  auth_mechanism: string
  ssl: boolean
  channels: number
  state: string
  host: string
  port: number
  peer_host: string
  peer_port: number
  connected_at: number
  timeout: number
  recv_oct_details?: { rate: number }
  send_oct_details?: { rate: number }
  user_provided_name?: string | null
  client_properties?: {
    connection_name?: string
    product?: string
    platform?: string
    version?: string
  }
}

interface ApiConnectionDetail
  extends Omit<
    ApiConnection,
    "recv_oct_details" | "send_oct_details" | "client_properties"
  > {
  recv_oct_details: ApiRateDetails
  send_oct_details: ApiRateDetails
  reductions_details?: ApiRateDetails
  recv_oct: number
  send_oct: number
  recv_cnt: number
  send_cnt: number
  send_pend: number
  reductions: number
  type: string
  frame_max: number
  channel_max: number
  ssl_protocol?: string
  ssl_hash?: string
  ssl_cipher?: string
  ssl_key_exchange?: string
  peer_cert_subject?: string
  peer_cert_issuer?: string
  peer_cert_serial_number?: string
  peer_cert_validity?: string
  user_who_performed_action?: string
  client_properties?: Record<string, unknown>
  garbage_collection?: Record<string, unknown>
}

export interface ConnectionRateSample {
  sample: number
  timestamp: number
}

export interface ConnectionRate {
  rate: number
  avgRate: number
  avg: number
  samples: ConnectionRateSample[]
}

export interface ConnectionDetail {
  name: string
  client: string
  user: string
  userProvidedName: string | null
  userWhoPerformedAction: string | null
  vhost: string
  node: string
  type: string
  state: string
  protocol: string
  authMechanism: string
  ssl: boolean
  sslProtocol: string
  sslHash: string
  sslCipher: string
  sslKeyExchange: string
  peerCertSubject: string
  peerCertIssuer: string
  peerCertSerialNumber: string
  peerCertValidity: string
  host: string
  port: number
  peerHost: string
  peerPort: number
  connectedAt: number
  timeout: number
  channels: number
  frameMax: number
  channelMax: number
  sendPending: number
  recvOct: number
  sendOct: number
  recvCount: number
  sendCount: number
  reductions: number
  recv: ConnectionRate
  send: ConnectionRate
  reductionsRate: ConnectionRate | null
  clientProperties: Record<string, unknown>
  garbageCollection: Record<string, unknown> | null
}

interface ApiConnectionsResponse {
  total_count: number
  item_count: number
  filtered_count: number
  page: number
  page_size: number
  page_count: number
  items: ApiConnection[]
}

export interface ConnectionsPage {
  items: Connection[]
  totalCount: number
  filteredCount: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ConnectionsQuery {
  page: number
  pageSize: number
  name?: string
  vhost?: string
  sort?: string
  sortReverse?: boolean
}

export interface RabbitSnapshot {
  cluster: ClusterInfo
  nodes: NodeInfo[]
  ports: PortInfo[]
  webContexts: WebContext[]
  queues: Queue[]
  totals: ClusterTotals
}

const PROTOCOL_LABELS: Record<string, string> = {
  amqp: "AMQP 0-9-1",
  amqps: "AMQP 0-9-1",
  clustering: "Clustering",
  http: "HTTP API",
  https: "HTTPS API",
  "http/prometheus": "Prometheus",
  mqtt: "MQTT",
  "web-mqtt": "Web MQTT",
  stomp: "STOMP",
  stream: "Stream",
}

const BYTES_PER_GB = 1024 * 1024 * 1024

function mapNodes(nodes: ApiNode[]): NodeInfo[] {
  return nodes.map((node) => ({
    name: node.name,
    type: node.type,
    uptime: node.uptime,
    memory: node.mem_used / BYTES_PER_GB,
    memoryMax: node.mem_limit / BYTES_PER_GB,
    diskFree: node.disk_free / BYTES_PER_GB,
    diskMax: (node.disk_free + node.disk_free_limit) / BYTES_PER_GB,
    fd: node.fd_used,
    fdMax: node.fd_total,
    sockets: node.sockets_used,
    processes: node.proc_used,
    cpu: null,
    running: node.running,
  }))
}

function mapPorts(listeners: ApiListener[]): PortInfo[] {
  const grouped = new Map<
    string,
    { listener: ApiListener; nodes: Set<string> }
  >()
  for (const listener of listeners) {
    const key = `${listener.protocol}:${listener.port}`
    const entry = grouped.get(key)
    if (entry) {
      entry.nodes.add(listener.node)
    } else {
      grouped.set(key, { listener, nodes: new Set([listener.node]) })
    }
  }

  return [...grouped.values()]
    .map(({ listener, nodes }) => ({
      port: listener.port,
      protocol: PROTOCOL_LABELS[listener.protocol] ?? listener.protocol,
      tls: listener.tls,
      nodes: nodes.size,
      context: listener.protocol,
    }))
    .sort((a, b) => a.port - b.port)
}

function mapWebContexts(
  contexts: ApiContext[],
  listeners: ApiListener[]
): WebContext[] {
  const tlsByNodePort = new Map(
    listeners.map((listener) => [
      `${listener.node}:${listener.port}`,
      listener.tls,
    ])
  )

  return contexts.map((context) => {
    const port = Number(context.port)
    return {
      description: context.description,
      path: context.path,
      port,
      tls: tlsByNodePort.get(`${context.node}:${port}`) ?? false,
      node: context.node,
    }
  })
}

function queueState(state: string | undefined): Queue["state"] {
  if (state === "running" || state === "idle") return state
  return "degraded"
}

function queueType(type: string | undefined): Queue["type"] {
  if (type === "quorum" || type === "stream") return type
  return "classic"
}

function queueArguments(
  args: Record<string, unknown> | undefined
): Record<string, string | number> {
  const mapped: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(args ?? {})) {
    if (typeof value === "string" || typeof value === "number") {
      mapped[key] = value
    }
  }
  return mapped
}

function mapQueues(queues: ApiQueue[]): Queue[] {
  const created = new Date().getTime()
  return queues.map((queue) => {
    const stats = queue.message_stats ?? {}
    return {
      name: queue.name,
      vhost: queue.vhost,
      type: queueType(queue.type),
      durable: queue.durable,
      autoDelete: queue.auto_delete,
      exclusive: queue.exclusive,
      state: queueState(queue.state),
      ready: queue.messages_ready ?? 0,
      unacked: queue.messages_unacknowledged ?? 0,
      consumers: queue.consumers ?? 0,
      publishRate: stats.publish_details?.rate ?? 0,
      deliverRate: stats.deliver_details?.rate ?? 0,
      ackRate: stats.ack_details?.rate ?? 0,
      redelivered: stats.redeliver ?? 0,
      memory: (queue.memory ?? 0) / BYTES_PER_GB,
      policy: queue.policy ?? null,
      args: queueArguments(queue.arguments),
      created,
    }
  })
}

function mapConnection(connection: ApiConnection): Connection {
  const properties = connection.client_properties ?? {}
  const client = [properties.product, properties.platform].filter(
    (part): part is string => typeof part === "string" && part.length > 0
  )

  return {
    id: connection.name,
    name: connection.name,
    userProvidedName:
      connection.user_provided_name ?? properties.connection_name ?? null,
    authMechanism: connection.auth_mechanism,
    user: connection.user,
    vhost: connection.vhost,
    node: connection.node,
    protocol: connection.protocol,
    ssl: connection.ssl,
    channels: connection.channels,
    state: connection.state,
    from: `${connection.peer_host}:${connection.peer_port}`,
    peer: `${connection.host}:${connection.port}`,
    connectedAt: connection.connected_at,
    heartbeat: connection.timeout,
    recvRate: connection.recv_oct_details?.rate ?? 0,
    sendRate: connection.send_oct_details?.rate ?? 0,
    client: client.length > 0 ? client.join(" / ") : "Unknown",
    clientVersion: properties.version,
  }
}

function mapRate(details: ApiRateDetails | undefined): ConnectionRate {
  return {
    rate: details?.rate ?? 0,
    avgRate: details?.avg_rate ?? 0,
    avg: details?.avg ?? 0,
    samples: (details?.samples ?? []).map((sample) => ({
      sample: sample.sample,
      timestamp: sample.timestamp,
    })),
  }
}

function mapConnectionDetail(detail: ApiConnectionDetail): ConnectionDetail {
  const properties = detail.client_properties ?? {}
  const client = [properties.product, properties.platform].filter(
    (part): part is string => typeof part === "string" && part.length > 0
  )

  return {
    name: detail.name,
    client: client.length > 0 ? client.join(" / ") : "Unknown",
    user: detail.user,
    userProvidedName: detail.user_provided_name ?? null,
    userWhoPerformedAction: detail.user_who_performed_action ?? null,
    vhost: detail.vhost,
    node: detail.node,
    type: detail.type,
    state: detail.state,
    protocol: detail.protocol,
    authMechanism: detail.auth_mechanism,
    ssl: detail.ssl,
    sslProtocol: detail.ssl_protocol ?? "",
    sslHash: detail.ssl_hash ?? "",
    sslCipher: detail.ssl_cipher ?? "",
    sslKeyExchange: detail.ssl_key_exchange ?? "",
    peerCertSubject: detail.peer_cert_subject ?? "",
    peerCertIssuer: detail.peer_cert_issuer ?? "",
    peerCertSerialNumber: detail.peer_cert_serial_number ?? "",
    peerCertValidity: detail.peer_cert_validity ?? "",
    host: detail.host,
    port: detail.port,
    peerHost: detail.peer_host,
    peerPort: detail.peer_port,
    connectedAt: detail.connected_at,
    timeout: detail.timeout,
    channels: detail.channels,
    frameMax: detail.frame_max,
    channelMax: detail.channel_max,
    sendPending: detail.send_pend,
    recvOct: detail.recv_oct,
    sendOct: detail.send_oct,
    recvCount: detail.recv_cnt,
    sendCount: detail.send_cnt,
    reductions: detail.reductions,
    recv: mapRate(detail.recv_oct_details),
    send: mapRate(detail.send_oct_details),
    reductionsRate: detail.reductions_details
      ? mapRate(detail.reductions_details)
      : null,
    clientProperties: properties,
    garbageCollection: detail.garbage_collection ?? null,
  }
}

function mapTotals(overview: ApiOverview, queues: Queue[]): ClusterTotals {
  const churn = overview.churn_rates
  return {
    queues: overview.object_totals.queues,
    exchanges: overview.object_totals.exchanges,
    connections: overview.object_totals.connections,
    channels: overview.object_totals.channels,
    consumers: overview.object_totals.consumers,
    ready: queues.reduce((sum, queue) => sum + queue.ready, 0),
    unacked: queues.reduce((sum, queue) => sum + queue.unacked, 0),
    publishRate: queues.reduce((sum, queue) => sum + queue.publishRate, 0),
    deliverRate: queues.reduce((sum, queue) => sum + queue.deliverRate, 0),
    ackRate: queues.reduce((sum, queue) => sum + queue.ackRate, 0),
    connectionCreatedRate: churn?.connection_created_details?.rate ?? 0,
    connectionClosedRate: churn?.connection_closed_details?.rate ?? 0,
    channelCreatedRate: churn?.channel_created_details?.rate ?? 0,
    channelClosedRate: churn?.channel_closed_details?.rate ?? 0,
    queueCreatedRate: churn?.queue_created_details?.rate ?? 0,
    queueDeletedRate: churn?.queue_deleted_details?.rate ?? 0,
    queueDeclaredRate: churn?.queue_declared_details?.rate ?? 0,
  }
}

function mapCluster(overview: ApiOverview, nodes: NodeInfo[]): ClusterInfo {
  const now = new Date().getTime()
  const uptime = nodes.find((node) => node.name === overview.node)?.uptime ?? 0
  return {
    name: overview.cluster_name,
    node: overview.node,
    version: overview.rabbitmq_version,
    erlang: overview.erlang_version,
    startedAt: now - uptime,
    trends: {
      ready: 0,
      unacked: 0,
      consumers: 0,
      connections: 0,
      queues: 0,
      exchanges: 0,
    },
  }
}

export async function fetchRabbitSnapshot(
  token: string
): Promise<RabbitSnapshot> {
  const [overview, apiNodes, apiQueues] = await Promise.all([
    apiGet<ApiOverview>("/api/overview", token),
    apiGet<ApiNode[]>("/api/nodes", token),
    apiGet<ApiQueue[]>("/api/queues", token),
  ])

  const nodes = mapNodes(apiNodes)
  const queues = mapQueues(apiQueues)
  const listeners = overview.listeners ?? []

  return {
    cluster: mapCluster(overview, nodes),
    nodes,
    ports: mapPorts(listeners),
    webContexts: mapWebContexts(overview.contexts ?? [], listeners),
    queues,
    totals: mapTotals(overview, queues),
  }
}

export async function fetchConnections(
  token: string,
  query: ConnectionsQuery,
  signal?: AbortSignal
): Promise<ConnectionsPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.pageSize),
    name: query.name ?? "",
    use_regex: "false",
  })

  if (query.sort) {
    params.set("sort", query.sort)
    params.set("sort_reverse", query.sortReverse ? "true" : "false")
  }
  if (query.vhost) params.set("vhost", query.vhost)

  const page = await apiGet<ApiConnectionsResponse>(
    `/api/connections?${params.toString()}`,
    token,
    signal
  )

  return {
    items: page.items.map(mapConnection),
    totalCount: page.total_count,
    filteredCount: page.filtered_count,
    page: page.page,
    pageSize: page.page_size,
    pageCount: page.page_count,
  }
}

export async function fetchConnectionDetail(
  token: string,
  name: string,
  signal?: AbortSignal
): Promise<ConnectionDetail> {
  const params = new URLSearchParams({
    data_rates_age: "60",
    data_rates_incr: "5",
  })
  const detail = await apiGet<ApiConnectionDetail>(
    `/api/connections/${encodeURIComponent(name)}?${params.toString()}`,
    token,
    signal
  )
  return mapConnectionDetail(detail)
}

export async function closeConnection(
  token: string,
  name: string,
  reason: string
): Promise<void> {
  await apiDelete(
    `/api/connections/${encodeURIComponent(name)}`,
    token,
    { reason: reason.trim() || "Closed via management UI" }
  )
}

export async function fetchDefinitions(
  token: string
): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>("/api/definitions", token)
}

export async function uploadDefinitions(
  token: string,
  file: File
): Promise<void> {
  const body = new FormData()
  body.append("file", file)
  await apiPostForm("/api/definitions", body, token)
}
