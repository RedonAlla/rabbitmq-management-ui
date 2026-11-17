import type { Channel } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { PrefetchHintContent } from "@/components/prefetch-hint"
import type { Column } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"

type Props = {
  column: Column<DataGridFeatures, Channel, unknown>
}

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
              <DataGridColumnHeader
                column={column}
                title="Prefetch"
                icon={<InfoIcon />}
              />
            </span>
          }
        />
        <PrefetchHintContent />
      </Tooltip>
    </div>
  )
}
