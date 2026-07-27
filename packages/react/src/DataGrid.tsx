import {
  type Cell,
  type Column,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingInfoState,
  type ColumnSizingState,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import {
  type CSSProperties,
  type KeyboardEvent,
  type SyntheticEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  DataGridCellEvent,
  DataGridCellPosition,
  DataGridColumnControls,
  DataGridProps,
  DataGridRowEvent,
  DataGridState,
} from './DataGrid.types';
import { DataGridColumnMenu } from './DataGridColumnMenu';
import { ReactAnnouncer } from './ReactAnnouncer';
import { createAnnouncerChannel } from './createAnnouncerChannel';
import { useDataGridSource } from './dataSource';
import './styles.css';

export type {
  DataGridCellEvent,
  DataGridCellPosition,
  DataGridColumnControls,
  DataGridHandle,
  DataGridProps,
  DataGridRowEvent,
  DataGridState,
  RowSelectionMode,
  RowSelectionState,
} from './DataGrid.types';

const DEFAULT_HEIGHT = 480;
const DEFAULT_WIDTH = 800;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_PAGE_SIZE = 25;
const SELECTION_COLUMN_WIDTH = 44;

type GridCssProperties = CSSProperties & Record<`--tk-${string}`, string>;

const NO_COLUMN_CONTROLS: Required<DataGridColumnControls> = {
  menu: false,
  reorder: false,
  pinning: false,
  visibility: false,
};

const ALL_COLUMN_CONTROLS: Required<DataGridColumnControls> = {
  menu: true,
  reorder: true,
  pinning: true,
  visibility: true,
};

const resolveColumnControls = (
  controls: boolean | DataGridColumnControls | undefined,
): Required<DataGridColumnControls> => {
  if (controls === true) return ALL_COLUMN_CONTROLS;
  if (!controls) return NO_COLUMN_CONTROLS;
  return {
    menu: controls.menu ?? false,
    reorder: controls.reorder ?? false,
    pinning: controls.pinning ?? false,
    visibility: controls.visibility ?? false,
  };
};

const getColumnLabel = <TRow extends RowData>(column: Column<TRow, unknown>): string => {
  const header = column.columnDef.header;
  return typeof header === 'string' || typeof header === 'number' ? String(header) : column.id;
};

const defaultGetRowId = <TRow extends RowData>(_row: TRow, index: number) => String(index);

interface RenderedGridColumn<TRow extends RowData> {
  column: Column<TRow, unknown>;
  pinned: 'left' | 'right' | false;
  pinnedOffset: number;
  start: number;
  size: number;
}

const useSlice = <T,>(
  initialValue: T,
  controlledValue: T | undefined,
  onChange: ((updater: Updater<T>) => void) | undefined,
): [T, (updater: Updater<T>) => void] => {
  const [internalValue, setInternalValue] = useState(initialValue);
  const value = controlledValue === undefined ? internalValue : controlledValue;
  const valueRef = useRef(value);
  valueRef.current = value;

  const update = (updater: Updater<T>) => {
    const nextValue = functionalUpdate(updater, valueRef.current);
    if (controlledValue === undefined) setInternalValue(nextValue);
    onChange?.(updater);
  };

  return [value, update];
};

const moveItem = (ids: string[], id: string, targetIndex: number): string[] => {
  const next = ids.filter((item) => item !== id);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, id);
  return next;
};

