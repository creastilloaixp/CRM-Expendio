import { test, expect } from '@playwright/test';

test('investigar por qué el botón está deshabilitado', async ({ page }) => {
  console.log('🔍 Investigando por qué el botón está deshabilitado...');
  
  // Navegar a check-in con Mesa 3
  console.log('🌐 Navegando a checkin con Mesa 3...');
  await page.goto('http://localhost:3000/#/checkin?mesa=Mesa 3');
  
  // Esperar a que cargue completamente
  await page.waitForTimeout(2000);
  
  // Verificar el botón paso a paso
  const button = await page.locator('button[type="submit"]').first();
  
  // Verificar atributos del botón
  const isDisabled = await button.isDisabled();
  const text = await button.textContent();
  console.log(`📊 Botón: Texto="${text}", Deshabilitado=${isDisabled}`);
  
  // Verificar atributos HTML
  const disabledAttr = await button.getAttribute('disabled');
  const ariaDisabled = await button.getAttribute('aria-disabled');
  console.log(`🔍 Atributos: disabled="${disabledAttr}", aria-disabled="${ariaDisabled}"`);
  
  // Verificar clases CSS
  const className = await button.getAttribute('class');
  console.log(`🎨 Clases CSS: ${className}`);
  
  // Verificar estilos computados
  const styles = await button.evaluate(el => {
    return {
      opacity: window.getComputedStyle(el).opacity,
      cursor: window.getComputedStyle(el).cursor,
      backgroundColor: window.getComputedStyle(el).backgroundColor
    };
  });
  console.log('🎨 Estilos computados:', styles);
  
  // Llenar el formulario completamente
  console.log('📝 Llenando formulario completamente...');
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="nombre"]', 'Test User');
  await page.fill('input[id="telefono"]', '1234567890');
  await page.fill('input[id="fechaNacimiento"]', '1990-01-01');
  await page.check('input[id="termsAccepted"]');
  
  // Verificar cada campo después de llenarlo
  const emailValue = await page.inputValue('input[id="email"]');
  const nombreValue = await page.inputValue('input[id="nombre"]');
  const telefonoValue = await page.inputValue('input[id="telefono"]');
  const fechaValue = await page.inputValue('input[id="fechaNacimiento"]');
  const termsChecked = await page.isChecked('input[id="termsAccepted"]');
  
  console.log('\n📋 Verificación de campos:');
  console.log(`   Email: "${emailValue}"`);
  console.log(`   Nombre: "${nombreValue}"`);
  console.log(`   Teléfono: "${telefonoValue}"`);
  console.log(`   Fecha: "${fechaValue}"`);
  console.log(`   Términos: ${termsChecked}`);
  
  // Verificar botón después de llenar todo
  const isDisabledAfter = await button.isDisabled();
  console.log(`\n📊 Botón después de llenar formulario: Deshabilitado=${isDisabledAfter}`);
  
  // Si sigue deshabilitado, verificar si hay algún mensaje de error o validación
  const errorMessages = await page.locator('*:has-text("requerido"), *:has-text("inválido"), *:has-text("error")').elementHandles();
  if (errorMessages.length > 0) {
    console.log(`\n⚠️ Se encontraron ${errorMessages.length} posibles mensajes de error:`);
    for (let i = 0; i < Math.min(3, errorMessages.length); i++) {
      const msg = errorMessages[i];
      const text = await msg.textContent();
      console.log(`   ${i + 1}. "${text}"`);
    }
  }
  
  // Verificar si hay algún patrón o validación en los campos
  const emailPattern = await page.locator('input[id="email"]').getAttribute('pattern');
  const telefonoPattern = await page.locator('input[id="telefono"]').getAttribute('pattern');
  console.log(`\n🔍 Patrones de validación:`);
  console.log(`   Email pattern: ${emailPattern}`);
  console.log(`   Teléfono pattern: ${telefonoPattern}`);
  
  // Intentar hacer clic en el botón deshabilitado para ver si hay algún mensaje
  try {
    await button.click({ force: true });
    console.log('\n🖱️ Se hizo clic forzado en el botón');
    
    // Esperar un momento para ver si aparece algún mensaje
    await page.waitForTimeout(1000);
    
    // Verificar si apareció algún mensaje después del clic
    const newMessages = await page.locator('*:has-text("requerido"), *:has-text("inválido"), *:has-text("error")').elementHandles();
    if (newMessages.length > errorMessages.length) {
      console.log('⚠️ Aparecieron nuevos mensajes después del clic forzado');
    }
    
  } catch (e) {
    console.log('\n❌ No se pudo hacer clic en el botón deshabilitado');
  }
  
  console.log('\n📊 Investigación completada');
  
  expect(true).toBe(true);
});