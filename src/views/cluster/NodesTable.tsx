import { useMemo } from "react"
import { SquareMousePointer } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Progress } from "@/components/ui/progress"
import { fmtDuration, fmtInt, pct } from "@/lib/format"
import type { NodeInfo } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import GridEmptyState from "@/components/ui/empty-state"
import { numericMeta } from "@/components/table"
import { Skeleton } from "@/components/ui/skeleton"

type Props = {
  nodes: NodeInfo[]
  loading: boolean
  onRetry: () => void
  error: string | null
}

export default function NodesTable({ nodes, loading, error, onRetry }: Props) {
  const columns = useMemo<ColumnDef<DataGridFeatures, NodeInfo>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Node" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">
              {row.original.name.replace("rabbit@", "")}
            </span>
            <Badge variant="outline">{row.original.type}</Badge>
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-30" /> },
      },
      {
        accessorKey: "uptime",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Uptime" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{fmtDuration(row.original.uptime)}</span>
        ),
        meta: numericMeta,
      },
      {
        id: "memory",
        header: () => <span>Memory</span>,
        cell: ({ row }) => {
          const usage = pct(row.original.memory, row.original.memoryMax)
          return (
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="data-cell">
                  {row.original.memory.toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">
                    / {row.original.memoryMax.toFixed(1)} GB
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {usage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={usage}
                aria-label={`Memory usage on ${row.original.name}`}
              />
            </div>
          )
        },
        meta: { skeleton: <Skeleton className="h-4 w-30" /> },
      },
      {
        id: "disk",
        header: () => <span>Disk</span>,
        cell: ({ row }) => {
          const usage = pct(
            row.original.diskMax - row.original.diskFree,
            row.original.diskMax
          )
          return (
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="data-cell">
                  {row.original.diskFree.toFixed(1)}{" "}
                  <span className="text-xs text-muted-foreground">GB free</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {usage.toFixed(0)}% used
                </span>
              </div>
              <Progress
                value={usage}
                aria-label={`Disk usage on ${row.original.name}`}
              />
            </div>
          )
        },
      },
      {
        accessorKey: "fd",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="File descriptors" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.fd)}{" "}
            <span className="text-xs text-muted-foreground">
              / {fmtInt(row.original.fdMax)}
            </span>
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "cpu",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="CPU" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">
            {row.original.cpu === null
              ? "n/a"
              : `${row.original.cpu.toFixed(0)}%`}
          </span>
        ),
        meta: numericMeta,
      },
      {
        id: "status",
        header: () => <span>Status</span>,
        cell: ({ row }) =>
          row.original.running ? (
            <Badge variant="success-light">Running</Badge>
          ) : (
            <Badge variant="destructive-light">Stopped</Badge>
          ),
        meta: { skeleton: <Skeleton className="h-4 w-12" /> },
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: nodes,
    columns,
  })

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <DataGrid
        table={table}
        isLoading={loading}
        recordCount={nodes.length}
        emptyMessage={
          <GridEmptyState
            icon={<SquareMousePointer />}
            title="No nodes found"
            description="No nodes found for this cluster"
            retry={onRetry}
            error={error}
          />
        }
        tableLayout={{
          dense: true,
          headerBorder: true,
          width: "auto",
        }}
        tableClassNames={{ base: "min-w-[900px]" }}
      >
        <Frame spacing="sm" className="min-w-0">
          <FrameHeader>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-sm font-semibold">Nodes</h2>
                <p className="text-xs text-muted-foreground">
                  Runtime resources per cluster member.
                </p>
              </div>
              <Badge variant="outline">
                {nodes.length} {nodes.length === 1 ? "node" : "nodes"}
              </Badge>
            </div>
          </FrameHeader>
          <FramePanel>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>
        </Frame>
      </DataGrid>
    </section>
  )
}
