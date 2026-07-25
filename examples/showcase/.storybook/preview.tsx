import '@lynellf/tablekit-react/styles.css';
import type { Preview } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import '../src/styles.css';
import { tablekitTheme } from './tablekit-theme';

function StorySurface({
  children,
  packagePaths,
}: {
  children: ReactNode;
  packagePaths?: string[];
}) {
  return (
    <div className="story-surface">
      {packagePaths?.length ? (
        <header className="story-runtime">
          <span>Public imports</span>
          <div>
            {packagePaths.map((packagePath) => (
              <code key={packagePath}>{packagePath}</code>
            ))}
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <StorySurface packagePaths={context.parameters.packagePaths as string[] | undefined}>
        <Story />
      </StorySurface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
      sort: 'requiredFirst',
    },
    docs: {
      canvas: {
        sourceState: 'shown',
      },
      codePanel: true,
      theme: tablekitTheme,
    },
    options: {
      storySort: {
        order: ['Getting Started', 'Components', 'Engines'],
      },
    },
  },
};

export default preview;
