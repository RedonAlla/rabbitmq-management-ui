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
import { Plug } from "lucide-react";

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
          <Plug />
        </EmptyMedia>
        <EmptyTitle>No connections match</EmptyTitle>
        <EmptyDescription>
          No client matches this search. Clear the filters to see every open socket.
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
