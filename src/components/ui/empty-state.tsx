import { RegionError } from "@/components/region-states";
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
  action?: ReactNode;
  title: string;
  description: string;
  icon: ReactNode
};

export default function GridEmptyState({
  title,
  description,
  error,
  action,
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
        action ? 
        (
          <EmptyContent>
            {action}
        </EmptyContent>
        ) : null
      }
    </Empty>
  );
}
