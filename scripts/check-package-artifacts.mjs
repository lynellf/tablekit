import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(new URL('..', import.meta.url).pathname);
const rootVersion = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
const packageNames = ['pivot', 'react'];
const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'tablekit-v3-artifacts-'));

const collectTargets = (value, key, targets = []) => {
  if (!value || typeof value !== 'object') return targets;
  for (const [entryKey, child] of Object.entries(value)) {
    if (entryKey === key && typeof child === 'string') targets.push(child);
    else collectTargets(child, key, targets);
  }
  return targets;
};

try {
  for (const packageName of packageNames) {
    const packageDirectory = resolve(root, 'packages', packageName);
    const manifest = JSON.parse(readFileSync(resolve(packageDirectory, 'package.json'), 'utf8'));
    if (manifest.version !== rootVersion) {
      throw new Error(`${manifest.name}: expected version ${rootVersion}`);
    }

    const typeTargets = new Set([manifest.types, ...collectTargets(manifest.exports, 'types')]);
    for (const target of typeTargets) {
      if (target && !existsSync(resolve(packageDirectory, target))) {
        throw new Error(`${manifest.name}: missing type target ${target}`);
      }
    }

    const importTargets = new Set(collectTargets(manifest.exports, 'import'));
    for (const target of importTargets) {
      const file = resolve(packageDirectory, target);
      if (!existsSync(file)) throw new Error(`${manifest.name}: missing import target ${target}`);
      await import(pathToFileURL(file).href);
    }

    execFileSync('pnpm', ['pack', '--pack-destination', temporaryDirectory], {
      cwd: packageDirectory,
      stdio: 'pipe',
    });
    const archive = execFileSync(
      'find',
      [temporaryDirectory, '-name', `*${packageName}*.tgz`, '-print'],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .at(-1);
    if (!archive) throw new Error(`${manifest.name}: pack did not create an archive`);

    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' });
    if (entries.includes('package/src/') || entries.includes('node_modules')) {
      throw new Error(`${manifest.name}: archive leaked source or node_modules`);
    }

    const packedManifest = JSON.parse(
      execFileSync('tar', ['-xOz', '-f', archive, 'package/package.json'], {
        encoding: 'utf8',
      }),
    );
    const dependencyValues = Object.values({
      ...(packedManifest.dependencies ?? {}),
      ...(packedManifest.peerDependencies ?? {}),
    });
    if (dependencyValues.some((value) => String(value).startsWith('workspace:'))) {
      throw new Error(`${manifest.name}: packed manifest contains workspace protocol`);
    }
    console.log(`✓ ${manifest.name}: exports, declarations, and archive verified`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
