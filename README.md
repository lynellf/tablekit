# TableKit

TableKit provides batteries-included React components for ordinary data tables
and multidimensional pivot tables:

- `DataGrid` renders client or server-backed rows with sorting, filtering,
  pagination, selection, pinning, resizing, column controls, and virtualization.
- `PivotGrid` groups and aggregates raw rows into an expandable treegrid with
  generated column hierarchies, totals, filters, formatting, a field builder,
  and main-thread, Web Worker, or server execution.

Both components are designed to be dropped into a React application without
building a table renderer around a headless state engine.

## Packages

| Package | Use it when you need |
| --- | --- |
| `@lynellf/tablekit-react` | The rendered React `DataGrid` and `PivotGrid` components |
| `@lynellf/tablekit-pivot` | Framework-free pivot configuration, aggregation, serialization, and execution engines |

Most React applications only need to install `@lynellf/tablekit-react`; it
includes the pivot package and its TanStack dependencies.

## Install

```bash
npm install @lynellf/tablekit-react
```

Import the stylesheet once near your application root:

```tsx
import '@lynellf/tablekit-react/styles.css';
```

TableKit requires React 18 or newer. Its packages declare Node 20 or newer for
build and server environments.

## DataGrid

### Client-side quick start

`DataGrid` accepts TanStack Table `ColumnDef` objects. Sorting and filtering are
opt-in per column; pagination and row/column virtualization are built into the
rendered component.

```tsx
import { DataGrid, type ColumnDef } from '@lynellf/tablekit-react';
import '@lynellf/tablekit-react/styles.css';

interface Order {
  id: string;
  customer: string;
  status: 'Open' | 'Shipped';
  total: number;
}

const columns: Array<ColumnDef<Order>> = [
  {
    accessorKey: 'customer',
    header: 'Customer',
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'includesString',
    size: 220,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'includesString',
    size: 130,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    enableSorting: true,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(getValue<number>()),
    size: 140,
  },
];

export function OrdersGrid({ orders }: { orders: Order[] }) {
  return (
    <DataGrid
      rows={orders}
      columns={columns}
      getRowId={(order) => order.id}
      initialState={{
        columnPinning: { left: ['customer'], right: ['total'] },
        pagination: { pageIndex: 0, pageSize: 25 },
      }}
      rowSelectionMode="multiple"
      height={520}
      aria-label="Orders"
    />
  );
}
```

Use a stable `getRowId` whenever rows can be sorted, filtered, paginated, or
replaced. If it is omitted, the grid uses each row's current array index.

### Column definitions

The `columns` prop uses `ColumnDef<TRow>` from `@tanstack/react-table`, re-exported
by `@lynellf/tablekit-react`.

| Column option | Effect in `DataGrid` |
| --- | --- |
| `accessorKey` / `accessorFn` | Reads the cell value |
| `id` | Supplies a stable column identity; required when it cannot be derived |
| `header` | Renders the column heading |
| `cell` | Renders a custom cell through TanStack's `flexRender` |
| `enableSorting` / `sortingFn` | Enables the built-in sort control and chooses its comparison |
| `enableColumnFilter` / `filterFn` | Enables the built-in filter input and chooses its filtering logic |
| `size`, `minSize`, `maxSize` | Defines initial and constrained column widths |

See the
[`salesColumns` example](examples/showcase/src/data.ts) for string, numeric,
sortable, filterable, and sized columns.

### Enhanced column controls

Pass `columnControls` to opt into column menus and reordering:

```tsx
<DataGrid
  rows={orders}
  columns={columns}
  getRowId={(order) => order.id}
  columnControls
  enableColumnResize
/>
```

`columnControls={true}` enables every control. Pass an object to choose the
surface:

```tsx
<DataGrid
  rows={orders}
  columns={columns}
  columnControls={{
    menu: true,
    reorder: true,
    pinning: true,
    visibility: true,
  }}
/>
```

- The column menu exposes the operations enabled for that column.
- Reordering supports pointer drag and keyboard operation.
- Pinning keeps left- and right-pinned columns rendered while center columns
  are virtualized.
- `enableColumnResize` adds resize handles and updates TanStack's
  `columnSizing` state.

### Server-backed rows

