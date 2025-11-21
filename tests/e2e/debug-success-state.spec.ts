import { test, expect } from '@playwright/test';

test('debug estado de éxito después de check-in', async ({ page }) => {
  console.log('🐛 Debug estado de éxito...');
  
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
  
  console.log('OTP enviado, esperando estado de éxito...');
  
  // Esperar específicamente el estado de éxito
  try {
    await page.waitForSelector('h3:has-text("Check-in exitoso")', { state: 'visible', timeout: 10000 });
    console.log('✅ Estado de éxito encontrado!');
    
    // Verificar mensaje de bienvenida
    const successMessage = await page.locator('h3:has-text("Check-in exitoso")').textContent();
    console.log('Mensaje de éxito:', successMessage);
    
    // Verificar si hay mensaje de puntos/descuentos
    const puntosMessage = await page.locator('div.bg-yellow-50').textContent().catch(() => 'No hay mensaje de puntos');
    console.log('Mensaje de puntos:', puntosMessage);
    
    expect(successMessage).toMatch(/Check-in exitoso/i);
    
  } catch (error) {
    console.log('❌ Estado de éxito NO encontrado');
    
    // Tomar screenshot del estado actual
    await page.screenshot({ path: 'debug-failed-success-state.png', fullPage: true });
    
    // Verificar qué está mostrando la página
    const currentContent = await page.textContent('body');
    console.log('Contenido actual de la página:', currentContent?.substring(0, 500));
    
    throw error;
  }
  
  console.log('✅ Debug completado exitosamente');
});