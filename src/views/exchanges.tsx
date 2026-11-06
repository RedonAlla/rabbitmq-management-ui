import { useCallback, useMemo, useState } from "react";
import { MoreHorizontalIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
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
import { TypeBadge, VhostBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtInt, fmtRate } from "@/lib/format";
import { matchesText } from "@/lib/filtering";
import type { Exchange, ExchangeType } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";

export function ExchangesView() {
  const { data, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [vhost, setVhost] = useState("all");
  const [type, setType] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Exchange | null>(null);

  const exchanges = useMemo(
    () =>
      data.exchanges.filter(
        (exchange) =>
          matchesText(exchange.name || "default", search) &&
          (vhost === "all" || exchange.vhost === vhost) &&
          (type === "all" || exchange.type === type)
      ),
    [data.exchanges, search, vhost, type]
  );

  const bindingCount = useCallback(
    (exchange: Exchange) =>
      data.bindings.filter(
        (binding) => binding.source === exchange.name && binding.vhost === exchange.vhost
      ).length,
    [data.bindings]
  );

  const typeOptions: { value: ExchangeType; label: string }[] = [
    { value: "direct", label: "Direct" },
    { value: "fanout", label: "Fanout" },
    { value: "topic", label: "Topic" },
    { value: "headers", label: "Headers" },
  ];

  const columns = useMemo<ColumnDef<DataGridFeatures, Exchange>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Exchange" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">{row.original.name || "(default)"}</span>
              {row.original.internal ? <Badge variant="outline">Internal</Badge> : null}
            </div>
            <div className="flex items-center gap-1.5">
              <TypeBadge type={row.original.type} />
              <VhostBadge>{row.original.vhost}</VhostBadge>
            </div>
          </div>
        ),
      },
      {
        id: "bindings",
        header: () => <span>Bindings</span>,
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(bindingCount(row.original))}</span>
        ),
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
        accessorKey: "durable",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Durable" />,
        cell: ({ row }) => (
          <Badge variant={row.original.durable ? "outline" : "warning-light"}>
            {row.original.durable ? "Durable" : "Transient"}
          </Badge>
        ),
      },
      {
        accessorKey: "autoDelete",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Auto-delete" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.autoDelete ? "Yes" : "No"}
          </span>
        ),
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
                    aria-label={`Actions for ${row.original.name || "default exchange"}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() =>
                    openDialog({
                      type: "publish",
                      vhost: row.original.vhost,
                      exchange: row.original.name || undefined,
                    })
                  }
                >
                  <SendIcon aria-hidden="true" />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!row.original.name}
                  onClick={() => setPendingDelete(row.original)}
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
    [bindingCount, openDialog]
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Exchanges"
        description="Routing exchanges, binding counts and publish throughput."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => openDialog({ type: "publish" })}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Publish
            </Button>
            <Button type="button" onClick={() => openDialog({ type: "add-exchange" })}>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add exchange
            </Button>
          </>
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search exchanges…">
        <SelectFilter
          value={vhost}
          onChange={setVhost}
          options={data.vhosts.map((entry) => ({ value: entry.name, label: entry.name }))}
          label="Filter by virtual host"
          allLabel="All virtual hosts"
        />
        <SelectFilter
          value={type}
          onChange={setType}
          options={typeOptions}
          label="Filter by exchange type"
          allLabel="All types"
        />
      </FilterBar>

      <ResourceTable
        data={exchanges}
        columns={columns}
        noun="exchanges"
        minWidth="min-w-[840px]"
        loading={status === "loading"}
        error={error}
        onRetry={actions.retry}
        onRowClick={(exchange) =>
          exchange.name ? navigate(routeHref("exchange", exchange.name)) : undefined
        }
        footerExtra={`${data.exchanges.length} total`}
        empty={
          <RegionEmpty
            title="No exchanges match"
            description="Adjust the filters or declare a new exchange."
            action={
              <Button type="button" size="sm" onClick={() => openDialog({ type: "add-exchange" })}>
                Add exchange
              </Button>
            }
          />
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete exchange?"
        description={`This removes ${pendingDelete?.name ?? ""} and every binding that leaves it. Bound queues keep their messages.`}
        confirmLabel="Delete exchange"
        tone="destructive"
        onConfirm={() => {
          if (!pendingDelete) return;
          actions.deleteExchange(pendingDelete.name);
          toast.success("Exchange deleted", { description: `${pendingDelete.name} was removed.` });
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
