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

  await page.getByRole('button', { name: '暂停' }).click();
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible();
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
});

test('exposes the P1 strategy build and routing controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Place coal source' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place maze producer' })).toBeVisible();
  await expect(page.getByText('先让货物持续出售')).toBeVisible();
  await page.getByLabel('减少动画').check();
  await expect(page.getByRole('button', { name: 'Place gear assembler' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place warehouse' })).toBeVisible();
  await page.getByRole('button', { name: 'Wide line' }).click();
  await expect(page.getByRole('button', { name: 'Wide line' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /source-1/ }).click();
  await expect(page.getByRole('button', { name: 'Route overflow' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upgrade' })).toBeVisible();
});
