import { FactPanel, SectionFrame } from "@/components/detail"
import { StateBadge, TypeBadge } from "@/components/badges"
import { RegionSkeleton } from "@/components/region-states"
import { fmtInt } from "@/lib/format"
import type { QueueDetail } from "@/lib/rabbit-api"

export function QueueDetailsPanel({ detail }: { detail: QueueDetail | null }) {
  if (!detail) {
    return (
      <SectionFrame title="Details">
        <RegionSkeleton rows={6} />
      </SectionFrame>
    )
  }

  return (
    <FactPanel
      title="Details"
      facts={[
        { label: "Queue name", value: detail.name, mono: true },
        { label: "Virtual host", value: detail.vhost, mono: true },
        { label: "Node", value: detail.node, mono: true },
        {
          label: "Type",
          value: <TypeBadge type={detail.type} />,
        },
        {
          label: "State",
          value: <StateBadge state={detail.state} />,
        },
        { label: "Durable", value: detail.durable ? "Yes" : "No" },
        {
          label: "Auto-delete",
          value: detail.autoDelete ? "Yes" : "No",
        },
        {
          label: "Exclusive",
          value: detail.exclusive ? "Yes" : "No",
        },
        {
          label: "Internal",
          value: detail.internal ? "Yes" : "No",
        },
        {
          label: "Internal owner",
          value: detail.internalOwner ? "Yes" : "No",
        },
        {
          label: "Storage version",
          value:
            detail.storageVersion === null
              ? "—"
              : fmtInt(detail.storageVersion),
        },
      ]}
    />
  )
}
