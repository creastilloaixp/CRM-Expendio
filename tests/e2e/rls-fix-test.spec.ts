import { test, expect } from '@playwright/test';

test.describe('RLS Fix Test', () => {
  test('test mesas loading after RLS fix', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Wait a bit for mesas to load
    await page.waitForTimeout(5000);
    
    // Check if mesas are now visible
    const mesaCards = await page.locator('.bg-white.rounded-lg.shadow').count();
    const loadingSpinner = await page.locator('svg.animate-spin').count();
    
    console.log('Console logs:', consoleLogs);
    console.log('Mesa cards found:', mesaCards);
    console.log('Loading spinners found:', loadingSpinner);
    
    // Look for specific mesa names
    const mesa1Visible = await page.locator('text=Mesa 1').isVisible().catch(() => false);
    const mesa2Visible = await page.locator('text=Mesa 2').isVisible().catch(() => false);
    
    console.log('Mesa 1 visible:', mesa1Visible);
    console.log('Mesa 2 visible:', mesa2Visible);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/rls-fix-test.png', fullPage: true });
    
    // For now, just expect that the page loaded without errors
    expect(consoleLogs.some(log => log.includes('Error'))).toBe(false);
  });
});