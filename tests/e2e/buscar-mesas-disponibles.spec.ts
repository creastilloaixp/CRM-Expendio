import { test, expect } from '@playwright/test';

test('encontrar mesas disponibles', async ({ page }) => {
  console.log('🔍 Buscando mesas disponibles...');
  
  // Ir a la página principal para ver las mesas
  await page.goto('#/');
  await page.waitForLoadState('networkidle');
  
  // Esperar a que carguen las mesas
  await page.waitForTimeout(3000);
  
  // Capturar el contenido de la página
  const content = await page.content();
  
  // Buscar información sobre las mesas
  const mesaElements = await page.locator('[class*="mesa"], [class*="table"], .bg-white').all();
  
  console.log(`📊 Se encontraron ${mesaElements.length} elementos de mesa`);
  
  // Probar diferentes números de mesa
  const mesasParaProbar = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8'];
  
  for (const mesa of mesasParaProbar) {
    console.log(`\n🔄 Probando ${mesa}...`);
    
    // Navegar directamente al check-in de esta mesa
    await page.goto(`#/checkin?mesa=${encodeURIComponent(mesa)}`);
    await page.waitForLoadState('networkidle');
    
    // Verificar si la página carga correctamente
    try {
      await page.waitForSelector('input#nombre', { timeout: 5000 });
      console.log(`✅ ${mesa} - Formulario disponible`);
      
      // Intentar un check-in rápido para ver si está disponible
      await page.fill('#nombre', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#telefono', '1234567890');
      await page.fill('#fechaNacimiento', '1990-01-01');
      await page.check('#termsAccepted');
      
      await page.click('button[type="submit"]');
      
      // Esperar a ver qué pasa
      await page.waitForTimeout(3000);
      
      // Verificar si aparece el campo OTP (indica que el formulario fue aceptado)
      const otpVisible = await page.locator('#otp').isVisible().catch(() => false);
      
      if (otpVisible) {
        console.log(`🎉 ${mesa} - ¡DISPONIBLE! El formulario fue aceptado.`);
        
        // Obtener el código OTP
        let otpCode = '';
        page.on('console', (msg) => {
          const text = msg.text();
          if (text.includes('CÓDIGO OTP PARA DESARROLLO:')) {
            otpCode = text.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
          }
        });
        
        await page.waitForTimeout(1000);
        
        if (otpCode) {
          console.log(`🎯 ${mesa} - Código OTP: ${otpCode}`);
          
          // Probar la verificación
          await page.fill('#otp', otpCode);
          await page.click('button:has-text("Confirmar Check-in")');
          
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          if (currentUrl.includes('menu')) {
            console.log(`🚀 ${mesa} - ¡CHECK-IN COMPLETO! Redirigido al menú.`);
            break;
          } else {
            console.log(`⚠️ ${mesa} - OTP verificado pero no redirigió al menú`);
          }
        }
        
      } else {
        console.log(`❌ ${mesa} - No disponible (no aparece OTP)`);
      }
      
    } catch (error) {
      console.log(`❌ ${mesa} - Error al cargar: ${error}`);
    }
  }
});