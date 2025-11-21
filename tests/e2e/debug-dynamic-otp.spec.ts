import { test, expect } from '@playwright/test';

test('debug OTP con código dinámico', async ({ page }) => {
  let capturedOtp = '';
  
  // Capturar logs del navegador y extraer el OTP
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER LOG:', text);
    
    // Buscar el patrón del OTP en el log
    const otpMatch = text.match(/Mock OTP para.*?(\d{6})/);
    if (otpMatch) {
      capturedOtp = otpMatch[1];
      console.log('OTP capturado:', capturedOtp);
    }
  });
  
  console.log('🐛 Debug OTP con código dinámico...');
  
  // Ir a mesa A1
  await page.goto('http://localhost:3000/#/checkin?mesa=A1');
  await page.waitForLoadState('networkidle');
  
  console.log('Página cargada, esperando formulario...');
  
  // Esperar formulario
  await page.waitForSelector('#nombre', { state: 'visible', timeout: 10000 });
  
  console.log('Formulario visible, llenando datos...');
  
  // Llenar formulario
  await page.fill('#nombre', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '5551234567');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  console.log('Datos llenados, enviando formulario...');
  
  // Enviar formulario
  await page.click('button[type="submit"]');
  
  console.log('Formulario enviado, esperando OTP...');
  
  // Esperar pantalla OTP
  await page.waitForSelector('#otp', { state: 'visible', timeout: 10000 });
  
  console.log('Pantalla OTP visible, esperando código...');
  
  // Esperar a que aparezca el código en consola
  await page.waitForTimeout(3000);
  
  if (capturedOtp) {
    console.log('Usando OTP capturado:', capturedOtp);
    // Ingresar OTP capturado
    await page.fill('#otp', capturedOtp);
  } else {
    console.log('No se capturó OTP, usando 123456 por defecto');
    await page.fill('#otp', '123456');
  }
  
  await page.click('button[type="submit"]');
  
  console.log('OTP enviado, esperando resultado...');
  
  // Esperar 5 segundos para ver qué pasa
  await page.waitForTimeout(5000);
  
  // Verificar el estado actual
  const currentUrl = page.url();
  console.log('URL actual:', currentUrl);
  
  const currentContent = await page.textContent('body');
  console.log('Contenido actual:', currentContent);
  
  // Tomar screenshot
  await page.screenshot({ path: 'debug-dynamic-otp.png', fullPage: true });
  
  console.log('✅ Debug completado');
});