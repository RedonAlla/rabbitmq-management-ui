import { useMemo, useState } from "react";
import { ListOrdered, PlusIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { Filters } from "@/components/reui/filters/filters";
import {
  createFilterQuery,
  flattenFilterConditions,
  type FilterCondition,
} from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtBytesMb, fmtInt, fmtRate } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { Queue } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import type { ConfirmState } from "./queues/grid-actions";
import GridActions from "./queues/grid-actions";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { numericMeta } from "@/components/table-meta-numeric";
import { Skeleton } from "@/components/ui/skeleton";
import GridEmptyState from "@/components/ui/empty-state";

function matchesCondition(value: string, condition: FilterCondition): boolean {
  const selected = condition.values.map(String);
  const pending = selected.length === 0;
  let matches: boolean;
  switch (condition.operator) {
    case "empty":
      matches = value === "";
      break;
    case "not_empty":
      matches = value !== "";
      break;
    case "is":
    case "is_any_of":
      matches = pending || selected.includes(value);
      break;
    case "is_not":
    case "is_none_of":
      matches = pending || !selected.includes(value);
      break;
    default:
      matches = true;
  }
  return condition.negated ? !matches : matches;
}

export function QueuesView() {
  const { data, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const conditions = useMemo(() =>
    flattenFilterConditions(query), [query]);

  const clearFilters = () => {
    setSearch("")
    setQuery(createFilterQuery())
  }

  const queues = useMemo(
    () =>
      data.queues.filter(
        (queue) =>
          matchesText(queue.name, search) &&
          conditions.every((condition) => {
            if (condition.field === "vhost") return matchesCondition(queue.vhost, condition);
            if (condition.field === "type") return matchesCondition(queue.type, condition);
            if (condition.field === "state") return matchesCondition(queue.state, condition);
            return true;
          })
      ),
    [data.queues, search, conditions]
  );

  const filterFields = useMemo<FilterField[]>(
    () => [
      {
        id: "vhost",
        label: "Virtual host",
        type: "select",
        options: data.vhosts.map((entry) => ({ value: entry.name, label: entry.name })),
      },
      {
        id: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "classic", label: "Classic" },
          { value: "quorum", label: "Quorum" },
          { value: "stream", label: "Stream" },
        ],
      },
      {
        id: "state",
        label: "State",
        type: "select",
        options: [
          { value: "running", label: "Running" },
          { value: "degraded", label: "Degraded" },
          { value: "idle", label: "Idle" },
        ],
      },
    ],
    [data.vhosts]
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, Queue>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Queue" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.name}</span>
            <div className="flex items-center gap-1.5">
              <TypeBadge type={row.original.type} />
              <VhostBadge>{row.original.vhost}</VhostBadge>
            </div>
          </div>
        ),
        enableResizing: true,
        meta: { skeleton: <Skeleton className="h-4 w-20" /> }
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
        meta: { skeleton: <Skeleton className="h-4 w-12" /> }
      },
      {
        accessorKey: "ready",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Ready" />,
        cell: ({ row }) => (
          <span className="data-cell">
            {fmtInt(row.original.ready)}
            {row.original.ready > 5000 ? (
              <span className="ml-1.5 inline-block size-1.5 rounded-full bg-warning align-middle" aria-label="High backlog" />
            ) : null}
          </span>
        ),
        meta: numericMeta,
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.unacked)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{row.original.consumers}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "publishRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Publish" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.publishRate)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "deliverRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deliver" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.deliverRate)}</span>,
        meta: numericMeta,
      },
      {
        accessorKey: "memory",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Memory" />,
        cell: ({ row }) => <span className="data-cell">{fmtBytesMb(row.original.memory)}</span>,
        meta: numericMeta,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (<GridActions rowData={row.original} openDialog={openDialog} setConfirm={setConfirm} />),
        meta: { skeleton: <Skeleton className="h-4 w-12" /> }
      },
    ],
    [openDialog]
  );

  const confirmQueue = async () => {
    if (!confirm) return;
    if (confirm.kind === "purge") {
      try {
        await actions.purgeQueue(confirm.queue.vhost, confirm.queue.name);
        toast.success("Queue purged", {
          description: `${fmtInt(confirm.queue.ready)} messages removed from ${confirm.queue.name}.`,
        });
      } catch (cause) {
        toast.error("Queue was not purged", {
          description:
            cause instanceof Error ? cause.message : "The management API did not respond.",
        });
      }
    } else {
      try {
        await actions.deleteQueue(confirm.queue.vhost, confirm.queue.name);
        toast.success("Queue deleted", { description: `${confirm.queue.name} was removed.` });
      } catch (cause) {
        toast.error("Queue was not deleted", {
          description:
            cause instanceof Error ? cause.message : "The management API did not respond.",
        });
      }
    }
    setConfirm(null);
  };

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: queues,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Queues"
        description="Ready depth, consumers and throughput for every queue."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => openDialog({ type: "publish" })}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
            <Button type="button" onClick={() => openDialog({ type: "add-queue" })}>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add queue
            </Button>
          </>
        }
      />

      <DataGrid
        table={table}
        recordCount={queues.length}
        isLoading={status === "loading"}
        onRowClick={(row: Queue) => navigate(routeHref("queue", row.name))}
        emptyMessage={
          <GridEmptyState
            icon={<ListOrdered />}
            title="No queues match"
            description="Adjust the search or clear the filters to see every declared queue."
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
            <FilterBar
              search={search}
              onSearch={setSearch}
              placeholder="Search queues…"
              className="justify-end"
            >
              <Filters
                fields={filterFields}
                query={query}
                onQueryChange={setQuery}
                size="sm"
                showClear
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

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        title={confirm?.kind === "purge" ? "Purge queue?" : "Delete queue?"}
        description={
          confirm?.kind === "purge"
            ? `This removes ${fmtInt(confirm.queue.ready)} ready messages from ${confirm.queue.name}. Consumers stay attached.`
            : `This permanently deletes ${confirm?.queue.name ?? ""} with its bindings and consumers.`
        }
        confirmLabel={confirm?.kind === "purge" ? "Purge messages" : "Delete queue"}
        tone={confirm?.kind === "delete" ? "destructive" : "default"}
        onConfirm={confirmQueue}
      />
    </div>
  );
}
