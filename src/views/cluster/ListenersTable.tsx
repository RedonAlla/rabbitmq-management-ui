import { useMemo } from "react"
import { Kayak } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { TlsBadge } from "@/components/badges"
import type { PortInfo } from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import GridEmptyState from "@/components/ui/empty-state"
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { fitMeta, numericMeta } from "@/components/table"

type Props = {
  ports: PortInfo[]
  loading: boolean
  onRetry: () => void
  error: string | null
}

export default function ListenersTable({
  ports,
  loading,
  error,
  onRetry,
}: Props) {
  const columns = useMemo<ColumnDef<DataGridFeatures, PortInfo>[]>(
    () => [
      {
        accessorKey: "port",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Port" />
        ),
        cell: ({ row }) => (
          <span className="data-cell font-medium">{row.original.port}</span>
        ),
        meta: fitMeta
      },
      {
        accessorKey: "protocol",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Protocol" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.protocol}</span>
        ),
        meta: fitMeta
      },
      {
        accessorKey: "tls",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="TLS" />
        ),
        cell: ({ row }) => <TlsBadge ssl={row.original.tls} />,
        meta: fitMeta
      },
      {
        accessorKey: "nodes",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nodes" />
        ),
        cell: ({ row }) => (
          <span className="data-cell">{row.original.nodes}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "context",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Context" />
        ),
        cell: ({ row }) => (
          <span className="data-cell text-xs text-muted-foreground">
            {row.original.context}
          </span>
        ),
        meta: fitMeta
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: ports,
    columns,
  })

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <DataGrid
        table={table}
        isLoading={loading}
        recordCount={ports.length}
        emptyMessage={
          <GridEmptyState
            icon={<Kayak />}
            title="No ports listener"
            description="No ports listener found for this cluster"
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
                <h2 className="text-sm font-semibold">Listeners</h2>
                <p className="text-xs text-muted-foreground">
                  Protocols accepted by the cluster, with their exposed ports.
                </p>
              </div>
              <Badge variant="outline">
                {ports.length} {ports.length === 1 ? "listener" : "listeners"}
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
