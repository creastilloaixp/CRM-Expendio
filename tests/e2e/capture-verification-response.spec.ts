import { test, expect } from '@playwright/test';

test('capture OTP verification response', async ({ page }) => {
  console.log('🚀 Capturando respuesta de verificación OTP...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  let verificationResponse = null;
  
  // Capturar la respuesta del OTP
  page.on('response', async (response) => {
    if (response.url().includes('iniciar_login_otp')) {
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
    
    if (response.url().includes('verificar_otp')) {
      try {
        verificationResponse = await response.json();
        console.log('📨 Verification Response:', JSON.stringify(verificationResponse, null, 2));
      } catch (e) {
        console.log('❌ Error al parsear respuesta de verificación:', e);
      }
    }
  });
  
  // Navegar al CheckIn
  await page.goto('http://localhost:3001/#/checkin?mesa=MESA1');
  await page.waitForLoadState('networkidle');
  
  // Llenar el formulario
  await page.locator('#nombre').fill('Test User');
  await page.locator('#email').fill('test@user.com');
  await page.locator('#telefono').fill('1234567890');
  await page.locator('#fechaNacimiento').fill('1990-01-01');
  await page.locator('input[type="checkbox"]').first().check();
  
  // Enviar formulario
  await page.locator('button[type="submit"]').click();
  
  // Esperar a que aparezca el campo OTP
  await page.waitForSelector('#otp', { timeout: 10000 });
  
  if (capturedOtpCode && capturedOtpId) {
    console.log('🔑 Usando código real:', capturedOtpCode);
    
    // Llenar el campo OTP con el código real
    await page.locator('#otp').fill(capturedOtpCode);
    
    // Hacer clic en verificar
    await page.locator('button[type="submit"]').click();
    
    // Esperar respuesta de verificación
    await page.waitForTimeout(3000);
    
    if (verificationResponse) {
      console.log('📊 Resultado de verificación:', verificationResponse);
      
      if (verificationResponse.success) {
        console.log('✅ Verificación exitosa');
      } else {
        console.log('❌ Verificación fallida:', verificationResponse.message);
        
        if (verificationResponse.message === 'Código incorrecto') {
          console.log('🚨 EL CÓDIGO REAL FUE RECHAZADO COMO INCORRECTO');
          console.log('💡 Sugerencia: Revisar la función verificar_otp en la base de datos');
          console.log('💡 Sugerencia: Verificar si hay un problema con el formato del código');
        }
      }
    } else {
      console.log('❌ No se capturó respuesta de verificación');
    }
    
  } else {
    console.log('❌ No se capturó código OTP');
  }
  
  // Verificar estado final
  const currentUrl = page.url();
  console.log('🌐 URL final:', currentUrl);
  
  if (currentUrl.includes('menu')) {
    console.log('✅ Redirigido al menú - verificación exitosa');
  } else {
    console.log('❌ No se redirigió al menú - verificación fallida');
  }
  
  console.log('✅ Test completado');
});