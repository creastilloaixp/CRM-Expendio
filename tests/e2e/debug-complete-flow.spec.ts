import { test, expect } from '@playwright/test';

test('debug complete OTP flow with visit creation', async ({ page }) => {
  console.log('🚀 Debug completo de flujo OTP con creación de visita...');
  
  let capturedOtpCode = '';
  let capturedOtpId = '';
  let verificationResponse = null;
  let visitCreationResponse = null;
  let visitCreationError = null;
  
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
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // Navegar al CheckIn
  await page.goto('http://localhost:3000/#/checkin?mesa=MESA1');
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
    
    // Esperar más tiempo para ver toda la secuencia
    await page.waitForTimeout(5000);
    
    console.log('📊 Resultados finales:');
    console.log('✅ OTP Verification:', verificationResponse);
    console.log('📋 Visit Creation:', visitCreationResponse);
    console.log('❌ Visit Creation Error:', visitCreationError);
    
    // Verificar estado final
    const currentUrl = page.url();
    console.log('🌐 URL final:', currentUrl);
    
    if (currentUrl.includes('menu')) {
      console.log('✅ Redirigido al menú - TODO EXITOSO');
    } else {
      console.log('❌ No se redirigió al menú');
      
      // Verificar mensajes en la página
      const pageContent = await page.textContent('body');
      console.log('📄 Contenido de la página:', pageContent?.substring(0, 500));
      
      // Buscar mensajes de error específicos
      const errorMessages = await page.locator('p.text-red-600, .text-red-600, .error').allTextContents();
      console.log('❌ Mensajes de error encontrados:', errorMessages);
    }
    
  } else {
    console.log('❌ No se capturó código OTP');
  }
  
  console.log('✅ Debug completado');
});