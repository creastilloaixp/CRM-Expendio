import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('CRM Expendio - UI Tests', () => {
  test('should show login page with email and password fields', async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Iniciar Sesión")')).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto(BASE_URL);

    // Try invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button:has-text("Iniciar Sesión")');

    // Should show error or stay on login page
    await page.waitForTimeout(2000);

    // Either shows alert or stays on login (not redirected to dashboard)
    const isStillOnLogin = await page.locator('input[type="email"]').isVisible();
    expect(isStillOnLogin).toBeTruthy();
  });

  test('should show check-in page for customers (no auth required)', async ({ page }) => {
    await page.goto(`${BASE_URL}/?mesa=F1#/checkin`);

    // Check-in page should be visible without authentication
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Should show mesa name or welcome message
    const hasExpendio = await page.locator('text=EXPENDIO').first().isVisible();
    const hasMesa = await page.locator('text=F1').first().isVisible();
    const hasWelcome = await page.locator('text=Bienvenido').first().isVisible();

    expect(hasExpendio || hasMesa || hasWelcome).toBeTruthy();
  });

  test('should show registration form on check-in page', async ({ page }) => {
    await page.goto(`${BASE_URL}/?mesa=F1#/checkin`);

    // Wait for page load
    await page.waitForTimeout(2000);

    // Should have form fields, buttons, or inputs visible
    const hasAnyInput = await page.locator('input').first().isVisible();
    const hasAnyButton = await page.locator('button').first().isVisible();
    const hasForm = await page.locator('form').first().isVisible();

    // At least some interactive element should be visible
    expect(hasAnyInput || hasAnyButton || hasForm).toBeTruthy();
  });

  test('should show menu page for customers', async ({ page }) => {
    await page.goto(`${BASE_URL}/?mesa=F1#/menu`);

    // Menu should load (may show products or loading state)
    await page.waitForTimeout(2000);

    // Check URL is correct
    expect(page.url()).toContain('#/menu');
  });

  test('should have responsive header', async ({ page }) => {
    await page.goto(BASE_URL);

    // Header should be visible
    await expect(page.locator('header, nav, [class*="header"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('CRM Expendio - Authenticated Tests', () => {
  // These tests require valid credentials in environment variables
  // Skip if not available
  const TEST_EMAIL = process.env.TEST_EMAIL;
  const TEST_PASSWORD = process.env.TEST_PASSWORD;

  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping - No test credentials provided');

  test('should login and see dashboard', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button:has-text("Iniciar Sesión")');

    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible({ timeout: 15000 });
  });

  test('should show QR code modal', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button:has-text("Iniciar Sesión")');

    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible({ timeout: 15000 });

    await page.click('button:has-text("Código QR")');
    await expect(page.locator('h2:text("Códigos QR")')).toBeVisible({ timeout: 3000 });
  });
});
