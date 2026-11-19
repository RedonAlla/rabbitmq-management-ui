import { useMemo } from "react"
import { fmtRate } from "@/lib/format"
import {
  averageSeries,
  buildRateChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data"
import type { VhostDetail, VhostRateRange } from "@/lib/rabbit-api"
import { ChartFrame, ChartRangeTabs, RateChart } from "@/components/charts"

type Props = {
  detail: VhostDetail | null
  range: VhostRateRange
  setRange: (range: VhostRateRange) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function VhostMessageRatesChart({
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
      { key: "confirm", samples: detail.rates.confirm.samples },
      {
        key: "returnUnroutable",
        samples: detail.rates.returnUnroutable.samples,
      },
      { key: "dropUnroutable", samples: detail.rates.dropUnroutable.samples },
    ])
  }, [detail])

  return (
    <ChartFrame
      title="Message rates"
      description={`Publish, confirm, return and drop rates per second over the ${RATE_WINDOWS[range]}.`}
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
      emptyDescription="The broker has not recorded message rates for this virtual host in this range."
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
            key: "confirm",
            label: "Confirm",
            color: "var(--chart-2)",
            legend: `Confirm avg ${fmtRate(averageSeries(data, "confirm"))}`,
          },
          {
            key: "returnUnroutable",
            label: "Returned",
            color: "var(--chart-3)",
            legend: `Returned avg ${fmtRate(
              averageSeries(data, "returnUnroutable")
            )}`,
          },
          {
            key: "dropUnroutable",
            label: "Dropped",
            color: "var(--chart-4)",
            legend: `Dropped avg ${fmtRate(
              averageSeries(data, "dropUnroutable")
            )}`,
          },
        ]}
      />
    </ChartFrame>
  )
}