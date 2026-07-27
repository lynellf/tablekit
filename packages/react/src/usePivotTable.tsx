import type {
  AggregationEngine,
  FieldValue,
  PivotColumnNode,
  PivotConfig,
  PivotExpansionState,
  PivotLeafColumn,
  PivotResult,
  PivotRowNode,
  PivotSortingState,
} from '@lynellf/tablekit-pivot';
import { createMainThreadEngine, rowPathKeyOf } from '@lynellf/tablekit-pivot/engine';
import { buildPivotQuery } from '@lynellf/tablekit-pivot/serialize';
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table';
import {
  type ReactElement,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PivotGridCellPosition, PivotGridProps, PivotGridState } from './PivotGrid.types';
import { ReactAnnouncer } from './ReactAnnouncer';
import { createAnnouncerChannel } from './createAnnouncerChannel';
import { useTabBehavior } from './useTabBehavior';

type HeaderEntry = { node: PivotColumnNode | PivotLeafColumn; colSpan: number };
export type PivotGridStatus = 'loading' | 'success' | 'error';
type Status = PivotGridStatus;

const emptyResult = <TRow,>(): PivotResult<TRow> => ({
  columnRoot: { id: 'root', path: [], label: undefined, colSpan: 0, children: [] },
  leafColumns: [],
  rowRoot: {
    key: '[]',
    path: [],
    level: 0,
    label: undefined,
    hasChildren: false,
    childState: 'loaded',
    children: [],
    values: {},
    rowTotals: {},
  },
  grandTotals: {},
});

const isPromiseLike = <T,>(value: T | Promise<T>): value is Promise<T> =>
  value !== null &&
  (typeof value === 'object' || typeof value === 'function') &&
  typeof (value as { then?: unknown }).then === 'function';

const toError = (cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause)));

