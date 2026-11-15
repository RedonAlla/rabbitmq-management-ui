import { PageHeader } from "@/components/page-header";
import { DetailLayout, SectionFrame } from "@/components/detail";
import { ChartSkeleton, RegionSkeleton } from "@/components/region-states";
import { KpiGrid } from "@/components/kpi";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { QueueBackButton } from "./header";

export function QueueKpisSkeleton() {
  return (
    <KpiGrid>
      {Array.from({ length: 4 }, (_, index) => (
        <Frame key={index} spacing="sm" className="min-w-0">
          <FramePanel className="flex flex-col gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </FramePanel>
        </Frame>
      ))}
    </KpiGrid>
  );
}

export function QueueDetailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={title}
        description="Loading queue details."
        actions={<QueueBackButton />}
      />
      <QueueKpisSkeleton />
      <DetailLayout
        main={
          <>
            <SectionFrame title="Queue depth">
              <ChartSkeleton />
            </SectionFrame>
            <SectionFrame title="Message rates">
              <ChartSkeleton />
            </SectionFrame>
          </>
        }
        side={
          <>
            <SectionFrame title="Details">
              <RegionSkeleton rows={6} />
            </SectionFrame>
            <SectionFrame title="Counters">
              <RegionSkeleton rows={5} />
            </SectionFrame>
          </>
        }
      />
    </div>
  );
}
