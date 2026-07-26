# Keyboard column reorder recipe

> Last verified against tablekit v2.2.0.

## Rendered DataGrid

```tsx
<DataGrid rows={rows} columns={columns} columnControls={{ reorder: true }} />;
```

Focus a `Reorder {Column}` button and use:

1. Space to grab.
2. Left or Right to choose a target position.
3. Space or Enter to commit.
4. Escape to cancel.

The handle exposes `aria-pressed` while grabbed and announces grab, target, commit, and cancel transitions.

## Headless rendering

Keep `{ id, targetIndex }` in component state. While grabbed, prevent the header's normal arrow-key navigation. Update only `targetIndex` for arrows; call `table.moveColumn(id, targetIndex)` only when the user commits. Escape should clear the preview without mutating table state.

## Pitfalls

- Keep focus on the handle while previewing the target.
- Announce one-based positions to users even though the API index is zero-based.
- Do not mutate the real order on every arrow press if Escape is expected to cancel.
- Use the table announcer rather than adding an unrelated live region.

## Verification

- `packages/react/src/DataGrid.test.tsx`
- `examples/showcase/src/EnhancedDataGridExample.tsx`
