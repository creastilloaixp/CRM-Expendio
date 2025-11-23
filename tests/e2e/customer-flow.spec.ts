/**
 * Test E2E: Flujo completo del cliente
 * Simula el recorrido desde escanear QR hasta ganar premio
 */

import { test, expect } from '@playwright/test';

test.describe('Flujo completo del cliente', () => {
  const BASE_URL = 'https://crm-expendio-oficial.vercel.app';
  const MESA = 'B4';

  test('Cliente escanea QR, se registra, gira ruleta y obtiene premio', async ({ page }) => {
    // 1. ESCANEAR QR - Cliente llega a la URL del QR
    await page.goto(`${BASE_URL}/#/checkin?mesa=${MESA}`);

    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle');

    // Debería ver el onboarding o formulario de registro
    console.log('✓ Página de check-in cargada');

    // 2. ONBOARDING (si aparece)
    const onboardingButton = page.locator('button:has-text("Comenzar"), button:has-text("Continuar")').first();
    if (await onboardingButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await onboardingButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Onboarding completado');
    }

    // 3. FORMULARIO DE REGISTRO
    // Esperar el formulario
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10000 });

    // Generar datos de prueba únicos
    const timestamp = Date.now();
    const testUser = {
      nombre: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      telefono: `+521${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      fechaNacimiento: '1990-01-01'
    };

    console.log('📝 Llenando formulario con:', testUser);

    // Llenar formulario
    await page.fill('input[placeholder*="nombre" i], input[name="nombre"]', testUser.nombre);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="tel"], input[placeholder*="teléfono" i]', testUser.telefono);
    await page.fill('input[type="date"]', testUser.fechaNacimiento);

    // Aceptar términos
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Screenshot del formulario
    await page.screenshot({ path: 'tests/screenshots/01-formulario.png', fullPage: true });

    // Submit formulario
    const submitButton = page.locator('button[type="submit"], button:has-text("Registrar"), button:has-text("Continuar")').last();
    await submitButton.click();

    console.log('✓ Formulario enviado');

    // 4. ESPERAR RULETA
    // La ruleta debería aparecer automáticamente
    await expect(page.locator('text=/gira|ruleta|premio/i')).toBeVisible({ timeout: 15000 });

    console.log('🎰 Ruleta visible');

    // Screenshot de la ruleta
    await page.screenshot({ path: 'tests/screenshots/02-ruleta.png', fullPage: true });

    // 5. GIRAR RULETA
    const spinButton = page.locator('button:has-text("GIRAR"), button:has-text("Girar")');
    await expect(spinButton).toBeVisible({ timeout: 5000 });

    await spinButton.click();
    console.log('🎲 Ruleta girando...');

    // Esperar a que termine de girar (máximo 10 segundos)
    await page.waitForTimeout(10000);

    // 6. VERIFICAR RESULTADO
    // Debería aparecer el resultado (premio o "suerte")
    const resultText = page.locator('text=/ganaste|suerte|próxima/i');
    await expect(resultText).toBeVisible({ timeout: 10000 });

    const resultContent = await resultText.textContent();
    console.log('🎁 Resultado:', resultContent);

    // Screenshot del resultado
    await page.screenshot({ path: 'tests/screenshots/03-resultado.png', fullPage: true });

    // 7. VERIFICAR CUPÓN (si ganó)
    if (resultContent && !resultContent.toLowerCase().includes('suerte')) {
      console.log('✅ ¡Cliente ganó un premio!');

      // Esperar el cupón/QR
      await page.waitForTimeout(3000);

      // Verificar que aparezca el código de cupón
      const cuponCode = page.locator('text=/EXP-[A-Z0-9]{6}/i');

      if (await cuponCode.isVisible({ timeout: 5000 }).catch(() => false)) {
        const code = await cuponCode.textContent();
        console.log('🎫 Código de cupón:', code);

        // Screenshot del QR/cupón
        await page.screenshot({ path: 'tests/screenshots/04-cupon-qr.png', fullPage: true });

        // Verificar botones de acción
        const whatsappButton = page.locator('button:has-text("WhatsApp"), a:has-text("WhatsApp")');
        const instagramButton = page.locator('button:has-text("Instagram"), a:has-text("Instagram")');

        await expect(whatsappButton).toBeVisible({ timeout: 5000 });
        console.log('✓ Botón de WhatsApp visible');

        if (await instagramButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✓ Botón de Instagram visible');
        }
      } else {
        console.warn('⚠️ Cupón no visible después de 5s, puede haber un error');
        await page.screenshot({ path: 'tests/screenshots/04-error-no-cupon.png', fullPage: true });
      }
    } else {
      console.log('🍀 Cliente obtuvo "Suerte para la próxima"');
    }

    // 8. CONTINUAR AL MENÚ
    const continueButton = page.locator('button:has-text("Continuar")').last();
    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueButton.click();
      console.log('✓ Continuando al menú...');

      // Esperar que redirija
      await page.waitForTimeout(2000);

      // Screenshot final
      await page.screenshot({ path: 'tests/screenshots/05-final.png', fullPage: true });
    }

    console.log('✅ Flujo completado exitosamente');
  });

  test('Verificar que usuario recurrente vea bienvenida', async ({ page }) => {
    // Este test requiere que el usuario ya esté registrado
    // Podemos usar localStorage para simular un usuario recurrente

    await page.goto(`${BASE_URL}/#/checkin?mesa=${MESA}`);

    // Inyectar datos de usuario en localStorage
    await page.evaluate(() => {
      localStorage.setItem('expendio_cliente_id', 'test-uuid-12345');
      localStorage.setItem('expendio_user_nombre', 'Usuario Prueba');
      localStorage.setItem('expendio_user_email', 'test@example.com');
      localStorage.setItem('expendio_user_phone', '+5215512345678');
    });

    // Recargar para que tome el localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Debería ver mensaje de bienvenida
    await expect(page.locator('text=/hola|bienvenido/i')).toBeVisible({ timeout: 10000 });

    console.log('✓ Usuario recurrente detectado');
    await page.screenshot({ path: 'tests/screenshots/usuario-recurrente.png', fullPage: true });
  });
});
