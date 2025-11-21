import { test, expect } from '@playwright/test';

test.describe('Mesas Data Loading Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Login as admin
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
  });

  test('should load and display mesas on dashboard', async ({ page }) => {
    // Wait for mesas to load
    await page.waitForTimeout(2000); // Give time for API call
    
    // Check if mesas are visible
    const mesaCards = page.locator('.bg-white.rounded-lg.shadow');
    const count = await mesaCards.count();
    
    console.log(`Found ${count} mesa cards`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/mesas-loaded.png', fullPage: true });
    
    // Expect at least some mesas to be visible
    expect(count).toBeGreaterThan(0);
    
    // Check for specific mesa names
    await expect(page.locator('text=Mesa 1')).toBeVisible();
    await expect(page.locator('text=Mesa 2')).toBeVisible();
  });

  test('should show QR codes for mesas', async ({ page }) => {
    // Click on QR codes button
    await page.click('text=Códigos QR para Mesas');
    
    // Wait for QR modal
    await page.waitForSelector('text=Generador de Códigos QR', { timeout: 5000 });
    
    // Check if QR codes are generated
    const qrCanvas = page.locator('canvas');
    const qrCount = await qrCanvas.count();
    
    console.log(`Found ${qrCount} QR codes`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/qr-codes.png', fullPage: true });
    
    // Expect QR codes to be generated
    expect(qrCount).toBeGreaterThan(0);
  });
});