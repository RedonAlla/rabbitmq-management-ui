import type { ReactNode } from "react";
import { RefreshCwIcon } from "lucide-react";
import { SectionFrame } from "@/components/detail";
import {
  ChartSkeleton,
  RegionEmpty,
  RegionError,
} from "@/components/region-states";
import { Button } from "@/components/ui/button";

interface ChartFrameProps {
  title: string;
  description: string;
  actions?: ReactNode;
  hasData: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle?: string;
  emptyDescription: string;
  children: ReactNode;
}

export function ChartFrame({
  title,
  description,
  actions,
  hasData,
  loading,
  error,
  onRetry,
  emptyTitle = "No samples yet",
  emptyDescription,
  children,
}: ChartFrameProps) {
  return (
    <SectionFrame title={title} description={description} actions={actions}>
      {error ? (
        <RegionError message={error} onRetry={onRetry} />
      ) : loading ? (
        <ChartSkeleton />
      ) : hasData ? (
        children
      ) : (
        <RegionEmpty
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
              Retry
            </Button>
          }
        />
      )}
    </SectionFrame>
  );
}
