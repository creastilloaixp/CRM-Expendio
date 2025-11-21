import { test, expect } from '@playwright/test';

test('debug error de registro detallado', async ({ page }) => {
  console.log('🐛 Debug error de registro detallado...');
  
  // Ir a mesa A1
  await page.goto('http://localhost:3000/#/checkin?mesa=A1');
  await page.waitForLoadState('networkidle');
  
  console.log('Página cargada, esperando formulario...');
  
  // Capturar logs de consola
  page.on('console', msg => {
    console.log('Consola del navegador:', msg.text());
  });
  
  // Capturar errores de red
  page.on('response', response => {
    console.log(`Respuesta: ${response.status()} ${response.url()}`);
    if (response.status() >= 400) {
      console.log(`Error de red: ${response.status()} ${response.url()}`);
    }
  });
  
  // Esperar formulario
  await page.waitForSelector('#nombre', { state: 'visible', timeout: 10000 });
  
  console.log('Formulario visible, llenando datos...');
  
  // Llenar formulario
  await page.fill('#nombre', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '5551234567');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  console.log('Datos llenados, haciendo clic en enviar...');
  
  // Hacer clic en enviar
  await page.click('button[type="submit"]');
  
  console.log('Esperando respuesta...');
  
  // Esperar un momento para ver que pasa
  await page.waitForTimeout(3000);
  
  // Verificar si hay mensaje de error
  const errorElement = await page.locator('text=/Hubo un error|error|Error/i').first();
  const errorVisible = await errorElement.isVisible();
  
  if (errorVisible) {
    const errorText = await errorElement.textContent();
    console.log('Mensaje de error encontrado:', errorText);
  } else {
    console.log('No se encontró mensaje de error visible');
  }
  
  // Verificar el estado actual
  const currentUrl = page.url();
  console.log('URL actual:', currentUrl);
  
  const bodyText = await page.textContent('body');
  console.log('Texto de la página (primeros 1000 chars):', bodyText?.substring(0, 1000));
  
  // Tomar screenshot para debug
  await page.screenshot({ path: 'debug-registration-detailed.png', fullPage: true });
  
  console.log('Test de debug completado');
});