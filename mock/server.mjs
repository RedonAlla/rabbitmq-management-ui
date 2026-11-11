// Mock RabbitMQ Management HTTP API.
// Endpoints, payloads and headers mirror a real broker so the UI can switch
// between this server and a real broker only by changing VITE_API_BASE_URL.
//
// Run with: npm run mock
import { createServer } from "node:http"
import { createState } from "./data.mjs"

const PORT = Number(process.env.MOCK_PORT ?? 15673)

const CREDENTIALS = new Map([
  ["admin", "admin"],
  ["guest", "guest"],
])

const state = createState()

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Type",
}

function sendJson(res, status, body, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    ...CORS_HEADERS,
    ...extra,
  })
  res.end(body === undefined ? "" : JSON.stringify(body))
}

function sendEmpty(res, status) {
  res.writeHead(status, { "Cache-Control": "no-cache", ...CORS_HEADERS })
  res.end()
}

function sendError(res, status, error, reason) {
  const extra =
    status === 401
      ? { "WWW-Authenticate": 'Basic realm="RabbitMQ Management"' }
      : {}
  sendJson(res, status, { error, reason }, extra)
}

function authenticate(req) {
  const header = req.headers.authorization ?? ""
  if (!header.startsWith("Basic ")) return null
  let decoded = ""
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
  } catch {
    return null
  }
  const separator = decoded.indexOf(":")
  if (separator < 0) return null
  const username = decoded.slice(0, separator)
  const password = decoded.slice(separator + 1)
  if (CREDENTIALS.get(username) !== password) return null
  const user = state.users.find((entry) => entry.name === username)
  return user ?? { name: username, tags: "" }
}

