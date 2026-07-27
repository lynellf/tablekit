import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
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
  controlsOpen?: boolean;
  controlsPosition?: 'left' | 'right';
  controlsPresentation?: 'inline' | 'dialog' | 'drawer';
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
npm install @lynellf/tablekit-react
\`\`\`

\`PivotGrid\` is exported by \`@lynellf/tablekit-react\`; its framework-free aggregation engine is included through \`@lynellf/tablekit-pivot\`.

### Configure the pivot

- \`rows\` is an ordered hierarchy. Each expanded group reveals the next field.
- \`columns\` is an ordered hierarchy used to generate nested column headers.
- \`measures\` selects numeric fields and an aggregator such as \`sum\`, \`avg\`, \`min\`, \`max\`, or \`count\`.
- \`filters\` runs before grouping and aggregation. Declarative filters can also cross worker and server boundaries.
- \`totals\` controls the grand-total row and generated grand-total columns.

Use the controls below to change each part of that configuration and compare the live result with the source panel.

\`pivotControls\` is the opt-in rendered field builder. Pass \`true\` to infer fields from the first source row, or provide \`{ fields, position, aggregators }\` for explicit labels, placement, and aggregation choices. Set \`presentation\` to \`inline\`, \`dialog\`, or \`drawer\`; overlay visibility can be controlled with \`open\` and \`onOpenChange\`. The builder edits the same \`PivotConfig\` used by \`usePivotTable\`; no parallel configuration model or drag-and-drop dependency is introduced.

### Sorting

The pivot engine supports per-level sorting by group label or measure through \`PivotSortingState\`, \`initialState.pivotSorting\`, and \`setPivotSorting()\`. Generated value-column headers include sort buttons that order top-level row groups by that measure and column path. Each button cycles ascending, descending, then unsorted and updates the same controlled or uncontrolled pivot sorting state.`,
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
    controlsPresentation: {
      name: 'Presentation',
      control: { type: 'select' },
      options: ['inline', 'dialog', 'drawer'],
      description: 'Renders the built-in pivot controls beside or over the treegrid.',
      table: { category: 'Pivot controls' },
    },
    controlsPosition: {
      name: 'Position',
      control: { type: 'inline-radio' },
      options: ['left', 'right'],
      description: 'Places inline controls or anchors the drawer and trigger.',
      table: { category: 'Pivot controls' },
    },
    controlsOpen: {
      name: 'Open',
      control: { type: 'boolean' },
      description: 'Controls dialog or drawer visibility.',
      table: { category: 'Pivot controls' },
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
    controlsOpen: false,
    controlsPosition: 'right',
    controlsPresentation: 'inline',
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
  render: function BuiltInConfiguratorStory() {
    const [args, updateArgs] = useArgs<PivotGridStoryArgs>();
    return (
      <PivotBuilderExample
        controlsOpen={args.controlsOpen}
        controlsPosition={args.controlsPosition}
        controlsPresentation={args.controlsPresentation}
        height={args.height}
        onControlsOpenChange={(open) => updateArgs({ controlsOpen: open })}
        rowHeaderWidth={args.rowHeaderWidth}
      />
    );
  },
  parameters: {
    packagePaths: ['@lynellf/tablekit-pivot', '@lynellf/tablekit-react'],
    controls: {
      include: [
        'height',
        'rowHeaderWidth',
        'controlsPresentation',
        'controlsPosition',
        'controlsOpen',
      ],
    },
    docs: {
      description: {
        story:
          'The field builder is rendered by PivotGrid itself. Use the Presentation, Position, and Open controls to compare its inline, dialog, and drawer layouts, then reorder or move hierarchy fields, change measures, and create declarative filters.',
      },
      source: {
        code: pivotBuilderSource,
        language: 'tsx',
      },
    },
  },
};
