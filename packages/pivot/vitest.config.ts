import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules', '**/dist'],
  },
  resolve: {
    alias: [
      {
        find: /^@lynellf\/tablekit-pivot$/,
        replacement: new URL('./src/index.ts', import.meta.url).pathname,
      },
      {
        find: /^@lynellf\/tablekit-pivot\/(.+)$/,
        replacement: new URL('./src/$1', import.meta.url).pathname,
      },
    ],
  },
});
