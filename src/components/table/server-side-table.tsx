import { type ReactNode } from "react";
import {
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGES_OPTIONS } from "@/lib/constants";
import GridEmptyState from "@/components/ui/empty-state";
import { ConditionalRender } from "../conditional-render";


interface Props<TData extends RowData> {
  data: TData[];
  isLoading: boolean;
  columns: ColumnDef<DataGridFeatures, TData>[];
  totalCount: number;
  pageCount: number;
  state: {
    pagination: PaginationState;
    sorting: SortingState
  };
  emptyState: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
  };
  error: {
    message: string | null;
    retry: () => void;
  }
  actions: ReactNode | null;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  onRowClick?: (row: TData) => void
}

export function ServerSideTable<TData extends RowData>({
  data,
  columns,
  totalCount,
  pageCount,
  state,
  isLoading,
  emptyState,
  error,
  actions,
  onRowClick,
  onPaginationChange,
  onSortingChange,
  
}: Props<TData>) {
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    manualPagination: true,
    manualSorting: true,
    autoResetPageIndex: false,
    pageCount: pageCount,
    rowCount: totalCount,
    state,
    initialState: {
      pagination: {
        pageIndex: 1,
        pageSize: DEFAULT_PAGE_SIZE
      }
    },
    onPaginationChange,
    onSortingChange
  });

  return (
    <DataGrid
        table={table}
        recordCount={totalCount}
        isLoading={isLoading}
        onRowClick={onRowClick}
        emptyMessage={
          <GridEmptyState
            error={error.message}
            retry={error.retry}
            {... emptyState}
          />
        }
        tableLayout={{
          dense: true,
          headerBorder: true,
          width: "auto",
        }}
      >
        <Frame spacing="sm" className="min-w-0">
          <ConditionalRender condition={actions !== null}>
            <FrameHeader>
              {actions}
            </FrameHeader>
          </ConditionalRender>
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
  );
}