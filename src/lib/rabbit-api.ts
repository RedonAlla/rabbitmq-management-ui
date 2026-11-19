import type {
  Binding,
  BindingArgumentValue,
  Channel,
  ClusterInfo,
  Connection,
  DeprecatedFeature,
  DeprecationPhase,
  Exchange,
  ExchangeArgumentValue,
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

interface ApiQueueMessageStats {
  publish_details?: ApiRateDetails
  deliver_details?: ApiRateDetails
  ack_details?: ApiRateDetails
  deliver_get_details?: ApiRateDetails
  get_details?: ApiRateDetails
  get_empty_details?: ApiRateDetails
  get_no_ack_details?: ApiRateDetails
  redeliver_details?: ApiRateDetails
  redeliver?: number
}

interface ApiQueue {
  name: string
  vhost: string
  type?: string
  durable: boolean
  auto_delete: boolean
  exclusive: boolean
  internal?: boolean
  state?: string
  messages_ready?: number
  messages_unacknowledged?: number
  consumers?: number
  memory?: number
  policy?: string | null
  arguments?: Record<string, unknown>
  message_stats?: ApiQueueMessageStats
}

interface ApiQueueConsumer {
  consumer_tag: string
  queue: { name: string; vhost: string }
  channel_details: { name: string; connection_name: string }
  ack_required: boolean
  active?: boolean
  activity_status?: string
  exclusive?: boolean
  prefetch_count: number
  consumer_timeout?: number
  arguments?: Record<string, unknown>
}

interface ApiQueueDetail extends ApiQueue {
  node: string
  state?: string
  internal_owner?: boolean
  storage_version?: number
  operator_policy?: string | null
  effective_policy_definition?: Record<string, unknown>
  exclusive_consumer_tag?: string | null
  single_active_consumer_tag?: string | null
  idle_since?: string | null
  head_message_timestamp?: string | null
  consumer_capacity?: number | null
  consumer_utilisation?: number | null
  messages?: number
  messages_persistent?: number
  messages_ram?: number
  messages_ready_ram?: number
  messages_unacknowledged_ram?: number
  message_bytes?: number
  message_bytes_persistent?: number
  message_bytes_ram?: number
  message_bytes_ready?: number
  message_bytes_unacknowledged?: number
  reductions?: number
  reductions_details?: ApiRateDetails
  messages_details?: ApiRateDetails
  messages_ready_details?: ApiRateDetails
  messages_unacknowledged_details?: ApiRateDetails
  consumer_details?: ApiQueueConsumer[]
  garbage_collection?: ApiGarbageCollection
}

interface ApiExchange {
  name: string
  vhost: string
  type: string
  durable: boolean
  auto_delete: boolean
  internal: boolean
  arguments?: Record<string, unknown>
  user_who_performed_action?: string
  message_stats?: {
    publish_in?: number
    publish_in_details?: ApiRateDetails
    publish_out?: number
    publish_out_details?: ApiRateDetails
  }
}

interface ApiBinding {
  source: string
  vhost: string
  destination: string
  destination_type: "queue" | "exchange"
  routing_key: string
  properties_key?: string
  arguments?: Record<string, unknown>
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
  pending_raft_commands?: number
  cached_segments?: number
  consumer_count: number
  state: string
  confirm: boolean
  transactional: boolean
  message_stats?: ApiChannelMessageStats
  reductions_details?: ApiRateDetails
  garbage_collection?: ApiGarbageCollection
  consumer_details?: ApiChannelConsumer[]
}

interface ApiChannelConsumer {
  consumer_tag: string
  queue: { name: string; vhost: string }
  ack_required: boolean
  active: boolean
  activity_status?: string
  exclusive?: boolean
  prefetch_count: number
  consumer_timeout?: number
  arguments?: Record<string, unknown>
}

interface ApiGarbageCollection {
  fullsweep_after?: number
  max_heap_size?: number
  min_bin_vheap_size?: number
  min_heap_size?: number
  minor_gcs?: number
}

interface ApiChannelMessageStats {
  publish_details?: ApiRateDetails
  deliver_details?: ApiRateDetails
  ack_details?: ApiRateDetails
  deliver_get_details?: ApiRateDetails
  deliver_no_ack_details?: ApiRateDetails
  get_details?: ApiRateDetails
  get_empty_details?: ApiRateDetails
  get_no_ack_details?: ApiRateDetails
  redeliver_details?: ApiRateDetails
}

interface ApiUser {
  name: string
  tags: string | string[]
  password_hash?: string
  hashing_algorithm?: string
  has_password?: boolean
  limits?: Record<string, Record<string, number>>
}

interface ApiPermission {
  user: string
  vhost: string
  configure: string
  write: string
  read: string
}

interface ApiTopicPermission {
  user: string
  vhost: string
  exchange: string
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

interface ApiConnectionDetail extends Omit<
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

export type ChannelRateRange = 60 | 600 | 3600

const CHANNEL_RATE_INCR: Record<ChannelRateRange, number> = {
  60: 5,
  600: 5,
  3600: 60,
}

export type ChannelRateKey =
  | "ack"
  | "deliver"
  | "deliverGet"
  | "deliverNoAck"
  | "get"
  | "getEmpty"
  | "getNoAck"
  | "redeliver"
  | "reductions"

export type ChannelRate = ConnectionRate

export interface ChannelGarbageCollection {
  fullsweepAfter: number | null
  maxHeapSize: number | null
  minBinVheapSize: number | null
  minHeapSize: number | null
  minorGcs: number | null
}

export interface ChannelConsumer {
  tag: string
  queue: string
  vhost: string
  ackRequired: boolean
  active: boolean
  activityStatus: string
  prefetchCount: number
  consumerTimeout: number | null
  arguments: Record<string, unknown>
}

export interface ChannelDetail {
  name: string
  rates: Record<ChannelRateKey, ChannelRate>
  garbageCollection: ChannelGarbageCollection | null
  consumers: ChannelConsumer[]
}

export type QueueRateRange = 60 | 600 | 3600

export type QueueRateKey =
  | "publish"
  | "deliver"
  | "ack"
  | "deliverGet"
  | "get"
  | "getEmpty"
  | "getNoAck"
  | "redeliver"
  | "reductions"

export type QueueLengthKey = "messages" | "ready" | "unacked"

export type QueueRate = ConnectionRate
export type QueueGarbageCollection = ChannelGarbageCollection

export interface QueueConsumer {
  tag: string
  queue: string
  vhost: string
  channel: string
  connection: string
  ackRequired: boolean
  active: boolean
  activityStatus: string
  exclusive: boolean
  prefetchCount: number
  consumerTimeout: number | null
  arguments: Record<string, unknown>
}

export interface QueueDetail {
  name: string
  vhost: string
  node: string
  type: QueueType
  state: string
  durable: boolean
  autoDelete: boolean
  exclusive: boolean
  internal: boolean
  internalOwner: boolean
  storageVersion: number | null
  policy: string | null
  operatorPolicy: string | null
  effectivePolicyDefinition: Record<string, unknown>
  arguments: Record<string, unknown>
  exclusiveConsumerTag: string | null
  singleActiveConsumerTag: string | null
  idleSince: string | null
  headMessageTimestamp: string | null
  consumers: number
  consumerCapacity: number | null
  consumerUtilisation: number | null
  memory: number
  messages: number
  messagesPersistent: number
  messagesRam: number
  messagesReady: number
  messagesReadyRam: number
  messagesUnacknowledged: number
  messagesUnacknowledgedRam: number
  messageBytes: number
  messageBytesPersistent: number
  messageBytesRam: number
  messageBytesReady: number
  messageBytesUnacknowledged: number
  reductions: number
  lengths: Record<QueueLengthKey, QueueRate>
  rates: Record<QueueRateKey, QueueRate>
  consumerDetails: QueueConsumer[]
  garbageCollection: QueueGarbageCollection | null
}

export type ExchangeRateRange = 60 | 600 | 3600

export type ExchangeRateKey = "publishIn" | "publishOut"

export interface ExchangeDetail {
  name: string
  vhost: string
  type: ExchangeType
  durable: boolean
  autoDelete: boolean
  internal: boolean
  userWhoPerformedAction: string | null
  arguments: Record<string, ExchangeArgumentValue>
  publishIn: number
  publishOut: number
  rates: Record<ExchangeRateKey, ConnectionRate>
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

interface ApiQueuesResponse {
  total_count: number
  item_count: number
  filtered_count: number
  page: number
  page_size: number
  page_count: number
  items: ApiQueue[]
}

export interface QueuesPage {
  items: Queue[]
  totalCount: number
  filteredCount: number
  page: number
  pageSize: number
  pageCount: number
}

export interface QueuesQuery {
  page: number
  pageSize: number
  name?: string
  vhost?: string
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

interface ApiExchangesResponse {
  total_count: number
  item_count: number
  filtered_count: number
  page: number
  page_size: number
  page_count: number
  items: ApiExchange[]
}

export interface ExchangesPage {
  items: Exchange[]
  totalCount: number
  filteredCount: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ExchangesQuery {
  page: number
  pageSize: number
  name?: string
  vhost?: string
  sort?: string
  sortReverse?: boolean
}

interface ApiUsersResponse {
  total_count: number
  item_count: number
  filtered_count: number
  page: number
  page_size: number
  page_count: number
  items: ApiUser[]
}

export interface UsersPage {
  items: User[]
  totalCount: number
  filteredCount: number
  page: number
  pageSize: number
  pageCount: number
}

export interface UsersQuery {
  page: number
  pageSize: number
  name?: string
  sort?: string
  sortReverse?: boolean
}

export interface UserPermission {
  vhost: string
  configure: string
  write: string
  read: string
}

export interface UserTopicPermission {
  vhost: string
  exchange: string
  write: string
  read: string
}

export interface UpdateUserPermissionInput {
  username: string
  vhost: string
  configure: string
  write: string
  read: string
}

export interface UpdateUserTopicPermissionInput {
  username: string
  vhost: string
  exchange: string
  write: string
  read: string
}

export interface UserDetail {
  name: string
  hashingAlgorithm: string
  hasPassword: boolean
  tags: string[]
  limits: Record<string, Record<string, number>>
  permissions: UserPermission[]
  topicPermissions: UserTopicPermission[]
}

export interface RabbitSnapshot {
  cluster: ClusterInfo
  nodes: NodeInfo[]
  ports: PortInfo[]
  webContexts: WebContext[]
  queues: Queue[]
  exchanges: Exchange[]
  bindings: Binding[]
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

export type QueueDeclarationType = QueueType | "default"

export type QueueArgumentValue =
  string | number | boolean | Array<string | number | boolean>

export interface CreateQueueInput {
  name: string
  vhost: string
  type: QueueDeclarationType
  durable: boolean
  autoDelete: boolean
  args?: Record<string, QueueArgumentValue>
}

export interface CreateExchangeInput {
  name: string
  vhost: string
  type: ExchangeType
  durable: boolean
  autoDelete: boolean
  internal: boolean
  args?: Record<string, ExchangeArgumentValue>
}

export interface CreateBindingInput {
  vhost: string
  source: string
  destination: string
  routingKey: string
  args?: Record<string, QueueArgumentValue>
}

export interface DeleteBindingInput {
  vhost: string
  source: string
  destination: string
  destType: "queue" | "exchange"
  propertiesKey: string
}

export interface CreateUserInput {
  username: string
  password?: string
  tags: string[]
  vhosts: string[]
}

export interface CreateVhostInput {
  name: string
  description: string
  tags: string
  defaultQueueType: "" | "classic" | "quorum" | "stream"
}

export type PublishHeaderValue = string | number | boolean

export interface PublishProperties {
  deliveryMode?: 1 | 2
  headers?: Record<string, PublishHeaderValue>
  extra?: Record<string, unknown>
}

export interface PublishInput {
  vhost: string
  exchange: string
  routingKey: string
  payload: string
  payloadEncoding?: "string" | "base64"
  properties?: PublishProperties
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
  if (
    type === "fanout" ||
    type === "topic" ||
    type === "headers" ||
    type === "x-local-random" ||
    type === "x-modulus-hash"
  ) {
    return type
  }
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

function plainExchangeArguments(
  args: Record<string, unknown> | undefined
): Record<string, ExchangeArgumentValue> {
  const mapped: Record<string, ExchangeArgumentValue> = {}
  for (const [key, value] of Object.entries(args ?? {})) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      mapped[key] = value
    } else if (
      Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      )
    ) {
      mapped[key] = value as Array<string | number | boolean>
    }
  }
  return mapped
}

function bindingArguments(
  args: Record<string, unknown> | undefined
): Record<string, BindingArgumentValue> {
  const mapped: Record<string, BindingArgumentValue> = {}
  for (const [key, value] of Object.entries(args ?? {})) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      mapped[key] = value
      continue
    }
    if (
      Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      )
    ) {
      mapped[key] = value as Array<string | number | boolean>
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
      internal: queue.internal ?? false,
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
    publishRate: exchange.message_stats?.publish_in_details?.rate ?? 0,
    deliverRate: exchange.message_stats?.publish_out_details?.rate ?? 0,
    publishIn: exchange.message_stats?.publish_in ?? 0,
    publishOut: exchange.message_stats?.publish_out ?? 0,
    args: plainExchangeArguments(exchange.arguments),
  }))
}

