<!-- Historical: true -->
# Split-pane custom-rendering recipe

> Last verified against tablekit v2.2.0.

Use this only when a transformed ancestor makes sticky positioning impossible and the rendered `DataGrid` cannot be placed outside that transform.

## Approach

1. Build one `useDataTable` instance.
2. Read `getLeftLeafColumns()`, `getCenterLeafColumns()`, and `getRightLeafColumns()`.
3. Render the same row model into three panes.
4. Synchronize vertical scroll among all panes.
5. Give the center pane the only horizontal scrollbar.
6. Use `requestAnimationFrame` to coalesce scroll writes and guard against feedback loops.

```tsx
const { table } = useDataTable({ data: rows, columns });

const left = table.getLeftLeafColumns();
const center = table.getCenterLeafColumns();
const right = table.getRightLeafColumns();
const visibleRows = table.getRowModel();
```

Each pane must use the same stable row IDs, row heights, and virtual window. Treat one pane as the scroll source for a frame and mirror only the orthogonal `scrollTop` value to the other two.

## Prefer the rendered grid

`DataGrid` already uses one scroll viewport, retains pinned columns, virtualizes center columns, and positions rows with `top` offsets. A split pane multiplies DOM, focus, ARIA, resizing, and scroll synchronization work. It is an advanced headless escape hatch, not the default pinning recipe.

## Pitfalls

- Three independent `role="grid"` trees are not equivalent to one grid. Compose ARIA carefully or expose only one interactive tree.
- Never derive pane rows separately; mismatched filtering or pagination breaks alignment.
- Variable row heights require shared measurement.
- Column menus and drag overlays need a viewport-level overlay layer.
