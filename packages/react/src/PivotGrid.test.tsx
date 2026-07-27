import type {
  AggregationEngine,
  PivotConfig,
  PivotResult,
  PivotRowNode,
} from '@lynellf/tablekit-pivot';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PivotGrid } from './PivotGrid';
import type { PivotGridHandle } from './PivotGrid';

interface Sale {
  id: string;
  region: string;
  quarter: string;
  year: number;
  sales: number;
}

const sales: Sale[] = [
  { id: '1', region: 'West', quarter: 'Q1', year: 2024, sales: 100 },
  { id: '2', region: 'West', quarter: 'Q2', year: 2024, sales: 200 },
  { id: '3', region: 'East', quarter: 'Q1', year: 2024, sales: 300 },
  { id: '4', region: 'East', quarter: 'Q2', year: 2023, sales: 400 },
];

const config: PivotConfig<Sale> = {
  rows: ['region', 'quarter'],
  columns: ['year'],
  measures: [
    { id: 'sales_sum', field: 'sales', aggregator: 'sum', label: 'Sales' },
    { id: 'sales_avg', field: 'sales', aggregator: 'avg', label: 'Average' },
  ],
  filters: [{ field: 'year', op: 'equals', value: 2024 }],
};

afterEach(cleanup);

const createServerResult = (): PivotResult<Sale> => ({
  columnRoot: {
    id: 'root',
    path: [],
    label: undefined,
    colSpan: 1,
    leaves: [
      {
        id: '[]::sales_sum',
        path: [],
        measureId: 'sales_sum',
        isTotal: false,
        size: 100,
        header: 'Sales',
      },
    ],
  },
  leafColumns: [
    {
      id: '[]::sales_sum',
      path: [],
      measureId: 'sales_sum',
      isTotal: false,
      size: 100,
      header: 'Sales',
    },
  ],
  rowRoot: {
    key: '[]',
    path: [],
    level: 0,
    label: undefined,
    hasChildren: true,
    childState: 'loaded',
    values: {},
    rowTotals: {},
    children: [
      {
        key: '["West"]',
        path: ['West'],
        level: 1,
        label: 'West',
        hasChildren: true,
        childState: 'notLoaded',
        values: { '[]::sales_sum': 300 },
        rowTotals: { sales_sum: 300 },
      },
      {
        key: '["East"]',
        path: ['East'],
        level: 1,
        label: 'East',
        hasChildren: false,
        childState: 'loaded',
        values: { '[]::sales_sum': 700 },
        rowTotals: { sales_sum: 700 },
      },
    ],
  },
  grandTotals: { '[]::sales_sum': 1_000 },
});