function mapExchangeDetail(detail: ApiExchange): ExchangeDetail {
  const stats = detail.message_stats ?? {}
  return {
    name: detail.name,
    vhost: detail.vhost,
    type: exchangeType(detail.type),
    durable: detail.durable,
    autoDelete: detail.auto_delete,
    internal: detail.internal,
    userWhoPerformedAction: detail.user_who_performed_action ?? null,
    arguments: plainExchangeArguments(detail.arguments),
    publishIn: stats.publish_in ?? 0,
    publishOut: stats.publish_out ?? 0,
    rates: {
      publishIn: mapRate(stats.publish_in_details),
      publishOut: mapRate(stats.publish_out_details),
    },
  }
}

function mapBindings(bindings: ApiBinding[]): Binding[] {
  return bindings.map((binding) => ({
    source: binding.source,
    vhost: binding.vhost,
    destination: binding.destination,
    destType: binding.destination_type === "exchange" ? "exchange" : "queue",
    routingKey: binding.routing_key,
    propertiesKey: binding.properties_key ?? binding.routing_key,
    args: bindingArguments(binding.arguments),
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
    pendingRaftCommands: channel.pending_raft_commands ?? 0,
    cachedSegments: channel.cached_segments ?? 0,
    state: channel.state,
    publishRate: channel.message_stats?.publish_details?.rate ?? 0,
    deliverRate: channel.message_stats?.deliver_details?.rate ?? 0,
    ackRate: channel.message_stats?.ack_details?.rate ?? 0,
    deliverGetRate: channel.message_stats?.deliver_get_details?.rate ?? 0,
    deliverNoAckRate: channel.message_stats?.deliver_no_ack_details?.rate ?? 0,
    getRate: channel.message_stats?.get_details?.rate ?? 0,
    getEmptyRate: channel.message_stats?.get_empty_details?.rate ?? 0,
    getNoAckRate: channel.message_stats?.get_no_ack_details?.rate ?? 0,
    redeliverRate: channel.message_stats?.redeliver_details?.rate ?? 0,
    reductionsRate: channel.reductions_details?.rate ?? 0,
    confirmMode: channel.confirm,
    transactional: channel.transactional,
  }))
}

