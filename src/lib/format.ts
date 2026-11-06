import type { ClusterInfo, HistoryPoint, RangeKey, SeedData } from "@/data/types";

const intFmt = new Intl.NumberFormat("en-US");
const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function fmtInt(value: number): string {
  return intFmt.format(Math.round(value));
}

export function fmtCompact(value: number): string {
  return compactFmt.format(value);
}

export function fmtRate(value: number): string {
  if (value === 0) return "0/s";
  if (value >= 100) return `${value.toFixed(0)}/s`;
  return `${value.toFixed(1)}/s`;
}

export function fmtBytesMb(value: number): string {
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`;
  if (value < 0.1) return "0 MB";
  return `${value.toFixed(1)} MB`;
}

export function fmtDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (!days) parts.push(`${rest}m`);
  return parts.join(" ");
}

export function fmtAgo(timestamp: number, now: number): string {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function fmtSince(timestamp: number, now: number): string {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function fmtDate(timestamp: number): string {
  return dateFmt.format(timestamp);
}

export function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function initials(name: string): string {
  return name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function definitionSummary(definition: Record<string, string | number>): string {
  return Object.entries(definition)
    .map(([key, value]) => `${key}=${value}`)
    .join(" · ");
}

export function hashStr(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ClusterTotals {
  queues: number;
  exchanges: number;
  connections: number;
  channels: number;
  consumers: number;
  ready: number;
  unacked: number;
  publishRate: number;
  deliverRate: number;
  ackRate: number;
}

export function getTotals(data: SeedData): ClusterTotals {
  return {
    queues: data.queues.length,
    exchanges: data.exchanges.length,
    connections: data.connections.length,
    channels: data.channels.length,
    consumers: data.consumers.length,
    ready: data.queues.reduce((sum, queue) => sum + queue.ready, 0),
    unacked: data.queues.reduce((sum, queue) => sum + queue.unacked, 0),
    publishRate: data.queues.reduce((sum, queue) => sum + queue.publishRate, 0),
    deliverRate: data.queues.reduce((sum, queue) => sum + queue.deliverRate, 0),
    ackRate: data.queues.reduce((sum, queue) => sum + queue.ackRate, 0),
  };
}

const RANGE_CONFIG: Record<RangeKey, { count: number; stepSeconds: number }> = {
  "1m": { count: 24, stepSeconds: 2.5 },
  "5m": { count: 60, stepSeconds: 5 },
  "1h": { count: 60, stepSeconds: 60 },
  "1d": { count: 60, stepSeconds: 1440 },
};

function rangeLabel(range: RangeKey, secondsAgo: number): string {
  if (secondsAgo <= 0) return "now";
  if (range === "1m") return `-${Math.round(secondsAgo)}s`;
  if (range === "5m") {
    const minutes = Math.floor(secondsAgo / 60);
    const seconds = Math.round(secondsAgo % 60);
    return `-${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  if (range === "1h") return `-${Math.round(secondsAgo / 60)}m`;
  const hours = Math.floor(secondsAgo / 3600);
  const minutes = Math.round((secondsAgo % 3600) / 60);
  return `-${hours}h${String(minutes).padStart(2, "0")}`;
}

export function buildHistory(
  totals: ClusterTotals,
  range: RangeKey,
  seed = "qoder-rabbit"
): HistoryPoint[] {
  const { count, stepSeconds } = RANGE_CONFIG[range];
  const random = mulberry32(hashStr(`${seed}:${range}`));
  const phase = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;

  return Array.from({ length: count }, (_, index) => {
    const position = index / (count - 1);
    const wave = Math.sin(position * Math.PI * 2.2 + phase) * 0.075;
    const waveB = Math.sin(position * Math.PI * 5.4 + phaseB) * 0.035;
    const jitter = (random() - 0.5) * 0.035;
    const shape = 1 + wave + waveB + jitter;
    const isLast = index === count - 1;
    const secondsAgo = (count - 1 - index) * stepSeconds;
    const depthDrift = 1 + (1 - position) * 0.06 + wave * 0.5;

    return {
      label: rangeLabel(range, secondsAgo),
      publish: isLast ? totals.publishRate : Math.max(0, totals.publishRate * shape),
      deliver: isLast ? totals.deliverRate : Math.max(0, totals.deliverRate * shape * 0.985),
      ack: isLast ? totals.ackRate : Math.max(0, totals.ackRate * shape * 0.97),
      ready: isLast ? totals.ready : Math.max(0, totals.ready * depthDrift),
      unacked: isLast ? totals.unacked : Math.max(0, totals.unacked * (1 + wave * 1.4)),
      consumers: isLast ? totals.consumers : Math.max(0, Math.round(totals.consumers * (1 + wave * 0.4))),
      connections: isLast ? totals.connections : Math.max(0, Math.round(totals.connections * (1 + waveB))),
    };
  });
}

export function buildAllHistory(totals: ClusterTotals): Record<RangeKey, HistoryPoint[]> {
  return {
    "1m": buildHistory(totals, "1m"),
    "5m": buildHistory(totals, "5m"),
    "1h": buildHistory(totals, "1h"),
    "1d": buildHistory(totals, "1d"),
  };
}

export function tickHistory(
  history: Record<RangeKey, HistoryPoint[]>,
  totals: ClusterTotals,
  tick: number
): Record<RangeKey, HistoryPoint[]> {
  const random = mulberry32(hashStr(`tick:${tick}`));
  const pushPoint = (range: RangeKey): HistoryPoint[] => {
    const points = history[range];
    const previous = points[points.length - 1];
    const jitter = (random() - 0.5) * 0.04;
    const next: HistoryPoint = {
      label: "now",
      publish: Math.max(0, previous.publish * (1 + jitter) + (totals.publishRate - previous.publish) * 0.35),
      deliver: Math.max(0, previous.deliver * (1 + jitter) + (totals.deliverRate - previous.deliver) * 0.35),
      ack: Math.max(0, previous.ack * (1 + jitter) + (totals.ackRate - previous.ack) * 0.35),
      ready: totals.ready,
      unacked: totals.unacked,
      consumers: totals.consumers,
      connections: totals.connections,
    };

    if (range === "1m") {
      const shifted = points.slice(1);
      return [...shifted, next].map((point, index, list) => ({
        ...point,
        label: index === list.length - 1 ? "now" : `-${Math.round((list.length - 1 - index) * 2.5)}s`,
      }));
    }

    const shifted = points.slice(0, -1);
    return [
      ...shifted,
      {
        ...points[points.length - 1],
        publish: next.publish,
        deliver: next.deliver,
        ack: next.ack,
        ready: next.ready,
        unacked: next.unacked,
        consumers: next.consumers,
        connections: next.connections,
      },
    ];
  };

  return {
    "1m": pushPoint("1m"),
    "5m": pushPoint("5m"),
    "1h": pushPoint("1h"),
    "1d": pushPoint("1d"),
  };
}

export function clusterHealthLabel(cluster: ClusterInfo, totals: ClusterTotals): string {
  if (totals.unacked > 200) return "Degraded";
  if (totals.ready > 100000) return "Busy";
  return `Healthy · ${cluster.version}`;
}
