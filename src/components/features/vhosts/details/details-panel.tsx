import { Badge } from "@/components/reui/badge"
import { FactPanel, SectionFrame, type Fact } from "@/components/detail"
import { TagBadge, TypeBadge } from "@/components/badges"
import { RegionSkeleton } from "@/components/region-states"
import type { VhostDetail } from "@/lib/rabbit-api"

export function VhostDetailsPanel({
  detail,
}: {
  detail: VhostDetail | null
}) {
  if (!detail) {
    return (
      <SectionFrame title="Details">
        <RegionSkeleton rows={6} />
      </SectionFrame>
    )
  }

  const facts: Fact[] = [
    { label: "Name", value: detail.name, mono: true },
    { label: "Description", value: detail.description || "—" },
    {
      label: "Default queue type",
      value: <TypeBadge type={detail.defaultQueueType} />,
    },
    {
      label: "Protected",
      value: detail.protectedFromDeletion ? (
        <Badge variant="warning-light">Yes</Badge>
      ) : (
        <Badge variant="outline">No</Badge>
      ),
    },
    {
      label: "Tracing",
      value: detail.tracing ? (
        <Badge variant="info-light">On</Badge>
      ) : (
        <Badge variant="outline">Off</Badge>
      ),
    },
    {
      label: "Tags",
      value: detail.tags.length ? (
        <span className="flex flex-wrap justify-end gap-1">
          {detail.tags.map((tag) => (
            <TagBadge key={tag}>{tag}</TagBadge>
          ))}
        </span>
      ) : (
        "No tags"
      ),
    },
  ]

  return <FactPanel title="Details" facts={facts} />
}