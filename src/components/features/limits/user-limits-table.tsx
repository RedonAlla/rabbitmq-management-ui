import { useMemo, useState } from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import { limitStatus, worstLimitStatus } from "@/lib/limits"
import { LimitUsage } from "@/components/features/limits/limit-usage"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import GridEmptyState from "@/components/ui/empty-state"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { fitMeta } from "@/components/table"
import type { UserLimit } from "@/data/types"

export function UserLimitsTable() {
  const { data, status, error, actions } = useCluster()
  const { openDialog } = useDialogs()
  const [pendingDelete, setPendingDelete] = useState<UserLimit | null>(null)

  const rows = useMemo(
    () =>
      data.userLimits.map((limit) => ({
        limit,
        usedConnections: data.connections.filter(
          (connection) => connection.user === limit.user
        ).length,
        usedChannels: data.channels.filter(
          (channel) => channel.user === limit.user
        ).length,
      })),
    [data.userLimits, data.connections, data.channels]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, (typeof rows)[number]>[]>(
    () => [
      {
        id: "user",
        header: () => <span>User</span>,
        cell: ({ row }) => (
          <span className="data-cell font-medium">
            {row.original.limit.user}
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
            label={`Connection usage for ${row.original.limit.user}`}
          />
        ),
        meta: fitMeta,
      },
      {
        id: "channels",
        header: () => <span>Channels</span>,
        cell: ({ row }) => (
          <LimitUsage
            used={row.original.usedChannels}
            max={row.original.limit.maxChannels}
            label={`Channel usage for ${row.original.limit.user}`}
          />
        ),
        meta: fitMeta,
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
            limitStatus(
              row.original.usedChannels,
              row.original.limit.maxChannels
            )
          )
          if (!worst)
            return (
              <span className="text-xs text-muted-foreground">No limit</span>
            )
          return <Badge variant={worst.variant}>{worst.label}</Badge>
        },
        meta: fitMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Actions for ${row.original.limit.user}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() =>
                    openDialog({
                      type: "edit-user-limits",
                      user: row.original.limit.user,
                    })
                  }
                >
                  <PencilIcon aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setPendingDelete(row.original.limit)}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        meta: fitMeta,
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
    <>
      <DataGrid
        table={table}
        recordCount={rows.length}
        isLoading={status === "loading"}
        emptyMessage={
          <GridEmptyState
            icon={<UserRound />}
            title="No user limits"
            description="Cap connections and channels for a user."
            error={error}
            retry={actions.retry}
            action={
              <Button
                type="button"
                onClick={() => openDialog({ type: "edit-user-limits" })}
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete user limits?"
        description={
          pendingDelete
            ? `${pendingDelete.user} loses its connection and channel caps immediately. Existing connections and channels are not closed.`
            : ""
        }
        confirmLabel="Delete limits"
        tone="destructive"
        onConfirm={async () => {
          if (!pendingDelete) return
          const limit = pendingDelete
          setPendingDelete(null)
          try {
            await actions.updateUserLimit({
              user: limit.user,
              maxConnections: null,
              maxChannels: null,
            })
            toast.success("Limits deleted", {
              description: `${limit.user} no longer caps connections or channels.`,
            })
          } catch (cause) {
            toast.error("Limits were not deleted", {
              description:
                cause instanceof Error
                  ? cause.message
                  : "The management API did not respond.",
            })
          }
        }}
      />
    </>
  )
}
