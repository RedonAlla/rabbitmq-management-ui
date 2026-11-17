import type {
  ConnectionDetail,
  ConnectionRateSample,
  QueueRateRange,
} from "@/lib/rabbit-api"

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

export interface ChartPoint {
  label: string
  [series: string]: string | number | undefined
}

export interface ChartSeries {
  key: string
  label: string
  color: string
  legend?: string
}

export const RATE_RANGES: {
  value: QueueRateRange
  label: string
  ariaLabel: string
}[] = [
  { value: 60, label: "1m", ariaLabel: "Last minute" },
  { value: 600, label: "10m", ariaLabel: "Last ten minutes" },
  { value: 3600, label: "1h", ariaLabel: "Last hour" },
]

export const RATE_WINDOWS: Record<QueueRateRange, string> = {
  60: "last minute",
  600: "last ten minutes",
  3600: "last hour",
}

export function chronological(samples: ConnectionRateSample[]): number[] {
  return [...samples]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((sample) => sample.sample)
}

export function samplesToRates(
  samples: ConnectionRateSample[]
): Map<number, number> {
  const ordered = [...samples].sort((a, b) => a.timestamp - b.timestamp)
  const rates = new Map<number, number>()
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]
    const current = ordered[index]
    const seconds = (current.timestamp - previous.timestamp) / 1000
    if (seconds <= 0) continue
    rates.set(
      current.timestamp,
      Math.max(0, (current.sample - previous.sample) / seconds)
    )
  }
  return rates
}

export function rateValues(samples: ConnectionRateSample[]): number[] {
  return [...samplesToRates(samples).values()]
}

export function averageSeries(data: ChartPoint[], key: string): number {
  let sum = 0
  let count = 0
  for (const point of data) {
    const value = point[key]
    if (typeof value === "number") {
      sum += value
      count += 1
    }
  }
  return count ? sum / count : 0
}

export function buildRateChartDataFromSamples(
  series: { key: string; samples: ConnectionRateSample[] }[]
): ChartPoint[] {
  const rateMaps = new Map<string, Map<number, number>>()
  const timestamps = new Set<number>()
  for (const item of series) {
    const rates = samplesToRates(item.samples)
    rateMaps.set(item.key, rates)
    for (const timestamp of rates.keys()) timestamps.add(timestamp)
  }

  return [...timestamps]
    .sort((a, b) => a - b)
    .map((timestamp) => {
      const point: ChartPoint = { label: timeFmt.format(timestamp) }
      for (const item of series) {
        point[item.key] = rateMaps.get(item.key)?.get(timestamp)
      }
      return point
    })
}

export function buildLengthChartDataFromSamples(
  series: { key: string; samples: ConnectionRateSample[] }[]
): ChartPoint[] {
  const values = new Map<string, Map<number, number>>()
  const timestamps = new Set<number>()
  for (const item of series) {
    const ordered = [...item.samples].sort((a, b) => a.timestamp - b.timestamp)
    const byTimestamp = new Map<number, number>()
    for (const sample of ordered) {
      byTimestamp.set(sample.timestamp, sample.sample)
      timestamps.add(sample.timestamp)
    }
    values.set(item.key, byTimestamp)
  }

  return [...timestamps]
    .sort((a, b) => a - b)
    .map((timestamp) => {
      const point: ChartPoint = { label: timeFmt.format(timestamp) }
      for (const item of series) {
        point[item.key] = values.get(item.key)?.get(timestamp)
      }
      return point
    })
}

export function buildRateChartData(connection: ConnectionDetail): ChartPoint[] {
  return buildRateChartDataFromSamples([
    { key: "recv", samples: connection.recv.samples },
    { key: "send", samples: connection.send.samples },
    ...(connection.reductionsRate
      ? [{ key: "reductions", samples: connection.reductionsRate.samples }]
      : []),
  ])
}
