import { InboxIcon, LayersIcon, MailOpenIcon, SendIcon } from "lucide-react"
import { KpiCard, KpiGrid } from "@/components/kpi"
import { chronological, rateValues } from "@/lib/chart-data"
import { fmtInt, fmtRate } from "@/lib/format"
import type { VhostDetail } from "@/lib/rabbit-api"

export function VhostKpis({ detail }: { detail: VhostDetail }) {
  return (
    <KpiGrid>
      <KpiCard
        label="Ready"
        value={fmtInt(detail.messagesReady)}
        detail="Waiting for delivery"
        icon={<InboxIcon aria-hidden="true" />}
        spark={chronological(detail.lengths.ready.samples)}
      />
      <KpiCard
        label="Unacknowledged"
        value={fmtInt(detail.messagesUnacknowledged)}
        detail="Delivered, not acked"
        icon={<MailOpenIcon aria-hidden="true" />}
        spark={chronological(detail.lengths.unacked.samples)}
      />
      <KpiCard
        label="Messages"
        value={fmtInt(detail.messages)}
        detail="Across all queues"
        icon={<LayersIcon aria-hidden="true" />}
        spark={chronological(detail.lengths.messages.samples)}
      />
      <KpiCard
        label="Publish rate"
        value={fmtRate(detail.rates.publish.rate)}
        detail={`${fmtInt(detail.published)} published`}
        tone="success"
        icon={<SendIcon aria-hidden="true" />}
        spark={rateValues(detail.rates.publish.samples)}
      />
    </KpiGrid>
  )
}