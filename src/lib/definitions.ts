import type {
  ExchangeType,
  Policy,
  QueueType,
  SeedData,
} from "@/data/types";

export interface BrokerUser {
  name: string;
  password_hash: string;
  hashing_algorithm: string;
  tags: string[];
}

export interface BrokerVhost {
  name: string;
  description: string;
  metadata: { description: string; tags: string[] };
  tracing: boolean;
}

export interface BrokerPermission {
  user: string;
  vhost: string;
  configure: string;
  write: string;
  read: string;
}

export interface BrokerPolicy {
  vhost: string;
  name: string;
  pattern: string;
  "apply-to": string;
  definition: Record<string, string | number>;
  priority: number;
}

export interface BrokerQueue {
  name: string;
  vhost: string;
  durable: boolean;
  auto_delete: boolean;
  arguments: Record<string, string | number>;
}

export interface BrokerExchange {
  name: string;
  vhost: string;
  type: ExchangeType;
  durable: boolean;
  auto_delete: boolean;
  internal: boolean;
  arguments: Record<string, string | number>;
}

export interface BrokerBinding {
  source: string;
  vhost: string;
  destination: string;
  destination_type: "queue" | "exchange";
  routing_key: string;
  arguments: Record<string, string | number>;
}

export interface BrokerDefinitions {
  rabbit_version: string;
  users: BrokerUser[];
  vhosts: BrokerVhost[];
  permissions: BrokerPermission[];
  policies: BrokerPolicy[];
  queues: BrokerQueue[];
  exchanges: BrokerExchange[];
  bindings: BrokerBinding[];
}

export interface DefinitionCounts {
  vhosts: number;
  queues: number;
  exchanges: number;
  bindings: number;
  users: number;
  policies: number;
  total: number;
}

export function summarizeDefinitions(defs: BrokerDefinitions): DefinitionCounts {
  return {
    vhosts: defs.vhosts.length,
    queues: defs.queues.length,
    exchanges: defs.exchanges.length,
    bindings: defs.bindings.length,
    users: defs.users.length,
    policies: defs.policies.length,
    total:
      defs.vhosts.length +
      defs.queues.length +
      defs.exchanges.length +
      defs.bindings.length +
      defs.users.length +
      defs.policies.length,
  };
}

function simulatedHash(username: string): string {
  return btoa(`simulated-salt:${username}`);
}

function queueArguments(type: QueueType): Record<string, string | number> {
  return { "x-queue-type": type };
}

