import { PivotGrid } from '@lynellf/tablekit-react';
import { formatCurrency, salesRows } from './data';

export interface ClientPivotGridExampleProps {
  height?: number;
  rowHeaderWidth?: number;
}

export function ClientPivotGridExample({
  height = 430,
  rowHeaderWidth = 210,
}: ClientPivotGridExampleProps) {
  return (
    <section className="example-stage" aria-labelledby="client-pivot-heading">
      <div className="example-heading">
        <div>
          <p className="section-kicker">Rendered component · main-thread aggregation</p>
          <h2 id="client-pivot-heading">
            Revenue rolled up without surrendering the row hierarchy.
          </h2>
        </div>
        <div className="feature-list" aria-label="Active features">
          <span>Expand</span>
          <span>Totals</span>
          <span>Groups</span>
          <span>Pin</span>
        </div>
      </div>

      <p className="example-copy">
        Expand a region to inspect products. The complete 2025 column group is frozen on the left,
        while grand totals remain fixed on the right.
      </p>

      <div className="demo-canvas">
        <PivotGrid
          data={salesRows}
          pivot={{
            rows: ['region', 'product'],
            columns: ['year'],
            measures: [
              { id: 'revenue', field: 'revenue', aggregator: 'sum', label: 'Revenue' },
              { id: 'units', field: 'units', aggregator: 'sum', label: 'Units' },
            ],
            totals: {
              grandTotalRow: true,
              grandTotalColumn: true,
              grandTotalColumnPosition: 'end',
            },
          }}
          getRowId={(row) => row.id}
          initialState={{
            columnPinning: { left: ['[2025]::revenue'], right: [] },
          }}
          height={height}
          width={920}
          rowHeight={38}
          rowHeaderWidth={rowHeaderWidth}
          aria-label="Client revenue pivot grid"
          renderValue={({ value, leaf }) =>
            leaf.measureId === 'revenue' ? formatCurrency(value) : String(value ?? '—')
          }
        />
      </div>
    </section>
  );
}