function parseUserTags(tags: string | string[]): string[] {
  return Array.isArray(tags)
    ? tags
    : String(tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
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
    tags: parseUserTags(user.tags),
    vhosts: vhostsByUser.get(user.name) ?? [],
    hasPassword: Boolean(user.has_password),
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

function mapGarbageCollection(
  gc: ApiGarbageCollection | undefined
): ChannelGarbageCollection | null {
  if (!gc) return null
  return {
    fullsweepAfter: gc.fullsweep_after ?? null,
    maxHeapSize: gc.max_heap_size ?? null,
    minBinVheapSize: gc.min_bin_vheap_size ?? null,
    minHeapSize: gc.min_heap_size ?? null,
    minorGcs: gc.minor_gcs ?? null,
  }
}

interface ApiConsumerFields {
  consumer_tag: string
  queue: { name: string; vhost: string }
  ack_required: boolean
  prefetch_count: number
  consumer_timeout?: number
  arguments?: Record<string, unknown>
}

function mapConsumerFields(
  consumer: ApiConsumerFields,
  active: boolean,
  activityStatus: string
) {
  return {
    tag: consumer.consumer_tag,
    queue: consumer.queue.name,
    vhost: consumer.queue.vhost,
    ackRequired: consumer.ack_required,
    active,
    activityStatus,
    prefetchCount: consumer.prefetch_count,
    consumerTimeout: consumer.consumer_timeout ?? null,
    arguments: consumer.arguments ?? {},
  }
}

function mapChannelDetail(detail: ApiChannel): ChannelDetail {
  const stats = detail.message_stats ?? {}
  return {
    name: detail.name,
    garbageCollection: mapGarbageCollection(detail.garbage_collection),
    consumers: (detail.consumer_details ?? []).map((consumer) =>
      mapConsumerFields(
        consumer,
        consumer.active,
        consumer.activity_status ?? (consumer.active ? "up" : "down")
      )
    ),
    rates: {
      ack: mapRate(stats.ack_details),
      deliver: mapRate(stats.deliver_details),
      deliverGet: mapRate(stats.deliver_get_details),
      deliverNoAck: mapRate(stats.deliver_no_ack_details),
      get: mapRate(stats.get_details),
      getEmpty: mapRate(stats.get_empty_details),
      getNoAck: mapRate(stats.get_no_ack_details),
      redeliver: mapRate(stats.redeliver_details),
      reductions: mapRate(detail.reductions_details),
    },
  }
}

function mapQueueDetail(detail: ApiQueueDetail): QueueDetail {
  const stats = detail.message_stats ?? {}
  return {
    name: detail.name,
    vhost: detail.vhost,
    node: detail.node,
    type: queueType(detail),
    state: detail.state ?? "idle",
    durable: detail.durable,
    autoDelete: detail.auto_delete,
    exclusive: detail.exclusive,
    internal: detail.internal ?? false,
    internalOwner: detail.internal_owner ?? false,
    storageVersion: detail.storage_version ?? null,
    policy: detail.policy ?? null,
    operatorPolicy: detail.operator_policy ?? null,
    effectivePolicyDefinition: detail.effective_policy_definition ?? {},
    arguments: detail.arguments ?? {},
    exclusiveConsumerTag: detail.exclusive_consumer_tag ?? null,
    singleActiveConsumerTag: detail.single_active_consumer_tag ?? null,
    idleSince: detail.idle_since ?? null,
    headMessageTimestamp: detail.head_message_timestamp ?? null,
    consumers: detail.consumers ?? 0,
    consumerCapacity: detail.consumer_capacity ?? null,
    consumerUtilisation: detail.consumer_utilisation ?? null,
    memory: detail.memory ?? 0,
    messages: detail.messages ?? 0,
    messagesPersistent: detail.messages_persistent ?? 0,
    messagesRam: detail.messages_ram ?? 0,
    messagesReady: detail.messages_ready ?? 0,
    messagesReadyRam: detail.messages_ready_ram ?? 0,
    messagesUnacknowledged: detail.messages_unacknowledged ?? 0,
    messagesUnacknowledgedRam: detail.messages_unacknowledged_ram ?? 0,
    messageBytes: detail.message_bytes ?? 0,
    messageBytesPersistent: detail.message_bytes_persistent ?? 0,
    messageBytesRam: detail.message_bytes_ram ?? 0,
    messageBytesReady: detail.message_bytes_ready ?? 0,
    messageBytesUnacknowledged: detail.message_bytes_unacknowledged ?? 0,
    reductions: detail.reductions ?? 0,
    lengths: {
      messages: mapRate(detail.messages_details),
      ready: mapRate(detail.messages_ready_details),
      unacked: mapRate(detail.messages_unacknowledged_details),
    },
    rates: {
      publish: mapRate(stats.publish_details),
      deliver: mapRate(stats.deliver_details),
      ack: mapRate(stats.ack_details),
      deliverGet: mapRate(stats.deliver_get_details),
      get: mapRate(stats.get_details),
      getEmpty: mapRate(stats.get_empty_details),
      getNoAck: mapRate(stats.get_no_ack_details),
      redeliver: mapRate(stats.redeliver_details),
      reductions: mapRate(detail.reductions_details),
    },
    consumerDetails: (detail.consumer_details ?? []).map((consumer) => {
      const active = consumer.active ?? true
      return {
        ...mapConsumerFields(
          consumer,
          active,
          consumer.activity_status ??
            (consumer.active === false ? "down" : "up")
        ),
        channel: consumer.channel_details.name,
        connection: consumer.channel_details.connection_name,
        exclusive: Boolean(consumer.exclusive),
      }
    }),
    garbageCollection: mapGarbageCollection(detail.garbage_collection),
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

export async function fetchExchanges(
  token: string,
  query: ExchangesQuery,
  signal?: AbortSignal
): Promise<ExchangesPage> {
  const base = query.vhost
    ? `/api/exchanges/${enc(query.vhost)}`
    : "/api/exchanges"
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.pageSize),
    name: query.name ?? "",
    use_regex: "false",
    pagination: "true",
  })

  if (query.sort) {
    params.set("sort", query.sort)
    params.set("sort_reverse", query.sortReverse ? "true" : "false")
  }

  const page = await apiGet<ApiExchangesResponse>(
    `${base}?${params.toString()}`,
    token,
    signal
  )

  return {
    items: mapExchanges(page.items),
    totalCount: page.total_count,
    filteredCount: page.filtered_count,
    page: page.page,
    pageSize: page.page_size,
    pageCount: page.page_count,
  }
}

export async function fetchQueues(
  token: string,
  query: QueuesQuery,
  signal?: AbortSignal
): Promise<QueuesPage> {
  const base = query.vhost ? `/api/queues/${enc(query.vhost)}` : "/api/queues"
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.pageSize),
    name: query.name ?? "",
    use_regex: "false",
    pagination: "true",
  })

  if (query.sort) {
    params.set("sort", query.sort)
    params.set("sort_reverse", query.sortReverse ? "true" : "false")
  }

  const page = await apiGet<ApiQueuesResponse>(
    `${base}?${params.toString()}`,
    token,
    signal
  )

  return {
    items: mapQueues(page.items),
    totalCount: page.total_count,
    filteredCount: page.filtered_count,
    page: page.page,
    pageSize: page.page_size,
    pageCount: page.page_count,
  }
}

