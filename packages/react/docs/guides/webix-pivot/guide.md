# Webix Pivot to tablekit concept map

> Last verified against the tablekit v2.2.0 source and rendered Storybook examples.

The v2.2 React surface includes the field builder that older tablekit guides described as entirely consumer-built.

## Mapping

| Webix Pivot concept | tablekit v2.2 analog | Coverage |
| --- | --- | --- |
| `structure.rows` | `PivotConfig.rows` | Ordered hierarchy |
| `structure.columns` | `PivotConfig.columns` | Ordered hierarchy |
| `structure.values` | `PivotConfig.measures` | Field + aggregator |
| `structure.filters` | `PivotConfig.filters` | Declarative pre-aggregation filters |
| Configure Pivot panel | `pivotControls` | Opt-in Rows/Columns/Values/Filters UI |
| Field drag | Native DnD in the builder | Hierarchies and values; filter drop selects the field |
| Aggregators | `sum`, `count`, `min`, `max`, `avg`, registry names | Full built-ins |
| Footer/total row | `grandTotalRow` | Full |
| Total column | `grandTotalColumn` and position | Full |
| Open/close groups | Rendered expansion controls | Full |
| Client engine | Default main-thread engine | Full |
| Worker engine | `@lynellf/tablekit-worker` | Full declarative path |
| Server engine | Custom `AggregationEngine` | Supported seam |

## Configurator

```tsx
<PivotGrid
  data={rows}
  pivot={{
    rows: ['form', 'name'],
    columns: ['year'],
    measures: [
      { id: 'oil_max', field: 'oil', aggregator: 'max' },
      { id: 'oil_sum', field: 'oil', aggregator: 'sum' },
    ],
  }}
  pivotControls={{
    fields: [
      { field: 'form', label: 'Form' },
      { field: 'name', label: 'Name' },
      { field: 'year', label: 'Year' },
      { field: 'oil', label: 'Oil' },
    ],
  }}
/>;
```

Use explicit `fields` for an empty initial dataset or controlled labels. `pivotControls={true}` performs a lightweight inference from the first object row.

## Important differences

- React pivot APIs still require `@lynellf/tablekit-pivot` to be installed.
- There is no Webix widget configuration compatibility layer, chart mode, field-specific editor system, or `onBeforeCalc` lifecycle.
- Generated pivot columns do not currently sort on header click.
- Filters in the built-in panel are declarative; predicate filters remain engine/API features rather than editable UI.

## Verification

- `packages/react/src/PivotGrid.test.tsx`
- `examples/showcase/src/PivotBuilderExample.tsx`
- `e2e/examples-showcase.spec.ts`
