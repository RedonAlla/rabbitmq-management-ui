import { PageHeader } from "@/components/page-header";
import { DetailLayout, SectionFrame } from "@/components/detail";
import { ChartSkeleton } from "@/components/region-states";
import { KpiSkeleton } from "@/components/kpi-skeleton";
import { QueueBackButton } from "./header";
import { QueueCountersPanel } from "./counters-panel";
import { QueueDetailsPanel } from "./details-panel";
import { QueueLifecyclePanel } from "./lifecycle-panel";
import { QueueStoragePanel } from "./storage-panel";

export function QueueDetailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={title}
        description="Loading queue details."
        actions={<QueueBackButton />}
      />
      <KpiSkeleton />
      <DetailLayout
        main={
          <>
            <SectionFrame title="Queue depth">
              <ChartSkeleton />
            </SectionFrame>
            <SectionFrame title="Message rates">
              <ChartSkeleton />
            </SectionFrame>
            <SectionFrame title="Reductions">
              <ChartSkeleton />
            </SectionFrame>
          </>
        }
        side={
          <>
            <QueueDetailsPanel detail={null} />
            <QueueLifecyclePanel detail={null} />
            <QueueCountersPanel detail={null} />
            <QueueStoragePanel detail={null} />
          </>
        }
      />
    </div>
  );
}
