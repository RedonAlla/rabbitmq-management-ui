import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { useCluster } from "@/store/cluster"
import type { Policy, Queue } from "@/data/types"
import { policyColumns } from "./policy-columns"
import PolicyDetailDrawer from "./PolicyDetailDrawer"
import { DataGrid, dataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { useTable } from "@tanstack/react-table"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants"
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame"
import { FilterBar, SelectFilter } from "@/components/filters-bar"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { matchesText } from "@/lib/filtering"
import GridEmptyState from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { PlusIcon, ShieldCheck } from "lucide-react"

function matchesPolicy(policy: Policy, queue: Queue): boolean {
  if (policy.vhost !== queue.vhost || policy.applyTo === "exchanges")
    return false
  try {
    return new RegExp(policy.pattern).test(queue.name)
  } catch {
    return false
  }
}

export default function UserPolicies() {
  const { data, actions, status, error } = useCluster()
  const { openDialog } = useDialogs()
  const [pendingDelete, setPendingDelete] = useState<Policy | null>(null)
  const [selected, setSelected] = useState<Policy | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [vhost, setVhost] = useState("all")

  const applied = useCallback(
    (policy: Policy) =>
      data.queues.filter((queue) => matchesPolicy(policy, queue)).length,
    [data.queues]
  )

  const columns = useMemo(
    () => policyColumns(applied, setPendingDelete),
    [applied]
  )

  const visible = useCallback(
      (policy: Policy) =>
        (matchesText(policy.name, search) ||
          matchesText(policy.pattern, search)) &&
        (vhost === "all" || policy.vhost === vhost),
      [search, vhost]
    )
  
    const policies = useMemo(
      () => data.policies.filter(visible),
      [data.policies, visible]
    )

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: policies,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  });

  const clearFilters = () => {
    setSearch("")
    setVhost("all")
  }

  return (
    <section className="flex min-w-0 flex-col gap-2">

      <DataGrid
        table={table}
        recordCount={policies.length}
        isLoading={status === "loading"}
        onRowClick={(policy: Policy) => {
          setSelected(policy)
          setDrawerOpen(true)
        }}
        emptyMessage={
          <GridEmptyState
            icon={<ShieldCheck />}
            title="No policies match"
            description="Adjust the filters or create a policy."
            error={error}
            retry={actions.retry}
            action={
              <Button variant="outline" size="sm" onClick={() => clearFilters()}>
                Clear filters
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
          <FrameHeader>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold">User policies</h2>
                <p className="text-xs text-muted-foreground">
                  Declared by vhost users and applied by name pattern.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <FilterBar
                  search={search}
                  onSearch={setSearch}
                  placeholder="Search policies or patterns…"
                  className="justify-end sm:flex-nowrap"
                >
                  <SelectFilter
                    value={vhost}
                    onChange={setVhost}
                    options={data.vhosts.map((entry) => ({
                      value: entry.name,
                      label: entry.name,
                    }))}
                    label="Filter by virtual host"
                    allLabel="All virtual hosts"
                  />
                </FilterBar>
                <Button
                  type="button"
                  onClick={() => openDialog({ type: "add-policy" })}
                >
                  <PlusIcon data-icon="inline-start" aria-hidden="true" />
                  Add policy
                </Button>
              </div>
            </div>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete policy?"
        description={
          pendingDelete
            ? `${pendingDelete.name} stops applying immediately. Queues that used it lose the policy badge.`
            : ""
        }
        confirmLabel="Delete policy"
        tone="destructive"
        onConfirm={() => {
          if (!pendingDelete) return
          actions.deletePolicy(pendingDelete.name)
          toast.success("Policy deleted", {
            description: `${pendingDelete.name} no longer applies.`,
          })
          setDrawerOpen(false)
          setPendingDelete(null)
        }}
      />

      <PolicyDetailDrawer
        policy={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        applied={selected ? applied(selected) : 0}
        kind="user"
        onDelete={(policy) => {
          setDrawerOpen(false)
          setPendingDelete(policy)
        }}
      />
    </section>
  )
}