describe('PivotGrid', () => {
  it('recomputes when the pivot prop changes', async () => {
    const { rerender } = render(<PivotGrid data={sales} pivot={{ ...config, filters: [] }} />);

    expect(screen.getByText('West')).toBeTruthy();
    expect(screen.getByText('East')).toBeTruthy();

    rerender(
      <PivotGrid
        data={sales}
        pivot={{
          ...config,
          filters: [{ field: 'region', op: 'equals', value: 'East' }],
        }}
      />,
    );

    await waitFor(() => expect(screen.queryByText('West')).toBeNull());
    expect(screen.getByText('East')).toBeTruthy();
  });

  it('publishes cell and row interaction events with pivot coordinates and totals context', () => {
    const onCellClick = vi.fn();
    const onCellDoubleClick = vi.fn();
    const onRowDoubleClick = vi.fn();

    render(
      <PivotGrid
        data={sales}
        pivot={config}
        onCellClick={onCellClick}
        onCellDoubleClick={onCellDoubleClick}
        onRowDoubleClick={onRowDoubleClick}
      />,
    );

    const westRow = screen.getByRole('row', { name: /West/ });
    const westCell = within(westRow).getAllByRole('gridcell')[0]!;
    fireEvent.click(westCell);
    expect(onCellClick).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 300,
        row: expect.objectContaining({ key: '["West"]', path: ['West'] }),
        rowKey: '["West"]',
        leaf: expect.objectContaining({ id: '[2024]::sales_sum' }),
        columnId: '[2024]::sales_sum',
        isGrandTotal: false,
        nativeEvent: expect.any(Object),
      }),
    );
    fireEvent.keyDown(westCell, { key: 'Enter' });
    expect(onCellClick).toHaveBeenCalledTimes(2);

    fireEvent.doubleClick(westCell);
    expect(onCellDoubleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 300,
        rowKey: '["West"]',
        columnId: '[2024]::sales_sum',
        isGrandTotal: false,
      }),
    );
    expect(onRowDoubleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        rowKey: '["West"]',
        row: expect.objectContaining({ key: '["West"]' }),
        nativeEvent: expect.any(Object),
      }),
    );

    const grandTotalRow = screen.getByRole('row', { name: /Grand total/ });
    const grandTotalCell = within(grandTotalRow).getAllByRole('gridcell')[0]!;
    fireEvent.click(grandTotalCell);
    expect(onCellClick).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: 600,
        row: null,
        rowKey: null,
        columnId: '[2024]::sales_sum',
        isGrandTotal: true,
      }),
    );
    fireEvent.doubleClick(grandTotalCell);
    expect(onCellDoubleClick).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: 600,
        row: null,
        rowKey: null,
        columnId: '[2024]::sales_sum',
        isGrandTotal: true,
      }),
    );
  });

  it('exposes adapter commands for row paths, expansion, collapse, and first-column sorting', async () => {
    const ref = createRef<PivotGridHandle>();
    const unfilteredConfig: PivotConfig<Sale> = { ...config, filters: [] };
    render(<PivotGrid ref={ref} data={sales} pivot={unfilteredConfig} />);

    expect(ref.current?.getAllRowPathKeys()).toEqual([
      '["West"]',
      '["West","Q1"]',
      '["West","Q2"]',
      '["East"]',
      '["East","Q1"]',
      '["East","Q2"]',
    ]);

    act(() => ref.current?.expandAll());
    expect(await screen.findAllByRole('row', { name: /Q1/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Collapse West' })).toBeTruthy();

    act(() => ref.current?.collapseAll());
    await waitFor(() => expect(screen.queryByRole('row', { name: /Q1/ })).toBeNull());

    act(() => ref.current?.sortFirstColumn());
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('.tk-pivot-row-header > span')).map(
          (node) => node.textContent,
        ),
      ).toEqual(['East', 'West']),
    );

    act(() => ref.current?.sortFirstColumn());
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('.tk-pivot-row-header > span')).map(
          (node) => node.textContent,
        ),
      ).toEqual(['West', 'East']),
    );
  });

  it('routes imperative expansion and sorting through controlled callbacks', () => {
    const ref = createRef<PivotGridHandle>();
    const onExpandedChange = vi.fn();
    const onPivotSortingChange = vi.fn();
    render(
      <PivotGrid
        ref={ref}
        data={sales}
        pivot={{ ...config, filters: [] }}
        state={{
          expanded: {},
          pivotSorting: [{ level: 1, by: 'label', desc: true }],
        }}
        onExpandedChange={onExpandedChange}
        onPivotSortingChange={onPivotSortingChange}
      />,
    );

    act(() => ref.current?.expandAll());
    expect(onExpandedChange).toHaveBeenLastCalledWith({
      '["West"]': true,
      '["West","Q1"]': true,
      '["West","Q2"]': true,
      '["East"]': true,
      '["East","Q1"]': true,
      '["East","Q2"]': true,
    });

    act(() => ref.current?.collapseAll());
    expect(onExpandedChange).toHaveBeenLastCalledWith({});

    act(() => ref.current?.sortFirstColumn());
    expect(onPivotSortingChange).toHaveBeenLastCalledWith([
      { level: 0, by: 'label', desc: false },
      { level: 1, by: 'label', desc: true },
    ]);
  });

  it('renders filtered aggregation, generated headers, totals, and expansion ARIA', async () => {
    render(<PivotGrid data={sales} pivot={config} height={260} />);

    expect(screen.getByRole('treegrid')).toBeTruthy();
    expect(
      screen.getAllByRole('columnheader').some((header) => header.textContent === '2024'),
    ).toBe(true);
    expect(screen.getByRole('row', { name: /Grand total/ }).textContent).toContain('600');

    const westRow = screen.getByRole('row', { name: /West/ });
    expect(westRow.textContent).toContain('300');
    const toggle = within(westRow).getByRole('button', { name: 'Expand West' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    expect(await screen.findByRole('row', { name: /Q1/ })).toBeTruthy();
    expect(
      within(screen.getByRole('row', { name: /West/ }))
        .getByRole('button')
        .getAttribute('aria-expanded'),
    ).toBe('true');

    fireEvent.click(within(screen.getByRole('row', { name: /West/ })).getByRole('button'));
    await waitFor(() => expect(screen.queryByRole('row', { name: /Q1/ })).toBeNull());
    expect(
      within(screen.getByRole('row', { name: /West/ }))
        .getByRole('button')
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('keeps the header and grand-total footer outside the vertically scrolling body', () => {
    render(<PivotGrid data={sales} pivot={config} height={220} />);

    const treegrid = screen.getByRole('treegrid');
    const bodyViewport = treegrid.querySelector('.tk-pivot-body-viewport');
    const header = treegrid.querySelector('.tk-pivot-header');
    const footer = treegrid.querySelector('.tk-pivot-footer');

    expect(bodyViewport).toBeTruthy();
    expect(header).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(bodyViewport?.contains(header)).toBe(false);
    expect(bodyViewport?.contains(footer)).toBe(false);
    expect(footer?.getAttribute('data-total')).toBe('row');
  });

  it('isolates a server child error and retries only that path', async () => {
    let attempt = 0;
    const child: PivotRowNode<Sale> = {
      key: '["West","Q1"]',
      path: ['West', 'Q1'],
      level: 2,
      label: 'Q1',
      hasChildren: false,
      childState: 'loaded',
      values: { '[]::sales_sum': 300 },
      rowTotals: { sales_sum: 300 },
    };
    const engine: AggregationEngine<Sale> = {
      compute: vi.fn(() => createServerResult()),
      computeChildren: vi.fn(async () => {
        attempt += 1;
        if (attempt === 1) throw new Error('West failed');
        return [child];
      }),
    };
    render(<PivotGrid data={sales} pivot={config} engine={engine} />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand West' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'West failedRetry');
    expect(screen.getByRole('row', { name: /East/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Retry West' }));
    expect(await screen.findByRole('row', { name: /Q1/ })).toBeTruthy();
    expect(engine.computeChildren).toHaveBeenCalledTimes(2);
    expect(engine.computeChildren).toHaveBeenLastCalledWith(
      ['West'],
      expect.any(Object),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('renders a root error in the treegrid layout and retries the root query', async () => {
    let attempt = 0;
    const engine: AggregationEngine<Sale> = {
      compute: vi.fn(async () => {
        attempt += 1;
        if (attempt === 1) throw new Error('Root failed');
        return createServerResult();
      }),
    };

    render(<PivotGrid data={sales} pivot={config} engine={engine} />);

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Unable to aggregate rows: Root failedRetry',
    );
    expect(screen.getByRole('treegrid')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('row', { name: /West/ })).toBeTruthy();
    expect(engine.compute).toHaveBeenCalledTimes(2);
  });

  it('bounds row and column DOM by the viewport and overscan', async () => {
    const wideData = Array.from({ length: 60 }, (_, index) => ({
      id: String(index),
      region: `Region ${String(index).padStart(2, '0')}`,
      quarter: 'Q1',
      year: 2000 + index,
      sales: index,
    }));
    render(
      <PivotGrid
        data={wideData}
        pivot={{
          rows: ['region'],
          columns: ['year'],
          measures: [{ id: 'sales', field: 'sales', aggregator: 'sum' }],
          totals: { grandTotalColumn: false },
        }}
        height={120}
        width={260}
        rowHeight={20}
        rowHeaderWidth={120}
        overscanRows={1}
        overscanColumns={1}
      />,
    );

    expect(document.querySelectorAll('.tk-pivot-row').length).toBeLessThanOrEqual(9);
    expect(screen.getAllByRole('columnheader').length).toBeLessThanOrEqual(9);

    const firstCell = document.querySelector<HTMLElement>('[data-pivot-cell-id]');
    firstCell?.focus();
    await waitFor(() => expect(firstCell?.getAttribute('tabindex')).toBe('0'));

    const treegrid = screen.getByRole('treegrid');
    Object.defineProperty(treegrid, 'scrollTop', { configurable: true, value: 500 });
    const bodyViewport =
      treegrid.querySelector<HTMLElement>('.tk-pivot-body-viewport') ??
      (() => {
        throw new Error('Missing pivot body viewport');
      })();
    Object.defineProperty(bodyViewport, 'scrollLeft', { configurable: true, value: 2_000 });
    fireEvent.scroll(bodyViewport);
    await waitFor(() =>
      expect(document.querySelectorAll('.tk-pivot-row').length).toBeLessThanOrEqual(12),
    );
    expect(firstCell?.isConnected).toBe(true);
    expect(screen.getAllByRole('columnheader').length).toBeLessThanOrEqual(9);
  });

  it('freezes generated column groups atomically around a center-only virtual window', async () => {
    const wideData = Array.from({ length: 30 }, (_, index) => ({
      id: String(index),
      region: `Region ${String(index).padStart(2, '0')}`,
      quarter: 'Q1',
      year: 2000 + index,
      sales: index,
    }));
    render(
      <PivotGrid
        data={wideData}
        pivot={{
          rows: ['region'],
          columns: ['year'],
          measures: [
            { id: 'sales', field: 'sales', aggregator: 'sum', label: 'Sales' },
            { id: 'average', field: 'sales', aggregator: 'avg', label: 'Average' },
          ],
        }}
        initialState={{
          columnPinning: {
            left: ['[2005]::sales'],
            right: ['[2001]::sales'],
          },
        }}
        height={140}
        width={900}
        rowHeight={20}
        rowHeaderWidth={120}
        overscanRows={1}
        overscanColumns={1}
      />,
    );

    const treegrid = screen.getByRole('treegrid');
    const rowHeader = document.querySelector<HTMLElement>('.tk-pivot-row-header');
    const leftGroupHeader = screen.getByRole('columnheader', { name: '2005' });
    const rightGroupHeader = screen.getByRole('columnheader', { name: '2001' });
    const promotedLeftCell = document.querySelector<HTMLElement>(
      '[data-pivot-cell-id][data-column-id="[2005]::average"]',
    );
    const promotedRightCell = document.querySelector<HTMLElement>(
      '[data-pivot-cell-id][data-column-id="[2001]::average"]',
    );

    expect(rowHeader?.style.left).toBe('0px');
    expect(rowHeader?.closest('.tk-pivot-row-pinned-layer')).toBeTruthy();
    expect(leftGroupHeader.dataset.pinned).toBe('left');
    expect(leftGroupHeader.style.left).toBe('120px');
    expect(leftGroupHeader.closest('.tk-pivot-fixed-layer')).toBeTruthy();
    expect(rightGroupHeader.dataset.pinned).toBe('right');
    expect(rightGroupHeader.style.right).toBe('200px');
    expect(promotedLeftCell?.dataset.pinned).toBe('left');
    expect(promotedRightCell?.dataset.pinned).toBe('right');

    const firstLeftCell = document.querySelector<HTMLElement>(
      '[data-pivot-cell-id][data-column-id="[2005]::sales"]',
    );
    firstLeftCell?.focus();
    fireEvent.keyDown(treegrid, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement?.dataset.columnId).toBe('[2005]::average'));

    const bodyViewport =
      treegrid.querySelector<HTMLElement>('.tk-pivot-body-viewport') ??
      (() => {
        throw new Error('Missing pivot body viewport');
      })();
    Object.defineProperty(bodyViewport, 'scrollLeft', { configurable: true, value: 1_500 });
    fireEvent.scroll(bodyViewport);

    expect(rowHeader?.style.left).toBe('0px');
    expect(leftGroupHeader.style.left).toBe('120px');
    expect(rightGroupHeader.style.right).toBe('200px');
    expect(screen.getAllByRole('columnheader', { name: '2005' })).toHaveLength(1);
    expect(screen.getAllByRole('columnheader', { name: '2001' })).toHaveLength(1);
    expect(
      Array.from(document.querySelectorAll<HTMLElement>('[data-pivot-cell-id]')).filter(
        (cell) => cell.dataset.pivotCellId === '["Region 00"]:[2005]::average',
      ),
    ).toHaveLength(1);
    expect(screen.getAllByRole('columnheader').length).toBeLessThanOrEqual(20);
  });

  it('rejects opposite pinned sides within one generated column group', () => {
    expect(() =>
      render(
        <PivotGrid
          data={sales}
          pivot={config}
          initialState={{
            columnPinning: {
              left: ['[2024]::sales_sum'],
              right: ['[2024]::sales_avg'],
            },
          }}
        />,
      ),
    ).toThrowError('PivotGrid column group [2024] cannot be pinned to both left and right.');
  });

  it('keeps the pivot builder opt-in and updates hierarchies, filters, and aggregation', async () => {
    const { unmount } = render(<PivotGrid data={sales} pivot={config} />);
    expect(screen.queryByRole('complementary', { name: 'Pivot controls' })).toBeNull();
    unmount();

    render(
      <PivotGrid
        data={sales}
        pivot={config}
        pivotControls={{
          position: 'right',
          fields: [
            { field: 'region', label: 'Region' },
            { field: 'quarter', label: 'Quarter' },
            { field: 'year', label: 'Year' },
            { field: 'sales', label: 'Sales' },
          ],
        }}
      />,
    );

    const controls = screen.getByRole('complementary', { name: 'Pivot controls' });
    expect(controls.getAttribute('data-position')).toBe('right');

    fireEvent.change(screen.getByRole('combobox', { name: 'Aggregation for sales_sum' }), {
      target: { value: 'max' },
    });
    await waitFor(() =>
      expect(screen.getByRole('row', { name: /Grand total/ }).textContent).toContain('300'),
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Filter field' }), {
      target: { value: 'region' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter value' }), {
      target: { value: 'East' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
    await waitFor(() => expect(screen.queryByRole('row', { name: /West/ })).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'Remove Quarter from rows' }));
    expect(screen.queryByText('Quarter', { selector: '.tk-pivot-control-item-label' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Rows field' }), {
      target: { value: 'quarter' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add row field' }));
    expect(screen.getByText('Quarter', { selector: '.tk-pivot-control-item-label' })).toBeTruthy();
  });

  it('moves pivot dimensions between hierarchy zones with native drag and drop', () => {
    render(<PivotGrid data={sales} pivot={config} pivotControls />);

    const transfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: vi.fn(),
      getData: vi.fn(() => JSON.stringify({ source: 'rows', field: 'quarter', index: 1 })),
    };
    fireEvent.dragStart(screen.getByRole('button', { name: 'Reorder Quarter in rows' }), {
      dataTransfer: transfer,
    });
    fireEvent.dragOver(screen.getByRole('group', { name: 'Column hierarchy' }), {
      dataTransfer: transfer,
    });
    fireEvent.drop(screen.getByRole('group', { name: 'Column hierarchy' }), {
      dataTransfer: transfer,
    });

    expect(
      within(screen.getByRole('group', { name: 'Column hierarchy' })).getByText('Quarter', {
        selector: '.tk-pivot-control-item-label',
      }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: 'Row hierarchy' })).queryByText('Quarter', {
        selector: '.tk-pivot-control-item-label',
      }),
    ).toBeNull();

    const valueTransfer = {
      ...transfer,
      getData: vi.fn(() => JSON.stringify({ source: 'available', field: 'sales' })),
    };
    fireEvent.dragStart(screen.getByRole('button', { name: 'Sales' }), {
      dataTransfer: valueTransfer,
    });
    fireEvent.drop(screen.getByRole('group', { name: 'Values' }), {
      dataTransfer: valueTransfer,
    });
    expect(screen.getByRole('combobox', { name: 'Aggregation for sales_sum_2' })).toBeTruthy();
  });

  it('dispatches pivot builder changes through the controlled pivot slice', () => {
    function ControlledPivot() {
      const [pivot, setPivot] = useState(config);
      return (
        <PivotGrid
          data={sales}
          pivot={config}
          state={{ pivot }}
          onPivotChange={(updater) =>
            setPivot((current) => (typeof updater === 'function' ? updater(current) : updater))
          }
          pivotControls={{
            fields: [
              { field: 'region', label: 'Region' },
              { field: 'quarter', label: 'Quarter' },
              { field: 'year', label: 'Year' },
              { field: 'sales', label: 'Sales' },
            ],
          }}
        />
      );
    }

    render(<ControlledPivot />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Quarter from rows' }));
    expect(
      within(screen.getByRole('group', { name: 'Row hierarchy' })).queryByText('Quarter', {
        selector: '.tk-pivot-control-item-label',
      }),
    ).toBeNull();
  });
});
