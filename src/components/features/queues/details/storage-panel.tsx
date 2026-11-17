import { FactPanel, SectionFrame } from "@/components/detail"
import { RegionSkeleton } from "@/components/region-states"
import { fmtBytes } from "@/lib/format"
import type { QueueDetail } from "@/lib/rabbit-api"

export function QueueStoragePanel({ detail }: { detail: QueueDetail | null }) {
  if (!detail) {
    return (
      <SectionFrame title="Storage">
        <RegionSkeleton rows={4} />
      </SectionFrame>
    )
  }

  return (
    <FactPanel
      title="Storage"
      facts={[
        { label: "Memory", value: fmtBytes(detail.memory) },
        {
          label: "Message bytes",
          value: fmtBytes(detail.messageBytes),
        },
        {
          label: "Persistent",
          value: fmtBytes(detail.messageBytesPersistent),
        },
        {
          label: "In RAM",
          value: fmtBytes(detail.messageBytesRam),
        },
        {
          label: "Ready",
          value: fmtBytes(detail.messageBytesReady),
        },
        {
          label: "Unacked",
          value: fmtBytes(detail.messageBytesUnacknowledged),
        },
      ]}
    />
  )
}
