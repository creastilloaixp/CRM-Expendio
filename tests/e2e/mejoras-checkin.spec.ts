import { test, expect } from '@playwright/test';

test('verificar mejoras de check-in - mesa no disponible', async ({ page }) => {
  console.log('🔍 Verificando mejoras de check-in con mesa no disponible...');
  
  // Probar con una mesa que sabemos que está ocupada (Mesa 1)
  await page.goto('#/checkin?mesa=Mesa%201');
  await page.waitForLoadState('networkidle');
  
  // Verificar que se muestra mensaje de error con mesas alternativas
  await expect(page.locator('text=Lo sentimos')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=La mesa "Mesa 1" no está disponible')).toBeVisible();
  await expect(page.locator('text=Mesas disponibles:')).toBeVisible();
  
  // Verificar que hay botones de mesas alternativas
  const alternativeButtons = await page.locator('button:has-text("Ir a Mesa")').all();
  console.log(`✅ Encontrados ${alternativeButtons.length} botones de mesas alternativas`);
  
  // Probar con una mesa disponible (Mesa 8)
  console.log('\n🚀 Probando con mesa disponible...');
  await page.goto('#/checkin?mesa=Mesa%208');
  await page.waitForLoadState('networkidle');
  
  // Verificar que el formulario se muestra directamente
  await expect(page.locator('#nombre')).toBeVisible({ timeout: 10000 });
  
  // Verificar que se muestra el estado de la mesa
  await expect(page.locator('text=Mesa: Mesa 8')).toBeVisible();
  
  console.log('✅ Mejoras de check-in verificadas exitosamente');
});

test('verificar validación mejorada de edad', async ({ page }) => {
  console.log('🔍 Verificando validación de edad mejorada...');
  
  await page.goto('#/checkin?mesa=Mesa%208');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#nombre', { timeout: 10000 });
  
  // Llenar formulario con fecha de nacimiento inválida (menor de edad)
  const today = new Date();
  const minorDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
  
  await page.fill('#nombre', 'Joven Usuario');
  await page.fill('#email', 'joven@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', minorDate.toISOString().split('T')[0]);
  await page.check('#termsAccepted');
  
  await page.click('button[type="submit"]');
  
  // Verificar mensaje de error específico de edad
  await expect(page.locator('text=Debes ser mayor de 18 años')).toBeVisible();
  await expect(page.locator('text=Tu edad actual es 17 años')).toBeVisible();
  
  console.log('✅ Validación de edad mejorada verificada');
});

test('verificar indicadores de carga y mensajes claros', async ({ page }) => {
  console.log('🔍 Verificando indicadores de carga...');
  
  await page.goto('#/checkin?mesa=Mesa%208');
  
  // Verificar indicador de carga inicial
  await expect(page.locator('text=Verificando disponibilidad de la mesa...')).toBeVisible();
  
  // Esperar a que cargue el formulario
  await page.waitForSelector('#nombre', { timeout: 10000 });
  
  // Llenar formulario y enviar
  await page.fill('#nombre', 'Test Usuario');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  await page.click('button[type="submit"]');
  
  // Verificar indicador de carga al enviar OTP
  await expect(page.locator('text=Enviando código...')).toBeVisible();
  
  // Esperar campo OTP
  await page.waitForSelector('#otp', { timeout: 10000 });
  
  // Verificar mensaje informativo para desarrollo
  await expect(page.locator('text=Modo desarrollo:')).toBeVisible();
  await expect(page.locator('text=El código OTP aparecerá en la consola')).toBeVisible();
  
  console.log('✅ Indicadores de carga verificados');
});

test('verificar OTP completo con mejoras', async ({ page }) => {
  console.log('🔍 Verificando proceso OTP completo con mejoras...');
  
  let otpCode = '';
  
  // Capturar OTP de consola
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('CÓDIGO OTP PARA DESARROLLO:')) {
      otpCode = text.split('CÓDIGO OTP PARA DESARROLLO:')[1].trim();
      console.log(`🎯 OTP capturado: ${otpCode}`);
    }
  });
  
  await page.goto('#/checkin?mesa=Mesa%208');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#nombre', { timeout: 10000 });
  
  // Llenar formulario
  await page.fill('#nombre', 'Usuario Mejorado');
  await page.fill('#email', 'mejorado@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  // Verificar consejo de desarrollo
  await expect(page.locator('text=Consejo para desarrollo:')).toBeVisible();
  await expect(page.locator('text=revisa la consola del navegador')).toBeVisible();
  
  await page.click('button[type="submit"]');
  
  // Esperar OTP
  await page.waitForSelector('#otp', { timeout: 10000 });
  
  // Verificar que se capturó el OTP
  expect(otpCode).toBeTruthy();
  
  // Llenar OTP
  await page.fill('#otp', otpCode);
  
  // Verificar botón con texto de verificación
  await expect(page.locator('button:has-text("Confirmar Check-in")')).toBeVisible();
  
  await page.click('button:has-text("Confirmar Check-in")');
  
  // Esperar redirección o mensaje de éxito
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  console.log(`🌐 URL final: ${currentUrl}`);
  
  if (currentUrl.includes('menu')) {
    console.log('🎉 ¡Éxito completo con mejoras!');
  } else {
    console.log('⚠️ Verificar mensaje de éxito en página');
    await expect(page.locator('text=¡Check-in exitoso!')).toBeVisible();
  }
});