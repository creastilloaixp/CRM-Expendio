import { test, expect } from '@playwright/test';

test('debug OTP verificación - captura respuesta exacta', async ({ page }) => {
  console.log('🔍 Debug detallado de verificación OTP...');
  
  let otpResponse: any = null;
  let visitResponse: any = null;
  
  // Interceptar todas las respuestas de red
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
  
  // Capturar mensajes de consola
  page.on('console', (msg) => {
    console.log(`📝 Consola [${msg.type()}]: ${msg.text()}`);
  });
  
  // Navegar a check-in
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
  
  // Esperar campo OTP
  await page.waitForSelector('#otp', { timeout: 10000 });
  
  // Obtener OTP del console.log
  let otpCode = '';
  const logs: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('CÓDIGO OTP PARA DESARROLLO:')) {
      otpCode = text.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
      console.log(`🎯 Código OTP encontrado: ${otpCode}`);
    }
  });
  
  // Esperar un momento para capturar logs
  await page.waitForTimeout(1000);
  
  if (!otpCode) {
    console.log('⚠️ No se encontró código OTP, usando 123456');
    otpCode = '123456';
  }
  
  // Llenar OTP
  await page.fill('#otp', otpCode);
  
  console.log('🔄 Verificando OTP...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar más tiempo para ver todas las respuestas
  await page.waitForTimeout(3000);
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log(`URL actual: ${page.url()}`);
  console.log(`OTP usado: ${otpCode}`);
  
  if (otpResponse) {
    console.log('Respuesta OTP:', otpResponse);
  } else {
    console.log('❌ No se capturó respuesta OTP');
  }
  
  if (visitResponse) {
    console.log('Respuesta visita:', visitResponse);
  } else {
    console.log('❌ No se capturó respuesta visita');
  }
  
  // Verificar estado actual
  const currentStatus = await page.locator('body').textContent();
  if (currentStatus?.includes('Error')) {
    console.log('❌ Se encontró mensaje de error en la página');
  }
});