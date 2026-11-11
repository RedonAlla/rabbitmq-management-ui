import { useMemo } from "react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { GitBranch } from "lucide-react"
import { StateBadge, VhostBadge } from "@/components/badges"
import { Button } from "@/components/ui/button"
import GridEmptyState from "@/components/ui/empty-state"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { numericMeta } from "@/components/table-meta-numeric"
import { fmtInt } from "@/lib/format"
import type { ConnectionChannel } from "@/lib/rabbit-api"

interface Props {
  channels: ConnectionChannel[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function ChannelsTable({
  channels,
  loading,
  error,
  onRetry,
}: Props) {
  const columns = useMemo<ColumnDef<DataGridFeatures, ConnectionChannel>[]>(
    () => [
      {
        accessorKey: "number",
        header: () => <span>Channel</span>,
        cell: ({ row }) => (
          <span className="data-cell font-medium">{row.original.name}</span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-8" /> },
      },
      {
        accessorKey: "user",
        header: () => <span>User</span>,
        cell: ({ row }) => <span className="text-sm">{row.original.user}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-16" /> },
      },
      {
        accessorKey: "state",
        header: () => <span>State</span>,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
        meta: { skeleton: <Skeleton className="h-4 w-16" /> },
      },
      {
        accessorKey: "vhost",
        header: () => <span>Vhost</span>,
        cell: ({ row }) => <VhostBadge>{row.original.vhost}</VhostBadge>,
        meta: { skeleton: <Skeleton className="h-4 w-10" /> },
      },
      {
        accessorKey: "consumerCount",
        header: () => <span>Consumers</span>,
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(row.original.consumerCount)}</span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "messagesUnacknowledged",
        header: () => <span>Unacked</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.messagesUnacknowledged)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "messagesUncommitted",
        header: () => <span>Uncommitted</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.messagesUncommitted)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "messagesUnconfirmed",
        header: () => <span>Unconfirmed</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.messagesUnconfirmed)}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "acksUncommitted",
        header: () => <span>Acks uncommitted</span>,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.acksUncommitted)}
          </span>
        ),
        meta: numericMeta,
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 110, minSize: 80 },
    data: channels,
    columns,
    manualPagination: true,
  })

  return (
    <DataGrid
      table={table}
      recordCount={channels.length}
      isLoading={loading}
      emptyMessage={
        <GridEmptyState
          icon={<GitBranch />}
          error={error}
          retry={onRetry}
          title="No channels open"
          description="This connection has not opened any channels."
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Refresh
            </Button>
          }
        />
      }
      tableLayout={{ dense: true, headerBorder: true, width: "auto" }}
      tableClassNames={{ base: "min-w-[820px]" }}
    >
      <DataGridScrollArea>
        <DataGridTable />
      </DataGridScrollArea>
    </DataGrid>
  )
}
