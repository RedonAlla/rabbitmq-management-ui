import { RegionError } from "@/components/region-states";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import type { ReactNode } from "react";

type Props = {
  error: string | null;
  retry: () => void;
  clearFilters?: () => void;
  title: string;
  description: string;
  icon: ReactNode
};

export default function GridEmptyState({
  title,
  description,
  error,
  clearFilters,
  retry,
  icon
}: Props) {

  if(error != null)
    return (<RegionError message={error} onRetry={retry} />);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {
        clearFilters ? 
        (
          <EmptyContent>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyContent>
        ) : null
      }
    </Empty>
  );
}
