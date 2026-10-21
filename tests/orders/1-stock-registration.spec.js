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

test('admin logs in and submits the requested stock entry', async ({ page }) => {
  const env = readEnvFile();
  expect(env.ADMIN_EMAIL, 'ADMIN_EMAIL must be set in .env').toBeTruthy();
  expect(env.ADMIN_PASSWORD, 'ADMIN_PASSWORD must be set in .env').toBeTruthy();

  const loginPayloads = [];
  const stockRequests = [];

  // Mock the API so this UI test never changes the real inventory.
  await page.route('http://localhost:8080/auth/login', async (route) => {
    loginPayloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'playwright-test-token' }),
    });
  });

  await page.route('http://localhost:8080/adm/stock/input', async (route) => {
    stockRequests.push({
      payload: route.request().postDataJSON(),
      authorization: route.request().headers().authorization,
    });
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'playwright-stock-entry' }),
    });
  });

  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/login.html');
  await page.getByLabel('Email').fill(env.ADMIN_EMAIL);
  await page.getByLabel('Password').fill(env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  expect(loginPayloads).toEqual([{ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }]);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token')))
    .toBe('playwright-test-token');

  await page.goto('/stock.html');
  await page.getByLabel('Product ID').fill('a0e16dd4-2cd8-465d-b79d-094e3510cdf5');
  await page.getByLabel('Quantity').fill('100');
  await page.getByLabel('Product Quality').selectOption('NEW');
  await page.getByLabel('Purchase Price').fill('15');
  await page.getByLabel('Currency').selectOption('DOLAR');
  await page.getByLabel('Supplier').fill('Tec Lider');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL(/\/index\.html$/);
  expect(stockRequests).toEqual([{
    payload: {
      productId: 'a0e16dd4-2cd8-465d-b79d-094e3510cdf5',
      quantity: 100,
      productQuality: 'NEW',
      purchasePrice: 15,
      coin: 'DOLAR',
      supplier: 'Tec Lider',
    },
    authorization: 'Bearer playwright-test-token',
  }]);
});
