import { PageHeader } from "@/components/page-header"
import { DetailLayout, SectionFrame } from "@/components/detail"
import { ChartSkeleton, RegionSkeleton } from "@/components/region-states"
import { KpiSkeleton } from "@/components/kpi-skeleton"
import { ExchangeBackButton } from "./header"
import { ExchangeDetailsPanel } from "./details-panel"

export function ExchangeDetailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={title}
        description="Loading exchange details."
        actions={<ExchangeBackButton />}
      />
      <KpiSkeleton />
      <DetailLayout
        main={
          <>
            <SectionFrame title="Message rates">
              <ChartSkeleton />
            </SectionFrame>
            <SectionFrame title="Routing preview">
              <RegionSkeleton rows={4} />
            </SectionFrame>
            <SectionFrame title="Bindings">
              <RegionSkeleton rows={4} />
            </SectionFrame>
          </>
        }
        side={
          <>
            <ExchangeDetailsPanel detail={null} />
            <SectionFrame title="Arguments">
              <RegionSkeleton rows={3} />
            </SectionFrame>
          </>
        }
      />
    </div>
  )
}
