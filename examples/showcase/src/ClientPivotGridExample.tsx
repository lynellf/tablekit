import type { PivotFilter } from '@lynellf/tablekit-pivot';
import { PivotGrid } from '@lynellf/tablekit-react';
import { type SalesRow, formatCurrency, salesRows } from './data';

export type PivotDimension = 'region' | 'product' | 'channel' | 'quarter' | 'year' | 'owner';
export type OptionalPivotDimension = PivotDimension | 'none';
export type PivotMeasure = 'revenue' | 'units' | 'margin';
export type PivotAggregator = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type RegionFilter = SalesRow['region'] | 'all';
export type ChannelFilter = SalesRow['channel'] | 'all';

export interface ClientPivotGridExampleProps {
  height?: number;
  rowHeaderWidth?: number;
  primaryRowField?: PivotDimension;
  secondaryRowField?: OptionalPivotDimension;
  primaryColumnField?: OptionalPivotDimension;
  secondaryColumnField?: OptionalPivotDimension;
  regionFilter?: RegionFilter;
  channelFilter?: ChannelFilter;
  measure?: PivotMeasure;
  aggregation?: PivotAggregator;
}

const FIELD_LABELS: Record<PivotDimension | PivotMeasure, string> = {
  region: 'Region',
  product: 'Product',
  channel: 'Channel',
  quarter: 'Quarter',
  year: 'Year',
  owner: 'Owner',
  revenue: 'Revenue',
  units: 'Units',
  margin: 'Margin',
};

const AGGREGATION_LABELS: Record<PivotAggregator, string> = {
  sum: 'Sum',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
  count: 'Count',
};

const hierarchy = (
  primary: OptionalPivotDimension,
  secondary: OptionalPivotDimension,
): PivotDimension[] => {
  if (primary === 'none') return [];
  if (secondary === 'none' || secondary === primary) return [primary];
  return [primary, secondary];
};

const hierarchyLabel = (fields: PivotDimension[]): string =>
  fields.length > 0 ? fields.map((field) => FIELD_LABELS[field]).join(' → ') : 'None';

const formatMeasureValue = (
  value: unknown,
  measure: PivotMeasure,
  aggregation: PivotAggregator,
): string => {
  if (aggregation !== 'count' && (measure === 'revenue' || measure === 'margin')) {
    return formatCurrency(value);
  }
  return typeof value === 'number'
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
    : String(value ?? '—');
};

export function ClientPivotGridExample({
  height = 430,
  rowHeaderWidth = 210,
  primaryRowField = 'region',
  secondaryRowField = 'product',
  primaryColumnField = 'year',
  secondaryColumnField = 'none',
  regionFilter = 'all',
  channelFilter = 'all',
  measure = 'revenue',
  aggregation = 'sum',
}: ClientPivotGridExampleProps) {
  const rowHierarchy = hierarchy(primaryRowField, secondaryRowField);
  const columnHierarchy = hierarchy(primaryColumnField, secondaryColumnField);
  const filters: Array<PivotFilter<SalesRow>> = [];
  if (regionFilter !== 'all') {
    filters.push({ field: 'region', op: 'equals', value: regionFilter });
  }
  if (channelFilter !== 'all') {
    filters.push({ field: 'channel', op: 'equals', value: channelFilter });
  }
  const filterLabel =
    filters.length > 0
      ? [
          regionFilter === 'all' ? null : `Region = ${regionFilter}`,
          channelFilter === 'all' ? null : `Channel = ${channelFilter}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'No filters';
  const measureLabel = `${AGGREGATION_LABELS[aggregation]} of ${FIELD_LABELS[measure]}`;
  const configurationKey = [
    ...rowHierarchy,
    ...columnHierarchy,
    regionFilter,
    channelFilter,
    measure,
    aggregation,
  ].join(':');

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
        Expand a group to inspect the next row level. Change the Storybook controls to rebuild the
        row tree, column headers, pre-aggregation filters, and measure.
      </p>

      <dl className="pivot-configuration" aria-label="Active pivot configuration">
        <div>
          <dt>Rows</dt>
          <dd>{hierarchyLabel(rowHierarchy)}</dd>
        </div>
        <div>
          <dt>Columns</dt>
          <dd>{hierarchyLabel(columnHierarchy)}</dd>
        </div>
        <div>
          <dt>Measure</dt>
          <dd>{measureLabel}</dd>
        </div>
        <div>
          <dt>Filters</dt>
          <dd>{filterLabel}</dd>
        </div>
      </dl>

      <div className="demo-canvas">
        <PivotGrid
          key={configurationKey}
          data={salesRows}
          pivot={{
            rows: rowHierarchy,
            columns: columnHierarchy,
            measures: [
              {
                id: 'value',
                field: measure,
                aggregator: aggregation,
                label: measureLabel,
              },
            ],
            filters,
            totals: {
              grandTotalRow: true,
              grandTotalColumn: true,
              grandTotalColumnPosition: 'end',
            },
          }}
          getRowId={(row) => row.id}
          initialState={{
            columnPinning: {
              left: primaryColumnField === 'year' ? ['[2025]::value'] : [],
              right: [],
            },
          }}
          height={height}
          width={920}
          rowHeight={38}
          rowHeaderWidth={rowHeaderWidth}
          aria-label="Client revenue pivot grid"
          renderValue={({ value }) => formatMeasureValue(value, measure, aggregation)}
        />
      </div>
    </section>
  );
}
