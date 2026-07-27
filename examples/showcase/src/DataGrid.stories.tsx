import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClientDataGridExample } from './ClientDataGridExample';
import clientDataGridSource from './ClientDataGridExample.tsx?raw';
import { EnhancedDataGridExample } from './EnhancedDataGridExample';
import enhancedDataGridSource from './EnhancedDataGridExample.tsx?raw';
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
        component: `A rendered, virtualized data grid for local rows or the public asynchronous \`DataSource\` contract. The component owns the DOM rendering while preserving Tablekit's controlled and uncontrolled state slices.

### Install

\`\`\`bash
npm install @lynellf/tablekit-react
\`\`\`

Import \`@lynellf/tablekit-react/styles.css\` once in the application that renders the grid.

### Choose the data path

- **Client data** passes \`rows\` directly. Tablekit performs sorting, filtering, and pagination in memory.
- **Server data** passes a \`dataSource\` with declared capabilities. The grid sends canonical sort, filter, pagination, cursor, and data-version inputs to that boundary.

### Interaction and state

Column definitions opt into sorting and filtering. Selection, pagination, pinning, sizing, visibility, and focus can begin in \`initialState\`, or be controlled with the corresponding state slice and change callback. Row and cell callbacks receive the resolved source row plus stable row and column identifiers.

\`columnControls\` adds the rendered column workspace only when requested. Pass \`true\` for menus, pinning, visibility, and reorder together, or pass an object such as \`{ menu: true, reorder: true }\` to select individual controls. Reordering uses native drag events and includes a keyboard grab workflow, so it does not add a runtime dependency.

### Accessibility and layout

\`DataGrid\` renders an ARIA grid with named sort buttons, labeled filters, keyboard focus management, and a live announcer. Rows and center columns are virtualized; pinned columns remain mounted at the viewport edges.`,
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
      description: {
        story:
          'All 240 rows live in memory. Use the controls to change viewport height, page size, and selection mode, then try filtering or sorting a pinned column. The event panel shows the row and cell callbacks produced by real interaction.',
      },
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
    packagePaths: ['@lynellf/tablekit-react'],
    controls: {
      exclude: ['pageSize', 'rowSelectionMode'],
    },
    docs: {
      description: {
        story:
          'This example simulates a remote service with server-owned sorting, filtering, and offset pagination. The request monitor exposes accepted request counts so changes can be checked for duplicate or stale fetches.',
      },
      source: {
        code: serverDataGridSource,
        language: 'tsx',
      },
    },
  },
};

export const EnhancedControls: Story = {
  args: {
    height: 430,
    pageSize: 25,
  },
  render: ({ height, pageSize }) => <EnhancedDataGridExample height={height} pageSize={pageSize} />,
  parameters: {
    packagePaths: ['@lynellf/tablekit-react', '@lynellf/tablekit-react/styles.css'],
    controls: {
      exclude: ['rowSelectionMode'],
    },
    docs: {
      description: {
        story:
          'This example opts into the batteries-included column workspace. The menu and reorder handle are part of DataGrid itself and delegate every operation to the existing sorting, ordering, pinning, and visibility state slices.',
      },
      source: {
        code: enhancedDataGridSource,
        language: 'tsx',
      },
    },
  },
};