Pass `dataSource` instead of `rows` when the server owns sorting, filtering, and
offset pagination.

```tsx
import {
  DataGrid,
  type ColumnDef,
  type DataSource,
} from '@lynellf/tablekit-react';

interface Order {
  id: string;
  customer: string;
  status: string;
  total: number;
}

const orderSource: DataSource<Order> = {
  capabilities: {
    sort: 'server',
    filter: 'server',
    paginate: 'server',
    pagination: 'offset',
  },

  async getRows(query, { signal }) {
    const response = await fetch('/api/orders/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(query),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Order request failed with ${response.status}`);
    }

    return response.json() as Promise<{
      rows: Order[];
      totalRowCount: number;
    }>;
  },
};

export function ServerOrdersGrid({
  columns,
}: {
  columns: Array<ColumnDef<Order>>;
}) {
  return (
    <DataGrid
      dataSource={orderSource}
      columns={columns}
      getRowId={(order) => order.id}
      initialState={{ pagination: { pageIndex: 0, pageSize: 50 } }}
      loadingContent="Loading orders…"
      errorContent={(error) => <span role="alert">{error.message}</span>}
    />
  );
}
```

Every call receives a `RowsQuery`:

```ts
interface RowsQuery {
  sorting: Array<{ id: string; desc: boolean }>;
  filters: Array<{ id: string; value: unknown; filterFn?: string }>;
  pagination?: {
    type: 'offset';
    offset: number;
    limit: number;
  };
  dataVersion?: string | number;
}
```

Return `{ rows, totalRowCount }`. TableKit aborts obsolete requests and ignores
stale responses when the user changes sorting, filters, or pages quickly.

`DataGrid` server mode currently requires server sorting, server filtering, and
server offset pagination together. Cursor pagination and mixed client/server
ownership are not accepted by the rendered component.

The complete simulated implementation is in
[`ServerDataGridExample.tsx`](examples/showcase/src/ServerDataGridExample.tsx).

### Controlled state

Use `initialState` for uncontrolled defaults. Supply individual slices through
`state` when the application owns them, paired with their TanStack-style
`on*Change` callback:

```tsx
import type { SortingState } from '@tanstack/react-table';
import { useState } from 'react';

const [sorting, setSorting] = useState<SortingState>([
  { id: 'customer', desc: false },
]);

<DataGrid
  rows={orders}
  columns={columns}
  state={{ sorting }}
  onSortingChange={setSorting}
/>;
```

The controllable TanStack slices are:

- `sorting`
- `columnFilters`
- `pagination`
- `columnOrder`
- `columnVisibility`
- `columnPinning`
- `columnSizing`
- `columnSizingInfo`
- `rowSelection`

TableKit also adds `focusedCell` to `DataGridState`. `onStateChange` receives the
complete current state whenever any slice changes.

Sorting and filtering automatically reset `pagination.pageIndex` to `0`.

### Selection, events, and imperative access

```tsx
import { type DataGridHandle, DataGrid } from '@lynellf/tablekit-react';
import { useRef, useState } from 'react';

const gridRef = useRef<DataGridHandle<Order>>(null);
const [selection, setSelection] = useState<Record<string, boolean>>({});

<>
  <button
    type="button"
    onClick={() => console.log(gridRef.current?.getSelectedRows())}
  >
    Inspect selection
  </button>

  <DataGrid
    ref={gridRef}
    rows={orders}
    columns={columns}
    getRowId={(order) => order.id}
    rowSelectionMode="multiple"
    rowSelection={selection}
    onRowSelectionChange={setSelection}
    onRowDoubleClick={({ row }) => openOrder(row.id)}
    onCellClick={({ row, columnId, value }) => {
      console.log(row.id, columnId, value);
    }}
  />
