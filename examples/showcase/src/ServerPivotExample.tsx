import { createMainThreadEngine } from '@lynellf/tablekit-pivot/engine';
import { PivotGrid } from '@lynellf/tablekit-react';
import { createServerEngine } from '@lynellf/tablekit-worker/server';
import { useEffect, useMemo } from 'react';
import { type SalesRow, formatCurrency, salesRows } from './data';
import { waitForDelay } from './serverData';

export function ServerPivotExample() {
  const engine = useMemo(() => {
    const simulatedBackend = createMainThreadEngine<SalesRow>();

    return createServerEngine<SalesRow>({
      async compute(query, context) {
        await waitForDelay(320, context.signal);
        return simulatedBackend.compute(query, context);
      },
      async computeChildren(path, query, context) {
        await waitForDelay(220, context.signal);
        return simulatedBackend.computeChildren?.(path, query, context) ?? [];
      },
      debounceMs: 40,
    });
  }, []);

  useEffect(
    () => () => {
      engine.dispose?.();
    },
    [engine],
  );

  return (
    <section className="engine-panel" aria-labelledby="server-engine-title">
      <div className="engine-panel-heading">
        <div>
          <p className="section-kicker">Server adapter</p>
          <h3 id="server-engine-title">Lazy async expansion</h3>
        </div>
        <div className="engine-status">
          <span aria-hidden="true" />
          <strong>Adapter online</strong>
          <small>320 ms latency</small>
        </div>
      </div>

      <p className="engine-description">
        The server adapter owns root computation and fetches child groups only when a row expands.
      </p>

      <div className="demo-canvas compact-canvas">
        <PivotGrid
          data={salesRows}
          engine={engine}
          pivot={{
            rows: ['region', 'product'],
            columns: [],
            measures: [
              { id: 'revenue', field: 'revenue', aggregator: 'sum', label: 'Revenue' },
              { id: 'units', field: 'units', aggregator: 'sum', label: 'Units' },
            ],
            totals: { grandTotalRow: true, grandTotalColumn: true },
          }}
          getRowId={(row) => row.id}
          height={320}
          width={760}
          rowHeight={38}
          rowHeaderWidth={190}
          aria-label="Server revenue pivot grid"
          loadingContent={<span>Fetching the root pivot from the simulated server…</span>}
          renderValue={({ value, leaf }) =>
            leaf.measureId === 'revenue' ? formatCurrency(value) : String(value ?? '—')
          }
        />
      </div>
    </section>
  );
}
