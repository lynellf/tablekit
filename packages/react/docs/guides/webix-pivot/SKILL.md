---
name: webix-pivot
description: >
  Maps Webix Pivot features to tablekit's rendered PivotGrid, opt-in field
  builder, and pivot engines. Use for migration analysis or a Webix-style UI.
type: guide-companion
verified_against: tablekit v2.1.0 source
target: webix-pivot
tablekit_packages:
  - @lynellf/tablekit-pivot
  - @lynellf/tablekit-react
  - @lynellf/tablekit-worker
companion_guide: ./guide.md
---

# Webix Pivot to tablekit

## Workflow

1. Read `./guide.md`.
2. Install the React and pivot packages.
3. Translate Webix structure into `PivotConfig`.
4. Use `pivotControls` for a rendered Rows/Columns/Values/Filters panel.
5. Use declarative fields, filters, and aggregator names across worker/server boundaries.
6. Document remaining Webix formatting, chart, and lifecycle gaps.

## See also

- `./guide.md`
- `../webix-datagrid/guide.md`
- `examples/showcase/src/PivotBuilderExample.tsx`
