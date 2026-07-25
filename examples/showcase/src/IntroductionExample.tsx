import { VERSION as CORE_VERSION } from '@lynellf/tablekit-core';
import { VERSION as PIVOT_VERSION } from '@lynellf/tablekit-pivot';
import { VERSION as REACT_VERSION } from '@lynellf/tablekit-react';
import { VERSION as WORKER_VERSION } from '@lynellf/tablekit-worker';

const packages = [
  { id: 'core', name: 'core', version: CORE_VERSION },
  { id: 'react', name: 'react', version: REACT_VERSION },
  { id: 'pivot', name: 'pivot', version: PIVOT_VERSION },
  { id: 'worker', name: 'worker', version: WORKER_VERSION },
] as const;

export function IntroductionExample() {
  return (
    <section className="reference-intro">
      <div className="reference-intro__hero">
        <p className="eyebrow">Executable reference · v{CORE_VERSION}</p>
        <h1>Tablekit examples</h1>
        <p>
          Open a component from the sidebar to inspect its live behavior, change supported inputs,
          and copy the exact TypeScript implementation shown beneath the preview.
        </p>
      </div>
      <ul className="reference-packages" aria-label="Loaded package versions">
        {packages.map((entry) => (
          <li key={entry.id} data-testid={`package-${entry.id}`}>
            <span className="status-dot" aria-hidden="true" />
            <code>{entry.name}</code>
            <strong>v{entry.version}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
