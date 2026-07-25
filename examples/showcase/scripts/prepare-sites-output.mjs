import { access, cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const hostingConfig = resolve(root, '.openai', 'hosting.json');
const metadataDirectory = resolve(root, 'dist', '.openai');
const serverDirectory = resolve(root, 'dist', 'server');

await rm(metadataDirectory, { recursive: true, force: true });
await mkdir(metadataDirectory, { recursive: true });
await mkdir(serverDirectory, { recursive: true });
await cp(resolve(root, 'worker', 'index.js'), resolve(serverDirectory, 'index.js'));

try {
  await access(hostingConfig);
  await cp(hostingConfig, resolve(metadataDirectory, 'hosting.json'));
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