export async function fetchUsers(
  token: string,
  query: UsersQuery,
  signal?: AbortSignal
): Promise<UsersPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.pageSize),
    name: query.name ?? "",
    use_regex: "false",
    pagination: "true",
  })

  if (query.sort) {
    params.set("sort", query.sort)
    params.set("sort_reverse", query.sortReverse ? "true" : "false")
  }

  const [page, permissions] = await Promise.all([
    apiGet<ApiUsersResponse>(
      `/api/users?${params.toString()}`,
      token,
      signal
    ),
    apiGet<ApiPermission[]>("/api/permissions", token, signal),
  ])

  return {
    items: mapUsers(page.items, permissions),
    totalCount: page.total_count,
    filteredCount: page.filtered_count,
    page: page.page,
    pageSize: page.page_size,
    pageCount: page.page_count,
  }
}

export async function fetchUserDetail(
  token: string,
  username: string,
  signal?: AbortSignal
): Promise<UserDetail> {
  const base = `/api/users/${enc(username)}`
  const [user, permissions, topicPermissions] = await Promise.all([
    apiGet<ApiUser>(base, token, signal),
    apiGet<ApiPermission[]>(`${base}/permissions`, token, signal),
    apiGet<ApiTopicPermission[]>(`${base}/topic-permissions`, token, signal),
  ])

  return {
    name: user.name,
    hashingAlgorithm:
      user.hashing_algorithm ?? "rabbit_password_hashing_sha256",
    hasPassword: Boolean(user.has_password),
    tags: parseUserTags(user.tags),
    limits: user.limits ?? {},
    permissions: permissions.map((permission) => ({
      vhost: permission.vhost,
      configure: permission.configure,
      write: permission.write,
      read: permission.read,
    })),
    topicPermissions: topicPermissions.map((permission) => ({
      vhost: permission.vhost,
      exchange: permission.exchange,
      write: permission.write,
      read: permission.read,
    })),
  }
}

