import { test, expect } from '@playwright/test';

test('has "App - Fuji Money" title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/App - Fuji Money/);
});
