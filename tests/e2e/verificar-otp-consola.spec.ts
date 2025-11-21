import { test, expect } from '@playwright/test';

test('verificar que el código OTP se muestra en consola', async ({ page }) => {
  console.log('🔍 Verificando que el código OTP se muestre en consola...');
  
  // Array para capturar mensajes de consola
  const consoleMessages: string[] = [];
  
  // Escuchar mensajes de consola
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`📝 Consola capturada: ${text}`);
  });
  
  // Navegar a check-in con Mesa 3
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  await page.waitForTimeout(2000);
  
  // Llenar formulario
  console.log('📝 Llenando formulario...');
  await page.fill('input[id="email"]', 'testotp@example.com');
  await page.fill('input[id="nombre"]', 'Test OTP');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  // Hacer clic en el botón
  console.log('🖱️ Haciendo clic en "Verificar y Continuar"...');
  await page.click('button[type="submit"]');
  
  // Esperar a que el mensaje aparezca
  await page.waitForTimeout(3000);
  
  // Buscar mensaje de OTP en consola
  const otpMessage = consoleMessages.find(msg => 
    msg.includes('CÓDIGO OTP PARA DESARROLLO') || 
    msg.includes('🔢 CÓDIGO OTP')
  );
  
  console.log('\n📊 MENSAJES DE CONSOLA CAPTURADOS:');
  consoleMessages.forEach((msg, i) => {
    console.log(`   ${i + 1}. ${msg}`);
  });
  
  if (otpMessage) {
    console.log(`\n✅ ÉXITO: Se encontró mensaje de OTP: ${otpMessage}`);
    
    // Extraer el código del mensaje
    const otpMatch = otpMessage.match(/CÓDIGO OTP PARA DESARROLLO: (\d{6})/);
    if (otpMatch && otpMatch[1]) {
      console.log(`🎉 CÓDIGO OTP EXTRAÍDO: ${otpMatch[1]}`);
      
      // Ahora usar este código para verificar
      console.log('🔐 Intentando verificar con el código extraído...');
      await page.fill('input[id="otp"]', otpMatch[1]);
      await page.click('button:has-text("Confirmar Check-in")');
      
      // Esperar resultado
      await page.waitForTimeout(3000);
      
      // Verificar si se redirigió al menú
      const currentUrl = page.url();
      console.log(`🌐 URL después de verificar: ${currentUrl}`);
      
      if (currentUrl.includes('menu')) {
        console.log('✅ ÉXITO: Se redirigió al menú correctamente');
      } else {
        console.log('⚠️ No se redirigió al menú, pero el OTP fue mostrado');
      }
    }
  } else {
    console.log('❌ No se encontró mensaje de OTP en consola');
  }
  
  // Tomar screenshot
  await page.screenshot({ path: 'test-results/otp-consola.png', fullPage: true });
  
  expect(otpMessage).toBeTruthy();
});