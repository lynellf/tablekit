import type {
  FieldRef,
  FieldValue,
  PivotColumnNode,
  PivotConfig,
  PivotExpansionState,
  PivotLeafColumn,
  PivotRowNode,
  PivotSortingState,
  RowPathKey,
} from '@lynellf/tablekit-pivot';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { PivotFieldBuilder } from './PivotFieldBuilder';
import type {
  PivotGridCellEvent,
  PivotGridControls,
  PivotGridProps,
  PivotGridRowEvent,
  PivotGridValueContext,
} from './PivotGrid.types';
import {
  type PivotPinnedSide,
  createPivotColumnRegions,
  getPivotNodeLeafIds,
} from './pivotColumnLayout';
import { usePivotTable } from './usePivotTable';
import './styles.css';

export type {
  PivotGridCellEvent,
  PivotGridCellPosition,
  PivotGridControlField,
  PivotGridControls,
  PivotGridDataVersion,
  PivotGridHandle,
  PivotGridProps,
  PivotGridRowEvent,
  PivotGridState,
  PivotGridValueContext,
} from './PivotGrid.types';

const DEFAULT_HEIGHT = 480;
const DEFAULT_WIDTH = 800;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_ROW_HEADER_WIDTH = 220;
const HEADER_ROW_HEIGHT = 32;

type PivotCssProperties = CSSProperties & Record<`--tk-${string}`, string>;
type HeaderEntry = { node: PivotColumnNode | PivotLeafColumn; colSpan: number };

interface RenderedPivotLeaf<TRow> {
  leaf: PivotLeafColumn<TRow>;
  pinned: PivotPinnedSide;
  pinnedOffset: number;
  start: number;
  size: number;
}

interface RenderedPivotHeader {
  node: PivotColumnNode | PivotLeafColumn;
  pinned: PivotPinnedSide;
  pinnedOffset: number;
  start: number;
  size: number;
}

const renderSlot = (slot: unknown, context: unknown, fallback: ReactNode): ReactNode => {
  if (typeof slot === 'function') return (slot as (value: unknown) => ReactNode)(context);
  if (slot === null || slot === undefined) return fallback;
  return slot as ReactNode;
};

const labelOf = (node: PivotColumnNode | PivotLeafColumn): unknown =>
  'label' in node ? node.label : node.header;

const getFieldValue = <TRow,>(row: TRow, fieldRef: FieldRef<TRow>): FieldValue => {
  if (typeof fieldRef === 'string') {
    return (row as Record<string, unknown>)[fieldRef] as FieldValue;
  }
  return fieldRef.accessor
    ? fieldRef.accessor(row)
    : ((row as Record<string, unknown>)[fieldRef.field] as FieldValue);
};

const collectAllRowPathKeys = <TRow,>(data: TRow[], config: PivotConfig<TRow>): RowPathKey[] => {
  const keys = new Set<RowPathKey>();
  for (const row of data) {
    const path: FieldValue[] = [];
    for (const fieldRef of config.rows) {
      path.push(getFieldValue(row, fieldRef));
      const key = JSON.stringify(path);
      if (key !== undefined) keys.add(key);
    }
  }
  return [...keys];
};

