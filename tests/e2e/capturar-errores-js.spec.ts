import { test, expect } from '@playwright/test';

test('capturar errores de consola y red', async ({ page }) => {
  console.log('🔍 Capturando errores de consola y red...');
  
  // Array para almacenar errores
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  const allConsoleMessages: string[] = [];
  
  // Escuchar mensajes de consola
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    allConsoleMessages.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    console.log(`📝 Consola: ${text}`);
  });
  
  // Escuchar errores de red
  page.on('response', (response) => {
    if (response.status() >= 400) {
      const error = `HTTP ${response.status()}: ${response.url()}`;
      networkErrors.push(error);
      console.log(`❌ Error de red: ${error}`);
    }
  });
  
  // Navegar a check-in con Mesa 3
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  await page.waitForTimeout(3000);
  
  console.log('📝 Mensajes de consola hasta ahora:');
  allConsoleMessages.forEach(msg => console.log(`   ${msg}`));
  
  // Llenar formulario
  console.log('📝 Llenando formulario...');
  await page.fill('input[id="email"]', 'testerrors@example.com');
  await page.fill('input[id="nombre"]', 'Test Errors');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  // Hacer clic en el botón
  console.log('🖱️ Haciendo clic en el botón...');
  await page.click('button[type="submit"]');
  
  // Esperar un momento
  await page.waitForTimeout(5000);
  
  console.log('\n📊 RESUMEN DE ERRORES:');
  console.log(`🔴 Errores de consola: ${consoleErrors.length}`);
  consoleErrors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
  
  console.log(`🔴 Errores de red: ${networkErrors.length}`);
  networkErrors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
  
  console.log('\n📋 TODOS LOS MENSAJES DE CONSOLA:');
  allConsoleMessages.forEach(msg => console.log(`   ${msg}`));
  
  // Verificar si hay errores críticos
  const hasCriticalErrors = consoleErrors.length > 0 || networkErrors.length > 0;
  
  if (hasCriticalErrors) {
    console.log('❌ SE ENCONTRARON ERRORES QUE PODRÍAN BLOQUEAR EL FLUJO');
  } else {
    console.log('✅ NO SE ENCONTRARON ERRORES CRÍTICOS');
  }
  
  // Tomar screenshot
  await page.screenshot({ path: 'test-results/errors-captura.png', fullPage: true });
  
  expect(hasCriticalErrors).toBe(false);
});