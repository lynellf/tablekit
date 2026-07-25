# Spec: Tablekit Examples Showcase

## Objective

Create a static Storybook reference that lets maintainers and consumers visually verify the
current `@lynellf/tablekit-*` packages while reading the exact implementation beside each live
result. The site is a reference implementation, not a claim of Webix or AG Grid API compatibility.

The first release must make these package paths observable through working examples:

- `@lynellf/tablekit-core` and `@lynellf/tablekit-core/dataSource`
- `@lynellf/tablekit-react` and its stylesheet export
- `@lynellf/tablekit-pivot`
- `@lynellf/tablekit-worker` and `@lynellf/tablekit-worker/server`

## Tech Stack

- Storybook 10 with React 19 and TypeScript
- Storybook's Vite 5 builder
- Existing workspace packages and test tooling
- Plain CSS using a small reference-specific token system

The Storybook workspace requires Node 20.19 or newer; the published libraries retain their existing
runtime support contract.

## Commands

- Develop: `pnpm examples:dev`
- Build: `pnpm examples:build`
- Preview: `pnpm examples:preview`
- Browser tests: `pnpm examples:test`
- Full repository verification: `pnpm verify`

## Project Structure

- `examples/showcase/.storybook/` — manager theme, preview decorators, and build configuration
- `examples/showcase/src/*.stories.tsx` — component and engine reference pages
- `examples/showcase/src/` — example components, deterministic datasets, and worker entry
- `examples/showcase/scripts/prepare-sites-output.mjs` — static hosting metadata assembly
- `e2e/examples-showcase.spec.ts` — critical browser flows

## Code Style

Keep example components explicit and local. Import component files as raw text for Storybook's
source block so the displayed implementation cannot drift from the rendered example. Prefer
semantic controls and derive display state during render.

```tsx
<button
  type="button"
  aria-pressed={activeExample === example.id}
  onClick={() => setActiveExample(example.id)}
>
  {example.label}
</button>
```

Use stable row IDs, labelled form controls, keyboard-operable actions, and no inline layout
styles.

## Testing Strategy

- Existing package tests remain the authority for table and pivot logic.
- Browser tests verify a Docs page contains both the live canvas and its visible source, then
  exercise the client DataGrid, client PivotGrid, server DataGrid, worker engine, and server engine
  without page errors.
- Hosting tests verify the static Storybook manager, preview iframe, story index, Sites worker, and
  hosting metadata all land at the expected paths.
- `pnpm verify` retains the isolated tarball compilation/import gate for all public subpaths.

## Boundaries

- Always: consume workspace packages by their public exports, use deterministic data, keep the
  static build host-agnostic, and show clear loading/error states.
- Ask first: add analytics, a remote data source, or a new runtime UI dependency.
- Never: copy package source into the app, claim drop-in compatibility, depend on repository
  path aliases, or publish packages as part of this task.

## Success Criteria

- The root workspace name is `tablekit`.
- A single static Storybook presents working DataGrid, PivotGrid, server-data, and worker-engine
  stories with searchable navigation.
- Every Docs page presents its live canvas and exact copyable TypeScript source together.
- Supported presentation inputs are adjustable through Storybook Controls.
- Each example identifies the public package paths it exercises.
- The worker example performs aggregation off the main thread and reports a visible result.
- A production build succeeds and the critical examples pass in a real browser with no console
  errors.
- The current packed artifacts continue to compile and import from isolated consumer fixtures.

## Implementation Tasks

1. Align workspace metadata and add showcase scripts/workspace registration.
2. Configure and brand the Storybook manager, Docs canvas, source panels, and Controls.
3. Add client DataGrid and PivotGrid stories.
4. Add server DataGrid and worker/server engine stories.
5. Add static-host and browser verification, then publish the validated Storybook.

## Open Questions

None for the first Storybook release. A future iteration can add more state variants and interaction
tests as the public component surface grows.
