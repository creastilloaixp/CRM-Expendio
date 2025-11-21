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
- [ ] Validar configuración de variables de entorno en Vercel
- [ ] Fortalecer autenticación con Supabase Auth

### Funcionalidades Pendientes
- [ ] Notificaciones push (PWA)
- [ ] Integración de pagos (Stripe/MercadoPago)
- [ ] Módulo de inventario/stock
- [ ] Exportar reportes a PDF/Excel

### Mejoras Técnicas
- [ ] TypeScript estricto
- [ ] SEO y meta tags
- [ ] Optimización de bundle

## Decisiones Técnicas
- Lazy loading en todos los componentes principales
- Hash routing para navegación SPA
- Supabase como BaaS

---
⏰ **RECORDATORIO**: Hacer checkpoint cada 30-45 minutos de trabajo para guardar progreso en este archivo.
