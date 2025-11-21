import { test, expect } from '@playwright/test';

test.describe('API Debug Tests', () => {
  test('debug getMesas API call', async ({ page }) => {
    // Add console listener to catch API responses
    page.on('console', msg => {
      if (msg.text().includes('Mesas data:') || msg.text().includes('Error fetching mesas:')) {
        console.log('API Response:', msg.text());
      }
    });
    
    // Go to the app
    await page.goto('http://localhost:3001');
    
    // Inject a script to intercept API calls
    await page.evaluate(() => {
      // Override console.log to capture API responses
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && args[0].toString().includes('Mesas data:')) {
          window.__mesasData = args;
        }
        originalLog.apply(console, args);
      };
    });
    
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard to load
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Wait for potential API calls
    await page.waitForTimeout(5000);
    
    // Check if there's any data captured
    const capturedData = await page.evaluate(() => {
      return window.__mesasData || 'No data captured';
    });
    console.log('Captured data:', capturedData);
    
    // Take screenshot
    await page.screenshot({ path: 'api-debug-screenshot.png', fullPage: true });
    
    // Check for any network errors
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('mesas')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Reload to trigger API calls again
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log('Network responses:', responses);
  });
});