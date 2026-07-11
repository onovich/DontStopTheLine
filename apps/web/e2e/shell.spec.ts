import { expect, test } from '@playwright/test';

test('builds and connects a profitable P0 chain without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: "Don't Stop The Line" })).toBeVisible();
  await page.getByRole('button', { name: 'Place processor' }).click();
  await page
    .getByRole('application', { name: 'Factory board' })
    .click({ position: { x: 500, y: 350 } });
  await expect(page.getByRole('button', { name: /processor-3/ })).toBeVisible();

  await page.getByRole('button', { name: 'Connect' }).click();
  await page.getByRole('button', { name: /source-1/ }).click();
  await page.getByRole('button', { name: /processor-3/ }).click();
  await page.getByRole('button', { name: 'Connect' }).click();
  await page.getByRole('button', { name: /processor-3/ }).click();
  await page.getByRole('button', { name: /seller-2/ }).click();

  await expect(page.locator('.money')).not.toHaveText(/\$ 0/, { timeout: 5000 });
  expect(errors).toEqual([]);
});

test('shows a blocking explanation and keeps controls responsive', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /source-1/ }).click();
  await expect(page.getByText(/OUTPUT_FULL:/)).toBeVisible({ timeout: 3000 });

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await page.getByRole('button', { name: '4x' }).click();
  await expect(page.getByRole('button', { name: '4x' })).toHaveAttribute('aria-pressed', 'true');
});
