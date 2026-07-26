# AG Grid Pivot to tablekit concept map

> Last verified against the tablekit v2.2.0 source and rendered Storybook examples.

Tablekit provides a pivot engine, rendered React treegrid, and an opt-in field builder. It is not an AG Grid Enterprise pivot-mode replacement.

## Mapping

| AG Grid pivot concept | tablekit v2.2 analog | Coverage |
| --- | --- | --- |
| Pivot mode | Render `PivotGrid` instead of `DataGrid` | Separate component |
| Row fields | `PivotConfig.rows` | Ordered hierarchy |
| Column fields | `PivotConfig.columns` | Ordered generated hierarchy |
| Value columns / `aggFunc` | `PivotConfig.measures` | `sum`, `count`, `min`, `max`, `avg`, or registry name |
| Filter fields | Declarative `PivotConfig.filters` | Pre-aggregation |
| Field/column side bar | `pivotControls` | Opt-in React panel |
| Drag fields | Native drag among hierarchy/value zones | No runtime DnD dependency |
| Totals | `TotalsConfig` | Grand row and column totals |
| Expansion | `expanded`, `toggleExpanded`, rendered buttons | Lazy-capable |
| Pivot sorting | `PivotSortingState` | Engine state; generated header click is not wired |
| Worker execution | `@lynellf/tablekit-worker` | Declarative configuration required |
| Server execution | Custom `AggregationEngine` | Stable engine seam |

## Built-in configurator

```tsx
<PivotGrid
  data={rows}
  pivot={{
    rows: ['region'],
    columns: ['year'],
    measures: [{ id: 'revenue_sum', field: 'revenue', aggregator: 'sum' }],
  }}
  pivotControls={{
    position: 'right',
    fields: [
      { field: 'region', label: 'Region' },
      { field: 'year', label: 'Year' },
      { field: 'revenue', label: 'Revenue' },
    ],
  }}
/>;
```

`pivotControls={true}` infers field names from the first object row. Explicit fields are safer for empty data, labels, and public schemas. The panel edits the same `PivotConfig` used by the engine.

## Important differences

- `@lynellf/tablekit-react` has an optional peer dependency on `@lynellf/tablekit-pivot`, but consumers must install the pivot package to use React pivot APIs.
- There is no `pivotMode` toggle inside `DataGrid`.
- Generated pivot headers do not currently sort on click; use controlled `pivotSorting` or the imperative pivot instance.
- There is no AG Grid column-tool-panel API, chart integration, range selection, or `processPivotResultColDef` compatibility layer.
- Per-level subtotal behavior remains limited by the engine's current totals implementation.

## Verification

- `packages/react/src/PivotGrid.test.tsx`
- `examples/showcase/src/PivotBuilderExample.tsx`
- `e2e/examples-showcase.spec.ts`