export function DataGrid<TRow extends RowData>(props: DataGridProps<TRow>) {
  const {
    columns,
    ref,
    getRowId = defaultGetRowId,
    initialState,
    state,
    onSortingChange,
    onColumnFiltersChange,
    onPaginationChange,
    onColumnOrderChange,
    onColumnVisibilityChange,
    onColumnPinningChange,
    onColumnSizingChange,
    onColumnSizingInfoChange,
    onFocusedCellChange,
    onStateChange,
    announcer,
    rowSelectionMode = 'none',
    rowSelection,
    defaultRowSelection = {},
    onRowSelectionChange,
    onRowClick,
    onRowDoubleClick,
    onCellClick,
    onCellDoubleClick,
    height = DEFAULT_HEIGHT,
    width = DEFAULT_WIDTH,
    rowHeight = DEFAULT_ROW_HEIGHT,
    overscanRows = 4,
    overscanColumns = 2,
    pageSizeOptions = [10, 25, 50, 100],
    enableColumnResize = false,
    columnControls: columnControlsInput,
    className,
    'aria-label': ariaLabel = 'Data grid',
    loadingContent = 'Loading rows…',
    emptyContent = 'No rows to display.',
    errorContent = (error: Error) => `Unable to load rows: ${error.message}`,
  } = props;
  const source = props.dataSource;
  if (
    source &&
    (source.capabilities.sort !== 'server' ||
      source.capabilities.filter !== 'server' ||
      source.capabilities.paginate !== 'server' ||
      source.capabilities.pagination === 'cursor')
  ) {
    throw new Error(
      'DataGrid server mode requires server sorting, filtering, and offset pagination.',
    );
  }

  const [sorting, setSortingBase] = useSlice<SortingState>(
    initialState?.sorting ?? [],
    state?.sorting,
    onSortingChange,
  );
  const [columnFilters, setColumnFiltersBase] = useSlice<ColumnFiltersState>(
    initialState?.columnFilters ?? [],
    state?.columnFilters,
    onColumnFiltersChange,
  );
  const [pagination, setPagination] = useSlice<PaginationState>(
    {
      pageIndex: initialState?.pagination?.pageIndex ?? 0,
      pageSize: initialState?.pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
    },
    state?.pagination,
    onPaginationChange,
  );
  const [columnOrder, setColumnOrder] = useSlice<ColumnOrderState>(
    initialState?.columnOrder ?? [],
    state?.columnOrder,
    onColumnOrderChange,
  );
  const [columnVisibility, setColumnVisibility] = useSlice<VisibilityState>(
    initialState?.columnVisibility ?? {},
    state?.columnVisibility,
    onColumnVisibilityChange,
  );
  const [columnPinning, setColumnPinning] = useSlice<ColumnPinningState>(
    initialState?.columnPinning ?? { left: [], right: [] },
    state?.columnPinning,
    onColumnPinningChange,
  );
  const [columnSizing, setColumnSizing] = useSlice<ColumnSizingState>(
    initialState?.columnSizing ?? {},
    state?.columnSizing,
    onColumnSizingChange,
  );
  const [columnSizingInfo, setColumnSizingInfo] = useSlice<ColumnSizingInfoState>(
    initialState?.columnSizingInfo ?? {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    },
    state?.columnSizingInfo,
    onColumnSizingInfoChange,
  );
  const [selection, setSelection] = useSlice<RowSelectionState>(
    initialState?.rowSelection ?? defaultRowSelection,
    rowSelection ?? state?.rowSelection,
    (updater) => {
      const next = functionalUpdate(updater, selection);
      onRowSelectionChange?.(next);
    },
  );
  const [focusedCell, setFocusedCell] = useSlice<DataGridCellPosition | null>(
    initialState?.focusedCell ?? null,
    state?.focusedCell,
    onFocusedCellChange,
  );

  const resetPageAndUpdate =
    <T,>(update: (updater: Updater<T>) => void) =>
    (updater: Updater<T>) => {
      update(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    };
  const setSorting = resetPageAndUpdate(setSortingBase);
  const setColumnFilters = resetPageAndUpdate(setColumnFiltersBase);

  const sourceState = useDataGridSource({
    source,
    sorting,
    columnFilters,
    pagination,
  });
  const data = source ? sourceState.rows : (props.rows ?? []);

  const channelRef = useRef(createAnnouncerChannel(announcer ?? { announce: () => undefined }));
  const gridRef = useRef<HTMLDivElement>(null);
  const columnControls = resolveColumnControls(columnControlsInput);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    defaultColumn: {
      enableSorting: false,
      enableColumnFilter: false,
    },
    state: {
      sorting,
      columnFilters,
      pagination,
      columnOrder,
      columnVisibility,
      columnPinning,
      columnSizing,
      columnSizingInfo,
      rowSelection: selection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    onRowSelectionChange: setSelection,
    getCoreRowModel: getCoreRowModel(),
    ...(!source
      ? {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
    manualFiltering: Boolean(source),
    manualSorting: Boolean(source),
    manualPagination: Boolean(source),
    ...(sourceState.totalRowCount === undefined ? {} : { rowCount: sourceState.totalRowCount }),
    enableRowSelection: rowSelectionMode !== 'none',
    columnResizeMode: 'onChange',
  });

  const publicState = useMemo<DataGridState>(
    () => ({ ...table.getState(), focusedCell }),
    [
      columnFilters,
      columnOrder,
      columnPinning,
      columnSizing,
      columnSizingInfo,
      columnVisibility,
      focusedCell,
      pagination,
      selection,
      sorting,
      table,
    ],
  );
  useEffect(() => onStateChange?.(publicState), [onStateChange, publicState]);

  const updateSelection = (rowId: string) => {
    if (rowSelectionMode === 'none') return;
    setSelection((current) => {
      const selected = current[rowId] === true;
      if (rowSelectionMode === 'single') return selected ? {} : { [rowId]: true };
      const next = { ...current };
      if (selected) delete next[rowId];
      else next[rowId] = true;
      return next;
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      getSelectedRowIds: () => Object.keys(selection),
      getSelectedRows: () => data.filter((row, index) => selection[getRowId(row, index)] === true),
    }),
    [data, getRowId, selection],
  );

  const [viewport, setViewport] = useState({ top: 0, left: 0, height, width });
  const rows = table.getRowModel().rows;
  const selectionOffset = rowSelectionMode === 'none' ? 0 : SELECTION_COLUMN_WIDTH;
  const leftColumns = table.getLeftVisibleLeafColumns();
  const centerColumns = table.getCenterVisibleLeafColumns();
  const rightColumns = table.getRightVisibleLeafColumns();
  const visibleColumns = [...leftColumns, ...centerColumns, ...rightColumns];
  const leftWidth = leftColumns.reduce((total, column) => total + column.getSize(), 0);
  const rightWidth = rightColumns.reduce((total, column) => total + column.getSize(), 0);
  const focusedRowIndex = focusedCell
    ? rows.findIndex((row) => row.id === focusedCell.rowId)
    : undefined;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => gridRef.current,
    estimateSize: () => rowHeight,
    overscan: overscanRows,
    observeElementRect: (_instance, callback) => {
      callback({ width: viewport.width, height: viewport.height });
      return () => undefined;
    },
    observeElementOffset: (_instance, callback) => {
      callback(viewport.top, false);
      return () => undefined;
    },
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      return focusedRowIndex === undefined || focusedRowIndex < 0
        ? indexes
        : [...new Set([...indexes, focusedRowIndex])].sort((a, b) => a - b);
    },
  });
  const focusedCenterColumnIndex = focusedCell
    ? centerColumns.findIndex((column) => column.id === focusedCell.columnId)
    : undefined;
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: centerColumns.length,
    getScrollElement: () => gridRef.current,
    estimateSize: (index) => centerColumns[index]?.getSize() ?? 0,
    overscan: overscanColumns,
    observeElementRect: (_instance, callback) => {
      callback({
        width: Math.max(0, viewport.width - selectionOffset - leftWidth - rightWidth),
        height: viewport.height,
      });
      return () => undefined;
    },
    observeElementOffset: (_instance, callback) => {
      callback(viewport.left, false);
      return () => undefined;
    },
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      return focusedCenterColumnIndex === undefined || focusedCenterColumnIndex < 0
        ? indexes
        : [...new Set([...indexes, focusedCenterColumnIndex])].sort((a, b) => a - b);
    },
  });
  const rowItems = rowVirtualizer.getVirtualItems();
  const columnItems = columnVirtualizer.getVirtualItems();
  const centerStart = selectionOffset + leftWidth;
  const rightStart = centerStart + columnVirtualizer.getTotalSize();
  let leftOffset = 0;
  const renderedLeftColumns: Array<RenderedGridColumn<TRow>> = leftColumns.map((column) => {
    const size = column.getSize();
    const rendered = {
      column,
      pinned: 'left' as const,
      pinnedOffset: leftOffset,
      start: selectionOffset + leftOffset,
      size,
    };
    leftOffset += size;
    return rendered;
  });
  const renderedCenterColumns: Array<RenderedGridColumn<TRow>> = columnItems.flatMap((item) => {
    const column = centerColumns[item.index];
    return column
      ? [
          {
            column,
            pinned: false as const,
            pinnedOffset: 0,
            start: centerStart + item.start,
            size: item.size,
          },
        ]
      : [];
  });
  const rightPinnedOffsets = new Map<string, number>();
  let rightOffset = 0;
  for (let index = rightColumns.length - 1; index >= 0; index -= 1) {
    const column = rightColumns[index];
    if (!column) continue;
    rightPinnedOffsets.set(column.id, rightOffset);
    rightOffset += column.getSize();
  }
  let rightNaturalOffset = 0;
  const renderedRightColumns: Array<RenderedGridColumn<TRow>> = rightColumns.map((column) => {
    const size = column.getSize();
    const rendered = {
      column,
      pinned: 'right' as const,
      pinnedOffset: rightPinnedOffsets.get(column.id) ?? 0,
      start: rightStart + rightNaturalOffset,
      size,
    };
    rightNaturalOffset += size;
    return rendered;
  });
  const renderedColumns = [
    ...renderedLeftColumns,
    ...renderedCenterColumns,
    ...renderedRightColumns,
  ];
  const contentWidth = rightStart + rightWidth;
  const getRenderedColumnLeft = (column: (typeof renderedColumns)[number]): number => {
    if (column.pinned === 'left') {
      return viewport.left + selectionOffset + column.pinnedOffset;
    }
    if (column.pinned === 'right') {
      return Math.min(
        column.start,
        viewport.left + viewport.width - column.pinnedOffset - column.size,
      );
    }
    return column.start;
  };

  const publishRowEvent = (
    callback: ((event: DataGridRowEvent<TRow>) => void) | undefined,
    row: Row<TRow>,
    nativeEvent: SyntheticEvent<HTMLDivElement>,
  ) => callback?.({ rowId: row.id, row: row.original, nativeEvent });

  const publishCellEvent = (
    callback: ((event: DataGridCellEvent<TRow>) => void) | undefined,
    cell: Cell<TRow, unknown>,
    nativeEvent: SyntheticEvent<HTMLDivElement>,
  ) =>
    callback?.({
      rowId: cell.row.id,
      row: cell.row.original,
      columnId: cell.column.id,
      value: cell.getValue(),
      nativeEvent,
    });

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const activeCellId =
      document.activeElement instanceof HTMLElement
        ? document.activeElement.dataset.cellId
        : undefined;
    const separator = activeCellId?.lastIndexOf(':') ?? -1;
    const activeCell =
      activeCellId && separator >= 0
        ? {
            rowId: activeCellId.slice(0, separator),
            columnId: activeCellId.slice(separator + 1),
          }
        : focusedCell;
    if (!activeCell || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
      return;
    const rowIndex = rows.findIndex((row) => row.id === activeCell.rowId);
    const columnIndex = visibleColumns.findIndex((column) => column.id === activeCell.columnId);
    if (rowIndex < 0 || columnIndex < 0) return;
    const nextRowIndex = Math.max(
      0,
      Math.min(
        rows.length - 1,
        rowIndex + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0),
      ),
    );
    const nextColumnIndex = Math.max(
      0,
      Math.min(
        visibleColumns.length - 1,
        columnIndex + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0),
      ),
    );
    const nextRow = rows[nextRowIndex];
    const nextColumn = visibleColumns[nextColumnIndex];
    if (!nextRow || !nextColumn) return;
    event.preventDefault();
    setFocusedCell({ rowId: nextRow.id, columnId: nextColumn.id });
  };

  useEffect(() => {
    if (!focusedCell) return;
    const cell = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>('[data-cell-id]') ?? [],
    ).find((element) => element.dataset.cellId === `${focusedCell.rowId}:${focusedCell.columnId}`);
    cell?.focus();
  }, [focusedCell, renderedColumns.length, rowItems.length]);

  const moveColumn = (columnId: string, targetIndex: number) => {
    const orderedIds = visibleColumns.map((column) => column.id);
    setColumnOrder(moveItem(orderedIds, columnId, targetIndex));
  };
  const [grabbedColumn, setGrabbedColumn] = useState<{ id: string; targetIndex: number } | null>(
    null,
  );
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  const status = source ? sourceState.status : rows.length === 0 ? 'empty' : 'success';
  const totalRowCount = source ? (sourceState.totalRowCount ?? 0) : table.getRowCount();
  const pageCount = Math.max(1, table.getPageCount());
  const rootStyle: GridCssProperties = {
    '--tk-grid-height': `${height}px`,
    '--tk-grid-width': `${width}px`,
    '--tk-row-height': `${rowHeight}px`,
  };

  return (
    <div className={['tk-data-grid', className].filter(Boolean).join(' ')} style={rootStyle}>
      <ReactAnnouncer channel={channelRef.current} />
      <div
        ref={gridRef}
        role="grid"
        tabIndex={-1}
        className="tk-grid-viewport"
        aria-label={ariaLabel}
        aria-colcount={visibleColumns.length + (rowSelectionMode === 'none' ? 0 : 1)}
        aria-rowcount={totalRowCount + 1}
        aria-busy={status === 'loading' ? true : undefined}
        onKeyDown={onGridKeyDown}
        onScroll={(event) => {
          const element = event.currentTarget;
          setViewport({
            top: element.scrollTop,
            left: element.scrollLeft,
            height: element.clientHeight || height,
            width: element.clientWidth || width,
          });
        }}
      >
        <div role="row" className="tk-grid-header" style={{ width: contentWidth }}>
          {rowSelectionMode !== 'none' && (
            <div
              role="columnheader"
              className="tk-grid-selection-header"
              aria-label="Row selection"
              data-pinned="left"
              style={{ left: viewport.left }}
            />
          )}
          {renderedColumns.map((renderedColumn) => {
            const { column, pinned, size } = renderedColumn;
            const columnLabel = getColumnLabel(column);
            const sort = column.getIsSorted();
            const header = table
              .getHeaderGroups()
              .flatMap((group) => group.headers)
              .find((item) => item.column.id === column.id);
            return (
              <div
                key={column.id}
                role="columnheader"
                className={[
                  'tk-grid-column-header',
                  (columnControls.menu || columnControls.pinning || columnControls.visibility) &&
                    'tk-grid-column-header-controls',
                  pinned && `tk-grid-pinned-${pinned}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-column-id={column.id}
                data-pinned={pinned || undefined}
                aria-sort={sort === false ? undefined : sort === 'asc' ? 'ascending' : 'descending'}
                style={{ left: getRenderedColumnLeft(renderedColumn), width: size }}
                onDragOver={(event) => {
                  if (columnControls.reorder) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!columnControls.reorder) return;
                  event.preventDefault();
                  const activeId =
                    draggedColumnId || event.dataTransfer.getData('text/tablekit-column');
                  const targetIndex = visibleColumns.findIndex((item) => item.id === column.id);
                  if (activeId && targetIndex >= 0 && activeId !== column.id) {
                    moveColumn(activeId, targetIndex);
                  }
                  setDraggedColumnId(null);
                }}
              >
                <div className="tk-grid-header-label">
                  <span className="tk-grid-header-title">
                    {header ? flexRender(column.columnDef.header, header.getContext()) : column.id}
                  </span>
                  {column.getCanSort() && (
                    <button
                      type="button"
                      className="tk-grid-sort-button"
                      aria-label={`Sort ${column.id}`}
                      onClick={column.getToggleSortingHandler()}
                    >
                      {sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : '↕'}
                    </button>
                  )}
                  {columnControls.reorder && (
                    <button
                      type="button"
                      className="tk-grid-reorder-handle"
                      aria-label={`Reorder ${columnLabel}`}
                      aria-pressed={grabbedColumn?.id === column.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggedColumnId(column.id);
                        event.dataTransfer.setData('text/tablekit-column', column.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setDraggedColumnId(null)}
                      onKeyDown={(event) => {
                        if (event.key === ' ' && grabbedColumn?.id !== column.id) {
                          event.preventDefault();
                          setGrabbedColumn({
                            id: column.id,
                            targetIndex: visibleColumns.findIndex((item) => item.id === column.id),
                          });
                          return;
                        }
                        if (grabbedColumn?.id !== column.id) return;
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                          event.preventDefault();
                          const delta = event.key === 'ArrowLeft' ? -1 : 1;
                          setGrabbedColumn({
                            ...grabbedColumn,
                            targetIndex: Math.max(
                              0,
                              Math.min(
                                visibleColumns.length - 1,
                                grabbedColumn.targetIndex + delta,
                              ),
                            ),
                          });
                          return;
                        }
                        if (event.key === ' ' || event.key === 'Enter') {
                          event.preventDefault();
                          moveColumn(column.id, grabbedColumn.targetIndex);
                          setGrabbedColumn(null);
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          setGrabbedColumn(null);
                        }
                      }}
                    >
                      ⋮⋮
                    </button>
                  )}
                  <DataGridColumnMenu
                    columnId={column.id}
                    columnLabel={columnLabel}
                    columns={columns}
                    controls={columnControls}
                    table={table}
                  />
                </div>
                {column.getCanFilter() && (
                  <input
                    className="tk-grid-filter"
                    aria-label={`Filter ${column.id}`}
                    value={String(column.getFilterValue() ?? '')}
                    onChange={(event) => column.setFilterValue(event.currentTarget.value)}
                  />
                )}
                {enableColumnResize && header && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="tk-grid-resize-handle"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          role="rowgroup"
          className="tk-grid-body"
          style={{ height: rowVirtualizer.getTotalSize(), width: contentWidth }}
        >
          {rowItems.map(({ index, start }) => {
            const row = rows[index];
            if (!row) return null;
            const cells = new Map(row.getVisibleCells().map((cell) => [cell.column.id, cell]));
            return (
              <div
                key={row.id}
                role="row"
                className="tk-grid-row"
                aria-selected={selection[row.id] === true ? true : undefined}
                data-row-id={row.id}
                style={{ top: start, height: rowHeight, width: contentWidth }}
                onClick={(event) => publishRowEvent(onRowClick, row, event)}
                onDoubleClick={(event) => publishRowEvent(onRowDoubleClick, row, event)}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && event.key === 'Enter') {
                    publishRowEvent(onRowDoubleClick, row, event);
                  }
                }}
              >
                {rowSelectionMode !== 'none' && (
                  <div
                    role="gridcell"
                    className="tk-grid-selection-cell"
                    data-pinned="left"
                    style={{ left: viewport.left }}
                  >
                    <input
                      type={rowSelectionMode === 'single' ? 'radio' : 'checkbox'}
                      name={rowSelectionMode === 'single' ? 'tk-grid-selection' : undefined}
                      aria-label={`Select row ${row.id}`}
                      checked={selection[row.id] === true}
                      onChange={() => updateSelection(row.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                )}
                {renderedColumns.map((renderedColumn) => {
                  const { column, pinned, size } = renderedColumn;
                  const cell = cells.get(column.id);
                  if (!cell) return null;
                  const focused =
                    focusedCell?.rowId === row.id && focusedCell.columnId === column.id;
                  const initialFocusable =
                    focusedCell === null && index === 0 && column.id === visibleColumns[0]?.id;
                  return (
                    <div
                      key={cell.id}
                      role="gridcell"
                      className={['tk-grid-cell', pinned && `tk-grid-pinned-${pinned}`]
                        .filter(Boolean)
                        .join(' ')}
                      data-pinned={pinned || undefined}
                      data-cell-id={`${row.id}:${column.id}`}
                      tabIndex={focused || initialFocusable ? 0 : -1}
                      style={{ left: getRenderedColumnLeft(renderedColumn), width: size }}
                      onFocus={() => setFocusedCell({ rowId: row.id, columnId: column.id })}
                      onClick={(event) => publishCellEvent(onCellClick, cell, event)}
                      onDoubleClick={(event) => publishCellEvent(onCellDoubleClick, cell, event)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        publishCellEvent(onCellClick, cell, event);
                      }}
                    >
                      {flexRender(column.columnDef.cell, cell.getContext()) ??
                        String(cell.getValue() ?? '')}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {source && status === 'loading' && data.length === 0 && (
            <>
              {Array.from(
                { length: pagination.pageSize },
                (_, index) => `loading-placeholder-${index}`,
              ).map((placeholderId, index) => (
                <div
                  key={placeholderId}
                  role="row"
                  className="tk-grid-row"
                  data-placeholder="true"
                  style={{ top: index * rowHeight, height: rowHeight, width: contentWidth }}
                />
              ))}
              <div role="status" className="tk-grid-state">
                {loadingContent}
              </div>
            </>
          )}
          {status === 'empty' && (
            <div role="status" className="tk-grid-state">
              {emptyContent}
            </div>
          )}
          {source && status === 'error' && sourceState.error && (
            <div role="alert" className="tk-grid-state">
              {errorContent(sourceState.error)}
              <button type="button" onClick={sourceState.refetch}>
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tk-grid-footer" aria-label="Pagination">
        <span>{totalRowCount} rows</span>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {pagination.pageIndex + 1} of {pageCount}
        </span>
        <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
        <label>
          Rows per page
          <select
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.currentTarget.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