export function buildDefinitions(data: SeedData, vhosts: string[]): BrokerDefinitions {
  const selected = new Set(vhosts);

  return {
    rabbit_version: data.cluster.version,
    users: data.users.map((user) => ({
      name: user.username,
      password_hash: simulatedHash(user.username),
      hashing_algorithm: user.hash || "rabbit_password_hashing_sha256",
      tags: user.tags,
    })),
    vhosts: data.vhosts
      .filter((vhost) => selected.has(vhost.name))
      .map((vhost) => ({
        name: vhost.name,
        description: vhost.description,
        metadata: { description: vhost.description, tags: [] },
        tracing: vhost.tracing,
      })),
    permissions: data.users.flatMap((user) => {
      const allowed = user.vhosts.includes("*")
        ? vhosts
        : user.vhosts.filter((vhost) => selected.has(vhost));
      return allowed.map((vhost) => ({
        user: user.username,
        vhost,
        configure: ".*",
        write: ".*",
        read: ".*",
      }));
    }),
    policies: data.policies
      .filter((policy) => selected.has(policy.vhost))
      .map((policy) => ({
        vhost: policy.vhost,
        name: policy.name,
        pattern: policy.pattern,
        "apply-to": policy.applyTo,
        definition: policy.definition,
        priority: policy.priority,
      })),
    queues: data.queues
      .filter((queue) => selected.has(queue.vhost))
      .map((queue) => ({
        name: queue.name,
        vhost: queue.vhost,
        durable: queue.durable,
        auto_delete: queue.autoDelete,
        arguments: queue.args["x-queue-type"]
          ? queue.args
          : { ...queue.args, ...queueArguments(queue.type) },
      })),
    exchanges: data.exchanges
      .filter((exchange) => selected.has(exchange.vhost) && exchange.name !== "")
      .map((exchange) => ({
        name: exchange.name,
        vhost: exchange.vhost,
        type: exchange.type,
        durable: exchange.durable,
        auto_delete: exchange.autoDelete,
        internal: exchange.internal,
        arguments: exchange.args,
      })),
    bindings: data.bindings
      .filter((binding) => selected.has(binding.vhost))
      .map((binding) => ({
        source: binding.source,
        vhost: binding.vhost,
        destination: binding.destination,
        destination_type: binding.destType,
        routing_key: binding.routingKey,
        arguments: binding.args,
      })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeArgs(value: unknown): Record<string, string | number> {
  if (!isRecord(value)) return {};
  const args: Record<string, string | number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" || typeof entry === "number") args[key] = entry;
    else if (typeof entry === "boolean") args[key] = String(entry);
  }
  return args;
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeExchangeType(value: unknown): ExchangeType {
  const type = asString(value).toLowerCase();
  return type === "fanout" || type === "topic" || type === "headers" ? type : "direct";
}

export function parseDefinitions(text: string): BrokerDefinitions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!isRecord(parsed)) {
    throw new Error("Definitions must be a JSON object.");
  }

  const known = ["users", "vhosts", "permissions", "policies", "queues", "exchanges", "bindings"];
  if (!known.some((key) => Array.isArray(parsed[key]))) {
    throw new Error(
      "No broker definitions found. Expected users, vhosts, policies, queues, exchanges or bindings."
    );
  }

  const users: BrokerUser[] = asArray(parsed.users).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const name = asString(entry.name).trim();
    if (!name) return [];
    return [
      {
        name,
        password_hash: asString(entry.password_hash),
        hashing_algorithm: asString(entry.hashing_algorithm, "rabbit_password_hashing_sha256"),
        tags: normalizeTags(entry.tags),
      },
    ];
  });

  const vhosts: BrokerVhost[] = asArray(parsed.vhosts).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const name = asString(entry.name).trim();
    if (!name) return [];
    const metadata = isRecord(entry.metadata) ? entry.metadata : {};
    return [
      {
        name,
        description: asString(metadata.description, asString(entry.description)),
        metadata: { description: asString(metadata.description), tags: normalizeTags(metadata.tags) },
        tracing: asBool(entry.tracing, false),
      },
    ];
  });

  const permissions: BrokerPermission[] = asArray(parsed.permissions).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const user = asString(entry.user).trim();
    const vhost = asString(entry.vhost).trim();
    if (!user || !vhost) return [];
    return [
      {
        user,
        vhost,
        configure: asString(entry.configure, ".*"),
        write: asString(entry.write, ".*"),
        read: asString(entry.read, ".*"),
      },
    ];
  });

  const policies: BrokerPolicy[] = asArray(parsed.policies).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const name = asString(entry.name).trim();
    const vhost = asString(entry.vhost).trim();
    if (!name || !vhost) return [];
    return [
      {
        vhost,
        name,
        pattern: asString(entry.pattern, ".*"),
        "apply-to": asString(entry["apply-to"], "queues"),
        definition: normalizeArgs(entry.definition),
        priority: asNumber(entry.priority),
      },
    ];
  });

  const queues: BrokerQueue[] = asArray(parsed.queues).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const name = asString(entry.name).trim();
    const vhost = asString(entry.vhost).trim();
    if (!name || !vhost) return [];
    return [
      {
        name,
        vhost,
        durable: asBool(entry.durable, true),
        auto_delete: asBool(entry.auto_delete, false),
        arguments: normalizeArgs(entry.arguments),
      },
    ];
  });

  const exchanges: BrokerExchange[] = asArray(parsed.exchanges).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    if (typeof entry.name !== "string") return [];
    const vhost = asString(entry.vhost).trim();
    if (!vhost) return [];
    return [
      {
        name: entry.name,
        vhost,
        type: normalizeExchangeType(entry.type),
        durable: asBool(entry.durable, true),
        auto_delete: asBool(entry.auto_delete, false),
        internal: asBool(entry.internal, false),
        arguments: normalizeArgs(entry.arguments),
      },
    ];
  });

  const bindings: BrokerBinding[] = asArray(parsed.bindings).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    if (typeof entry.source !== "string") return [];
    const vhost = asString(entry.vhost).trim();
    const destination = asString(entry.destination).trim();
    if (!vhost || !destination) return [];
    return [
      {
        source: entry.source,
        vhost,
        destination,
        destination_type: asString(entry.destination_type) === "exchange" ? "exchange" : "queue",
        routing_key: asString(entry.routing_key),
        arguments: normalizeArgs(entry.arguments),
      },
    ];
  });

  return {
    rabbit_version: asString(parsed.rabbit_version, "unknown"),
    users,
    vhosts,
    permissions,
    policies,
    queues,
    exchanges,
    bindings,
  };
}

