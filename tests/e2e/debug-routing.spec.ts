import { test, expect } from '@playwright/test';

test('debug navigation and routing', async ({ page }) => {
  console.log('🚀 Debug navegación y routing...');
  
  // Verificar URL base
  console.log('📍 Verificando URL base...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log('🌐 URL actual:', page.url());
  
  // Verificar qué componente se está renderizando
  const title = await page.locator('h1').textContent();
  console.log('📋 Título principal:', title);
  
  // Verificar si hay algún redirect
  const content = await page.textContent('body');
  console.log('📄 Contenido de la página:', content?.substring(0, 200));
  
  // Intentar navegar directamente al CheckIn
  console.log('🔄 Navegando a CheckIn...');
  await page.goto('http://localhost:5173/#/checkin?mesa=MESA1');
  await page.waitForLoadState('networkidle');
  
  console.log('🌐 URL después de navegar:', page.url());
  
  const newTitle = await page.locator('h1').textContent();
  console.log('📋 Nuevo título:', newTitle);
  
  const newContent = await page.textContent('body');
  console.log('📄 Nuevo contenido:', newContent?.substring(0, 200));
  
  // Verificar si hay algún mensaje de error
  const errorMessage = await page.locator('.error, .text-red-600').textContent().catch(() => '');
  console.log('❌ Mensaje de error:', errorMessage);
  
  // Tomar screenshot
  await page.screenshot({ path: 'test-results/debug-routing.png' });
  
  console.log('🔍 Debug de navegación completado');
});