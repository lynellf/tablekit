import { DataGrid } from '@lynellf/tablekit-react';
import { salesColumns, salesRows } from './data';

export interface EnhancedDataGridExampleProps {
  height?: number;
  pageSize?: 25 | 50 | 100;
}

export function EnhancedDataGridExample({
  height = 430,
  pageSize = 25,
}: EnhancedDataGridExampleProps) {
  return (
    <section className="example-stage" aria-labelledby="enhanced-grid-heading">
      <div className="example-heading">
        <div>
          <p className="section-kicker">Opt-in column workspace · client data</p>
          <h2 id="enhanced-grid-heading">A richer grid without a second component.</h2>
        </div>
        <div className="feature-list" aria-label="Active features">
          <span>Menus</span>
          <span>Reorder</span>
          <span>Pin</span>
          <span>Visibility</span>
        </div>
      </div>

      <p className="example-copy">
        Open a column menu to sort, pin, hide, or reset the layout. Drag the double-dot handle to
        move a column, or focus it and use Space, Left/Right, then Space to commit.
      </p>

      <div className="demo-canvas">
        <DataGrid
          key={pageSize}
          rows={salesRows}
          columns={salesColumns}
          getRowId={(row) => row.id}
          columnControls
          initialState={{ pagination: { pageIndex: 0, pageSize } }}
          height={height}
          width={1_080}
          rowHeight={38}
          pageSizeOptions={[25, 50, 100]}
          aria-label="Enhanced client sales data grid"
        />
      </div>
    </section>
  );
}
