import { RegionError } from "@/components/region-states";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Waypoints } from "lucide-react";

type Props = {
  errorMessage: string | null;
  retry: () => void;
  clearFilters: () => void;
};

export default function GridEmptyState({ errorMessage, clearFilters, retry }: Props) {
  if(errorMessage != null)
    return (<RegionError message={errorMessage} onRetry={retry} />);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Waypoints />
        </EmptyMedia>
        <EmptyTitle>No exchanges match</EmptyTitle>
        <EmptyDescription>
          No exchange matches this search. Clear the filters to see all declared exchanges.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}
