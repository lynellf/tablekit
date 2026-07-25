import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import worker from '../worker/index.js';

test('emits the Storybook reference where Sites binds browser assets', async () => {
  await access(new URL('../dist/client/index.html', import.meta.url));
  await access(new URL('../dist/client/iframe.html', import.meta.url));
  await access(new URL('../dist/client/index.json', import.meta.url));
  await access(new URL('../dist/server/index.js', import.meta.url));
  await access(new URL('../dist/.openai/hosting.json', import.meta.url));
  await assert.rejects(access(new URL('../dist/index.html', import.meta.url)), {
    code: 'ENOENT',
  });

  const html = await readFile(new URL('../dist/client/index.html', import.meta.url), 'utf8');
  const storyIndex = JSON.parse(
    await readFile(new URL('../dist/client/index.json', import.meta.url), 'utf8'),
  );

  assert.match(html, /storybook-root/);
  assert.ok(
    Object.values(storyIndex.entries).some(
      (entry) => entry.type === 'docs' && entry.title === 'Getting Started/Introduction',
    ),
  );
  assert.ok(
    Object.values(storyIndex.entries).some(
      (entry) => entry.type === 'story' && entry.title === 'Components/DataGrid',
    ),
  );
});

test('routes the site root to the built index document', async () => {
  let requestedPath;
  const env = {
    ASSETS: {
      fetch(request) {
        requestedPath = new URL(request.url).pathname;
        return new Response('ok');
      },
    },
  };

  const response = await worker.fetch(new Request('https://tablekit.example/'), env);

  assert.equal(response.status, 200);
  assert.equal(requestedPath, '/index.html');
});
