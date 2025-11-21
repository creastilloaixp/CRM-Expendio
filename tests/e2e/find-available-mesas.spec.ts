import { test, expect } from '@playwright/test';

test('encontrar mesas disponibles reales', async ({ page }) => {
  console.log('🔍 Buscando mesas disponibles reales...');
  
  // Probar con algunas mesas que deberían existir según el mock
  const mesasParaProbar = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3', 'Terraza 1', 'Terraza 2', 'Terraza 3'];
  
  for (const mesa of mesasParaProbar) {
    await page.goto(`#/checkin?mesa=${mesa}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const tieneError = await page.locator('p:has-text("no existe")').count() > 0;
    const tieneFormulario = await page.locator('#nombre').count() > 0;
    
    console.log(`${mesa} - Error: ${tieneError}, Formulario: ${tieneFormulario}`);
    
    if (tieneFormulario) {
      console.log(`🎉 ENCONTRADA: ${mesa} tiene formulario disponible!`);
      break;
    }
  }
  
  // También probar con mesas que sabemos que están ocupadas según el mock
  console.log('\nVerificando mesas ocupadas según mock:');
  const mesasOcupadas = ['B2', 'F3', 'Terraza 2'];
  
  for (const mesa of mesasOcupadas) {
    await page.goto(`#/checkin?mesa=${mesa}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const mensaje = await page.locator('p').filter({ hasText: /no está disponible|no existe/i }).textContent();
    console.log(`${mesa} - Estado: ${mensaje}`);
  }
});