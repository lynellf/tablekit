# Webix DataTable to tablekit concept map

> Last verified against the tablekit v2.2.0 source and rendered Storybook examples.

Tablekit now renders a functional React grid, but it does not reproduce the Webix widget API.

## Mapping

| Webix DataTable concept | tablekit v2.2 analog | Coverage |
| --- | --- | --- |
| `data` | `DataGrid.rows` | Full client path |
| Remote loading | `DataGrid.dataSource` | Sort/filter/offset pagination |
| `columns` | `ColumnDef[]` | Stable IDs, accessors, render slots |
| Header sort/filter | Rendered controls | Full state wiring |
| Pager | Rendered footer + `pagination` | Full |
| Selection | `rowSelectionMode` and callbacks | Single/multiple |
| Fixed columns | `columnPinning` | Left and right |
| Resize | `enableColumnResize` | Rendered handle |
| Drag order | `columnControls.reorder` | Pointer and keyboard |
| Column menu | `columnControls.menu/pinning/visibility` | Opt-in |
| Virtual scroll | Built into `DataGrid` | Rows and center columns |
| Item/cell events | `onRowClick`, `onRowDoubleClick`, `onCellClick`, `onCellDoubleClick` | Stable payloads |

## Enhanced header controls

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  columnControls
  enableColumnResize
/>;
```

The enhanced UI delegates to the core sorting, ordering, pinning, and visibility slices. It adds no drag-and-drop package.

## Important differences

- No Webix-compatible cell editing, validation widgets, math expressions, clipboard, CSV/Excel/PDF export, footer formulas, or `autoConfig`.
- No Webix event bus or imperative widget lifecycle.
- Server mode is capability-based and offset-paginated rather than Webix URL configuration.
- `DataGrid` is rendered React UI; `useDataTable` remains the headless escape hatch.

## Verification

- `packages/react/src/DataGrid.test.tsx`
- `examples/showcase/src/ClientDataGridExample.tsx`
- `examples/showcase/src/EnhancedDataGridExample.tsx`