function tagsOf(user) {
  const tags = user?.tags
  if (Array.isArray(tags)) return tags
  return String(tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function readJson(req) {
  const raw = await readBody(req)
  if (!raw.length) return {}
  try {
    return JSON.parse(raw.toString("utf8"))
  } catch {
    return {}
  }
}

function extractDefinitions(raw, contentType) {
  const text = raw.toString("utf8")
  if (!contentType.includes("multipart/form-data")) return JSON.parse(text)

  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  if (!match) throw new Error("Missing multipart boundary")
  const boundary = `--${match[1] ?? match[2]}`
  for (const part of text.split(boundary)) {
    const split = part.indexOf("\r\n\r\n")
    if (split < 0) continue
    const content = part.slice(split + 4).replace(/\r\n$/, "")
    if (!content.trim().startsWith("{")) continue
    return JSON.parse(content)
  }
  throw new Error("The upload did not contain a JSON definitions file")
}

function connectionPage(url) {
  const params = url.searchParams
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1)
  const pageSize = Math.max(0, Number(params.get("page_size") ?? 100) || 0)
  const name = params.get("name") ?? ""
  const useRegex = params.get("use_regex") === "true"
  const vhost = params.get("vhost") ?? ""
  const sort = params.get("sort") ?? ""
  const reverse = params.get("sort_reverse") === "true"

  let items = state.connections
  if (name) {
    const needle = name.toLowerCase()
    let pattern = null
    if (useRegex) {
      try {
        pattern = new RegExp(name, "i")
      } catch {
        pattern = null
      }
    }
    items = items.filter((connection) => {
      if (pattern) return pattern.test(connection.name) || pattern.test(connection.user_provided_name ?? "")
      return (
        connection.name.toLowerCase().includes(needle) ||
        (connection.user_provided_name ?? "").toLowerCase().includes(needle)
      )
    })
  }
  if (vhost) items = items.filter((connection) => connection.vhost === vhost)

  if (sort) {
    items = [...items].sort((a, b) => {
      const left = sortValue(a, sort)
      const right = sortValue(b, sort)
      if (typeof left === "number" && typeof right === "number") return left - right
      return String(left).localeCompare(String(right))
    })
    if (reverse) items.reverse()
  }

  const filteredCount = items.length
  const effectiveSize = pageSize === 0 ? filteredCount || 1 : pageSize
  const pageCount = Math.max(1, Math.ceil(filteredCount / effectiveSize))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * effectiveSize

  return {
    total_count: state.connections.length,
    item_count: items.slice(start, start + effectiveSize).length,
    filtered_count: filteredCount,
    page: current,
    page_size: effectiveSize,
    page_count: pageCount,
    items: items.slice(start, start + effectiveSize),
  }
}

function sortValue(connection, path) {
  if (path === "client_properties.connection_name") return connection.user_provided_name ?? ""
  if (path === "recv_oct_details.rate") return connection.recv_oct_details.rate
  if (path === "send_oct_details.rate") return connection.send_oct_details.rate
  return path.split(".").reduce((value, key) => value?.[key], connection) ?? ""
}

function rateDetails(counter, rate, ageSeconds, incrSeconds) {
  const count = Math.max(2, Math.round(ageSeconds / incrSeconds))
  const samples = []
  let value = Math.max(0, Math.round(counter - rate * ageSeconds))
  for (let index = 0; index < count; index += 1) {
    const wave = 0.8 + 0.2 * Math.sin(index / 1.7)
    value += Math.round(rate * incrSeconds * wave)
    samples.push({
      sample: value,
      timestamp: Date.now() - (count - 1 - index) * incrSeconds * 1000,
    })
  }
  const avg = Math.round(samples.reduce((sum, entry) => sum + entry.sample, 0) / samples.length)
  return { rate, avg_rate: rate, avg, samples }
}

function recalcConsumers() {
  for (const channel of state.channels) {
    channel.consumer_count = state.consumers.filter(
      (consumer) => consumer.channel_details?.name === channel.name
    ).length
  }
  for (const queue of state.queues) {
    queue.consumers = state.consumers.filter(
      (consumer) => consumer.queue.name === queue.name && consumer.queue.vhost === queue.vhost
    ).length
  }
}

function topicMatches(pattern, routingKey) {
  if (!pattern) return routingKey === ""
  const regex = new RegExp(
    `^${pattern
      .split(".")
      .map((part) => (part === "#" ? ".*" : part === "*" ? "[^.]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("\\.")}$`
  )
  return regex.test(routingKey)
}

function routeMessage(exchangeName, vhost, routingKey) {
  if (!exchangeName) {
    return state.queues.find((queue) => queue.vhost === vhost && queue.name === routingKey)
  }
  const exchange = state.exchanges.find(
    (entry) => entry.vhost === vhost && entry.name === exchangeName
  )
  if (!exchange) return null
  for (const binding of state.bindings) {
    if (binding.vhost !== vhost || binding.source !== exchangeName) continue
    if (binding.destination_type !== "queue") continue
    const matches =
      exchange.type === "fanout"
        ? true
        : exchange.type === "topic"
          ? topicMatches(binding.routing_key, routingKey)
          : binding.routing_key === routingKey
    if (!matches) continue
    const queue = state.queues.find(
      (entry) => entry.vhost === vhost && entry.name === binding.destination
    )
    if (queue) {
      queue.messages_ready += 1
      return queue
    }
  }
  return null
}

function definitionsDocument() {
  return {
    rabbit_version: state.overview.rabbitmq_version,
    rabbitmq_version: state.overview.rabbitmq_version,
    users: state.users.map((user) => ({
      name: user.name,
      tags: tagsOf(user),
      password_hash: user.password_hash,
      hashing_algorithm: user.hashing_algorithm ?? "rabbit_password_hashing_sha256",
    })),
    vhosts: state.vhosts.map((vhost) => ({
      name: vhost.name,
      description: vhost.description,
      tags: vhost.tags ?? [],
      tracing: Boolean(vhost.tracing),
      default_queue_type: vhost.default_queue_type ?? "classic",
    })),
    permissions: state.permissions,
    parameters: [],
    global_parameters: [],
    policies: state.policies,
    operator_policies: state.operatorPolicies,
    queues: state.queues.map((queue) => ({
      name: queue.name,
      vhost: queue.vhost,
      durable: queue.durable,
      auto_delete: queue.auto_delete,
      exclusive: queue.exclusive,
      arguments: queue.arguments,
    })),
    exchanges: state.exchanges.map((exchange) => ({
      name: exchange.name,
      vhost: exchange.vhost,
      type: exchange.type,
      durable: exchange.durable,
      auto_delete: exchange.auto_delete,
      internal: exchange.internal,
      arguments: exchange.arguments,
    })),
    bindings: state.bindings,
    vhost_limits: state.vhostLimits,
  }
}

function mergeDefinitions(document) {
  const replaceBy = (target, source, keyOf, create) => {
    for (const entry of source ?? []) {
      const key = keyOf(entry)
      const index = target.findIndex((existing) => keyOf(existing) === key)
      const next = create(entry)
      if (index >= 0) target[index] = next
      else target.push(next)
    }
  }

  replaceBy(state.vhosts, document.vhosts, (entry) => entry.name, (entry) => ({
    name: entry.name,
    description: entry.description ?? "",
    tags: entry.tags ?? [],
    tracing: Boolean(entry.tracing),
    default_queue_type: entry.default_queue_type ?? "classic",
    cluster_state: {},
  }))
  replaceBy(state.users, document.users, (entry) => entry.name, (entry) => ({
    name: entry.name,
    tags: Array.isArray(entry.tags) ? entry.tags.join(",") : String(entry.tags ?? ""),
    password_hash: entry.password_hash ?? "rabbit_password_hashing_sha256",
    hashing_algorithm: entry.hashing_algorithm ?? "rabbit_password_hashing_sha256",
  }))
  replaceBy(
    state.permissions,
    document.permissions,
    (entry) => `${entry.vhost}\u0000${entry.user}`,
    (entry) => ({
      user: entry.user,
      vhost: entry.vhost,
      configure: entry.configure ?? ".*",
      write: entry.write ?? ".*",
      read: entry.read ?? ".*",
    })
  )
  replaceBy(
    state.policies,
    document.policies,
    (entry) => `${entry.vhost}\u0000${entry.name}`,
    (entry) => ({
      name: entry.name,
      vhost: entry.vhost,
      pattern: entry.pattern ?? ".*",
      "apply-to": entry["apply-to"] ?? entry.applyTo ?? "queues",
      priority: Number(entry.priority ?? 0),
      definition: entry.definition ?? {},
    })
  )
  replaceBy(
    state.operatorPolicies,
    document.operator_policies,
    (entry) => `${entry.vhost}\u0000${entry.name}`,
    (entry) => ({
      name: entry.name,
      vhost: entry.vhost,
      pattern: entry.pattern ?? ".*",
      "apply-to": entry["apply-to"] ?? entry.applyTo ?? "queues",
      priority: Number(entry.priority ?? 0),
      definition: entry.definition ?? {},
    })
  )
  replaceBy(
    state.queues,
    document.queues,
    (entry) => `${entry.vhost}\u0000${entry.name}`,
    (entry) => ({
      ...queueShape(entry),
    })
  )
  replaceBy(
    state.exchanges,
    document.exchanges,
    (entry) => `${entry.vhost}\u0000${entry.name}`,
    (entry) => ({
      name: entry.name ?? "",
      vhost: entry.vhost ?? "/",
      type: entry.type ?? "direct",
      durable: entry.durable ?? true,
      auto_delete: entry.auto_delete ?? false,
      internal: entry.internal ?? false,
      arguments: entry.arguments ?? {},
      message_stats: { publish_details: { rate: 0 }, deliver_details: { rate: 0 } },
    })
  )
  replaceBy(
    state.bindings,
    document.bindings,
    (entry) => `${entry.vhost}\u0000${entry.source}\u0000${entry.destination}\u0000${entry.routing_key}`,
    (entry) => ({
      source: entry.source ?? "",
      vhost: entry.vhost ?? "/",
      destination: entry.destination,
      destination_type: entry.destination_type ?? "queue",
      routing_key: entry.routing_key ?? "",
      arguments: entry.arguments ?? {},
    })
  )
  replaceBy(
    state.vhostLimits,
    document.vhost_limits,
    (entry) => entry.vhost,
    (entry) => ({ vhost: entry.vhost, value: entry.value ?? {} })
  )
  recalcConsumers()
}

function queueShape(entry) {
  const type = entry.arguments?.["x-queue-type"] ?? entry.type ?? "classic"
  return {
    name: entry.name,
    vhost: entry.vhost ?? "/",
    type,
    durable: entry.durable ?? true,
    auto_delete: entry.auto_delete ?? false,
    exclusive: entry.exclusive ?? false,
    state: "idle",
    messages_ready: 0,
    messages_unacknowledged: 0,
    consumers: 0,
    consumer_utilisation: null,
    memory: 0,
    policy: null,
    arguments: entry.arguments ?? {},
    exclusive_consumer_tag: null,
    node: state.overview.node,
    message_stats: {
      publish_details: { rate: 0 },
      deliver_details: { rate: 0 },
      ack_details: { rate: 0 },
      redeliver: 0,
    },
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" })
    res.end()
    return
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
  const segments = url.pathname.split("/").slice(1).map(decodeURIComponent)
  while (segments.length && segments[segments.length - 1] === "") segments.pop()
  const path = segments

  if (path[0] !== "api") {
    sendError(res, 404, "not_found", `No route for ${url.pathname}`)
    return
  }

  const user = authenticate(req)
  if (!user) {
    sendError(res, 401, "not_authorized", "Login failed")
    return
  }

  const method = req.method ?? "GET"
  const [, resource, ...rest] = path

  try {
    if (resource === "whoami" && method === "GET") {
      sendJson(res, 200, { name: user.name, tags: tagsOf(user), is_internal: false })
      return
    }

    if (resource === "overview" && method === "GET") {
      const ready = state.queues.reduce((sum, queue) => sum + queue.messages_ready, 0)
      const unacked = state.queues.reduce((sum, queue) => sum + queue.messages_unacknowledged, 0)
      const publishRate = state.queues.reduce((sum, queue) => sum + queue.message_stats.publish_details.rate, 0)
      const deliverRate = state.queues.reduce((sum, queue) => sum + queue.message_stats.deliver_details.rate, 0)
      const ackRate = state.queues.reduce((sum, queue) => sum + queue.message_stats.ack_details.rate, 0)
      const churn = (rate) => ({ rate, samples: [] })
      sendJson(res, 200, {
        ...state.overview,
        object_totals: {
          queues: state.queues.length,
          exchanges: state.exchanges.length,
          connections: state.connections.length,
          channels: state.channels.length,
          consumers: state.consumers.length,
        },
        queue_totals: {
          messages: ready + unacked,
          messages_ready: ready,
          messages_unacknowledged: unacked,
        },
        message_stats: {
          publish: 0,
          publish_details: { rate: publishRate },
          deliver: 0,
          deliver_details: { rate: deliverRate },
          ack: 0,
          ack_details: { rate: ackRate },
        },
        churn_rates: {
          connection_created: state.connections.length * 0.04,
          connection_closed: state.connections.length * 0.035,
          channel_created: state.channels.length * 0.06,
          channel_closed: state.channels.length * 0.05,
          queue_created: state.queues.length * 0.012,
          queue_deleted: state.queues.length * 0.008,
          queue_declared: state.queues.length * 0.016,
          connection_created_details: churn(state.connections.length * 0.04),
          connection_closed_details: churn(state.connections.length * 0.035),
          channel_created_details: churn(state.channels.length * 0.06),
          channel_closed_details: churn(state.channels.length * 0.05),
          queue_created_details: churn(state.queues.length * 0.012),
          queue_deleted_details: churn(state.queues.length * 0.008),
          queue_declared_details: churn(state.queues.length * 0.016),
        },
      })
      return
    }

    if (resource === "nodes" && method === "GET") {
      sendJson(res, 200, state.nodes)
      return
    }

    if (resource === "vhosts") {
      if (!rest.length && method === "GET") {
        sendJson(res, 200, state.vhosts)
        return
      }
      if (!rest.length && method === "POST") {
        const body = await readJson(req)
        if (state.vhosts.some((entry) => entry.name === body.name)) {
          sendError(res, 400, "bad_request", `virtual host '${body.name}' already exists`)
          return
        }
        state.vhosts.push({
          name: body.name,
          description: body.description ?? "",
          tags: body.tags ?? [],
          tracing: Boolean(body.tracing),
          default_queue_type: "classic",
          cluster_state: {},
        })
        sendEmpty(res, 201)
        return
      }
      const name = rest[0]
      if (rest.length === 1 && method === "GET") {
        const vhost = state.vhosts.find((entry) => entry.name === name)
        if (!vhost) return sendError(res, 404, "not_found", `vhost '${name}' not found`)
        sendJson(res, 200, vhost)
        return
      }
      if (rest.length === 1 && method === "PUT") {
        const body = await readJson(req)
        const existing = state.vhosts.find((entry) => entry.name === name)
        if (existing) {
          existing.description = body.description ?? existing.description
          existing.tracing = Boolean(body.tracing ?? existing.tracing)
          existing.tags = body.tags ?? existing.tags
        } else {
          state.vhosts.push({
            name,
            description: body.description ?? "",
            tags: body.tags ?? [],
            tracing: Boolean(body.tracing),
            default_queue_type: body.default_queue_type ?? "classic",
            cluster_state: {},
          })
        }
        sendEmpty(res, 201)
        return
      }
      if (rest.length === 1 && method === "DELETE") {
        const used =
          state.queues.some((entry) => entry.vhost === name) ||
          state.exchanges.some((entry) => entry.vhost === name) ||
          state.connections.some((entry) => entry.vhost === name)
        if (used) {
          sendError(res, 400, "bad_request", `virtual host '${name}' is not empty`)
          return
        }
        state.vhosts = state.vhosts.filter((entry) => entry.name !== name)
        state.permissions = state.permissions.filter((entry) => entry.vhost !== name)
        state.policies = state.policies.filter((entry) => entry.vhost !== name)
        state.operatorPolicies = state.operatorPolicies.filter((entry) => entry.vhost !== name)
        state.vhostLimits = state.vhostLimits.filter((entry) => entry.vhost !== name)
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "queues") {
      if (!rest.length && method === "GET") {
        const vhost = url.searchParams.get("vhost")
        sendJson(res, 200, vhost ? state.queues.filter((entry) => entry.vhost === vhost) : state.queues)
        return
      }
      const [vhost, name, action] = rest
      const queue = state.queues.find((entry) => entry.vhost === vhost && entry.name === name)
      if (rest.length === 2 && method === "GET") {
        if (!queue) return sendError(res, 404, "not_found", `queue '${name}' in vhost '${vhost}' not found`)
        sendJson(res, 200, queue)
        return
      }
      if (rest.length === 2 && method === "PUT") {
        const body = await readJson(req)
        if (queue) {
          queue.durable = body.durable ?? queue.durable
          queue.auto_delete = body.auto_delete ?? queue.auto_delete
          queue.arguments = body.arguments ?? queue.arguments
        } else {
          state.queues.push(
            queueShape({
              name,
              vhost,
              durable: body.durable,
              auto_delete: body.auto_delete,
              arguments: body.arguments ?? {},
            })
          )
        }
        sendEmpty(res, 201)
        return
      }
      if (rest.length === 2 && method === "DELETE") {
        if (!queue) return sendError(res, 404, "not_found", `queue '${name}' in vhost '${vhost}' not found`)
        state.queues = state.queues.filter((entry) => !(entry.vhost === vhost && entry.name === name))
        state.bindings = state.bindings.filter(
          (entry) => !(entry.vhost === vhost && entry.destination === name)
        )
        state.consumers = state.consumers.filter(
          (entry) => !(entry.queue.vhost === vhost && entry.queue.name === name)
        )
        recalcConsumers()
        sendEmpty(res, 204)
        return
      }
      if (rest.length === 3 && action === "contents" && method === "DELETE") {
        if (!queue) return sendError(res, 404, "not_found", `queue '${name}' in vhost '${vhost}' not found`)
        queue.messages_ready = 0
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "exchanges") {
      if (!rest.length && method === "GET") {
        const vhost = url.searchParams.get("vhost")
        sendJson(res, 200, vhost ? state.exchanges.filter((entry) => entry.vhost === vhost) : state.exchanges)
        return
      }
      const [vhost, name] = rest
      const exchange = state.exchanges.find(
        (entry) => entry.vhost === vhost && entry.name === name
      )
      if (rest.length === 2 && method === "GET") {
        if (!exchange) return sendError(res, 404, "not_found", `exchange '${name}' in vhost '${vhost}' not found`)
        sendJson(res, 200, exchange)
        return
      }
      if (rest.length === 2 && method === "PUT") {
        const body = await readJson(req)
        if (exchange) {
          exchange.type = body.type ?? exchange.type
          exchange.durable = body.durable ?? exchange.durable
          exchange.auto_delete = body.auto_delete ?? exchange.auto_delete
          exchange.internal = body.internal ?? exchange.internal
          exchange.arguments = body.arguments ?? exchange.arguments
        } else {
          state.exchanges.push({
            name,
            vhost,
            type: body.type ?? "direct",
            durable: body.durable ?? true,
            auto_delete: body.auto_delete ?? false,
            internal: body.internal ?? false,
            arguments: body.arguments ?? {},
            message_stats: { publish_details: { rate: 0 }, deliver_details: { rate: 0 } },
          })
        }
        sendEmpty(res, 201)
        return
      }
      if (rest.length === 2 && method === "DELETE") {
        if (!exchange) return sendError(res, 404, "not_found", `exchange '${name}' in vhost '${vhost}' not found`)
        state.exchanges = state.exchanges.filter(
          (entry) => !(entry.vhost === vhost && entry.name === name)
        )
        state.bindings = state.bindings.filter(
          (entry) => !(entry.vhost === vhost && entry.source === name)
        )
        sendEmpty(res, 204)
        return
      }
      if (rest.length === 3 && name !== undefined && rest[2] === "publish" && method === "POST") {
        const body = await readJson(req)
        if (!exchange) return sendError(res, 404, "not_found", `exchange '${name}' in vhost '${vhost}' not found`)
        const routed = routeMessage(name, vhost, body.routing_key ?? "")
        sendJson(res, 200, { routed: Boolean(routed) })
        return
      }
    }

    if (resource === "bindings" && method === "GET") {
      const vhost = rest[0] ?? url.searchParams.get("vhost")
      sendJson(res, 200, vhost ? state.bindings.filter((entry) => entry.vhost === vhost) : state.bindings)
      return
    }

    if (resource === "consumers" && method === "GET") {
      const vhost = rest[0] ?? url.searchParams.get("vhost")
      sendJson(res, 200, vhost ? state.consumers.filter((entry) => entry.queue.vhost === vhost) : state.consumers)
      return
    }

    if (resource === "channels") {
      if (!rest.length && method === "GET") {
        const vhost = url.searchParams.get("vhost")
        sendJson(res, 200, vhost ? state.channels.filter((entry) => entry.vhost === vhost) : state.channels)
        return
      }
      const name = rest.join("/")
      const channel = state.channels.find((entry) => entry.name === name)
      if (rest.length && method === "GET") {
        if (!channel) return sendError(res, 404, "not_found", `channel '${name}' not found`)
        sendJson(res, 200, channel)
        return
      }
      if (rest.length && method === "DELETE") {
        if (!channel) return sendError(res, 404, "not_found", `channel '${name}' not found`)
        const connection = state.connections.find(
          (entry) => entry.name === channel.connection_details.name
        )
        if (connection) connection.channels = Math.max(0, connection.channels - 1)
        state.channels = state.channels.filter((entry) => entry.name !== name)
        state.consumers = state.consumers.filter(
          (entry) => entry.channel_details.name !== name
        )
        recalcConsumers()
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "connections") {
      if (!rest.length && method === "GET") {
        sendJson(res, 200, connectionPage(url))
        return
      }
      if (
        rest.length >= 2 &&
        rest[rest.length - 1] === "channels" &&
        method === "GET"
      ) {
        const name = rest.slice(0, -1).join("/")
        const connection = state.connections.find((entry) => entry.name === name)
        if (!connection) return sendError(res, 404, "not_found", `connection '${name}' not found`)
        sendJson(
          res,
          200,
          state.channels.filter(
            (entry) => entry.connection_details.name === name
          )
        )
        return
      }
      const name = rest.join("/")
      const connection = state.connections.find((entry) => entry.name === name)
      if (rest.length && method === "GET") {
        if (!connection) return sendError(res, 404, "not_found", `connection '${name}' not found`)
        const age = Math.max(60, Number(url.searchParams.get("data_rates_age") ?? 60) || 60)
        const incr = Math.max(5, Number(url.searchParams.get("data_rates_incr") ?? 5) || 5)
        sendJson(res, 200, {
          ...connection,
          recv_oct_details: rateDetails(connection.recv_oct, connection.recv_oct_details.rate, age, incr),
          send_oct_details: rateDetails(connection.send_oct, connection.send_oct_details.rate, age, incr),
          reductions_details: rateDetails(
            connection.reductions,
            connection.reductions_details.rate,
            age,
            incr
          ),
        })
        return
      }
      if (rest.length && method === "DELETE") {
        if (!connection) return sendError(res, 404, "not_found", `connection '${name}' not found`)
        const channelNames = new Set(
          state.channels
            .filter((entry) => entry.connection_details.name === name)
            .map((entry) => entry.name)
        )
        state.connections = state.connections.filter((entry) => entry.name !== name)
        state.channels = state.channels.filter(
          (entry) => entry.connection_details.name !== name
        )
        state.consumers = state.consumers.filter(
          (entry) => !channelNames.has(entry.channel_details.name)
        )
        recalcConsumers()
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "users") {
      if (!rest.length && method === "GET") {
        sendJson(res, 200, state.users)
        return
      }
      const name = rest[0]
      const entry = state.users.find((candidate) => candidate.name === name)
      if (rest.length === 1 && method === "GET") {
        if (!entry) return sendError(res, 404, "not_found", `user '${name}' not found`)
        sendJson(res, 200, entry)
        return
      }
      if (rest.length === 1 && method === "PUT") {
        const body = await readJson(req)
        const tags = Array.isArray(body.tags) ? body.tags.join(",") : String(body.tags ?? "")
        if (entry) {
          entry.tags = tags
          entry.password_hash = body.password_hash ?? entry.password_hash
        } else {
          state.users.push({
            name,
            tags,
            password_hash: body.password_hash ?? "rabbit_password_hashing_sha256",
            hashing_algorithm: "rabbit_password_hashing_sha256",
          })
        }
        if (body.password && CREDENTIALS.get(name) === undefined) {
          CREDENTIALS.set(name, body.password)
        }
        sendEmpty(res, 201)
        return
      }
      if (rest.length === 1 && method === "DELETE") {
        if (!entry) return sendError(res, 404, "not_found", `user '${name}' not found`)
        state.users = state.users.filter((candidate) => candidate.name !== name)
        state.permissions = state.permissions.filter((permission) => permission.user !== name)
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "permissions") {
      if (!rest.length && method === "GET") {
        const vhost = url.searchParams.get("vhost")
        sendJson(res, 200, vhost ? state.permissions.filter((entry) => entry.vhost === vhost) : state.permissions)
        return
      }
      const [vhost, name] = rest
      if (rest.length === 2 && method === "PUT") {
        const body = await readJson(req)
        const existing = state.permissions.find(
          (entry) => entry.vhost === vhost && entry.user === name
        )
        const next = {
          user: name,
          vhost,
          configure: body.configure ?? ".*",
          write: body.write ?? ".*",
          read: body.read ?? ".*",
        }
        if (existing) Object.assign(existing, next)
        else state.permissions.push(next)
        sendEmpty(res, 201)
        return
      }
      if (rest.length === 2 && method === "DELETE") {
        state.permissions = state.permissions.filter(
          (entry) => !(entry.vhost === vhost && entry.user === name)
        )
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "policies" || resource === "operator-policies") {
      const target = resource === "policies" ? "policies" : "operatorPolicies"
      if (!rest.length && method === "GET") {
        sendJson(res, 200, state[target])
        return
      }
      const [vhost, name] = rest
      if (rest.length === 2 && method === "PUT") {
        const body = await readJson(req)
        const existing = state[target].find(
          (entry) => entry.vhost === vhost && entry.name === name
        )
        const next = {
          name,
          vhost,
          pattern: body.pattern ?? ".*",
          "apply-to": body["apply-to"] ?? "queues",
          priority: Number(body.priority ?? 0),
          definition: body.definition ?? {},
        }
        if (existing) Object.assign(existing, next)
        else state[target].push(next)
        sendEmpty(res, 201)
        return
      }
      if (rest.length === 2 && method === "DELETE") {
        state[target] = state[target].filter(
          (entry) => !(entry.vhost === vhost && entry.name === name)
        )
        if (target === "policies") {
          for (const queue of state.queues) {
            if (queue.policy === name) queue.policy = null
          }
        }
        sendEmpty(res, 204)
        return
      }
    }

    if (resource === "vhost-limits") {
      if (!rest.length && method === "GET") {
        sendJson(res, 200, state.vhostLimits)
        return
      }
      const [vhost, limit] = rest
      if (rest.length <= 1 && method === "GET") {
        sendJson(res, 200, state.vhostLimits.filter((entry) => !vhost || entry.vhost === vhost))
        return
      }
      if (rest.length === 2 && (method === "PUT" || method === "DELETE")) {
        const body = method === "PUT" ? await readJson(req) : {}
        let entry = state.vhostLimits.find((candidate) => candidate.vhost === vhost)
        if (!entry) {
          entry = { vhost, value: {} }
          state.vhostLimits.push(entry)
        }
        if (method === "PUT") entry.value[limit] = Number(body.value ?? body)
        else delete entry.value[limit]
        if (!Object.keys(entry.value).length) {
          state.vhostLimits = state.vhostLimits.filter((candidate) => candidate.vhost !== vhost)
        }
        sendEmpty(res, method === "PUT" ? 201 : 204)
        return
      }
    }

    if (resource === "feature-flags") {
      if (!rest.length && method === "GET") {
        sendJson(res, 200, state.featureFlags)
        return
      }
      const name = rest[0]
      if (rest.length === 2 && method === "POST" && (rest[1] === "enable" || rest[1] === "disable")) {
        const flag = state.featureFlags.find((entry) => entry.name === name)
        if (!flag) return sendError(res, 404, "not_found", `feature flag '${name}' not found`)
        flag.state = rest[1] === "enable" ? "enabled" : "disabled"
        sendJson(res, 200, flag)
        return
      }
    }

    if (resource === "deprecated-features" && method === "GET") {
      if (rest[0] === "used") {
        sendJson(res, 200, state.deprecatedFeatures.filter((entry) => entry.name === "ram_node_type"))
        return
      }
      sendJson(res, 200, state.deprecatedFeatures)
      return
    }

    if (resource === "definitions" && method === "GET") {
      sendJson(res, 200, definitionsDocument())
      return
    }

    if (resource === "definitions" && method === "POST") {
      const raw = await readBody(req)
      let document
      try {
        document = extractDefinitions(raw, String(req.headers["content-type"] ?? ""))
      } catch (cause) {
        sendError(res, 400, "bad_request", cause instanceof Error ? cause.message : "Invalid definitions")
        return
      }
      mergeDefinitions(document)
      sendEmpty(res, 201)
      return
    }

    sendError(res, 404, "not_found", `No route for ${req.method} ${url.pathname}`)
  } catch (cause) {
    sendError(res, 500, "internal_error", cause instanceof Error ? cause.message : "Unexpected error")
  }
})

server.listen(PORT, () => {
  console.log(`Mock RabbitMQ Management API listening on http://localhost:${PORT}`)
  console.log("Sign in with admin / admin (or guest / guest).")
})
