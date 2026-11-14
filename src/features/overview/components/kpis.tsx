import { KpiCard, KpiGrid } from "@/components/kpi"
import type { HistoryPoint, RangeKey, ClusterSnapshot } from "@/data/types"
import { fmtCompact, fmtInt, fmtRate, type ClusterTotals } from "@/lib/format"
import {
  InboxIcon,
  MessageSquareIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react"
import { useMemo } from "react"

type Props = {
  data: ClusterSnapshot
  range: RangeKey
  totals: ClusterTotals
  history: Record<RangeKey, HistoryPoint[]>
}

export default function Kpis({ data, totals, history, range }: Props) {
  const points = history[range]

  const spark = (key: "ready" | "unacked" | "consumers" | "publish") =>
    points.map((point) => point[key])

  const rateTrend = useMemo(() => {
    const first = points[0]?.publish ?? 0
    const last = points[points.length - 1]?.publish ?? 0
    return first > 0 ? ((last - first) / first) * 100 : 0
  }, [points])

  return (
    <KpiGrid>
      <KpiCard
        label="Ready messages"
        value={fmtCompact(totals.ready)}
        detail={`${fmtInt(totals.ready)} across ${totals.queues} ${totals.queues === 1 ? "queue" : "queues"}`}
        trend={data.cluster.trends.ready}
        icon={<InboxIcon aria-hidden="true" />}
        spark={spark("ready")}
      />
      <KpiCard
        label="Unacked"
        value={fmtCompact(totals.unacked)}
        detail="Awaiting consumer acknowledgement"
        trend={data.cluster.trends.unacked}
        icon={<TimerIcon aria-hidden="true" />}
        spark={spark("unacked")}
        tone="warning"
      />
      <KpiCard
        label="Consumers"
        value={fmtInt(totals.consumers)}
        detail={`${totals.channels} channels open`}
        trend={data.cluster.trends.consumers}
        icon={<UsersIcon aria-hidden="true" />}
        spark={spark("consumers")}
        tone="success"
      />
      <KpiCard
        label="Publish rate"
        value={fmtRate(totals.publishRate)}
        detail={`Delivering ${fmtRate(totals.deliverRate)}`}
        trend={rateTrend}
        icon={<MessageSquareIcon aria-hidden="true" />}
        spark={spark("publish")}
        tone="success"
      />
    </KpiGrid>
  )
}
