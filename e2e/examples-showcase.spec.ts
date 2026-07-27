import { expect, test } from '@playwright/test';

test.describe('Tablekit Storybook', () => {
  test('pairs a live DataGrid with its copyable implementation', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/?path=/docs/components-datagrid--docs');
    await expect(page.getByText('Components', { exact: true })).toBeVisible();
    await expect(page.getByText('DataGrid', { exact: true }).first()).toBeVisible();

    const preview = page.frameLocator('#storybook-preview-iframe');
    await expect(preview.getByText('Rendered component · client data').first()).toBeVisible();
    await expect(
      preview
        .locator('pre')
        .filter({ hasText: "import { DataGrid } from '@lynellf/tablekit-react';" })
        .first(),
    ).toBeVisible();
    const dataGrid = preview.getByRole('grid', { name: 'Client sales data grid' }).first();
    await expect(dataGrid).toBeVisible();
    await expect(dataGrid.getByRole('gridcell', { name: 'Northwind Desk' }).first()).toBeVisible();
    await expect(pageErrors).toEqual([]);
  });

  test('runs the server-backed DataGrid example', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/iframe.html?id=components-datagrid--server-data&viewMode=story');
    await expect(page.getByRole('grid', { name: 'Server sales data grid' })).toBeVisible();
    await expect(page.getByText('Request 1 complete')).toBeVisible();
    await expect(pageErrors).toEqual([]);
  });

  test('keeps the client DataGrid controls and header layout functional', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/iframe.html?id=components-datagrid--client-data&viewMode=story');

    const grid = page.getByRole('grid', { name: 'Client sales data grid' });
    const productHeader = grid.getByRole('columnheader', { name: /Product/ });
    const productFilter = grid.getByRole('textbox', { name: 'Filter product' });
    await productFilter.click();
    const filterBox = await productFilter.boundingBox();
    const headerBox = await productHeader.boundingBox();
    const focusOverflow = await productFilter.evaluate((input) => {
      const style = getComputedStyle(input);
      return Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
    });

    expect(filterBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(filterBox!.y + filterBox!.height + focusOverflow).toBeLessThanOrEqual(
      headerBox!.y + headerBox!.height,
    );

    await grid.getByRole('button', { name: 'Sort product' }).click();
    await expect(productHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(page.locator('.tk-grid-row [data-cell-id$=":product"]').first()).toHaveText(
      'Archive Cart',
    );

    await page.goto('/?path=/story/components-datagrid--client-data');
    await page.getByRole('combobox', { name: 'pageSize' }).selectOption('50');

    const preview = page.frameLocator('#storybook-preview-iframe');
    await expect(preview.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('50');
    await expect(preview.getByText('Page 1 of 5', { exact: true })).toBeVisible();
    await expect(pageErrors).toEqual([]);
  });

  test('runs the opt-in DataGrid column workspace', async ({ page }) => {
    await page.goto('/iframe.html?id=components-datagrid--enhanced-controls&viewMode=story');

    const grid = page.getByRole('grid', { name: 'Enhanced client sales data grid' });
    await grid.getByRole('button', { name: 'Column controls for Product' }).click();
    await page.getByRole('button', { name: 'Sort Product descending' }).click();
    await expect(grid.getByRole('columnheader', { name: /Product/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    await page.getByRole('checkbox', { name: 'Show Owner' }).uncheck();
    await expect(grid.getByRole('columnheader', { name: /Owner/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Reset columns' }).click();
    await expect(grid.getByRole('columnheader', { name: /Owner/ })).toBeVisible();
  });

  test('runs the client, worker, and server pivot engines', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/iframe.html?id=components-pivotgrid--client-data&viewMode=story');
    const clientGrid = page.getByRole('treegrid', { name: 'Client revenue pivot grid' });
    await expect(clientGrid).toBeVisible();
    await expect(clientGrid.getByRole('button', { name: 'Expand North' })).toBeVisible();

    await page.goto('/iframe.html?id=engines-pivot--worker&viewMode=story');
    await expect(page.getByText('Worker ready')).toBeVisible();
    await expect(page.getByRole('treegrid', { name: 'Worker revenue pivot grid' })).toBeVisible();

    await page.goto('/iframe.html?id=engines-pivot--server&viewMode=story');
    const serverGrid = page.getByRole('treegrid', { name: 'Server revenue pivot grid' });
    await expect(serverGrid).toBeVisible();
    await expect(serverGrid.getByRole('button', { name: 'Expand North' })).toBeVisible();
    await expect(pageErrors).toEqual([]);
  });

  test('documents PivotGrid installation, configuration, and sorting behavior', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/?path=/docs/components-pivotgrid--docs');

    const preview = page.frameLocator('#storybook-preview-iframe');
    await expect(preview.getByRole('heading', { name: 'Install' })).toBeVisible();
    await expect(preview.locator('#configure-the-pivot')).toBeVisible();
    await expect(preview.getByRole('heading', { name: 'Sorting' })).toBeVisible();
    await expect(
      preview.getByText('@lynellf/tablekit-pivot', { exact: true }).first(),
    ).toBeVisible();
    await expect(preview.getByText(/header-click sorting is not currently wired/i)).toBeVisible();
    await expect(pageErrors).toEqual([]);
  });

  test('reconfigures pivot hierarchies, filters, and aggregation from Storybook controls', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/?path=/story/components-pivotgrid--client-data');

    await page
      .getByRole('combobox', { name: 'primaryRowField' })
      .selectOption({ label: 'Channel' });
    await page
      .getByRole('combobox', { name: 'secondaryRowField' })
      .selectOption({ label: 'Region' });
    await page
      .getByRole('combobox', { name: 'primaryColumnField' })
      .selectOption({ label: 'Quarter' });
    await page
      .getByRole('combobox', { name: 'secondaryColumnField' })
      .selectOption({ label: 'Year' });
    await page.getByRole('combobox', { name: 'regionFilter' }).selectOption({ label: 'North' });
    await page.getByRole('combobox', { name: 'measure' }).selectOption({ label: 'Margin' });
    await page.getByRole('combobox', { name: 'aggregation' }).selectOption({ label: 'Average' });

    const preview = page.frameLocator('#storybook-preview-iframe');
    const grid = preview.getByRole('treegrid', { name: 'Client revenue pivot grid' });
    await expect(grid.getByRole('button', { name: 'Expand Direct' })).toBeVisible();
    await expect(grid.getByRole('columnheader', { name: 'Q1' })).toBeVisible();
    await expect(preview.getByText('Channel → Region', { exact: true })).toBeVisible();
    await expect(preview.getByText('Quarter → Year', { exact: true })).toBeVisible();
    await expect(
      preview.getByLabel('Active pivot configuration').getByText('Average of Margin', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(preview.getByText('Region = North', { exact: true })).toBeVisible();
    await expect(pageErrors).toEqual([]);
  });

  test('reconfigures a pivot from the built-in field builder', async ({ page }) => {
    await page.goto('/iframe.html?id=components-pivotgrid--built-in-configurator&viewMode=story');

    const controls = page.getByRole('complementary', { name: 'Pivot controls' });
    const grid = page.getByRole('treegrid', { name: 'Configurable revenue pivot grid' });
    await expect(controls).toBeVisible();
    await expect(grid).toBeVisible();

    await controls
      .getByRole('combobox', { name: 'Aggregation for revenue_sum' })
      .selectOption('avg');
    await controls.getByRole('combobox', { name: 'Filter field' }).selectOption('region');
    await controls.getByRole('textbox', { name: 'Filter value' }).fill('North');
    await controls.getByRole('button', { name: 'Add filter' }).click();

    await expect(grid.getByRole('button', { name: 'Expand North' })).toBeVisible();
    await expect(grid.getByRole('button', { name: 'Expand South' })).toHaveCount(0);
  });
});
