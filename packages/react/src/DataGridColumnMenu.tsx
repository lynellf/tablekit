import type { ColumnDef, DataTableInstance, SortItem } from '@lynellf/tablekit-core';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { DataGridColumnControls } from './DataGrid.types';

interface DataGridColumnMenuProps<TRow> {
  columnId: string;
  columnLabel: string;
  columns: Array<ColumnDef<TRow, unknown>>;
  controls: Required<DataGridColumnControls>;
  table: DataTableInstance<TRow>;
}

const getColumnLabel = <TRow,>(column: ColumnDef<TRow, unknown>): string => {
  if (typeof column.header === 'string' || typeof column.header === 'number') {
    return String(column.header);
  }
  return column.id;
};

export function DataGridColumnMenu<TRow>({
  columnId,
  columnLabel,
  columns,
  controls,
  table,
}: DataGridColumnMenuProps<TRow>) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const canOpen = controls.menu || controls.pinning || controls.visibility;

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 240;
      setMenuStyle({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
        maxHeight: Math.max(160, window.innerHeight - rect.bottom - 12),
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  if (!canOpen) return null;

  const setSort = (sort: SortItem | null) => {
    table.setSorting((current) => [
      ...current.filter((item) => item.id !== columnId),
      ...(sort ? [sort] : []),
    ]);
  };

  return (
    <div className="tk-grid-column-controls">
      <button
        ref={triggerRef}
        type="button"
        className="tk-grid-column-menu-trigger"
        aria-label={`Column controls for ${columnLabel}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        ⋮
      </button>
      {open && (
        <div
          className="tk-grid-column-menu"
          role="group"
          aria-label={`${columnLabel} column controls`}
          style={menuStyle}
        >
          {controls.menu && (
            <div className="tk-grid-column-menu-section">
              <button
                type="button"
                aria-label={`Sort ${columnLabel} ascending`}
                onClick={() => setSort({ id: columnId, desc: false })}
              >
                Sort ascending
              </button>
              <button
                type="button"
                aria-label={`Sort ${columnLabel} descending`}
                onClick={() => setSort({ id: columnId, desc: true })}
              >
                Sort descending
              </button>
              <button
                type="button"
                aria-label={`Clear ${columnLabel} sort`}
                onClick={() => setSort(null)}
              >
                Clear sort
              </button>
            </div>
          )}
          {controls.pinning && (
            <div className="tk-grid-column-menu-section">
              <button type="button" onClick={() => table.moveColumn(columnId, 'left')}>
                Pin {columnLabel} left
              </button>
              <button type="button" onClick={() => table.moveColumn(columnId, 'right')}>
                Pin {columnLabel} right
              </button>
              <button type="button" onClick={() => table.moveColumn(columnId, 'center')}>
                Unpin {columnLabel}
              </button>
            </div>
          )}
          {controls.visibility && (
            <fieldset className="tk-grid-column-menu-section">
              <legend>Visible columns</legend>
              {columns.map((column) => (
                <label key={column.id}>
                  <input
                    type="checkbox"
                    aria-label={`Show ${getColumnLabel(column)}`}
                    checked={table.getState().columnVisibility[column.id] !== false}
                    onChange={() => table.toggleColumnVisibility(column.id)}
                  />
                  {getColumnLabel(column)}
                </label>
              ))}
            </fieldset>
          )}
          <button
            type="button"
            onClick={() => {
              table.resetSlice('columnOrder');
              table.resetSlice('columnVisibility');
              table.resetSlice('columnPinning');
              table.resetSlice('columnSizing');
            }}
          >
            Reset columns
          </button>
        </div>
      )}
    </div>
  );
}
