import { test, expect } from '@playwright/test';

test('debug OTP verification con logs', async ({ page }) => {
  // Capturar logs del navegador
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  console.log('🐛 Debug OTP verification...');
  
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
  
  // Esperar un momento para que aparezca el código en consola
  await page.waitForTimeout(2000);
  
  // Ingresar OTP
  await page.fill('#otp', '123456');
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
  await page.screenshot({ path: 'debug-otp-verification.png', fullPage: true });
  
  console.log('✅ Debug completado');
});