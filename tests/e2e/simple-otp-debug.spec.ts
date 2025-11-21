import { test, expect } from '@playwright/test';

test('simple OTP flow debug', async ({ page }) => {
  console.log('🚀 Iniciando debug simple de flujo OTP...');
  
  // Habilitar captura de console logs
  page.on('console', msg => {
    console.log('🖥️ Console:', msg.text());
  });
  
  // Habilitar captura de errores
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  // Capturar todas las respuestas de red
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('rpc')) {
      console.log('📡 Response:', response.status(), url);
      try {
        const text = await response.text();
        console.log('📄 Response body:', text.substring(0, 500));
      } catch (e) {
        console.log('❌ Could not read response body');
      }
    }
  });
  
  // Navegar al CheckIn
  await page.goto('http://localhost:3001/#/checkin?mesa=MESA1');
  await page.waitForLoadState('networkidle');
  
  console.log('📋 Página cargada, llenando formulario...');
  
  // Llenar el formulario completo
  await page.locator('#nombre').fill('Test Debug');
  await page.locator('#email').fill('test@debug.com');
  await page.locator('#telefono').fill('1234567890');
  await page.locator('#fechaNacimiento').fill('1990-01-01');
  
  // Aceptar términos
  await page.locator('input[type="checkbox"]').first().check();
  
  console.log('📤 Enviando formulario...');
  
  // Hacer clic en el botón
  await page.locator('button[type="submit"]').click();
  
  // Esperar 5 segundos para ver qué pasa
  await page.waitForTimeout(5000);
  
  console.log('🔍 Verificando estado después del envío...');
  
  // Verificar el contenido actual de la página
  const content = await page.textContent('body');
  console.log('📄 Contenido de la página:', content);
  
  // Verificar inputs actuales
  const inputs = await page.locator('input').count();
  console.log('📊 Número de inputs:', inputs);
  
  // Buscar campo OTP
  const otpInputs = await page.locator('input[type="text"]:not([name])').count();
  console.log('📍 Inputs tipo text sin nombre:', otpInputs);
  
  // Tomar screenshot final
  await page.screenshot({ path: 'test-results/simple-debug-final.png' });
  
  console.log('✅ Debug completado');
});