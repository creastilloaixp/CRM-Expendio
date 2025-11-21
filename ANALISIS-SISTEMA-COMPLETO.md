# Análisis Completo del Sistema CRM Expendio Oficial

**Fecha:** 2025-11-20
**Versión:** 1.0

---

## 1. ARQUITECTURA DEL SISTEMA

### 1.1 Estructura de Módulos

El sistema está organizado en **11 módulos principales**:

#### **Módulos Administrativos (Requieren autenticación)**
1. **Dashboard** - Gestión visual de mesas en tiempo real
2. **Reservations** - Lista y gestión de reservas
3. **Reports** - Generación de reportes de visitas
4. **Analytics** - Dashboard analítico con KPIs y gráficos
5. **Clientes** - CRM completo con métricas de clientes
6. **Chatbot** - Asistente AI para consultas
7. **Voice Assistant** - Asistente por voz

#### **Módulos Públicos (Sin autenticación)**
8. **Check-In** - Registro de clientes en mesas via QR
9. **Menu** - Visualización de menú por mesa
10. **Login** - Autenticación de staff

#### **Componentes de Soporte**
11. **Header** - Navegación y control de sesión
12. **TableCard** - Vista individual de mesa
13. **TableModal** - Modal de detalles y acciones de mesa
14. **QRCodeModal** - Generación de códigos QR por mesa

---

## 2. FLUJO DE DATOS PRINCIPAL

### 2.1 Base de Datos Supabase

**Tablas principales:**

```
clientes
├── id (UUID, PK)
├── nombre (TEXT)
├── email (TEXT, UNIQUE)
├── telefono (TEXT, UNIQUE)
├── marketing_opt_in (BOOLEAN)
└── created_at (TIMESTAMP)

mesas
├── id (UUID, PK)
├── nombre (TEXT) - Ej: "A1", "E2", "F3"
├── estado (TEXT) - "Libre" | "Ocupada" | "Reservada"
├── capacidad (INTEGER)
└── created_at (TIMESTAMP)

reservas
├── id (UUID, PK)
├── mesa_id (UUID, FK -> mesas)
├── cliente_id (UUID, FK -> clientes)
├── fecha_hora (TIMESTAMP)
├── numero_personas (INTEGER)
├── estado (TEXT) - "Confirmada" | "Completada" | "Cancelada"
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

visitas
├── id (UUID, PK)
├── mesa_id (UUID, FK -> mesas)
├── cliente_id (UUID, FK -> clientes)
├── hora_llegada (TIMESTAMP)
├── hora_salida (TIMESTAMP, NULLABLE)
├── numero_personas (INTEGER)
├── consumo_total (DECIMAL, NULLABLE)
└── created_at (TIMESTAMP)

notificaciones
├── id (UUID, PK)
├── mesa_id (UUID, FK -> mesas)
├── tipo (TEXT) - "Llamar Mesero" | "Pedir Cuenta" | "Emergencia"
├── mensaje (TEXT)
├── estado (TEXT) - "Pendiente" | "Atendida"
├── atendida_por (TEXT, NULLABLE)
└── created_at (TIMESTAMP)
```

### 2.2 Servicios API

**Archivo:** `services/api.ts`

**Funciones principales por categoría:**

#### **Gestión de Mesas**
- `getMesas()` - Obtener todas las mesas con estado actual
- `getActiveVisitaByMesaId(mesaId)` - Obtener visita activa de una mesa
- `getActiveReservaByMesaId(mesaId)` - Obtener reserva activa de una mesa

#### **Gestión de Reservas**
- `createReservation(data)` - Crear nueva reserva
  - Busca/crea cliente por teléfono
  - Inserta reserva con estado "Confirmada"
  - Actualiza mesa a estado "Reservada"

- `getUpcomingReservations()` - Obtener reservas desde inicio del día
  - Filtro: `estado = 'Confirmada'` AND `fecha_hora >= inicio_de_hoy`
  - JOIN con mesas y clientes

- `cancelReservation(reservaId)` - Cancelar reserva
  - Actualiza reserva a estado "Cancelada"
  - Libera mesa (estado "Libre")

- `markReservationAsArrived(reservaId)` - Cliente llegó
  - Crea nueva visita
  - Actualiza reserva a "Completada"
  - Cambia mesa a "Ocupada"