export type ConnectionRateRange = 60 | 600 | 3600

const EXCHANGE_RATE_INCR: Record<ExchangeRateRange, number> = {
  60: 5,
  600: 5,
  3600: 60,
}

export async function fetchExchangeDetail(
  token: string,
  vhost: string,
  name: string,
  range: ExchangeRateRange = 60,
  signal?: AbortSignal
): Promise<ExchangeDetail> {
  const params = new URLSearchParams({
    msg_rates_age: String(range),
    msg_rates_incr: String(EXCHANGE_RATE_INCR[range]),
  })
  const detail = await apiGet<ApiExchange>(
    `/api/exchanges/${enc(vhost)}/${enc(name || "amq.default")}?${params.toString()}`,
    token,
    signal
  )
  return mapExchangeDetail(detail)
}

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

export async function fetchChannelDetail(
  token: string,
  name: string,
  range: ChannelRateRange = 60,
  signal?: AbortSignal
): Promise<ChannelDetail> {
  const params = new URLSearchParams({
    data_rates_age: String(range),
    data_rates_incr: String(CHANNEL_RATE_INCR[range]),
    msg_rates_age: String(range),
    msg_rates_incr: String(CHANNEL_RATE_INCR[range]),
  })
  const detail = await apiGet<ApiChannel>(
    `/api/channels/${enc(name)}?${params.toString()}`,
    token,
    signal
  )
  return mapChannelDetail(detail)
}

