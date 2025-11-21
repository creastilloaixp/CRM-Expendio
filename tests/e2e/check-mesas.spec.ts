import { test, expect } from '@playwright/test';

test('verificar mesas disponibles', async ({ page }) => {
  console.log('🔍 Verificando mesas disponibles...');
  
  // Ir a una mesa cualquiera para ver qué error muestra
  await page.goto('#/checkin?mesa=Mesa%2010');
  await page.waitForLoadState('networkidle');
  
  // Esperar a que se cargue el mensaje
  await page.waitForTimeout(2000);
  
  // Ver qué mensaje aparece - buscar el mensaje de error específico
  const mensaje = await page.locator('p').filter({ hasText: /no existe|no está disponible/i }).textContent();
  console.log('Mensaje encontrado:', mensaje);
  
  // También verificar si hay botones de mesas alternativas
  const botonesMesas = await page.locator('button:has-text("Ir a")').allTextContents();
  console.log('Mesas alternativas disponibles:', botonesMesas);
  
  // Probar con una mesa que sabemos que existe según el mock
  await page.goto('#/checkin?mesa=A1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const mensajeA1 = await page.locator('p').filter({ hasText: /no existe|no está disponible/i }).textContent();
  console.log('Mensaje para A1:', mensajeA1);
});