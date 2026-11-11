import type {
  Binding,
  Channel,
  ClusterInfo,
  Connection,
  Consumer,
  DeprecatedFeature,
  DeprecationPhase,
  Exchange,
  ExchangeType,
  FeatureFlag,
  NodeInfo,
  Policy,
  PortInfo,
  Queue,
  QueueType,
  Stability,
  User,
  Vhost,
  VhostLimit,
  WebContext,
} from "@/data/types"
import { apiDelete, apiGet, apiPost, apiPostForm, apiPut } from "@/lib/api"
import type { ClusterTotals } from "@/lib/format"

const enc = encodeURIComponent

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
  policy?: string | null
  arguments?: Record<string, unknown>
  message_stats?: {
    publish_details?: { rate: number }
    deliver_details?: { rate: number }
    ack_details?: { rate: number }
    redeliver?: number
  }
}

interface ApiExchange {
  name: string
  vhost: string
  type: string
  durable: boolean
  auto_delete: boolean
  internal: boolean
  arguments?: Record<string, unknown>
  message_stats?: {
    publish_details?: { rate: number }
    deliver_details?: { rate: number }
  }
}

interface ApiBinding {
  source: string
  vhost: string
  destination: string
  destination_type: "queue" | "exchange"
  routing_key: string
  arguments?: Record<string, unknown>
}

interface ApiConsumer {
  consumer_tag: string
  queue: { name: string; vhost: string }
  channel_details: { name: string; connection_name: string }
  ack_required: boolean
  exclusive: boolean
  prefetch_count: number
  connected_at?: number
}

interface ApiChannel {
  name: string
  number: number
  connection_details: { name: string }
  user: string
  vhost: string
  node: string
  prefetch_count: number
  messages_unacknowledged: number
  messages_uncommitted?: number
  messages_unconfirmed?: number
  acks_uncommitted?: number
  consumer_count: number
  state: string
  confirm: boolean
  transactional: boolean
  message_stats?: {
    publish_details?: { rate: number }
    deliver_details?: { rate: number }
  }
}

interface ApiUser {
  name: string
  tags: string | string[]
  password_hash: string
  hashing_algorithm?: string
}

interface ApiPermission {
  user: string
  vhost: string
  configure: string
  write: string
  read: string
}

interface ApiVhost {
  name: string
  description?: string
  tracing?: boolean
}

interface ApiPolicy {
  name: string
  vhost: string
  pattern: string
  "apply-to": string
  priority: number
  definition: Record<string, unknown>
}

interface ApiVhostLimit {
  vhost: string
  value: Record<string, unknown> | string
}

interface ApiFeatureFlag {
  name: string
  state: string | boolean
  stability?: string
  desc?: string
}

