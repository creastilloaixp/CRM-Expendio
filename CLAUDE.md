# Memoria del Proyecto CRM Expendio

## Contexto del Proyecto
- CRM para restaurante/expendio desplegado en Vercel
- Stack: React 19 + Vite + TypeScript + Tailwind CSS + Supabase
- PWA habilitado con vite-plugin-pwa
- IA integrada: Google Generative AI (chatbot y asistente de voz)

## Módulos Actuales
- Dashboard principal
- Reportes y Analytics
- Reservaciones
- Check-in de mesas (acceso público con QR)
- Menú con carrito
- Cocina (Kitchen display)
- Gestión de clientes
- Chatbot IA
- Asistente de voz

## Roadmap - Siguientes Pasos

### Prioridad Alta
- [x] Inicializar repositorio Git (commit: 6c0371f)
- [x] Subir a GitHub: https://github.com/creastilloaixp/CRM-Expendio/
- [ ] Escribir tests con Playwright
- [x] Validar configuración de variables de entorno en Vercel (documentado)
- [x] Fortalecer autenticación con Supabase Auth (commit: 5b28291)
  - Persistencia de sesión al recargar
  - Listener de cambios de auth
  - Logout correcto

### Funcionalidades IA (Completadas - commit: 3efca55)
- [x] Asistente administrativo IA (consultas en lenguaje natural)
- [x] Business Insights (análisis automático de tendencias)
- [x] Segmentación de clientes (VIP, frecuente, en riesgo, etc.)
- [x] Inventario predictivo (alertas de stock)
- [x] Recomendaciones de productos personalizadas
- [x] Dashboard unificado de IA (`/ai-dashboard`)

### Programa de Lealtad (Completado - commit: de50532)
- [x] Cliente recurrente ve pantalla welcome_back (no auto check-in)
- [x] Mostrar puntos acumulados
- [x] Selector de número de personas
- [x] Cálculo dinámico: 10 puntos = $50 de descuento
- [x] Preview de puntos a ganar
- [x] Opción cambiar cuenta

### Flujo de Mesas y Reservas (Completado - commit: dadf79a)
- [x] Modal de mesa reservada con botones de acción
- [x] Confirmar llegada del cliente (convierte reserva en visita)
- [x] Cancelar reserva desde Dashboard
- [x] Mostrar pedidos activos en mesa ocupada
- [x] Total calculado automáticamente para liberar mesa

### Sistema de Gamificación y Premios (Completado - commit: PENDIENTE)
- [x] **Sistema de Niveles VIP** (Bronce, Plata, Oro, Platino)
  - Niveles calculados automáticamente por visitas y gasto total
  - Probabilidades mejoradas en ruleta según nivel
  - Badges visuales en toda la experiencia
- [x] **Mejoras a la Ruleta de Premios**
  - Animación de confetti al ganar
  - 7 premios diferentes con probabilidades dinámicas
  - Sistema anti-fraude con cupones únicos
- [x] **Historial de Premios**
  - Vista completa de cupones ganados
  - Estados: Activo, Canjeado, Expirado
  - Integrado en PrizeModal
- [x] **Escaneo de QR con Cámara Real**
  - Scanner integrado con @zxing/library
  - Detección automática de cámara trasera en móviles
  - Validación instantánea de cupones
  - Modo manual como fallback

### Funcionalidades Pendientes
- [ ] Notificaciones push (PWA)
- [ ] Integración de pagos (Stripe/MercadoPago)
- [ ] Exportar reportes a PDF/Excel

### Mejoras Técnicas
- [ ] TypeScript estricto
- [ ] SEO y meta tags
- [ ] Optimización de bundle
- [ ] Arreglar tests de Playwright

## Decisiones Técnicas
- Lazy loading en todos los componentes principales
- Hash routing para navegación SPA
- Supabase como BaaS
- canvas-confetti para animaciones de celebración
- @zxing/library para escaneo de QR codes
- Sistema de niveles VIP con triggers automáticos en BD

## Niveles VIP - Criterios
| Nivel | Visitas Mínimas | Gasto Mínimo | Probabilidad Suerte | Beneficios |
|-------|----------------|--------------|-------------------|------------|
| 🥉 Bronce | 0 | $0 | 33% | Nivel base |
| 🥈 Plata | 10 | $2,000 | 18% | +20% prob. premios |
| 🥇 Oro | 20 | $5,000 | 8% | +40% prob. premios |
| 💎 Platino | 50 | $10,000 | 1% | +80% prob. premios |

---
⏰ **RECORDATORIO**: Hacer checkpoint cada 30-45 minutos de trabajo para guardar progreso en este archivo.
