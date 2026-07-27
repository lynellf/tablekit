<!-- Historical: true -->
# Recipes

Consumer-facing integration patterns verified against tablekit v2.2.0.

| Recipe | Use it for | Preferred surface |
| --- | --- | --- |
| [layout.md](./layout.md) | Understanding virtualization and pinning geometry | `DataGrid` / `PivotGrid` |
| [dnd-column-reorder.md](./dnd-column-reorder.md) | Pointer column reorder | `DataGrid.columnControls` |
| [kbd-column-reorder.md](./kbd-column-reorder.md) | Keyboard grab reorder | `DataGrid.columnControls` |
| [split-pane.md](./split-pane.md) | Custom headless rendering when sticky positioning is impossible | `useDataTable` |

Prefer the rendered components when their DOM fits. The headless recipes are escape hatches for custom rendering, not prerequisites for a functional grid.
