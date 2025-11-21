import { test, expect } from '@playwright/test';

test('test iniciar_visita_con_cliente function', async ({ page }) => {
  console.log('🚀 Probando la función iniciar_visita_con_cliente...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  let verificationResponse = null;
  let visitCreationResponse = null;
  let visitCreationError = null;
  
  // Capturar todos los responses
  page.on('response', async (response) => {
    const url = response.url();
    
    if (url.includes('iniciar_login_otp')) {
      try {
        const data = await response.json();
        console.log('📨 OTP Response:', JSON.stringify(data, null, 2));
        if (data.otp_code) {
          capturedOtpCode = data.otp_code;
          capturedOtpId = data.otp_id;
        }
      } catch (e) {
        console.log('❌ Error al parsear respuesta OTP:', e);
      }
    }
    
    if (url.includes('verificar_otp')) {
      try {
        verificationResponse = await response.json();
        console.log('📨 Verification Response:', JSON.stringify(verificationResponse, null, 2));
      } catch (e) {
        console.log('❌ Error al parsear respuesta de verificación:', e);
      }
    }
    
    if (url.includes('start_visit') || url.includes('startVisit')) {
      try {
        visitCreationResponse = await response.json();
        console.log('📨 Visit Creation Response:', JSON.stringify(visitCreationResponse, null, 2));
      } catch (e) {
        console.log('❌ Error al parsear respuesta de creación de visita:', e);
        visitCreationError = e;
      }
    }
  });
  
  // Capturar errores de consola
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Error de consola:', msg.text());
    }
  });
  
  // Navegar a la página de check-in con una mesa específica
  await page.goto('http://localhost:3000/#/checkin?mesa=MESA1');
  
  // Llenar el formulario
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="nombre"]', 'Test User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  console.log('📋 Formulario llenado');
  
  // Enviar el formulario
  await page.click('button[type="submit"]');
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('input[id="otp"]', { timeout: 10000 });
  console.log('✅ Campo OTP apareció');
  
  // Verificar que se capturó el código OTP
  expect(capturedOtpCode).toBeTruthy();
  console.log(`🔢 Código OTP capturado: ${capturedOtpCode}`);
  
  // Llenar el código OTP
  await page.fill('input[id="otp"]', capturedOtpCode);
  
  // Hacer clic en el botón de verificación
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar un momento para que se complete la verificación
  await page.waitForTimeout(2000);
  
  // Verificar que la verificación fue exitosa
  expect(verificationResponse).toBeTruthy();
  expect(verificationResponse.success).toBe(true);
  
  console.log('📊 Resultados finales:');
  console.log('✅ OTP Verification:', verificationResponse);
  console.log('📋 Visit Creation:', visitCreationResponse);
  console.log('❌ Visit Creation Error:', visitCreationError);
  
  // Verificar si se redirigió al menú
  const currentUrl = page.url();
  console.log('🌐 URL final:', currentUrl);
  
  // Tomar screenshot final
  await page.screenshot({ path: 'test-results/test-iniciar-visita-con-cliente-final.png' });
  
  console.log('✅ Test completado');
});