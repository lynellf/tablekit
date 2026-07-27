import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(new URL('..', import.meta.url).pathname);
const expectations = {
  pivot: {
    root: ['VERSION'],
    subpaths: [
      'aggregators',
      'engine',
      'serialize',
      'worker',
      'worker/entry',
      'worker/protocol',
      'server',
    ],
  },
  react: {
    root: ['VERSION', 'DataGrid', 'PivotGrid', 'ReactAnnouncer'],
    subpaths: ['validate'],
  },
};

for (const [packageName, expected] of Object.entries(expectations)) {
  const packageDirectory = resolve(root, 'packages', packageName);
  const manifest = JSON.parse(readFileSync(resolve(packageDirectory, 'package.json'), 'utf8'));
  const module = await import(pathToFileURL(resolve(packageDirectory, manifest.module)).href);
  for (const exportName of expected.root) {
    if (!(exportName in module)) {
      throw new Error(`${manifest.name}: missing runtime export ${exportName}`);
    }
  }
  for (const subpath of expected.subpaths) {
    if (!manifest.exports[`./${subpath}`]) {
      throw new Error(`${manifest.name}: missing subpath ./${subpath}`);
    }
  }
  console.log(`✓ ${manifest.name}: v3 public surface verified`);
}
