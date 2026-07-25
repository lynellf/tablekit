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
        component:
          'A package-accurate visual reference for Tablekit. Every scenario imports only public workspace entry points, and every docs canvas keeps its implementation visible.',
      },
    },
  },
} satisfies Meta<typeof IntroductionExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  parameters: {
    docs: {
      source: {
        code: introductionSource,
        language: 'tsx',
      },
    },
  },
};