</>;
```

`rowSelectionMode` is `'none'` by default and accepts `'single'` or
`'multiple'`. The imperative handle exposes:

```ts
interface DataGridHandle<TRow> {
  getSelectedRowIds(): string[];
  getSelectedRows(): TRow[];
}
```

Interaction callbacks receive stable row/column coordinates:

| Callback | Payload |
| --- | --- |
| `onRowClick`, `onRowDoubleClick` | `{ rowId, row, nativeEvent }` |
| `onCellClick`, `onCellDoubleClick` | `{ rowId, row, columnId, value, nativeEvent }` |

### DataGrid prop reference

| Prop | Type / default | Purpose |
| --- | --- | --- |
| `columns` | `ColumnDef<TRow>[]` | Required TanStack column definitions |
| `rows` | `TRow[]` | Client-mode rows; mutually exclusive with `dataSource` |
| `dataSource` | `DataSource<TRow>` | Server-mode row provider; mutually exclusive with `rows` |
| `getRowId` | `(row, index, parent?) => string` | Stable row identity; defaults to the array index |
| `initialState` | `InitialTableState & { focusedCell? }` | Initial uncontrolled state |
| `state` | `DataGridState` | Controlled state slices |
| `on*Change` | TanStack `OnChangeFn` callbacks | Controlled sorting, filters, pagination, column layout, sizing, and focus |
| `onStateChange` | `(state) => void` | Observes the complete state |
| `rowSelectionMode` | `'none' \| 'single' \| 'multiple'`; `'none'` | Enables the rendered selection column |
| `rowSelection` | `RowSelectionState` | Controlled selection |
| `defaultRowSelection` | `RowSelectionState`; `{}` | Initial uncontrolled selection |
| `onRowSelectionChange` | `(selection) => void` | Receives the next selection object |
| `columnControls` | `boolean \| { menu, reorder, pinning, visibility }` | Enables the enhanced column workspace |
| `enableColumnResize` | `boolean`; `false` | Enables rendered resize handles |
| `height`, `width` | `number`; `480`, `800` | Viewport dimensions in pixels |
| `rowHeight` | `number`; `36` | Fixed virtual row height |
| `overscanRows`, `overscanColumns` | `number`; `4`, `2` | Extra virtual items rendered outside the viewport |
| `pageSizeOptions` | `number[]`; `[10, 25, 50, 100]` | Values in the page-size control |
| `loadingContent`, `emptyContent` | `ReactNode` | Replaces built-in state text |
| `errorContent` | `(error) => ReactNode` | Renders a server error |
| `className` | `string` | Adds a class to the component root |
| `aria-label` | `string`; `'Data grid'` | Accessible grid name |
| `ref` | `Ref<DataGridHandle<TRow>>` | Reads the current selection |

The exact exported definitions are in
[`DataGrid.types.ts`](packages/react/src/DataGrid.types.ts).

> `messages`, `navigationMode`, and `tabBehavior` are present in the exported
> v3.0 type for compatibility, but they do not currently change rendered
> `DataGrid` behavior. Cell keyboard navigation is enabled by the component.

## PivotGrid

### Quick start

`PivotGrid` receives the raw source rows and a `PivotConfig`. The default
main-thread engine groups rows, discovers column values, aggregates measures,
and creates the expandable treegrid.

```tsx
import { PivotGrid } from '@lynellf/tablekit-react';
import '@lynellf/tablekit-react/styles.css';

interface Sale {
  id: string;
  region: string;
  product: string;
  year: number;
  revenue: number;
}

