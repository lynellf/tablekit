# ADR-0001: Adopt TanStack and Remove the Owned Table Core

## Status

Accepted

## Date

2026-07-26

## Context

TableKit currently publishes four packages:

- `@lynellf/tablekit-core`
- `@lynellf/tablekit-pivot`
- `@lynellf/tablekit-react`
- `@lynellf/tablekit-worker`

The original architecture deliberately owned the table state engine, row
pipeline, column model, interaction state, virtualization math, and React
bindings. That decision was recorded in
`docs/table-kit-2.0-parity-assessment-and-spec-v2.md`.

Subsequent implementation spikes showed that the owned table engine is not the
part of TableKit that provides differentiated value. The valuable TableKit
capabilities are:

- pivot configuration and query serialization;
- aggregation and tree construction;
- totals and mergeable aggregators;
- main-thread, worker, and server execution;
- a simple, batteries-included React DataGrid and PivotGrid experience.

Maintaining a second general-purpose table engine diverts effort into behavior
already handled more comprehensively by TanStack Table and TanStack Virtual.
TableKit has one current user and does not need a compatibility period for
hypothetical external consumers.

## Decision

### Remove the owned table engine

Delete `@lynellf/tablekit-core`. Do not retain a compatibility facade,
deprecation package, or renamed copy of the same implementation.

TableKit will stop owning commodity table concerns that TanStack already
provides, including:

- core row models;
- sorting, filtering, pagination, and grouping state;
- selection state;
- column ordering, visibility, pinning, and sizing state;
- expansion state and row-model flattening;
- generic table state subscriptions;
- row and column virtualization math.

### Make the React product TanStack-backed

`@lynellf/tablekit-react` will use:

- `@tanstack/react-table` for table state and row/column models;
- `@tanstack/react-virtual` for row and column virtualization;
- React as a peer dependency.

The public product boundary remains the drop-in `DataGrid` and `PivotGrid`
components, their props, events, slots, styles, and imperative handles.
TableKit may use TanStack types directly where TanStack already defines the
commodity contract. It will not create parallel TableKit types that merely
rename TanStack state.

TableKit-specific React behavior remains owned by `tablekit-react`, including:

- component composition and default rendering;
- accessible grid and treegrid behavior;
- focus and keyboard policy;
- loading, empty, error, and retry presentation;
- server-data request orchestration;
- pivot-result adaptation;
- worker lifecycle integration;
- complete cell and row event contexts;
- field configuration controls and other batteries-included UI.

### Keep the pivot engine framework-free

`@lynellf/tablekit-pivot` will contain only framework-independent pivot domain
and execution concerns:

- pivot configuration;
- aggregators and registries;
- query and result types;
- tree construction;
- pivot sorting and totals;
- serialization and validation;
- main-thread aggregation;
- worker protocol and execution;
- server execution helpers.

It must not import React, DOM types used only for rendering, TanStack React
adapters, or TableKit UI state such as focused cells, column sizing, announcers,
and prop getters.

### Collapse the workspace to two publishable packages

Retain the pnpm workspace and publish:

- `@lynellf/tablekit-pivot`
- `@lynellf/tablekit-react`

Fold `@lynellf/tablekit-worker` into explicit, tree-shakeable pivot subpaths:

- `@lynellf/tablekit-pivot/worker`
- `@lynellf/tablekit-pivot/worker/entry`
- `@lynellf/tablekit-pivot/worker/protocol`
- `@lynellf/tablekit-pivot/server`

`@lynellf/tablekit-react` will depend directly on
`@lynellf/tablekit-pivot`, so the drop-in React installation requires one
TableKit package installation.

### Do not build the imperative renderer now

A framework-agnostic imperative DOM renderer remains a stretch goal. It will
not influence the first TanStack-backed React architecture. If pursued later,
it may use `@tanstack/table-core` and `@tanstack/virtual-core` directly while
sharing TableKit's pivot contracts and configuration normalization.

### Make a direct breaking release

The completed architecture reset will be released as v3.0.0. There will be no
general consumer migration guide, deprecated aliases, or compatibility
release. Historical specifications remain in git or the documentation archive
for context, but they do not constrain the v3 implementation.

## Alternatives Considered

### Continue maintaining `tablekit-core`

Rejected. It preserves the largest maintenance surface while adding the least
differentiated value.

### Keep `tablekit-core` as a thin wrapper around TanStack

Rejected. A wrapper that mirrors TanStack state and APIs would create two
vocabularies, additional type maintenance, and little product value.

TableKit will wrap TanStack only at the higher-level component boundary where
it adds drop-in behavior.

### Convert to a single-package repository

Rejected for now. Pivot computation and React rendering have different runtime
and dependency boundaries. Keeping two packages prevents React and DOM
dependencies from leaking into worker or server execution while preserving a
one-package installation for React users.

### Build an imperative DOM grid first and wrap it with React

Rejected for the current scope. It would make React lifecycle integration
harder and delay the primary drop-in React product.

## Consequences

### Positive

- The owned core, row pipeline, and virtualization implementation disappear.
- TableKit maintenance concentrates on pivot computation and product-level UX.
- DataGrid and PivotGrid gain TanStack's state and row-model behavior.
- The React package can be simpler to install and use.
- Worker and server pivot execution remain framework-free.
- The monorepo reflects actual runtime boundaries rather than historical
  milestones.

### Negative

- Existing v2 headless APIs are deleted.
- The React implementation requires a substantial rewrite.
- TanStack upgrades may require coordinated internal changes.
- TableKit still owns difficult rendered-grid concerns such as accessible
  focus, pinned-region layout, async pivot materialization, and polished
  defaults.
- Worker packaging must preserve browser-safe entry points after consolidation.

## Supersedes

When accepted, this ADR supersedes the build-versus-adopt decision in
`docs/table-kit-2.0-parity-assessment-and-spec-v2.md` section 2.1 and any active
plan that requires retaining `@lynellf/tablekit-core`.

## Implementation

See `docs/tanstack-architecture-reset/plan.md`.
