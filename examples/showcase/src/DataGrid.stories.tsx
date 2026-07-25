import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClientDataGridExample } from './ClientDataGridExample';
import clientDataGridSource from './ClientDataGridExample.tsx?raw';
import { ServerDataGridExample } from './ServerDataGridExample';
import serverDataGridSource from './ServerDataGridExample.tsx?raw';

interface DataGridStoryArgs {
  height?: number;
  pageSize?: 25 | 50 | 100;
  rowSelectionMode?: 'single' | 'multiple';
}

const meta = {
  title: 'Components/DataGrid',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Rendered, virtualized data grids backed by either local rows or the public async DataSource contract.',
      },
    },
  },
  argTypes: {
    height: {
      control: { type: 'range', min: 300, max: 620, step: 20 },
      description: 'Scrollable grid viewport height in pixels.',
    },
    pageSize: {
      control: 'select',
      options: [25, 50, 100],
      description: 'Number of client-side rows per page.',
    },
    rowSelectionMode: {
      control: 'inline-radio',
      options: ['single', 'multiple'],
      description: 'Client-side row selection behavior.',
    },
  },
} satisfies Meta<DataGridStoryArgs>;

export default meta;
type Story = StoryObj<DataGridStoryArgs>;

export const ClientData: Story = {
  args: {
    height: 430,
    pageSize: 25,
    rowSelectionMode: 'multiple',
  },
  render: (args) => <ClientDataGridExample {...args} />,
  parameters: {
    packagePaths: ['@lynellf/tablekit-react', '@lynellf/tablekit-react/styles.css'],
    docs: {
      source: {
        code: clientDataGridSource,
        language: 'tsx',
      },
    },
  },
};

export const ServerData: Story = {
  args: {
    height: 430,
  },
  render: ({ height }) => <ServerDataGridExample height={height} />,
  parameters: {
    packagePaths: ['@lynellf/tablekit-core/dataSource', '@lynellf/tablekit-react'],
    controls: {
      exclude: ['pageSize', 'rowSelectionMode'],
    },
    docs: {
      source: {
        code: serverDataGridSource,
        language: 'tsx',
      },
    },
  },
};
