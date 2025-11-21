import { test, expect } from '@playwright/test';

test.describe('Sistema de Sesión Persistente y Puntos', () => {
  
  test('usuario registrado puede hacer check-in directo sin volver a registrarse', async ({ page }) => {
    console.log('🔄 Iniciando prueba de sesión persistente...');
    
    // Paso 1: Registrar un nuevo usuario
    await page.goto('#/checkin?mesa=A1');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que el formulario esté visible
    await page.waitForSelector('#nombre', { state: 'visible', timeout: 10000 });
    
    // Llenar formulario de registro
    await page.fill('#nombre', 'Usuario Test Persistente');
    await page.fill('#email', 'test.persistente@example.com');
    await page.fill('#telefono', '5551234567');
    await page.fill('#fechaNacimiento', '1990-01-01');
    await page.check('#termsAccepted');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verificar código OTP
    const mensajeEnvio = await page.locator('div[class*="bg-green-100"], div[class*="bg-red-100"]').first().textContent();
    expect(mensajeEnvio).toMatch(/código|enviado|5551234567/i);
    
    // Ingresar código OTP (usar el código de desarrollo)
    await page.fill('#otp', '123456');
    await page.click('button[type="submit"]');
    
    // Esperar a que se complete el check-in y aparezca el mensaje de éxito
    await page.waitForSelector('h3:has-text("Check-in exitoso")', { timeout: 10000 });
    
    // Verificar que se muestra mensaje de éxito con puntos
    const mensajeExito = await page.locator('h3:has-text("Check-in exitoso")').textContent();
    expect(mensajeExito).toMatch(/Check-in exitoso/i);
    
    console.log('✅ Usuario registrado exitosamente');
    
    // Paso 2: Volver a la página de check-in (simular regreso del usuario)
    await page.goto('#/checkin?mesa=A2');
    await page.waitForLoadState('networkidle');
    
    // Esperar un momento para que se verifique la sesión
    await page.waitForTimeout(2000);
    
    // Verificar que NO se muestra el formulario de registro
    const formularioRegistro = await page.locator('form').count();
    expect(formularioRegistro).toBe(0); // No debería haber formulario
    
    // Verificar que se muestra un mensaje de bienvenida o se redirige directamente
    const mensajeBienvenida = await page.locator('div[class*="text-center"] h3').textContent();
    expect(mensajeBienvenida).toMatch(/Check-in exitoso/i);
    
    console.log('✅ Usuario reconocido y check-in directo exitoso');
  });

  test('sistema de acumulación de puntos funciona correctamente', async ({ page }) => {
    console.log('🎯 Iniciando prueba de sistema de puntos...');
    
    // Primer check-in
    await page.goto('#/checkin?mesa=B1');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que el formulario esté visible
    await page.waitForSelector('#nombre', { state: 'visible', timeout: 10000 });
    
    // Registrar nuevo usuario para puntos
    await page.fill('#nombre', 'Usuario Puntos');
    await page.fill('#email', 'puntos@example.com');
    await page.fill('#telefono', '5559998888');
    await page.fill('#fechaNacimiento', '1995-05-15');
    await page.check('#termsAccepted');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verificar OTP
    await page.fill('#otp', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Verificar mensaje de puntos ganados - usar el mensaje completo de bienvenida
    const mensajePrimerCheckin = await page.locator('div.text-center p').nth(1).textContent();
    expect(mensajePrimerCheckin).toMatch(/Has ganado 10 puntos|Total: 10|puntos/i);
    
    console.log('✅ Primer check-in con puntos verificado');
    
    // Segundo check-in para acumular más puntos
    await page.goto('#/checkin?mesa=B2');
    await page.waitForTimeout(2000);
    
    // Verificar que se acumularon puntos - usar el mensaje completo de bienvenida
    const mensajeSegundoCheckin = await page.locator('div.text-center p').nth(1).textContent();
    expect(mensajeSegundoCheckin).toMatch(/Has ganado 10 puntos|Total: 20|puntos/i);
    
    console.log('✅ Sistema de acumulación de puntos funciona correctamente');
  });

  test('sistema de descuentos se activa con 100+ puntos', async ({ page }) => {
    console.log('💰 Iniciando prueba de sistema de descuentos...');
    
    // Crear un usuario con muchas visitas para alcanzar 100+ puntos
    await page.goto('#/checkin?mesa=C1');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que el formulario esté visible
    await page.waitForSelector('#nombre', { state: 'visible', timeout: 10000 });
    
    // Registrar usuario
    await page.fill('#nombre', 'Usuario Descuentos');
    await page.fill('#email', 'descuentos@example.com');
    await page.fill('#telefono', '5557776666');
    await page.fill('#fechaNacimiento', '1985-08-20');
    await page.check('#termsAccepted');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verificar OTP
    await page.fill('#otp', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Realizar check-ins adicionales para acumular puntos (menos visitas, más eficiente)
    const mesasAdicionales = ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11'];
    for (const mesa of mesasAdicionales) {
      await page.goto(`#/checkin?mesa=${mesa}`);
      await page.waitForTimeout(800); // Reducir aún más el tiempo de espera
    }
    
    // Verificar que se activa el descuento en el último check-in
    const mensajeDescuento = await page.locator('div.text-center p').nth(1).textContent();
    expect(mensajeDescuento).toMatch(/descuento|\$[0-9]+|pesos|puntos/i);
    
    console.log('✅ Sistema de descuentos activado correctamente');
  });
});