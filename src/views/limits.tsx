import { useMemo } from "react"
import { Gauge, PencilIcon, PlusIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { fmtInt, pct } from "@/lib/format"
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

export function LimitsView() {
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

  const statusFor = (used: number, max: number) => {
    const usage = pct(used, max)
    if (usage >= 100)
      return { label: "At limit", variant: "destructive-light" as const }
    if (usage >= 80)
      return { label: "Near limit", variant: "warning-light" as const }
    return { label: "Within limit", variant: "success-light" as const }
  }

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
        meta: { skeleton: <Skeleton className="h-4 w-25" /> },
      },
      {
        id: "connections",
        header: () => <span>Connections</span>,
        cell: ({ row }) => {
          const usage = pct(
            row.original.usedConnections,
            row.original.limit.maxConnections
          )
          return (
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="data-cell">
                  {fmtInt(row.original.usedConnections)}{" "}
                  <span className="text-xs text-muted-foreground">
                    / {fmtInt(row.original.limit.maxConnections)}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {usage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={usage}
                aria-label={`Connection usage for ${row.original.limit.vhost}`}
              />
            </div>
          )
        },
        meta: { skeleton: <Skeleton className="h-4 w-25" /> },
      },
      {
        id: "queues",
        header: () => <span>Queues</span>,
        cell: ({ row }) => {
          const usage = pct(
            row.original.usedQueues,
            row.original.limit.maxQueues
          )
          return (
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="data-cell">
                  {fmtInt(row.original.usedQueues)}{" "}
                  <span className="text-xs text-muted-foreground">
                    / {fmtInt(row.original.limit.maxQueues)}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {usage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={usage}
                aria-label={`Queue usage for ${row.original.limit.vhost}`}
              />
            </div>
          )
        },
        meta: { skeleton: <Skeleton className="h-4 w-25" /> },
      },
      {
        id: "status",
        header: () => <span>Status</span>,
        cell: ({ row }) => {
          const connectionStatus = statusFor(
            row.original.usedConnections,
            row.original.limit.maxConnections
          )
          const queueStatus = statusFor(
            row.original.usedQueues,
            row.original.limit.maxQueues
          )
          const severity = {
            "success-light": 0,
            "warning-light": 1,
            "destructive-light": 2,
          }
          const worst =
            severity[queueStatus.variant] > severity[connectionStatus.variant]
              ? queueStatus
              : connectionStatus
          return <Badge variant={worst.variant}>{worst.label}</Badge>
        },
        meta: { skeleton: <Skeleton className="h-4 w-25" /> },
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
        meta: { skeleton: <Skeleton className="h-4 w-25" /> },
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
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Limits"
        description="Connection and queue caps per virtual host."
        actions={
          <Button
            type="button"
            onClick={() => openDialog({ type: "edit-limits" })}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add limits
          </Button>
        }
      />

      <DataGrid
        table={table}
        recordCount={rows.length}
        isLoading={status === "loading"}
        emptyMessage={
          <GridEmptyState
            icon={<Gauge />}
            title="No limits found"
            description="Add a new limit."
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
    </div>
  )
}