export function RevenuePivot({ sales }: { sales: Sale[] }) {
  return (
    <PivotGrid
      data={sales}
      pivot={{
        rows: ['region', 'product'],
        columns: ['year'],
        measures: [
          {
            id: 'revenue',
            field: 'revenue',
            aggregator: 'sum',
            label: 'Revenue',
          },
        ],
        totals: {
          grandTotalRow: true,
          grandTotalColumn: true,
          grandTotalColumnPosition: 'end',
        },
      }}
      height={520}
      rowHeaderWidth={220}
      aria-label="Revenue by region, product, and year"
      renderValue={({ value }) =>
        typeof value === 'number'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(value)
          : String(value ?? '—')
      }
    />
  );
}
```

### Pivot configuration

```ts
interface PivotConfig<TRow> {
  rows: Array<FieldRef<TRow>>;
  columns: Array<FieldRef<TRow>>;
  measures: Array<MeasureDef<TRow>>;
  filters?: Array<PivotFilter<TRow>>;
  totals?: TotalsConfig;
}
```

| Field | Meaning |
| --- | --- |
| `rows` | Ordered grouping fields that create the expandable row hierarchy |
| `columns` | Ordered grouping fields that create generated column headers |
| `measures` | Values to aggregate for every row-path and column-path intersection |
| `filters` | Source-row filters applied before grouping and aggregation |
| `totals` | Grand-total row and column settings |

Rows and columns usually use a field name:

```ts
rows: ['region', 'product'];
columns: ['year'];
```

The main-thread engine also accepts an object with a custom accessor:

```ts
rows: [
  {
    field: 'salesRegion',
    label: 'Region',
    accessor: (sale) => sale.region.toUpperCase(),
  },
];
```

Inline accessors and functions cannot cross a Web Worker or server boundary.
Use serializable field names, aggregator registry names, and declarative or
registered filters with those engines.

### Measures and built-in aggregators

Every measure requires a stable `id`. `field` identifies the value to aggregate,
and `aggregator` defaults to `'sum'`.

```ts
measures: [
  { id: 'revenue_sum', field: 'revenue', aggregator: 'sum' },
  { id: 'order_count', field: 'id', aggregator: 'count' },
  { id: 'average_margin', field: 'margin', aggregator: 'avg' },
];
```

Built-in names are:

- `sum`
- `count`
- `min`
- `max`
- `avg`

Register a custom mergeable aggregator when the built-ins are not enough:

```ts
import { registerAggregator } from '@lynellf/tablekit-pivot/aggregators';

registerAggregator('median', {
  init: () => [] as number[],
  accumulate: (values, value) =>
    typeof value === 'number' ? [...values, value] : values,
  merge: (left, right) => [...left, ...right],
  finalize: (values) => {
    if (values.length === 0) return Number.NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[middle]
      : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  },
});
```

Then reference it by name:

```ts
measures: [
  { id: 'median_revenue', field: 'revenue', aggregator: 'median' },
];
```

Custom worker aggregators must also be registered inside the worker entry.

### Pre-aggregation filters

Declarative filters work with every engine:

```ts
filters: [
  { field: 'region', op: 'equals', value: 'West' },
  { field: 'year', op: 'in', value: [2024, 2025] },
  { field: 'revenue', op: 'range', value: [1_000, 50_000] },
  { field: 'product', op: 'contains', value: 'Desk' },
];
```

Supported operators are `equals`, `in`, `notIn`, `range`, and `contains`.
Multiple filters use AND semantics.

The main-thread engine also accepts an inline predicate:

```ts
filters: [{ predicate: (sale) => sale.revenue > 1_000 }];
```

For worker or server execution, use a declarative filter or a registered
predicate reference:

```ts
filters: [
  {
    predicateRef: 'minimumRevenue',
    args: { minimum: 1_000 },
  },
];
```

### Totals

Grand totals default to enabled. Configure or disable them explicitly:

```ts
totals: {
  grandTotalRow: true,
  grandTotalColumn: true,
  grandTotalColumnPosition: 'end', // or 'start'
};
```

Per-level subtotals are not rendered in the current component.

### Pivot field builder

`pivotControls` adds an optional Rows / Columns / Values / Filters panel beside
the treegrid:

```tsx
<PivotGrid
  data={sales}
  pivot={pivotConfig}
  pivotControls={{
    position: 'right',
    fields: [
      { field: 'region', label: 'Region' },
      { field: 'product', label: 'Product' },
      { field: 'year', label: 'Year' },
      { field: 'revenue', label: 'Revenue' },
    ],
    aggregators: ['sum', 'count', 'avg'],
  }}
/>
```

Pass `pivotControls={true}` to infer fields from the first object row and expose
all five built-in aggregators. The builder can reorder and move hierarchy
fields, add or remove measures and filters, and change measure aggregations.

See the complete
[`PivotBuilderExample.tsx`](examples/showcase/src/PivotBuilderExample.tsx).

### Controlled pivot state

`PivotGridState` contains:

```ts
interface PivotGridState<TRow> {
  pivot: PivotConfig<TRow>;
  expanded: Record<RowPathKey, boolean>;
  pivotSorting: PivotSortingState;
  columnPinning: {
    left?: string[];
    right?: string[];
  };
  focusedCell: {
    rowId: string;
    columnId: string;
  } | null;
}
```

Use `initialState` for uncontrolled defaults or supply selected slices through
`state`:

```tsx
import type {
  PivotExpansionState,
  PivotSortingState,
} from '@lynellf/tablekit-react';
import { useState } from 'react';

