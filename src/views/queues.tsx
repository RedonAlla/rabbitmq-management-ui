import { useMemo, useState } from "react";
import { EraserIcon, MoreHorizontalIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { ResourceTable } from "@/components/resource-table";
import { RegionEmpty } from "@/components/region-states";
import { FilterBar, SelectFilter } from "@/components/filters-bar";
import { StateBadge, TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtBytesMb, fmtInt, fmtRate } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { Queue, QueueState, QueueType } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

type ConfirmState = { kind: "purge" | "delete"; queue: Queue } | null;

export function QueuesView() {
  const { data, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [vhost, setVhost] = useState("all");
  const [type, setType] = useState("all");
  const [state, setState] = useState("all");
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const queues = useMemo(
    () =>
      data.queues.filter(
        (queue) =>
          matchesText(queue.name, search) &&
          (vhost === "all" || queue.vhost === vhost) &&
          (type === "all" || queue.type === type) &&
          (state === "all" || queue.state === state)
      ),
    [data.queues, search, vhost, type, state]
  );

  const vhostOptions = data.vhosts.map((entry) => ({ value: entry.name, label: entry.name }));
  const typeOptions: { value: QueueType; label: string }[] = [
    { value: "classic", label: "Classic" },
    { value: "quorum", label: "Quorum" },
    { value: "stream", label: "Stream" },
  ];
  const stateOptions: { value: QueueState; label: string }[] = [
    { value: "running", label: "Running" },
    { value: "degraded", label: "Degraded" },
    { value: "idle", label: "Idle" },
  ];

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
      },
      {
        accessorKey: "state",
        header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
        cell: ({ row }) => <StateBadge state={row.original.state} />,
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
      },
      {
        accessorKey: "unacked",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Unacked" />,
        cell: ({ row }) => <span className="data-cell">{fmtInt(row.original.unacked)}</span>,
      },
      {
        accessorKey: "consumers",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Consumers" />,
        cell: ({ row }) => <span className="data-cell">{row.original.consumers}</span>,
      },
      {
        accessorKey: "publishRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Publish" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.publishRate)}</span>,
      },
      {
        accessorKey: "deliverRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deliver" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.deliverRate)}</span>,
      },
      {
        accessorKey: "memory",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Memory" />,
        cell: ({ row }) => <span className="data-cell">{fmtBytesMb(row.original.memory)}</span>,
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
                <DropdownMenuItem
                  onClick={() => openDialog({ type: "publish", vhost: row.original.vhost })}
                >
                  <SendIcon aria-hidden="true" />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirm({ kind: "purge", queue: row.original })}
                >
                  <EraserIcon aria-hidden="true" />
                  Purge
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirm({ kind: "delete", queue: row.original })}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [openDialog]
  );

  const confirmQueue = () => {
    if (!confirm) return;
    if (confirm.kind === "purge") {
      actions.purgeQueue(confirm.queue.name);
      toast.success("Queue purged", {
        description: `${fmtInt(confirm.queue.ready)} messages removed from ${confirm.queue.name}.`,
      });
    } else {
      actions.deleteQueue(confirm.queue.name);
      toast.success("Queue deleted", { description: `${confirm.queue.name} was removed.` });
    }
    setConfirm(null);
  };

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

      <FilterBar search={search} onSearch={setSearch} placeholder="Search queues…">
        <SelectFilter
          value={vhost}
          onChange={setVhost}
          options={vhostOptions}
          label="Filter by virtual host"
          allLabel="All virtual hosts"
        />
        <SelectFilter
          value={type}
          onChange={setType}
          options={typeOptions}
          label="Filter by queue type"
          allLabel="All types"
        />
        <SelectFilter
          value={state}
          onChange={setState}
          options={stateOptions}
          label="Filter by state"
          allLabel="All states"
        />
      </FilterBar>

      <ResourceTable
        data={queues}
        columns={columns}
        noun="queues"
        minWidth="min-w-[980px]"
        loading={status === "loading"}
        error={error}
        onRetry={actions.retry}
        onRowClick={(queue) => navigate(routeHref("queue", queue.name))}
        footerExtra={`${data.queues.length} total`}
        empty={
          <RegionEmpty
            title="No queues match"
            description="Adjust the filters or declare a new queue."
            action={
              <Button type="button" size="sm" onClick={() => openDialog({ type: "add-queue" })}>
                Add queue
              </Button>
            }
          />
        }
      />

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
