import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ChannelFilter,
  ClientPivotGridExample,
  type OptionalPivotDimension,
  type PivotAggregator,
  type PivotDimension,
  type PivotMeasure,
  type RegionFilter,
} from './ClientPivotGridExample';
import clientPivotGridSource from './ClientPivotGridExample.tsx?raw';
import { PivotBuilderExample } from './PivotBuilderExample';
import pivotBuilderSource from './PivotBuilderExample.tsx?raw';

interface PivotGridStoryArgs {
  height: number;
  rowHeaderWidth: number;
  primaryRowField: PivotDimension;
  secondaryRowField: OptionalPivotDimension;
  primaryColumnField: OptionalPivotDimension;
  secondaryColumnField: OptionalPivotDimension;
  regionFilter: RegionFilter;
  channelFilter: ChannelFilter;
  measure: PivotMeasure;
  aggregation: PivotAggregator;
}

const DIMENSION_OPTIONS: PivotDimension[] = [
  'region',
  'product',
  'channel',
  'quarter',
  'year',
  'owner',
];
const OPTIONAL_DIMENSION_OPTIONS: OptionalPivotDimension[] = ['none', ...DIMENSION_OPTIONS];
const DIMENSION_LABELS = {
  none: 'None',
  region: 'Region',
  product: 'Product',
  channel: 'Channel',
  quarter: 'Quarter',
  year: 'Year',
  owner: 'Owner',
};

const meta = {
  title: 'Components/PivotGrid',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `A rendered, virtualized treegrid over Tablekit's pivot engine. It turns flat rows into expandable row groups, generated column hierarchies, aggregated measures, and grand totals.

### Install

\`\`\`bash
npm install @lynellf/tablekit-core @lynellf/tablekit-pivot @lynellf/tablekit-react
\`\`\`

\`PivotGrid\` and \`usePivotTable\` are exported by \`@lynellf/tablekit-react\`, but their aggregation engine and pivot types come from the optional peer package \`@lynellf/tablekit-pivot\`. Install the pivot package whenever you use either React pivot API.

### Configure the pivot

- \`rows\` is an ordered hierarchy. Each expanded group reveals the next field.
- \`columns\` is an ordered hierarchy used to generate nested column headers.
- \`measures\` selects numeric fields and an aggregator such as \`sum\`, \`avg\`, \`min\`, \`max\`, or \`count\`.
- \`filters\` runs before grouping and aggregation. Declarative filters can also cross worker and server boundaries.
- \`totals\` controls the grand-total row and generated grand-total columns.

Use the controls below to change each part of that configuration and compare the live result with the source panel.

\`pivotControls\` is the opt-in rendered field builder. Pass \`true\` to infer fields from the first source row, or provide \`{ fields, position, aggregators }\` for explicit labels, placement, and aggregation choices. The panel edits the same \`PivotConfig\` used by \`usePivotTable\`; no parallel configuration model or drag-and-drop dependency is introduced.

### Sorting

The pivot engine supports per-level sorting by group label or measure through \`PivotSortingState\`, \`initialState.pivotSorting\`, and \`setPivotSorting()\`. The rendered \`PivotGrid\` exposes the state callbacks, but header-click sorting is not currently wired into its generated column headers. Column headers therefore do not sort when clicked.`,
      },
    },
  },
  argTypes: {
    height: {
      control: { type: 'range', min: 300, max: 620, step: 20 },
      description: 'Scrollable pivot viewport height in pixels.',
    },
    rowHeaderWidth: {
      control: { type: 'range', min: 160, max: 320, step: 10 },
      description: 'Width of the pinned row-hierarchy column.',
    },
    primaryRowField: {
      name: 'Primary row field',
      control: { type: 'select', labels: DIMENSION_LABELS },
      options: DIMENSION_OPTIONS,
      description: 'Top level of the expandable row hierarchy.',
      table: { category: 'Pivot configuration' },
    },
    secondaryRowField: {
      name: 'Secondary row field',
      control: { type: 'select', labels: DIMENSION_LABELS },
      options: OPTIONAL_DIMENSION_OPTIONS,
      description: 'Optional child level revealed when a top-level row is expanded.',
      table: { category: 'Pivot configuration' },
    },
    primaryColumnField: {
      name: 'Primary column field',
      control: { type: 'select', labels: DIMENSION_LABELS },
      options: OPTIONAL_DIMENSION_OPTIONS,
      description: 'First generated column-header level, or none for measure-only columns.',
      table: { category: 'Pivot configuration' },
    },
    secondaryColumnField: {
      name: 'Secondary column field',
      control: { type: 'select', labels: DIMENSION_LABELS },
      options: OPTIONAL_DIMENSION_OPTIONS,
      description: 'Optional nested column-header level.',
      table: { category: 'Pivot configuration' },
    },
    regionFilter: {
      name: 'Region filter',
      control: {
        type: 'select',
        labels: { all: 'All regions' },
      },
      options: ['all', 'North', 'South', 'East', 'West'],
      description: 'Optional region filter applied before aggregation.',
      table: { category: 'Filters' },
    },
    channelFilter: {
      name: 'Channel filter',
      control: {
        type: 'select',
        labels: { all: 'All channels' },
      },
      options: ['all', 'Direct', 'Partner', 'Online'],
      description: 'Optional sales-channel filter applied before aggregation.',
      table: { category: 'Filters' },
    },
    measure: {
      name: 'Measure',
      control: {
        type: 'select',
        labels: { revenue: 'Revenue', units: 'Units', margin: 'Margin' },
      },
      options: ['revenue', 'units', 'margin'],
      description: 'Numeric source field aggregated into pivot values.',
      table: { category: 'Measure' },
    },
    aggregation: {
      name: 'Aggregation',
      control: {
        type: 'select',
        labels: { sum: 'Sum', avg: 'Average', min: 'Minimum', max: 'Maximum', count: 'Count' },
      },
      options: ['sum', 'avg', 'min', 'max', 'count'],
      description: 'Built-in operation used to reduce each group.',
      table: { category: 'Measure' },
    },
  },
} satisfies Meta<PivotGridStoryArgs>;

