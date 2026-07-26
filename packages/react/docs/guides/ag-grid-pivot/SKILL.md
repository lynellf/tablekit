---
name: ag-grid-pivot
description: >
  Maps AG Grid pivot features to tablekit's PivotGrid, opt-in pivot controls,
  and pivot engine. Use for migration analysis, parity evaluation, or an
  AG Grid-style React pivot implementation.
type: guide-companion
verified_against: tablekit v2.2.0 source
target: ag-grid-pivot
tablekit_packages:
  - @lynellf/tablekit-pivot
  - @lynellf/tablekit-react
  - @lynellf/tablekit-worker
companion_guide: ./guide.md
---

# AG Grid Pivot to tablekit

## Workflow

1. Read `./guide.md`.
2. Install both `@lynellf/tablekit-react` and `@lynellf/tablekit-pivot`.
3. Use `PivotGrid` for rendered treegrid output.
4. Add `pivotControls` for the field builder; use `usePivotTable` for custom markup.
5. Keep worker/server-safe configuration declarative.
6. State clearly that generated header-click sorting and AG Grid's enterprise side bar are not drop-in compatible.

## Load-bearing v2.2 APIs

- `PivotGrid` and `pivotControls`
- `PivotConfig.rows`, `.columns`, `.measures`, `.filters`, `.totals`
- `PivotSortingState`
- built-in and registered aggregators
- main-thread, worker, and server engine boundaries

## See also

- `./guide.md`
- `../ag-grid-datagrid/guide.md`
- `examples/showcase/src/PivotBuilderExample.tsx`