export function PivotGrid<TRow>(props: PivotGridProps<TRow>) {
  const {
    ref,
    data,
    pivot: pivotConfig,
    state: controlledState,
    onPivotChange,
    onRowDoubleClick,
    onCellClick,
    onCellDoubleClick,
    height = DEFAULT_HEIGHT,
    width = DEFAULT_WIDTH,
    rowHeight = DEFAULT_ROW_HEIGHT,
    rowHeaderWidth = DEFAULT_ROW_HEADER_WIDTH,
    overscanRows = 4,
    overscanColumns = 2,
    pivotControls: pivotControlsInput,
    className,
    'aria-label': ariaLabel = 'Pivot grid',
    loadingContent = 'Loading pivot…',
    emptyContent = 'No pivot rows to display.',
    errorContent = (error: Error) => `Unable to aggregate rows: ${error.message}`,
    renderValue,
  } = props;
  const pivotControls: PivotGridControls | null =
    pivotControlsInput === true
      ? {}
      : pivotControlsInput && typeof pivotControlsInput === 'object'
        ? pivotControlsInput
        : null;
  const [builderPivot, setBuilderPivot] = useState<PivotConfig<TRow> | null>(null);
  useEffect(() => {
    setBuilderPivot(null);
  }, [pivotConfig]);

  const {
    state,
    result,
    rows,
    leafColumns,
    headerRows: engineHeaderRows,
    status,
    error: rootError,
    Announcer,
    gridRef,
    setPivot,
    setExpanded,
    toggleExpanded,
    setPivotSorting,
    setFocusedCell,
    retry,
    retryRow,
  } = usePivotTable(props, builderPivot);
  useImperativeHandle(
    ref,
    () => ({
      getAllRowPathKeys: () => collectAllRowPathKeys(data, state.pivot as PivotConfig<TRow>),
      expandAll: () => {
        const expanded = Object.fromEntries(
          collectAllRowPathKeys(data, state.pivot as PivotConfig<TRow>).map((key) => [key, true]),
        ) as PivotExpansionState;
        setExpanded(expanded);
      },
      collapseAll: () => setExpanded({}),
      sortFirstColumn: () => {
        const currentSort = state.pivotSorting.find(
          (item) => item.level === 0 && item.by === 'label',
        );
        const nextSorting: PivotSortingState = [
          { level: 0, by: 'label', desc: currentSort ? !currentSort.desc : false },
          ...state.pivotSorting.filter((item) => item.level !== 0),
        ];
        setPivotSorting(nextSorting);
      },
    }),
    [data, setExpanded, setPivotSorting, state.pivot, state.pivotSorting],
  );
  const updateBuilderPivot = (updater: (current: PivotConfig<TRow>) => PivotConfig<TRow>) => {
    if (controlledState && 'pivot' in controlledState) {
      onPivotChange?.(updater);
      return;
    }
    const next = updater(state.pivot as PivotConfig<TRow>);
    setBuilderPivot(next);
    setPivot(next);
  };
  const columnRegions = createPivotColumnRegions(leafColumns, state.columnPinning);
  const orderedLeaves = columnRegions.ordered;
  const hasLeafHeaderRow = engineHeaderRows.some((row) =>
    row.some(({ node }) => 'measureId' in node),
  );
  const needsMeasureHeaderRow =
    !hasLeafHeaderRow && (state.pivot.measures.length > 1 || engineHeaderRows.length === 0);
  const headerRows: HeaderEntry[][] = needsMeasureHeaderRow
    ? [...engineHeaderRows, orderedLeaves.map((node) => ({ node, colSpan: 1 }))]
    : engineHeaderRows;
  const headerHeight = Math.max(1, headerRows.length) * HEADER_ROW_HEIGHT;
  const showGrandTotal = state.pivot.totals?.grandTotalRow !== false && orderedLeaves.length > 0;

  const bodyViewportHeight = Math.max(0, height - headerHeight - (showGrandTotal ? rowHeight : 0));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({
    top: 0,
    left: 0,
    height: bodyViewportHeight,
    width,
  });
  useEffect(() => {
    const element = scrollRef.current;
    const updateSize = () => {
      const nextHeight = element?.clientHeight || bodyViewportHeight;
      const nextWidth = element?.clientWidth || width;
      setViewport((current) =>
        current.height === nextHeight && current.width === nextWidth
          ? current
          : { ...current, height: nextHeight, width: nextWidth },
      );
    };
    updateSize();
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [bodyViewportHeight, width]);
  const focusedRowIndex = state.focusedCell
    ? rows.findIndex((row) => row.key === state.focusedCell?.rowId)
    : undefined;
  const rowRectCallbackRef = useRef<((rect: { width: number; height: number }) => void) | null>(
    null,
  );
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: overscanRows,
    observeElementRect: (_instance, callback) => {
      rowRectCallbackRef.current = callback;
      callback({ width: viewport.width, height: viewport.height });
      return () => {
        rowRectCallbackRef.current = null;
      };
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
  useEffect(() => {
    rowRectCallbackRef.current?.({ width: viewport.width, height: viewport.height });
  }, [viewport.height, viewport.width]);
  const leftWidth = columnRegions.left.reduce((total, leaf) => total + leaf.size, 0);
  const rightWidth = columnRegions.right.reduce((total, leaf) => total + leaf.size, 0);
  const focusedCenterColumnIndex = state.focusedCell
    ? columnRegions.center.findIndex((leaf) => leaf.id === state.focusedCell?.columnId)
    : undefined;
  const columnRectCallbackRef = useRef<((rect: { width: number; height: number }) => void) | null>(
    null,
  );
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columnRegions.center.length,
    enabled: columnRegions.center.length > 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => columnRegions.center[index]?.size ?? 0,
    overscan: overscanColumns,
    observeElementRect: (_instance, callback) => {
      columnRectCallbackRef.current = callback;
      const rect = {
        width: Math.max(0, viewport.width - rowHeaderWidth - leftWidth - rightWidth),
        height: viewport.height,
      };
      callback(rect);
      return () => {
        columnRectCallbackRef.current = null;
      };
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
  useEffect(() => {
    columnRectCallbackRef.current?.({
      width: Math.max(0, viewport.width - rowHeaderWidth - leftWidth - rightWidth),
      height: viewport.height,
    });
  }, [leftWidth, rightWidth, rowHeaderWidth, viewport.height, viewport.width]);
  const rowItems = rowVirtualizer.getVirtualItems();
  const columnItems = columnVirtualizer.getVirtualItems();
  const centerStart = rowHeaderWidth + leftWidth;
  const rightStart = centerStart + columnVirtualizer.getTotalSize();
  let leftOffset = 0;
  const renderedLeftLeaves: Array<RenderedPivotLeaf<TRow>> = columnRegions.left.map((leaf) => {
    const rendered = {
      leaf: { ...leaf, pinnedOffset: leftOffset },
      pinned: 'left' as const,
      pinnedOffset: leftOffset,
      start: rowHeaderWidth + leftOffset,
      size: leaf.size,
    };
    leftOffset += leaf.size;
    return rendered;
  });
  let centerNaturalOffset = 0;
  const allCenterLeafLayouts: Array<RenderedPivotLeaf<TRow>> = columnRegions.center.map((leaf) => {
    const rendered = {
      leaf,
      pinned: false as const,
      pinnedOffset: 0,
      start: centerStart + centerNaturalOffset,
      size: leaf.size,
    };
    centerNaturalOffset += leaf.size;
    return rendered;
  });
  const renderedCenterLeaves: Array<RenderedPivotLeaf<TRow>> = columnItems.flatMap(({ index }) => {
    const rendered = allCenterLeafLayouts[index];
    return rendered ? [rendered] : [];
  });
  const rightPinnedOffsets = new Map<string, number>();
  let rightOffset = 0;
  for (let index = columnRegions.right.length - 1; index >= 0; index -= 1) {
    const leaf = columnRegions.right[index];
    if (!leaf) continue;
    rightPinnedOffsets.set(leaf.id, rightOffset);
    rightOffset += leaf.size;
  }
  let rightNaturalOffset = 0;
  const renderedRightLeaves: Array<RenderedPivotLeaf<TRow>> = columnRegions.right.map((leaf) => {
    const pinnedOffset = rightPinnedOffsets.get(leaf.id) ?? 0;
    const rendered = {
      leaf: { ...leaf, pinnedOffset },
      pinned: 'right' as const,
      pinnedOffset,
      start: rightStart + rightNaturalOffset,
      size: leaf.size,
    };
    rightNaturalOffset += leaf.size;
    return rendered;
  });
  const allLeafLayouts = [...renderedLeftLeaves, ...allCenterLeafLayouts, ...renderedRightLeaves];
  const contentWidth = rightStart + rightWidth;
  const leafLayoutById = new Map(allLeafLayouts.map((rendered) => [rendered.leaf.id, rendered]));
  const renderedCenterLeafIds = new Set(renderedCenterLeaves.map(({ leaf }) => leaf.id));
  const getRenderedPosition = (rendered: {
    pinned: PivotPinnedSide;
    pinnedOffset: number;
    start: number;
    size: number;
  }): CSSProperties => {
    if (rendered.pinned === 'left') {
      return { left: rowHeaderWidth + rendered.pinnedOffset };
    }
    if (rendered.pinned === 'right') {
      return { right: rendered.pinnedOffset };
    }
    return { left: rendered.start };
  };
  const getRenderedHeaders = (headerRow: HeaderEntry[]): RenderedPivotHeader[] =>
    headerRow
      .flatMap(({ node }) => {
        const nodeLeafIds = getPivotNodeLeafIds(node);
        const nodeLeaves = nodeLeafIds.flatMap((id) => {
          const rendered = leafLayoutById.get(id);
          return rendered ? [rendered] : [];
        });
        if (nodeLeaves.length === 0) return [];
        const pinned = nodeLeaves[0]?.pinned ?? false;
        if (pinned === false && !nodeLeafIds.some((id) => renderedCenterLeafIds.has(id))) return [];
        const start = Math.min(...nodeLeaves.map((leaf) => leaf.start));
        const end = Math.max(...nodeLeaves.map((leaf) => leaf.start + leaf.size));
        const size = end - start;
        const pinnedOffset =
          pinned === 'left' ? start - rowHeaderWidth : pinned === 'right' ? contentWidth - end : 0;
        return [{ node, pinned, pinnedOffset, start, size }];
      })
      .sort((a, b) => a.start - b.start);
  const bodyHeight = rowVirtualizer.getTotalSize();

  const renderCellValue = (
    value: unknown,
    row: PivotRowNode<TRow> | null,
    leaf: PivotLeafColumn<TRow>,
    isGrandTotal: boolean,
  ): ReactNode => {
    const context: PivotGridValueContext<TRow> = { value, row, leaf, isGrandTotal };
    return renderValue ? renderValue(context) : String(value ?? '');
  };

  const publishRowEvent = (
    callback: ((event: PivotGridRowEvent<TRow>) => void) | undefined,
    row: PivotRowNode<TRow>,
    nativeEvent: SyntheticEvent<HTMLDivElement>,
  ) => callback?.({ rowKey: row.key, row, nativeEvent });

  const publishCellEvent = (
    callback: ((event: PivotGridCellEvent<TRow>) => void) | undefined,
    value: unknown,
    row: PivotRowNode<TRow> | null,
    leaf: PivotLeafColumn<TRow>,
    isGrandTotal: boolean,
    nativeEvent: SyntheticEvent<HTMLDivElement>,
  ) =>
    callback?.({
      value,
      row,
      leaf,
      isGrandTotal,
      rowKey: row?.key ?? null,
      columnId: leaf.id,
      nativeEvent,
    });

  const renderRowCell = (
    row: PivotRowNode<TRow>,
    renderedLeaf: RenderedPivotLeaf<TRow>,
  ): ReactNode => {
    const { leaf, pinned, size } = renderedLeaf;
    const focused = state.focusedCell?.rowId === row.key && state.focusedCell.columnId === leaf.id;
    return (
      <div
        key={leaf.id}
        role="gridcell"
        className={['tk-pivot-cell', pinned && `tk-pivot-pinned-${pinned}`]
          .filter(Boolean)
          .join(' ')}
        data-column-id={leaf.id}
        data-row-id={row.key}
        data-pinned={pinned || undefined}
        data-pivot-cell-id={`${row.key}:${leaf.id}`}
        tabIndex={focused ? 0 : -1}
        style={{ ...getRenderedPosition(renderedLeaf), width: size }}
        onFocus={() => setFocusedCell({ rowId: row.key, columnId: leaf.id })}
        onClick={(event) => {
          event.currentTarget.focus();
          publishCellEvent(onCellClick, row.values[leaf.id], row, leaf, false, event);
        }}
        onDoubleClick={(event) =>
          publishCellEvent(onCellDoubleClick, row.values[leaf.id], row, leaf, false, event)
        }
        onKeyDown={(event) => {
          if (!onCellClick || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          publishCellEvent(onCellClick, row.values[leaf.id], row, leaf, false, event);
        }}
      >
        {renderCellValue(row.values[leaf.id], row, leaf, false)}
      </div>
    );
  };

  const renderGrandTotalCell = (renderedLeaf: RenderedPivotLeaf<TRow>): ReactNode => (
    <div
      key={renderedLeaf.leaf.id}
      role="gridcell"
      className={['tk-pivot-cell', renderedLeaf.pinned && `tk-pivot-pinned-${renderedLeaf.pinned}`]
        .filter(Boolean)
        .join(' ')}
      data-column-id={renderedLeaf.leaf.id}
      data-pinned={renderedLeaf.pinned || undefined}
      tabIndex={-1}
      style={{ ...getRenderedPosition(renderedLeaf), width: renderedLeaf.size }}
      onFocus={() => setFocusedCell(null)}
      onClick={(event) => {
        event.currentTarget.focus();
        publishCellEvent(
          onCellClick,
          result.grandTotals[renderedLeaf.leaf.id],
          null,
          renderedLeaf.leaf,
          true,
          event,
        );
      }}
      onDoubleClick={(event) =>
        publishCellEvent(
          onCellDoubleClick,
          result.grandTotals[renderedLeaf.leaf.id],
          null,
          renderedLeaf.leaf,
          true,
          event,
        )
      }
      onKeyDown={(event) => {
        if (!onCellClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        publishCellEvent(
          onCellClick,
          result.grandTotals[renderedLeaf.leaf.id],
          null,
          renderedLeaf.leaf,
          true,
          event,
        );
      }}
    >
      {renderCellValue(result.grandTotals[renderedLeaf.leaf.id], null, renderedLeaf.leaf, true)}
    </div>
  );

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const activeCell = document.activeElement as HTMLElement | null;
    const focused =
      state.focusedCell ??
      (activeCell?.dataset.rowId && activeCell.dataset.columnId
        ? {
            rowId: activeCell.dataset.rowId,
            columnId: activeCell.dataset.columnId,
          }
        : null);
    if (!focused || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
      return;
    const rowIndex = rows.findIndex((row) => row.key === focused.rowId);
    const columnIndex = orderedLeaves.findIndex((leaf) => leaf.id === focused.columnId);
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
        orderedLeaves.length - 1,
        columnIndex + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0),
      ),
    );
    const nextRow = rows[nextRowIndex];
    const nextLeaf = orderedLeaves[nextColumnIndex];
    if (!nextRow || !nextLeaf) return;
    event.preventDefault();
    setFocusedCell({ rowId: nextRow.key, columnId: nextLeaf.id });
  };

  useEffect(() => {
    const focused = state.focusedCell;
    if (!focused) return;
    const cell = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>('[data-pivot-cell-id]') ?? [],
    ).find((element) => element.dataset.pivotCellId === `${focused.rowId}:${focused.columnId}`);
    cell?.focus();
  }, [gridRef, state.focusedCell]);

  const rootStyle: PivotCssProperties = {
    '--tk-grid-height': `${height}px`,
    '--tk-grid-width': `${width}px`,
    '--tk-row-height': `${rowHeight}px`,
    '--tk-pivot-footer-height': `${showGrandTotal ? rowHeight : 0}px`,
    '--tk-pivot-header-height': `${headerHeight}px`,
    '--tk-pivot-row-header-width': `${rowHeaderWidth}px`,
    '--tk-pivot-scroll-left': '0px',
  };

  return (
    <div className={['tk-pivot-grid', className].filter(Boolean).join(' ')} style={rootStyle}>
      <Announcer />
      <div className="tk-pivot-layout">
        {pivotControls && (pivotControls.position ?? 'right') === 'left' && (
          <PivotFieldBuilder<TRow>
            config={state.pivot as PivotConfig<TRow>}
            controls={pivotControls}
            data={data}
            onChange={updateBuilderPivot}
          />
        )}
        <div
          ref={gridRef}
          role="treegrid"
          tabIndex={-1}
          className="tk-pivot-viewport"
          aria-label={ariaLabel}
          aria-busy={status === 'loading' ? true : undefined}
          onKeyDown={onGridKeyDown}
        >
          <div className="tk-pivot-header" style={{ height: headerHeight }}>
            {headerRows.map((headerRow, rowIndex) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: hierarchy depth is stable
                key={rowIndex}
                role="row"
                className="tk-pivot-header-row"
                style={{ top: rowIndex * HEADER_ROW_HEIGHT, height: HEADER_ROW_HEIGHT }}
              >
                <div className="tk-pivot-scroll-canvas" style={{ width: contentWidth }}>
                  {getRenderedHeaders(headerRow)
                    .filter(({ pinned }) => pinned === false)
                    .map((renderedHeader) => {
                      const { node, size } = renderedHeader;
                      return (
                        <div
                          key={`${rowIndex}:${node.id}`}
                          role="columnheader"
                          aria-colspan={'colSpan' in node ? node.colSpan : 1}
                          className="tk-pivot-column-header"
                          style={{ ...getRenderedPosition(renderedHeader), width: size }}
                        >
                          {renderSlot(labelOf(node), { node, state }, String(labelOf(node) ?? ''))}
                        </div>
                      );
                    })}
                </div>
                <div className="tk-pivot-fixed-layer" style={{ width: viewport.width }}>
                  {rowIndex === 0 && (
                    <div
                      role="columnheader"
                      className="tk-pivot-corner"
                      data-pinned="left"
                      style={{ left: 0, width: rowHeaderWidth, height: headerHeight }}
                    >
                      Rows
                    </div>
                  )}
                  {getRenderedHeaders(headerRow)
                    .filter(({ pinned }) => pinned !== false)
                    .map((renderedHeader) => {
                      const { node, pinned, size } = renderedHeader;
                      return (
                        <div
                          key={`${rowIndex}:${node.id}`}
                          role="columnheader"
                          aria-colspan={'colSpan' in node ? node.colSpan : 1}
                          className={`tk-pivot-column-header tk-pivot-pinned-${pinned}`}
                          data-pinned={pinned}
                          style={{ ...getRenderedPosition(renderedHeader), width: size }}
                        >
                          {renderSlot(labelOf(node), { node, state }, String(labelOf(node) ?? ''))}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div
            ref={scrollRef}
            className="tk-pivot-body-viewport"
            onScroll={(event) => {
              const element = event.currentTarget;
              gridRef.current?.style.setProperty(
                '--tk-pivot-scroll-left',
                `${element.scrollLeft}px`,
              );
              setViewport({
                top: element.scrollTop,
                left: element.scrollLeft,
                height: element.clientHeight || bodyViewportHeight,
                width: element.clientWidth || width,
              });
            }}
          >
            <div
              role="rowgroup"
              className="tk-pivot-body"
              style={{ height: bodyHeight, width: contentWidth }}
            >
              {rowItems.map(({ index, start }) => {
                const row = rows[index];
                if (!row) return null;
                return (
                  <div
                    key={row.key}
                    role="row"
                    aria-level={row.level}
                    className="tk-pivot-row"
                    style={{ top: start, height: rowHeight, width: contentWidth }}
                    onDoubleClick={(event) => publishRowEvent(onRowDoubleClick, row, event)}
                  >
                    {renderedCenterLeaves.map((renderedLeaf) => renderRowCell(row, renderedLeaf))}
                    <div className="tk-pivot-row-pinned-layer" style={{ width: viewport.width }}>
                      <div
                        role="rowheader"
                        aria-expanded={
                          row.hasChildren ? state.expanded[row.key] === true : undefined
                        }
                        className="tk-pivot-row-header"
                        data-pinned="left"
                        style={{
                          left: 0,
                          width: rowHeaderWidth,
                          paddingLeft: 8 + row.level * 16,
                        }}
                      >
                        {row.hasChildren && (
                          <button
                            type="button"
                            aria-label={`${state.expanded[row.key] ? 'Collapse' : 'Expand'} ${String(row.label)}`}
                            aria-expanded={state.expanded[row.key] === true}
                            onClick={() => toggleExpanded(row.path)}
                          >
                            {state.expanded[row.key] ? '−' : '+'}
                          </button>
                        )}
                        <span>{String(row.label ?? '')}</span>
                        {row.childState === 'loading' && <span role="status">Loading…</span>}
                        {row.childState === 'error' && row.error && (
                          <span role="alert">
                            {row.error.message}
                            <button
                              type="button"
                              aria-label={`Retry ${String(row.label)}`}
                              onClick={() => retryRow(row.path)}
                            >
                              Retry
                            </button>
                          </span>
                        )}
                      </div>
                      {[...renderedLeftLeaves, ...renderedRightLeaves].map((renderedLeaf) =>
                        renderRowCell(row, renderedLeaf),
                      )}
                    </div>
                  </div>
                );
              })}

              {status === 'loading' && rows.length === 0 && (
                <div role="status" className="tk-pivot-state">
                  {loadingContent}
                </div>
              )}
              {status === 'success' && rows.length === 0 && (
                <div role="status" className="tk-pivot-state">
                  {emptyContent}
                </div>
              )}
              {status === 'error' && rows.length === 0 && rootError && (
                <div role="alert" className="tk-pivot-state">
                  {errorContent(rootError)}
                  <button type="button" onClick={retry}>
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
          {showGrandTotal && (
            <div
              role="row"
              className="tk-pivot-footer tk-pivot-grand-total"
              data-total="row"
              style={{ height: rowHeight }}
            >
              <div className="tk-pivot-scroll-canvas" style={{ width: contentWidth }}>
                {renderedCenterLeaves.map(renderGrandTotalCell)}
              </div>
              <div className="tk-pivot-fixed-layer" style={{ width: viewport.width }}>
                <div
                  role="rowheader"
                  className="tk-pivot-row-header"
                  data-pinned="left"
                  style={{ left: 0, width: rowHeaderWidth }}
                >
                  Grand total
                </div>
                {[...renderedLeftLeaves, ...renderedRightLeaves].map(renderGrandTotalCell)}
              </div>
            </div>
          )}
        </div>
        {pivotControls && (pivotControls.position ?? 'right') === 'right' && (
          <PivotFieldBuilder<TRow>
            config={state.pivot as PivotConfig<TRow>}
            controls={pivotControls}
            data={data}
            onChange={updateBuilderPivot}
          />
        )}
      </div>
    </div>
  );
}
