import { FactPanel, SectionFrame } from "@/components/detail";
import { RegionSkeleton } from "@/components/region-states";
import { fmtTimestamp, orDash } from "@/lib/format";
import type { QueueDetail } from "@/lib/rabbit-api";

export function QueueLifecyclePanel({
  detail,
}: {
  detail: QueueDetail | null;
}) {
  if (!detail) {
    return (
      <SectionFrame title="Lifecycle">
        <RegionSkeleton rows={5} />
      </SectionFrame>
    );
  }

  return (
    <FactPanel
      title="Lifecycle"
      facts={[
        {
          label: "Policy",
          value: orDash(detail.policy),
          mono: Boolean(detail.policy),
        },
        {
          label: "Operator policy",
          value: orDash(detail.operatorPolicy),
          mono: Boolean(detail.operatorPolicy),
        },
        {
          label: "Exclusive consumer",
          value: orDash(detail.exclusiveConsumerTag),
          mono: Boolean(detail.exclusiveConsumerTag),
        },
        {
          label: "Single active consumer",
          value: orDash(detail.singleActiveConsumerTag),
          mono: Boolean(detail.singleActiveConsumerTag),
        },
        {
          label: "Idle since",
          value: fmtTimestamp(detail.idleSince),
        },
        {
          label: "Head message",
          value: fmtTimestamp(detail.headMessageTimestamp),
        },
      ]}
    />
  );
}
