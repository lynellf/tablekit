import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface DataSourceCapabilities {
  sort: 'client' | 'server';
  filter: 'client' | 'server';
  paginate: 'client' | 'server';
  pagination?: 'offset' | 'cursor';
}

export interface SerializedFilter {
  id: string;
  value: unknown;
  filterFn?: string;
}

export interface RowsQuery {
  sorting: SortingState;
  filters: SerializedFilter[];
  pagination?: {
    type: 'offset';
    offset: number;
    limit: number;
  };
  dataVersion?: string | number;
}

export interface RowsResult<TRow> {
  rows: TRow[];
  totalRowCount?: number;
  dataVersion?: string | number;
}

export interface DataSource<TRow> {
  capabilities: DataSourceCapabilities;
  getRows(
    query: RowsQuery,
    context: { signal: AbortSignal },
  ): RowsResult<TRow> | Promise<RowsResult<TRow>>;
  dataVersion?: string | number;
}

export interface DataSourceState<TRow> {
  status: 'idle' | 'loading' | 'success' | 'error';
  rows: TRow[];
  totalRowCount?: number;
  error?: Error;
  refetch(): void;
}

interface UseDataGridSourceOptions<TRow> {
  source: DataSource<TRow> | undefined;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  pagination: PaginationState;
}

export const useDataGridSource = <TRow>({
  source,
  sorting,
  columnFilters,
  pagination,
}: UseDataGridSourceOptions<TRow>): DataSourceState<TRow> => {
  const [state, setState] = useState<Omit<DataSourceState<TRow>, 'refetch'>>({
    status: source ? 'loading' : 'idle',
    rows: [],
  });
  const [nonce, setNonce] = useState(0);
  const requestId = useRef(0);
  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!source) {
      setState({ status: 'idle', rows: [] });
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setState((current) => ({
      status: 'loading',
      rows: current.rows,
      ...(current.totalRowCount === undefined ? {} : { totalRowCount: current.totalRowCount }),
    }));

    const query: RowsQuery = {
      sorting,
      filters: columnFilters.map(({ id: columnId, value }) => ({
        id: columnId,
        value,
      })),
      pagination: {
        type: 'offset',
        offset: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
      },
      ...(source.dataVersion === undefined ? {} : { dataVersion: source.dataVersion }),
    };

    let request: RowsResult<TRow> | Promise<RowsResult<TRow>>;
    try {
      request = source.getRows(query, { signal: controller.signal });
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      setState((current) => ({
        status: 'error',
        rows: current.rows,
        error,
        ...(current.totalRowCount === undefined ? {} : { totalRowCount: current.totalRowCount }),
      }));
      return () => controller.abort();
    }

    Promise.resolve(request).then(
      (result) => {
        if (controller.signal.aborted || requestId.current !== id) return;
        setState({
          status: 'success',
          rows: result.rows,
          ...(result.totalRowCount === undefined ? {} : { totalRowCount: result.totalRowCount }),
        });
      },
      (reason: unknown) => {
        if (controller.signal.aborted || requestId.current !== id) return;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        setState((current) => ({
          status: 'error',
          rows: current.rows,
          error,
          ...(current.totalRowCount === undefined ? {} : { totalRowCount: current.totalRowCount }),
        }));
      },
    );

    return () => controller.abort();
  }, [columnFilters, nonce, pagination, sorting, source]);

  return { ...state, refetch };
};
