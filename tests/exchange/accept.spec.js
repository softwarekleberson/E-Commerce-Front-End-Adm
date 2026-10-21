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

test('admin accepts the first exchange request', async ({ page }) => {
  const env = readEnvFile();
  expect(env.ADMIN_EMAIL, 'ADMIN_EMAIL must be set in .env').toBeTruthy();
  expect(env.ADMIN_PASSWORD, 'ADMIN_PASSWORD must be set in .env').toBeTruthy();

  await page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/login.html');
  await page.getByLabel('Email').fill(env.ADMIN_EMAIL);
  await page.getByLabel('Password').fill(env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();

  await page.goto('/exchange.html');
  const acceptButton = page.getByRole('button', { name: 'Accept' }).first();
  await expect(acceptButton).toBeVisible();

  const reservationId = await acceptButton.getAttribute('onclick');
  expect(reservationId, 'The Accept button must contain its reservation ID').toMatch(/acceptReplacement\('([^']+)'\)/);
  const match = reservationId.match(/acceptReplacement\('([^']+)'\)/);
  const acceptResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().includes(`/adm/replacement/${match[1]}/accept`)
  );

  await acceptButton.click();
  const acceptResponse = await acceptResponsePromise;
  expect(
    acceptResponse.ok(),
    `Backend rejected the exchange request (${acceptResponse.status()}): ${acceptResponse.url()}`
  ).toBeTruthy();
});
