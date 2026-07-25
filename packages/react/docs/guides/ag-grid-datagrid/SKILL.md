---
name: ag-grid-datagrid
description: >
  Maps AG Grid Data Grid features to tablekit's rendered DataGrid and headless
  core. Use when migrating from AG Grid, evaluating parity, or designing an
  adapter with tablekit-react.
type: guide-companion
verified_against: tablekit v2.1.0 source
target: ag-grid-datagrid
tablekit_packages:
  - @lynellf/tablekit-react
  - @lynellf/tablekit-core
companion_guide: ./guide.md
---

# AG Grid Data Grid to tablekit

Use this skill for an evidence-based feature map, not for claims of drop-in compatibility.

## Workflow

1. Read `./guide.md`.
2. Prefer the rendered `DataGrid` for a batteries-included React UI.
3. Enable `columnControls` when menus, pinning, visibility, and reorder are required.
4. Use `useDataTable` only when the consumer needs custom markup.
5. Keep stable column IDs and drive controlled behavior through the existing state slices.
6. Call out unsupported editing, export, clipboard, and global-search behavior explicitly.

## Load-bearing v2.1 APIs

- `DataGrid`, `DataGridProps`, `DataGridColumnControls`
- `columnControls={true | { menu, reorder, pinning, visibility }}`
- `rows` or `dataSource`
- `initialState`, `state`, and per-slice change callbacks
- `table.moveColumn()`, `table.resetSlice()`, and stable column IDs

## See also

- `./guide.md`
- `../ag-grid-pivot/guide.md`
- `docs/recipes/dnd-column-reorder.md`
- `examples/showcase/src/EnhancedDataGridExample.tsx`
