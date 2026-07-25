import type { FieldRef, MeasureDef, PivotConfig, PivotFilter } from '@lynellf/tablekit-pivot';
import { type DragEvent, useState } from 'react';
import type { PivotGridControlField, PivotGridControls } from './PivotGrid.types';

const DEFAULT_AGGREGATORS = ['sum', 'count', 'min', 'max', 'avg'];
const DIMENSION_ZONES = ['rows', 'columns'] as const;
type DimensionZone = (typeof DIMENSION_ZONES)[number];

interface DragPayload {
  source: DimensionZone | 'measures' | 'filters' | 'available';
  field: string;
  index?: number;
}

interface PivotFieldBuilderProps<TRow> {
  config: PivotConfig<TRow>;
  controls: PivotGridControls;
  data: TRow[];
  onChange: (updater: (current: PivotConfig<TRow>) => PivotConfig<TRow>) => void;
}

const fieldName = <TRow,>(field: FieldRef<TRow>): string =>
  typeof field === 'string' ? field : field.field;

const getLabel = (field: string, fields: PivotGridControlField[]): string =>
  fields.find((candidate) => candidate.field === field)?.label ?? field;

const inferFields = <TRow,>(data: TRow[]): PivotGridControlField[] => {
  const row = data.find((candidate) => candidate !== null && typeof candidate === 'object');
  return row
    ? Object.keys(row as Record<string, unknown>).map((field) => ({
        field,
        label: `${field.charAt(0).toUpperCase()}${field.slice(1)}`,
      }))
    : [];
};

const readPayload = (event: DragEvent<HTMLElement>): DragPayload | null => {
  try {
    return JSON.parse(
      event.dataTransfer.getData('application/x-tablekit-pivot-field'),
    ) as DragPayload;
  } catch {
    return null;
  }
};

const startDrag = (event: DragEvent<HTMLElement>, payload: DragPayload) => {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-tablekit-pivot-field', JSON.stringify(payload));
};

const removeAt = <T,>(values: T[], index: number): T[] =>
  values.filter((_, candidateIndex) => candidateIndex !== index);

const moveWithin = <T,>(values: T[], from: number, to: number): T[] => {
  const value = values[from];
  if (value === undefined || from === to) return values;
  const remaining = removeAt(values, from);
  const target = Math.max(0, Math.min(remaining.length, to));
  return [...remaining.slice(0, target), value, ...remaining.slice(target)];
};

const parseFilterValue = <TRow,>(
  data: TRow[],
  field: string,
  operator: 'equals' | 'in' | 'notIn' | 'range' | 'contains',
  value: string,
): unknown => {
  const sample = data
    .map((row) => (row as Record<string, unknown>)[field])
    .find((candidate) => candidate !== null && candidate !== undefined);
  const parseOne = (candidate: string): unknown => {
    const trimmed = candidate.trim();
    if (typeof sample === 'number' && trimmed !== '') return Number(trimmed);
    if (typeof sample === 'boolean') return trimmed === 'true';
    return trimmed;
  };
  if (operator === 'in' || operator === 'notIn' || operator === 'range') {
    return value.split(',').map(parseOne);
  }
  return parseOne(value);
};