const [expanded, setExpanded] = useState<PivotExpansionState>({});
const [sorting, setSorting] = useState<PivotSortingState>([
  { level: 0, by: 'label', desc: false },
]);

<PivotGrid
  data={sales}
  pivot={pivotConfig}
  state={{ expanded, pivotSorting: sorting }}
  onExpandedChange={setExpanded}
  onPivotSortingChange={setSorting}
/>;
```

Expansion keys are JSON-encoded row paths, such as `["West","Desk"]`.

Pivot sorting is defined per hierarchy level:

```ts
const sorting: PivotSortingState = [
  { level: 0, by: 'label', desc: false },
  { level: 1, by: 'measure', measureId: 'revenue', desc: true },
];
```

Generated value column IDs use the form
`<JSON column path>::<measure id>`, for example `[2025]::revenue`. Grand-total
columns use `__total__::<measure id>`. Those IDs can be supplied through
`initialState.columnPinning` or controlled `state.columnPinning`.

If rows are mutated without changing the `data` array reference, supply
`dataVersion={{ version }}` or `dataVersion={{ getVersion }}` to invalidate the
pivot query memoization.

### Formatting, events, and imperative access

`renderValue` receives the value plus its complete pivot context:

```ts
interface PivotGridValueContext<TRow> {
  value: unknown;
  row: PivotRowNode<TRow> | null;
  leaf: PivotLeafColumn<TRow>;
  isGrandTotal: boolean;
}
```

Cell callbacks add stable coordinates and the React event:

```tsx
<PivotGrid
  data={sales}
  pivot={pivotConfig}
  onCellDoubleClick={({
    value,
    row,
    rowKey,
    leaf,
    columnId,
    isGrandTotal,
  }) => {
    openDrilldown({
      value,
      row,
      rowKey,
      measureId: leaf.measureId,
      columnId,
      isGrandTotal,
    });
  }}
  onRowDoubleClick={({ row, rowKey }) => openGroup(rowKey, row)}
/>;
```

Grand-total cells report `row: null`, `rowKey: null`, and
`isGrandTotal: true`.

The imperative handle provides adapter-friendly commands:

```tsx
import {
  type PivotGridHandle,
  PivotGrid,
} from '@lynellf/tablekit-react';
import { useRef } from 'react';

const pivotRef = useRef<PivotGridHandle>(null);

<PivotGrid
  ref={pivotRef}
  data={sales}
  pivot={pivotConfig}
/>;

pivotRef.current?.expandAll();
pivotRef.current?.collapseAll();
pivotRef.current?.sortFirstColumn();
const rowPathKeys = pivotRef.current?.getAllRowPathKeys();
```

### Web Worker execution

Create a worker entry in its own module:

```ts
// pivot.worker.ts
import { createWorkerEntry } from '@lynellf/tablekit-pivot/worker/entry';

createWorkerEntry();
```

Create the engine in the application, transfer the rows, and pass the ready
engine to `PivotGrid`:

```tsx
import {
  createWorkerEngine,
  type WorkerEngine,
} from '@lynellf/tablekit-pivot/worker';
import {
  PivotGrid,
  type PivotConfig,
} from '@lynellf/tablekit-react';
import { useEffect, useState } from 'react';

function WorkerRevenuePivot({
  sales,
  pivotConfig,
}: {
  sales: Sale[];
  pivotConfig: PivotConfig<Sale>;
}) {
  const [engine, setEngine] = useState<WorkerEngine<Sale> | null>(null);

  useEffect(() => {
    let active = true;
    const nextEngine = createWorkerEngine<Sale>({
      createWorker: () =>
        new Worker(new URL('./pivot.worker.ts', import.meta.url), {
          type: 'module',
        }),
    });

    void nextEngine.setRows(sales).then(() => {
      if (active) setEngine(nextEngine);
    });

    return () => {
      active = false;
      nextEngine.dispose();
    };
  }, [sales]);

  if (!engine) return <p>Starting pivot worker…</p>;

  return <PivotGrid data={sales} pivot={pivotConfig} engine={engine} />;
}
```

Call `setRows` whenever the worker's source dataset changes. Worker queries must
use serializable fields, filters, and registered aggregator names.

The runnable version is
[`WorkerPivotExample.tsx`](examples/showcase/src/WorkerPivotExample.tsx), with
its worker entry in
[`pivot.worker.ts`](examples/showcase/src/pivot.worker.ts).

### Server execution

`createServerEngine` adapts asynchronous root and child requests to
`PivotGrid`'s `AggregationEngine` contract:

```tsx
import { createServerEngine } from '@lynellf/tablekit-pivot/server';
import {
  PivotGrid,
  type PivotConfig,
} from '@lynellf/tablekit-react';
import { useEffect, useMemo } from 'react';

