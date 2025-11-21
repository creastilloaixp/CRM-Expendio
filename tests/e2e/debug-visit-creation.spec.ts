import { test, expect } from '@playwright/test';

test('debug visit creation after OTP verification', async ({ page }) => {
  console.log('🔍 Debug detallado de creación de visita después de OTP...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  let verificationResponse = null;
  let visitCreationResponse = null;
  let visitCreationError = null;
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
        visitCreationError = e;
      }
    }
  });
  
  // Capturar errores de consola
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
  
  // Navegar a la página de check-in con una mesa específica
  console.log('🌐 Navegando a checkin...');
  await page.goto('http://localhost:3000/#/checkin?mesa=MESA1');
  
  // Esperar a que cargue el formulario
  await page.waitForSelector('input[id="email"]', { timeout: 10000 });
  
  // Llenar el formulario
  console.log('📝 Llenando formulario...');
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="nombre"]', 'Test User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  console.log('📤 Enviando formulario...');
  await page.click('button[type="submit"]');
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('input[id="otp"]', { timeout: 15000 });
  console.log('✅ Campo OTP apareció');
  
  // Verificar que se capturó el código OTP
  expect(capturedOtpCode).toBeTruthy();
  console.log(`🔢 Código OTP capturado: ${capturedOtpCode}`);
  console.log(`🆔 OTP ID capturado: ${capturedOtpId}`);
  
  // Llenar el código OTP
  console.log('🔑 Llenando código OTP...');
  await page.fill('input[id="otp"]', capturedOtpCode);
  
  // Hacer clic en el botón de verificación
  console.log('🎯 Haciendo clic en Confirmar Check-in...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar más tiempo para que se complete todo el proceso
  console.log('⏳ Esperando 5 segundos para que se complete el proceso...');
  await page.waitForTimeout(5000);
  
  // Verificar que la verificación fue exitosa
  console.log('📊 Verificando resultados...');
  console.log('✅ OTP Verification:', verificationResponse);
  console.log('📋 Visit Creation Response:', visitCreationResponse);
  console.log('❌ Visit Creation Error:', visitCreationError);
  
  // Verificar si hay mensajes en la página
  const pageContent = await page.textContent('body');
  console.log('📄 Contenido de la página:', pageContent?.substring(0, 500));
  
  // Verificar si se redirigió al menú
  const currentUrl = page.url();
  console.log('🌐 URL final:', currentUrl);
  
  // Mostrar todos los logs y errores de consola
  console.log('📋 Todos los logs de consola:', consoleLogs);
  console.log('❌ Todos los errores de consola:', consoleErrors);
  
  // Tomar screenshot final
  await page.screenshot({ path: 'test-results/debug-visit-creation-final.png' });
  
  console.log('✅ Debug completado');
});