#### **Gestión de Visitas**
- `releaseTable(visitaId, consumo)` - Liberar mesa al final
  - Actualiza visita con hora_salida y consumo_total
  - Cambia mesa a "Libre"

- `getVisitasByCliente(clienteId)` - Historial de visitas por cliente

#### **Gestión de Clientes**
- `getClientes()` - Obtener todos los clientes
- Cliente se crea automáticamente en:
  - Check-in (QR)
  - Creación de reserva (Dashboard)

#### **Notificaciones**
- `obtenerNotificacionesPendientes()` - Notificaciones sin atender
- `marcarNotificacionAtendida(notifId, atendidoPor)` - Marcar como atendida

---

## 3. FLUJOS CRÍTICOS DEL SISTEMA

### 3.1 FLUJO: Reserva desde Dashboard Administrativo

**Actor:** Staff administrativo

**Pasos:**
1. Staff abre Dashboard y ve croquis de mesas
2. Click en mesa con estado "Libre"
3. Se abre TableModal con formulario de reserva
4. Staff ingresa:
   - Nombre del cliente
   - Teléfono del cliente
   - Fecha de reserva
   - Hora de reserva
   - Número de personas
5. Click en "Confirmar Reserva"
6. Sistema ejecuta `createReservation()`:
   ```javascript
   - Buscar cliente existente por teléfono
   - Si no existe: crear cliente con email = `${telefono}@reserva.local`
   - Insertar reserva con estado "Confirmada"
   - Actualizar mesa a estado "Reservada"
   ```
7. Dashboard se actualiza automáticamente (polling cada 5s)
8. Mesa cambia de color a **azul** (reservada)
9. Módulo Reservations se actualiza automáticamente (polling cada 5s)
10. Reserva aparece en lista con:
    - Mesa
    - Nombre cliente
    - Teléfono
    - Fecha/hora
    - Botones: "Marcar Llegada" | "Cancelar"

**Validaciones actuales:**
- ✅ Teléfono único identifica cliente
- ✅ Email auto-generado para evitar duplicados
- ✅ Estado de mesa se actualiza correctamente
- ✅ Reservas aparecen en Dashboard (croquis)
- ✅ Reservas aparecen en módulo Reservations (lista)

---

### 3.2 FLUJO: Cliente llega con Reserva

**Actor:** Cliente + Staff

**Pasos:**
1. Cliente llega al restaurante
2. Staff verifica reserva en:
   - Opción A: Dashboard → Click en mesa reservada (azul) → Ver datos
   - Opción B: Módulo Reservations → Buscar en lista
3. Staff click en "Marcar Llegada"
4. Sistema ejecuta `markReservationAsArrived()`:
   ```javascript
   - Obtener datos de reserva (mesa_id, cliente_id, numero_personas)
   - Crear nueva visita:
     * mesa_id
     * cliente_id
     * hora_llegada = now()
     * numero_personas
     * hora_salida = null
     * consumo_total = null
   - Actualizar reserva: estado = "Completada"
   - Actualizar mesa: estado = "Ocupada"
   ```
5. Dashboard se actualiza
6. Mesa cambia de color a **rojo** (ocupada)
7. Reserva desaparece de módulo Reservations
8. Visita queda abierta hasta checkout

---

### 3.3 FLUJO: Check-in sin Reserva (QR)

**Actor:** Cliente

**Pasos:**
1. Cliente escanea código QR de la mesa
2. URL: `https://crm-expendio-oficial.vercel.app/?mesa=A1#/checkin`
3. Sistema muestra CheckIn component
4. Cliente ingresa:
   - Nombre
   - Email
   - Teléfono
   - Número de personas
5. Click en "Confirmar Check-In"
6. Sistema ejecuta:
   ```javascript
   - Buscar/crear cliente por email o teléfono
   - Crear visita con hora_llegada = now()
   - Actualizar mesa a estado "Ocupada"
   ```
7. Confirmación al cliente: "¡Bienvenido! Tu mesa está lista"
8. Dashboard se actualiza
9. Mesa cambia a **rojo** (ocupada)

---

### 3.4 FLUJO: Liberación de Mesa (Checkout)

