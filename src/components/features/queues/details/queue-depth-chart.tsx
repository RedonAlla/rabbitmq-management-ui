import { useMemo } from "react"
import { fmtInt } from "@/lib/format"
import {
  buildLengthChartDataFromSamples,
  RATE_RANGES,
  RATE_WINDOWS,
} from "@/lib/chart-data"
import type { QueueDetail, QueueRateRange } from "@/lib/rabbit-api"
import { ChartFrame, ChartRangeTabs, LengthChart } from "@/components/charts"

type Props = {
  detail: QueueDetail | null
  range: QueueRateRange
  setRange: (range: QueueRateRange) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function QueueDepthChart({
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
      title="Queue depth"
      description={`Messages held in the queue over the ${RATE_WINDOWS[range]}.`}
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
      emptyDescription="The broker has not recorded queue length samples for this range."
    >
      <LengthChart
        title="Queue depth"
        data={data}
        series={[
          {
            key: "messages",
            label: "Messages",
            color: "var(--chart-1)",
            legend: `Messages ${fmtInt(detail?.messages ?? 0)}`,
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
