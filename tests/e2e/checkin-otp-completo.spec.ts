import { test, expect } from '@playwright/test';

test('completar check-in exitoso con OTP - Mesa 8', async ({ page }) => {
  console.log('🎯 Completando check-in con OTP para Mesa 8...');
  
  let otpCode = '';
  let otpResponse: any = null;
  let visitResponse: any = null;
  
  // Capturar código OTP desde consola
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('CÓDIGO OTP PARA DESARROLLO:')) {
      otpCode = text.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
      console.log(`🎯 OTP CAPTURADO: ${otpCode}`);
    }
  });
  
  // Capturar respuestas de red
  page.on('response', async (response) => {
    const url = response.url();
    
    if (url.includes('rest/v1/rpc/verificar_otp')) {
      console.log(`📡 Respuesta verificar_otp: ${response.status()}`);
      try {
        const data = await response.json();
        otpResponse = data;
        console.log('📊 Datos OTP:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('❌ Error al parsear respuesta OTP:', e);
      }
    }
    
    if (url.includes('rest/v1/rpc/iniciar_visita')) {
      console.log(`📡 Respuesta iniciar_visita: ${response.status()}`);
      try {
        const data = await response.json();
        visitResponse = data;
        console.log('📊 Datos visita:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('❌ Error al parsear respuesta visita:', e);
      }
    }
  });
  
  // Paso 1: Navegar a check-in con Mesa 8
  console.log('🚀 Paso 1: Navegando a check-in Mesa 8...');
  await page.goto('#/checkin?mesa=Mesa%208');
  await page.waitForLoadState('networkidle');
  
  // Paso 2: Llenar formulario
  console.log('📝 Paso 2: Llenando formulario...');
  await page.fill('#nombre', 'Juan Pérez');
  await page.fill('#email', 'juan@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  // Paso 3: Enviar formulario
  console.log('📤 Paso 3: Enviando formulario...');
  await page.click('button[type="submit"]');
  
  // Paso 4: Esperar campo OTP
  console.log('⏳ Paso 4: Esperando campo OTP...');
  await page.waitForSelector('#otp', { timeout: 10000 });
  console.log('✅ Campo OTP apareció');
  
  // Paso 5: Capturar y esperar OTP
  await page.waitForTimeout(2000); // Esperar a que se capture el OTP
  
  if (!otpCode) {
    console.log('❌ No se capturó el código OTP');
    return;
  }
  
  console.log(`✅ OTP listo: ${otpCode}`);
  
  // Paso 6: Llenar OTP
  console.log('🔢 Paso 6: Llenando código OTP...');
  await page.fill('#otp', otpCode);
  
  // Paso 7: Verificar OTP
  console.log('🔍 Paso 7: Verificando OTP...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Paso 8: Esperar resultado
  console.log('⏳ Paso 8: Esperando resultado...');
  await page.waitForTimeout(5000);
  
  // Resultado final
  const currentUrl = page.url();
  console.log('\n📊 RESULTADO FINAL:');
  console.log(`🌐 URL final: ${currentUrl}`);
  console.log(`🔑 OTP usado: ${otpCode}`);
  
  if (otpResponse) {
    console.log('✅ Verificación OTP:', otpResponse.success ? 'EXITOSA' : 'FALLIDA');
  }
  
  if (visitResponse) {
    console.log('✅ Creación visita:', visitResponse.success ? 'EXITOSA' : 'FALLIDA');
    if (!visitResponse.success) {
      console.log(`❌ Razón: ${visitResponse.message}`);
    }
  }
  
  // Verificar redirección
  if (currentUrl.includes('menu')) {
    console.log('🎉 ¡ÉXITO! Redirigido al menú');
  } else {
    console.log('❌ No se redirigió al menú');
  }
  
  // Expectativa: debe redirigir al menú
  expect(currentUrl).toContain('menu');
});