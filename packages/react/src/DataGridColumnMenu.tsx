import type { ColumnDef, RowData, Table } from '@tanstack/react-table';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { DataGridColumnControls } from './DataGrid.types';

interface DataGridColumnMenuProps<TRow extends RowData> {
  columnId: string;
  columnLabel: string;
  columns: Array<ColumnDef<TRow, unknown>>;
  controls: Required<DataGridColumnControls>;
  open: boolean;
  onOpenChange(open: boolean): void;
  table: Table<TRow>;
}

const getColumnId = <TRow extends RowData>(column: ColumnDef<TRow, unknown>): string => {
  if (column.id) return column.id;
  if ('accessorKey' in column && typeof column.accessorKey === 'string') return column.accessorKey;
  throw new Error('DataGrid columns with an accessorFn must define an id.');
};

const getColumnLabel = <TRow extends RowData>(column: ColumnDef<TRow, unknown>): string => {
  if (typeof column.header === 'string' || typeof column.header === 'number') {
    return String(column.header);
  }
  return getColumnId(column);
};

export function DataGridColumnMenu<TRow extends RowData>({
  columnId,
  columnLabel,
  columns,
  controls,
  open,
  onOpenChange,
  table,
}: DataGridColumnMenuProps<TRow>) {
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const controlsRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;
    const dismissWhenOutside = (event: Event) => {
      if (event.target instanceof Node && !controlsRef.current?.contains(event.target)) {
        onOpenChange(false);
      }
    };
    const dismissOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onOpenChange(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', dismissWhenOutside);
    document.addEventListener('focusin', dismissWhenOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissWhenOutside);
      document.removeEventListener('focusin', dismissWhenOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [onOpenChange, open]);

  if (!canOpen) return null;

  const setSort = (sort: { id: string; desc: boolean } | null) => {
    table.setSorting((current) => [
      ...current.filter((item) => item.id !== columnId),
      ...(sort ? [sort] : []),
    ]);
  };

  return (
    <div ref={controlsRef} className="tk-grid-column-controls">
      <button
        ref={triggerRef}
        type="button"
        className="tk-grid-column-menu-trigger"
        aria-label={`Column controls for ${columnLabel}`}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
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
              <button type="button" onClick={() => table.getColumn(columnId)?.pin('left')}>
                Pin {columnLabel} left
              </button>
              <button type="button" onClick={() => table.getColumn(columnId)?.pin('right')}>
                Pin {columnLabel} right
              </button>
              <button type="button" onClick={() => table.getColumn(columnId)?.pin(false)}>
                Unpin {columnLabel}
              </button>
            </div>
          )}
          {controls.visibility && (
            <fieldset className="tk-grid-column-menu-section">
              <legend>Visible columns</legend>
              {columns.map((column) => {
                const id = getColumnId(column);
                return (
                  <label key={id}>
                    <input
                      type="checkbox"
                      aria-label={`Show ${getColumnLabel(column)}`}
                      checked={table.getColumn(id)?.getIsVisible() ?? false}
                      onChange={() => table.getColumn(id)?.toggleVisibility()}
                    />
                    {getColumnLabel(column)}
                  </label>
                );
              })}
            </fieldset>
          )}
          <button
            type="button"
            onClick={() => {
              table.resetColumnOrder();
              table.resetColumnVisibility();
              table.resetColumnPinning();
              table.resetColumnSizing();
            }}
          >
            Reset columns
          </button>
        </div>
      )}
    </div>
  );
}
