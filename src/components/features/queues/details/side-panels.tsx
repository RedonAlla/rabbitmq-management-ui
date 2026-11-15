import { FactPanel, SectionFrame } from "@/components/detail";
import { StateBadge, TypeBadge } from "@/components/badges";
import { RegionSkeleton } from "@/components/region-states";
import { fmtBytes, fmtInt, fmtRate } from "@/lib/format";
import type { QueueDetail } from "@/lib/rabbit-api";
import {
  QueueArgumentsFrame,
  QueuePolicyFrame,
} from "@/views/queues/properties";

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

type Props = {
  detail: QueueDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function QueueSidePanels({ detail, loading, error, onRetry }: Props) {
  if (!detail) {
    return (
      <>
        <SectionFrame title="Details">
          <RegionSkeleton rows={6} />
        </SectionFrame>
        <SectionFrame title="Lifecycle">
          <RegionSkeleton rows={5} />
        </SectionFrame>
        <SectionFrame title="Counters">
          <RegionSkeleton rows={6} />
        </SectionFrame>
        <SectionFrame title="Storage">
          <RegionSkeleton rows={4} />
        </SectionFrame>
      </>
    );
  }

  return (
    <>
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

      <QueuePolicyFrame
        policy={detail.policy}
        operatorPolicy={detail.operatorPolicy}
        definition={detail.effectivePolicyDefinition}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />

      <QueueArgumentsFrame
        args={detail.arguments}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
    </>
  );
}
