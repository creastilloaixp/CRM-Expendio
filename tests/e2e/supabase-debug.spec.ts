import { test, expect } from '@playwright/test';

test.describe('Supabase Debug Tests', () => {
  test('debug supabase connection and data', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Login
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000);
    
    // Check if there are any visible errors
    const visibleErrors = await page.locator('text=Error').count();
    
    console.log('Console logs:', consoleLogs);
    console.log('Page errors:', pageErrors);
    console.log('Visible errors count:', visibleErrors);
    
    // Try to execute a direct query in the browser console
    const result = await page.evaluate(async () => {
      try {
        // Check if supabase is available
        const supabase = (window as any).supabase;
        if (!supabase) {
          return { error: 'Supabase not found on window' };
        }
        
        // Try to query mesas
        const { data, error } = await supabase.from('mesas').select('*');
        return { data, error };
      } catch (e) {
        return { error: String(e) };
      }
    });
    
    console.log('Direct supabase query result:', result);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/supabase-debug.png', fullPage: true });
  });
});