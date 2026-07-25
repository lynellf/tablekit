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
        component: `The same \`PivotGrid\` rendering contract driven across Web Worker and simulated server execution boundaries. The engine changes where aggregation runs; the React component and pivot result model stay the same.

### Install

\`\`\`bash
npm install @lynellf/tablekit-core @lynellf/tablekit-pivot @lynellf/tablekit-react @lynellf/tablekit-worker
\`\`\`

The worker package supplies both the browser-worker adapter and the reference server-engine contract.

### Choose an engine

- **Main thread** is the smallest setup and accepts inline accessors, predicates, and aggregator objects.
- **Web Worker** keeps larger aggregations off the UI thread. It needs a worker entry and serializable registry names.
- **Server** lets an application send a serializable pivot query to its own endpoint and return the shared \`PivotResult\` shape.

### Boundary rules

Worker and server queries cannot carry functions. Use field names, built-in or registered aggregator names, and declarative or registered filters. Expansion, totals, generated columns, loading state, and error recovery remain observable through the same pivot instance.`,
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
      description: {
        story:
          'Aggregation runs in a dedicated module worker. Change the region chips while watching the worker status and the rendered treegrid update without replacing the React component contract.',
      },
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
      description: {
        story:
          'A delayed in-process adapter stands in for an HTTP endpoint. Expanding a row issues an engine request for that path, and the UI preserves loading, success, and retry states expected from a real service.',
      },
      source: {
        code: serverPivotSource,
        language: 'tsx',
      },
    },
  },
};
