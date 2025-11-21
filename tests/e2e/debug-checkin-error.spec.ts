import { test, expect } from '@playwright/test';

test('debug checkin error', async ({ page }) => {
  // Navigate to checkin with a specific mesa
  await page.goto('/?mesa=F1#/checkin');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'debug-checkin-initial.png', fullPage: true });
  
  // Fill the form with test data
  await page.fill('#nombre', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  // Take screenshot before submitting
  await page.screenshot({ path: 'debug-checkin-filled.png', fullPage: true });
  
  // Submit the form
  await page.click('button:has-text("Verificar y Continuar")');
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Take screenshot after submission
  await page.screenshot({ path: 'debug-checkin-after-submit.png', fullPage: true });
  
  // Check for error messages
  const errorMessage = page.locator('text=Hubo un error al enviar el código');
  const errorCount = await errorMessage.count();
  
  // Check console for errors
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(msg.text());
    }
  });
  
  // Get network requests
  const failedRequests: any[] = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  await page.waitForTimeout(1000);
  
  console.log('Error message found:', errorCount > 0);
  console.log('Console errors:', consoleLogs);
  console.log('Failed requests:', failedRequests);
  
  // Final screenshot
  await page.screenshot({ path: 'debug-checkin-final.png', fullPage: true });
});