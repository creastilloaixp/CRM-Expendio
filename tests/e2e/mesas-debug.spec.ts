import { test, expect } from '@playwright/test';

test.describe('Mesas Debug Tests', () => {
  test('debug mesas loading', async ({ page }) => {
    // Go to the app
    await page.goto('http://localhost:3001');
    
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Wait for potential loading to complete
    await page.waitForTimeout(3000);
    
    // Check for loading spinner
    const loadingVisible = await page.locator('div[class*="animate-spin"]').isVisible().catch(() => false);
    console.log('Loading spinner visible:', loadingVisible);
    
    // Check for table cards
    const tableCards = await page.locator('[data-testid="table-card"], div[class*="mesa"], div[class*="table"]').count();
    console.log('Table cards found:', tableCards);
    
    // Check for any text containing "Mesa" or table names
    const pageText = await page.innerText('body');
    const mesaMatches = pageText.match(/Mesa\s+[A-Z0-9]+/gi) || [];
    console.log('Mesa text matches:', mesaMatches);
    
    // Look for specific table names
    const tableNames = ['A1', 'A2', 'B1', 'B2', 'F1'];
    for (const name of tableNames) {
      const found = pageText.includes(name);
      console.log(`Table ${name} found:`, found);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'mesas-debug-screenshot.png', fullPage: true });
    
    // Check console for any errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Reload to see if there are any console errors
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('Console logs:', consoleLogs);
  });
});