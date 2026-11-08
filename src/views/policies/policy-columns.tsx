import { MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { definitionSummary, fmtInt } from "@/lib/format"
import type { Policy } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"

export function policyColumns(
  applied: (policy: Policy) => number,
  onDelete: (policy: Policy) => void
): ColumnDef<DataGridFeatures, Policy>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Policy" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{row.original.name}</span>
            <Badge variant="outline">P{row.original.priority}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {row.original.vhost}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "pattern",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Pattern" />
      ),
      cell: ({ row }) => (
        <span className="data-cell text-xs">{row.original.pattern}</span>
      ),
    },
    {
      accessorKey: "applyTo",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Applies to" />
      ),
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.applyTo}</span>
      ),
    },
    {
      id: "definition",
      header: () => <span>Definition</span>,
      cell: ({ row }) => (
        <span className="data-cell block max-w-64 truncate text-xs text-muted-foreground">
          {definitionSummary(row.original.definition)}
        </span>
      ),
    },
    {
      id: "applied",
      header: () => <span>Applied</span>,
      cell: ({ row }) => {
        const count = applied(row.original)
        return (
          <Badge variant={count ? "outline" : "warning-light"}>
            {fmtInt(count)} {count === 1 ? "queue" : "queues"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div
          className="flex justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Actions for ${row.original.name}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(row.original)}
              >
                <Trash2Icon aria-hidden="true" />
                Delete policy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}
