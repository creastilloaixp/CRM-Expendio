import { test, expect } from '@playwright/test';

test('debug completo del flujo OTP con captura de errores', async ({ page }) => {
  console.log('🔍 Debug completo del flujo OTP...');
  
  // Capturar todos los mensajes de consola
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`📝 Consola: [${msg.type()}] ${msg.text()}`);
  });
  
  // Capturar errores de red
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`❌ Error HTTP: ${response.status()} - ${response.url()}`);
    }
  });
  
  // Navegar a check-in
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  await page.waitForTimeout(2000);
  
  // Llenar formulario
  console.log('📝 Llenando formulario...');
  await page.fill('input[id="email"]', 'debug@example.com');
  await page.fill('input[id="nombre"]', 'Debug User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  // Hacer clic en enviar
  console.log('🖱️ Enviando formulario...');
  await page.click('button[type="submit"]');
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('input[id="otp"]', { timeout: 10000 }).catch(() => {
    console.log('❌ Campo OTP no apareció');
  });
  
  // Buscar el código OTP en los mensajes de consola
  let otpCode = '';
  for (const msg of consoleMessages) {
    const match = msg.match(/CÓDIGO OTP PARA DESARROLLO: (\d{6})/);
    if (match) {
      otpCode = match[1];
      console.log(`🎉 Código OTP encontrado: ${otpCode}`);
      break;
    }
  }
  
  if (!otpCode) {
    console.log('❌ No se encontró código OTP en consola');
    console.log('Mensajes de consola capturados:');
    consoleMessages.forEach((msg, i) => console.log(`   ${i + 1}. ${msg}`));
    return;
  }
  
  // Intentar verificar el OTP
  console.log(`🔐 Intentando verificar con código: ${otpCode}...`);
  await page.fill('input[id="otp"]', otpCode);
  
  // Hacer clic en verificar
  console.log('🖱️ Haciendo clic en "Confirmar Check-in"...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar resultado
  await page.waitForTimeout(5000);
  
  // Verificar estado final
  const currentUrl = page.url();
  console.log(`🌐 URL final: ${currentUrl}`);
  
  // Buscar mensajes de error
  const errorMessages = consoleMessages.filter(msg => 
    msg.toLowerCase().includes('error') || 
    msg.toLowerCase().includes('falló') || 
    msg.toLowerCase().includes('incorrecto')
  );
  
  if (errorMessages.length > 0) {
    console.log('❌ Mensajes de error encontrados:');
    errorMessages.forEach(msg => console.log(`   ${msg}`));
  }
  
  // Verificar si hay mensajes en la página
  const pageMessages = await page.locator('p:text-matches("error|Error|falló|incorrecto")').textContent().catch(() => '');
  if (pageMessages) {
    console.log(`📄 Mensaje en página: ${pageMessages}`);
  }
  
  // Tomar screenshot
  await page.screenshot({ path: 'test-results/debug-otp-completo.png', fullPage: true });
  
  console.log('\n📊 RESUMEN:');
  console.log(`   Código OTP: ${otpCode}`);
  console.log(`   URL final: ${currentUrl}`);
  console.log(`   Redirigido a menú: ${currentUrl.includes('menu')}`);
  console.log(`   Errores encontrados: ${errorMessages.length}`);
});