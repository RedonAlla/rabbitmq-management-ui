import type { ReactNode } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";
import { RegionError } from "@/components/region-states";

interface ResourceTableProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<DataGridFeatures, TData>[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: TData) => void;
  empty: ReactNode;
  pageSize?: number;
  minWidth?: string;
  noun?: string;
  showPagination?: boolean;
  footerExtra?: ReactNode;
}

export function ResourceTable<TData extends object>({
  data,
  columns,
  loading = false,
  error,
  onRetry,
  onRowClick,
  empty,
  pageSize = 10,
  minWidth = "min-w-[760px]",
  noun = "rows",
  showPagination = true,
  footerExtra,
}: ResourceTableProps<TData>) {
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  if (error) {
    return (
      <Frame spacing="sm" className="min-w-0">
        <FramePanel>
          <RegionError message={error} onRetry={onRetry ?? (() => undefined)} />
        </FramePanel>
      </Frame>
    );
  }

  return (
    <DataGrid
      table={table}
      recordCount={data.length}
      isLoading={loading}
      emptyMessage={empty}
      onRowClick={onRowClick}
      tableLayout={{ dense: true, headerBackground: true, headerSticky: true, width: "auto" }}
      tableClassNames={{ base: minWidth }}
    >
      <Frame spacing="sm" className="min-w-0">
        <FramePanel className="p-0">
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
        <FrameFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? noun.replace(/s$/, "") : noun}
            {footerExtra ? <span className="ml-2 text-muted-foreground/70">{footerExtra}</span> : null}
          </span>
          {showPagination ? <DataGridPagination sizes={[10, 20, 50]} /> : null}
        </FrameFooter>
      </Frame>
    </DataGrid>
  );
}