const QUEUE_RATE_INCR: Record<QueueRateRange, number> = {
  60: 5,
  600: 5,
  3600: 60,
}

export async function fetchQueueDetail(
  token: string,
  vhost: string,
  name: string,
  range: QueueRateRange = 600,
  signal?: AbortSignal
): Promise<QueueDetail> {
  const incr = String(QUEUE_RATE_INCR[range])
  const params = new URLSearchParams({
    lengths_age: String(range),
    lengths_incr: incr,
    msg_rates_age: String(range),
    msg_rates_incr: incr,
    data_rates_age: String(range),
    data_rates_incr: incr,
  })
  const detail = await apiGet<ApiQueueDetail>(
    `/api/queues/${enc(vhost)}/${enc(name)}?${params.toString()}`,
    token,
    signal
  )
  return mapQueueDetail(detail)
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

export async function closeChannel(token: string, name: string): Promise<void> {
  await apiDelete(`/api/channels/${enc(name)}`, token)
}

export async function createQueue(
  token: string,
  input: CreateQueueInput
): Promise<void> {
  const args: Record<string, QueueArgumentValue> = { ...input.args }
  if (input.type !== "default") {
    args["x-queue-type"] = input.type
  }

  const body: Record<string, unknown> = {
    name: input.name,
    vhost: input.vhost,
    durable:
      input.type === "classic" || input.type === "default"
        ? input.durable
        : true,
    arguments: args,
  }
  if (input.type !== "default") {
    body.auto_delete = input.type === "classic" ? input.autoDelete : false
  }

  await apiPut(
    `/api/queues/${enc(input.vhost)}/${enc(input.name)}`,
    token,
    body
  )
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

export async function createBinding(
  token: string,
  input: CreateBindingInput
): Promise<void> {
  await apiPost(
    `/api/bindings/${enc(input.vhost)}/e/${enc(input.source)}/q/${enc(input.destination)}`,
    token,
    {
      vhost: input.vhost,
      source: input.source,
      destination: input.destination,
      destination_type: "q",
      routing_key: input.routingKey,
      arguments: input.args ?? {},
    }
  )
}

export async function deleteBinding(
  token: string,
  input: DeleteBindingInput
): Promise<void> {
  const destination = input.destType === "exchange" ? "e" : "q"
  await apiDelete(
    `/api/bindings/${enc(input.vhost)}/e/${enc(input.source)}/${destination}/${enc(input.destination)}/${enc(input.propertiesKey)}`,
    token
  )
}

export async function publishMessage(
  token: string,
  input: PublishInput
): Promise<boolean> {
  const properties: Record<string, unknown> = { ...input.properties?.extra }
  if (input.properties?.deliveryMode) {
    properties.delivery_mode = input.properties.deliveryMode
  }
  if (
    input.properties?.headers &&
    Object.keys(input.properties.headers).length > 0
  ) {
    properties.headers = input.properties.headers
  }

  const response = await apiPost<{ routed?: boolean }>(
    `/api/exchanges/${enc(input.vhost)}/${enc(input.exchange || "amq.default")}/publish`,
    token,
    {
      properties,
      routing_key: input.routingKey,
      payload: input.payload,
      payload_encoding: input.payloadEncoding ?? "string",
    }
  )
  return Boolean(response?.routed)
}

export async function createUser(
  token: string,
  input: CreateUserInput
): Promise<void> {
  await apiPut(`/api/users/${enc(input.username)}`, token, {
    ...(input.password === undefined ? {} : { password: input.password }),
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

export interface UpdateUserInput {
  username: string
  password?: string
  tags: string[]
}

export async function updateUser(
  token: string,
  input: UpdateUserInput
): Promise<void> {
  await apiPut(`/api/users/${enc(input.username)}`, token, {
    ...(input.password === undefined ? {} : { password: input.password }),
    tags: input.tags.join(","),
  })
}

export async function updateUserPermission(
  token: string,
  input: UpdateUserPermissionInput
): Promise<void> {
  await apiPut(
    `/api/permissions/${enc(input.vhost)}/${enc(input.username)}`,
    token,
    {
      configure: input.configure,
      write: input.write,
      read: input.read,
    }
  )
}

export async function deleteUserPermission(
  token: string,
  vhost: string,
  username: string
): Promise<void> {
  await apiDelete(
    `/api/permissions/${enc(vhost)}/${enc(username)}`,
    token
  )
}

export async function updateUserTopicPermission(
  token: string,
  input: UpdateUserTopicPermissionInput
): Promise<void> {
  await apiPut(
    `/api/topic-permissions/${enc(input.vhost)}/${enc(input.username)}`,
    token,
    {
      exchange: input.exchange,
      write: input.write,
      read: input.read,
    }
  )
}

export async function deleteUserTopicPermission(
  token: string,
  vhost: string,
  username: string,
  exchange: string
): Promise<void> {
  await apiDelete(
    `/api/topic-permissions/${enc(vhost)}/${enc(username)}/${enc(exchange)}`,
    token
  )
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
    name: input.name,
    description: input.description,
    tags: input.tags,
    ...(input.defaultQueueType
      ? { default_queue_type: input.defaultQueueType }
      : {}),
  })
}

export async function deleteVhost(token: string, name: string): Promise<void> {
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
