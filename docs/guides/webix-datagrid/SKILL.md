---
name: webix-datagrid
description: >
  Maps Webix DataTable features to tablekit's rendered DataGrid and headless
  core. Use for migration analysis, parity evaluation, or a compatibility layer.
type: guide-companion
verified_against: tablekit v2.2.0 source
target: webix-datagrid
tablekit_packages:
  - @lynellf/tablekit-react
  - @lynellf/tablekit-core
companion_guide: ./guide.md
---

# Webix DataTable to tablekit

## Workflow

1. Read `./guide.md`.
2. Start from `DataGrid`; use `useDataTable` only for custom DOM.
3. Enable `columnControls` for the enhanced header workspace.
4. Translate Webix events to stable row/cell callbacks and controlled slices.
5. Treat editing, formulas, export, and clipboard as application work or gaps.

## See also

- `./guide.md`
- `../webix-pivot/guide.md`
- `examples/showcase/src/EnhancedDataGridExample.tsx`
