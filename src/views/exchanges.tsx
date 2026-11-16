import { useCallback, useMemo, useState } from "react";
import { PlusIcon, SendIcon, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filters-bar";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogs } from "@/components/dialogs/dialogs-provider";
import { useCluster } from "@/store/cluster";
import { useRoute, routeHref } from "@/lib/router";
import { fmtInt, fmtRate } from "@/lib/format";
import { filterRows, matchesText } from "@/lib/filtering";
import type { Exchange, ExchangeType } from "@/data/types";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { fitMeta, numericMeta } from "@/components/table";
import GridActions from "./exchanges/grid-actions";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import GridEmptyState from "@/components/ui/empty-state";

const EXCHANGE_TYPE_OPTIONS: { value: ExchangeType; label: string }[] = [
  { value: "direct", label: "Direct" },
  { value: "fanout", label: "Fanout" },
  { value: "topic", label: "Topic" },
  { value: "headers", label: "Headers" },
];

export function ExchangesView() {
  const { data, status, error, actions } = useCluster();
  const { openDialog } = useDialogs();
  const { navigate } = useRoute();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [pendingDelete, setPendingDelete] = useState<Exchange | null>(null);

  const exchanges = useMemo(
    () =>
      filterRows(
        data.exchanges.filter((exchange) => matchesText(exchange.name || "default", search)),
        query,
        { vhost: (exchange) => exchange.vhost, type: (exchange) => exchange.type }
      ),
    [data.exchanges, search, query]
  );

  const bindingCount = useCallback(
    (exchange: Exchange) =>
      data.bindings.filter(
        (binding) => binding.source === exchange.name && binding.vhost === exchange.vhost
      ).length,
    [data.bindings]
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
        options: EXCHANGE_TYPE_OPTIONS,
      },
    ],
    [data.vhosts]
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, Exchange>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Exchange" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">{row.original.name || "(default)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {row.original.internal ? <Badge variant="outline">Internal</Badge> : null}
              {row.original.durable ? <Badge variant="outline">Durable</Badge> : null}
            </div>
          </div>
        ),
        meta: fitMeta
      },
      {
        id: "bindings",
        header: () => <span>Bindings</span>,
        cell: ({ row }) => (
          <span className="data-cell">{fmtInt(bindingCount(row.original))}</span>
        ),
        meta: numericMeta
      },{
        accessorKey: "vhost",
        header: ({ column }) => <DataGridColumnHeader title="Virtual host" column={column} />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.vhost}</span>,
        meta: fitMeta
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
        meta: fitMeta
      },
      {
        accessorKey: "publishRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Publish" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.publishRate)}</span>,
        meta: numericMeta
      },
      {
        accessorKey: "deliverRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Deliver" />,
        cell: ({ row }) => <span className="data-cell">{fmtRate(row.original.deliverRate)}</span>,
        meta: numericMeta
      },
      {
        accessorKey: "autoDelete",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Auto-delete" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.autoDelete ? "Yes" : "No"}
          </span>
        ),
        meta: fitMeta
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <GridActions
            row={row.original}
            setPendingDelete={setPendingDelete}
            openDialog={openDialog}
          />
        ),
      },
    ],
    [bindingCount, openDialog]
  );

  const clearFilters = () => {
    setSearch("")
    setQuery(createFilterQuery())
  }

  const table = useTable({
    features: dataGridFeatures,
    defaultColumn: { size: 120, minSize: 80 },
    data: exchanges,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE } },
  });

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

      <DataGrid
        table={table}
        recordCount={exchanges.length}
        isLoading={status === "loading"}
        onRowClick={(row: Exchange) => navigate(routeHref("exchange", row.name))}
        emptyMessage={
          <GridEmptyState
            icon={<Waypoints />}
            title="No exchanges match"
            description="No exchange matches this search. Clear the filters to see all declared exchanges."
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
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}
        title="Delete exchange?"
        description={`This removes ${pendingDelete?.name ?? ""} and every binding that leaves it. Bound queues keep their messages.`}
        confirmLabel="Delete exchange"
        tone="destructive"
        onConfirm={async () => {
          if (!pendingDelete) return;
          const exchange = pendingDelete;
          setPendingDelete(null);
          try {
            await actions.deleteExchange(exchange.vhost, exchange.name);
            toast.success("Exchange deleted", { description: `${exchange.name} was removed.` });
          } catch (cause) {
            toast.error("Exchange was not deleted", {
              description:
                cause instanceof Error ? cause.message : "The management API did not respond.",
            });
          }
        }}
      />
    </div>
  );
}
