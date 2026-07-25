import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServerPivotExample } from './ServerPivotExample';
import serverPivotSource from './ServerPivotExample.tsx?raw';
import { WorkerPivotExample } from './WorkerPivotExample';
import workerPivotSource from './WorkerPivotExample.tsx?raw';

const meta = {
  title: 'Engines/Pivot',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The same PivotGrid rendering contract driven across Web Worker and simulated server execution boundaries.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Worker: Story = {
  render: () => <WorkerPivotExample />,
  parameters: {
    packagePaths: ['@lynellf/tablekit-worker', '@lynellf/tablekit-react'],
    docs: {
      source: {
        code: workerPivotSource,
        language: 'tsx',
      },
    },
  },
};

export const Server: Story = {
  render: () => <ServerPivotExample />,
  parameters: {
    packagePaths: [
      '@lynellf/tablekit-pivot/engine',
      '@lynellf/tablekit-worker/server',
      '@lynellf/tablekit-react',
    ],
    docs: {
      source: {
        code: serverPivotSource,
        language: 'tsx',
      },
    },
  },
};
