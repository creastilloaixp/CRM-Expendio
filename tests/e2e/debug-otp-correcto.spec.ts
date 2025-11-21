import { test, expect } from '@playwright/test';

test('debug OTP con captura correcta de código', async ({ page }) => {
  console.log('🔍 Debug OTP con captura correcta...');
  
  let otpCode = '';
  const allConsoleMessages: string[] = [];
  
  // Configurar captura de consola ANTES de navegar
  page.on('console', (msg) => {
    const text = msg.text();
    allConsoleMessages.push(text);
    console.log(`📝 Consola: ${text}`);
    
    // Capturar el código OTP en tiempo real
    if (text.includes('CÓDIGO OTP PARA DESARROLLO:')) {
      otpCode = text.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
      console.log(`🎯 OTP CAPTURADO: ${otpCode}`);
    }
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
  
  // Esperar campo OTP con timeout más largo
  await page.waitForSelector('#otp', { timeout: 15000 });
  
  // Esperar un momento adicional para capturar logs
  await page.waitForTimeout(2000);
  
  console.log(`📋 Código OTP capturado: "${otpCode}"`);
  
  if (!otpCode) {
    console.log('⚠️ No se capturó OTP, buscando en logs...');
    console.log('Todos los mensajes de consola:');
    allConsoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });
    
    // Buscar manualmente en los logs
    for (const msg of allConsoleMessages) {
      if (msg.includes('CÓDIGO OTP PARA DESARROLLO:')) {
        otpCode = msg.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
        console.log(`🎯 OTP ENCONTRADO MANUALMENTE: ${otpCode}`);
        break;
      }
    }
  }
  
  if (!otpCode) {
    console.log('❌ No se pudo obtener el código OTP');
    return;
  }
  
  // Llenar OTP con el código correcto
  await page.fill('#otp', otpCode);
  console.log(`✅ OTP ingresado: ${otpCode}`);
  
  // Capturar respuestas de red
  let otpResponse: any = null;
  let visitResponse: any = null;
  
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
  } else {
    console.log('❌ No se capturó respuesta OTP');
  }
  
  if (visitResponse) {
    console.log('✅ Respuesta visita:', visitResponse);
  } else {
    console.log('❌ No se capturó respuesta visita');
  }
  
  // Verificar si hay mensajes de error
  const pageContent = await page.content();
  if (pageContent.includes('Error') || pageContent.includes('error')) {
    console.log('⚠️ Se encontraron mensajes de error en la página');
  }
});