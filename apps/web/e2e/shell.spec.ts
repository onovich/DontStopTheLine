import { expect, test } from '@playwright/test';

test('loads the official name without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: "Don't Stop The Line" })).toBeVisible();
  await expect(page.getByText('产线别停')).toBeVisible();
  expect(errors).toEqual([]);
});
