import { test, expect } from '@playwright/test';

test('debug pantalla de código enviado - usuario bloqueado', async ({ page }) => {
  console.log('🔍 Debug: Usuario se queda en pantalla de código enviado...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  let formSubmissionResponse = null;
  let consoleErrors = [];
  let consoleLogs = [];
  let pageMessages = [];
  
  // Capturar todos los responses
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    
    console.log(`📡 Response: ${status} ${url}`);
    
    if (url.includes('iniciar_login_otp')) {
      try {
        const data = await response.json();
        console.log('📨 OTP Response:', JSON.stringify(data, null, 2));
        if (data.otp_code) {
          capturedOtpCode = data.otp_code;
          capturedOtpId = data.otp_id;
        }
        formSubmissionResponse = data;
      } catch (e) {
        console.log('❌ Error al parsear respuesta OTP:', e);
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
  
  // Tomar screenshot inicial
  await page.screenshot({ path: 'test-results/paso1-inicio.png' });
  
  // Llenar el formulario
  console.log('📝 Llenando formulario...');
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="nombre"]', 'Test User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  // Tomar screenshot del formulario llenado
  await page.screenshot({ path: 'test-results/paso2-formulario-llenado.png' });
  
  console.log('📤 Enviando formulario...');
  await page.click('button[type="submit"]');
  
  // Esperar 3 segundos para ver qué pasa
  console.log('⏳ Esperando 3 segundos después de enviar...');
  await page.waitForTimeout(3000);
  
  // Tomar screenshot después de enviar
  await page.screenshot({ path: 'test-results/paso3-despues-enviar.png' });
  
  // Verificar qué mensaje aparece en la pantalla
  const mensajePantalla = await page.textContent('body');
  console.log('📄 Mensaje en pantalla:', mensajePantalla);
  
  // Buscar mensajes específicos
  if (mensajePantalla?.includes('enviado')) {
    console.log('✅ Se encontró mensaje de "enviado" en la pantalla');
  }
  
  // Verificar si el campo OTP está presente pero oculto
  const otpInputExists = await page.locator('input[id="otp"]').count() > 0;
  console.log('🔍 ¿Existe campo OTP?', otpInputExists);
  
  if (otpInputExists) {
    // Verificar si está visible
    const otpInputVisible = await page.locator('input[id="otp"]').isVisible();
    console.log('👁️ ¿Está visible el campo OTP?', otpInputVisible);
    
    if (!otpInputVisible) {
      console.log('⚠️ El campo OTP existe pero no está visible');
      // Intentar hacer scroll o verificar estilos
      const otpStyles = await page.locator('input[id="otp"]').evaluate(el => {
        return {
          display: window.getComputedStyle(el).display,
          visibility: window.getComputedStyle(el).visibility,
          opacity: window.getComputedStyle(el).opacity
        };
      });
      console.log('🎨 Estilos del campo OTP:', otpStyles);
    }
  }
  
  // Verificar si hay algún botón deshabilitado
  const botones = await page.locator('button').all();
  for (const boton of botones) {
    const texto = await boton.textContent();
    const disabled = await boton.isDisabled();
    console.log(`🔘 Botón: "${texto?.trim()}" - Deshabilitado: ${disabled}`);
  }
  
  // Mostrar el código OTP capturado (si existe)
  if (capturedOtpCode) {
    console.log('🔢 Código OTP capturado:', capturedOtpCode);
    console.log('🆔 OTP ID capturado:', capturedOtpId);
  } else {
    console.log('⚠️ No se capturó ningún código OTP');
  }
  
  // Mostrar response del formulario
  console.log('📋 Response del formulario:', formSubmissionResponse);
  
  // Intentar hacer clic en algún elemento si existe
  try {
    // Buscar cualquier elemento clickeable
    const elementosClickeables = await page.locator('button:not([disabled]), input[type="text"]:not([disabled])').all();
    console.log(`🔍 Encontrados ${elementosClickeables.length} elementos clickeables`);
    
    for (const elemento of elementosClickeables) {
      const tagName = await elemento.evaluate(el => el.tagName);
      const texto = await elemento.textContent();
      console.log(`  - ${tagName}: "${texto?.trim()}"`);
    }
  } catch (e) {
    console.log('❌ Error al buscar elementos clickeables:', e);
  }
  
  // Tomar screenshot final
  await page.screenshot({ path: 'test-results/paso4-final.png' });
  
  console.log('📋 Logs de consola:', consoleLogs);
  console.log('❌ Errores de consola:', consoleErrors);
  
  console.log('✅ Debug completado');
});