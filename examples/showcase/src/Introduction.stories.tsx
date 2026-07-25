import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntroductionExample } from './IntroductionExample';
import introductionSource from './IntroductionExample.tsx?raw';

const meta = {
  title: 'Getting Started/Introduction',
  component: IntroductionExample,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `A package-accurate visual reference for Tablekit. Every scenario imports public package entry points, renders real components, and keeps its implementation visible beside the result.

### How to use this reference

1. Open a component or engine page from the sidebar.
2. Use **Canvas** for focused interaction or **Docs** for the rendered examples, guidance, controls, and source together.
3. Change the Controls values and confirm the visual result.
4. Copy the source panel only after checking the **Public imports** strip above the example.

### Package map

- \`@lynellf/tablekit-core\` — framework-independent data-table state and data-source contracts.
- \`@lynellf/tablekit-react\` — rendered DataGrid/PivotGrid components, React hooks, virtualization, and accessibility helpers.
- \`@lynellf/tablekit-pivot\` — pivot configuration, aggregation, result model, and main-thread engine.
- \`@lynellf/tablekit-worker\` — worker and server pivot-engine adapters.

### What these examples prove

The examples exercise workspace source through the same public imports consumers use. They are visual and interaction checks, not screenshots or generated mock output. Automated browser coverage also verifies the critical sorting, filtering, pagination, package-boundary, and engine scenarios.`,
      },
    },
  },
} satisfies Meta<typeof IntroductionExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Start here for the package boundary at a glance. The remaining pages move from rendered DataGrid and PivotGrid components to alternate pivot execution engines.',
      },
      source: {
        code: introductionSource,
        language: 'tsx',
      },
    },
  },
};
