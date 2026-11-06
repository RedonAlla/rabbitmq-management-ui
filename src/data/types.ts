export type QueueType = "classic" | "quorum" | "stream";
export type QueueState = "running" | "idle" | "degraded";
export type ExchangeType = "direct" | "fanout" | "topic" | "headers";
export type Stability = "stable" | "experimental";

export interface Vhost {
  name: string;
  description: string;
  tracing: boolean;
}

export interface Queue {
  name: string;
  vhost: string;
  type: QueueType;
  durable: boolean;
  autoDelete: boolean;
  exclusive: boolean;
  state: QueueState;
  ready: number;
  unacked: number;
  consumers: number;
  publishRate: number;
  deliverRate: number;
  ackRate: number;
  redelivered: number;
  memory: number;
  policy: string | null;
  args: Record<string, string | number>;
  created: number;
}

export interface Exchange {
  name: string;
  vhost: string;
  type: ExchangeType;
  durable: boolean;
  autoDelete: boolean;
  internal: boolean;
  publishRate: number;
  deliverRate: number;
  args: Record<string, string | number>;
}

export interface Binding {
  source: string;
  vhost: string;
  destination: string;
  destType: "queue" | "exchange";
  routingKey: string;
  args: Record<string, string | number>;
}

export interface Consumer {
  tag: string;
  queue: string;
  channel: string;
  connection: string;
  ackRequired: boolean;
  exclusive: boolean;
  prefetch: number;
  since: number;
}

export interface Connection {
  id: string;
  name: string;
  user: string;
  vhost: string;
  node: string;
  protocol: string;
  ssl: boolean;
  channels: number;
  state: string;
  from: string;
  peer: string;
  connectedAt: number;
  heartbeat: number;
  recvRate: number;
  sendRate: number;
  client: string;
}

export interface Channel {
  id: string;
  number: number;
  connection: string;
  user: string;
  vhost: string;
  node: string;
  prefetch: number;
  unacked: number;
  consumers: number;
  state: string;
  publishRate: number;
  deliverRate: number;
  confirmMode: boolean;
  transactional: boolean;
}

export interface User {
  username: string;
  tags: string[];
  vhosts: string[];
  hash: string;
}

export interface Policy {
  name: string;
  vhost: string;
  pattern: string;
  applyTo: string;
  priority: number;
  definition: Record<string, string | number>;
}

export interface VhostLimit {
  vhost: string;
  maxConnections: number;
  maxQueues: number;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  stability: Stability;
  desc: string;
}

export type DeprecationPhase =
  | "permitted_by_default"
  | "denied_by_default"
  | "disconnect"
  | "removed";

export interface DeprecatedFeature {
  name: string;
  phase: DeprecationPhase;
  desc: string;
  inUse: boolean;
}

export type EventTone = "warn" | "info" | "ok" | "error";

export interface ClusterEvent {
  id: string;
  type: EventTone;
  title: string;
  detail: string;
  time: number;
}

export interface ClusterInfo {
  name: string;
  node: string;
  version: string;
  erlang: string;
  startedAt: number;
  trends: {
    ready: number;
    unacked: number;
    consumers: number;
    connections: number;
    queues: number;
    exchanges: number;
  };
}

export interface NodeInfo {
  name: string;
  type: "disc" | "ram";
  uptime: number;
  memory: number;
  memoryMax: number;
  diskFree: number;
  diskMax: number;
  fd: number;
  fdMax: number;
  sockets: number;
  processes: number;
  cpu: number;
  running: boolean;
}

export interface PortInfo {
  port: number;
  protocol: string;
  tls: boolean;
  nodes: number;
  context: string;
}

export interface SeedData {
  cluster: ClusterInfo;
  nodes: NodeInfo[];
  ports: PortInfo[];
  vhosts: Vhost[];
  queues: Queue[];
  exchanges: Exchange[];
  bindings: Binding[];
  consumers: Consumer[];
  connections: Connection[];
  channels: Channel[];
  users: User[];
  policies: Policy[];
  operatorPolicies: Policy[];
  limits: VhostLimit[];
  flags: FeatureFlag[];
  deprecatedFeatures: DeprecatedFeature[];
  events: ClusterEvent[];
}

export type RangeKey = "1m" | "5m" | "1h" | "1d";

export interface HistoryPoint {
  label: string;
  publish: number;
  deliver: number;
  ack: number;
  ready: number;
  unacked: number;
  consumers: number;
  connections: number;
}
