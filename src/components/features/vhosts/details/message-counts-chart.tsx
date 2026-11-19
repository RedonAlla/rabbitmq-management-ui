import { useMemo } from "react"
import { fmtInt } from "@/lib/format"
import {
  buildLengthChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data"
import type { VhostDetail, VhostRateRange } from "@/lib/rabbit-api"
import { ChartFrame, ChartRangeTabs, LengthChart } from "@/components/charts"

type Props = {
  detail: VhostDetail | null
  range: VhostRateRange
  setRange: (range: VhostRateRange) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function VhostMessageCountsChart({
  detail,
  range,
  setRange,
  loading,
  error,
  onRetry,
}: Props) {
  const data = useMemo(() => {
    if (!detail) return []
    return buildLengthChartDataFromSamples([
      { key: "messages", samples: detail.lengths.messages.samples },
      { key: "ready", samples: detail.lengths.ready.samples },
      { key: "unacked", samples: detail.lengths.unacked.samples },
    ])
  }, [detail])

  return (
    <ChartFrame
      title="Message counts"
      description={`Messages held in this virtual host over the ${RATE_WINDOWS[range]}.`}
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
      emptyDescription="The broker has not recorded message counts for this virtual host in this range."
    >
      <LengthChart
        title="Message counts"
        data={data}
        series={[
          {
            key: "messages",
            label: "Messages",
            color: "var(--chart-1)",
            legend: `Total ${fmtInt(detail?.messages ?? 0)}`,
          },
          {
            key: "ready",
            label: "Ready",
            color: "var(--chart-2)",
            legend: `Ready ${fmtInt(detail?.messagesReady ?? 0)}`,
          },
          {
            key: "unacked",
            label: "Unacked",
            color: "var(--chart-3)",
            legend: `Unacked ${fmtInt(detail?.messagesUnacknowledged ?? 0)}`,
          },
        ]}
      />
    </ChartFrame>
  )
}