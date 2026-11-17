import { useMemo } from "react"
import { fmtRate } from "@/lib/format"
import {
  averageSeries,
  buildRateChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data"
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api"
import { ChartFrame, ChartRangeTabs, RateChart } from "@/components/charts"

type Props = {
  detail: QueueDetail | null
  range: QueueRateRange
  setRange: (range: QueueRateRange) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function MessageRatesChart({
  detail,
  range,
  setRange,
  loading,
  error,
  onRetry,
}: Props) {
  const data = useMemo(() => {
    if (!detail) return []
    return buildRateChartDataFromSamples([
      { key: "publish", samples: detail.rates.publish.samples },
      { key: "deliver", samples: detail.rates.deliver.samples },
      { key: "ack", samples: detail.rates.ack.samples },
      { key: "redeliver", samples: detail.rates.redeliver.samples },
    ])
  }, [detail])

  return (
    <ChartFrame
      title="Message rates"
      description={`Publish, deliver, ack and redeliver rates per second over the ${RATE_WINDOWS[range]}.`}
      actions={
        <ChartRangeTabs
          value={range}
          onChange={setRange}
          options={RATE_RANGES}
        />
      }
      hasData={data.length > 1}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyDescription="The broker has not recorded message rates for this range."
    >
      <RateChart
        title="Message rates"
        data={data}
        series={[
          {
            key: "publish",
            label: "Publish",
            color: "var(--chart-1)",
            legend: `Publish avg ${fmtRate(averageSeries(data, "publish"))}`,
          },
          {
            key: "deliver",
            label: "Deliver",
            color: "var(--chart-2)",
            legend: `Deliver avg ${fmtRate(averageSeries(data, "deliver"))}`,
          },
          {
            key: "ack",
            label: "Ack",
            color: "var(--chart-3)",
            legend: `Ack avg ${fmtRate(averageSeries(data, "ack"))}`,
          },
          {
            key: "redeliver",
            label: "Redeliver",
            color: "var(--chart-4)",
            legend: `Redeliver avg ${fmtRate(
              averageSeries(data, "redeliver")
            )}`,
          },
        ]}
      />
    </ChartFrame>
  )
}
