import { expect, test } from '@playwright/test';

test('builds and connects a profitable P0 chain without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: "Don't Stop The Line" })).toBeVisible();
  await page.getByRole('button', { name: '基础加工器' }).click();
  await page
    .getByRole('application', { name: 'Factory board' })
    .click({ position: { x: 470, y: 160 } });
  await expect(page.getByRole('button', { exact: true, name: '加工器' })).toBeVisible();

  await page.getByRole('button', { exact: true, name: '连线' }).click();
  await page.getByRole('button', { exact: true, name: '原料源' }).click();
  await page.getByRole('button', { exact: true, name: '加工器' }).click();
  await page.getByRole('button', { exact: true, name: '连线' }).click();
  await page.getByRole('button', { exact: true, name: '加工器' }).click();
  await page.getByRole('button', { exact: true, name: '售卖站' }).click();

  await expect(page.locator('.money')).not.toHaveText(/\$ 0/, { timeout: 5000 });
  expect(errors).toEqual([]);
});

test('shows a blocking explanation and keeps controls responsive', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { exact: true, name: '原料源' }).click();
  await expect(page.getByText('无法继续输出：请连接售卖站或缓冲仓。')).toBeVisible({
    timeout: 3000,
  });

  await page.getByRole('button', { name: '暂停' }).click();
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible();
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
});

test('previews free legal placement and rejects occupied footprint', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '基础加工器' }).click();
  const board = page.getByRole('application', { name: 'Factory board' });
  await board.hover({ position: { x: 470, y: 160 } });
  await expect(page.getByText('位置合法 · 免费')).toBeVisible();
  await board.hover({ position: { x: 205, y: 300 } });
  await expect(page.getByText('该位置已有设备')).toBeVisible();
});

test('progressively discloses advanced builds and keeps routing controls accessible', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '煤矿源' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '迷宫生产机' })).toHaveCount(0);
  await expect(page.getByText('先让货物持续出售')).toBeVisible();
  await page.getByLabel('减少动画').check();
  await page.getByRole('button', { name: '宽线路' }).click();
  await expect(page.getByRole('button', { name: '宽线路' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { exact: true, name: '原料源' }).click();
  await expect(page.getByRole('button', { name: '优先溢出分流' })).toBeVisible();
  await expect(page.getByRole('button', { name: '升级设备' })).toBeVisible();
});
