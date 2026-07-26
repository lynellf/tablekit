# Column drag-and-drop recipe

> Last verified against tablekit v2.2.0.

## Rendered DataGrid

No drag-and-drop package is required:

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  columnControls={{ reorder: true }}
/>;
```

The rendered handle uses native browser drag events and commits through `table.moveColumn(id, targetIndex)`. Stable column IDs remain the source of identity.

Enable the full header workspace with `columnControls={true}` or combine capabilities:

```tsx
columnControls={{
  menu: true,
  reorder: true,
  pinning: true,
  visibility: true,
}}
```

## Headless rendering

For custom markup, put the column ID in `dataTransfer` on `dragstart`, accept it on a header `drop`, find the target index from `table.getAllLeafColumns()`, and call:

```ts
table.moveColumn(sourceColumnId, targetIndex);
```

Do not maintain an independent column-order array unless the `columnOrder` slice is intentionally controlled.

## Pitfalls

- Use `column.id`, never a render index, as drag identity.
- Keep a keyboard path. The rendered control includes one; custom markup should follow [kbd-column-reorder.md](./kbd-column-reorder.md).
- Pinned columns have region semantics. Moving to `'left'`, `'right'`, or `'center'` is different from moving to a numeric index.
- Native DnD is intentionally dependency-free; touch-specific product requirements may justify a consumer-selected DnD layer in headless mode.

## Verification

- `packages/react/src/DataGrid.test.tsx`
- `examples/showcase/src/EnhancedDataGridExample.tsx`