function queueType(args: Record<string, string | number>): QueueType {
  const type = args["x-queue-type"];
  return type === "quorum" || type === "stream" ? type : "classic";
}

const queueKey = (vhost: string, name: string) => `${vhost}\u0000${name}`;
const policyKey = (vhost: string, name: string) => `${vhost}\u0000${name}`;
const exchangeKey = (vhost: string, name: string) => `${vhost}\u0000${name}`;
const bindingKey = (vhost: string, source: string, destination: string, type: string, routingKey: string) =>
  `${vhost}\u0000${source}\u0000${destination}\u0000${type}\u0000${routingKey}`;

export interface AppliedDefinitions {
  data: SeedData;
  imported: number;
  skipped: number;
}

export function applyDefinitions(
  data: SeedData,
  defs: BrokerDefinitions,
  overwrite: boolean
): AppliedDefinitions {
  const now = new Date().getTime();
  let imported = 0;
  let skipped = 0;

  const referencedVhosts = new Set<string>([
    ...defs.vhosts.map((vhost) => vhost.name),
    ...defs.queues.map((queue) => queue.vhost),
    ...defs.exchanges.map((exchange) => exchange.vhost),
    ...defs.bindings.map((binding) => binding.vhost),
    ...defs.policies.map((policy) => policy.vhost),
    ...defs.permissions.map((permission) => permission.vhost),
  ]);

  const vhostMap = new Map(data.vhosts.map((vhost) => [vhost.name, { ...vhost }]));
  for (const declared of defs.vhosts) {
    const existing = vhostMap.get(declared.name);
    if (!existing) {
      vhostMap.set(declared.name, {
        name: declared.name,
        description: declared.description,
        tracing: declared.tracing,
      });
      imported += 1;
    } else if (overwrite) {
      vhostMap.set(declared.name, {
        ...existing,
        description: declared.description,
        tracing: declared.tracing,
      });
      imported += 1;
    } else {
      skipped += 1;
    }
  }
  for (const name of referencedVhosts) {
    if (vhostMap.has(name)) continue;
    vhostMap.set(name, { name, description: "Imported virtual host", tracing: false });
    imported += 1;
  }

  const queueMap = new Map(data.queues.map((queue) => [queueKey(queue.vhost, queue.name), queue]));
  for (const entry of defs.queues) {
    const key = queueKey(entry.vhost, entry.name);
    const existing = queueMap.get(key);
    if (existing && !overwrite) {
      skipped += 1;
      continue;
    }
    const type = queueType(entry.arguments);
    queueMap.set(
      key,
      existing
        ? {
            ...existing,
            type,
            durable: entry.durable,
            autoDelete: entry.auto_delete,
            args: entry.arguments,
          }
        : {
            name: entry.name,
            vhost: entry.vhost,
            type,
            durable: entry.durable,
            autoDelete: entry.auto_delete,
            exclusive: false,
            state: "idle",
            ready: 0,
            unacked: 0,
            consumers: 0,
            publishRate: 0,
            deliverRate: 0,
            ackRate: 0,
            redelivered: 0,
            memory: 0,
            policy: null,
            args: entry.arguments,
            created: now,
          }
    );
    imported += 1;
  }

  const exchangeMap = new Map(
    data.exchanges.map((exchange) => [exchangeKey(exchange.vhost, exchange.name), exchange])
  );
  for (const entry of defs.exchanges) {
    if (entry.name === "" || entry.name.startsWith("amq.")) {
      skipped += 1;
      continue;
    }
    const key = exchangeKey(entry.vhost, entry.name);
    const existing = exchangeMap.get(key);
    if (existing && !overwrite) {
      skipped += 1;
      continue;
    }
    exchangeMap.set(
      key,
      existing
        ? {
            ...existing,
            type: entry.type,
            durable: entry.durable,
            autoDelete: entry.auto_delete,
            internal: entry.internal,
            args: entry.arguments,
          }
        : {
            name: entry.name,
            vhost: entry.vhost,
            type: entry.type,
            durable: entry.durable,
            autoDelete: entry.auto_delete,
            internal: entry.internal,
            publishRate: 0,
            deliverRate: 0,
            args: entry.arguments,
          }
    );
    imported += 1;
  }

  const bindingKeys = new Set(
    data.bindings.map((binding) =>
      bindingKey(binding.vhost, binding.source, binding.destination, binding.destType, binding.routingKey)
    )
  );
  const bindings = [...data.bindings];
  for (const entry of defs.bindings) {
    const key = bindingKey(
      entry.vhost,
      entry.source,
      entry.destination,
      entry.destination_type,
      entry.routing_key
    );
    if (bindingKeys.has(key)) {
      skipped += 1;
      continue;
    }
    bindingKeys.add(key);
    bindings.push({
      source: entry.source,
      vhost: entry.vhost,
      destination: entry.destination,
      destType: entry.destination_type,
      routingKey: entry.routing_key,
      args: entry.arguments,
    });
    imported += 1;
  }

  const permissionVhosts = new Map<string, string[]>();
  for (const permission of defs.permissions) {
    const list = permissionVhosts.get(permission.user) ?? [];
    if (!list.includes(permission.vhost)) list.push(permission.vhost);
    permissionVhosts.set(permission.user, list);
  }

  const userMap = new Map(data.users.map((user) => [user.username, user]));
  for (const entry of defs.users) {
    const existing = userMap.get(entry.name);
    if (existing && !overwrite) {
      skipped += 1;
      continue;
    }
    userMap.set(entry.name, {
      username: entry.name,
      tags: entry.tags.length ? entry.tags : (existing?.tags ?? []),
      vhosts: permissionVhosts.get(entry.name) ?? existing?.vhosts ?? [],
      hash: entry.hashing_algorithm || existing?.hash || "rabbit_password_hashing_sha256",
    });
    imported += 1;
  }

  const policyMap = new Map<string, Policy>(
    data.policies.map((policy) => [policyKey(policy.vhost, policy.name), policy])
  );
  for (const entry of defs.policies) {
    const key = policyKey(entry.vhost, entry.name);
    if (policyMap.has(key) && !overwrite) {
      skipped += 1;
      continue;
    }
    policyMap.set(key, {
      name: entry.name,
      vhost: entry.vhost,
      pattern: entry.pattern,
      applyTo: entry["apply-to"],
      priority: entry.priority,
      definition: entry.definition,
    });
    imported += 1;
  }

  return {
    data: {
      ...data,
      vhosts: [...vhostMap.values()],
      queues: [...queueMap.values()],
      exchanges: [...exchangeMap.values()],
      bindings,
      users: [...userMap.values()],
      policies: [...policyMap.values()],
    },
    imported,
    skipped,
  };
}
