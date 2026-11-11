import type { Channel } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Column } from "@tanstack/react-table";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

type Props = {
  column: Column<DataGridFeatures, Channel, unknown>
};

export default function PrefetchColumnHeader({ column }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              aria-label="About channel prefetch count"
              className="inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&_svg]:size-3.5"
            >
              <DataGridColumnHeader column={column} title="Prefetch" icon={<InfoIcon />} />
            </span>
          }
        />
        <TooltipContent
          side="top"
          className="max-w-72 flex-col items-start gap-1"
        >
          <span className="font-medium">Channel prefetch count.</span>
          <span>
            Each channel can have a prefetch count. The prefetch is the
            number of messages that will be held by the client. Setting a
            value of 0 will result in an unlimited prefetch.
          </span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
