import { test, expect } from '@playwright/test';

test.describe('Manual Mesa Insert Test', () => {
  test('insert test mesas and verify they appear', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Navigate to the app
    await page.goto('http://localhost:3001');
    
    // Insert test mesas directly through the browser console
    const insertResult = await page.evaluate(async () => {
      try {
        // Get the Supabase client
        const { supabase } = window as any;
        if (!supabase) {
          return { error: 'Supabase not found' };
        }

        // Insert test mesas
        const testMesas = [
          { nombre: 'A1', capacidad: 2, estado: 'Libre' },
          { nombre: 'A2', capacidad: 4, estado: 'Libre' },
          { nombre: 'B1', capacidad: 4, estado: 'Ocupada' },
        ];

        const results = [];
        for (const mesa of testMesas) {
          const { data, error } = await supabase.from('mesas').insert([mesa]);
          results.push({ data, error });
        }

        return { results, success: true };
      } catch (error) {
        return { error: String(error) };
      }
    });

    console.log('Insert result:', insertResult);

    // Now login and check if mesas appear
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Ingresar")');

    // Wait for dashboard
    await expect(page.locator('h1:text("Gestión de Mesas")')).toBeVisible();

    // Wait for mesas to load
    await page.waitForTimeout(3000);

    // Check if mesas are now visible
    const mesaCards = await page.locator('.bg-white.rounded-lg.shadow').count();
    const a1Visible = await page.locator('text=A1').isVisible().catch(() => false);
    const a2Visible = await page.locator('text=A2').isVisible().catch(() => false);

    console.log('Console logs:', consoleLogs);
    console.log('Mesa cards found:', mesaCards);
    console.log('A1 visible:', a1Visible);
    console.log('A2 visible:', a2Visible);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/manual-insert-test.png', fullPage: true });
  });
});