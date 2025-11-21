import { test, expect } from '@playwright/test';

test('complete checkin OTP flow works correctly', async ({ page }) => {
  // Navigate to checkin with a specific mesa
  await page.goto('/?mesa=F1#/checkin');
  
  // Verify we're on the checkin page
  await expect(page.locator('text=Estás haciendo check-in en la mesa: F1')).toBeVisible();
  
  // Fill the form
  await page.fill('#nombre', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  
  // Check terms and marketing opt-in
  await page.check('#termsAccepted');
  await page.check('#marketingOptIn');
  
  // Submit the form
  await page.click('button:has-text("Verificar y Continuar")');
  
  // Wait for OTP input to appear (indicates successful OTP sending)
  await page.waitForSelector('#otp', { timeout: 10000 });
  
  // Verify the OTP input is visible
  await expect(page.locator('#otp')).toBeVisible();
  
  // Verify the success message is shown
  await expect(page.locator('text=Se ha enviado un código a 1234567890')).toBeVisible();
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'test-results/checkin-otp-success.png' });
  
  console.log('✅ CheckIn OTP flow working correctly!');
});