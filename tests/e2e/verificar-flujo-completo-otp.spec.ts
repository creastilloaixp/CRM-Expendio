import { test, expect } from '@playwright/test';

test('verificar flujo completo hasta OTP', async ({ page }) => {
  console.log('🔄 Verificando flujo completo de check-in hasta OTP...');
  
  // Navegar a check-in con Mesa 3 (libre)
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  
  // Esperar a que cargue completamente
  await page.waitForTimeout(2000);
  
  console.log('📝 Llenando formulario paso a paso...');
  
  // Llenar cada campo individualmente y verificar
  await page.fill('input[id="email"]', 'testflujo@example.com');
  const emailValue = await page.inputValue('input[id="email"]');
  console.log(`✅ Email: "${emailValue}"`);
  
  await page.fill('input[id="nombre"]', 'Test Flujo');
  const nombreValue = await page.inputValue('input[id="nombre"]');
  console.log(`✅ Nombre: "${nombreValue}"`);
  
  await page.fill('input[id="telefono"]', '1234567890');
  const telefonoValue = await page.inputValue('input[id="telefono"]');
  console.log(`✅ Teléfono: "${telefonoValue}"`);
  
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  const fechaValue = await page.inputValue('input[id="fechaNacimiento"]');
  console.log(`✅ Fecha: "${fechaValue}"`);
  
  // Marcar checkbox de términos (¡ESTO ES CRÍTICO!)
  console.log('✅ Marcando checkbox de términos...');
  await page.check('input[id="termsAccepted"]');
  const termsChecked = await page.isChecked('input[id="termsAccepted"]');
  console.log(`✅ Términos aceptados: ${termsChecked}`);
  
  // Verificar que el botón esté habilitado
  const button = await page.locator('button[type="submit"]').first();
  const isDisabled = await button.isDisabled();
  console.log(`📊 Botón antes de enviar: Deshabilitado=${isDisabled}`);
  
  // Hacer clic en el botón
  console.log('🖱️ Haciendo clic en "Verificar y Continuar"...');
  await button.click();
  
  // Esperar a que el estado cambie
  await page.waitForTimeout(3000);
  
  // Verificar si aparece el campo OTP
  console.log('🔍 Buscando campo OTP...');
  const otpField = await page.locator('input[id="otp"]').elementHandles();
  const otpVisible = await page.locator('input[id="otp"]').isVisible().catch(() => false);
  
  console.log(`✅ Campo OTP encontrado: ${otpField.length > 0}`);
  console.log(`✅ Campo OTP visible: ${otpVisible}`);
  
  // Verificar mensaje de estado
  const statusMessage = await page.locator('p:text-matches("enviado un código|Se ha enviado")').textContent().catch(() => 'No encontrado');
  console.log(`📨 Mensaje de estado: "${statusMessage}"`);
  
  // Verificar que estemos en el estado correcto
  const currentUrl = page.url();
  console.log(`🌐 URL actual: ${currentUrl}`);
  
  // Tomar screenshot para verificar el estado visual
  await page.screenshot({ path: 'test-results/flujo-completo-otp.png', fullPage: true });
  console.log('📸 Screenshot guardado en test-results/flujo-completo-otp.png');
  
  // Si el campo OTP apareció, el flujo está funcionando
  if (otpVisible) {
    console.log('✅ ÉXITO: El campo OTP apareció correctamente después del envío del formulario');
  } else {
    console.log('❌ PROBLEMA: El campo OTP no apareció después del envío del formulario');
    
    // Buscar mensajes de error
    const errorMessages = await page.locator('*:has-text("error"), *:has-text("Error"), *:has-text("requerido"), *:has-text("inválido")').elementHandles();
    if (errorMessages.length > 0) {
      console.log(`⚠️ Se encontraron ${errorMessages.length} posibles mensajes de error:`);
      for (let i = 0; i < Math.min(3, errorMessages.length); i++) {
        const msg = errorMessages[i];
        const text = await msg.textContent();
        console.log(`   ${i + 1}. "${text}"`);
      }
    }
  }
  
  expect(otpVisible).toBe(true);
});