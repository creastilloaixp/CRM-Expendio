import { test, expect } from '@playwright/test';

test('verificar estado actual de las mesas', async ({ page }) => {
  console.log('🔍 Verificando estado actual de las mesas...');
  
  // Capturar errores
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Error:', msg.text());
    }
  });

  // Navegar al dashboard
  console.log('🌐 Navegando al dashboard...');
  await page.goto('http://localhost:3000/#/dashboard');
  
  // Esperar a que carguen las mesas
  await page.waitForTimeout(3000);
  
  // Tomar screenshot para ver el estado
  await page.screenshot({ path: 'test-results/estado-mesas.png', fullPage: true });
  console.log('📸 Screenshot guardado: estado-mesas.png');
  
  // Buscar elementos de mesas
  const mesaElements = await page.locator('[class*="mesa"], [class*="table"]').elementHandles();
  console.log(`📋 Se encontraron ${mesaElements.length} elementos de mesa`);
  
  // Verificar el texto de cada mesa
  for (let i = 0; i < mesaElements.length; i++) {
    const element = mesaElements[i];
    const text = await element.textContent();
    const classes = await element.getAttribute('class');
    console.log(`Mesa ${i + 1}: Texto="${text}", Clases="${classes}"`);
  }
  
  // Buscar específicamente Mesa 2
  const mesa2Elements = await page.locator('*:has-text("Mesa 2")').elementHandles();
  console.log(`\n🔍 Elementos que contienen "Mesa 2": ${mesa2Elements.length}`);
  
  for (let i = 0; i < mesa2Elements.length; i++) {
    const element = mesa2Elements[i];
    const text = await element.textContent();
    const classes = await element.getAttribute('class');
    console.log(`Elemento ${i + 1}: Texto="${text}", Clases="${classes}"`);
  }
  
  // Verificar si hay mensajes de error
  const errorMessages = await page.locator('*:has-text("no está disponible")').elementHandles();
  if (errorMessages.length > 0) {
    console.log(`\n⚠️ Se encontraron ${errorMessages.length} mensajes de error`);
    for (const error of errorMessages) {
      const text = await error.textContent();
      console.log(`Error: "${text}"`);
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`✅ Errores de consola: ${consoleErrors.length}`);
  console.log(`📸 Screenshot: estado-mesas.png`);
  
  // No fallar el test, solo es investigación
  expect(true).toBe(true);
});