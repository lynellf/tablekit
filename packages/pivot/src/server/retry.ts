/**
 * @lynellf/tablekit-pivot/server — retry helper.
 *
 * Re-invoke computeChildren for a path that previously errored.
 * Used by React and server adapters when retrying a failed child request.
 */

import type {
  AggregationEngine,
  FieldValue,
  PivotQuery,
  PivotRowNode,
} from '@lynellf/tablekit-pivot';

/**
 * Re-invoke `computeChildren` for a path that previously errored.
 *
 * @example
 * ```ts
 * import { retryChildren } from '@lynellf/tablekit-pivot/server';
 *
 * const handleRetry = async () => {
 *   const path = ['West', 'Electronics'];
 *   const children = await retryChildren(
 *     engine,
 *     path,
 *     currentQuery,
 *     { signal: new AbortController().signal }
 *   );
 *   // Merge children into the tree...
 * };
 * ```
 */
export const retryChildren = async <TRow>(
  engine: AggregationEngine<TRow>,
  path: Array<FieldValue>,
  q: PivotQuery<TRow>,
  ctx: { signal: AbortSignal },
): Promise<PivotRowNode<TRow>[]> => {
  if (!engine.computeChildren) {
    throw new Error('Engine does not implement computeChildren; retryChildren is a no-op.');
  }
  return engine.computeChildren(path, q, ctx);
};
