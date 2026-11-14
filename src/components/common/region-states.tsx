import type { ReactNode } from "react";
import { InboxIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface RegionErrorProps {
  message?: string;
  onRetry: () => void;
}

export function RegionError({ message, onRetry }: RegionErrorProps) {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Could not load this region</AlertTitle>
      <AlertDescription>
        {message ?? "The management API did not respond. Try again in a moment."}
      </AlertDescription>
      <AlertAction>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
}

interface RegionEmptyProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function RegionEmpty({ title, description, action, icon }: RegionEmptyProps) {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <InboxIcon />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function RegionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
      <span className="sr-only">Loading data</span>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex h-[240px] w-full flex-col justify-end gap-3" role="status" aria-label="Loading chart">
      <div className="flex flex-1 items-end gap-2">
        {Array.from({ length: 18 }, (_, index) => (
          <Skeleton
            key={index}
            className="w-full"
            style={{ height: `${30 + ((index * 17) % 60)}%` }}
          />
        ))}
      </div>
      <Skeleton className="h-4 w-full" />
      <span className="sr-only">Loading chart</span>
    </div>
  );
}
