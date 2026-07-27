import type { ColumnDef } from '@lynellf/tablekit-react';

export interface SalesRow {
  id: string;
  product: string;
  region: 'North' | 'South' | 'East' | 'West';
  channel: 'Direct' | 'Partner' | 'Online';
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: 2024 | 2025;
  units: number;
  revenue: number;
  margin: number;
  owner: string;
}

const PRODUCTS = [
  'Northwind Desk',
  'Signal Chair',
  'Ledger Lamp',
  'Field Shelf',
  'Archive Cart',
  'Workshop Stool',
] as const;

const REGIONS: SalesRow['region'][] = ['North', 'South', 'East', 'West'];
const CHANNELS: SalesRow['channel'][] = ['Direct', 'Partner', 'Online'];
const QUARTERS: SalesRow['quarter'][] = ['Q1', 'Q2', 'Q3', 'Q4'];
const OWNERS = ['Avery Chen', 'Maya Ortiz', 'Theo Brooks', 'Nina Patel'] as const;

export const salesRows: SalesRow[] = Array.from({ length: 240 }, (_, index) => {
  const units = 8 + ((index * 17) % 73);
  const unitPrice = 125 + (index % PRODUCTS.length) * 47;
  const revenue = units * unitPrice;

  return {
    id: `order-${String(index + 1).padStart(3, '0')}`,
    product: PRODUCTS[index % PRODUCTS.length]!,
    region: REGIONS[index % REGIONS.length]!,
    channel: CHANNELS[index % CHANNELS.length]!,
    quarter: QUARTERS[index % QUARTERS.length]!,
    year: index % 2 === 0 ? 2025 : 2024,
    units,
    revenue,
    margin: Math.round(revenue * (0.27 + (index % 5) * 0.025)),
    owner: OWNERS[index % OWNERS.length]!,
  };
});

export const salesColumns: Array<ColumnDef<SalesRow, unknown>> = [
  {
    id: 'product',
    accessorKey: 'product',
    header: 'Product',
    enableSorting: true,
    sortingFn: 'alphanumeric',
    enableColumnFilter: true,
    filterFn: 'includesString',
    size: 190,
  },
  {
    id: 'region',
    accessorKey: 'region',
    header: 'Region',
    enableSorting: true,
    sortingFn: 'alphanumeric',
    enableColumnFilter: true,
    filterFn: 'includesString',
    size: 120,
  },
  {
    id: 'channel',
    accessorKey: 'channel',
    header: 'Channel',
    enableSorting: true,
    sortingFn: 'alphanumeric',
    enableColumnFilter: true,
    filterFn: 'includesString',
    size: 130,
  },
  {
    id: 'quarter',
    accessorKey: 'quarter',
    header: 'Quarter',
    enableSorting: true,
    sortingFn: 'alphanumeric',
    size: 105,
  },
  {
    id: 'year',
    accessorKey: 'year',
    header: 'Year',
    enableSorting: true,
    sortingFn: 'basic',
    size: 95,
  },
  {
    id: 'units',
    accessorKey: 'units',
    header: 'Units',
    enableSorting: true,
    sortingFn: 'basic',
    size: 100,
  },
  {
    id: 'revenue',
    accessorKey: 'revenue',
    header: 'Revenue',
    enableSorting: true,
    sortingFn: 'basic',
    size: 130,
  },
  {
    id: 'margin',
    accessorKey: 'margin',
    header: 'Margin',
    enableSorting: true,
    sortingFn: 'basic',
    size: 120,
  },
  {
    id: 'owner',
    accessorKey: 'owner',
    header: 'Owner',
    enableSorting: true,
    sortingFn: 'alphanumeric',
    size: 150,
  },
];

export const formatCurrency = (value: unknown): string =>
  typeof value === 'number'
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    : String(value ?? '—');
