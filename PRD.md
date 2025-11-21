# Product Requirements Document (PRD)
## Expendio CRM - Nuevas Funcionalidades

**Versión**: 3.0.0
**Fecha**: 20 de Noviembre 2025
**Producto**: Sistema CRM para Restaurante/Bar Expendio
**Stakeholder**: Propietario del Negocio
**Preparado por**: Equipo de Desarrollo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Objetivos del Producto](#objetivos-del-producto)
3. [Funcionalidades Principales](#funcionalidades-principales)
4. [Especificaciones Técnicas](#especificaciones-técnicas)
5. [Roadmap de Desarrollo](#roadmap-de-desarrollo)
6. [Métricas de Éxito](#métricas-de-éxito)

---

## 1. Resumen Ejecutivo

### 1.1 Contexto
Expendio CRM es un sistema completo de gestión para restaurantes/bares que actualmente cuenta con:
- Check-in inteligente vía QR
- Sistema de puntos de lealtad
- Menú digital para clientes
- Dashboard de gestión para staff
- Notificaciones en tiempo real

### 1.2 Oportunidad
Con la base sólida actual (99% completa), identificamos 4 áreas clave de expansión que aumentarán significativamente el valor del producto y la satisfacción del cliente:

1. **Sistema de Pedidos Completo** - Digitalizar completamente el flujo de pedidos
2. **Analytics Dashboard** - Toma de decisiones basada en datos
3. **Marketing Automatizado** - Retención y engagement de clientes
4. **Gestión de Inventario** - Control de stock y costos

### 1.3 Impacto Esperado
- **↑ 40%** eficiencia operativa
- **↑ 25%** satisfacción del cliente
- **↓ 30%** tiempo de atención por mesa
- **↑ 50%** uso del sistema de lealtad
- **↓ 20%** mermas por falta de control de inventario

---

## 2. Objetivos del Producto

### 2.1 Objetivos de Negocio
1. **Aumentar ingresos** mediante upselling automatizado
2. **Reducir costos operativos** con mejor control de inventario
3. **Mejorar retención** de clientes con marketing personalizado
4. **Optimizar operaciones** con datos en tiempo real

### 2.2 Objetivos de Usuario

#### Para Clientes
- Pedir desde la mesa sin esperar al mesero
- Ver el estado de sus pedidos en tiempo real
- Recibir ofertas personalizadas
- Experiencia fluida y moderna

#### Para Staff
- Reducir idas y vueltas a las mesas
- Priorizar tareas con sistema de alertas
- Tomar decisiones con datos concretos
- Evitar pérdidas por falta de inventario

#### Para Gerencia
- Visibilidad completa del negocio
- Reportes automáticos diarios/semanales/mensuales
- Identificar tendencias y oportunidades
- Control total de costos

---

## 3. Funcionalidades Principales

---

## 🛒 FEATURE 1: Sistema de Pedidos Completo

### 3.1.1 Descripción
Permitir a los clientes hacer pedidos completos desde su celular, con seguimiento en tiempo real del estado de preparación.

### 3.1.2 User Stories

**Como cliente, quiero:**
- Ver el menú completo con fotos y descripciones
- Agregar productos a un carrito
- Ver el total de mi pedido antes de confirmar
- Personalizar productos (ej: sin cebolla, extra queso)
- Ver el estado de preparación de mi pedido
- Recibir notificación cuando esté listo

**Como mesero, quiero:**
- Recibir pedidos directamente en el sistema
- Ver todos los pedidos pendientes de mi zona
- Marcar pedidos como entregados
- Ver notas especiales del cliente

**Como cocinero, quiero:**
- Ver pedidos en orden de llegada
- Marcar productos como "en preparación" o "listos"
- Ver tiempo promedio de preparación
- Filtrar por tipo de producto (bebidas, platillos, postres)

### 3.1.3 Requisitos Funcionales

#### RF-1.1 Carrito de Compras
- **Descripción**: Sistema de carrito persistente en localStorage
- **Componentes**:
  - `CartModal.tsx` - Modal del carrito
  - `CartItem.tsx` - Item individual
  - `CartSummary.tsx` - Resumen y total
- **Funciones**:
  - Agregar/quitar productos
  - Modificar cantidades
  - Agregar notas especiales
  - Calcular total con impuestos
  - Persistencia en localStorage
- **Validaciones**:
  - Cantidad mínima: 1
  - Cantidad máxima: 10 por producto
  - Verificar disponibilidad antes de agregar

#### RF-1.2 Confirmación de Pedido
- **Descripción**: Flujo de confirmación antes de enviar
- **Pantallas**:
  1. Review del carrito
  2. Confirmación
  3. Estado de envío
- **Funciones**:
  - Mostrar resumen del pedido
  - Calcular tiempo estimado
  - Enviar a cocina vía RPC
  - Generar ID de pedido único
- **Integraciones**:
  - API: `crearPedido()`
  - Tabla: `pedidos`
  - Notificaciones push a cocina

#### RF-1.3 Tracking de Pedidos
- **Descripción**: Estados del pedido en tiempo real
- **Estados**:
  1. `Pendiente` - Recién enviado
  2. `En Preparación` - Cocina trabajando
  3. `Listo` - Esperando entrega
  4. `Entregado` - Cliente confirmó recepción
  5. `Cancelado` - Por cliente o staff
- **Componentes**:
  - `OrderStatus.tsx` - Timeline visual
  - `OrderNotification.tsx` - Alertas
- **Funciones**:
  - Polling cada 5s para actualizar estado
  - Notificación visual al cambiar estado
  - Tiempo estimado dinámico
  - Historial de pedidos

#### RF-1.4 Panel de Cocina
- **Descripción**: Dashboard para staff de cocina
- **Componente**: `KitchenDashboard.tsx`
- **Vistas**:
  - Lista de pedidos pendientes (kanban)
  - Filtros por categoría
  - Timer por pedido
  - Alertas de pedidos retrasados
- **Funciones**:
  - Cambiar estado de pedido
  - Marcar producto individual como listo
  - Ver detalles de mesa y cliente
  - Estadísticas en tiempo real

#### RF-1.5 Historial de Pedidos
- **Descripción**: Historial completo por visita
- **Componente**: `OrderHistory.tsx`
- **Funciones**:
  - Ver todos los pedidos de la visita actual
  - Total acumulado
  - Botón "Repetir pedido"
  - Export a PDF para ticket

### 3.1.4 Requisitos No Funcionales

- **Performance**: Actualización de estado en < 2s
- **Disponibilidad**: 99.9% uptime
- **UX**: Máximo 3 clicks desde menú a confirmar pedido
- **Accesibilidad**: WCAG 2.1 AA compliant
- **Responsive**: Funcional en pantallas desde 320px

### 3.1.5 Diseño de Base de Datos

```sql
-- Tabla pedidos (ya existe, actualizar estados)
ALTER TABLE pedidos
ADD COLUMN estado VARCHAR(50) DEFAULT 'Pendiente',
ADD COLUMN tiempo_preparacion INTEGER, -- minutos
ADD COLUMN preparado_por VARCHAR(100),
ADD COLUMN entregado_at TIMESTAMP,
ADD COLUMN cancelado_motivo TEXT;

CREATE TYPE estado_pedido AS ENUM (
  'Pendiente',
  'En Preparación',
  'Listo',
  'Entregado',
  'Cancelado'
);

-- Índices para performance
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_visita ON pedidos(visita_id);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);
```

### 3.1.6 API Endpoints

```typescript
// Nuevas funciones en api.ts
export const agregarAlCarrito = async (productoId: string, cantidad: number, notas?: string)
export const obtenerCarrito = async ()
export const vaciarCarrito = async ()
export const confirmarPedido = async (visitaId: string, items: CartItem[])
export const obtenerEstadoPedido = async (pedidoId: string)
export const actualizarEstadoPedido = async (pedidoId: string, nuevoEstado: EstadoPedido)
export const obtenerPedidosPendientes = async () // Para cocina
export const marcarPedidoEntregado = async (pedidoId: string)
export const cancelarPedido = async (pedidoId: string, motivo: string)
```

### 3.1.7 Mockups/Wireframes

**Pantalla 1: Menú con Botón Agregar**
```
┌─────────────────────────────────┐
│ 🍔 Hamburguesa Clásica          │
│ Con queso, lechuga, tomate      │
│ $89 MXN                         │
│ [➕ Agregar al carrito]         │
└─────────────────────────────────┘
```

**Pantalla 2: Carrito**
```
┌─────────────────────────────────┐
│ 🛒 Mi Pedido (3 items)          │
├─────────────────────────────────┤
│ 2x Hamburguesa    $178          │
│    [🗑️] [-] 2 [+]              │
│    Nota: Sin cebolla            │
├─────────────────────────────────┤
│ Subtotal:          $178         │
│ IVA (16%):         $28.48       │
│ Total:             $206.48      │
│                                 │
│ [Confirmar Pedido]              │
└─────────────────────────────────┘
```

**Pantalla 3: Estado del Pedido**
```
┌─────────────────────────────────┐
│ Pedido #12345                   │
├─────────────────────────────────┤
│ ✅ Recibido      14:23          │
│ 🔥 En preparación 14:25         │
│ ⏳ Listo         ~14:35         │
│ 🎉 Entregado                    │
├─────────────────────────────────┤
│ Tiempo estimado: 10 min         │
└─────────────────────────────────┘
```

### 3.1.8 Criterios de Aceptación

✅ **AC-1.1**: Cliente puede agregar productos al carrito desde el menú
✅ **AC-1.2**: Cliente puede modificar cantidades en el carrito
✅ **AC-1.3**: Cliente puede agregar notas especiales a productos
✅ **AC-1.4**: Cliente puede ver total calculado con IVA
✅ **AC-1.5**: Cliente puede confirmar pedido con un click
✅ **AC-1.6**: Cliente recibe confirmación inmediata
✅ **AC-1.7**: Cliente puede ver estado en tiempo real
✅ **AC-1.8**: Cocina recibe pedido instantáneamente
✅ **AC-1.9**: Cocina puede cambiar estado del pedido
✅ **AC-1.10**: Mesero recibe notificación cuando pedido está listo
✅ **AC-1.11**: Cliente recibe notificación cuando está listo
✅ **AC-1.12**: Sistema registra pedido en base de datos

### 3.1.9 Estimación
- **Esfuerzo**: 40 horas
- **Prioridad**: 🔴 ALTA
- **Complejidad**: Media-Alta
- **Dependencias**: Ninguna (base de datos ya preparada)

---

## 📊 FEATURE 2: Analytics Dashboard

### 3.2.1 Descripción
Dashboard de análisis en tiempo real con métricas clave del negocio, gráficas interactivas y reportes automáticos.

### 3.2.2 User Stories

**Como gerente, quiero:**
- Ver ventas totales del día en tiempo real
- Comparar ventas con días/semanas anteriores
- Identificar productos más vendidos
- Ver ticket promedio por mesa
- Identificar horas pico
- Ver tasa de retorno de clientes
- Exportar reportes en PDF/Excel

**Como dueño, quiero:**
- Dashboard ejecutivo con KPIs principales
- Alertas automáticas de métricas anormales
- Proyecciones de ventas
- ROI del sistema de lealtad
- Análisis de rentabilidad por producto

### 3.2.3 Requisitos Funcionales

#### RF-2.1 Dashboard Principal
- **Descripción**: Vista general con KPIs clave
- **Componente**: `AnalyticsDashboard.tsx`
- **Métricas Principales**:
  1. **Ventas del Día**
     - Total en $
     - vs. ayer (% cambio)
     - Gráfica de ventas por hora
  2. **Mesas Activas**
     - # mesas ocupadas / total
     - Tiempo promedio de ocupación
     - Rotación de mesas
  3. **Ticket Promedio**
     - $ promedio por mesa
     - Tendencia últimos 7 días
  4. **Productos Top 5**
     - Más vendidos hoy
     - Cantidad + revenue
  5. **Clientes Nuevos vs Recurrentes**
     - % de cada tipo
     - Gráfica de tendencia

#### RF-2.2 Reportes Detallados
- **Componente**: `ReportsPage.tsx`
- **Tipos de Reportes**:

  **2.2.1 Reporte de Ventas**
  - Filtros: Fecha inicio/fin, categoría, producto
  - Datos: Total ventas, # pedidos, ticket promedio
  - Gráficas: Línea de tiempo, pie chart por categoría
  - Export: PDF, Excel, CSV

  **2.2.2 Reporte de Productos**
  - Productos más/menos vendidos
  - Margen de ganancia por producto
  - Velocidad de venta
  - Productos sin ventas (últimos 7 días)

  **2.2.3 Reporte de Clientes**
  - Clientes más frecuentes
  - Lifetime value por cliente
  - Análisis de puntos de lealtad
  - Segmentación por gasto

  **2.2.4 Reporte de Personal**
  - Ventas por mesero
  - Tiempo promedio de atención
  - Satisfacción (si se implementa rating)

#### RF-2.3 Gráficas Interactivas
- **Librería**: Chart.js / Recharts
- **Tipos**:
  - Line Chart: Ventas en el tiempo
  - Bar Chart: Comparación de productos
  - Pie Chart: Distribución por categoría
  - Heatmap: Horas pico por día de semana
  - Gauge: % de cumplimiento de meta
- **Interactividad**:
  - Hover para ver detalles
  - Click para drill-down
  - Zoom en rangos de tiempo
  - Toggle de datasets

#### RF-2.4 Alertas Automáticas
- **Tipos de Alertas**:
  - 🔴 Ventas 30% debajo del promedio
  - 🟡 Producto sin stock
  - 🟢 Meta diaria alcanzada
  - 🔵 Nuevo cliente frecuente (5+ visitas)
  - 🟣 Pedido grande (>$500)
- **Canales**:
  - Notificación en dashboard
  - Email (opcional)
  - Webhook (para integraciones)

#### RF-2.5 Comparaciones Temporales
- **Componente**: `ComparativeAnalytics.tsx`
- **Comparaciones**:
  - Hoy vs Ayer
  - Esta semana vs Semana pasada
  - Este mes vs Mes pasado
  - Mismo día semana pasada
  - Custom: Seleccionar 2 períodos

### 3.2.4 Requisitos No Funcionales

- **Performance**: Carga de dashboard en < 3s
- **Actualización**: Refresh automático cada 30s
- **Precisión**: 100% accuracy en cálculos
- **Escalabilidad**: Soportar 10,000+ transacciones/mes
- **Seguridad**: Solo usuarios con rol "Admin" o "Gerente"

### 3.2.5 Diseño de Base de Datos

```sql
-- Vista materializada para analytics (actualización cada 5 min)
CREATE MATERIALIZED VIEW analytics_ventas_diarias AS
SELECT
  DATE(v.hora_entrada) as fecha,
  COUNT(DISTINCT v.id) as num_visitas,
  COUNT(DISTINCT v.cliente_id) as num_clientes,
  SUM(v.consumo) as total_ventas,
  AVG(v.consumo) as ticket_promedio,
  SUM(v.numero_personas) as total_personas
FROM visitas v
WHERE v.hora_salida IS NOT NULL
GROUP BY DATE(v.hora_entrada);

-- Vista para productos más vendidos
CREATE MATERIALIZED VIEW analytics_productos_top AS
SELECT
  pr.id,
  pr.nombre,
  pr.categoria,
  COUNT(p.id) as veces_pedido,
  SUM(p.cantidad) as cantidad_total,
  SUM(p.precio_unitario * p.cantidad) as revenue_total
FROM productos pr
JOIN pedidos p ON pr.id = p.producto_id
WHERE p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY pr.id, pr.nombre, pr.categoria
ORDER BY cantidad_total DESC;

-- Función para refrescar vistas
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW analytics_ventas_diarias;
  REFRESH MATERIALIZED VIEW analytics_productos_top;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refresh automático
-- (ejecutar via cron job cada 5 minutos)
```

### 3.2.6 API Endpoints

```typescript
// Nuevas funciones en api.ts
export const getVentasDiarias = async (fechaInicio: string, fechaFin: string)
export const getProductosTop = async (limite: number, periodo: string)
export const getClientesFrecuentes = async (minVisitas: number)
export const getTicketPromedio = async (periodo: string)
export const getMesasRotacion = async ()
export const getVentasPorHora = async (fecha: string)
export const getComparativaVentas = async (periodo1: string, periodo2: string)
export const exportarReporte = async (tipo: string, formato: string, filtros: any)
export const getAlertasActivas = async ()
export const getKPIs = async () // Resumen de todos los KPIs principales
```

### 3.2.7 Mockups/Wireframes

**Dashboard Principal**
```
┌────────────────────────────────────────────────────┐
│ 📊 Analytics Dashboard                             │
├────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │ Ventas   │ │ Mesas    │ │ Ticket   │ │Clientes ││
│ │ Hoy      │ │ Activas  │ │ Promedio │ │Hoy      ││
│ │          │ │          │ │          │ │         ││
│ │ $2,340   │ │ 6/8      │ │ $178     │ │ 12      ││
│ │ +15% ↑   │ │ 75%      │ │ +5% ↑    │ │ 8 nuevos││
│ └──────────┘ └──────────┘ └──────────┘ └─────────┘│
├────────────────────────────────────────────────────┤
│ 📈 Ventas por Hora                                 │
│ ┌──────────────────────────────────────────────┐   │
│ │     [Gráfica de línea]                       │   │
│ │                                              │   │
│ │                         ╱╲                   │   │
│ │                    ╱╲  ╱  ╲                  │   │
│ │               ╱╲  ╱  ╲╱    ╲                 │   │
│ │          ╱╲  ╱  ╲╱                           │   │
│ │     ╱╲  ╱  ╲╱                                │   │
│ │────────────────────────────────────────────  │   │
│ │ 12pm 2pm 4pm 6pm 8pm 10pm                    │   │
│ └──────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────┤
│ 🏆 Top 5 Productos                                 │
│ 1. Hamburguesa Clásica    45 vendidas  $3,960     │
│ 2. Cerveza Artesanal      38 vendidas  $1,520     │
│ 3. Tacos al Pastor        32 vendidas  $1,920     │
│ 4. Alitas BBQ             28 vendidas  $2,240     │
│ 5. Margarita              25 vendidas  $1,875     │
└────────────────────────────────────────────────────┘
```

### 3.2.8 Criterios de Aceptación

✅ **AC-2.1**: Dashboard muestra KPIs en tiempo real
✅ **AC-2.2**: Ventas del día se actualizan automáticamente
✅ **AC-2.3**: Gráficas son interactivas (hover, click)
✅ **AC-2.4**: Se pueden exportar reportes en PDF/Excel
✅ **AC-2.5**: Comparaciones temporales funcionan correctamente
✅ **AC-2.6**: Alertas se disparan según reglas configuradas
✅ **AC-2.7**: Performance < 3s para cargar dashboard
✅ **AC-2.8**: Datos son 100% precisos vs base de datos
✅ **AC-2.9**: Filtros de fecha funcionan correctamente
✅ **AC-2.10**: Solo usuarios autorizados pueden ver analytics

### 3.2.9 Estimación
- **Esfuerzo**: 50 horas
- **Prioridad**: 🟡 MEDIA
- **Complejidad**: Alta
- **Dependencias**: Sistema de pedidos completo

---

## 📧 FEATURE 3: Marketing Automatizado

### 3.3.1 Descripción
Sistema de marketing por email con campañas automáticas, segmentación de clientes y promociones personalizadas.

### 3.3.2 User Stories

**Como gerente de marketing, quiero:**
- Enviar campañas de email a todos los clientes
- Segmentar clientes por frecuencia de visita
- Programar emails de cumpleaños automáticos
- Ver tasas de apertura y clicks
- Crear promociones con códigos de descuento
- Reactivar clientes inactivos

**Como cliente, quiero:**
- Recibir ofertas personalizadas
- Promociones en mi cumpleaños
- No recibir spam (respetar marketing_opt_in)
- Poder darme de baja fácilmente

### 3.3.3 Requisitos Funcionales

#### RF-3.1 Sistema de Campañas
- **Componente**: `CampaignManager.tsx`
- **Funciones**:
  - Crear nueva campaña
  - Seleccionar template de email
  - Segmentar audiencia
  - Preview antes de enviar
  - Programar envío
  - Enviar inmediatamente
  - Duplicar campañas existentes

#### RF-3.2 Templates de Email
- **Templates Predefinidos**:
  1. **Bienvenida** - Nuevo cliente (automático)
  2. **Cumpleaños** - 20% descuento (automático)
  3. **Reactivación** - Cliente inactivo 30+ días
  4. **Promoción General** - Ofertas del mes
  5. **Evento Especial** - Noches temáticas, música en vivo
  6. **Puntos por Expirar** - Recordatorio de puntos

- **Editor de Templates**:
  - WYSIWYG editor
  - Variables dinámicas: {nombre}, {puntos}, {codigo_descuento}
  - Preview responsive (desktop/mobile)
  - Guardar como borrador

#### RF-3.3 Segmentación de Audiencia
- **Segmentos Automáticos**:
  - Todos los clientes (opt-in)
  - Clientes nuevos (< 30 días)
  - Clientes frecuentes (5+ visitas)
  - Clientes VIP (gasto total > $5,000)
  - Clientes inactivos (sin visita 30+ días)
  - Cumpleañeros del mes

- **Segmentos Personalizados**:
  - Filtrar por: edad, gasto total, frecuencia, última visita
  - Combinar filtros con AND/OR
  - Guardar segmentos para reutilizar
  - Ver tamaño de audiencia antes de enviar

#### RF-3.4 Códigos de Descuento
- **Componente**: `DiscountCodeManager.tsx`
- **Tipos de Descuentos**:
  - Porcentaje (10%, 20%, etc.)
  - Cantidad fija ($50, $100)
  - 2x1 en productos seleccionados
  - Regalo (entrada gratis, postre gratis)

- **Configuración**:
  - Código único (ej: CUMPLE2025)
  - Fecha inicio/fin
  - Uso máximo (ilimitado o N veces)
  - Restricciones (solo ciertos productos/categorías)
  - Valor mínimo de compra

- **Aplicación**:
  - Cliente ingresa código al pedir
  - Validación automática
  - Descuento aplicado en total
  - Registro de uso

#### RF-3.5 Automatizaciones
- **Emails Automáticos**:

  **3.5.1 Bienvenida**
  - Trigger: Registro de nuevo cliente
  - Delay: Inmediato
  - Contenido: Gracias por registrarte + explicación de puntos

  **3.5.2 Cumpleaños**
  - Trigger: 1 día antes del cumpleaños
  - Contenido: Felicitaciones + 20% descuento
  - Código único válido 7 días

  **3.5.3 Reactivación**
  - Trigger: 30 días sin visitar
  - Contenido: Te extrañamos + 15% descuento

  **3.5.4 Puntos por Expirar**
  - Trigger: Puntos con < 15 días para expirar
  - Contenido: Usa tus puntos antes de perderlos

  **3.5.5 Upgrade a VIP**
  - Trigger: Cliente alcanza gasto total > $5,000
  - Contenido: Bienvenido al club VIP + beneficios

#### RF-3.6 Analytics de Marketing
- **Métricas por Campaña**:
  - Emails enviados
  - Tasa de apertura (open rate)
  - Tasa de clicks (CTR)
  - Tasa de conversión (visitas después del email)
  - Revenue generado
  - ROI

- **Dashboard de Marketing**:
  - Comparativa de campañas
  - Mejor día/hora para enviar
  - Segmentos más rentables
  - Tendencia de opt-outs

### 3.3.4 Requisitos No Funcionales

- **Deliverability**: >95% de emails entregados
- **Velocidad**: Envío de 1,000 emails en < 5 min
- **Compliance**: Cumplir con CAN-SPAM Act
- **Privacy**: Respetar GDPR y marketing_opt_in
- **Unsubscribe**: Proceso de baja en 1 click

### 3.3.5 Diseño de Base de Datos

```sql
-- Tabla de campañas
CREATE TABLE campanas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  template_id VARCHAR(50),
  contenido TEXT NOT NULL,
  segmento JSONB, -- filtros de segmentación
  estado VARCHAR(50) DEFAULT 'Borrador', -- Borrador, Programada, Enviada, Cancelada
  programada_para TIMESTAMP,
  enviada_at TIMESTAMP,
  total_destinatarios INTEGER,
  abiertos INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversiones INTEGER DEFAULT 0,
  revenue_generado DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Tabla de envíos individuales (para tracking)
CREATE TABLE envios_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campana_id UUID REFERENCES campanas(id),
  cliente_id UUID REFERENCES clientes(id),
  email VARCHAR(200),
  estado VARCHAR(50), -- Enviado, Abierto, Clicked, Rebotado, Spam
  enviado_at TIMESTAMP DEFAULT NOW(),
  abierto_at TIMESTAMP,
  clicked_at TIMESTAMP,
  ip_apertura VARCHAR(50),
  user_agent TEXT
);

-- Tabla de códigos de descuento
CREATE TABLE codigos_descuento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  tipo VARCHAR(50), -- Porcentaje, Cantidad, 2x1, Regalo
  valor DECIMAL(10,2),
  descripcion TEXT,
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  uso_maximo INTEGER, -- NULL = ilimitado
  uso_actual INTEGER DEFAULT 0,
  valor_minimo DECIMAL(10,2), -- NULL = sin mínimo
  productos_aplicables JSONB, -- NULL = todos
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de uso de códigos
CREATE TABLE uso_codigos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_id UUID REFERENCES codigos_descuento(id),
  cliente_id UUID REFERENCES clientes(id),
  visita_id UUID REFERENCES visitas(id),
  descuento_aplicado DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Función para validar código
CREATE OR REPLACE FUNCTION validar_codigo_descuento(
  p_codigo VARCHAR,
  p_cliente_id UUID,
  p_total DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_codigo codigos_descuento;
  v_descuento DECIMAL;
  v_valido BOOLEAN := false;
  v_mensaje TEXT;
BEGIN
  SELECT * INTO v_codigo FROM codigos_descuento WHERE codigo = p_codigo AND activo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false, 'mensaje', 'Código no válido');
  END IF;

  -- Validar fechas
  IF v_codigo.fecha_inicio > NOW() OR v_codigo.fecha_fin < NOW() THEN
    RETURN jsonb_build_object('valido', false, 'mensaje', 'Código expirado');
  END IF;

  -- Validar usos
  IF v_codigo.uso_maximo IS NOT NULL AND v_codigo.uso_actual >= v_codigo.uso_maximo THEN
    RETURN jsonb_build_object('valido', false, 'mensaje', 'Código ya utilizado el máximo de veces');
  END IF;

  -- Validar mínimo
  IF v_codigo.valor_minimo IS NOT NULL AND p_total < v_codigo.valor_minimo THEN
    RETURN jsonb_build_object(
      'valido', false,
      'mensaje', 'Compra mínima de $' || v_codigo.valor_minimo::TEXT
    );
  END IF;

  -- Calcular descuento
  IF v_codigo.tipo = 'Porcentaje' THEN
    v_descuento := p_total * (v_codigo.valor / 100);
  ELSIF v_codigo.tipo = 'Cantidad' THEN
    v_descuento := v_codigo.valor;
  END IF;

  RETURN jsonb_build_object(
    'valido', true,
    'descuento', v_descuento,
    'mensaje', 'Código válido: -$' || v_descuento::TEXT
  );
END;
$$ LANGUAGE plpgsql;
```

### 3.3.6 Integración con Servicio de Email

**Opciones de Servicio**:
1. **SendGrid** (Recomendado)
   - 100 emails/día gratis
   - API simple
   - Tracking incluido
   - Templates

2. **Resend** (Alternativa)
   - 3,000 emails/mes gratis
   - Moderno y fácil
   - React Email para templates

3. **Mailgun**
   - 5,000 emails/mes gratis
   - Robusto
   - Logs detallados

**Implementación con SendGrid**:
```typescript
// services/emailService.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const enviarCampana = async (
  campanaId: string,
  destinatarios: Cliente[]
) => {
  const campana = await obtenerCampana(campanaId);

  const emails = destinatarios.map(cliente => ({
    to: cliente.email,
    from: 'marketing@expendio.com',
    subject: campana.asunto,
    html: renderTemplate(campana.contenido, {
      nombre: cliente.nombre,
      puntos: cliente.puntos_acumulados,
      // tracking pixel
      tracking: `<img src="${API_URL}/track/open/${campanaId}/${cliente.id}" width="1" height="1" />`
    }),
    custom_args: {
      campana_id: campanaId,
      cliente_id: cliente.id
    }
  }));

  // Enviar en batches de 100
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100);
    await sgMail.send(batch);
  }
};

// Tracking de apertura (endpoint)
export const trackEmailOpen = async (req: Request) => {
  const { campanaId, clienteId } = req.params;

  await supabase
    .from('envios_email')
    .update({
      estado: 'Abierto',
      abierto_at: new Date(),
      ip_apertura: req.ip,
      user_agent: req.headers['user-agent']
    })
    .eq('campana_id', campanaId)
    .eq('cliente_id', clienteId);

  // Incrementar contador en campaña
  await supabase.rpc('incrementar_abiertos', { p_campana_id: campanaId });

  // Devolver pixel transparente
  return new Response(TRANSPARENT_PIXEL, {
    headers: { 'Content-Type': 'image/gif' }
  });
};
```

### 3.3.7 API Endpoints

```typescript
// Nuevas funciones en api.ts

// Campañas
export const crearCampana = async (data: NuevaCampana)
export const obtenerCampanas = async ()
export const enviarCampana = async (campanaId: string)
export const programarCampana = async (campanaId: string, fecha: Date)
export const obtenerEstadisticasCampana = async (campanaId: string)
export const duplicarCampana = async (campanaId: string)

// Códigos de descuento
export const crearCodigoDescuento = async (data: NuevoCodigoDescuento)
export const validarCodigo = async (codigo: string, clienteId: string, total: number)
export const aplicarDescuento = async (codigo: string, visitaId: string)
export const obtenerCodigosActivos = async ()
export const desactivarCodigo = async (codigoId: string)

// Segmentación
export const obtenerSegmentos = async ()
export const crearSegmento = async (nombre: string, filtros: any)
export const obtenerClientesPorSegmento = async (segmentoId: string)

// Automatizaciones
export const configurarAutomatizacion = async (tipo: string, config: any)
export const obtenerAutomatizaciones = async ()
export const activarAutomatizacion = async (id: string, activa: boolean)
```

### 3.3.8 Mockups/Wireframes

**Crear Campaña**
```
┌─────────────────────────────────────────┐
│ 📧 Nueva Campaña                        │
├─────────────────────────────────────────┤
│ Nombre: ___________________________     │
│ Asunto: ___________________________     │
│                                         │
│ Template:                               │
│ [▼ Seleccionar template]                │
│   - Bienvenida                          │
│   - Cumpleaños                          │
│   - Promoción General                   │
│   - Personalizado                       │
│                                         │
│ Audiencia:                              │
│ [▼ Seleccionar segmento]                │
│   - Todos (opt-in): 245 clientes        │
│   - Clientes frecuentes: 87 clientes    │
│   - Inactivos: 32 clientes              │
│                                         │
│ Programar:                              │
│ ○ Enviar ahora                          │
│ ● Programar para: [📅 __/__/__] [🕐__:__]│
│                                         │
│ [👁️ Preview] [💾 Guardar] [📤 Enviar]   │
└─────────────────────────────────────────┘
```

**Estadísticas de Campaña**
```
┌─────────────────────────────────────────┐
│ 📊 Campaña: "Promoción Septiembre"     │
├─────────────────────────────────────────┤
│ Estado: ✅ Enviada                      │
│ Fecha: 01/09/2025 10:00 AM             │
├─────────────────────────────────────────┤
│ 📬 Enviados:    245                     │
│ ✉️ Abiertos:    187 (76.3%)  📈        │
│ 🖱️ Clicks:      45 (18.4%)             │
│ 🛒 Conversiones: 12 (4.9%)             │
│ 💰 Revenue:     $2,340                 │
│ 📊 ROI:         450%                   │
├─────────────────────────────────────────┤
│ [📥 Exportar] [🔁 Duplicar] [📧 Reenviar]│
└─────────────────────────────────────────┘
```

### 3.3.9 Criterios de Aceptación

✅ **AC-3.1**: Se pueden crear campañas de email
✅ **AC-3.2**: Templates son personalizables con variables dinámicas
✅ **AC-3.3**: Segmentación funciona correctamente
✅ **AC-3.4**: Emails se envían solo a clientes con marketing_opt_in=true
✅ **AC-3.5**: Tracking de aperturas funciona
✅ **AC-3.6**: Tracking de clicks funciona
✅ **AC-3.7**: Códigos de descuento se validan correctamente
✅ **AC-3.8**: Emails automáticos de cumpleaños se envían
✅ **AC-3.9**: Cliente puede darse de baja fácilmente
✅ **AC-3.10**: Estadísticas de campaña son precisas
✅ **AC-3.11**: Campañas se pueden programar para el futuro
✅ **AC-3.12**: Preview de email funciona antes de enviar

### 3.3.10 Estimación
- **Esfuerzo**: 45 horas
- **Prioridad**: 🟡 MEDIA
- **Complejidad**: Media-Alta
- **Dependencias**: Cuenta en SendGrid/Resend

---

## 📦 FEATURE 4: Gestión de Inventario

### 3.4.1 Descripción
Sistema de control de inventario con alertas de stock bajo, seguimiento de costos, y análisis de desperdicio.

### 3.4.2 User Stories

**Como gerente, quiero:**
- Ver inventario actual de todos los productos
- Recibir alertas cuando stock esté bajo
- Registrar entradas de mercancía
- Ver costo por producto
- Identificar productos con merma alta
- Generar órdenes de compra automáticas

**Como cocinero, quiero:**
- Marcar productos como "sin stock" temporalmente
- Ver cuántas porciones quedan de cada platillo
- Recibir alerta cuando se acabe un ingrediente

### 3.4.3 Requisitos Funcionales

#### RF-4.1 Gestión de Stock
- **Componente**: `InventoryManager.tsx`
- **Funciones**:
  - Ver lista completa de productos con stock
  - Filtrar por categoría
  - Buscar por nombre
  - Ordenar por: stock, costo, rotación
  - Editar stock manualmente
  - Marcar como "Agotado" (disponible=false)

#### RF-4.2 Registro de Movimientos
- **Componente**: `StockMovements.tsx`
- **Tipos de Movimientos**:
  - **Entrada**: Compra de mercancía
  - **Salida**: Venta (automático al confirmar pedido)
  - **Ajuste**: Corrección manual
  - **Merma**: Producto dañado/vencido

- **Datos por Movimiento**:
  - Producto
  - Tipo de movimiento
  - Cantidad
  - Costo unitario (para entradas)
  - Motivo (para ajustes/mermas)
  - Usuario que registra
  - Fecha/hora

#### RF-4.3 Alertas de Stock Bajo
- **Configuración por Producto**:
  - Stock mínimo (ej: 10 unidades)
  - Stock óptimo (ej: 50 unidades)
  - Auto-reorden (sí/no)

- **Alertas**:
  - Notificación en dashboard cuando stock < mínimo
  - Email diario con productos por reordenar
  - Badge en producto en el inventario
  - Sugerencia de cantidad a ordenar

#### RF-4.4 Órdenes de Compra
- **Componente**: `PurchaseOrders.tsx`
- **Funciones**:
  - Crear orden manual
  - Generar orden automática basada en alertas
  - Agregar múltiples productos a la orden
  - Especificar proveedor
  - Calcular total de la orden
  - Estados: Borrador, Enviada, Recibida, Cancelada

- **Al Recibir Orden**:
  - Registrar entrada de stock
  - Actualizar costos si cambiaron
  - Marcar orden como recibida

#### RF-4.5 Análisis de Costos
- **Métricas**:
  - Costo total de inventario actual
  - Costo promedio por producto
  - Margen de ganancia por producto
  - Productos con mayor costo
  - Valor de mermas mensual

- **Reportes**:
  - Evolución de costos en el tiempo
  - Comparativa de proveedores
  - Análisis de rentabilidad por categoría

#### RF-4.6 Control de Mermas
- **Registro de Mermas**:
  - Producto dañado
  - Producto vencido
  - Error en preparación
  - Otro (especificar)

- **Analytics**:
  - % de merma por producto
  - Costo total de mermas mensual
  - Productos con mayor merma
  - Tendencias de merma

### 3.4.4 Requisitos No Funcionales

- **Precisión**: 100% accuracy en conteos
- **Concurrencia**: Manejar múltiples usuarios editando stock simultáneamente
- **Auditoría**: Log completo de todos los cambios
- **Performance**: Carga de inventario completo en < 2s
- **Backup**: Respaldo diario automático

### 3.4.5 Diseño de Base de Datos

```sql
-- Tabla de inventario (extender productos)
ALTER TABLE productos
ADD COLUMN stock_actual INTEGER DEFAULT 0,
ADD COLUMN stock_minimo INTEGER DEFAULT 10,
ADD COLUMN stock_optimo INTEGER DEFAULT 50,
ADD COLUMN costo_unitario DECIMAL(10,2),
ADD COLUMN proveedor VARCHAR(200),
ADD COLUMN unidad_medida VARCHAR(50) DEFAULT 'unidad', -- unidad, kg, litro
ADD COLUMN auto_reorden BOOLEAN DEFAULT false,
ADD COLUMN ultima_compra TIMESTAMP,
ADD COLUMN costo_promedio DECIMAL(10,2);

-- Tabla de movimientos de inventario
CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id),
  tipo VARCHAR(50), -- Entrada, Salida, Ajuste, Merma
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER,
  stock_nuevo INTEGER,
  costo_unitario DECIMAL(10,2),
  motivo TEXT,
  pedido_id UUID REFERENCES pedidos(id), -- si es salida por venta
  orden_compra_id UUID, -- si es entrada por compra
  registrado_por VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de órdenes de compra
CREATE TABLE ordenes_compra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  proveedor VARCHAR(200),
  estado VARCHAR(50) DEFAULT 'Borrador', -- Borrador, Enviada, Recibida, Cancelada
  fecha_orden TIMESTAMP DEFAULT NOW(),
  fecha_entrega_estimada TIMESTAMP,
  fecha_recibida TIMESTAMP,
  total DECIMAL(10,2),
  notas TEXT,
  creada_por VARCHAR(100),
  recibida_por VARCHAR(100)
);

-- Detalle de órdenes de compra
CREATE TABLE ordenes_compra_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED
);

-- Tabla de mermas
CREATE TABLE mermas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  motivo VARCHAR(100), -- Vencido, Dañado, Error preparación, Otro
  descripcion TEXT,
  costo_perdido DECIMAL(10,2),
  registrado_por VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Función para registrar salida automática al vender
CREATE OR REPLACE FUNCTION registrar_venta_inventario()
RETURNS TRIGGER AS $$
BEGIN
  -- Reducir stock
  UPDATE productos
  SET stock_actual = stock_actual - NEW.cantidad
  WHERE id = NEW.producto_id;

  -- Registrar movimiento
  INSERT INTO movimientos_inventario (
    producto_id,
    tipo,
    cantidad,
    stock_anterior,
    stock_nuevo,
    pedido_id
  )
  SELECT
    NEW.producto_id,
    'Salida',
    NEW.cantidad,
    p.stock_actual + NEW.cantidad,
    p.stock_actual,
    NEW.id
  FROM productos p
  WHERE p.id = NEW.producto_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_venta_inventario
AFTER INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION registrar_venta_inventario();

-- Función para alertas de stock bajo
CREATE OR REPLACE FUNCTION obtener_productos_stock_bajo()
RETURNS TABLE (
  producto_id UUID,
  nombre VARCHAR,
  stock_actual INTEGER,
  stock_minimo INTEGER,
  cantidad_reorden INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nombre,
    p.stock_actual,
    p.stock_minimo,
    (p.stock_optimo - p.stock_actual) as cantidad_reorden
  FROM productos p
  WHERE p.stock_actual < p.stock_minimo
    AND p.disponible = true
  ORDER BY (p.stock_minimo - p.stock_actual) DESC;
END;
$$ LANGUAGE plpgsql;

-- Vista de valor de inventario
CREATE VIEW valor_inventario AS
SELECT
  p.categoria,
  COUNT(p.id) as total_productos,
  SUM(p.stock_actual) as unidades_totales,
  SUM(p.stock_actual * p.costo_unitario) as valor_total,
  AVG(p.stock_actual) as stock_promedio
FROM productos p
WHERE p.disponible = true
GROUP BY p.categoria;
```

### 3.4.6 API Endpoints

```typescript
// Nuevas funciones en api.ts

// Inventario
export const obtenerInventario = async (filtros?: any)
export const actualizarStock = async (productoId: string, nuevoStock: number)
export const obtenerStockBajo = async ()
export const obtenerMovimientos = async (productoId?: string, fechaInicio?: string, fechaFin?: string)
export const registrarMovimiento = async (data: NuevoMovimiento)

// Órdenes de compra
export const crearOrdenCompra = async (data: NuevaOrdenCompra)
export const obtenerOrdenesCompra = async (estado?: string)
export const recibirOrdenCompra = async (ordenId: string)
export const cancelarOrdenCompra = async (ordenId: string)
export const generarOrdenAutomatica = async () // Basada en stock bajo

// Mermas
export const registrarMerma = async (data: NuevaMerma)
export const obtenerMermas = async (periodo?: string)
export const obtenerEstadisticasMermas = async ()

// Analytics
export const obtenerValorInventario = async ()
export const obtenerRotacionProductos = async ()
export const obtenerCostosPromedio = async (periodo: string)
```

### 3.4.7 Mockups/Wireframes

**Inventario Principal**
```
┌────────────────────────────────────────────────────┐
│ 📦 Gestión de Inventario                           │
├────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [▼ Categoría] [+ Nueva Orden]      │
├────────────────────────────────────────────────────┤
│ ⚠️ 5 productos con stock bajo - [Ver alertas]     │
├────────────────────────────────────────────────────┤
│ Producto          Stock   Mín  Costo   Acciones   │
│─────────────────────────────────────────────────── │
│ Hamburguesa       45/50   10   $35     [✏️][📊]   │
│ ⚠️ Cerveza Art.   8/50    10   $25     [✏️][📊]   │
│ Tacos Pastor      32/50   10   $18     [✏️][📊]   │
│ ❌ Alitas BBQ     0/50    10   $45     [✏️][📊]   │
│ Margarita         28/50   10   $30     [✏️][📊]   │
├────────────────────────────────────────────────────┤
│ 💰 Valor total inventario: $12,450                │
└────────────────────────────────────────────────────┘
```

**Crear Orden de Compra**
```
┌────────────────────────────────────────┐
│ 📋 Nueva Orden de Compra               │
├────────────────────────────────────────┤
│ Proveedor: [▼ Seleccionar]             │
│ Fecha entrega: [📅 __/__/__]           │
│                                        │
│ Productos:                             │
│ ┌────────────────────────────────────┐ │
│ │ Cerveza Art.  x20  @$22 = $440     │ │
│ │ [❌]                                │ │
│ │                                    │ │
│ │ Alitas BBQ    x30  @$40 = $1,200   │ │
│ │ [❌]                                │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [+ Agregar producto]                   │
│                                        │
│ Subtotal:           $1,640             │
│ IVA (16%):          $262.40            │
│ Total:              $1,902.40          │
│                                        │
│ [💾 Guardar] [📤 Enviar]               │
└────────────────────────────────────────┘
```

### 3.4.8 Criterios de Aceptación

✅ **AC-4.1**: Se puede ver inventario completo con stock actual
✅ **AC-4.2**: Stock se reduce automáticamente al vender
✅ **AC-4.3**: Alertas de stock bajo funcionan
✅ **AC-4.4**: Se pueden crear órdenes de compra
✅ **AC-4.5**: Al recibir orden, stock se actualiza
✅ **AC-4.6**: Movimientos quedan registrados con auditoría
✅ **AC-4.7**: Se pueden registrar mermas
✅ **AC-4.8**: Reportes de costos son precisos
✅ **AC-4.9**: No hay race conditions al editar stock simultáneamente
✅ **AC-4.10**: Productos agotados se marcan como no disponibles

### 3.4.9 Estimación
- **Esfuerzo**: 35 horas
- **Prioridad**: 🟢 BAJA
- **Complejidad**: Media
- **Dependencias**: Sistema de pedidos

---

## 4. Especificaciones Técnicas

### 4.1 Stack Tecnológico

**Frontend**
- React 19.1.1
- TypeScript 5.8.2
- TailwindCSS 4.1.17
- Vite 6.2.0
- Chart.js 4.x (para gráficas)
- React Email (para templates)

**Backend**
- Supabase (PostgreSQL 15)
- Supabase RPC Functions
- Supabase Realtime (para updates)
- Row Level Security (RLS)

**Servicios Externos**
- SendGrid / Resend (emails)
- Vercel / Netlify (hosting)

### 4.2 Arquitectura

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Dashboard │  │Analytics │  │Marketing │      │
│  │  Staff   │  │ Dashboard│  │ Manager  │      │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘      │
│        │             │              │           │
│        └─────────────┼──────────────┘           │
│                      │                          │
│              ┌───────▼────────┐                 │
│              │   API Layer    │                 │
│              │  (services/)   │                 │
│              └───────┬────────┘                 │
└──────────────────────┼──────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼─────┐              ┌───────▼────────┐
    │ Supabase │              │  SendGrid API  │
    │PostgreSQL│              │   (emails)     │
    │   + RPC  │              └────────────────┘
    └──────────┘
```

### 4.3 Seguridad

**Autenticación**
- Supabase Auth (bcrypt)
- JWT tokens
- Session management

**Autorización**
- RLS Policies por tabla
- Roles: Admin, Gerente, Mesero, Cocinero, Cliente
- Permisos granulares

**Datos Sensibles**
- Encriptación en tránsito (HTTPS)
- Encriptación en reposo (Supabase)
- No almacenar tarjetas de crédito
- GDPR compliant (derecho al olvido)

### 4.4 Performance

**Optimizaciones**
- Lazy loading de componentes
- Paginación de listas largas
- Caché de consultas frecuentes
- Índices en BD
- Vistas materializadas para analytics

**Métricas Objetivo**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Time to Interactive: < 3s

### 4.5 Testing

**Niveles de Testing**
1. **Unit Tests** - Jest + React Testing Library
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Playwright (críticos)
4. **Manual QA** - Checklist antes de deploy

**Coverage Objetivo**: 70%+

---

## 5. Roadmap de Desarrollo

### 5.1 Priorización (MoSCoW)

#### Must Have (Fase 1) - 4 semanas
- ✅ Sistema de Pedidos Completo
  - Carrito de compras
  - Confirmación de pedidos
  - Tracking básico
  - Panel de cocina

#### Should Have (Fase 2) - 3 semanas
- ✅ Analytics Dashboard
  - KPIs principales
  - Gráficas interactivas
  - Reportes básicos
  - Exportar PDF

#### Could Have (Fase 3) - 3 semanas
- ✅ Marketing Automatizado
  - Campañas de email
  - Códigos de descuento
  - Automatizaciones básicas
  - Segmentación

#### Won't Have (Futuro)
- ❌ App móvil nativa
- ❌ Integración con POS físico
- ❌ Pagos en línea (por ahora)
- ❌ Multi-sucursal

### 5.2 Timeline Detallado

#### Semana 1-2: Sistema de Pedidos
- **Día 1-3**: Carrito de compras + UI
- **Día 4-6**: API de pedidos + confirmación
- **Día 7-9**: Tracking de estados
- **Día 10-12**: Panel de cocina
- **Día 13-14**: Testing + ajustes

#### Semana 3-4: Analytics Dashboard
- **Día 1-3**: KPIs + dashboard principal
- **Día 4-6**: Gráficas con Chart.js
- **Día 7-9**: Reportes detallados
- **Día 10-12**: Comparativas + alertas
- **Día 13-14**: Testing + optimización

#### Semana 5-6: Marketing (Parte 1)
- **Día 1-3**: Sistema de campañas + templates
- **Día 4-6**: Integración SendGrid + tracking
- **Día 7-9**: Códigos de descuento
- **Día 10-12**: Segmentación
- **Día 13-14**: Testing

#### Semana 7-8: Marketing (Parte 2) + Inventario
- **Día 1-3**: Automatizaciones de email
- **Día 4-6**: Analytics de marketing
- **Día 7-9**: Inventario básico
- **Día 10-12**: Órdenes de compra
- **Día 13-14**: Testing final + documentación

### 5.3 Hitos (Milestones)

**M1** (Semana 2): Sistema de Pedidos Live
**M2** (Semana 4): Analytics Dashboard Completo
**M3** (Semana 6): Primera Campaña de Email Enviada
**M4** (Semana 8): Sistema Completo v3.0
**M5** (Semana 9): Deploy a Producción

---

## 6. Métricas de Éxito

### 6.1 KPIs de Producto

**Sistema de Pedidos**
- **Adopción**: >80% de clientes usan pedidos digitales
- **Satisfacción**: NPS >8/10
- **Eficiencia**: Reducción 30% tiempo de atención
- **Abandono**: <10% de carritos abandonados

**Analytics**
- **Uso**: Dashboard visitado diariamente por gerencia
- **Decisiones**: >5 decisiones/semana basadas en datos
- **Tiempo**: Reportes generados en <30s
- **Precisión**: 100% accuracy vs contabilidad

**Marketing**
- **Open Rate**: >25% en campañas
- **CTR**: >5% en emails
- **Conversión**: >10% de emails a visitas
- **ROI**: >300% en campañas

**Inventario**
- **Mermas**: Reducción 20% vs baseline
- **Stock-outs**: <2 eventos/semana
- **Precisión**: >95% accuracy en conteos
- **Costo**: Reducción 15% en costos de inventario

### 6.2 KPIs de Negocio

**Revenue**
- **Ticket Promedio**: ↑ 20% (upselling automático)
- **Ventas Totales**: ↑ 25% en 3 meses
- **Retención**: ↑ 35% de clientes recurrentes

**Operaciones**
- **Eficiencia**: ↓ 30% tiempo de ciclo por mesa
- **Costos**: ↓ 20% en mermas y desperdicio
- **Satisfacción Staff**: >8/10

**Clientes**
- **NPS**: >9/10
- **Retorno**: >40% visitan 2+ veces/mes
- **Referidos**: >15% traen amigos

### 6.3 Criterios de Éxito del Proyecto

✅ **Entrega**: A tiempo (8 semanas)
✅ **Presupuesto**: Sin sobrecostos
✅ **Calidad**: 0 bugs críticos en producción
✅ **Adopción**: >70% de usuarios activos en 1 mes
✅ **Performance**: Todas las métricas Web Vitals en verde

---

## 7. Riesgos y Mitigación

### 7.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Deliverability de emails | Media | Alto | Usar SendGrid (alta reputación), warm-up gradual, monitorear bounce rate |
| Performance con 1000+ pedidos | Baja | Medio | Índices en BD, paginación, caché, load testing |
| Concurrencia en inventario | Media | Alto | Transacciones atómicas, locks optimistas, auditoría |
| Downtime de Supabase | Baja | Alto | Modo offline con localStorage, retry logic, monitoring |

### 7.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Baja adopción de pedidos digitales | Media | Alto | Onboarding claro, incentivos (puntos extra), staff capacitado |
| Spam complaints en emails | Baja | Medio | Doble opt-in, unsubscribe fácil, contenido relevante |
| Errores en cálculo de inventario | Media | Medio | Validaciones múltiples, auditoría, conteos físicos periódicos |

### 7.3 Plan de Contingencia

**Si algo sale mal en producción**:
1. **Rollback inmediato** a versión anterior (< 5 min)
2. **Comunicación** a usuarios afectados
3. **Análisis post-mortem** en 24hrs
4. **Fix y redeploy** en < 48hrs

---

## 8. Apéndices

### 8.1 Glosario

- **KPI**: Key Performance Indicator
- **NPS**: Net Promoter Score
- **CTR**: Click-Through Rate
- **ROI**: Return on Investment
- **RLS**: Row Level Security
- **RPC**: Remote Procedure Call
- **GDPR**: General Data Protection Regulation

### 8.2 Referencias

- [SendGrid Docs](https://docs.sendgrid.com/)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [Supabase RPC](https://supabase.com/docs/guides/database/functions)
- [React Email](https://react.email/)

### 8.3 Contactos

- **Product Owner**: [Nombre]
- **Tech Lead**: Claude Code
- **Designer**: [Nombre]
- **QA Lead**: [Nombre]

---

**Aprobaciones**

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | _________ | _______ | ______ |
| Tech Lead | _________ | _______ | ______ |
| Stakeholder | _________ | _______ | ______ |

---

**Historial de Cambios**

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 20/11/2025 | Claude | Versión inicial |

---

**Fin del Documento**
