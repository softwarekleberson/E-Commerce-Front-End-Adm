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

  page.on('dialog', (dialog) => dialog.accept());
  page.on('request', (request) => {
    if (request.url().endsWith('/auth/login')) {
      loginPayloads.push(request.postDataJSON());
    }

    if (request.url().endsWith('/adm/stock/input')) {
      stockRequests.push({
        payload: request.postDataJSON(),
        hasAuthorization: Boolean(request.headers().authorization),
      });
    }
  });

  await page.goto('/login.html');
  await page.getByLabel('Email').fill(env.ADMIN_EMAIL);
  await page.getByLabel('Password').fill(env.ADMIN_PASSWORD);
  const loginResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' && response.url().endsWith('/auth/login')
  );
  await page.getByRole('button', { name: 'Sign In' }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok(), `Login failed with HTTP ${loginResponse.status()}`).toBeTruthy();
  await expect(page).toHaveURL(/\/index\.html$/);
  expect(loginPayloads).toEqual([{ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }]);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token')))
    .toBeTruthy();

  await page.goto('/stock.html');
  await page.getByLabel('Product ID').fill('a0e16dd4-2cd8-465d-b79d-094e3510cdf5');
  await page.getByLabel('Quantity').fill('100');
  await page.getByLabel('Product Quality').selectOption('NEW');
  await page.getByLabel('Purchase Price').fill('15');
  await page.getByLabel('Currency').selectOption('DOLAR');
  await page.getByLabel('Supplier').fill('Tec Lider');
  const stockResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' && response.url().endsWith('/adm/stock/input')
  );
  await page.getByRole('button', { name: 'Submit' }).click();
  const stockResponse = await stockResponsePromise;
  expect(
    stockResponse.ok(),
    `Stock registration failed with HTTP ${stockResponse.status()}`
  ).toBeTruthy();

  await expect(page).toHaveURL(/\/index\.html$/);
  expect(stockRequests).toHaveLength(1);
  expect(stockRequests[0].payload).toEqual({
    productId: 'a0e16dd4-2cd8-465d-b79d-094e3510cdf5',
    quantity: 100,
    productQuality: 'NEW',
    purchasePrice: 15,
    coin: 'DOLAR',
    supplier: 'Tec Lider',
  });
  expect(stockRequests[0].hasAuthorization).toBe(true);
});
