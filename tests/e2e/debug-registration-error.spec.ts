import { test, expect } from '@playwright/test';

test('debug error en registro', async ({ page }) => {
  console.log('🐛 Debug error en registro...');
  
  // Navegar a la página
  await page.goto('http://localhost:5173');
  console.log('Página cargada');
  
  // Esperar y llenar el formulario
  await page.waitForSelector('#nombre', { state: 'visible' });
  console.log('Formulario visible');
  
  await page.fill('#nombre', 'Test User');
  await page.fill('#telefono', '5551234567');
  await page.fill('#email', 'test@example.com');
  await page.fill('#fechaNacimiento', '1990-01-01');
  
  // Marcar checkboxes
  await page.check('input[type="checkbox"]');
  
  console.log('Datos llenados, haciendo clic en enviar...');
  
  // Hacer clic en enviar y esperar respuesta
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForResponse(response => 
      response.url().includes('/startLoginWithOtp') || 
      response.url().includes('/iniciar_login_otp') ||
      response.status() === 200,
      { timeout: 10000 }
    ).catch(() => console.log('No se recibió respuesta del servidor'))
  ]);
  
  console.log('Formulario enviado, esperando resultado...');
  
  // Esperar un momento para ver que pasa
  await page.waitForTimeout(2000);
  
  // Verificar si hay mensaje de error
  const errorMessage = await page.locator('text=/Hubo un error|error|Error/i').first().textContent().catch(() => null);
  console.log('Mensaje de error encontrado:', errorMessage);
  
  // Verificar consola del navegador
  const consoleLogs = await page.evaluate(() => {
    return window.console.logs || [];
  }).catch(() => []);
  
  console.log('Logs de consola:', consoleLogs);
  
  // Tomar screenshot para debug
  await page.screenshot({ path: 'debug-registration-error.png', fullPage: true });
  
  console.log('Test completado para debug');
});