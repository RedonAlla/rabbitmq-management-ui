import { FactPanel, SectionFrame } from "@/components/detail"
import { TypeBadge } from "@/components/badges"
import { RegionSkeleton } from "@/components/region-states"
import type { ExchangeDetail } from "@/lib/rabbit-api"

export function ExchangeDetailsPanel({
  detail,
}: {
  detail: ExchangeDetail | null
}) {
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
        {
          label: "Exchange name",
          value: detail.name || "amq.default",
          mono: true,
        },
        { label: "Virtual host", value: detail.vhost, mono: true },
        { label: "Type", value: <TypeBadge type={detail.type} /> },
        { label: "Durable", value: detail.durable ? "Yes" : "No" },
        { label: "Auto-delete", value: detail.autoDelete ? "Yes" : "No" },
        { label: "Internal", value: detail.internal ? "Yes" : "No" },
        {
          label: "Last action by",
          value: detail.userWhoPerformedAction ?? "—",
          mono: true,
        },
      ]}
    />
  )
}
