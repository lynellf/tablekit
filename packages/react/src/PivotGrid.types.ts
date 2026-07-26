import type {
  Announcer,
  CellPosition,
  ColumnPinningState,
  SliceChange,
  TabBehavior,
} from '@lynellf/tablekit-core';
import type { DataVersion } from '@lynellf/tablekit-core/dataSource';
import type {
  AggregationEngine,
  LeafColumnId,
  PivotConfig,
  PivotExpansionState,
  PivotLeafColumn,
  PivotRowNode,
  PivotSortingState,
  PivotTableState,
  RowPathKey,
} from '@lynellf/tablekit-pivot';
import type { ReactNode, Ref, SyntheticEvent } from 'react';
import type { MessagesMap } from './messages';

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
  getRowId?: (row: TRow, index: number) => string;
  dataVersion?: DataVersion<TRow>;
  initialState?: Partial<PivotTableState>;
  state?: Partial<PivotTableState>;
  onPivotChange?: SliceChange<PivotConfig<TRow>>;
  onExpandedChange?: SliceChange<PivotExpansionState>;
  onPivotSortingChange?: SliceChange<PivotSortingState>;
  onColumnPinningChange?: SliceChange<ColumnPinningState>;
  onFocusedCellChange?: SliceChange<CellPosition | null>;
  onStateChange?: SliceChange<PivotTableState>;
  onRowDoubleClick?: (event: PivotGridRowEvent<TRow>) => void;
  onCellClick?: (event: PivotGridCellEvent<TRow>) => void;
  onCellDoubleClick?: (event: PivotGridCellEvent<TRow>) => void;
  announcer?: Announcer;
  messages?: Partial<MessagesMap>;
  tabBehavior?: TabBehavior;
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
