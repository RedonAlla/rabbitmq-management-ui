import type { Binding, Exchange, Queue } from "@/data/types"

export function matchTopic(pattern: string, key: string): boolean {
  if (pattern === key) return true
  const patternParts = pattern.split(".")
  const keyParts = key.split(".")

  const walk = (patternIndex: number, keyIndex: number): boolean => {
    if (patternIndex === patternParts.length)
      return keyIndex === keyParts.length
    const part = patternParts[patternIndex]
    if (part === "#") {
      for (let next = keyIndex; next <= keyParts.length; next += 1) {
        if (walk(patternIndex + 1, next)) return true
      }
      return false
    }
    if (keyIndex >= keyParts.length) return false
    if (part === "*" || part === keyParts[keyIndex]) {
      return walk(patternIndex + 1, keyIndex + 1)
    }
    return false
  }

  return walk(0, 0)
}

export function routeTargets(
  exchange: Exchange,
  routingKey: string,
  bindings: Binding[],
  queues: Queue[]
): string[] {
  if (exchange.name === "") {
    return queues.some(
      (queue) => queue.name === routingKey && queue.vhost === exchange.vhost
    )
      ? [routingKey]
      : []
  }

  const candidates = bindings.filter(
    (binding) =>
      binding.vhost === exchange.vhost &&
      binding.source === exchange.name &&
      binding.destType === "queue"
  )

  const matched = candidates.filter((binding) => {
    if (exchange.type === "fanout" || exchange.type === "headers") return true
    if (exchange.type === "direct") return binding.routingKey === routingKey
    return matchTopic(binding.routingKey, routingKey)
  })

  return Array.from(
    new Set(
      matched
        .map((binding) => binding.destination)
        .filter((name) =>
          queues.some(
            (queue) => queue.name === name && queue.vhost === exchange.vhost
          )
        )
    )
  )
}
