import { useMemo } from "react"
import { fmtRate } from "@/lib/format"
import {
  averageSeries,
  buildRateChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data"
import type { ExchangeDetail, ExchangeRateRange } from "@/lib/rabbit-api"
import { ChartFrame, ChartRangeTabs, RateChart } from "@/components/charts"

interface Props {
  detail: ExchangeDetail | null
  range: ExchangeRateRange
  setRange: (range: ExchangeRateRange) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function ExchangeMessageRatesChart({
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
      { key: "publishIn", samples: detail.rates.publishIn.samples },
      { key: "publishOut", samples: detail.rates.publishOut.samples },
    ])
  }, [detail])

  return (
    <ChartFrame
      title="Message rates"
      description={`Publish-in and publish-out rates per second over the ${RATE_WINDOWS[range]}.`}
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
      emptyDescription="The broker has not recorded message rates for this exchange in this range."
    >
      <RateChart
        title="Message rates"
        data={data}
        series={[
          {
            key: "publishIn",
            label: "Published in",
            color: "var(--chart-1)",
            legend: `In avg ${fmtRate(averageSeries(data, "publishIn"))}`,
          },
          {
            key: "publishOut",
            label: "Published out",
            color: "var(--chart-2)",
            legend: `Out avg ${fmtRate(averageSeries(data, "publishOut"))}`,
          },
        ]}
      />
    </ChartFrame>
  )
}
