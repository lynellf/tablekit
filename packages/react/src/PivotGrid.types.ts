import type {
  AggregationEngine,
  LeafColumnId,
  PivotConfig,
  PivotExpansionState,
  PivotLeafColumn,
  PivotRowNode,
  PivotSortingState,
  RowPathKey,
} from '@lynellf/tablekit-pivot';
import type { ColumnPinningState, OnChangeFn } from '@tanstack/react-table';
import type { ReactNode, Ref, SyntheticEvent } from 'react';
import type { MessagesMap } from './messages';

export interface PivotGridCellPosition {
  rowId: string;
  columnId: string;
}

export interface PivotGridState<TRow> {
  pivot: PivotConfig<TRow>;
  expanded: PivotExpansionState;
  pivotSorting: PivotSortingState;
  columnPinning: ColumnPinningState;
  focusedCell: PivotGridCellPosition | null;
}

export interface PivotGridAnnouncer {
  announce(message: string, politeness?: 'polite' | 'assertive'): void;
}

export interface PivotGridDataVersion<TRow> {
  version?: string | number;
  getVersion?: (data: TRow[]) => string | number;
}

export interface PivotGridValueContext<TRow> {
  value: unknown;
  row: PivotRowNode<TRow> | null;
  leaf: PivotLeafColumn<TRow>;
  isGrandTotal: boolean;
}

export interface PivotGridRowEvent<TRow> {
  rowKey: RowPathKey;
  row: PivotRowNode<TRow>;
  nativeEvent: SyntheticEvent<HTMLDivElement>;
}

export interface PivotGridCellEvent<TRow> extends PivotGridValueContext<TRow> {
  rowKey: RowPathKey | null;
  columnId: LeafColumnId;
  nativeEvent: SyntheticEvent<HTMLDivElement>;
}

export interface PivotGridHandle {
  expandAll(): void;
  collapseAll(): void;
  sortFirstColumn(): void;
  getAllRowPathKeys(): RowPathKey[];
}

export interface PivotGridControlField {
  field: string;
  label?: string;
}

export interface PivotGridControls {
  fields?: PivotGridControlField[];
  position?: 'left' | 'right';
  aggregators?: string[];
}

export interface PivotGridProps<TRow> {
  ref?: Ref<PivotGridHandle>;
  data: TRow[];
  pivot: PivotConfig<TRow> | ((options: { data: TRow[] }) => PivotConfig<TRow>);
  engine?: AggregationEngine<TRow>;
  dataVersion?: PivotGridDataVersion<TRow>;
  initialState?: Partial<PivotGridState<TRow>>;
  state?: Partial<PivotGridState<TRow>>;
  onPivotChange?: OnChangeFn<PivotConfig<TRow>>;
  onExpandedChange?: OnChangeFn<PivotExpansionState>;
  onPivotSortingChange?: OnChangeFn<PivotSortingState>;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  onFocusedCellChange?: OnChangeFn<PivotGridCellPosition | null>;
  onStateChange?: OnChangeFn<PivotGridState<TRow>>;
  onRowDoubleClick?: (event: PivotGridRowEvent<TRow>) => void;
  onCellClick?: (event: PivotGridCellEvent<TRow>) => void;
  onCellDoubleClick?: (event: PivotGridCellEvent<TRow>) => void;
  announcer?: PivotGridAnnouncer;
  messages?: Partial<MessagesMap>;
  tabBehavior?: 'exit' | 'cells';
  height?: number;
  width?: number;
  rowHeight?: number;
  rowHeaderWidth?: number;
  overscanRows?: number;
  overscanColumns?: number;
  pivotControls?: boolean | PivotGridControls;
  className?: string;
  'aria-label'?: string;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
  errorContent?: (error: Error) => ReactNode;
  renderValue?: (context: PivotGridValueContext<TRow>) => ReactNode;
}
