import type { ExchangeType } from "@/data/types"

export interface BrokerUser {
  name: string
  password_hash: string
  hashing_algorithm: string
  tags: string[]
}

export interface BrokerVhost {
  name: string
  description: string
  metadata: { description: string; tags: string[] }
  tracing: boolean
}

export interface BrokerPermission {
  user: string
  vhost: string
  configure: string
  write: string
  read: string
}

export interface BrokerPolicy {
  vhost: string
  name: string
  pattern: string
  "apply-to": string
  definition: Record<string, string | number>
  priority: number
}

export interface BrokerQueue {
  name: string
  vhost: string
  durable: boolean
  auto_delete: boolean
  arguments: Record<string, string | number>
}

export interface BrokerExchange {
  name: string
  vhost: string
  type: ExchangeType
  durable: boolean
  auto_delete: boolean
  internal: boolean
  arguments: Record<string, string | number>
}

export interface BrokerBinding {
  source: string
  vhost: string
  destination: string
  destination_type: "queue" | "exchange"
  routing_key: string
  arguments: Record<string, string | number>
}

export interface BrokerDefinitions {
  rabbit_version: string
  users: BrokerUser[]
  vhosts: BrokerVhost[]
  permissions: BrokerPermission[]
  policies: BrokerPolicy[]
  queues: BrokerQueue[]
  exchanges: BrokerExchange[]
  bindings: BrokerBinding[]
}

export interface DefinitionCounts {
  vhosts: number
  queues: number
  exchanges: number
  bindings: number
  users: number
  policies: number
  total: number
}

export function summarizeDefinitions(
  defs: BrokerDefinitions
): DefinitionCounts {
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
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeArgs(value: unknown): Record<string, string | number> {
  if (!isRecord(value)) return {}
  const args: Record<string, string | number> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" || typeof entry === "number")
      args[key] = entry
    else if (typeof entry === "boolean") args[key] = String(entry)
  }
  return args
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeExchangeType(value: unknown): ExchangeType {
  const type = asString(value).toLowerCase()
  return type === "fanout" ||
    type === "topic" ||
    type === "headers" ||
    type === "x-local-random" ||
    type === "x-modulus-hash"
    ? type
    : "direct"
}

export function parseDefinitions(text: string): BrokerDefinitions {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("That file is not valid JSON.")
  }
  if (!isRecord(parsed)) {
    throw new Error("Definitions must be a JSON object.")
  }

  const known = [
    "users",
    "vhosts",
    "permissions",
    "policies",
    "queues",
    "exchanges",
    "bindings",
  ]
  if (!known.some((key) => Array.isArray(parsed[key]))) {
    throw new Error(
      "No broker definitions found. Expected users, vhosts, policies, queues, exchanges or bindings."
    )
  }

  const users: BrokerUser[] = asArray(parsed.users).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const name = asString(entry.name).trim()
    if (!name) return []
    return [
      {
        name,
        password_hash: asString(entry.password_hash),
        hashing_algorithm: asString(
          entry.hashing_algorithm,
          "rabbit_password_hashing_sha256"
        ),
        tags: normalizeTags(entry.tags),
      },
    ]
  })

  const vhosts: BrokerVhost[] = asArray(parsed.vhosts).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const name = asString(entry.name).trim()
    if (!name) return []
    const metadata = isRecord(entry.metadata) ? entry.metadata : {}
    return [
      {
        name,
        description: asString(
          metadata.description,
          asString(entry.description)
        ),
        metadata: {
          description: asString(metadata.description),
          tags: normalizeTags(metadata.tags),
        },
        tracing: asBool(entry.tracing, false),
      },
    ]
  })

  const permissions: BrokerPermission[] = asArray(parsed.permissions).flatMap(
    (entry) => {
      if (!isRecord(entry)) return []
      const user = asString(entry.user).trim()
      const vhost = asString(entry.vhost).trim()
      if (!user || !vhost) return []
      return [
        {
          user,
          vhost,
          configure: asString(entry.configure, ".*"),
          write: asString(entry.write, ".*"),
          read: asString(entry.read, ".*"),
        },
      ]
    }
  )

  const policies: BrokerPolicy[] = asArray(parsed.policies).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const name = asString(entry.name).trim()
    const vhost = asString(entry.vhost).trim()
    if (!name || !vhost) return []
    return [
      {
        vhost,
        name,
        pattern: asString(entry.pattern, ".*"),
        "apply-to": asString(entry["apply-to"], "queues"),
        definition: normalizeArgs(entry.definition),
        priority: asNumber(entry.priority),
      },
    ]
  })

  const queues: BrokerQueue[] = asArray(parsed.queues).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const name = asString(entry.name).trim()
    const vhost = asString(entry.vhost).trim()
    if (!name || !vhost) return []
    return [
      {
        name,
        vhost,
        durable: asBool(entry.durable, true),
        auto_delete: asBool(entry.auto_delete, false),
        arguments: normalizeArgs(entry.arguments),
      },
    ]
  })

  const exchanges: BrokerExchange[] = asArray(parsed.exchanges).flatMap(
    (entry) => {
      if (!isRecord(entry)) return []
      if (typeof entry.name !== "string") return []
      const vhost = asString(entry.vhost).trim()
      if (!vhost) return []
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
      ]
    }
  )

  const bindings: BrokerBinding[] = asArray(parsed.bindings).flatMap(
    (entry) => {
      if (!isRecord(entry)) return []
      if (typeof entry.source !== "string") return []
      const vhost = asString(entry.vhost).trim()
      const destination = asString(entry.destination).trim()
      if (!vhost || !destination) return []
      return [
        {
          source: entry.source,
          vhost,
          destination,
          destination_type:
            asString(entry.destination_type) === "exchange"
              ? "exchange"
              : "queue",
          routing_key: asString(entry.routing_key),
          arguments: normalizeArgs(entry.arguments),
        },
      ]
    }
  )

  return {
    rabbit_version: asString(parsed.rabbit_version, "unknown"),
    users,
    vhosts,
    permissions,
    policies,
    queues,
    exchanges,
    bindings,
  }
}
