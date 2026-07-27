import type { DataSource } from '@lynellf/tablekit-react';
import { DataGrid } from '@lynellf/tablekit-react';
import { useMemo, useState } from 'react';
import { salesColumns, salesRows } from './data';
import { querySalesRows, waitForDelay } from './serverData';

export interface ServerDataGridExampleProps {
  height?: number;
}

export function ServerDataGridExample({ height = 430 }: ServerDataGridExampleProps) {
  const [requestStatus, setRequestStatus] = useState('Waiting for the first request.');

  const source = useMemo<DataSource<(typeof salesRows)[number]>>(() => {
    let requestNumber = 0;

    return {
      capabilities: {
        sort: 'server',
        filter: 'server',
        paginate: 'server',
        pagination: 'offset',
      },
      async getRows(query, { signal }) {
        const currentRequest = ++requestNumber;
        setRequestStatus(`Request ${currentRequest} in flight`);
        await waitForDelay(260, signal);
        const result = querySalesRows(salesRows, query);
        setRequestStatus(
          `Request ${currentRequest} complete · ${result.rows.length} of ${result.totalRowCount} rows`,
        );
        return result;
      },
    };
  }, []);

  return (
    <section className="example-stage" aria-labelledby="server-grid-heading">
      <div className="example-heading">
        <div>
          <p className="section-kicker">Rendered component · async DataSource</p>
          <h2 id="server-grid-heading">The same grid, with the server owning every operation.</h2>
        </div>
        <div className="feature-list" aria-label="Active features">
          <span>Async</span>
          <span>Abort</span>
          <span>Server sort</span>
          <span>Server page</span>
        </div>
      </div>

      <p className="example-copy">
        Sorting, filters, and page changes serialize into a <code>RowsQuery</code>. This demo adds
        visible latency so loading and stale-request cancellation are easy to inspect.
      </p>

      <output className="request-monitor" aria-live="polite">
        <span className="request-pulse" aria-hidden="true" />
        <span>{requestStatus}</span>
        <code>@lynellf/tablekit-react</code>
      </output>

      <div className="demo-canvas">
        <DataGrid
          dataSource={source}
          columns={salesColumns}
          getRowId={(row) => row.id}
          initialState={{
            columnPinning: { left: ['product'], right: ['owner'] },
            pagination: { pageIndex: 0, pageSize: 25 },
          }}
          height={height}
          width={1_080}
          rowHeight={38}
          pageSizeOptions={[25, 50]}
          aria-label="Server sales data grid"
          loadingContent={<span>Loading rows from the simulated server…</span>}
          errorContent={(error) => <span role="alert">{error.message}</span>}
        />
      </div>
    </section>
  );
}
