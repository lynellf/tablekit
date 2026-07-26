# AG Grid Data Grid to tablekit concept map

> Last verified against the tablekit v2.2.0 source and rendered Storybook examples.

Tablekit is not an AG Grid drop-in replacement. It now offers both a rendered React grid and a headless engine, but AG Grid still has a broader application suite and editing/export surface.

## Mapping

| AG Grid concept | tablekit v2.2 analog | Coverage |
| --- | --- | --- |
| `rowData` | `<DataGrid rows={rows}>` | Full, client-side |
| Server row model | `<DataGrid dataSource={source}>` | Sorting, filtering, offset pagination |
| `columnDefs` | `ColumnDef[]` | Full core schema |
| Header sorting | Sort button or `columnControls.menu` | Full client/server state wiring |
| Floating filters | Rendered per-column filter input | Text/value input; not AG Grid filter panels |
| Pagination | Rendered footer + `pagination` slice | Full |
| Row selection | `rowSelectionMode`, controlled selection, callbacks | Single and multiple |
| Pin/hide/reset columns | `columnControls` + core state slices | Opt-in rendered UI |
| Column drag reorder | `columnControls.reorder` | Native DnD, no runtime DnD dependency |
| Keyboard reorder | Reorder handle: Space, arrows, Space/Enter, Escape | Included with rendered controls |
| Column resize | `enableColumnResize` | Full rendered handle |
| Virtual rows/columns | Built into `DataGrid` | Center columns virtualized; pinned columns retained |
| Custom cells/headers | `cell` and `header` render slots | Full |
| Controlled state | Individual state slices and callbacks | More granular than a monolithic column state |

## Opt-in enhanced UI

```tsx
import { DataGrid } from '@lynellf/tablekit-react';
import '@lynellf/tablekit-react/styles.css';

<DataGrid
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  columnControls={{
    menu: true,
    reorder: true,
    pinning: true,
    visibility: true,
  }}
/>;
```

`columnControls={true}` enables all four controls. An object enables only the named capabilities. When omitted, the additional menu and reorder handles are not rendered.

## Important differences

- Tablekit does not implement cell or full-row editing.
- There is no built-in CSV/Excel/PDF export, clipboard workflow, global quick filter, row grouping UI, range selection, master/detail, charting, or AG Grid-compatible column API.
- The column menu is intentionally focused: sort, pin, visibility, and reset. It is not a clone of AG Grid's extensible context menu.
- Consumers can still use `useDataTable` for fully custom rendering, but should not duplicate `DataGrid` geometry unless necessary.

## Verification

- `packages/react/src/DataGrid.test.tsx`
- `examples/showcase/src/EnhancedDataGridExample.tsx`
- `e2e/examples-showcase.spec.ts`
