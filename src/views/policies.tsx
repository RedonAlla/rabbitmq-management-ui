import { useCallback, useMemo, useState } from "react";
import { MoreHorizontalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { ResourceTable } from "@/components/resource-table";
import { RegionEmpty, RegionError } from "@/components/region-states";
import { FilterBar, SelectFilter } from "@/components/filters-bar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { definitionSummary, fmtInt } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { Policy, Queue } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

function matchesPolicy(policy: Policy, queue: Queue): boolean {
  if (policy.vhost !== queue.vhost || policy.applyTo === "exchanges") return false;
  try {
    return new RegExp(policy.pattern).test(queue.name);
  } catch {
    return false;
  }
}

function policyColumns(
  applied: (policy: Policy) => number,
  onDelete: (policy: Policy) => void
): ColumnDef<DataGridFeatures, Policy>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Policy" />,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{row.original.name}</span>
            <Badge variant="outline">P{row.original.priority}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{row.original.vhost}</span>
        </div>
      ),
    },
    {
      accessorKey: "pattern",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Pattern" />,
      cell: ({ row }) => <span className="data-cell text-xs">{row.original.pattern}</span>,
    },
    {
      accessorKey: "applyTo",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Applies to" />,
      cell: ({ row }) => <span className="text-sm capitalize">{row.original.applyTo}</span>,
    },
    {
      id: "definition",
      header: () => <span>Definition</span>,
      cell: ({ row }) => (
        <span className="data-cell block max-w-64 truncate text-xs text-muted-foreground">
          {definitionSummary(row.original.definition)}
        </span>
      ),
    },
    {
      id: "applied",
      header: () => <span>Applied</span>,
      cell: ({ row }) => {
        const count = applied(row.original);
        return (
          <Badge variant={count ? "outline" : "warning-light"}>
            {fmtInt(count)} {count === 1 ? "queue" : "queues"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Actions for ${row.original.name}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                <Trash2Icon aria-hidden="true" />
                Delete policy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

export function PoliciesView() {
  const { data, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const [search, setSearch] = useState("");
  const [vhost, setVhost] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<{ policy: Policy; operator: boolean } | null>(
    null
  );

  const visible = useCallback(
    (policy: Policy) =>
      (matchesText(policy.name, search) || matchesText(policy.pattern, search)) &&
      (vhost === "all" || policy.vhost === vhost),
    [search, vhost]
  );

  const policies = useMemo(() => data.policies.filter(visible), [data.policies, visible]);
  const operatorPolicies = useMemo(
    () => data.operatorPolicies.filter(visible),
    [data.operatorPolicies, visible]
  );

  const applied = useCallback(
    (policy: Policy) =>
      data.queues.filter((queue) => matchesPolicy(policy, queue)).length,
    [data.queues]
  );

  const columns = useMemo(
    () => policyColumns(applied, (policy) => setPendingDelete({ policy, operator: false })),
    [applied]
  );
  const operatorColumns = useMemo(
    () => policyColumns(applied, (policy) => setPendingDelete({ policy, operator: true })),
    [applied]
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Policies"
        description="Pattern-based limits and behaviour applied to queues and exchanges."
        actions={
          <Button type="button" onClick={() => openDialog({ type: "add-policy" })}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add policy
          </Button>
        }
      />

      {error ? <RegionError message={error} onRetry={actions.retry} /> : null}

      <FilterBar search={search} onSearch={setSearch} placeholder="Search policies or patterns…">
        <SelectFilter
          value={vhost}
          onChange={setVhost}
          options={data.vhosts.map((entry) => ({ value: entry.name, label: entry.name }))}
          label="Filter by virtual host"
          allLabel="All virtual hosts"
        />
      </FilterBar>

      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold">User policies</h2>
            <p className="text-xs text-muted-foreground">
              Declared by vhost users and applied by name pattern.
            </p>
          </div>
          <Badge variant="outline">{policies.length} matching</Badge>
        </div>
        <ResourceTable
          data={policies}
          columns={columns}
          noun="policies"
          minWidth="min-w-[880px]"
          loading={status === "loading"}
          empty={
            <RegionEmpty
              title="No policies match"
              description="Adjust the filters or create a policy."
              action={
                <Button type="button" size="sm" onClick={() => openDialog({ type: "add-policy" })}>
                  Add policy
                </Button>
              }
            />
          }
        />
      </section>

      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="text-sm font-semibold">Operator policies</h2>
            <p className="text-xs text-muted-foreground">
              Administrators use these to override user policies for critical limits.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="outline">{operatorPolicies.length} matching</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openDialog({ type: "add-operator-policy" })}
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add operator policy
            </Button>
          </div>
        </div>
        <ResourceTable
          data={operatorPolicies}
          columns={operatorColumns}
          noun="operator policies"
          minWidth="min-w-[880px]"
          loading={status === "loading"}
          empty={
            <RegionEmpty
              title="No operator policies match"
              description="Override user policies when a limit must not be lowered."
              action={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openDialog({ type: "add-operator-policy" })}
                >
                  Add operator policy
                </Button>
              }
            />
          }
        />
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title={pendingDelete?.operator ? "Delete operator policy?" : "Delete policy?"}
        description={
          pendingDelete?.operator
            ? `${pendingDelete.policy.name} stops overriding user policies immediately.`
            : `${pendingDelete?.policy.name ?? ""} stops applying immediately. Queues that used it lose the policy badge.`
        }
        confirmLabel={pendingDelete?.operator ? "Delete operator policy" : "Delete policy"}
        tone="destructive"
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.operator) {
            actions.deleteOperatorPolicy(pendingDelete.policy.name);
            toast.success("Operator policy deleted", {
              description: `${pendingDelete.policy.name} no longer overrides user policies.`,
            });
          } else {
            actions.deletePolicy(pendingDelete.policy.name);
            toast.success("Policy deleted", {
              description: `${pendingDelete.policy.name} no longer applies.`,
            });
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
