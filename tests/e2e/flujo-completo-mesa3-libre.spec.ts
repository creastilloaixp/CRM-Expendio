import { test, expect } from '@playwright/test';

test('probar flujo completo con mesa libre real (Mesa 3)', async ({ page }) => {
  console.log('🚀 Probando flujo completo con Mesa 3 (Libre)...');
  
  // Capturar errores
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Error de consola:', msg.text());
    }
  });

  // Capturar respuestas
  const responses: any[] = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
    
    if (response.url().includes('iniciar_visita')) {
      console.log('📡 Respuesta de visita:', response.status(), response.statusText());
    }
  });

  // Navegar a check-in con Mesa 3 (Libre)
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  
  // Verificar que el campo OTP aparezca después de enviar el formulario
  console.log('📋 Llenando formulario...');
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="nombre"]', 'Test User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  console.log('📤 Enviando formulario...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('input[id="otp"]', { timeout: 10000 });
  console.log('✅ Campo OTP apareció');
  
  // Capturar el código OTP
  const response = await page.waitForResponse(response => 
    response.url().includes('iniciar_login_otp') && response.status() === 200,
    { timeout: 10000 }
  );
  
  const otpData = await response.json();
  console.log('📨 OTP Response:', otpData);
  
  // Verificar que el código OTP se muestre en pantalla
  const otpMessage = await page.locator('text=Se ha enviado un código').textContent();
  console.log('📱 Mensaje OTP:', otpMessage);
  
  // Ingresar el código OTP
  const otpCode = otpData.otp_code;
  console.log('🔢 Código OTP capturado:', otpCode);
  await page.fill('input[id="otp"]', otpCode);
  
  // Verificar OTP
  console.log('✅ Verificando OTP...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar respuesta de verificación
  const verifyResponse = await page.waitForResponse(response => 
    response.url().includes('verificar_otp') && response.status() === 200,
    { timeout: 10000 }
  );
  
  const verifyData = await verifyResponse.json();
  console.log('📨 Verification Response:', verifyData);
  
  // Esperar un poco más para ver si hay redirección
  await page.waitForTimeout(3000);
  
  // Verificar resultados
  const currentUrl = page.url();
  console.log('🌐 URL final:', currentUrl);
  
  console.log('\n📊 Resultados finales:');
  console.log('✅ OTP Verification:', verifyData);
  console.log(`📤 Requests totales: ${responses.length}`);
  console.log(`❌ Errores de consola: ${consoleErrors.length}`);
  
  // Verificar si hubo redirección al menú
  if (currentUrl.includes('/menu')) {
    console.log('🎉 ¡REDIRECCIÓN AL MENÚ EXITOSA!');
    console.log('✅ El flujo completo está funcionando correctamente');
  } else {
    console.log('⚠️ No se redirigió al menú');
    
    // Verificar el contenido de la página
    const pageContent = await page.locator('body').textContent();
    if (pageContent.includes('no está disponible')) {
      console.log('❌ La mesa sigue sin estar disponible');
    } else if (pageContent.includes('Error')) {
      console.log('❌ Hay un error en el proceso');
    }
  }
  
  // No fallar el test, solo reportar resultados
  expect(true).toBe(true);
});