function ServerRevenuePivot({
  sales,
  pivotConfig,
}: {
  sales: Sale[];
  pivotConfig: PivotConfig<Sale>;
}) {
  const engine = useMemo(
    () =>
      createServerEngine<Sale>({
        async compute(query, { signal }) {
          const response = await fetch('/api/pivot', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(query),
            signal,
          });
          if (!response.ok) throw new Error('Unable to load the pivot');
          return response.json();
        },

        async computeChildren(path, query, { signal }) {
          const response = await fetch('/api/pivot/children', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ path, query }),
            signal,
          });
          if (!response.ok) throw new Error('Unable to load pivot children');
          return response.json();
        },

        debounceMs: 40,
      }),
    [],
  );

  useEffect(() => () => engine.dispose?.(), [engine]);

  return <PivotGrid data={sales} pivot={pivotConfig} engine={engine} />;
}
```

`compute` returns a `PivotResult`; `computeChildren` returns the child
`PivotRowNode[]` for one expanded path. Both callbacks receive an `AbortSignal`.
The server adapter caches in-flight child requests and merges resolved children
into the rendered tree.

See
[`ServerPivotExample.tsx`](examples/showcase/src/ServerPivotExample.tsx) for a
complete lazy-expansion example.

### PivotGrid prop reference

| Prop | Type / default | Purpose |
| --- | --- | --- |
| `data` | `TRow[]` | Required source rows |
| `pivot` | `PivotConfig<TRow> \| ({ data }) => PivotConfig<TRow>` | Required grouping and aggregation configuration |
| `engine` | `AggregationEngine<TRow>`; main thread | Replaces the default execution engine |
| `dataVersion` | `{ version?; getVersion? }` | Invalidates computation when a stable data reference changes internally |
| `initialState` | `Partial<PivotGridState<TRow>>` | Initial uncontrolled state |
| `state` | `Partial<PivotGridState<TRow>>` | Controlled state slices |
| `onPivotChange` | TanStack `OnChangeFn<PivotConfig>` | Receives builder/config updates |
| `onExpandedChange` | `(expanded) => void` | Receives row expansion updates |
| `onPivotSortingChange` | `(sorting) => void` | Receives per-level sort updates |
| `onFocusedCellChange` | `(cell) => void` | Receives keyboard/pointer focus updates |
| `onStateChange` | `(state or updater) => void` | Observes complete pivot state |
| `pivotControls` | `boolean \| { fields, position, aggregators }` | Enables the pivot field builder |
| `renderValue` | `(context) => ReactNode` | Formats value and grand-total cells |
| `onRowDoubleClick` | `(event) => void` | Publishes a grouped row and `rowKey` |
| `onCellClick`, `onCellDoubleClick` | `(event) => void` | Publishes value, row, leaf, and stable coordinates |
| `height`, `width` | `number`; `480`, `800` | Viewport dimensions in pixels |
| `rowHeight` | `number`; `36` | Fixed virtual row height |
| `rowHeaderWidth` | `number`; `220` | Width of the pinned row hierarchy |
| `overscanRows`, `overscanColumns` | `number`; `4`, `2` | Extra virtual items rendered outside the viewport |
| `tabBehavior` | `'exit' \| 'cells'`; `'exit'` | Controls whether Tab leaves or enters the grid |
| `loadingContent`, `emptyContent` | `ReactNode` | Replaces built-in state text |
| `errorContent` | `(error) => ReactNode` | Renders a root aggregation error; retry remains built in |
| `className` | `string` | Adds a class to the component root |
| `aria-label` | `string`; `'Pivot grid'` | Accessible treegrid name |
| `ref` | `Ref<PivotGridHandle>` | Exposes expansion, sorting, and row-path commands |

The exact exported definitions are in
[`PivotGrid.types.ts`](packages/react/src/PivotGrid.types.ts).

> `messages` and `onColumnPinningChange` remain in the exported v3.0 type, but
> the rendered pivot controls do not currently drive them. Supply pinning
> through `initialState.columnPinning` or controlled `state.columnPinning`.

## Framework-free pivot engine

Install the pivot package directly when React is not responsible for rendering:

```bash
npm install @lynellf/tablekit-pivot
```

Build a query and execute it with the main-thread engine:

```ts
import { createMainThreadEngine } from '@lynellf/tablekit-pivot/engine';
import { buildPivotQuery } from '@lynellf/tablekit-pivot/serialize';
import type { PivotConfig } from '@lynellf/tablekit-pivot';

