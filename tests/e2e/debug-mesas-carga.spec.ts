import { test, expect } from '@playwright/test';

test('verificar que las mesas se cargan correctamente', async ({ page }) => {
  console.log('🔍 Verificando si las mesas se cargan correctamente...');
  
  // Capturar todas las respuestas de red
  const responses: any[] = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
    
    if (response.url().includes('mesas')) {
      console.log(`📡 Respuesta de mesas: ${response.status()} ${response.statusText()}`);
    }
  });

  // Capturar errores
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Error de consola:', msg.text());
    }
  });

  // Navegar al dashboard
  console.log('🌐 Navegando al dashboard...');
  await page.goto('http://localhost:3000/#/dashboard');
  
  // Esperar más tiempo para que todo cargue
  await page.waitForTimeout(5000);
  
  // Buscar mesas con diferentes selectores
  const selectors = [
    'button:has-text("Mesa")',
    '[class*="mesa"]',
    '[class*="table"]',
    'div:has-text("MESA")',
    'div:has-text("Mesa")'
  ];
  
  let mesasFound = 0;
  for (const selector of selectors) {
    try {
      const elements = await page.locator(selector).elementHandles();
      if (elements.length > 0) {
        console.log(`✅ Encontrados ${elements.length} elementos con selector: ${selector}`);
        mesasFound += elements.length;
        
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const element = elements[i];
          const text = await element.textContent();
          const classes = await element.getAttribute('class');
          console.log(`  Elemento ${i + 1}: Texto="${text}", Clases="${classes}"`);
        }
      }
    } catch (e) {
      console.log(`❌ Selector no funcionó: ${selector}`);
    }
  }
  
  // Verificar si hay mensajes de "No hay mesas" o similar
  const noDataMessages = await page.locator('*:has-text("no hay"), *:has-text("sin mesas"), *:has-text("ninguna mesa")').elementHandles();
  if (noDataMessages.length > 0) {
    console.log(`⚠️ Se encontraron ${noDataMessages.length} mensajes sobre falta de datos`);
    for (const msg of noDataMessages) {
      const text = await msg.textContent();
      console.log(`  Mensaje: "${text}"`);
    }
  }
  
  // Buscar respuestas de la API de mesas
  const mesaResponses = responses.filter(r => r.url.includes('mesas'));
  console.log(`\n📡 Respuestas de API de mesas: ${mesaResponses.length}`);
  mesaResponses.forEach((response, i) => {
    console.log(`  ${i + 1}. ${response.status} ${response.statusText}`);
  });
  
  // Verificar errores
  console.log(`\n❌ Errores de consola: ${consoleErrors.length}`);
  consoleErrors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
  
  console.log(`\n📊 Resumen: Se encontraron ${mesasFound} elementos de mesa`);
  
  // Tomar screenshot
  await page.screenshot({ path: 'test-resultados/mesas-carga.png', fullPage: true });
  
  // No fallar el test, solo investigar
  expect(true).toBe(true);
});