const nextMeasureId = <TRow,>(
  measures: Array<MeasureDef<TRow>>,
  field: string,
  aggregator: string,
): string => {
  const base = `${field}_${aggregator}`;
  if (!measures.some((measure) => measure.id === base)) return base;
  let suffix = 2;
  while (measures.some((measure) => measure.id === `${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
};

export function PivotFieldBuilder<TRow>({
  config,
  controls,
  data,
  onChange,
}: PivotFieldBuilderProps<TRow>) {
  const fields = controls.fields?.length ? controls.fields : inferFields(data);
  const aggregators = controls.aggregators?.length ? controls.aggregators : DEFAULT_AGGREGATORS;
  const firstField = fields[0]?.field ?? '';
  const [rowField, setRowField] = useState(firstField);
  const [columnField, setColumnField] = useState(firstField);
  const [measureField, setMeasureField] = useState(firstField);
  const [measureAggregator, setMeasureAggregator] = useState(aggregators[0] ?? 'sum');
  const [filterField, setFilterField] = useState(firstField);
  const [filterOperator, setFilterOperator] = useState<
    'equals' | 'in' | 'notIn' | 'range' | 'contains'
  >('equals');
  const [filterValue, setFilterValue] = useState('');

  const moveDimension = (payload: DragPayload, target: DimensionZone, targetIndex?: number) => {
    onChange((current) => {
      const sourceIndex = payload.index ?? -1;
      const sourceValue =
        payload.source === 'rows' || payload.source === 'columns'
          ? current[payload.source][sourceIndex]
          : payload.field;
      if (!sourceValue) return current;

      let rows = current.rows;
      let columns = current.columns;
      if (payload.source === 'rows') rows = removeAt(rows, sourceIndex);
      if (payload.source === 'columns') columns = removeAt(columns, sourceIndex);

      const targetValues = target === 'rows' ? rows : columns;
      const withoutDuplicate = targetValues.filter(
        (candidate) => fieldName(candidate) !== payload.field,
      );
      const insertionIndex = Math.max(
        0,
        Math.min(withoutDuplicate.length, targetIndex ?? withoutDuplicate.length),
      );
      const nextTarget = [
        ...withoutDuplicate.slice(0, insertionIndex),
        sourceValue,
        ...withoutDuplicate.slice(insertionIndex),
      ];
      return {
        ...current,
        rows: target === 'rows' ? nextTarget : rows,
        columns: target === 'columns' ? nextTarget : columns,
      };
    });
  };

  const moveMeasure = (payload: DragPayload, targetIndex?: number) => {
    onChange((current) => {
      const sourceIndex = payload.index ?? -1;
      const existing = payload.source === 'measures' ? current.measures[sourceIndex] : undefined;
      const measure =
        existing ??
        ({
          id: nextMeasureId(current.measures, payload.field, measureAggregator),
          field: payload.field,
          aggregator: measureAggregator,
          label: getLabel(payload.field, fields),
        } satisfies MeasureDef<TRow>);
      const remaining =
        payload.source === 'measures' ? removeAt(current.measures, sourceIndex) : current.measures;
      const insertionIndex = Math.max(
        0,
        Math.min(remaining.length, targetIndex ?? remaining.length),
      );
      return {
        ...current,
        measures: [
          ...remaining.slice(0, insertionIndex),
          measure,
          ...remaining.slice(insertionIndex),
        ],
      };
    });
  };

  const renderFieldOptions = () =>
    fields.map((field) => (
      <option key={field.field} value={field.field}>
        {field.label ?? field.field}
      </option>
    ));

  const renderDimensionZone = (
    zone: DimensionZone,
    title: string,
    selectorLabel: string,
    selectedField: string,
    setSelectedField: (value: string) => void,
  ) => (
    <section
      className="tk-pivot-control-zone"
      role="group"
      aria-label={`${title.slice(0, -1)} hierarchy`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const payload = readPayload(event);
        if (payload) moveDimension(payload, zone);
      }}
    >
      <h3>{title}</h3>
      <div className="tk-pivot-control-list">
        {config[zone].map((field, index) => {
          const name = fieldName(field);
          const label = getLabel(name, fields);
          return (
            <div
              key={name}
              className="tk-pivot-control-item"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const payload = readPayload(event);
                if (payload) moveDimension(payload, zone, index);
              }}
            >
              <button
                type="button"
                className="tk-pivot-drag-handle"
                aria-label={`Reorder ${label} in ${zone}`}
                draggable
                onDragStart={(event) => startDrag(event, { source: zone, field: name, index })}
              >
                ⋮⋮
              </button>
              <span className="tk-pivot-control-item-label">{label}</span>
              <select
                aria-label={`Move ${label} to`}
                value={zone}
                onChange={(event) =>
                  moveDimension(
                    { source: zone, field: name, index },
                    event.currentTarget.value as DimensionZone,
                  )
                }
              >
                <option value="rows">Rows</option>
                <option value="columns">Columns</option>
              </select>
              <button
                type="button"
                aria-label={`Move ${label} up in ${zone}`}
                disabled={index === 0}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    [zone]: moveWithin(current[zone], index, index - 1),
                  }))
                }
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${label} down in ${zone}`}
                disabled={index === config[zone].length - 1}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    [zone]: moveWithin(current[zone], index, index + 1),
                  }))
                }
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove ${label} from ${zone}`}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    [zone]: removeAt(current[zone], index),
                  }))
                }
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <div className="tk-pivot-control-add">
        <select
          aria-label={selectorLabel}
          value={selectedField}
          onChange={(event) => setSelectedField(event.currentTarget.value)}
        >
          {renderFieldOptions()}
        </select>
        <button
          type="button"
          aria-label={`Add ${zone === 'rows' ? 'row' : 'column'} field`}
          disabled={!selectedField}
          onClick={() => moveDimension({ source: 'available', field: selectedField }, zone)}
        >
          Add
        </button>
      </div>
    </section>
  );

  return (
    <aside
      className="tk-pivot-controls"
      aria-label="Pivot controls"
      data-position={controls.position ?? 'right'}
    >
      <h2>Configure pivot</h2>
      <section className="tk-pivot-control-zone" aria-label="Available fields">
        <h3>Fields</h3>
        <div className="tk-pivot-available-fields">
          {fields.map((field) => (
            <button
              key={field.field}
              type="button"
              draggable
              onDragStart={(event) => startDrag(event, { source: 'available', field: field.field })}
            >
              {field.label ?? field.field}
            </button>
          ))}
        </div>
      </section>

      {renderDimensionZone('rows', 'Rows', 'Rows field', rowField, setRowField)}
      {renderDimensionZone('columns', 'Columns', 'Columns field', columnField, setColumnField)}

      <section
        className="tk-pivot-control-zone"
        role="group"
        aria-label="Values"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const payload = readPayload(event);
          if (payload) moveMeasure(payload);
        }}
      >
        <h3>Values</h3>
        <div className="tk-pivot-control-list">
          {config.measures.map((measure, index) => {
            const label = getLabel(measure.field ?? measure.id, fields);
            return (
              <div
                key={measure.id}
                className="tk-pivot-control-item"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const payload = readPayload(event);
                  if (payload) moveMeasure(payload, index);
                }}
              >
                <button
                  type="button"
                  className="tk-pivot-drag-handle"
                  aria-label={`Reorder ${label} value`}
                  draggable
                  onDragStart={(event) =>
                    startDrag(event, {
                      source: 'measures',
                      field: measure.field ?? measure.id,
                      index,
                    })
                  }
                >
                  ⋮⋮
                </button>
                <span className="tk-pivot-control-item-label">{label}</span>
                <select
                  aria-label={`Aggregation for ${measure.id}`}
                  value={typeof measure.aggregator === 'string' ? measure.aggregator : 'sum'}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      measures: current.measures.map((candidate) =>
                        candidate.id === measure.id
                          ? { ...candidate, aggregator: event.currentTarget.value }
                          : candidate,
                      ),
                    }))
                  }
                >
                  {aggregators.map((aggregator) => (
                    <option key={aggregator} value={aggregator}>
                      {aggregator}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${label} value`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      measures: removeAt(current.measures, index),
                    }))
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="tk-pivot-control-add">
          <select
            aria-label="Values field"
            value={measureField}
            onChange={(event) => setMeasureField(event.currentTarget.value)}
          >
            {renderFieldOptions()}
          </select>
          <select
            aria-label="Values aggregation"
            value={measureAggregator}
            onChange={(event) => setMeasureAggregator(event.currentTarget.value)}
          >
            {aggregators.map((aggregator) => (
              <option key={aggregator} value={aggregator}>
                {aggregator}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Add value"
            disabled={!measureField}
            onClick={() => moveMeasure({ source: 'available', field: measureField })}
          >
            Add
          </button>
        </div>
      </section>

      <section
        className="tk-pivot-control-zone"
        role="group"
        aria-label="Filters"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const payload = readPayload(event);
          if (!payload) return;
          if (payload.source === 'filters' && payload.index !== undefined) {
            onChange((current) => ({
              ...current,
              filters: moveWithin(
                current.filters ?? [],
                payload.index ?? 0,
                (current.filters ?? []).length,
              ),
            }));
          } else {
            setFilterField(payload.field);
          }
        }}
      >
        <h3>Filters</h3>
        <div className="tk-pivot-control-list">
          {(config.filters ?? []).map((filter, index) => {
            const label = 'field' in filter ? getLabel(filter.field, fields) : 'Custom filter';
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: PivotFilter has no stable identity field.
                key={`${label}:${index}`}
                className="tk-pivot-control-item"
              >
                {'field' in filter && (
                  <button
                    type="button"
                    className="tk-pivot-drag-handle"
                    aria-label={`Reorder ${label} filter`}
                    draggable
                    onDragStart={(event) =>
                      startDrag(event, { source: 'filters', field: filter.field, index })
                    }
                  >
                    ⋮⋮
                  </button>
                )}
                <span className="tk-pivot-control-item-label">
                  {label}
                  {'field' in filter ? ` ${filter.op} ${String(filter.value)}` : ''}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${label} filter`}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      filters: removeAt(current.filters ?? [], index),
                    }))
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="tk-pivot-control-add tk-pivot-filter-add">
          <select
            aria-label="Filter field"
            value={filterField}
            onChange={(event) => setFilterField(event.currentTarget.value)}
          >
            {renderFieldOptions()}
          </select>
          <select
            aria-label="Filter operator"
            value={filterOperator}
            onChange={(event) =>
              setFilterOperator(
                event.currentTarget.value as 'equals' | 'in' | 'notIn' | 'range' | 'contains',
              )
            }
          >
            <option value="equals">equals</option>
            <option value="contains">contains</option>
            <option value="in">in</option>
            <option value="notIn">not in</option>
            <option value="range">range</option>
          </select>
          <input
            aria-label="Filter value"
            value={filterValue}
            onChange={(event) => setFilterValue(event.currentTarget.value)}
          />
          <button
            type="button"
            aria-label="Add filter"
            disabled={!filterField}
            onClick={() => {
              const filter: PivotFilter<TRow> = {
                field: filterField,
                op: filterOperator,
                value: parseFilterValue(data, filterField, filterOperator, filterValue),
              };
              onChange((current) => ({
                ...current,
                filters: [...(current.filters ?? []), filter],
              }));
            }}
          >
            Add
          </button>
        </div>
      </section>
    </aside>
  );
}