const updateRowNode = <TRow,>(
  node: PivotRowNode<TRow>,
  key: string,
  update: (current: PivotRowNode<TRow>) => PivotRowNode<TRow>,
): PivotRowNode<TRow> => {
  if (node.key === key) return update(node);
  if (!node.children) return node;
  let changed = false;
  const children = node.children.map((child) => {
    const next = updateRowNode(child, key, update);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...node, children } : node;
};

const getHeaderRows = (root: PivotColumnNode): HeaderEntry[][] => {
  const rows: HeaderEntry[][] = [];
  const visit = (node: PivotColumnNode | PivotLeafColumn, depth: number) => {
    if (!rows[depth]) rows[depth] = [];
    rows[depth]?.push({ node, colSpan: 'colSpan' in node ? node.colSpan : 1 });
    if ('children' in node) {
      for (const child of node.children ?? []) visit(child, depth + 1);
    }
    if ('leaves' in node) {
      for (const leaf of node.leaves ?? []) visit(leaf, depth + 1);
    }
  };
  for (const child of root.children ?? []) visit(child, 0);
  for (const leaf of root.leaves ?? []) visit(leaf, 0);
  return rows;
};

const resolveConfig = <TRow,>(
  value: PivotGridProps<TRow>['pivot'],
  data: TRow[],
): PivotConfig<TRow> => (typeof value === 'function' ? value({ data }) : value);

export interface UsePivotTableResult<TRow> {
  state: PivotGridState<TRow>;
  result: PivotResult<TRow>;
  rows: Array<PivotRowNode<TRow>>;
  leafColumns: Array<PivotLeafColumn<TRow>>;
  headerRows: HeaderEntry[][];
  status: Status;
  error: Error | undefined;
  Announcer: () => ReactElement;
  gridRef: RefObject<HTMLDivElement>;
  setPivot(next: PivotConfig<TRow>): void;
  setExpanded(next: PivotExpansionState): void;
  toggleExpanded(path: FieldValue[]): void;
  setPivotSorting(next: PivotSortingState): void;
  setFocusedCell(next: PivotGridCellPosition | null): void;
  retry(): void;
  retryRow(path: FieldValue[]): void;
}

export const usePivotTable = <TRow,>(
  props: PivotGridProps<TRow>,
  pivotOverride: PivotConfig<TRow> | null,
): UsePivotTableResult<TRow> => {
  const initialConfig = pivotOverride ?? resolveConfig(props.pivot, props.data);
  const [internalPivot, setInternalPivot] = useState<PivotConfig<TRow>>(
    (props.initialState?.pivot as PivotConfig<TRow> | undefined) ?? initialConfig,
  );
  const [internalExpanded, setInternalExpanded] = useState<PivotExpansionState>(
    props.initialState?.expanded ?? {},
  );
  const [internalSorting, setInternalSorting] = useState<PivotSortingState>(
    props.initialState?.pivotSorting ?? [],
  );
  const [internalPinning] = useState(props.initialState?.columnPinning ?? { left: [], right: [] });
  const [internalFocusedCell, setInternalFocusedCell] = useState<PivotGridCellPosition | null>(
    props.initialState?.focusedCell ?? null,
  );
  useEffect(() => {
    if (props.state?.pivot === undefined && pivotOverride === null) {
      setInternalPivot(resolveConfig(props.pivot, props.data));
    }
  }, [pivotOverride, props.data, props.pivot, props.state?.pivot]);

  const pivot =
    (props.state?.pivot as PivotConfig<TRow> | undefined) ?? pivotOverride ?? internalPivot;
  const expanded = props.state?.expanded ?? internalExpanded;
  const pivotSorting = props.state?.pivotSorting ?? internalSorting;
  const columnPinning = props.state?.columnPinning ?? internalPinning;
  const focusedCell =
    props.state?.focusedCell === undefined ? internalFocusedCell : props.state.focusedCell;
  const state = useMemo<PivotGridState<TRow>>(
    () => ({
      pivot,
      expanded,
      pivotSorting,
      columnPinning,
      focusedCell,
    }),
    [columnPinning, expanded, focusedCell, pivot, pivotSorting],
  );
  const defaultEngine = useRef<AggregationEngine<TRow> | null>(null);
  if (!defaultEngine.current) defaultEngine.current = createMainThreadEngine<TRow>();
  const engine = props.engine ?? defaultEngine.current;
  const dataVersion = props.dataVersion?.getVersion?.(props.data) ?? props.dataVersion?.version;
  const query = useMemo(
    () => buildPivotQuery(props.data, pivot, expanded, pivotSorting, pivot.totals ?? {}),
    [dataVersion, expanded, pivot, pivotSorting, props.data],
  );
  const [result, setResult] = useState<PivotResult<TRow>>(emptyResult);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<Error | undefined>();
  const request = useRef(0);
  const suppressCompute = useRef(false);

  const runCompute = useCallback(() => {
    const id = ++request.current;
    const controller = new AbortController();
    let computation: PivotResult<TRow> | Promise<PivotResult<TRow>>;
    try {
      computation = engine.compute(query, { signal: controller.signal });
    } catch (cause) {
      setStatus('error');
      setError(toError(cause));
      return () => controller.abort();
    }
    if (isPromiseLike(computation)) {
      setStatus('loading');
      setError(undefined);
      void Promise.resolve(computation).then(
        (next) => {
          if (controller.signal.aborted || request.current !== id) return;
          setResult(next);
          setStatus('success');
        },
        (cause: unknown) => {
          if (controller.signal.aborted || request.current !== id) return;
          setStatus('error');
          setError(toError(cause));
        },
      );
    } else {
      setResult(computation);
      setStatus('success');
      setError(undefined);
    }
    return () => controller.abort();
  }, [engine, query]);

  useEffect(() => {
    if (suppressCompute.current) {
      suppressCompute.current = false;
      return;
    }
    return runCompute();
  }, [runCompute]);

  useEffect(
    () => () => {
      request.current += 1;
      defaultEngine.current?.dispose?.();
    },
    [],
  );

  useEffect(() => {
    props.onStateChange?.(state);
  }, [props.onStateChange, state]);

  const publishExpanded = (next: PivotExpansionState) => {
    if (props.state?.expanded === undefined) setInternalExpanded(next);
    props.onExpandedChange?.(next);
  };
  const publishPivot = (next: PivotConfig<TRow>) => {
    if (props.state?.pivot === undefined) setInternalPivot(next);
    props.onPivotChange?.(next);
  };
  const publishSorting = (next: PivotSortingState) => {
    if (props.state?.pivotSorting === undefined) setInternalSorting(next);
    props.onPivotSortingChange?.(next);
  };
  const publishFocus = (next: PivotGridCellPosition | null) => {
    if (props.state?.focusedCell === undefined) setInternalFocusedCell(next);
    props.onFocusedCellChange?.(next);
  };

  const loadChildren = (path: FieldValue[]) => {
    if (!engine.computeChildren) {
      runCompute();
      return;
    }
    const id = ++request.current;
    const controller = new AbortController();
    const key = rowPathKeyOf(path);
    let computation: PivotRowNode<TRow>[] | Promise<PivotRowNode<TRow>[]>;
    try {
      computation = engine.computeChildren(path, query, { signal: controller.signal });
    } catch (cause) {
      const nextError = toError(cause);
      setResult((current) => ({
        ...current,
        rowRoot: updateRowNode(current.rowRoot, key, (row) => ({
          ...row,
          childState: 'error',
          error: nextError,
        })),
      }));
      setStatus('error');
      setError(nextError);
      return;
    }
    const complete = (children: PivotRowNode<TRow>[]) => {
      if (controller.signal.aborted || request.current !== id) return;
      setResult((current) => ({
        ...current,
        rowRoot: updateRowNode(current.rowRoot, key, (row) => {
          const { error: _error, ...withoutError } = row;
          return { ...withoutError, children, childState: 'loaded' };
        }),
      }));
      setStatus('success');
      setError(undefined);
    };
    if (isPromiseLike(computation)) {
      setResult((current) => ({
        ...current,
        rowRoot: updateRowNode(current.rowRoot, key, (row) => ({
          ...row,
          childState: 'loading',
        })),
      }));
      setStatus('loading');
      void Promise.resolve(computation).then(complete, (cause: unknown) => {
        if (controller.signal.aborted || request.current !== id) return;
        const nextError = toError(cause);
        setResult((current) => ({
          ...current,
          rowRoot: updateRowNode(current.rowRoot, key, (row) => ({
            ...row,
            childState: 'error',
            error: nextError,
          })),
        }));
        setStatus('error');
        setError(nextError);
      });
    } else {
      complete(computation);
    }
  };

  const toggleExpanded = (path: FieldValue[]) => {
    const key = rowPathKeyOf(path);
    const opening = expanded[key] !== true;
    suppressCompute.current = true;
    publishExpanded({ ...expanded, [key]: opening });
    if (opening) loadChildren(path);
  };

  const rowTable = useReactTable({
    data: result.rowRoot.children ?? [],
    columns: [],
    getRowId: (row) => row.key,
    getSubRows: (row) => row.children,
    state: { expanded },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });
  const leftPinned = columnPinning.left ?? [];
  const rightPinned = columnPinning.right ?? [];
  const leafColumns = result.leafColumns.map((leaf) => {
    const pinned = leftPinned.includes(leaf.id)
      ? ('left' as const)
      : rightPinned.includes(leaf.id) || leaf.isTotal
        ? ('right' as const)
        : leaf.pinned;
    return pinned ? { ...leaf, pinned } : leaf;
  });

  const channel = useRef(createAnnouncerChannel(props.announcer ?? { announce: () => undefined }));
  const gridRef = useRef<HTMLDivElement>(null);
  useTabBehavior({ gridRef, tabBehavior: props.tabBehavior ?? 'exit' });

  return {
    state,
    result,
    rows: rowTable.getRowModel().rows.map((row) => row.original),
    leafColumns,
    headerRows: getHeaderRows(result.columnRoot),
    status,
    error,
    Announcer: () => <ReactAnnouncer channel={channel.current} />,
    gridRef,
    setPivot: publishPivot,
    setExpanded: publishExpanded,
    toggleExpanded,
    setPivotSorting: publishSorting,
    setFocusedCell: publishFocus,
    retry: runCompute,
    retryRow: loadChildren,
  };
};
