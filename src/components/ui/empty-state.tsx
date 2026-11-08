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
import { ShieldCheck } from "lucide-react";

type Props = {
  errorMessage: string | null;
  retry: () => void;
  clearFilters?: () => void;
  title: string;
  description: string;
};

export default function GridEmptyState({
  title,
  description,
  errorMessage,
  clearFilters,
  retry
}: Props) {

  if(errorMessage != null)
    return (<RegionError message={errorMessage} onRetry={retry} />);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldCheck />
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
