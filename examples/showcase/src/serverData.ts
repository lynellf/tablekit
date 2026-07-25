import type { RowsQuery, RowsResult } from '@lynellf/tablekit-core/dataSource';
import type { SalesRow } from './data';

export const waitForDelay = (milliseconds: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);

    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(signal.reason ?? new DOMException('Request aborted', 'AbortError'));
      },
      { once: true },
    );
  });

const valueForColumn = (row: SalesRow, columnId: string): unknown =>
  row[columnId as keyof SalesRow];

export function querySalesRows(rows: SalesRow[], query: RowsQuery): RowsResult<SalesRow> {
  let result = rows;

  for (const filter of query.filters) {
    const expected = String(filter.value).trim().toLowerCase();
    if (!expected) continue;
    result = result.filter((row) =>
      String(valueForColumn(row, filter.id)).toLowerCase().includes(expected),
    );
  }

  for (const sort of [...query.sorting].reverse()) {
    result = [...result].sort((left, right) => {
      const leftValue = valueForColumn(left, sort.id);
      const rightValue = valueForColumn(right, sort.id);
      const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
      });
      return sort.desc ? -comparison : comparison;
    });
  }

  const totalRowCount = result.length;
  if (query.pagination?.type === 'offset') {
    result = result.slice(
      query.pagination.offset,
      query.pagination.offset + query.pagination.limit,
    );
  }

  return { rows: result, totalRowCount };
}