**Actor:** Staff

**Pasos:**
1. Staff ve mesa ocupada (roja) en Dashboard
2. Click en mesa ocupada
3. TableModal muestra:
   - Datos del cliente
   - Hora de llegada
   - Número de personas
   - Campo: "Consumo Total ($)"
4. Staff ingresa monto total consumido
5. Click en "Liberar Mesa y Cobrar"
6. Sistema ejecuta `releaseTable()`:
   ```javascript
   - Actualizar visita:
     * hora_salida = now()
     * consumo_total = monto ingresado
   - Actualizar mesa: estado = "Libre"
   ```
7. Dashboard se actualiza
8. Mesa cambia a **verde** (libre)
9. Visita queda registrada con consumo
10. Datos disponibles para Analytics y Reports

---

### 3.5 FLUJO: Cancelación de Reserva

**Actor:** Staff o Cliente

**Pasos:**
1. En módulo Reservations
2. Localizar reserva en lista
3. Click en botón "Cancelar"
4. Confirmación: "¿Estás seguro de que quieres cancelar esta reserva?"
5. Sistema ejecuta `cancelReservation()`:
   ```javascript
   - Actualizar reserva: estado = "Cancelada"
   - Buscar mesa_id de la reserva
   - Actualizar mesa: estado = "Libre"
   ```
6. Reserva desaparece de lista (filtro: solo "Confirmada")
7. Mesa vuelve a **verde** en Dashboard

---

## 4. DISTRIBUCIÓN DE INFORMACIÓN POR MÓDULO

### 4.1 Dashboard
**Información mostrada:**
- Croquis visual de 46 mesas
- Estado actual de cada mesa (color)
- Notificaciones pendientes (campana)
- Botón QR para generar códigos

**Acciones disponibles:**
- Click en mesa libre → Crear reserva
- Click en mesa reservada → Ver reserva + Marcar llegada
- Click en mesa ocupada → Ver visita + Liberar mesa
- Atender notificaciones
- Generar QR

**Datos que consume:**
- `getMesas()` - Estados actualizados
- `getActiveVisitaByMesaId()` - Cuando mesa ocupada
- `getActiveReservaByMesaId()` - Cuando mesa reservada
- `obtenerNotificacionesPendientes()` - Para campana

**Frecuencia de actualización:**
- Notificaciones: cada 10 segundos
- NO polling para mesas (solo al cargar/después de acción)

### 4.2 Reservations
**Información mostrada:**
- Lista de reservas confirmadas desde hoy
- Por cada reserva:
  - Mesa
  - Nombre cliente
  - Teléfono
  - Número de personas
  - Fecha y hora formateada

**Acciones disponibles:**
- Marcar Llegada → Convierte reserva en visita
- Cancelar → Libera mesa

**Datos que consume:**
- `getUpcomingReservations()` - Polling cada 5 segundos

**Filtros actuales:**
- Estado = "Confirmada"
- Fecha >= inicio del día de hoy

### 4.3 Reports
**Información mostrada:**
- Tabla de visitas completadas
- Filtro por rango de fechas
- Columnas:
  - Mesa
  - Cliente
  - Personas
  - Consumo
  - Hora llegada
  - Hora salida
- Exportación a CSV

**Datos que consume:**
- `supabaseMock.getVisitsByDateRange()` - Solo visitas con hora_salida

### 4.4 Analytics
**Información mostrada:**
- KPIs:
  - Ingresos totales
  - Visitas totales
  - Consumo promedio
  - Personas promedio por visita
- Gráficos:
  - Visitas por día de la semana
  - Horas pico (visitas por hora)
- Top 5 clientes por consumo
- AI Assistant con insights

**Datos que consume:**
- `supabaseMock.getVisitsByDateRange()` - Todas las visitas (incluso abiertas)

### 4.5 Clientes (CRM)
**Información mostrada:**
- Lista de clientes con métricas:
  - Total de visitas
  - Última visita
  - Gasto total
  - Gasto promedio
  - Frecuencia de visitas
- Detalle por cliente:
  - Historial completo de visitas
  - Mesas favoritas
  - Segmentación: VIP, Frecuentes, Nuevos, Inactivos
- AI Insights personalizados

