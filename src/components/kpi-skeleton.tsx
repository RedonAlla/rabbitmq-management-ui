import { KpiGrid } from "@/components/kpi"
import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <KpiGrid>
      {Array.from({ length: count }, (_, index) => (
        <Frame key={index} spacing="sm" className="min-w-0">
          <FramePanel className="flex flex-col gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </FramePanel>
        </Frame>
      ))}
    </KpiGrid>
  )
}
