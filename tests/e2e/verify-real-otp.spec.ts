import { test, expect } from '@playwright/test';

test('verify OTP with actual generated code', async ({ page }) => {
  console.log('🚀 Verificando OTP con código real generado...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  
  // Capturar la respuesta del OTP
  page.on('response', async (response) => {
    if (response.url().includes('iniciar_login_otp')) {
      try {
        const data = await response.json();
        console.log('📨 OTP Response:', JSON.stringify(data, null, 2));
        if (data.otp_code) {
          capturedOtpCode = data.otp_code;
          capturedOtpId = data.otp_id;
          console.log('🔢 Código OTP capturado:', capturedOtpCode);
          console.log('🆔 OTP ID capturado:', capturedOtpId);
        }
      } catch (e) {
        console.log('❌ Error al parsear respuesta:', e);
      }
    }
  });
  
  // Navegar al CheckIn
  await page.goto('http://localhost:3000/#/checkin?mesa=MESA1');
  await page.waitForLoadState('networkidle');
  
  console.log('📋 Llenando formulario...');
  
  // Llenar el formulario completo
  await page.locator('#nombre').fill('Test User');
  await page.locator('#email').fill('test@user.com');
  await page.locator('#telefono').fill('1234567890');
  await page.locator('#fechaNacimiento').fill('1990-01-01');
  
  // Aceptar términos
  await page.locator('input[type="checkbox"]').first().check();
  
  console.log('📤 Enviando formulario...');
  await page.locator('button[type="submit"]').click();
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('#otp', { timeout: 10000 });
  console.log('✅ Campo OTP apareció');
  
  // Verificar el mensaje en la página
  const pageMessage = await page.textContent('p.text-gray-600');
  console.log('📄 Mensaje en página:', pageMessage);
  
  // Verificar que el mensaje de confirmación esté presente
  const confirmationMessage = await page.textContent('p.text-gray-600');
  console.log('📄 Mensaje de confirmación:', confirmationMessage);
  
  if (capturedOtpCode) {
    console.log('🔑 Usando código real:', capturedOtpCode);
    
    // Llenar el campo OTP con el código real
    await page.locator('#otp').fill(capturedOtpCode);
    
    // Tomar screenshot antes de verificar
    await page.screenshot({ path: 'test-results/verify-real-otp-filled.png' });
    
    // Hacer clic en verificar
    await page.locator('button[type="submit"]').click();
    
    // Esperar resultado
    await page.waitForTimeout(3000);
    
    // Verificar el resultado
    const currentUrl = page.url();
    console.log('🌐 URL actual:', currentUrl);
    
    if (currentUrl.includes('menu')) {
      console.log('✅ Verificación exitosa - redirigido al menú');
    } else {
      // Buscar mensaje de error
      const errorMessage = await page.locator('p.text-red-600, .text-red-600').textContent().catch(() => '');
      console.log('❌ Mensaje de error:', errorMessage);
      
      if (errorMessage.includes('incorrecto')) {
        console.log('🚨 EL CÓDIGO REAL FUE RECHAZADO - Hay un problema con la verificación');
      }
    }
    
  } else {
    console.log('❌ No se capturó ningún código OTP');
  }
  
  // Tomar screenshot final
  await page.screenshot({ path: 'test-results/verify-real-otp-final.png' });
  
  console.log('✅ Test completado');
});