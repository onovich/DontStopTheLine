import { expect, test } from '@playwright/test';

const viewports = [
  { height: 900, name: '1440x900', width: 1440 },
  { height: 768, name: '1024x768', width: 1024 },
  { height: 1024, name: '768x1024', width: 768 },
  { height: 844, name: '390x844', width: 390 },
] as const;
const capturePrefix = process.env.CAPTURE_PHASE7_PREFIX ?? 'phase-7-before-verified';

test.describe('Phase 7 verified visual baseline', () => {
  test.skip(process.env.CAPTURE_PHASE7_BASELINE !== '1', 'Capture is explicit and repeatable.');

  for (const viewport of viewports) {
    test(`captures ${viewport.name} after semantic health checks`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: "Don't Stop The Line" })).toBeVisible();
      await expect(page.getByRole('application', { name: 'Factory board' })).toBeVisible();
      await expect(page.getByRole('button', { exact: true, name: '原料源' })).toBeVisible();
      await expect(page.getByRole('button', { exact: true, name: '售卖站' })).toBeVisible();
      await expect(page.getByLabel('设备检查器')).toHaveCount(0);
      await page.screenshot({
        fullPage: false,
        path: `artifacts/visual/${capturePrefix}-${viewport.name}.png`,
      });
    });
  }

  test('captures the mobile build sheet and Escape close path', async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto('/');
    await page.getByRole('button', { name: '建造设备' }).click();
    await expect(page.getByRole('dialog', { name: '建造目录' })).toBeVisible();
    await expect(page.getByRole('button', { name: '铁矿源' })).toBeVisible();
    await expect(page.getByText(/解锁预告：\$10/)).toBeVisible();
    await page.screenshot({
      path: `artifacts/visual/${capturePrefix}-build-sheet-open-390x844.png`,
    });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: '建造目录' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '建造设备' })).toBeFocused();
  });
});