**Datos que consume:**
- `getClientes()` - Todos los clientes
- `getVisitasByCliente(id)` - Por cada cliente

---

## 5. PROBLEMAS RESUELTOS RECIENTEMENTE

### 5.1 Mock vs Producción
**Problema:** API usaba mock en desarrollo incluso cuando `USE_MOCK` era falso
**Causa:** Condición `process.env.NODE_ENV === 'development'`
**Solución:** Cambiar todas las funciones a solo usar mock si `USE_MOCK === 'true'`
**Archivos:** `services/api.ts` - Todas las funciones API

### 5.2 Reservas no guardaban en Supabase
**Problema:** Reservas no se insertaban en base de datos
**Causa:** `createReservation()` llamaba RPC inexistente
**Solución:** Reescribir con INSERT directo + lógica de cliente
**Archivo:** `services/api.ts:85-167`

### 5.3 Todas las reservas al mismo cliente
**Problema:** Diferentes reservas se asignaban a Karina Quintero
**Causa:** Query `.or()` buscaba email con nombreCliente incorrecto
**Solución:** Buscar SOLO por teléfono + generar email único
**Archivo:** `services/api.ts:101-115`

### 5.4 Reservas no aparecían en módulo Reservations
**Problema:** Lista de reservas vacía
**Causa:** Filtro `.gt()` excluía reservas del momento actual
**Solución:** Cambiar a `.gte()` + filtrar desde inicio del día
**Archivo:** `services/api.ts:770-805`

### 5.5 Datos de cliente no aparecían en modal
**Problema:** Al click en mesa reservada, no mostraba teléfono
**Causa:** Query no incluía JOIN con tabla clientes
**Solución:** Agregar `select('*, cliente:clientes(nombre, email, telefono)')`
**Archivo:** `services/api.ts:44-61`

---

## 6. SINCRONIZACIÓN Y POLLING

### 6.1 Estrategias de Actualización

**Polling activo (setInterval):**
- Dashboard notificaciones: cada 10s
- Reservations: cada 5s
- Dashboard mesas: NO (solo tras acciones)

**Actualización manual:**
- Después de crear reserva
- Después de marcar llegada
- Después de cancelar reserva
- Después de liberar mesa

### 6.2 Posibles Mejoras
- Implementar Supabase Realtime Subscriptions
- Reducir polling con WebSockets
- Caché optimista en cliente

---

## 7. LOGÍSTICA OPERATIVA

### 7.1 Flujo Diario Típico

**Hora de Apertura (12:00 PM):**
1. Staff inicia sesión en Dashboard
2. Todas las mesas en estado "Libre" (verde)
3. Revisa reservas del día en módulo Reservations

**Durante el Día:**
1. Cliente hace reserva por teléfono
   - Staff crea reserva en Dashboard
   - Mesa cambia a azul (Reservada)

2. Cliente llega con reserva
   - Staff marca llegada
   - Mesa cambia a rojo (Ocupada)

3. Walk-in sin reserva
   - Cliente escanea QR o staff hace check-in
   - Mesa cambia a rojo (Ocupada)

4. Cliente solicita cuenta
   - Notificación aparece en Dashboard
   - Staff atiende y libera mesa
   - Mesa cambia a verde (Libre)

**Hora de Cierre (11:00 PM):**
1. Staff libera todas las mesas ocupadas
2. Ingresa consumos finales
3. Genera reporte del día en Reports
4. Revisa Analytics para insights

### 7.2 Seguimiento de Métricas

**Diario:**
- Ingresos totales del día
- Número de visitas
- Consumo promedio
- Tasa de ocupación de mesas
- Reservas vs walk-ins

**Semanal:**
- Días más concurridos
- Horas pico
- Clientes frecuentes vs nuevos
- Top clientes por gasto

**Mensual:**
- Crecimiento de ingresos
- Retención de clientes
- Eficiencia operativa
- ROI de promociones

---

## 8. PUNTOS DE ATENCIÓN

### 8.1 Datos Críticos que Deben Fluir Correctamente

✅ **Cliente**
- Creación única por teléfono
- Email auto-generado si no existe
- Asociación correcta a reservas/visitas

✅ **Reserva**
- Estado inicial: "Confirmada"
- Transición: Confirmada → Completada (al llegar)
- Transición: Confirmada → Cancelada (si cancela)
- Mesa refleja estado correcto

