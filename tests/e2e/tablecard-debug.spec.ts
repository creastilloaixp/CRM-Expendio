import { test, expect } from '@playwright/test';

test('debug tablecard rendering', async ({ page }) => {
  console.log('Starting tablecard debug test...');
  
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
  
  // Wait a bit for data to load
  await page.waitForTimeout(3000);
  
  // Check for any elements with class containing 'rounded-lg'
  const roundedElements = page.locator('[class*="rounded-lg"]');
  const roundedCount = await roundedElements.count();
  console.log(`Found ${roundedCount} elements with rounded-lg classes`);
  
  // Check for grid container
  const gridContainer = page.locator('[class*="grid"]');
  const gridExists = await gridContainer.count();
  console.log(`Found ${gridExists} grid containers`);
  
  if (gridExists > 0) {
    const gridHtml = await gridContainer.first().innerHTML();
    console.log('Grid container HTML:', gridHtml.substring(0, 500));
  }
  
  // Check for specific TableCard classes
  const tableCards = page.locator('[class*="shadow-md"]');
  const tableCardCount = await tableCards.count();
  console.log(`Found ${tableCardCount} table cards with shadow-md`);
  
  // Check for mesa names
  const mesaNames = page.locator('text=Mesa');
  const mesaNameCount = await mesaNames.count();
  console.log(`Found ${mesaNameCount} elements containing 'Mesa'`);
  
  // Take a screenshot for visual debugging
  await page.screenshot({ path: 'tablecard-debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved as tablecard-debug-screenshot.png');
});