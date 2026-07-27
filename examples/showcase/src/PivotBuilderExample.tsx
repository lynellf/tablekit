import { PivotGrid, type PivotGridControls } from '@lynellf/tablekit-react';
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
  controlsOpen?: boolean;
  controlsPosition?: NonNullable<PivotGridControls['position']>;
  controlsPresentation?: NonNullable<PivotGridControls['presentation']>;
  height?: number;
  onControlsOpenChange?: (open: boolean) => void;
  rowHeaderWidth?: number;
}

export function PivotBuilderExample({
  controlsOpen,
  controlsPosition = 'right',
  controlsPresentation = 'inline',
  height = 520,
  onControlsOpenChange,
  rowHeaderWidth = 190,
}: PivotBuilderExampleProps) {
  return (
    <section className="example-stage" aria-labelledby="pivot-builder-heading">
      <div className="example-heading">
        <div>
          <p className="section-kicker">Opt-in field builder · main-thread aggregation</p>
          <h2 id="pivot-builder-heading">Configure the pivot in the layout that fits.</h2>
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
        filters. Use the Storybook controls to place the builder inline, in a dialog, or in a drawer
        over the treegrid.
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
          pivotControls={{
            fields,
            position: controlsPosition,
            presentation: controlsPresentation,
            open: controlsOpen,
            onOpenChange: onControlsOpenChange,
          }}
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
