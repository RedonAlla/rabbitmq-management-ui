import { FactPanel, SectionFrame } from "@/components/detail";
import { RegionSkeleton } from "@/components/region-states";
import type { QueueDetail } from "@/lib/rabbit-api";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function fmtTimestamp(value: string | null): string {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return timeFmt.format(timestamp);
}

function orDash(value: string | null | undefined): string {
  return value && value.length > 0 ? value : "—";
}

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
