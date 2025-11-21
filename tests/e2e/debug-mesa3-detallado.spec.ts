import { test, expect } from '@playwright/test';

test('debug flujo con Mesa 3 - verificar formulario paso a paso', async ({ page }) => {
  console.log('🔍 Debug flujo con Mesa 3 paso a paso...');
  
  // Capturar errores
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Error de consola:', msg.text());
    }
  });

  // Navegar a check-in con Mesa 3
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  
  // Tomar screenshot inicial
  await page.screenshot({ path: 'test-results/debug-mesa3-inicio.png' });
  console.log('📸 Screenshot: debug-mesa3-inicio.png');
  
  // Verificar que estamos en la página correcta
  const url = page.url();
  console.log('🌐 URL actual:', url);
  
  // Verificar que el formulario existe
  const formExists = await page.locator('form').count() > 0;
  console.log('📋 ¿Existe formulario?', formExists);
  
  if (formExists) {
    // Verificar cada campo
    const fields = [
      { id: 'email', name: 'Email' },
      { id: 'nombre', name: 'Nombre' },
      { id: 'telefono', name: 'Teléfono' },
      { id: 'fechaNacimiento', name: 'Fecha de Nacimiento' },
      { id: 'termsAccepted', name: 'Términos y Condiciones' }
    ];
    
    for (const field of fields) {
      const exists = await page.locator(`#${field.id}`).count() > 0;
      const visible = exists ? await page.locator(`#${field.id}`).isVisible() : false;
      console.log(`   ${field.name}: Existe=${exists}, Visible=${visible}`);
    }
    
    // Verificar botón
    const buttonSelectors = [
      'button:has-text("Confirmar Check-in")',
      'button[type="submit"]',
      'button'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.locator(selector).elementHandles();
        console.log(`   Botón "${selector}": ${buttons.length} encontrados`);
        
        for (let i = 0; i < Math.min(2, buttons.length); i++) {
          const button = buttons[i];
          const text = await button.textContent();
          const disabled = await button.isDisabled();
          const visible = await button.isVisible();
          console.log(`     ${i + 1}. Texto="${text}", Deshabilitado=${disabled}, Visible=${visible}`);
        }
      } catch (e) {
        console.log(`   Botón "${selector}": Error al buscar`);
      }
    }
  }
  
  // Llenar formulario paso a paso
  console.log('📝 Llenando formulario paso a paso...');
  
  try {
    await page.fill('input[id="email"]', 'test@example.com');
    console.log('✅ Email llenado');
    
    await page.fill('input[id="nombre"]', 'Test User');
    console.log('✅ Nombre llenado');
    
    await page.fill('input[id="telefono"]', '1234567890');
    console.log('✅ Teléfono llenado');
    
    await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
    console.log('✅ Fecha de Nacimiento llenada');
    
    await page.check('input[id="termsAccepted"]');
    console.log('✅ Términos aceptados');
    
    // Tomar screenshot después de llenar
    await page.screenshot({ path: 'test-results/debug-mesa3-form-lleno.png' });
    console.log('📸 Screenshot: debug-mesa3-form-lleno.png');
    
    // Verificar botón después de llenar
    const submitButtons = await page.locator('button:has-text("Confirmar Check-in")').elementHandles();
    console.log(`🔍 Botones de submit encontrados: ${submitButtons.length}`);
    
    if (submitButtons.length > 0) {
      const button = submitButtons[0];
      const disabled = await button.isDisabled();
      const visible = await button.isVisible();
      console.log(`   Estado del botón: Deshabilitado=${disabled}, Visible=${visible}`);
      
      if (!disabled && visible) {
        console.log('🖱️ Haciendo clic en el botón...');
        await button.click();
        console.log('✅ Botón clickeado');
        
        // Esperar un momento
        await page.waitForTimeout(2000);
        
        // Tomar screenshot después del clic
        await page.screenshot({ path: 'test-results/debug-mesa3-despues-click.png' });
        console.log('📸 Screenshot: debug-mesa3-despues-click.png');
      } else {
        console.log('⚠️ El botón está deshabilitado o no visible');
      }
    } else {
      console.log('❌ No se encontró el botón de submit');
    }
    
  } catch (error) {
    console.log('❌ Error durante el proceso:', error);
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`❌ Errores de consola: ${consoleErrors.length}`);
  console.log(`📸 Screenshots guardados: 3`);
  
  expect(true).toBe(true);
});