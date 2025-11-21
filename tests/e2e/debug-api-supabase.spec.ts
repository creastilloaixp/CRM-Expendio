import { test, expect } from '@playwright/test';

test('verificar API de mesas directamente', async ({ page }) => {
  console.log('🔍 Verificando API de mesas directamente...');
  
  // Capturar todas las respuestas
  const allResponses: any[] = [];
  page.on('response', response => {
    const info = {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      timestamp: new Date().toISOString()
    };
    allResponses.push(info);
    
    console.log(`📡 ${response.status()} ${response.statusText()} - ${response.url()}`);
  });

  // También capturar requests
  const allRequests: any[] = [];
  page.on('request', request => {
    allRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  // Navegar al dashboard
  console.log('🌐 Navegando al dashboard...');
  await page.goto('http://localhost:3000/#/dashboard');
  
  // Esperar más tiempo
  await page.waitForTimeout(6000);
  
  // Buscar requests a Supabase
  const supabaseRequests = allRequests.filter(r => r.url.includes('supabase'));
  const supabaseResponses = allResponses.filter(r => r.url.includes('supabase'));
  
  console.log(`\n📊 Análisis de Supabase:`);
  console.log(`📤 Requests a Supabase: ${supabaseRequests.length}`);
  console.log(`📥 Responses de Supabase: ${supabaseResponses.length}`);
  
  if (supabaseRequests.length > 0) {
    console.log('\n📤 Requests:');
    supabaseRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url}`);
    });
  }
  
  if (supabaseResponses.length > 0) {
    console.log('\n📥 Responses:');
    supabaseResponses.forEach((res, i) => {
      console.log(`  ${i + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });
  }
  
  // Buscar específicamente errores 401 o 403 (problemas de autenticación)
  const authErrors = supabaseResponses.filter(r => r.status === 401 || r.status === 403);
  if (authErrors.length > 0) {
    console.log(`\n🚨 Errores de autenticación encontrados: ${authErrors.length}`);
    authErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.status} - ${error.url}`);
    });
  }
  
  // Buscar errores 404
  const notFoundErrors = supabaseResponses.filter(r => r.status === 404);
  if (notFoundErrors.length > 0) {
    console.log(`\n🚨 Errores 404 encontrados: ${notFoundErrors.length}`);
    notFoundErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.status} - ${error.url}`);
    });
  }
  
  console.log(`\n📈 Resumen total:`);
  console.log(`   Total requests: ${allRequests.length}`);
  console.log(`   Total responses: ${allResponses.length}`);
  console.log(`   Requests a Supabase: ${supabaseRequests.length}`);
  console.log(`   Responses de Supabase: ${supabaseResponses.length}`);
  
  // Tomar screenshot final
  await page.screenshot({ path: 'test-resultados/api-analisis.png', fullPage: true });
  
  // Si no hay requests a Supabase, eso explica el problema
  if (supabaseRequests.length === 0) {
    console.log('\n⚠️  No se hicieron requests a Supabase - Las mesas no se están cargando');
  }
  
  expect(true).toBe(true);
});