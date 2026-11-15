import { KpiGrid } from "@/components/kpi";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  length: number;
}

export function KpiSkeleton({length}: Props) {
  return (
    <KpiGrid>
      {Array.from({ length: length }, (_, index) => (
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