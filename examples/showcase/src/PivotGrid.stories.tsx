import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClientPivotGridExample } from './ClientPivotGridExample';
import clientPivotGridSource from './ClientPivotGridExample.tsx?raw';

interface PivotGridStoryArgs {
  height: number;
  rowHeaderWidth: number;
}

const meta = {
  title: 'Components/PivotGrid',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A rendered treegrid over the main-thread pivot engine, including grouped measures, totals, expansion, and pinned generated columns.',
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
  },
} satisfies Meta<PivotGridStoryArgs>;

export default meta;
type Story = StoryObj<PivotGridStoryArgs>;

export const ClientData: Story = {
  args: {
    height: 430,
    rowHeaderWidth: 210,
  },
  render: (args) => <ClientPivotGridExample {...args} />,
  parameters: {
    packagePaths: ['@lynellf/tablekit-pivot', '@lynellf/tablekit-react'],
    docs: {
      source: {
        code: clientPivotGridSource,
        language: 'tsx',
      },
    },
  },
};
