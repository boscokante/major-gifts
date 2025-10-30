import { test, expect } from '@playwright/test';

test('dashboard loads and shows KPIs', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Coverage Dashboard')).toBeVisible();
});
