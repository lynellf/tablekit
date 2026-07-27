# @lynellf/tablekit-react

Batteries-included React `DataGrid` and `PivotGrid` components.

```bash
npm install @lynellf/tablekit-react
```

```tsx
import { DataGrid } from '@lynellf/tablekit-react';
import '@lynellf/tablekit-react/styles.css';

<DataGrid
  rows={rows}
  columns={[
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'status', header: 'Status', enableColumnFilter: true },
  ]}
  getRowId={(row) => row.id}
/>;
```

The components use TanStack Table for table state and row models and TanStack
Virtual for fixed-height row and center-column virtualization. `DataGrid`
supports client rows or an asynchronous offset-paginated `DataSource`.
`PivotGrid` includes pivot aggregation, expansion, generated headers, totals,
worker/server engines, accessible treegrid behavior, and an optional field
builder.

Requires React 18+ and Node 20+.
