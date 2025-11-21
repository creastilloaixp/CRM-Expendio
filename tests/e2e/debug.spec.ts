import { test, expect } from '@playwright/test';

test.describe('CRM Expendio - Debug Tests', () => {
  test('debug login and dashboard', async ({ page }) => {
    console.log('Navigating to localhost:3001');
    await page.goto('http://localhost:3001');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check if login form is visible
    const loginForm = await page.locator('h2:text("Acceso Personal")').isVisible();
    console.log('Login form visible:', loginForm);
    
    if (loginForm) {
      console.log('Filling login form');
      await page.fill('input[type="password"]', '1234');
      await page.click('button:has-text("Ingresar")');
      
      // Wait for navigation
      await page.waitForTimeout(2000);
      console.log('After login - Current URL:', page.url());
      
      // Check if dashboard loaded
      const dashboard = await page.locator('h1:text("Gestión de Mesas")').isVisible();
      console.log('Dashboard visible:', dashboard);
      
      if (dashboard) {
        // Check for QR button
        const qrButton = await page.locator('button:has-text("Código QR")').isVisible();
        console.log('QR button visible:', qrButton);
        
        // Check for any modals that might be blocking
        const modals = await page.locator('div[class*="modal"], div[class*="overlay"], div[class*="fixed"]').count();
        console.log('Number of modal/overlay elements:', modals);
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
        console.log('Screenshot saved as debug-dashboard.png');
      }
    }
  });

  test('debug direct checkin access', async ({ page }) => {
    console.log('Testing direct checkin access');
    await page.goto('http://localhost:3001/?mesa=F1#/checkin');
    
    await page.waitForLoadState('networkidle');
    console.log('Current URL:', page.url());
    
    // Check what's visible
    const allText = await page.locator('body').textContent();
    console.log('Page content preview:', allText?.substring(0, 500));
    
    // Look for checkin-related content
    const checkinHeaders = await page.locator('h1, h2, h3').allTextContents();
    console.log('Headers found:', checkinHeaders);
    
    await page.screenshot({ path: 'debug-checkin.png', fullPage: true });
  });

  test('debug direct menu access', async ({ page }) => {
    console.log('Testing direct menu access');
    await page.goto('http://localhost:3001/#/menu');
    
    await page.waitForLoadState('networkidle');
    console.log('Current URL:', page.url());
    
    // Check what's visible
    const allText = await page.locator('body').textContent();
    console.log('Page content preview:', allText?.substring(0, 500));
    
    // Look for menu-related content
    const menuHeaders = await page.locator('h1, h2, h3').allTextContents();
    console.log('Headers found:', menuHeaders);
    
    await page.screenshot({ path: 'debug-menu.png', fullPage: true });
  });
});