import { test, expect } from '@playwright/test';

test.describe('Database Seed Test', () => {
  test('check if mesas table exists and can be queried', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Test database connection and table structure
    const dbTest = await page.evaluate(async () => {
      try {
        // Get the Supabase client
        const { supabase } = window as any;
        if (!supabase) {
          return { error: 'Supabase not found' };
        }

        // First, check if mesas table exists
        const { data: tableExists, error: tableError } = await supabase
          .from('mesas')
          .select('id')
          .limit(1);

        if (tableError) {
          return { error: `Table query error: ${tableError.message}` };
        }

        // Check how many mesas exist
        const { data: allMesas, error: countError } = await supabase
          .from('mesas')
          .select('*');

        if (countError) {
          return { error: `Count query error: ${countError.message}` };
        }

        return { 
          tableExists: true, 
          mesaCount: allMesas?.length || 0, 
          sampleData: allMesas?.slice(0, 2) || [],
          success: true 
        };
      } catch (error) {
        return { error: String(error) };
      }
    });

    console.log('Database test result:', dbTest);

    // Now login and see what happens
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');

    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();

    // Wait for any loading to complete
    await page.waitForTimeout(3000);

    console.log('Console logs:', consoleLogs);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/db-seed-test.png', fullPage: true });

    // The test passes if we can query the database
    expect(dbTest.error).toBeUndefined();
  });
});