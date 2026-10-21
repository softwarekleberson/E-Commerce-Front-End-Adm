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

test('moves a real item from separation to in transit', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/list-separation.html');

  const transitButtons = page.getByRole('button', { name: 'Send to transit' });
  await expect(transitButtons.first()).toBeVisible();

  const selectedItem = await transitButtons.first().evaluate((button) => ({
    orderId: decodeURIComponent(button.getAttribute('data-order-id') || ''),
    reservationId: decodeURIComponent(button.getAttribute('data-reservation-id') || ''),
  }));
  expect(selectedItem.orderId, 'The selected item has no order ID').not.toBe('-');
  expect(selectedItem.reservationId, 'The selected item has no reservation ID').not.toBe('-');

  const selectedTransitButton = page.locator(
    `.transit-item-button[data-order-id="${encodeURIComponent(selectedItem.orderId)}"][data-reservation-id="${encodeURIComponent(selectedItem.reservationId)}"]`
  );
  const transitResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().includes('/transit/')
  );
  await selectedTransitButton.click();
  const transitResponse = await transitResponsePromise;
  expect(
    transitResponse.ok(),
    `Backend rejected the transit request (${transitResponse.status()}): ${transitResponse.url()}`
  ).toBeTruthy();

  await expect(selectedTransitButton).toHaveCount(0);

  await page.goto('/in-transit.html');
  const matchingTransitItem = page.locator(
    `.delivered-button[data-order-id="${encodeURIComponent(selectedItem.orderId)}"][data-reservation-id="${encodeURIComponent(selectedItem.reservationId)}"]`
  );
  await expect(matchingTransitItem).toBeVisible();
});
