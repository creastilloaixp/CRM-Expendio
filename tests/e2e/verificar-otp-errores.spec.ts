import { test, expect } from '@playwright/test';

test('verificar OTP - captura de errores detallada', async ({ page }) => {
  console.log('🔍 Debug de errores en verificación OTP...');
  
  // Capturar todos los mensajes de consola
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`📝 Consola [${msg.type()}]: ${text}`);
    
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });
  
  // Capturar errores de red
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`❌ Error HTTP: ${response.status()} - ${response.url()}`);
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', (error) => {
    console.log(`💥 Error de página: ${error.message}`);
  });
  
  // Navegar a check-in con mesa libre
  await page.goto('#/checkin?mesa=Mesa%203');
  await page.waitForLoadState('networkidle');
  
  // Llenar formulario
  await page.fill('#nombre', 'Juan Pérez');
  await page.fill('#email', 'juan@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  // Enviar formulario
  await page.click('button[type="submit"]');
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('#otp', { timeout: 10000 });
  
  // Obtener el código OTP del console.log
  let otpCode = '';
  for (const message of consoleMessages) {
    if (message.includes('CÓDIGO OTP PARA DESARROLLO:')) {
      otpCode = message.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
      console.log(`🎯 Código OTP encontrado: ${otpCode}`);
      break;
    }
  }
  
  if (!otpCode) {
    console.log('⚠️ No se encontró código OTP en la consola');
    return;
  }
  
  // Llenar código OTP
  await page.fill('#otp', otpCode);
  
  // Hacer clic en verificar con más tiempo de espera
  console.log('🔄 Haciendo clic en verificar...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar más tiempo para ver qué pasa
  await page.waitForTimeout(5000);
  
  // Verificar el estado actual
  const currentUrl = page.url();
  console.log(`🌐 URL actual: ${currentUrl}`);
  
  // Verificar si hay mensajes de error en la página
  const errorMessage = await page.locator('text=Error').first().textContent().catch(() => '');
  if (errorMessage) {
    console.log(`❌ Mensaje de error encontrado: ${errorMessage}`);
  }
  
  // Verificar el estado del botón
  const buttonText = await page.locator('button:has-text("Confirmar Check-in")').textContent().catch(() => '');
  console.log(`🔘 Texto del botón: ${buttonText}`);
  
  // Verificar si el campo OTP sigue visible
  const otpVisible = await page.locator('#otp').isVisible().catch(() => false);
  console.log(`👁️ Campo OTP visible: ${otpVisible}`);
  
  console.log('\n📊 RESUMEN DE ERRORES:');
  console.log(`   Errores de consola: ${consoleErrors.length}`);
  console.log(`   Errores de red: ${page.url()}`);
  console.log(`   URL final: ${currentUrl}`);
  console.log(`   OTP usado: ${otpCode}`);
  
  if (consoleErrors.length > 0) {
    console.log('   Errores capturados:');
    consoleErrors.forEach((error, index) => {
      console.log(`     ${index + 1}. ${error}`);
    });
  }
});