const config: PivotConfig<Sale> = {
  rows: ['region', 'product'],
  columns: ['year'],
  measures: [{ id: 'revenue', field: 'revenue', aggregator: 'sum' }],
};

const query = buildPivotQuery(
  sales,
  config,
  {}, // expanded paths
  [], // pivot sorting
  config.totals ?? {},
);

const engine = createMainThreadEngine<Sale>();
const result = await engine.compute(query, {
  signal: new AbortController().signal,
});

console.log(result.rowRoot.children);
console.log(result.leafColumns);
console.log(result.grandTotals);
```

The package's public entry points are:

| Entry point | Main exports |
| --- | --- |
| `@lynellf/tablekit-pivot` | Configuration, state, result types, built-in aggregators, and registry functions |
| `@lynellf/tablekit-pivot/aggregators` | Built-in and custom aggregator registry |
| `@lynellf/tablekit-pivot/engine` | `createMainThreadEngine`, result construction, sorting, row-path utilities, and cache |
| `@lynellf/tablekit-pivot/serialize` | `buildPivotQuery`, query types, and validation |
| `@lynellf/tablekit-pivot/worker` | Worker engine, serialization, registration helpers, and protocol types |
| `@lynellf/tablekit-pivot/worker/entry` | Worker-side entry and row store |
| `@lynellf/tablekit-pivot/worker/protocol` | Worker request/response wire types |
| `@lynellf/tablekit-pivot/server` | Server engine, retry helper, and child-refetch orchestration |

The framework-free contracts are defined in
[`packages/pivot/src/types.ts`](packages/pivot/src/types.ts).

## Examples

The Storybook workspace uses the published package entry points and pairs each
rendered example with its TypeScript source:

| Example | Demonstrates |
| --- | --- |
| [`ClientDataGridExample.tsx`](examples/showcase/src/ClientDataGridExample.tsx) | Client sorting, filtering, pagination, selection, pinning, events, and virtualization |
| [`EnhancedDataGridExample.tsx`](examples/showcase/src/EnhancedDataGridExample.tsx) | Column menus, reordering, visibility, and pinning |
| [`ServerDataGridExample.tsx`](examples/showcase/src/ServerDataGridExample.tsx) | Async offset data source and request cancellation |
| [`ClientPivotGridExample.tsx`](examples/showcase/src/ClientPivotGridExample.tsx) | Row/column hierarchies, filters, totals, and formatting |
| [`PivotBuilderExample.tsx`](examples/showcase/src/PivotBuilderExample.tsx) | Interactive pivot configuration |
| [`WorkerPivotExample.tsx`](examples/showcase/src/WorkerPivotExample.tsx) | Off-main-thread aggregation |
| [`ServerPivotExample.tsx`](examples/showcase/src/ServerPivotExample.tsx) | Async root computation and lazy child expansion |

Run the examples locally:

```bash
pnpm install
pnpm examples:dev
```

Useful repository commands:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm examples:build
pnpm verify
```

## Current scope

The rendered components provide fixed-height row virtualization. Variable-height
rows, editing, range selection, clipboard paste, charts, frozen rows,
server-wide select-all, cursor pagination in `DataGrid`, and per-level pivot
subtotals are outside the current surface.

## Issues and license

Report bugs and request features through
[GitHub Issues](https://github.com/lynellf/tablekit/issues).

TableKit is released under the [MIT license](LICENSE).
