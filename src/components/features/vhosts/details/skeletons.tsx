import { PageHeader } from "@/components/page-header"
import { DetailLayout, SectionFrame } from "@/components/detail"
import { ChartSkeleton, RegionSkeleton } from "@/components/region-states"
import { KpiSkeleton } from "@/components/kpi-skeleton"
import { VhostBackButton } from "./header"

export function VhostDetailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={title}
        description="Loading virtual host details."
        actions={<VhostBackButton />}
      />
      <KpiSkeleton />
      <DetailLayout
        main={
          <>
            <SectionFrame title="Message counts">
              <ChartSkeleton />
            </SectionFrame>
            <SectionFrame title="Message rates">
              <ChartSkeleton />
            </SectionFrame>
            <SectionFrame title="Permissions">
              <RegionSkeleton rows={3} />
            </SectionFrame>
            <SectionFrame title="Topic permissions">
              <RegionSkeleton rows={2} />
            </SectionFrame>
          </>
        }
        side={
          <>
            <SectionFrame title="Details">
              <RegionSkeleton rows={6} />
            </SectionFrame>
            <SectionFrame title="Cluster state">
              <RegionSkeleton rows={3} />
            </SectionFrame>
          </>
        }
      />
    </div>
  )
}