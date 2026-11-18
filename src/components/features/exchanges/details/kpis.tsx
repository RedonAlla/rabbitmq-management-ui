import { GitBranchIcon, InboxIcon, SendIcon, WaypointsIcon } from "lucide-react"
import { KpiCard, KpiGrid } from "@/components/kpi"
import { fmtInt, fmtRate } from "@/lib/format"
import { rateValues } from "@/lib/chart-data"
import type { Binding } from "@/data/types"
import type { ExchangeDetail } from "@/lib/rabbit-api"

interface Props {
  detail: ExchangeDetail
  bindings: Binding[]
}

export function ExchangeKpis({ detail, bindings }: Props) {
  const routingKeys = new Set(bindings.map((binding) => binding.routingKey))
  const destinations = new Set(bindings.map((binding) => binding.destination))

  return (
    <KpiGrid>
      <KpiCard
        label="Published in"
        value={fmtRate(detail.rates.publishIn.rate)}
        detail={`${fmtInt(detail.publishIn)} messages total`}
        icon={<SendIcon aria-hidden="true" />}
        spark={rateValues(detail.rates.publishIn.samples)}
      />
      <KpiCard
        label="Published out"
        value={fmtRate(detail.rates.publishOut.rate)}
        detail={`${fmtInt(detail.publishOut)} messages total`}
        tone="success"
        icon={<WaypointsIcon aria-hidden="true" />}
        spark={rateValues(detail.rates.publishOut.samples)}
      />
      <KpiCard
        label="Bindings"
        value={fmtInt(bindings.length)}
        detail={`${fmtInt(routingKeys.size)} routing keys`}
        icon={<GitBranchIcon aria-hidden="true" />}
      />
      <KpiCard
        label="Reached queues"
        value={fmtInt(destinations.size)}
        detail="Distinct destinations"
        icon={<InboxIcon aria-hidden="true" />}
      />
    </KpiGrid>
  )
}
