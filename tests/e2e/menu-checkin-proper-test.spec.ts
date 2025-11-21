import { test, expect } from '@playwright/test';

test('test Menu page with proper mesa parameter', async ({ page }) => {
  console.log('Starting Menu page test with mesa parameter...');
  
  // Navigate to the app with proper mesa parameter
  await page.goto('http://localhost:3000/#/menu?mesa=Mesa%201');
  console.log('Navigated to Menu page with mesa parameter');
  
  // Wait for Menu page to load
  await page.waitForTimeout(3000);
  
  // Check if Menu page content is visible
  const menuTitle = page.locator('text=¡Bienvenid@');
  const menuCount = await menuTitle.count();
  console.log(`Found ${menuCount} welcome message elements`);
  
  // Check for user name
  const userName = page.locator('text=Usuario');
  const userCount = await userName.count();
  console.log(`Found ${userCount} user name elements`);
  
  // Check for mesa name
  const mesaName = page.locator('text=Mesa 1');
  const mesaCount = await mesaName.count();
  console.log(`Found ${mesaCount} mesa name elements`);
  
  // Check for action buttons
  const verMenuButton = page.locator('text=Ver Menú');
  const verMenuCount = await verMenuButton.count();
  console.log(`Found ${verMenuCount} Ver Menú buttons`);
  
  const llamarMeseroButton = page.locator('text=Llamar Mesero');
  const llamarCount = await llamarMeseroButton.count();
  console.log(`Found ${llamarCount} Llamar Mesero buttons`);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'menu-with-mesa-screenshot.png', fullPage: true });
  console.log('Menu screenshot saved');
});

test('test CheckIn page without mesa parameter', async ({ page }) => {
  console.log('Starting CheckIn page test without mesa parameter...');
  
  // Navigate to the app without mesa parameter
  await page.goto('http://localhost:3000/#/checkin');
  console.log('Navigated to CheckIn page without mesa parameter');
  
  // Wait for CheckIn page to load
  await page.waitForTimeout(3000);
  
  // Check if error message is shown
  const errorMessage = page.locator('text=El código QR no es válido');
  const errorCount = await errorMessage.count();
  console.log(`Found ${errorCount} error message elements`);
  
  // Check for form elements
  const formElements = page.locator('input');
  const formCount = await formElements.count();
  console.log(`Found ${formCount} form input elements`);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'checkin-without-mesa-screenshot.png', fullPage: true });
  console.log('CheckIn screenshot saved');
});