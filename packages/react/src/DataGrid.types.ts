import type {
  ColumnDef,
  InitialTableState,
  OnChangeFn,
  RowData,
  RowSelectionState,
  TableState,
} from '@tanstack/react-table';
import type { ReactNode, Ref, SyntheticEvent } from 'react';
import type { DataSource } from './dataSource';
import type { MessagesMap } from './messages';

export type { RowSelectionState };
export type RowSelectionMode = 'none' | 'single' | 'multiple';
export type TabBehavior = 'exit' | 'cells';

export interface Announcer {
  announce(message: string, politeness?: 'polite' | 'assertive'): void;
}

export interface DataGridCellPosition {
  rowId: string;
  columnId: string;
}

export interface DataGridState extends Partial<TableState> {
  focusedCell?: DataGridCellPosition | null;
}

export interface DataGridColumnControls {
  menu?: boolean;
  reorder?: boolean;
  pinning?: boolean;
  visibility?: boolean;
}

export interface DataGridHandle<TRow> {
  getSelectedRowIds(): string[];
  getSelectedRows(): TRow[];
}

export interface DataGridRowEvent<TRow> {
  rowId: string;
  row: TRow;
  nativeEvent: SyntheticEvent<HTMLDivElement>;
}

export interface DataGridCellEvent<TRow> extends DataGridRowEvent<TRow> {
  columnId: string;
  value: unknown;
}

interface DataGridCommonProps<TRow extends RowData> {
  ref?: Ref<DataGridHandle<TRow>>;
  columns: Array<ColumnDef<TRow, unknown>>;
  getRowId?: (originalRow: TRow, index: number, parent?: { id: string }) => string;
  initialState?: InitialTableState & { focusedCell?: DataGridCellPosition | null };
  state?: DataGridState;
  onSortingChange?: OnChangeFn<TableState['sorting']>;
  onColumnFiltersChange?: OnChangeFn<TableState['columnFilters']>;
  onPaginationChange?: OnChangeFn<TableState['pagination']>;
  onColumnOrderChange?: OnChangeFn<TableState['columnOrder']>;
  onColumnVisibilityChange?: OnChangeFn<TableState['columnVisibility']>;
  onColumnPinningChange?: OnChangeFn<TableState['columnPinning']>;
  onColumnSizingChange?: OnChangeFn<TableState['columnSizing']>;
  onColumnSizingInfoChange?: OnChangeFn<TableState['columnSizingInfo']>;
  onFocusedCellChange?: OnChangeFn<DataGridCellPosition | null>;
  onStateChange?: (state: DataGridState) => void;
  announcer?: Announcer;
  messages?: Partial<MessagesMap>;
  navigationMode?: 'cell' | 'row' | 'none';
  tabBehavior?: TabBehavior;
  rowSelectionMode?: RowSelectionMode;
  rowSelection?: RowSelectionState;
  defaultRowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  onRowClick?: (event: DataGridRowEvent<TRow>) => void;
  onRowDoubleClick?: (event: DataGridRowEvent<TRow>) => void;
  onCellClick?: (event: DataGridCellEvent<TRow>) => void;
  onCellDoubleClick?: (event: DataGridCellEvent<TRow>) => void;
  height?: number;
  width?: number;
  rowHeight?: number;
  overscanRows?: number;
  overscanColumns?: number;
  pageSizeOptions?: number[];
  enableColumnResize?: boolean;
  columnControls?: boolean | DataGridColumnControls;
  className?: string;
  'aria-label'?: string;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
  errorContent?: (error: Error) => ReactNode;
}

type ClientDataGridProps<TRow extends RowData> = DataGridCommonProps<TRow> & {
  rows: TRow[];
  dataSource?: never;
};

type ServerDataGridProps<TRow extends RowData> = DataGridCommonProps<TRow> & {
  rows?: never;
  dataSource: DataSource<TRow>;
};

export type DataGridProps<TRow extends RowData> =
  | ClientDataGridProps<TRow>
  | ServerDataGridProps<TRow>;
