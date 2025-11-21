import { test, expect } from '@playwright/test';

test('verificar estado de mesas A1, B1, C1', async ({ page }) => {
  console.log('🔍 Verificando estado de mesas...');
  
  // Verificar A1
  await page.goto('#/checkin?mesa=A1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Buscar mensaje de error o formulario
  const tieneError = await page.locator('p:has-text("no existe")').count() > 0;
  const tieneFormulario = await page.locator('#nombre').count() > 0;
  console.log('A1 - Tiene error:', tieneError, 'Tiene formulario:', tieneFormulario);
  
  if (tieneError) {
    const mensajeError = await page.locator('p:has-text("no existe")').textContent();
    console.log('A1 Mensaje de error:', mensajeError);
  }
  
  // Verificar B1
  await page.goto('#/checkin?mesa=B1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const tieneErrorB1 = await page.locator('p:has-text("no existe")').count() > 0;
  const tieneFormularioB1 = await page.locator('#nombre').count() > 0;
  console.log('B1 - Tiene error:', tieneErrorB1, 'Tiene formulario:', tieneFormularioB1);
  
  if (tieneErrorB1) {
    const mensajeErrorB1 = await page.locator('p:has-text("no existe")').textContent();
    console.log('B1 Mensaje de error:', mensajeErrorB1);
  }
  
  // Verificar C1
  await page.goto('#/checkin?mesa=C1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const tieneErrorC1 = await page.locator('p:has-text("no existe")').count() > 0;
  const tieneFormularioC1 = await page.locator('#nombre').count() > 0;
  console.log('C1 - Tiene error:', tieneErrorC1, 'Tiene formulario:', tieneFormularioC1);
  
  if (tieneErrorC1) {
    const mensajeErrorC1 = await page.locator('p:has-text("no existe")').textContent();
    console.log('C1 Mensaje de error:', mensajeErrorC1);
  }
});