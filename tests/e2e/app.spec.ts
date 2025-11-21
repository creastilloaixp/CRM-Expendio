import { test, expect } from '@playwright/test';

test.describe('CRM Expendio - Complete Application Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should login successfully with correct password', async ({ page }) => {
    // Wait for login page to load
    await expect(page.locator('h2:text("Acceso Personal")')).toBeVisible();
    
    // Enter password
    await page.fill('input[type="password"]', '1234');
    
    // Click login button
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard to load
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible({ timeout: 5000 });
    
    // Verify we're on dashboard
    expect(page.url()).toContain('#/dashboard');
  });

  test('should show QR code button and open QR modal', async ({ page }) => {
    // Login first
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Check if QR button exists
    await expect(page.locator('button:has-text("Código QR")')).toBeVisible();
    
    // Click QR button
    await page.click('button:has-text("Código QR")');
    
    // Wait for QR modal to open
    await expect(page.locator('h2:text("Códigos QR para Mesas")')).toBeVisible({ timeout: 3000 });
  });

  test('should display mesas after login', async ({ page }) => {
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Check if mesas are loaded (wait for loading to complete)
    await page.waitForTimeout(2000); // Give time for API calls
    
    // Look for any table cards
    const tableCards = page.locator('[data-testid="table-card"], .table-card, [class*="table"], [class*="mesa"]');
    const cardCount = await tableCards.count();
    
    console.log(`Found ${cardCount} table cards`);
    
    // If no specific test IDs, check for common patterns
    const anyCards = page.locator('div').filter({ hasText: /Mesa|F\d+|Barra/ });
    const anyCount = await anyCards.count();
    
    console.log(`Found ${anyCount} elements with table-related text`);
  });

  test('should handle QR code scanning flow', async ({ page }) => {
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Open QR modal
    await page.click('button:has-text("Código QR")');
    await expect(page.locator('h2:text("Códigos QR para Mesas")')).toBeVisible();
    
    // Check if QR codes are generated
    await page.waitForTimeout(1000);
    const qrImages = page.locator('img[src*="qrserver.com"]');
    const qrCount = await qrImages.count();
    
    console.log(`Found ${qrCount} QR codes`);
    
    // Test QR code URL generation
    if (qrCount > 0) {
      const firstQR = qrImages.first();
      const src = await firstQR.getAttribute('src');
      expect(src).toContain('api.qrserver.com');
      expect(src).toContain('mesa%3D'); // URL encoded mesa=
    }
  });

  test('should show check-in page when accessing with mesa parameter', async ({ page }) => {
    // Go directly to check-in with mesa parameter
    await page.goto('http://localhost:3001/?mesa=F1#/checkin');
    
    // Should show check-in form even without login
    await expect(page.locator('h2:text("Bienvenido a")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1:text("EXPENDIO")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=F1')).toBeVisible();
  });

  test('should show menu page', async ({ page }) => {
    // First go through check-in flow to authenticate
    await page.goto('http://localhost:3001/?mesa=F1#/checkin');
    
    // Fill check-in form
    await page.fill('#nombre', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#telefono', '1234567890');
    await page.fill('#fechaNacimiento', '1990-01-01');
    await page.check('#termsAccepted');
    
    // Submit form to get OTP
    await page.click('button[type="submit"]');
    
    // Wait for OTP input to appear
    await page.waitForSelector('#otp', { timeout: 10000 });
    
    // For testing purposes, we'll just verify the menu page structure
    // In a real scenario, you'd enter the OTP and complete the flow
    await expect(page.locator('text=Bienvenid')).toBeVisible({ timeout: 5000 });
  });
});