import { DataGrid } from '@lynellf/tablekit-react';
import { useState } from 'react';
import { salesColumns, salesRows } from './data';

export interface ClientDataGridExampleProps {
  height?: number;
  pageSize?: 25 | 50 | 100;
  rowSelectionMode?: 'single' | 'multiple';
}

export function ClientDataGridExample({
  height = 430,
  pageSize = 25,
  rowSelectionMode = 'multiple',
}: ClientDataGridExampleProps) {
  const [event, setEvent] = useState('Select a row or cell to inspect its event payload.');

  return (
    <section className="example-stage" aria-labelledby="client-grid-heading">
      <div className="example-heading">
        <div>
          <p className="section-kicker">Rendered component · client data</p>
          <h2 id="client-grid-heading">A data grid with the essentials already wired.</h2>
        </div>
        <div className="feature-list" aria-label="Active features">
          <span>Sort</span>
          <span>Filter</span>
          <span>Select</span>
          <span>Pin</span>
          <span>Virtualize</span>
        </div>
      </div>

      <p className="example-copy">
        Try the column filters, sort buttons, row checkboxes, pagination controls, and horizontal
        scroll. The product and owner columns remain pinned at opposite edges.
      </p>

      <div className="demo-canvas">
        <DataGrid
          key={pageSize}
          rows={salesRows}
          columns={salesColumns}
          getRowId={(row) => row.id}
          initialState={{
            columnPinning: { left: ['product'], right: ['owner'] },
            pagination: { pageIndex: 0, pageSize },
          }}
          rowSelectionMode={rowSelectionMode}
          height={height}
          width={1_080}
          rowHeight={38}
          pageSizeOptions={[25, 50, 100]}
          aria-label="Client sales data grid"
          onCellClick={(entry) =>
            setEvent(`Cell ${entry.columnId} selected on ${entry.row.product}.`)
          }
          onRowClick={(entry) => setEvent(`Row selected: ${entry.row.product} · ${entry.row.id}.`)}
        />
      </div>

      <output className="event-output" aria-live="polite">
        <span>Latest event</span>
        {event}
      </output>
    </section>
  );
}
