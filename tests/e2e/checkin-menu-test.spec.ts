import { test, expect } from '@playwright/test';

test('test CheckIn page rendering', async ({ page }) => {
  console.log('Starting CheckIn page test...');
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  console.log('Navigated to app');
  
  // Login
  await page.fill('input[type="password"]', '1234');
  await page.click('button[type="submit"]');
  console.log('Submitted login form');
  
  // Wait for dashboard to load
  await page.waitForSelector('text=Dashboard', { timeout: 10000 });
  console.log('Dashboard loaded');
  
  // Navigate to CheckIn page using hash routing
  await page.evaluate(() => {
    window.location.hash = '#/checkin';
  });
  console.log('Navigated to CheckIn page');
  
  // Wait for CheckIn page to load
  await page.waitForTimeout(3000);
  
  // Check if CheckIn page content is visible
  const checkinTitle = page.locator('text=Check-In');
  const checkinCount = await checkinTitle.count();
  console.log(`Found ${checkinCount} Check-In title elements`);
  
  // Check for QR code scanner or form
  const qrScanner = page.locator('text=QR');
  const qrCount = await qrScanner.count();
  console.log(`Found ${qrCount} QR-related elements`);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'checkin-debug-screenshot.png', fullPage: true });
  console.log('CheckIn screenshot saved');
});

test('test Menu page rendering', async ({ page }) => {
  console.log('Starting Menu page test...');
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  console.log('Navigated to app');
  
  // Login
  await page.fill('input[type="password"]', '1234');
  await page.click('button[type="submit"]');
  console.log('Submitted login form');
  
  // Wait for dashboard to load
  await page.waitForSelector('text=Dashboard', { timeout: 10000 });
  console.log('Dashboard loaded');
  
  // Navigate to Menu page using hash routing
  await page.evaluate(() => {
    window.location.hash = '#/menu';
  });
  console.log('Navigated to Menu page');
  
  // Wait for Menu page to load
  await page.waitForTimeout(3000);
  
  // Check if Menu page content is visible
  const menuTitle = page.locator('text=Menú');
  const menuCount = await menuTitle.count();
  console.log(`Found ${menuCount} Menú title elements`);
  
  // Check for error messages
  const errorMessage = page.locator('text=Error');
  const errorCount = await errorMessage.count();
  console.log(`Found ${errorCount} error message elements`);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'menu-debug-screenshot.png', fullPage: true });
  console.log('Menu screenshot saved');
});