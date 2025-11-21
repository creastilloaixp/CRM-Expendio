import { test, expect } from '@playwright/test';

test('test iniciar_login_otp RPC directly', async ({ page }) => {
  // Test the RPC function directly
  const result = await page.evaluate(async () => {
    try {
      // @ts-ignore
      const { supabase } = window;
      const { data, error } = await supabase.rpc('iniciar_login_otp', {
        p_nombre: 'Test User',
        p_email: 'test@example.com',
        p_telefono: '1234567890',
        p_fecha_nacimiento: '1990-01-01',
        p_marketing_opt_in: false
      });
      
      console.log('RPC result:', { data, error });
      return { data, error };
    } catch (e) {
      console.error('RPC error:', e);
      return { data: null, error: e.message };
    }
  });
  
  console.log('Direct RPC test result:', result);
  expect(result.error).toBeNull();
});

test('test checkin flow with network capture', async ({ page }) => {
  // Enable network logging
  const requests: any[] = [];
  const responses: any[] = [];
  
  page.on('request', request => {
    if (request.url().includes('rpc')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('rpc')) {
      const body = await response.text().catch(() => null);
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        body: body
      });
    }
  });
  
  await page.goto('/?mesa=F1#/checkin');
  await page.waitForTimeout(2000);
  
  // Fill and submit form
  await page.fill('#nombre', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  await page.click('button:has-text("Verificar y Continuar")');
  await page.waitForTimeout(3000);
  
  console.log('RPC Requests:', requests);
  console.log('RPC Responses:', responses);
  
  // Check if there was an error response
  const errorResponse = responses.find(r => r.status >= 400);
  if (errorResponse) {
    console.log('Error response found:', errorResponse);
  }
});