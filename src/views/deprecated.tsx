import { useMemo, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ResourceTable } from "@/components/resource-table";
import { RegionEmpty } from "@/components/region-states";
import { FilterBar, SelectFilter } from "@/components/filters-bar";
import { useCluster } from "@/store/cluster";
import { matchesText } from "@/lib/filtering";
import type { DeprecatedFeature, DeprecationPhase } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

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
      },
      {
        accessorKey: "phase",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deprecation phase" />,
        cell: ({ row }) => {
          const meta = PHASES[row.original.phase];
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
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
      },
      {
        id: "description",
        header: () => <span>Description</span>,
        cell: ({ row }) => (
          <span className="block max-w-2xl text-xs text-muted-foreground">{row.original.desc}</span>
        ),
      },
    ],
    []
  );

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

      <FilterBar search={search} onSearch={setSearch} placeholder="Search deprecated features…">
        <SelectFilter
          value={phase}
          onChange={setPhase}
          options={PHASE_OPTIONS}
          label="Filter by deprecation phase"
          allLabel="All phases"
        />
      </FilterBar>

      <ResourceTable
        data={features}
        columns={columns}
        noun="deprecated features"
        minWidth="min-w-[880px]"
        loading={status === "loading"}
        error={error}
        onRetry={actions.retry}
        empty={
          <RegionEmpty
            title="No deprecated features match"
            description="Clear the filters to see every deprecated capability."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPhase("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        }
      />
    </div>
  );
}