export default meta;
type Story = StoryObj<PivotGridStoryArgs>;

export const ClientData: Story = {
  args: {
    height: 430,
    rowHeaderWidth: 210,
    primaryRowField: 'region',
    secondaryRowField: 'product',
    primaryColumnField: 'year',
    secondaryColumnField: 'none',
    regionFilter: 'all',
    channelFilter: 'all',
    measure: 'revenue',
    aggregation: 'sum',
  },
  render: (args) => <ClientPivotGridExample {...args} />,
  parameters: {
    packagePaths: ['@lynellf/tablekit-pivot', '@lynellf/tablekit-react'],
    docs: {
      description: {
        story:
          'This main-thread example uses the rendered React component and an in-memory dataset. Adjust the row and column levels independently, narrow the source rows with region or channel filters, and switch both the measure and its aggregation operation. Duplicate hierarchy selections are collapsed to one level.',
      },
      source: {
        code: clientPivotGridSource,
        language: 'tsx',
      },
    },
  },
};

export const BuiltInConfigurator: Story = {
  args: {
    height: 520,
    rowHeaderWidth: 190,
    primaryRowField: 'region',
    secondaryRowField: 'product',
    primaryColumnField: 'year',
    secondaryColumnField: 'none',
    regionFilter: 'all',
    channelFilter: 'all',
    measure: 'revenue',
    aggregation: 'sum',
  },
  render: ({ height, rowHeaderWidth }) => (
    <PivotBuilderExample height={height} rowHeaderWidth={rowHeaderWidth} />
  ),
  parameters: {
    packagePaths: ['@lynellf/tablekit-pivot', '@lynellf/tablekit-react'],
    controls: {
      include: ['height', 'rowHeaderWidth'],
    },
    docs: {
      description: {
        story:
          'The field builder is rendered by PivotGrid itself. It can reorder or move row and column hierarchy fields, change or add measures, select an aggregation, and create declarative filters while the visual result remains beside the controls.',
      },
      source: {
        code: pivotBuilderSource,
        language: 'tsx',
      },
    },
  },
};
