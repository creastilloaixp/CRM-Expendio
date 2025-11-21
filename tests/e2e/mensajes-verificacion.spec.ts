import { test, expect } from '@playwright/test';

test('validar mensajes de verificación mejorados', async ({ page }) => {
  console.log('🔍 Validando mensajes de verificación mejorados...');
  
  // Probar con una mesa que sabemos está disponible
  await page.goto('#/checkin?mesa=Mesa%204');
  await page.waitForLoadState('networkidle');
  
  // Llenar el formulario
  await page.fill('#nombre', 'Test Usuario');
  await page.fill('#email', 'test@example.com');
  await page.fill('#telefono', '1234567890');
  await page.fill('#fechaNacimiento', '1990-01-01');
  await page.check('#termsAccepted');
  
  // Enviar formulario y esperar mensaje de verificación
  await page.click('button[type="submit"]');
  
  // Esperar el mensaje de confirmación de envío de OTP
  await page.waitForTimeout(2000);
  
  // Verificar que el mensaje de envío de OTP es claro
  const mensajeEnvio = await page.locator('div[class*="bg-green-100"], div[class*="bg-red-100"]').first().textContent();
  console.log('📨 Mensaje de envío OTP:', mensajeEnvio);
  
  // Verificar que el mensaje contiene información clara sobre el envío
  expect(mensajeEnvio).toMatch(/código|enviado|1234567890/i);
  
  // Verificar que el texto en la interfaz del OTP también es claro
  const textoInterfaz = await page.locator('p').filter({ hasText: 'Ingresa el código de 6 dígitos' }).textContent();
  console.log('📝 Texto de interfaz OTP:', textoInterfaz);
  
  expect(textoInterfaz).toContain('Ingresa el código de 6 dígitos');
  expect(textoInterfaz).toContain('1234567890');
  
  // Verificar que el campo OTP tiene placeholder claro
  const placeholderOTP = await page.locator('#otp').getAttribute('placeholder');
  console.log('🎯 Placeholder OTP:', placeholderOTP);
  
  expect(placeholderOTP).toBe('123456');
  
  // Verificar que el botón de confirmar tiene texto claro
  const textoBoton = await page.locator('button:has-text("Confirmar Check-in")').textContent();
  console.log('🔘 Texto del botón:', textoBoton);
  
  expect(textoBoton).toContain('Confirmar Check-in');
  
  console.log('✅ Los mensajes de verificación son claros y específicos');
});