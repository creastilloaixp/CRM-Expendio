import { test, expect } from '@playwright/test';

test('debug flujo simple de check-in', async ({ page }) => {
  console.log('🐛 Debug flujo simple...');
  
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
  
  console.log('Pantalla OTP visible, ingresando código...');
  
  // Ingresar OTP
  await page.fill('#otp', '123456');
  await page.click('button[type="submit"]');
  
  console.log('OTP enviado, esperando resultado...');
  
  // Esperar un momento
  await page.waitForTimeout(5000);
  
  console.log('Contenido de la página:');
  const contenido = await page.content();
  console.log(contenido.substring(0, 2000)); // Primeros 2000 caracteres
  
  // Tomar screenshot
  await page.screenshot({ path: 'debug-simple-flow.png', fullPage: true });
  
  console.log('✅ Debug completado');
});