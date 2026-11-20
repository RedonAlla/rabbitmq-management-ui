import { useMemo } from "react"
import { Gauge, PencilIcon, PlusIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { limitStatus, worstLimitStatus } from "@/lib/limits"
import { LimitUsage } from "@/components/features/limits/limit-usage"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Skeleton } from "@/components/ui/skeleton"
import GridEmptyState from "@/components/ui/empty-state"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { fitMeta } from "@/components/table"

export function VhostLimitsTable() {
  const { data, status, error, actions } = useCluster()
  const { openDialog } = useDialogs()

  const rows = useMemo(
    () =>
      data.limits.map((limit) => ({
        limit,
        usedConnections: data.connections.filter(
          (connection) => connection.vhost === limit.vhost
        ).length,
        usedQueues: data.queues.filter((queue) => queue.vhost === limit.vhost)
          .length,
      })),
    [data.limits, data.connections, data.queues]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, (typeof rows)[number]>[]>(
    () => [
      {
        id: "vhost",
        header: () => <span>Virtual host</span>,
        cell: ({ row }) => (
          <span className="data-cell font-medium">
            {row.original.limit.vhost}
          </span>
        ),
        meta: fitMeta,
      },
      {
        id: "connections",
        header: () => <span>Connections</span>,
        cell: ({ row }) => (
          <LimitUsage
            used={row.original.usedConnections}
            max={row.original.limit.maxConnections}
            label={`Connection usage for ${row.original.limit.vhost}`}
          />
        ),
        meta: fitMeta
      },
      {
        id: "queues",
        header: () => <span>Queues</span>,
        cell: ({ row }) => (
          <LimitUsage
            used={row.original.usedQueues}
            max={row.original.limit.maxQueues}
            label={`Queue usage for ${row.original.limit.vhost}`}
          />
        ),
        meta: fitMeta
      },
      {
        id: "status",
        header: () => <span>Status</span>,
        cell: ({ row }) => {
          const worst = worstLimitStatus(
            limitStatus(
              row.original.usedConnections,
              row.original.limit.maxConnections
            ),
            limitStatus(row.original.usedQueues, row.original.limit.maxQueues)
          )
          if (!worst)
            return (
              <span className="text-xs text-muted-foreground">No limit</span>
            )
          return <Badge variant={worst.variant}>{worst.label}</Badge>
        },
        meta: fitMeta
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                openDialog({
                  type: "edit-limits",
                  vhost: row.original.limit.vhost,
                })
              }
            >
              <PencilIcon data-icon="inline-start" aria-hidden="true" />
              Edit
            </Button>
          </div>
        ),
        meta: fitMeta
      },
    ],
    [openDialog]
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: rows,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  })

  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      isLoading={status === "loading"}
      emptyMessage={
        <GridEmptyState
          icon={<Gauge />}
          title="No virtual host limits"
          description="Cap connections and queues for a virtual host."
          error={error}
          retry={actions.retry}
          action={
            <Button
              type="button"
              onClick={() => openDialog({ type: "edit-limits" })}
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add limits
            </Button>
          }
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
        <FramePanel>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
        <FrameFooter>
          <DataGridPagination sizes={DEFAULT_PAGES_OPTIONS} />
        </FrameFooter>
      </Frame>
    </DataGrid>
  )
}
