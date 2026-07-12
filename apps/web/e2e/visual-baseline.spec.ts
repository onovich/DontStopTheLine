import { expect, test } from '@playwright/test';

const viewports = [
  { height: 900, name: '1440x900', width: 1440 },
  { height: 768, name: '1024x768', width: 1024 },
  { height: 1024, name: '768x1024', width: 768 },
  { height: 844, name: '390x844', width: 390 },
] as const;

test.describe('Phase 7 verified visual baseline', () => {
  test.skip(process.env.CAPTURE_PHASE7_BASELINE !== '1', 'Capture is explicit and repeatable.');

  for (const viewport of viewports) {
    test(`captures ${viewport.name} after semantic health checks`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: "Don't Stop The Line" })).toBeVisible();
      await expect(page.getByRole('application', { name: 'Factory board' })).toBeVisible();
      await page.screenshot({
        fullPage: false,
        path: `artifacts/visual/phase-7-before-verified-${viewport.name}.png`,
      });
    });
  }
});
