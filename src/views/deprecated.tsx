import { useMemo, useState } from "react"
import { ArrowRightIcon, Boxes, TriangleAlertIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { PageHeader } from "@/components/page-header"
import { FilterBar, SelectFilter } from "@/components/filters-bar"
import { useCluster } from "@/store/cluster"
import { matchesText } from "@/lib/filtering"
import type {
  DeprecatedFeature,
  DeprecatedFeatureState,
  DeprecationPhase,
} from "@/data/types"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import GridEmptyState from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

const PHASES: Record<
  DeprecationPhase,
  { label: string; variant: "warning-light" | "destructive-light" | "outline" }
> = {
  permitted_by_default: {
    label: "Permitted by default",
    variant: "warning-light",
  },
  denied_by_default: { label: "Denied by default", variant: "warning-light" },
  disconnect: { label: "Disconnect", variant: "destructive-light" },
  removed: { label: "Removed", variant: "outline" },
}

const PHASE_OPTIONS = (Object.keys(PHASES) as DeprecationPhase[]).map(
  (phase) => ({
    value: phase,
    label: PHASES[phase].label,
  })
)

const STATE_BADGE: Record<
  DeprecatedFeatureState,
  { label: string; variant: "outline" | "destructive-light" }
> = {
  permitted: { label: "Permitted", variant: "outline" },
  denied: { label: "Denied", variant: "destructive-light" },
}

export function DeprecatedFeaturesView() {
  const { data, status, error, actions } = useCluster()
  const [search, setSearch] = useState("")
  const [phase, setPhase] = useState("all")

  const inUse = useMemo(
    () => data.deprecatedFeatures.filter((feature) => feature.inUse),
    [data.deprecatedFeatures]
  )

  const features = useMemo(
    () =>
      data.deprecatedFeatures.filter(
        (feature) =>
          (matchesText(feature.name, search) ||
            matchesText(feature.desc, search) ||
            matchesText(feature.providedBy, search)) &&
          (phase === "all" || feature.phase === phase)
      ),
    [data.deprecatedFeatures, search, phase]
  )

  const columns = useMemo<ColumnDef<DataGridFeatures, DeprecatedFeature>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Feature" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="data-cell text-mono font-medium">
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
            {row.original.desc ? (
              <span className="max-w-2xl text-xs text-muted-foreground">
                {row.original.desc}
              </span>
            ) : null}
          </div>
        ),
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-40" /> },
      },
      {
        accessorKey: "phase",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Deprecation phase" />
        ),
        cell: ({ row }) => {
          const meta = PHASES[row.original.phase]
          return <Badge variant={meta.variant}>{meta.label}</Badge>
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
        id: "status",
        header: () => <span>Status</span>,
        cell: ({ row }) =>
          row.original.inUse ? (
            <Badge variant="destructive-light">In use</Badge>
          ) : (
            <Badge variant="outline">Not in use</Badge>
          ),
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
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: features,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  })

  const clearFilters = () => {
    setSearch("")
    setPhase("all")
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Deprecated features"
        eyebrow={
          <Badge variant={inUse.length ? "warning-light" : "success-light"}>
            {inUse.length ? `${inUse.length} in use` : "None in use"}
          </Badge>
        }
        description="Capabilities on their way out. Using one may prevent future minor or major upgrades."
      />

      {inUse.length ? (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Deprecated features are in use</AlertTitle>
          <AlertDescription>
            {inUse.map((feature) => feature.name).join(", ")}{" "}
            {inUse.length === 1 ? "is" : "are"} active on this cluster. Remove{" "}
            {inUse.length === 1 ? "it" : "them"} before upgrading.
          </AlertDescription>
        </Alert>
      ) : null}

      <DataGrid
        table={table}
        recordCount={features.length}
        isLoading={status === "loading"}
        emptyMessage={
          <GridEmptyState
            icon={<Boxes />}
            error={error}
            retry={actions.retry}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearFilters()}
              >
                Clear filters
              </Button>
            }
            title="No deprecated features match"
            description="Clear the filters to see every deprecated capability."
          />
        }
        tableLayout={{
          dense: true,
          headerBorder: true,
          width: "auto",
        }}
        tableClassNames={{ base: "min-w-[880px]" }}
      >
        <Frame spacing="sm" className="min-w-0">
          <FrameHeader>
            <FilterBar
              search={search}
              onSearch={setSearch}
              placeholder="Search deprecated features…"
              className="justify-end"
            >
              <SelectFilter
                value={phase}
                onChange={setPhase}
                options={PHASE_OPTIONS}
                label="Filter by deprecation phase"
                allLabel="All phases"
              />
            </FilterBar>
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
