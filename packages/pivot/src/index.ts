/**
 * @lynellf/tablekit-pivot — framework-free pivot algorithms and engines.
 */

export const VERSION = '3.0.0' as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  FieldValue,
  RowPathKey,
  LeafColumnId,
  MeasureId,
  FieldRef,
  MeasureDef,
  PivotFilter,
  TotalsConfig,
  PivotConfig,
  PivotExpansionState,
  PivotSortingState,
  Aggregator,
  MaybePromise,
  AggregationEngine,
  SerializedFieldRef,
  SerializedMeasureDef,
  SerializedPivotFilter,
  InlinePivotFilter,
  PivotQueryFilter,
  PivotQuery,
  PivotLeafColumn,
  PivotColumnNode,
  PivotRowNode,
  PivotResult,
} from './types';

// ─── Aggregator re-export (interface only in phase 1) ────────────────────────
export type { Aggregator as AggregatorType } from './aggregators/types';

// ─── Aggregator registry (phase 2) ────────────────────────────────────────────
export {
  sumAggregator,
  countAggregator,
  minAggregator,
  maxAggregator,
  avgAggregator,
  type AvgAccumulator,
  BUILT_IN_AGGREGATORS,
  type BuiltInAggregatorName,
} from './aggregators/builtins';

export {
  registerAggregator,
  getAggregator,
  builtInAggregators,
  nameOfAggregator,
  __resetAggregatorRegistryForTests,
  type AggregatorName,
} from './aggregators/registry';

export {} from './engine';
export {} from './serialize';