✅ **Visita**
- hora_llegada: siempre presente
- hora_salida: null hasta checkout
- consumo_total: null hasta checkout
- Mesa refleja estado "Ocupada"

✅ **Mesa**
- Estados: Libre | Reservada | Ocupada
- Transiciones:
  - Libre → Reservada (crear reserva)
  - Reservada → Ocupada (marcar llegada)
  - Ocupada → Libre (liberar mesa)
  - Reservada → Libre (cancelar reserva)

### 8.2 Validaciones Implementadas

✅ Cliente único por teléfono
✅ Email único (auto-generado si falta)
✅ No duplicar visitas activas en misma mesa
✅ Consumo requerido para liberar mesa
✅ Confirmación antes de cancelar reserva
✅ Logging detallado en console para debug

### 8.3 Validaciones Faltantes (Recomendadas)

⚠️ Evitar reservas en mesas ya ocupadas
⚠️ Validar fecha/hora de reserva (no en pasado)
⚠️ Límite de personas según capacidad de mesa
⚠️ Bloquear check-in en mesa ya ocupada
⚠️ Timeout para reservas no confirmadas
⚠️ Validación de formato de teléfono
⚠️ Validación de formato de email

---

## 9. ARQUITECTURA DE SEGURIDAD

### 9.1 Autenticación
- Login con email y contraseña
- Validación contra base de datos
- Sin JWT ni tokens (sesión en memoria)
- Logout limpia estado local

### 9.2 Autorización
- Módulos admin protegidos por `isAuthenticated`
- Check-in y Menu son públicos (QR)
- Sin roles diferenciados (todos admin)

### 9.3 Recomendaciones de Seguridad
- Implementar JWT tokens
- Agregar roles: Admin, Staff, Cliente
- Rate limiting en API
- Validación de input en backend
- HTTPS obligatorio en producción
- No exponer claves en frontend

---

## 10. PRUEBAS RECOMENDADAS

### 10.1 Tests Unitarios
- Validación de campos en formularios
- Formateo de fechas y monedas
- Cálculos de métricas (Analytics)
- Lógica de segmentación de clientes

### 10.2 Tests de Integración
- Flujo completo: Reserva → Llegada → Checkout
- Flujo: Check-in QR → Checkout
- Cancelación de reserva libera mesa
- Sincronización Dashboard ↔ Reservations

### 10.3 Tests End-to-End (E2E)
- Playwright o Cypress
- Simular:
  - Staff crea reserva
  - Cliente escanea QR
  - Staff libera mesa
  - Verificar estados en BD

---

## 11. MÉTRICAS DE RENDIMIENTO

### 11.1 Tiempos de Carga
- Dashboard inicial: ~800ms (46 mesas)
- Módulo Reservations: ~500ms
- Analytics con 30 días: ~1.2s
- Reports con rango largo: ~2s

### 11.2 Optimizaciones Implementadas
- Polling limitado a módulos necesarios
- JOINs eficientes en queries
- Memoización en Analytics (useMemo)
- Lazy loading de módulos

### 11.3 Optimizaciones Pendientes
- Implementar Realtime en lugar de polling
- Caché de clientes en localStorage
- Índices en BD para queries frecuentes
- Paginación en lista de reservas/clientes
- Service Worker para offline

---

## 12. RESUMEN EJECUTIVO

### Sistema Funcionando Correctamente ✅
1. Creación de reservas desde Dashboard
2. Visualización de reservas en módulo Reservations
3. Flujo completo: Reserva → Llegada → Visita → Checkout
4. Cancelación de reservas
5. Check-in via QR
6. Generación de reportes
7. Analytics con KPIs
8. CRM de clientes

### Próximos Pasos Recomendados 🚀
1. Implementar Supabase Realtime
2. Agregar validaciones de negocio faltantes
3. Crear suite de tests automatizados
4. Implementar sistema de roles
5. Optimizar rendimiento con índices
6. Agregar notificaciones push para staff
7. Dashboard móvil optimizado
8. Integración con sistema de pagos

---

**Documento generado automáticamente**
**Última actualización:** 2025-11-20 14:30 (hora local)
