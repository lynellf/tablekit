import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (fileName: string) =>
  readFileSync(fileURLToPath(new URL(fileName, import.meta.url)), 'utf8');

describe('React package architecture', () => {
  it('builds DataGrid on TanStack instead of tablekit-core', () => {
    const source = [
      readSource('./DataGrid.tsx'),
      readSource('./DataGrid.types.ts'),
      readSource('./DataGridColumnMenu.tsx'),
    ].join('\n');

    expect(source).toContain('@tanstack/react-table');
    expect(source).not.toContain('@lynellf/tablekit-core');
  });

  it('builds PivotGrid row expansion on TanStack instead of tablekit-core', () => {
    const source = [
      readSource('./PivotGrid.tsx'),
      readSource('./PivotGrid.types.ts'),
      readSource('./usePivotTable.tsx'),
    ].join('\n');

    expect(source).toContain('@tanstack/react-table');
    expect(source).not.toContain('@lynellf/tablekit-core');
  });

  it('clips fixed-height pivot column labels to one line', () => {
    const styles = readSource('./styles.css');

    expect(styles).toContain(`.tk-pivot-column-header {
  text-overflow: ellipsis;
  white-space: nowrap;
}`);
  });

  it('keeps focused scrolling cells below pinned grid surfaces', () => {
    const styles = readSource('./styles.css');

    expect(styles).toContain(`.tk-grid-cell:focus,
.tk-pivot-cell:focus {
  z-index: 1;
}`);
    expect(styles).toContain(`.tk-grid-cell.tk-grid-pinned-left:focus,
.tk-grid-cell.tk-grid-pinned-right:focus,
.tk-pivot-cell.tk-pivot-pinned-left:focus,
.tk-pivot-cell.tk-pivot-pinned-right:focus,
.tk-pivot-row-header:focus {
  z-index: 3;
}`);
  });
});
