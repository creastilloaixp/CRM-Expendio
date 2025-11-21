import { test, expect } from '@playwright/test';

test.describe('QR Code Debug Tests', () => {
  test('debug QR button click', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
    
    // Go to the app
    await page.goto('http://localhost:3001');
    
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Click QR button
    console.log('Clicking QR button...');
    await page.click('button:has-text("Código QR")');
    
    // Wait a bit for any animations
    await page.waitForTimeout(2000);
    
    // Check what's visible
    const pageContent = await page.content();
    console.log('Page content after QR click:', pageContent.substring(0, 1000));
    
    // Take screenshot
    await page.screenshot({ path: 'qr-debug-screenshot.png', fullPage: true });
    
    // Check for any h2 elements
    const h2Elements = await page.locator('h2').allTextContents();
    console.log('H2 elements found:', h2Elements);
    
    // Check for modal
    const modalVisible = await page.locator('div[class*="fixed"], div[class*="modal"]').isVisible().catch(() => false);
    console.log('Modal visible:', modalVisible);
    
    // Check for any elements with "QR" text
    const qrElements = await page.locator('*:has-text("QR")').count();
    console.log('Elements with QR text:', qrElements);
  });
});