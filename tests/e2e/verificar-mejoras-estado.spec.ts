import { test, expect } from '@playwright/test';

test('verificar estado actual de check-in con mejoras', async ({ page }) => {
  console.log('🔍 Verificando estado actual del check-in con mejoras...');
  
  // Primero verificar qué pasa al entrar
  await page.goto('#/checkin?mesa=Mesa%208');
  await page.waitForLoadState('networkidle');
  
  // Tomar screenshot para ver el estado
  await page.screenshot({ path: 'test-results/checkin-estado-actual.png', fullPage: true });
  
  // Ver el contenido de la página
  const content = await page.textContent('body');
  console.log('📄 Contenido de la página:');
  console.log(content);
  
  // Verificar si hay algún mensaje de error o éxito
  if (content?.includes('no está disponible')) {
    console.log('❌ Mesa 8 no está disponible');
    
    // Buscar mesas alternativas sugeridas
    const alternativeButtons = await page.locator('button:has-text("Ir a Mesa")').all();
    console.log(`📋 Mesas alternativas encontradas: ${alternativeButtons.length}`);
    
    if (alternativeButtons.length > 0) {
      // Probar con la primera mesa alternativa
      const firstAlternative = await alternativeButtons[0].textContent();
      console.log(`🔄 Intentando con: ${firstAlternative}`);
      await alternativeButtons[0].click();
      
      // Esperar a que cargue la nueva mesa
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verificar si ahora sí aparece el formulario
      const formVisible = await page.locator('#nombre').isVisible().catch(() => false);
      if (formVisible) {
        console.log('✅ Formulario encontrado en mesa alternativa');
      } else {
        console.log('❌ Formulario no encontrado en mesa alternativa');
      }
    }
  } else if (content?.includes('Verificando disponibilidad')) {
    console.log('⏳ Verificando disponibilidad...');
    
    // Esperar un poco más
    await page.waitForTimeout(3000);
    
    // Verificar nuevamente
    const newContent = await page.textContent('body');
    if (newContent?.includes('Nombre completo')) {
      console.log('✅ Formulario disponible');
    } else {
      console.log('❌ Formulario no disponible después de esperar');
    }
  } else if (content?.includes('Nombre completo')) {
    console.log('✅ Formulario visible directamente');
  } else {
    console.log('❓ Estado desconocido');
  }
});

test('probar todas las mesas hasta encontrar una disponible', async ({ page }) => {
  console.log('🔍 Probando todas las mesas hasta encontrar una disponible...');
  
  const mesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8'];
  
  for (const mesa of mesas) {
    console.log(`\n🔄 Probando ${mesa}...`);
    
    await page.goto(`#/checkin?mesa=${encodeURIComponent(mesa)}`);
    await page.waitForLoadState('networkidle');
    
    // Esperar un momento para que se resuelva la verificación
    await page.waitForTimeout(2000);
    
    // Verificar el estado actual
    const content = await page.textContent('body');
    
    if (content?.includes('Nombre completo')) {
      console.log(`🎉 ¡${mesa} está disponible! Formulario visible.`);
      
      // Verificar que se muestra el estado
      const mesaStatus = await page.locator(`text=Mesa: ${mesa}`).isVisible().catch(() => false);
      if (mesaStatus) {
        console.log(`✅ Se muestra el estado de ${mesa}`);
      }
      
      // Hacer un check-in rápido para verificar que todo funciona
      await page.fill('#nombre', 'Test Usuario');
      await page.fill('#email', 'test@example.com');
      await page.fill('#telefono', '1234567890');
      await page.fill('#fechaNacimiento', '1990-01-01');
      await page.check('#termsAccepted');
      
      await page.click('button[type="submit"]');
      
      // Verificar que aparece el campo OTP
      try {
        await page.waitForSelector('#otp', { timeout: 5000 });
        console.log(`✅ ${mesa} - Proceso de OTP iniciado correctamente`);
        
        // Verificar mensaje de desarrollo
        const devMessage = await page.locator('text=Modo desarrollo:').isVisible().catch(() => false);
        if (devMessage) {
          console.log(`✅ ${mesa} - Mensaje de desarrollo visible`);
        }
        
        break; // Salir del bucle si encontramos una mesa que funciona
      } catch (error) {
        console.log(`❌ ${mesa} - Error al iniciar OTP: ${error}`);
      }
      
    } else if (content?.includes('no está disponible')) {
      console.log(`❌ ${mesa} no está disponible`);
      
      // Verificar si se muestran alternativas
      const alternatives = await page.locator('button:has-text("Ir a Mesa")').all();
      if (alternatives.length > 0) {
        console.log(`📋 ${mesa} - Se sugieren ${alternatives.length} mesas alternativas`);
      }
    } else if (content?.includes('Verificando disponibilidad')) {
      console.log(`⏳ ${mesa} - Verificación en progreso`);
    } else {
      console.log(`❓ ${mesa} - Estado desconocido`);
      console.log('Contenido:', content?.substring(0, 200));
    }
  }
});