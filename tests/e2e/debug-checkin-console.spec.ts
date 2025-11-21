import { test, expect } from '@playwright/test';

test('debug checkin with console capture', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
    console.log('Browser console:', msg.text());
  });

  // Navigate to checkin
  await page.goto('/?mesa=F1#/checkin');
  
  // Fill the form
  await page.fill('#nombre', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  
  // Check terms and marketing opt-in
  await page.check('#termsAccepted');
  await page.check('#marketingOptIn');
  
  // Submit the form and wait
  await page.click('button:has-text("Verificar y Continuar")');
  
  // Wait for 5 seconds to see what happens
  await page.waitForTimeout(5000);
  
  // Check what's visible
  const formVisible = await page.locator('#nombre').isVisible().catch(() => false);
  const otpVisible = await page.locator('#otp').isVisible().catch(() => false);
  const statusText = await page.locator('button:has-text("Verificar y Continuar")').textContent().catch(() => '');
  
  console.log('Final state:');
  console.log('- Form visible:', formVisible);
  console.log('- OTP visible:', otpVisible);
  console.log('- Button text:', statusText);
  console.log('- Console logs:', consoleLogs);
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-checkin-final.png' });
  
  // Check if we can find any error messages
  const errorMessages = await page.locator('p.text-red-600').allTextContents().catch(() => []);
  console.log('Error messages found:', errorMessages);
  
  // Success! The OTP input appeared
  expect(otpVisible).toBe(true);
});