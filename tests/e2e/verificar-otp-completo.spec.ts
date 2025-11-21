import { test, expect } from '@playwright/test';

test('verificar OTP completo con mesa disponible', async ({ page }) => {
  console.log('🔍 Verificando OTP completo con mesa disponible...');
  
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
  
  // Usar Mesa 1 que sabemos que está disponible
  console.log('🚀 Usando Mesa 1...');
  await page.goto('#/checkin?mesa=Mesa%201');
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
  
  // Esperar a capturar el código OTP
  await page.waitForTimeout(2000);
  
  if (!otpCode) {
    console.log('❌ No se capturó el código OTP');
    return;
  }
  
  // Llenar OTP
  await page.fill('#otp', otpCode);
  console.log(`✅ OTP ingresado: ${otpCode}`);
  
  // Hacer clic en verificar
  console.log('🔄 Verificando OTP...');
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar para ver resultados
  await page.waitForTimeout(5000);
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log(`URL actual: ${page.url()}`);
  console.log(`OTP usado: ${otpCode}`);
  
  if (otpResponse) {
    console.log('✅ Respuesta OTP:', otpResponse);
  }
  
  if (visitResponse) {
    console.log('✅ Respuesta visita:', visitResponse);
  }
  
  // Verificar si se redirigió al menú
  const currentUrl = page.url();
  if (currentUrl.includes('menu')) {
    console.log('🎉 ¡ÉXITO! Se redirigió al menú');
  } else {
    console.log('❌ No se redirigió al menú');
  }
  
  expect(currentUrl).toContain('menu');
});