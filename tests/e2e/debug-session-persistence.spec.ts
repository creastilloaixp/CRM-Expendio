import { test, expect } from '@playwright/test';

test.describe('Debug Session Persistence', () => {
  
  test('debug session persistence flow', async ({ page }) => {
    // Capturar mensajes de consola del navegador
    page.on('console', msg => {
      console.log('🌐 Browser console:', msg.text());
    });
    
    console.log('🔄 Iniciando debug de sesión persistente...');
    
    // Paso 1: Registrar un nuevo usuario
    await page.goto('#/checkin?mesa=A1');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que el formulario esté visible
    await page.waitForSelector('#nombre', { state: 'visible', timeout: 10000 });
    
    console.log('📋 Formulario visible, llenando datos...');
    
    // Llenar formulario de registro
    await page.fill('#nombre', 'Usuario Debug');
    await page.fill('#email', 'debug@example.com');
    await page.fill('#telefono', '5551234567');
    await page.fill('#fechaNacimiento', '1990-01-01');
    await page.check('#termsAccepted');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('📱 Esperando OTP...');
    
    // Verificar código OTP
    await page.fill('#otp', '123456');
    await page.click('button[type="submit"]');
    
    // Esperar a que se complete el check-in
    await page.waitForSelector('h3:has-text("Check-in exitoso")', { timeout: 10000 });
    
    console.log('✅ Primer check-in completado');
    
    // Debug: Verificar localStorage
    const localStorageData = await page.evaluate(() => {
      return {
        crm_session: localStorage.getItem('crm_session'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('💾 localStorage:', localStorageData);
    
    // Paso 2: Volver a la página de check-in
    console.log('🔄 Navegando a segunda mesa...');
    await page.goto('#/checkin?mesa=A2');
    await page.waitForLoadState('networkidle');
    
    // Debug: Verificar qué estado se muestra
    await page.waitForTimeout(3000); // Esperar más tiempo para que se complete la verificación
    
    const pageContent = await page.evaluate(() => {
      return {
        statusText: document.body.innerText,
        forms: document.querySelectorAll('form').length,
        headers: Array.from(document.querySelectorAll('h3')).map(h => h.textContent),
        messages: Array.from(document.querySelectorAll('[class*="green-"], [class*="yellow-"]')).map(m => m.textContent),
        statusIndicators: Array.from(document.querySelectorAll('div[class*="text-center"]')).map(d => d.textContent)
      };
    });
    
    console.log('📄 Contenido de la página:', pageContent);
    
    // Verificar si hay formulario
    const formCount = await page.locator('form').count();
    console.log('📝 Número de formularios:', formCount);
    
    // Verificar si hay mensaje de bienvenida
    const welcomeMessages = await page.locator('h3').allTextContents();
    console.log('📢 Mensajes de bienvenida:', welcomeMessages);
    
    // Verificar el estado actual del componente
    const componentState = await page.evaluate(() => {
      // Buscar elementos que indiquen el estado
      const loadingElement = document.querySelector('div[class*="animate-spin"]');
      const errorElement = document.querySelector('div[class*="text-red-"]');
      const successElement = document.querySelector('div[class*="text-green-"]');
      
      return {
        isLoading: !!loadingElement,
        isError: !!errorElement,
        isSuccess: !!successElement,
        currentUrl: window.location.href
      };
    });
    
    console.log('🔍 Estado del componente:', componentState);
    
    console.log('🔍 Debug completado');
  });
});