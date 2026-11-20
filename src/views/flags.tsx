import { useCallback, useMemo, useState } from "react"
import { ArrowRightIcon, FlagIcon } from "lucide-react"
import { toast } from "sonner"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/reui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { FilterBar } from "@/components/filters-bar"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame"
import GridEmptyState from "@/components/ui/empty-state"
import { useCluster } from "@/store/cluster"
import { matchesText } from "@/lib/filtering"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import type { FeatureFlag, FeatureFlagState, Stability } from "@/data/types"

const STABILITY: Record<
  Stability,
  {
    label: string
    variant: "secondary" | "info-light" | "warning-light"
  }
> = {
  required: { label: "Required", variant: "secondary" },
  stable: { label: "Stable", variant: "info-light" },
  experimental: { label: "Experimental", variant: "warning-light" },
}

const STATE_BADGE: Record<
  FeatureFlagState,
  { label: string; variant: "success-light" | "warning-light" | "outline" }
> = {
  enabled: { label: "Enabled", variant: "success-light" },
  disabled: { label: "Disabled", variant: "outline" },
  state_changing: { label: "Changing", variant: "warning-light" },
  unsupported: { label: "Unsupported", variant: "outline" },
}

export function FlagsView() {
  const { data, status, error, actions } = useCluster()
  const [search, setSearch] = useState("")

  const flags = useMemo(
    () =>
      data.flags.filter(
        (flag) =>
          matchesText(flag.name, search) ||
          matchesText(flag.desc, search) ||
          matchesText(flag.providedBy, search)
      ),
    [data.flags, search]
  )

  const enabled = data.flags.filter((flag) => flag.state === "enabled").length

  const enable = useCallback(
    async (name: string) => {
      try {
        await actions.enableFlag(name)
        toast.success("Feature flag enabled", {
          description: `${name} is now enabled.`,
        })
      } catch (cause) {
        toast.error("Feature flag was not enabled", {
          description:
            cause instanceof Error
              ? cause.message
              : "The management API did not respond.",
        })
      }
    },
    [actions]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, FeatureFlag>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Feature flag" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-mono font-medium">
                {row.original.name}
              </span>
              {row.original.docUrl ? (
                <a
                  href={row.original.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Documentation for ${row.original.name}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
            <span className="max-w-2xl text-xs text-muted-foreground">
              {row.original.desc}
            </span>
          </div>
        ),
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-40" /> },
      },
      {
        accessorKey: "stability",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Stability" />
        ),
        cell: ({ row }) => {
          const stability = STABILITY[row.original.stability]
          return <Badge variant={stability.variant}>{stability.label}</Badge>
        },
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "state",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="State" />
        ),
        cell: ({ row }) => {
          const state = STATE_BADGE[row.original.state]
          return <Badge variant={state.variant}>{state.label}</Badge>
        },
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "providedBy",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Provided by" />
        ),
        cell: ({ row }) =>
          row.original.providedBy ? (
            <Badge variant="outline">{row.original.providedBy}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        meta: { skeleton: <Skeleton className="h-4 w-28" /> },
      },
      {
        id: "action",
        header: () => <span>Action</span>,
        cell: ({ row }) =>
          row.original.state === "disabled" &&
          row.original.stability !== "required" ? (
            <Switch
              size="sm"
              checked={false}
              onCheckedChange={() => enable(row.original.name)}
              aria-label={`Enable ${row.original.name}`}
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        meta: { skeleton: <Skeleton className="h-4 w-8" /> },
      },
    ],
    [enable]
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: flags,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  })

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Feature flags"
        description="Broker capabilities on this cluster. Flags cannot be disabled once enabled."
        actions={
          <Badge variant="outline">
            {enabled} of {data.flags.length} enabled
          </Badge>
        }
      />

      <DataGrid
        table={table}
        recordCount={flags.length}
        isLoading={status === "loading"}
        emptyMessage={
          <GridEmptyState
            icon={<FlagIcon />}
            error={error}
            retry={actions.retry}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            }
            title="No feature flags match"
            description="Clear the search to see every capability."
          />
        }
        tableLayout={{
          dense: true,
          headerBorder: true,
          width: "auto",
        }}
        tableClassNames={{ base: "min-w-[760px]" }}
      >
        <Frame spacing="sm" className="min-w-0">
          <FrameHeader>
            <FilterBar
              search={search}
              onSearch={setSearch}
              placeholder="Search feature flags…"
              className="justify-end"
            />
          </FrameHeader>
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
