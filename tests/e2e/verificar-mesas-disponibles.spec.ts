import { test, expect } from '@playwright/test';

test('verificar mesas disponibles en página principal', async ({ page }) => {
  console.log('🔍 Verificando mesas disponibles...');
  
  // Ir a la página principal
  await page.goto('#/');
  await page.waitForLoadState('networkidle');
  
  // Esperar a que carguen las mesas
  await page.waitForTimeout(3000);
  
  // Buscar todas las mesas en la página
  const mesaElements = await page.locator('text=/Mesa \\d+/').all();
  console.log(`📊 Se encontraron ${mesaElements.length} elementos de mesa`);
  
  // Ver el contenido de la página
  const pageContent = await page.textContent('body');
  console.log('📄 Contenido de la página:');
  console.log(pageContent);
  
  // Buscar estados de mesa
  const estados = ['Libre', 'Ocupada', 'Reservada'];
  for (const estado of estados) {
    const elementos = await page.locator(`text=${estado}`).all();
    console.log(`📋 ${estado}: ${elementos.length} elementos encontrados`);
  }
  
  // Probar con Mesa 8 (última disponible)
  console.log('\n🚀 Probando con Mesa 8...');
  await page.goto('#/checkin?mesa=Mesa%208');
  await page.waitForLoadState('networkidle');
  
  // Verificar si el formulario carga
  try {
    await page.waitForSelector('#nombre', { timeout: 5000 });
    console.log('✅ Mesa 8 - Formulario disponible');
    
    // Hacer un check-in completo
    await page.fill('#nombre', 'Juan Pérez');
    await page.fill('#email', 'juan@example.com');
    await page.fill('#telefono', '1234567890');
    await page.fill('#fechaNacimiento', '1990-01-01');
    await page.check('#termsAccepted');
    
    await page.click('button[type="submit"]');
    
    // Esperar OTP
    await page.waitForSelector('#otp', { timeout: 10000 });
    console.log('🎉 Mesa 8 - ¡Formulario aceptado!');
    
    // Capturar OTP
    let otpCode = '';
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('CÓDIGO OTP PARA DESARROLLO:')) {
        otpCode = text.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
        console.log(`🎯 OTP: ${otpCode}`);
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (otpCode) {
      // Verificar OTP
      await page.fill('#otp', otpCode);
      await page.click('button:has-text("Confirmar Check-in")');
      
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`🌐 URL final: ${currentUrl}`);
      
      if (currentUrl.includes('menu')) {
        console.log('🎉 ¡ÉXITO COMPLETO! Check-in realizado correctamente');
      } else {
        console.log('⚠️ Check-in incompleto');
      }
    }
    
  } catch (error) {
    console.log(`❌ Mesa 8 - Error: ${error}`);
  }
});