const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

function readEnvFile() {
  const envPath = path.resolve(__dirname, '../../.env');
  const entries = fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return separator < 0
        ? null
        : [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
    })
    .filter(Boolean);

  return Object.fromEntries(entries);
}

async function loginAsAdmin(page) {
  const env = readEnvFile();
  expect(env.ADMIN_EMAIL, 'ADMIN_EMAIL must be set in .env').toBeTruthy();
  expect(env.ADMIN_PASSWORD, 'ADMIN_PASSWORD must be set in .env').toBeTruthy();

  await page.goto('/login.html');
  await page.getByLabel('Email').fill(env.ADMIN_EMAIL);
  await page.getByLabel('Password').fill(env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();
}

function waitForDashboardResponse(page) {
  return page.waitForResponse((response) =>
    response.request().method() === 'GET'
    && response.url().startsWith('http://localhost:8080/adm/dashboard/sales?')
  );
}

test('loads dashboard data for every category from November 2025 to November 2026', async ({ page }) => {
  test.setTimeout(180_000);
  await loginAsAdmin(page);

  const initialResponsePromise = waitForDashboardResponse(page);
  await page.goto('/dashboard.html');
  const initialResponse = await initialResponsePromise;
  expect(
    initialResponse.ok(),
    `Dashboard data request failed (${initialResponse.status()}): ${initialResponse.url()}`
  ).toBeTruthy();

  const categorySelect = page.locator('#category');
  await expect.poll(() => categorySelect.locator('option').count()).toBeGreaterThan(1);
  const categories = await categorySelect.locator('option').evaluateAll((options) =>
    options.map((option) => option.value).filter((value) => value !== 'all')
  );
  expect(categories, 'The dashboard did not load any categories').not.toHaveLength(0);

  await page.getByLabel('Start date').fill('2025-11-25');
  await page.getByLabel('End date').fill('2026-11-26');
  await page.waitForTimeout(3000);

  for (const category of [...categories, 'all']) {
    await categorySelect.selectOption(category);
    const responsePromise = waitForDashboardResponse(page);
    await page.getByRole('button', { name: 'Apply filters' }).click();
    const response = await responsePromise;

    expect(
      response.ok(),
      `Dashboard request for category "${category}" failed (${response.status()}): ${response.url()}`
    ).toBeTruthy();

    const requestUrl = new URL(response.url());
    expect(requestUrl.searchParams.get('startDate')).toBe('2025-11-25');
    expect(requestUrl.searchParams.get('endDate')).toBe('2026-11-26');
    if (category === 'all') {
      expect(requestUrl.searchParams.has('category')).toBe(false);
    } else {
      expect(requestUrl.searchParams.get('category')).toBe(category);
    }

    await page.waitForTimeout(3000);
    if (category === 'all') {
      const chartPaths = page.locator('#chart-series path');
      await expect(chartPaths.first()).toBeVisible();
      await expect.poll(async () => chartPaths.evaluateAll((paths) =>
        paths.some((chartPath) => /\bL\b/.test(chartPath.getAttribute('d') || ''))
      )).toBe(true);
    }
  }
});
