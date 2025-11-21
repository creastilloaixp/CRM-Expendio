import { test, expect } from '@playwright/test';

test('probar flujo completo con mesa libre (Mesa 2)', async ({ page }) => {
  console.log('🚀 Probando flujo completo con Mesa 2 (libre)...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  let verificationResponse = null;
  let visitCreationResponse = null;
  let consoleErrors = [];
  let consoleLogs = [];
  
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
      }
    }
  });
  
  // Capturar errores y logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log('❌ Error de consola:', text);
    } else {
      consoleLogs.push(text);
      console.log('📝 Log de consola:', text);
    }
  });
  
  // Navegar a check-in con Mesa 2 (libre)
  console.log('🌐 Navegando a checkin con Mesa 2...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 2');
  
  // Llenar el formulario
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="nombre"]', 'Test User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  console.log('📋 Formulario llenado');
  
  // Enviar formulario
  await page.click('button[type="submit"]');
  
  // Esperar OTP
  await page.waitForSelector('input[id="otp"]', { timeout: 15000 });
  console.log('✅ Campo OTP apareció');
  
  // Verificar OTP capturado
  expect(capturedOtpCode).toBeTruthy();
  console.log(`🔢 Código OTP capturado: ${capturedOtpCode}`);
  
  // Llenar OTP
  await page.fill('input[id="otp"]', capturedOtpCode);
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar proceso completo
  console.log('⏳ Esperando 5 segundos para que se complete el proceso...');
  await page.waitForTimeout(5000);
  
  console.log('📊 Resultados finales:');
  console.log('✅ OTP Verification:', verificationResponse);
  console.log('📋 Visit Creation:', visitCreationResponse);
  
  // Verificar redirección
  const currentUrl = page.url();
  console.log('🌐 URL final:', currentUrl);
  
  if (currentUrl.includes('/menu')) {
    console.log('🎉 ¡REDIRECCIÓN AL MENÚ EXITOSA!');
    console.log('✅ El flujo completo está funcionando correctamente');
  } else {
    console.log('⚠️ No se redirigió al menú');
    
    // Ver mensaje de error
    const pageContent = await page.textContent('body');
    console.log('📄 Contenido de página:', pageContent?.substring(0, 300));
  }
  
  // Mostrar logs y errores
  console.log('📋 Logs de consola:', consoleLogs);
  console.log('❌ Errores de consola:', consoleErrors);
  
  await page.screenshot({ path: 'test-results/flujo-completo-mesa2-final.png' });
  
  console.log('✅ Test completado');
});