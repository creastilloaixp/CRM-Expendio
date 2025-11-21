import { test, expect } from '@playwright/test';

test('verificar mesas directamente desde API', async ({ page }) => {
  console.log('🔍 Verificando mesas directamente desde la API...');
  
  // Agregar una función de debug en la página
  await page.addInitScript(() => {
    window.debugMesas = async () => {
      try {
        const { getMesas } = await import('../services/api');
        const { data, error } = await getMesas();
        console.log('📋 Mesas desde API:', data);
        console.log('❌ Error desde API:', error);
        return { data, error };
      } catch (e) {
        console.log('❌ Error al llamar getMesas:', e);
        return { data: null, error: e };
      }
    };
  });
  
  // Navegar a la página
  await page.goto('http://localhost:3000/');
  
  // Esperar a que cargue
  await page.waitForTimeout(3000);
  
  // Ejecutar la función debug
  const resultado = await page.evaluate(async () => {
    try {
      const { getMesas } = await import('../services/api');
      const { data, error } = await getMesas();
      console.log('📋 Mesas desde API:', data);
      console.log('❌ Error desde API:', error);
      return { data, error: error?.message || error };
    } catch (e) {
      console.log('❌ Error al llamar getMesas:', e);
      return { data: null, error: e.message || e };
    }
  });
  
  console.log('📊 Resultado de getMesas:', resultado);
  
  if (resultado.data) {
    console.log('✅ Mesas encontradas:', resultado.data.length);
    resultado.data.forEach((mesa, index) => {
      console.log(`  Mesa ${index + 1}: ${mesa.nombre} (ID: ${mesa.id})`);
    });
  } else {
    console.log('❌ No se encontraron mesas o hubo error:', resultado.error);
  }
  
  // También verificar directamente con Supabase
  const resultadoSupabase = await page.evaluate(async () => {
    try {
      const { supabase } = await import('../services/supabaseClient');
      const { data, error } = await supabase.from('mesas').select('*');
      console.log('📋 Mesas desde Supabase directo:', data);
      console.log('❌ Error desde Supabase:', error);
      return { data, error: error?.message || error };
    } catch (e) {
      console.log('❌ Error al llamar Supabase:', e);
      return { data: null, error: e.message || e };
    }
  });
  
  console.log('📊 Resultado de Supabase directo:', resultadoSupabase);
  
  // Tomar screenshot
  await page.screenshot({ path: 'test-results/verificar-mesas-api.png' });
  
  console.log('✅ Test completado');
});