# TableKit

Drop-in React data and pivot grids backed by TanStack Table and TanStack Virtual,
with a framework-free pivot engine for main-thread, worker, and server execution.

## Packages

| Package | Purpose |
| --- | --- |
| `@lynellf/tablekit-react` | Batteries-included `DataGrid` and `PivotGrid` components |
| `@lynellf/tablekit-pivot` | Pivot configuration, aggregation trees, serialization, worker protocol, and server adapters |

## Install

```bash
npm install @lynellf/tablekit-react
```

The React package installs the pivot engine and TanStack dependencies. Import the
stylesheet once:

```tsx
import { DataGrid, PivotGrid } from '@lynellf/tablekit-react';
import '@lynellf/tablekit-react/styles.css';
```

`DataGrid` accepts TanStack column definitions directly:

```tsx
const columns = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'amount', header: 'Amount' },
];

<DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />;
```

`PivotGrid` accepts raw rows and a pivot configuration:

```tsx
<PivotGrid
  data={rows}
  pivot={{
    rows: ['region'],
    columns: ['year'],
    measures: [{ id: 'sales', field: 'sales', aggregator: 'sum' }],
  }}
/>;
```

Worker and server execution are available from:

- `@lynellf/tablekit-pivot/worker`
- `@lynellf/tablekit-pivot/worker/entry`
- `@lynellf/tablekit-pivot/worker/protocol`
- `@lynellf/tablekit-pivot/server`

The architecture reset is recorded in
[`docs/decisions/0001-adopt-tanstack-and-remove-tablekit-core.md`](docs/decisions/0001-adopt-tanstack-and-remove-tablekit-core.md).
Requires Node 20+ and React 18+.
