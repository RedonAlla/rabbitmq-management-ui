import { FactPanel, SectionFrame } from "@/components/detail"
import { RegionSkeleton } from "@/components/region-states"
import { fmtInt, fmtRate } from "@/lib/format"
import type { QueueDetail } from "@/lib/rabbit-api"

export function QueueCountersPanel({ detail }: { detail: QueueDetail | null }) {
  if (!detail) {
    return (
      <SectionFrame title="Counters">
        <RegionSkeleton rows={6} />
      </SectionFrame>
    )
  }

  return (
    <FactPanel
      title="Counters"
      facts={[
        { label: "Messages", value: fmtInt(detail.messages) },
        { label: "Ready", value: fmtInt(detail.messagesReady) },
        {
          label: "Unacked",
          value: fmtInt(detail.messagesUnacknowledged),
        },
        {
          label: "Persistent",
          value: fmtInt(detail.messagesPersistent),
        },
        { label: "In RAM", value: fmtInt(detail.messagesRam) },
        {
          label: "Ready in RAM",
          value: fmtInt(detail.messagesReadyRam),
        },
        {
          label: "Unacked in RAM",
          value: fmtInt(detail.messagesUnacknowledgedRam),
        },
        { label: "Consumers", value: fmtInt(detail.consumers) },
        {
          label: "Consumer capacity",
          value:
            detail.consumerCapacity === null
              ? "—"
              : fmtInt(detail.consumerCapacity),
        },
        {
          label: "Consumer utilisation",
          value:
            detail.consumerUtilisation === null
              ? "—"
              : `${(detail.consumerUtilisation * 100).toFixed(0)}%`,
        },
        { label: "Reductions", value: fmtInt(detail.reductions) },
        {
          label: "Reductions rate",
          value: fmtRate(detail.rates.reductions.rate),
        },
      ]}
    />
  )
}
