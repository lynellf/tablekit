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
});
