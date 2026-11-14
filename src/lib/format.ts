import type { ClusterInfo, HistoryPoint, RangeKey } from "@/data/types"

const intFmt = new Intl.NumberFormat("en-US")
const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function fmtInt(value: number): string {
  return intFmt.format(Math.round(value))
}

export function fmtCompact(value: number): string {
  return compactFmt.format(value)
}

export function fmtRate(value: number): string {
  if (value === 0) return "0/s"
  if (value >= 100) return `${value.toFixed(0)}/s`
  return `${value.toFixed(1)}/s`
}

export function fmtBytesMb(value: number): string {
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`
  if (value >= 0.1) return `${value.toFixed(1)} MB`
  if (value > 0) return `${Math.round(value * 1024)} KB`
  return "0 MB"
}

export function fmtDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (!days) parts.push(`${rest}m`)
  return parts.join(" ")
}

export function fmtAgo(timestamp: number, now: number): string {
  const diff = Math.max(0, now - timestamp)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function fmtSince(timestamp: number, now: number): string {
  const diff = Math.max(0, now - timestamp)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export function fmtDate(timestamp: number): string {
  return dateFmt.format(timestamp)
}

export function pct(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, (value / max) * 100))
}

export function initials(name: string): string {
  return name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function definitionSummary(
  definition: Record<string, string | number>
): string {
  return Object.entries(definition)
    .map(([key, value]) => `${key}=${value}`)
    .join(" · ")
}

export interface ClusterTotals {
  queues: number
  exchanges: number
  connections: number
  channels: number
  consumers: number
  ready: number
  unacked: number
  publishRate: number
  deliverRate: number
  ackRate: number
  connectionCreatedRate: number
  connectionClosedRate: number
  channelCreatedRate: number
  channelClosedRate: number
  queueCreatedRate: number
  queueDeletedRate: number
  queueDeclaredRate: number
}

export function rangeLabel(range: RangeKey, secondsAgo: number): string {
  if (secondsAgo <= 0) return "now"
  if (range === "1m") return `-${Math.round(secondsAgo)}s`
  if (range === "5m") {
    const minutes = Math.floor(secondsAgo / 60)
    const seconds = Math.round(secondsAgo % 60)
    return `-${minutes}:${String(seconds).padStart(2, "0")}`
  }
  if (range === "1h") return `-${Math.round(secondsAgo / 60)}m`
  const hours = Math.floor(secondsAgo / 3600)
  const minutes = Math.round((secondsAgo % 3600) / 60)
  return `-${hours}h${String(minutes).padStart(2, "0")}`
}

export function clusterHealthLabel(
  cluster: ClusterInfo,
  totals: ClusterTotals
): string {
  if (!cluster.version) return "Connecting"
  if (totals.unacked > 200) return "Degraded"
  if (totals.ready > 100000) return "Busy"
  return `Healthy · ${cluster.version}`
}

export interface HistorySample {
  at: number
  totals: ClusterTotals
}

const HISTORY_WINDOW_MS: Record<RangeKey, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "1h": 3_600_000,
  "1d": 86_400_000,
}

const HISTORY_MAX_POINTS: Record<RangeKey, number> = {
  "1m": 24,
  "5m": 60,
  "1h": 60,
  "1d": 60,
}

export function pointFromTotals(
  totals: ClusterTotals,
  label: string
): HistoryPoint {
  return {
    label,
    publish: totals.publishRate,
    deliver: totals.deliverRate,
    ack: totals.ackRate,
    ready: totals.ready,
    unacked: totals.unacked,
    consumers: totals.consumers,
    connections: totals.connections,
    connectionCreated: totals.connectionCreatedRate,
    connectionClosed: totals.connectionClosedRate,
    channelCreated: totals.channelCreatedRate,
    channelClosed: totals.channelClosedRate,
    queueCreated: totals.queueCreatedRate,
    queueDeleted: totals.queueDeletedRate,
    queueDeclared: totals.queueDeclaredRate,
  }
}

export function historyFromSamples(
  samples: HistorySample[],
  now: number
): Record<RangeKey, HistoryPoint[]> {
  const build = (range: RangeKey): HistoryPoint[] => {
    const windowMs = HISTORY_WINDOW_MS[range]
    const inWindow = samples.filter((sample) => now - sample.at <= windowMs)
    if (!inWindow.length) return []
    const max = HISTORY_MAX_POINTS[range]
    const picked =
      inWindow.length <= max
        ? inWindow
        : Array.from(
            { length: max },
            (_, index) =>
              inWindow[Math.round((index * (inWindow.length - 1)) / (max - 1))]
          )
    return picked.map((sample) =>
      pointFromTotals(
        sample.totals,
        rangeLabel(range, (now - sample.at) / 1000)
      )
    )
  }

  return {
    "1m": build("1m"),
    "5m": build("5m"),
    "1h": build("1h"),
    "1d": build("1d"),
  }
}

export function trendFromSamples(
  samples: HistorySample[],
  current: ClusterTotals,
  now: number,
  key: keyof ClusterTotals
): number {
  if (!samples.length) return 0
  const cutoff = now - 60_000
  let base = samples[0]
  for (const sample of samples) {
    if (sample.at <= cutoff) base = sample
  }
  const before = base.totals[key]
  if (before <= 0) return 0
  return ((current[key] - before) / before) * 100
}
