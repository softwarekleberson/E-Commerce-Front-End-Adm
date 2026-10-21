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

let selectedItem;

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

test.describe.configure({ mode: 'serial' });

test('delivers the first real item from the In Transit Action column', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await loginAsAdmin(page);
  await page.goto('/in-transit.html');
  const deliveredButtons = page.locator('.delivered-button');
  await expect(deliveredButtons.first()).toBeVisible();
  selectedItem = await deliveredButtons.first().evaluate((button) => ({
    orderId: decodeURIComponent(button.getAttribute('data-order-id') || ''),
    reservationId: decodeURIComponent(button.getAttribute('data-reservation-id') || ''),
  }));
  expect(selectedItem.orderId, 'The selected item has no order ID').not.toBe('-');
  expect(selectedItem.reservationId, 'The selected item has no reservation ID').not.toBe('-');

  const selectedDeliveryButton = page.locator(
    `.delivered-button[data-order-id="${encodeURIComponent(selectedItem.orderId)}"][data-reservation-id="${encodeURIComponent(selectedItem.reservationId)}"]`
  );
  await expect(selectedDeliveryButton).toBeVisible();
  const deliveryResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().includes('/delivery/')
  );
  await selectedDeliveryButton.click();
  const deliveryResponse = await deliveryResponsePromise;
  expect(
    deliveryResponse.ok(),
    `Backend rejected the delivery request (${deliveryResponse.status()}): ${deliveryResponse.url()}`
  ).toBeTruthy();
  await expect(selectedDeliveryButton).toHaveCount(1);
});

test('confirms the same order appears in delivered orders', async ({ page }) => {
  expect(selectedItem, 'The delivery step must run first').toBeTruthy();
  await loginAsAdmin(page);
  await page.goto('/delivered.html');
  await expect(page.locator('#delivered-orders-body')).toContainText(selectedItem.orderId);
});
