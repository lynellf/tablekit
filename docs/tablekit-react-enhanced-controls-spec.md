# Tablekit React enhanced controls

## Objective

Make the rendered `DataGrid` and `PivotGrid` components useful without
application-written control scaffolding while preserving their current
headless APIs and lightweight defaults.

The enhanced controls are opt-in and live in
`@lynellf/tablekit-react`. Existing consumers receive no new UI unless they
enable the corresponding prop.

## Confirmed product constraints

1. Keep the existing `core`, `react`, `pivot`, and `worker` package boundaries.
2. Do not add a separate UI package.
3. Add no runtime dependency for menus or drag-and-drop.
4. Build on the existing sorting, filtering, visibility, pinning, ordering, and
   pivot-configuration state.
5. Provide a keyboard-operable alternative for every drag operation.
6. Keep charts, editing, range selection, paste, and vendor-compatible APIs out
   of scope.

## Public contract

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  columnControls={{
    menu: true,
    reorder: true,
    pinning: true,
    visibility: true,
  }}
/>

<PivotGrid
  data={rows}
  pivot={pivot}
  pivotControls={{
    fields: [
      { field: "region", label: "Region" },
      { field: "year", label: "Year" },
      {
        field: "revenue",
        label: "Revenue",
      },
    ],
    position: "right",
    aggregators: ["sum", "avg", "min", "max", "count"],
  }}
/>
```

- `columnControls` is `false`/absent by default. `true` enables the complete
  built-in set; an object enables individual capabilities.
- `pivotControls` is `false`/absent by default. `true` infers fields from the
  first non-null data row; an object may supply stable field metadata and panel
  placement.
- All additions are optional and backward compatible.
- The controls dispatch through existing table and pivot instance methods.
  They do not maintain a second copy of committed grid configuration.

## DataGrid behavior

- The header menu supports ascending/descending/cleared sort, pin left/right,
  unpin, hide, show/hide columns, and reset column layout.
- Enabled header cells support browser-native pointer drag-and-drop reordering.
- Keyboard users can grab a header with Space, change the pending destination
  with Left/Right, commit with Space/Enter, and cancel with Escape.
- Reordering uses stable column IDs and the existing `moveColumn` contract,
  including pin-region transitions.
- Sorting and filtering continue to use the existing controls and callbacks.

## PivotGrid behavior

- The configuration panel exposes Available fields, Rows, Columns, Values, and
  Filters sections.
- Fields may be added, removed, reordered, or moved between compatible sections.
- Values expose an aggregation selector. Built-in defaults are `sum`, `count`,
  `min`, `max`, and `avg`.
- Filters expose declarative field, operator, and value controls using the
  existing `PivotFilter` shapes.
- Pointer drag-and-drop and explicit move controls produce the same
  `PivotConfig`.
- The panel works with uncontrolled pivot state and with the existing
  `state.pivot`/`onPivotChange` controlled contract.

## Technology and code style

- React 19-compatible TypeScript and the existing stylesheet.
- Native semantic elements (`button`, `details`, `select`, `input`) before
  custom ARIA widgets.
- Stable IDs as React keys and immutable state updates.
- Small focused components and pure configuration helpers instead of one larger
  renderer.

## Project structure

- `packages/react/src/` — public types, controls, pure helpers, component tests.
- `examples/showcase/src/` — Storybook usage and visual proof.
- `e2e/` — critical pointer/keyboard browser workflows.
- `docs/` — this contract and public usage documentation.

## Testing strategy

- Write failing React integration tests before each component behavior.
- Integration-test pivot configuration moves through the rendered controls.
- Add Chromium tests for a column-menu operation, DataGrid reorder, Pivot field
  movement, and aggregation changes.
- Verify accessible names, focus behavior, and pointer/keyboard equivalence.

## Commands

```bash
pnpm exec vitest run packages/react/src --maxWorkers=1 --no-file-parallelism
pnpm examples:build
pnpm examples:test
pnpm build
pnpm check:package-artifacts
pnpm verify
```

## Boundaries

- Always: preserve opt-in defaults, use public state commands, add keyboard
  parity, test packed exports, and keep the Storybook example functional.
- Ask first: add a runtime dependency, change CI, or introduce a new package.
- Never: expose third-party drag types, duplicate core/pivot state, weaken
  virtualization, or imply charts/editing/vendor compatibility.

## Success criteria

1. Existing `DataGrid` and `PivotGrid` output is unchanged when controls are
   omitted.
2. A consumer can configure the requested controls using only
   `@lynellf/tablekit-react` plus the existing pivot peer package.
3. DataGrid column layout can be managed from the header and reordered by
   pointer or keyboard.
4. Pivot rows, columns, values, filters, and aggregation can be configured from
   the built-in panel.
5. No runtime dependency is added.
6. Unit, integration, browser, build, and packed-package verification pass.

## Release boundary

This additive public API is prepared as the lockstep `2.1.0` minor release.
Publishing packages remains a separate release action.
