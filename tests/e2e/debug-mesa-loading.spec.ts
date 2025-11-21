import { test, expect } from '@playwright/test';

test.describe('Debug Mesa Loading', () => {
  test('capture console logs and debug mesa loading', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Browser console:', msg.text());
    });

    // Capture network requests
    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });

    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });

    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Login as admin
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Wait longer to see if mesas load
    await page.waitForTimeout(5000);
    
    // Check console logs for errors
    console.log('All console logs:', consoleLogs);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-dashboard.png', fullPage: true });
    
    // Check if there are any API errors in console
    const apiErrors = consoleLogs.filter(log => 
      log.toLowerCase().includes('error') || 
      log.toLowerCase().includes('failed') ||
      log.toLowerCase().includes('rls')
    );
    
    console.log('API/Error logs:', apiErrors);
    
    // Check for mesa cards
    const mesaCards = page.locator('.bg-white.rounded-lg.shadow');
    const count = await mesaCards.count();
    console.log(`Found ${count} mesa cards`);
    
    // If no mesas, check what's on the page
    if (count === 0) {
      const pageContent = await page.content();
      console.log('Page content:', pageContent.substring(0, 1000));
    }
  });
});