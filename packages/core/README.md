# @lynellf/tablekit-core

Framework-agnostic headless table state engine, row pipeline, column model, and event system.

## Install

```bash
npm install @lynellf/tablekit-core
```

Requires Node ≥ 20.

## Usage

```ts
import { createDataTable } from '@lynellf/tablekit-core';

const table = createDataTable({ data, columns });
```

## Status

v2.2.0 — stable framework-agnostic state engine used by the rendered React grids.

## Packages

| Package | Description |
|---|---|
| [`@lynellf/tablekit-react`](/packages/react) | React hooks, prop getters, announcer, and a11y validator built on top of `@lynellf/tablekit-core`. |
| [`@lynellf/tablekit-pivot`](/packages/pivot) | PivotTable primitives and aggregation engine. |
| [`@lynellf/tablekit-worker`](/packages/worker) | Worker-based pivot engine for off-thread aggregation. |

## Bugs & Issues

https://github.com/lynellf/table-kit/issues

## License

[MIT](./LICENSE)