interface ApiDeprecatedFeature {
  name: string
  state?: string
  phase?: string
  desc?: string
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

interface ApiChannelsResponse {
  total_count: number
  item_count: number
  filtered_count: number
  page: number
  page_size: number
  page_count: number
  items: ApiChannel[]
}

export interface ChannelsPage {
  items: Channel[]
  totalCount: number
  filteredCount: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ChannelsQuery {
  page: number
  pageSize: number
  name?: string
  sort?: string
  sortReverse?: boolean
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
  exchanges: Exchange[]
  bindings: Binding[]
  consumers: Consumer[]
  connections: Connection[]
  channels: Channel[]
  users: User[]
  vhosts: Vhost[]
  policies: Policy[]
  operatorPolicies: Policy[]
  limits: VhostLimit[]
  flags: FeatureFlag[]
  deprecatedFeatures: DeprecatedFeature[]
  totals: ClusterTotals
}

export interface CreateQueueInput {
  name: string
  vhost: string
  type: QueueType
  durable: boolean
  autoDelete: boolean
  args?: Record<string, string | number>
}

export interface CreateExchangeInput {
  name: string
  vhost: string
  type: ExchangeType
  durable: boolean
  autoDelete: boolean
  internal: boolean
  args?: Record<string, string | number>
}

export interface CreateUserInput {
  username: string
  password: string
  tags: string[]
  vhosts: string[]
}

export interface CreateVhostInput {
  name: string
  description: string
  tracing: boolean
}

export interface PublishInput {
  vhost: string
  exchange: string
  routingKey: string
  payload: string
  count: number
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

const BYTES_PER_MB = 1024 * 1024
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

function queueType(queue: ApiQueue): QueueType {
  const declared = queue.arguments?.["x-queue-type"]
  const type = typeof declared === "string" ? declared : queue.type
  if (type === "quorum" || type === "stream") return type
  return "classic"
}

function exchangeType(type: string): ExchangeType {
  if (type === "fanout" || type === "topic" || type === "headers") return type
  return "direct"
}

function plainArguments(
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
  return queues.map((queue) => {
    const stats = queue.message_stats ?? {}
    return {
      name: queue.name,
      vhost: queue.vhost,
      type: queueType(queue),
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
      memory: (queue.memory ?? 0) / BYTES_PER_MB,
      policy: queue.policy ?? null,
      args: plainArguments(queue.arguments),
    }
  })
}

function mapExchanges(exchanges: ApiExchange[]): Exchange[] {
  return exchanges.map((exchange) => ({
    name: exchange.name,
    vhost: exchange.vhost,
    type: exchangeType(exchange.type),
    durable: exchange.durable,
    autoDelete: exchange.auto_delete,
    internal: exchange.internal,
    publishRate: exchange.message_stats?.publish_details?.rate ?? 0,
    deliverRate: exchange.message_stats?.deliver_details?.rate ?? 0,
    args: plainArguments(exchange.arguments),
  }))
}

function mapBindings(bindings: ApiBinding[]): Binding[] {
  return bindings.map((binding) => ({
    source: binding.source,
    vhost: binding.vhost,
    destination: binding.destination,
    destType: binding.destination_type === "exchange" ? "exchange" : "queue",
    routingKey: binding.routing_key,
    args: plainArguments(binding.arguments),
  }))
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

function mapChannels(channels: ApiChannel[]): Channel[] {
  return channels.map((channel) => ({
    id: channel.name,
    number: channel.number,
    connection: channel.connection_details.name,
    user: channel.user,
    vhost: channel.vhost,
    node: channel.node,
    prefetch: channel.prefetch_count,
    unacked: channel.messages_unacknowledged,
    consumers: channel.consumer_count,
    messagesUncommitted: channel.messages_uncommitted ?? 0,
    messagesUnconfirmed: channel.messages_unconfirmed ?? 0,
    acksUncommitted: channel.acks_uncommitted ?? 0,
    state: channel.state,
    publishRate: channel.message_stats?.publish_details?.rate ?? 0,
    deliverRate: channel.message_stats?.deliver_details?.rate ?? 0,
    confirmMode: channel.confirm,
    transactional: channel.transactional,
  }))
}

function mapConsumers(
  consumers: ApiConsumer[],
  connections: Connection[]
): Consumer[] {
  const connectedAt = new Map(
    connections.map((connection) => [connection.id, connection.connectedAt])
  )
  const now = new Date().getTime()

  return consumers.map((consumer) => ({
    tag: consumer.consumer_tag,
    queue: consumer.queue.name,
    channel: consumer.channel_details.name,
    connection: consumer.channel_details.connection_name,
    ackRequired: consumer.ack_required,
    exclusive: consumer.exclusive,
    prefetch: consumer.prefetch_count,
    since:
      consumer.connected_at ??
      connectedAt.get(consumer.channel_details.connection_name) ??
      now,
  }))
}

function mapUsers(users: ApiUser[], permissions: ApiPermission[]): User[] {
  const vhostsByUser = new Map<string, string[]>()
  for (const permission of permissions) {
    const list = vhostsByUser.get(permission.user) ?? []
    list.push(permission.vhost)
    vhostsByUser.set(permission.user, list)
  }

  return users.map((user) => ({
    username: user.name,
    tags: Array.isArray(user.tags)
      ? user.tags
      : String(user.tags ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    vhosts: vhostsByUser.get(user.name) ?? [],
    hash:
      user.password_hash ||
      user.hashing_algorithm ||
      "rabbit_password_hashing_sha256",
  }))
}

function mapVhosts(vhosts: ApiVhost[]): Vhost[] {
  return vhosts.map((vhost) => ({
    name: vhost.name,
    description: vhost.description ?? "",
    tracing: Boolean(vhost.tracing),
  }))
}

function mapPolicy(policy: ApiPolicy): Policy {
  return {
    name: policy.name,
    vhost: policy.vhost,
    pattern: policy.pattern,
    applyTo: policy["apply-to"] ?? "queues",
    priority: policy.priority ?? 0,
    definition: plainArguments(policy.definition),
  }
}

function limitValue(
  value: Record<string, unknown> | string | undefined,
  key: string
): number {
  let record = value
  if (typeof value === "string") {
    try {
      record = JSON.parse(value) as Record<string, unknown>
    } catch {
      return 0
    }
  }
  const raw = (record as Record<string, unknown> | undefined)?.[key]
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapVhostLimits(limits: ApiVhostLimit[]): VhostLimit[] {
  return limits.map((limit) => ({
    vhost: limit.vhost,
    maxConnections: limitValue(limit.value, "max-connections"),
    maxQueues: limitValue(limit.value, "max-queues"),
  }))
}

function mapFeatureFlags(flags: ApiFeatureFlag[]): FeatureFlag[] {
  const stability = (value: string | undefined): Stability =>
    value === "experimental" ? "experimental" : "stable"

  return flags.map((flag) => ({
    name: flag.name,
    enabled:
      typeof flag.state === "boolean" ? flag.state : flag.state === "enabled",
    stability: stability(flag.stability),
    desc: flag.desc ?? "",
  }))
}

function usedFeatureNames(used: unknown): Set<string> {
  if (!Array.isArray(used)) return new Set()
  const names = used
    .map((entry) => {
      if (typeof entry === "string") return entry
      if (entry && typeof entry === "object" && "name" in entry) {
        return String((entry as { name: unknown }).name)
      }
      return ""
    })
    .filter(Boolean)
  return new Set(names)
}

function mapDeprecatedFeatures(
  features: ApiDeprecatedFeature[],
  used: unknown
): DeprecatedFeature[] {
  const inUse = usedFeatureNames(used)
  const phase = (value: string | undefined): DeprecationPhase => {
    if (
      value === "denied_by_default" ||
      value === "disconnect" ||
      value === "removed"
    ) {
      return value
    }
    return "permitted_by_default"
  }

  return features.map((feature) => ({
    name: feature.name,
    phase: phase(feature.phase ?? feature.state),
    desc: feature.desc ?? "",
    inUse: inUse.has(feature.name),
  }))
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

async function fetchAllConnections(
  token: string,
  signal?: AbortSignal
): Promise<Connection[]> {
  const pageSize = 500
  const first = await apiGet<ApiConnectionsResponse>(
    `/api/connections?page=1&page_size=${pageSize}`,
    token,
    signal
  )

  const items = [...first.items]
  for (let page = 2; page <= first.page_count; page += 1) {
    const next = await apiGet<ApiConnectionsResponse>(
      `/api/connections?page=${page}&page_size=${pageSize}`,
      token,
      signal
    )
    items.push(...next.items)
  }
  return items.map(mapConnection)
}

async function fetchAllChannels(
  token: string,
  signal?: AbortSignal
): Promise<Channel[]> {
  const pageSize = 500
  const first = await apiGet<ApiChannelsResponse | ApiChannel[]>(
    `/api/channels?page=1&page_size=${pageSize}`,
    token,
    signal
  )

  if (Array.isArray(first)) return mapChannels(first)

  const items = [...first.items]
  for (let page = 2; page <= first.page_count; page += 1) {
    const next = await apiGet<ApiChannelsResponse>(
      `/api/channels?page=${page}&page_size=${pageSize}`,
      token,
      signal
    )
    items.push(...next.items)
  }
  return mapChannels(items)
}

export async function fetchRabbitSnapshot(
  token: string,
  signal?: AbortSignal
): Promise<RabbitSnapshot> {
  const [
    overview,
    apiNodes,
    apiQueues,
    apiExchanges,
    apiBindings,
    apiConsumers,
    channels,
    connections,
    apiUsers,
    apiPermissions,
    apiVhosts,
    apiPolicies,
    apiOperatorPolicies,
    apiLimits,
    apiFlags,
    apiDeprecated,
    deprecatedUsed,
  ] = await Promise.all([
    apiGet<ApiOverview>("/api/overview", token, signal),
    apiGet<ApiNode[]>("/api/nodes", token, signal),
    apiGet<ApiQueue[]>("/api/queues", token, signal),
    apiGet<ApiExchange[]>("/api/exchanges", token, signal),
    apiGet<ApiBinding[]>("/api/bindings", token, signal),
    apiGet<ApiConsumer[]>("/api/consumers", token, signal),
    fetchAllChannels(token, signal),
    fetchAllConnections(token, signal),
    apiGet<ApiUser[]>("/api/users", token, signal),
    apiGet<ApiPermission[]>("/api/permissions", token, signal),
    apiGet<ApiVhost[]>("/api/vhosts", token, signal),
    apiGet<ApiPolicy[]>("/api/policies", token, signal),
    apiGet<ApiPolicy[]>("/api/operator-policies", token, signal),
    apiGet<ApiVhostLimit[]>("/api/vhost-limits", token, signal),
    apiGet<ApiFeatureFlag[]>("/api/feature-flags", token, signal),
    apiGet<ApiDeprecatedFeature[]>("/api/deprecated-features", token, signal),
    apiGet<unknown>("/api/deprecated-features/used", token, signal),
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
    exchanges: mapExchanges(apiExchanges),
    bindings: mapBindings(apiBindings),
    consumers: mapConsumers(apiConsumers, connections),
    connections,
    channels,
    users: mapUsers(apiUsers, apiPermissions),
    vhosts: mapVhosts(apiVhosts),
    policies: apiPolicies.map(mapPolicy),
    operatorPolicies: apiOperatorPolicies.map(mapPolicy),
    limits: mapVhostLimits(apiLimits),
    flags: mapFeatureFlags(apiFlags),
    deprecatedFeatures: mapDeprecatedFeatures(apiDeprecated, deprecatedUsed),
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

export async function fetchChannels(
  token: string,
  query: ChannelsQuery,
  signal?: AbortSignal
): Promise<ChannelsPage> {
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

  const page = await apiGet<ApiChannelsResponse>(
    `/api/channels?${params.toString()}`,
    token,
    signal
  )

  return {
    items: mapChannels(page.items),
    totalCount: page.total_count,
    filteredCount: page.filtered_count,
    page: page.page,
    pageSize: page.page_size,
    pageCount: page.page_count,
  }
}

export type ConnectionRateRange = 60 | 600 | 3600

const CONNECTION_RATE_INCR: Record<ConnectionRateRange, number> = {
  60: 5,
  600: 10,
  3600: 60,
}

export async function fetchConnectionDetail(
  token: string,
  name: string,
  range: ConnectionRateRange = 60,
  signal?: AbortSignal
): Promise<ConnectionDetail> {
  const params = new URLSearchParams({
    data_rates_age: String(range),
    data_rates_incr: String(CONNECTION_RATE_INCR[range]),
  })
  const detail = await apiGet<ApiConnectionDetail>(
    `/api/connections/${enc(name)}?${params.toString()}`,
    token,
    signal
  )
  return mapConnectionDetail(detail)
}

interface ApiConnectionChannel {
  name: string
  number: number
  user: string
  state: string
  vhost: string
  consumer_count?: number
  messages_unacknowledged?: number
  messages_uncommitted?: number
  messages_unconfirmed?: number
  acks_uncommitted?: number
}

export interface ConnectionChannel {
  name: string
  number: number
  user: string
  state: string
  vhost: string
  consumerCount: number
  messagesUnacknowledged: number
  messagesUncommitted: number
  messagesUnconfirmed: number
  acksUncommitted: number
}

export async function fetchConnectionChannels(
  token: string,
  name: string,
  signal?: AbortSignal
): Promise<ConnectionChannel[]> {
  const rows = await apiGet<ApiConnectionChannel[]>(
    `/api/connections/${enc(name)}/channels`,
    token,
    signal
  )
  return rows.map((row) => ({
    name: row.name,
    number: row.number,
    user: row.user,
    state: row.state,
    vhost: row.vhost,
    consumerCount: row.consumer_count ?? 0,
    messagesUnacknowledged: row.messages_unacknowledged ?? 0,
    messagesUncommitted: row.messages_uncommitted ?? 0,
    messagesUnconfirmed: row.messages_unconfirmed ?? 0,
    acksUncommitted: row.acks_uncommitted ?? 0,
  }))
}

export async function closeConnection(
  token: string,
  name: string,
  reason: string
): Promise<void> {
  await apiDelete(`/api/connections/${enc(name)}`, token, {
    reason: reason.trim() || "Closed via management UI",
  })
}

export async function closeChannel(
  token: string,
  name: string
): Promise<void> {
  await apiDelete(`/api/channels/${enc(name)}`, token)
}

export async function createQueue(
  token: string,
  input: CreateQueueInput
): Promise<void> {
  await apiPut(`/api/queues/${enc(input.vhost)}/${enc(input.name)}`, token, {
    durable: input.durable,
    auto_delete: input.autoDelete,
    arguments: { ...input.args, "x-queue-type": input.type },
  })
}

export async function deleteQueue(
  token: string,
  vhost: string,
  name: string
): Promise<void> {
  await apiDelete(`/api/queues/${enc(vhost)}/${enc(name)}`, token)
}

export async function purgeQueue(
  token: string,
  vhost: string,
  name: string
): Promise<void> {
  await apiDelete(`/api/queues/${enc(vhost)}/${enc(name)}/contents`, token)
}

export async function createExchange(
  token: string,
  input: CreateExchangeInput
): Promise<void> {
  await apiPut(`/api/exchanges/${enc(input.vhost)}/${enc(input.name)}`, token, {
    type: input.type,
    durable: input.durable,
    auto_delete: input.autoDelete,
    internal: input.internal,
    arguments: input.args ?? {},
  })
}

export async function deleteExchange(
  token: string,
  vhost: string,
  name: string
): Promise<void> {
  await apiDelete(`/api/exchanges/${enc(vhost)}/${enc(name)}`, token)
}

export async function publishMessage(
  token: string,
  input: PublishInput
): Promise<void> {
  const count = Math.max(1, Math.floor(input.count))
  for (let index = 0; index < count; index += 1) {
    await apiPost(
      `/api/exchanges/${enc(input.vhost)}/${enc(input.exchange)}/publish`,
      token,
      {
        properties: {},
        routing_key: input.routingKey,
        payload: input.payload,
        payload_encoding: "string",
      }
    )
  }
}

export async function createUser(
  token: string,
  input: CreateUserInput
): Promise<void> {
  await apiPut(`/api/users/${enc(input.username)}`, token, {
    password: input.password,
    tags: input.tags.join(","),
  })
  for (const vhost of input.vhosts) {
    await apiPut(
      `/api/permissions/${enc(vhost)}/${enc(input.username)}`,
      token,
      { configure: ".*", write: ".*", read: ".*" }
    )
  }
}

export async function deleteUser(
  token: string,
  username: string
): Promise<void> {
  await apiDelete(`/api/users/${enc(username)}`, token)
}

export async function createVhost(
  token: string,
  input: CreateVhostInput
): Promise<void> {
  await apiPut(`/api/vhosts/${enc(input.name)}`, token, {
    description: input.description,
    tracing: input.tracing,
  })
}

export async function deleteVhost(
  token: string,
  name: string
): Promise<void> {
  await apiDelete(`/api/vhosts/${enc(name)}`, token)
}

export async function savePolicy(
  token: string,
  policy: Policy,
  operator = false
): Promise<void> {
  const resource = operator ? "operator-policies" : "policies"
  await apiPut(
    `/api/${resource}/${enc(policy.vhost)}/${enc(policy.name)}`,
    token,
    {
      pattern: policy.pattern,
      "apply-to": policy.applyTo,
      priority: policy.priority,
      definition: policy.definition,
    }
  )
}

export async function deletePolicy(
  token: string,
  vhost: string,
  name: string,
  operator = false
): Promise<void> {
  const resource = operator ? "operator-policies" : "policies"
  await apiDelete(`/api/${resource}/${enc(vhost)}/${enc(name)}`, token)
}

export async function updateVhostLimits(
  token: string,
  vhost: string,
  maxConnections: number,
  maxQueues: number
): Promise<void> {
  await apiPut(`/api/vhost-limits/${enc(vhost)}/max-connections`, token, {
    value: maxConnections,
  })
  await apiPut(`/api/vhost-limits/${enc(vhost)}/max-queues`, token, {
    value: maxQueues,
  })
}

export async function setFeatureFlag(
  token: string,
  name: string,
  enabled: boolean
): Promise<void> {
  await apiPost(
    `/api/feature-flags/${enc(name)}/${enabled ? "enable" : "disable"}`,
    token
  )
}

export async function fetchDefinitions(
  token: string
): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>("/api/definitions", token)
}

export async function uploadDefinitions(
  token: string,
  file: File,
  overwrite = true
): Promise<void> {
  const body = new FormData()
  body.append("file", file)
  await apiPostForm(
    `/api/definitions?overwrite=${overwrite ? "true" : "false"}`,
    body,
    token
  )
}
