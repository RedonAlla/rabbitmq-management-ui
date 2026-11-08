import { useMemo, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { PageHeader } from "@/components/page-header";
import { FilterBar, SelectFilter } from "@/components/filters-bar";
import { useCluster } from "@/store/cluster";
import { matchesText } from "@/lib/filtering";
import type { DeprecatedFeature, DeprecationPhase } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Skeleton } from "@/components/ui/skeleton";
import GridEmptyState from "./deprecated/empty-state";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";

const PHASES: Record<
  DeprecationPhase,
  { label: string; variant: "warning-light" | "destructive-light" | "outline" }
> = {
  permitted_by_default: { label: "Permitted by default", variant: "warning-light" },
  denied_by_default: { label: "Denied by default", variant: "warning-light" },
  disconnect: { label: "Disconnect", variant: "destructive-light" },
  removed: { label: "Removed", variant: "outline" },
};

const PHASE_OPTIONS = (Object.keys(PHASES) as DeprecationPhase[]).map((phase) => ({
  value: phase,
  label: PHASES[phase].label,
}));

export function DeprecatedFeaturesView() {
  const { data, status, error, actions } = useCluster();
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("all");

  const inUse = useMemo(
    () => data.deprecatedFeatures.filter((feature) => feature.inUse),
    [data.deprecatedFeatures]
  );

  const features = useMemo(
    () =>
      data.deprecatedFeatures.filter(
        (feature) =>
          (matchesText(feature.name, search) || matchesText(feature.desc, search)) &&
          (phase === "all" || feature.phase === phase)
      ),
    [data.deprecatedFeatures, search, phase]
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, DeprecatedFeature>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Feature" />,
        cell: ({ row }) => <span className="data-cell font-medium">{row.original.name}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-20" /> }
      },
      {
        accessorKey: "phase",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deprecation phase" />,
        cell: ({ row }) => {
          const meta = PHASES[row.original.phase];
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
        meta: { skeleton: <Skeleton className="h-4 w-20" /> }
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
        meta: { skeleton: <Skeleton className="h-4 w-20" /> }
      },
      {
        id: "description",
        header: () => <span>Description</span>,
        cell: ({ row }) => (
          <span className="block max-w-2xl text-xs text-muted-foreground">{row.original.desc}</span>
        ),
        meta: { fillWidth: true, skeleton: <Skeleton className="h-4 w-20" /> }
      },
    ],
    []
  );

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: features,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  });

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
            errorMessage={error}
            retry={actions.retry}
            clearFilters={clearFilters}
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
  );
}
