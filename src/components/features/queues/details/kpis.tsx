import {
  InboxIcon,
  MemoryStickIcon,
  MessageSquareIcon,
  TimerIcon,
} from "lucide-react";
import { KpiCard, KpiGrid } from "@/components/kpi";
import { fmtBytes, fmtInt, fmtRate } from "@/lib/format";
import type { QueueDetail } from "@/lib/rabbit-api";
import { chronological, rateValues } from "@/components/features/queues/shared/charts";

export default function QueueKpis({ detail }: { detail: QueueDetail }) {
  return (
    <KpiGrid>
      <KpiCard
        label="Ready"
        value={fmtInt(detail.messagesReady)}
        detail={`${fmtInt(detail.messages)} messages total`}
        tone={detail.state === "degraded" ? "warning" : "primary"}
        icon={<InboxIcon aria-hidden="true" />}
        spark={chronological(detail.lengths.ready.samples)}
      />
      <KpiCard
        label="Unacked"
        value={fmtInt(detail.messagesUnacknowledged)}
        detail={`${fmtInt(detail.consumers)} consumers attached`}
        tone={detail.messagesUnacknowledged > 0 ? "warning" : "primary"}
        icon={<TimerIcon aria-hidden="true" />}
        spark={chronological(detail.lengths.unacked.samples)}
      />
      <KpiCard
        label="Publish"
        value={fmtRate(detail.rates.publish.rate)}
        detail={`Deliver ${fmtRate(detail.rates.deliver.rate)}`}
        tone="success"
        icon={<MessageSquareIcon aria-hidden="true" />}
        spark={rateValues(detail.rates.publish.samples)}
      />
      <KpiCard
        label="Memory"
        value={fmtBytes(detail.memory)}
        detail={`${fmtBytes(detail.messageBytes)} in messages`}
        icon={<MemoryStickIcon aria-hidden="true" />}
      />
    </KpiGrid>
  );
}
