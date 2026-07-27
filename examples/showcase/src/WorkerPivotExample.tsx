import type { WorkerEngine } from '@lynellf/tablekit-pivot/worker';
import { createWorkerEngine } from '@lynellf/tablekit-pivot/worker';
import { PivotGrid } from '@lynellf/tablekit-react';
import { useEffect, useState } from 'react';
import { type SalesRow, formatCurrency, salesRows } from './data';

type RegionFilter = 'all' | 'North';

export function WorkerPivotExample() {
  const [engine, setEngine] = useState<WorkerEngine<SalesRow> | null>(null);
  const [status, setStatus] = useState('Starting worker');
  const [error, setError] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();
    const nextEngine = createWorkerEngine<SalesRow>({
      createWorker: () =>
        new Worker(new URL('./pivot.worker.ts', import.meta.url), {
          name: 'tablekit-showcase-pivot',
          type: 'module',
        }),
    });

    nextEngine.setRows(salesRows).then(
      () => {
        if (!active) return;
        setEngine(nextEngine);
        setStatus(`Worker ready · ${Math.round(performance.now() - startedAt)} ms`);
      },
      (reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'The worker could not be initialized.');
      },
    );

    return () => {
      active = false;
      nextEngine.dispose?.();
    };
  }, []);

  return (
    <section className="engine-panel" aria-labelledby="worker-engine-title">
      <div className="engine-panel-heading">
        <div>
          <p className="section-kicker">Web Worker</p>
          <h3 id="worker-engine-title">Off-main-thread pivot</h3>
        </div>
        <div className="engine-status" aria-live="polite">
          <span aria-hidden="true" />
          {status.startsWith('Worker ready') ? (
            <>
              <strong>Worker ready</strong>
              <small>{status.replace('Worker ready · ', '')}</small>
            </>
          ) : (
            <strong>{status}</strong>
          )}
        </div>
      </div>

      <div className="segmented-control" aria-label="Worker pivot region filter">
        <button
          type="button"
          aria-pressed={regionFilter === 'all'}
          onClick={() => setRegionFilter('all')}
        >
          All regions
        </button>
        <button
          type="button"
          aria-pressed={regionFilter === 'North'}
          onClick={() => setRegionFilter('North')}
        >
          North only
        </button>
      </div>

      {error ? (
        <p className="engine-error" role="alert">
          {error}
        </p>
      ) : engine ? (
        <div className="demo-canvas compact-canvas">
          <PivotGrid
            data={salesRows}
            engine={engine}
            pivot={{
              rows: ['region', 'product'],
              columns: ['quarter'],
              measures: [{ id: 'revenue', field: 'revenue', aggregator: 'sum', label: 'Revenue' }],
              filters:
                regionFilter === 'North' ? [{ field: 'region', op: 'equals', value: 'North' }] : [],
              totals: { grandTotalRow: true, grandTotalColumn: true },
            }}
            height={320}
            width={760}
            rowHeight={38}
            rowHeaderWidth={190}
            aria-label="Worker revenue pivot grid"
            renderValue={({ value }) => formatCurrency(value)}
          />
        </div>
      ) : (
        <div className="engine-loading" role="status">
          Transferring {salesRows.length.toLocaleString()} rows to the worker…
        </div>
      )}
    </section>
  );
}
