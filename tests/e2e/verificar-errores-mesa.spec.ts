import { test, expect } from '@playwright/test';

test('verificar que no hay errores 406 al hacer clic en mesas', async ({ page }) => {
  console.log('🔍 Verificando errores al interactuar con mesas...');
  
  // Capturar todos los errores de consola
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Error de consola capturado:', msg.text());
    }
  });

  // Capturar respuestas fallidas
  const failedResponses: any[] = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      failedResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log('📡 Respuesta fallida:', response.url(), response.status());
    }
  });

  // Navegar al dashboard
  console.log('🌐 Navegando al dashboard...');
  await page.goto('http://localhost:3000/#/dashboard');
  
  // Esperar a que carguen las mesas
  await page.waitForTimeout(3000);
  
  // Hacer clic en algunas mesas
  const mesas = await page.locator('[class*="mesa"], [class*="table"], button').filter({ hasText: /Mesa \d|MESA\d/i }).elementHandles();
  console.log(`📋 Se encontraron ${mesas.length} elementos de mesa`);
  
  for (let i = 0; i < Math.min(3, mesas.length); i++) {
    const mesa = mesas[i];
    const text = await mesa.textContent();
    console.log(`🖱️ Haciendo clic en: ${text}`);
    
    await mesa.click();
    await page.waitForTimeout(2000);
  }
  
  // Verificar resultados
  console.log('\n📊 Resultados:');
  console.log(`❌ Errores de consola: ${consoleErrors.length}`);
  console.log(`📡 Respuestas fallidas: ${failedResponses.length}`);
  
  if (consoleErrors.length > 0) {
    console.log('\n📝 Errores de consola encontrados:');
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  if (failedResponses.length > 0) {
    console.log('\n📡 Respuestas fallidas:');
    failedResponses.forEach((response, i) => {
      console.log(`  ${i + 1}. ${response.status} ${response.statusText} - ${response.url}`);
    });
  }
  
  // Verificar que no haya errores 406 específicos
  const has406Errors = failedResponses.some(r => r.status === 406);
  const hasJsonErrors = consoleErrors.some(e => e.includes('Cannot coerce the result to a single JSON object'));
  
  if (has406Errors) {
    console.log('❌ Se encontraron errores 406 - Las correcciones no funcionaron');
  } else {
    console.log('✅ No se encontraron errores 406 - Las correcciones funcionaron!');
  }
  
  if (hasJsonErrors) {
    console.log('❌ Aún hay errores de coerción JSON');
  } else {
    console.log('✅ No hay errores de coerción JSON');
  }
  
  expect(has406Errors).toBe(false);
  expect(hasJsonErrors).toBe(false);
});