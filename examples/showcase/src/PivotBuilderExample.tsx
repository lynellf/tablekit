import { PivotGrid } from '@lynellf/tablekit-react';
import { salesRows } from './data';

const fields = [
  { field: 'region', label: 'Region' },
  { field: 'product', label: 'Product' },
  { field: 'channel', label: 'Channel' },
  { field: 'quarter', label: 'Quarter' },
  { field: 'year', label: 'Year' },
  { field: 'owner', label: 'Owner' },
  { field: 'revenue', label: 'Revenue' },
  { field: 'units', label: 'Units' },
  { field: 'margin', label: 'Margin' },
];

export interface PivotBuilderExampleProps {
  height?: number;
  rowHeaderWidth?: number;
}

export function PivotBuilderExample({
  height = 520,
  rowHeaderWidth = 190,
}: PivotBuilderExampleProps) {
  return (
    <section className="example-stage" aria-labelledby="pivot-builder-heading">
      <div className="example-heading">
        <div>
          <p className="section-kicker">Opt-in field builder · main-thread aggregation</p>
          <h2 id="pivot-builder-heading">Configure the pivot beside the result.</h2>
        </div>
        <div className="feature-list" aria-label="Active features">
          <span>Rows</span>
          <span>Columns</span>
          <span>Values</span>
          <span>Filters</span>
        </div>
      </div>

      <p className="example-copy">
        Reorder or move hierarchy fields, change a value aggregation, and add pre-aggregation
        filters. The rendered treegrid updates from the same public pivot state contract.
      </p>

      <div className="demo-canvas">
        <PivotGrid
          data={salesRows}
          pivot={{
            rows: ['region', 'product'],
            columns: ['year'],
            measures: [
              {
                id: 'revenue_sum',
                field: 'revenue',
                aggregator: 'sum',
                label: 'Revenue',
              },
            ],
            totals: {
              grandTotalRow: true,
              grandTotalColumn: true,
              grandTotalColumnPosition: 'end',
            },
          }}
          pivotControls={{ fields, position: 'right' }}
          getRowId={(row) => row.id}
          height={height}
          width={780}
          rowHeight={38}
          rowHeaderWidth={rowHeaderWidth}
          aria-label="Configurable revenue pivot grid"
          renderValue={({ value }) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
              : String(value ?? '—')
          }
        />
      </div>
    </section>
  );
}
