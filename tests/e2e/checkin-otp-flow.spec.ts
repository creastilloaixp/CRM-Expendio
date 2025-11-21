import { test, expect } from '@playwright/test';

test('complete checkin flow with OTP', async ({ page }) => {
  // Navigate to checkin with a specific mesa
  await page.goto('/?mesa=F1#/checkin');
  
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
  
  // Wait a bit to see what happens
  await page.waitForTimeout(3000);
  
  // Take a screenshot to see the current state
  await page.screenshot({ path: 'test-results/checkin-after-submit.png' });
  
  // Check if there's an error message
  const errorMessage = await page.locator('p.text-red-600').textContent().catch(() => '');
  console.log('Error message after submit:', errorMessage);
  
  // Check the current status text
  const statusText = await page.locator('button:has-text("Verificar y Continuar")').textContent().catch(() => '');
  console.log('Button text:', statusText);
  
  // Check what content is visible
  const verifyingText = await page.locator('text=Verificando...').isVisible().catch(() => false);
  const errorText = await page.locator('text=Error').isVisible().catch(() => false);
  console.log('Verifying text visible:', verifyingText);
  console.log('Error text visible:', errorText);
  
  // Check if we're still on the form or moved to OTP
  const formVisible = await page.locator('#nombre').isVisible().catch(() => false);
  const otpVisible = await page.locator('#otp').isVisible().catch(() => false);
  console.log('Form visible:', formVisible);
  console.log('OTP visible:', otpVisible);
  
  // Wait for OTP input to appear (indicates successful OTP sending)
  try {
    await page.waitForSelector('#otp', { timeout: 5000 });
    console.log('✅ OTP input appeared - OTP sending successful!');
  } catch (e) {
    console.log('❌ OTP input did not appear - OTP sending failed');
    throw new Error('OTP input did not appear after form submission');
  }
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'test-results/checkin-otp-success.png' });
  
  console.log('✅ CheckIn OTP flow working correctly!');
});