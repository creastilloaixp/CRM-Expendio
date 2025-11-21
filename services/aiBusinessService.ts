/**
 * AI Business Intelligence Service
 * Servicios de IA para análisis de negocio, recomendaciones y predicciones
 */

import { getAiClient } from './geminiService';
import type { Cliente, Visita, Mesa, Producto, Pedido } from '../types';

// ========== 1. RECOMENDACIONES DE PEDIDOS ==========

export interface ProductRecommendation {
  productoId: string;
  nombre: string;
  razon: string;
  confianza: number; // 0-100
}

export const getProductRecommendations = async (
  cliente: Cliente | null,
  historialPedidos: Pedido[],
  productosDisponibles: Producto[],
  horaActual?: Date
): Promise<ProductRecommendation[]> => {
  const hora = horaActual || new Date();
  const horaNum = hora.getHours();

  // Determinar momento del día
  let momento = 'tarde';
  if (horaNum >= 6 && horaNum < 12) momento = 'mañana';
  else if (horaNum >= 12 && horaNum < 17) momento = 'mediodía';
  else if (horaNum >= 17 && horaNum < 21) momento = 'tarde-noche';
  else momento = 'noche';

  const prompt = `Eres el sistema de recomendaciones de "Expendio Cervecería Popular".
Analiza los datos y genera 3-5 recomendaciones de productos personalizadas.

## CONTEXTO
- Hora actual: ${hora.toLocaleTimeString('es-MX')} (${momento})
- Cliente: ${cliente ? `${cliente.nombre} (cliente ${historialPedidos.length > 5 ? 'frecuente' : 'nuevo'})` : 'Cliente anónimo'}

## HISTORIAL DE PEDIDOS DEL CLIENTE
${historialPedidos.length > 0 ? JSON.stringify(historialPedidos.slice(0, 10).map(p => ({
  producto: p.producto_nombre,
  cantidad: p.cantidad,
  fecha: p.created_at
})), null, 2) : 'Sin historial previo'}

## PRODUCTOS DISPONIBLES
${JSON.stringify(productosDisponibles.map(p => ({
  id: p.id,
  nombre: p.nombre,
  categoria: p.categoria,
  precio: p.precio,
  descripcion: p.descripcion
})), null, 2)}

## INSTRUCCIONES
Genera un JSON array con 3-5 recomendaciones. Cada objeto debe tener:
- productoId: ID del producto recomendado
- nombre: Nombre del producto
- razon: Razón breve de la recomendación (máx 50 caracteres)
- confianza: Nivel de confianza 0-100

Considera:
1. Hora del día (desayuno, comida, cena, snacks)
2. Historial del cliente (productos favoritos, patrones)
3. Productos populares si no hay historial
4. Complementos naturales (cerveza + botana, etc.)

RESPONDE SOLO CON EL JSON ARRAY, sin explicaciones adicionales.`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extraer JSON del texto
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    // Fallback: recomendar productos más populares por categoría
    return productosDisponibles.slice(0, 3).map(p => ({
      productoId: p.id,
      nombre: p.nombre,
      razon: 'Producto popular',
      confianza: 70
    }));
  }
};

// ========== 2. INVENTARIO PREDICTIVO ==========

export interface InventoryPrediction {
  productoId: string;
  nombre: string;
  stockActual: number;
  consumoPromedioDiario: number;
  diasHastaAgotarse: number;
  fechaEstimadaAgotamiento: string;
  urgencia: 'critico' | 'alto' | 'medio' | 'bajo';
  recomendacion: string;
}

export const getPredictiveInventory = async (
  productos: Producto[],
  pedidosHistoricos: Pedido[],
  diasAnalisis: number = 30
): Promise<InventoryPrediction[]> => {
  // Calcular consumo por producto
  const consumoPorProducto: Record<string, number> = {};
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - diasAnalisis);

  pedidosHistoricos.forEach(pedido => {
    const fechaPedido = new Date(pedido.created_at || '');
    if (fechaPedido >= fechaInicio) {
      const key = pedido.producto_id;
      consumoPorProducto[key] = (consumoPorProducto[key] || 0) + pedido.cantidad;
    }
  });

  const prompt = `Eres un analista de inventario para "Expendio Cervecería Popular".
Analiza el consumo histórico y predice necesidades de reabastecimiento.

## PRODUCTOS Y CONSUMO (últimos ${diasAnalisis} días)
${JSON.stringify(productos.map(p => ({
  id: p.id,
  nombre: p.nombre,
  categoria: p.categoria,
  stock: p.stock || 'No registrado',
  consumoTotal: consumoPorProducto[p.id] || 0,
  consumoDiario: ((consumoPorProducto[p.id] || 0) / diasAnalisis).toFixed(2)
})), null, 2)}

## INSTRUCCIONES
Genera un JSON array con predicciones de inventario. Para cada producto con consumo significativo:
- productoId: ID del producto
- nombre: Nombre
- stockActual: Stock actual (usar 100 si no está registrado)
- consumoPromedioDiario: Consumo promedio diario
- diasHastaAgotarse: Días estimados hasta agotar stock
- fechaEstimadaAgotamiento: Fecha formato YYYY-MM-DD
- urgencia: "critico" (<3 días), "alto" (3-7 días), "medio" (7-14 días), "bajo" (>14 días)
- recomendacion: Acción sugerida (máx 60 caracteres)

Ordena por urgencia (crítico primero). Solo incluye productos con consumo.
RESPONDE SOLO CON EL JSON ARRAY.`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error getting inventory predictions:', error);
    return [];
  }
};

// ========== 3. ANALYTICS CON INSIGHTS IA ==========

export interface BusinessInsight {
  tipo: 'oportunidad' | 'alerta' | 'tendencia' | 'recomendacion';
  titulo: string;
  descripcion: string;
  impacto: 'alto' | 'medio' | 'bajo';
  accion?: string;
  metrica?: string;
}

export const getBusinessInsights = async (
  visitas: Visita[],
  pedidos: Pedido[],
  mesas: Mesa[],
  periodo: 'hoy' | 'semana' | 'mes' = 'semana'
): Promise<BusinessInsight[]> => {
  // Calcular métricas
  const ahora = new Date();
  let fechaInicio = new Date();

  switch (periodo) {
    case 'hoy':
      fechaInicio.setHours(0, 0, 0, 0);
      break;
    case 'semana':
      fechaInicio.setDate(ahora.getDate() - 7);
      break;
    case 'mes':
      fechaInicio.setMonth(ahora.getMonth() - 1);
      break;
  }

  const visitasPeriodo = visitas.filter(v => new Date(v.hora_llegada) >= fechaInicio);
  const pedidosPeriodo = pedidos.filter(p => new Date(p.created_at || '') >= fechaInicio);

  const ingresosTotales = visitasPeriodo.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
  const ticketPromedio = visitasPeriodo.length > 0 ? ingresosTotales / visitasPeriodo.length : 0;
  const ocupacionPromedio = mesas.filter(m => m.estado === 'Ocupada').length / mesas.length * 100;

  const prompt = `Eres un analista de business intelligence para "Expendio Cervecería Popular".
Genera insights accionables basados en los datos del negocio.

## MÉTRICAS DEL PERÍODO (${periodo})
- Visitas totales: ${visitasPeriodo.length}
- Ingresos totales: $${ingresosTotales.toFixed(2)} MXN
- Ticket promedio: $${ticketPromedio.toFixed(2)} MXN
- Ocupación actual: ${ocupacionPromedio.toFixed(1)}%
- Pedidos realizados: ${pedidosPeriodo.length}

## DATOS DETALLADOS
### Visitas por hora (distribución)
${JSON.stringify(getDistribucionHoras(visitasPeriodo), null, 2)}

### Top productos vendidos
${JSON.stringify(getTopProductos(pedidosPeriodo), null, 2)}

### Mesas más rentables
${JSON.stringify(getMesasRentables(visitasPeriodo), null, 2)}

## INSTRUCCIONES
Genera un JSON array con 4-6 insights de negocio. Cada insight debe tener:
- tipo: "oportunidad", "alerta", "tendencia" o "recomendacion"
- titulo: Título corto (máx 40 caracteres)
- descripcion: Explicación detallada (máx 150 caracteres)
- impacto: "alto", "medio" o "bajo"
- accion: Acción sugerida específica (máx 80 caracteres)
- metrica: Dato clave relacionado (opcional)

Enfócate en:
1. Horas pico y valles (oportunidad de promociones)
2. Productos estrella y de bajo rendimiento
3. Patrones de consumo inusuales
4. Oportunidades de upselling
5. Alertas de operación

RESPONDE SOLO CON EL JSON ARRAY.`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error getting business insights:', error);
    return [];
  }
};

// Helpers para analytics
function getDistribucionHoras(visitas: Visita[]): Record<string, number> {
  const dist: Record<string, number> = {};
  visitas.forEach(v => {
    const hora = new Date(v.hora_llegada).getHours();
    const key = `${hora}:00`;
    dist[key] = (dist[key] || 0) + 1;
  });
  return dist;
}

function getTopProductos(pedidos: Pedido[]): Array<{nombre: string, cantidad: number, ingresos: number}> {
  const productos: Record<string, {cantidad: number, ingresos: number}> = {};
  pedidos.forEach(p => {
    const key = p.producto_nombre || p.producto_id;
    if (!productos[key]) productos[key] = {cantidad: 0, ingresos: 0};
    productos[key].cantidad += p.cantidad;
    productos[key].ingresos += (p.precio_unitario || 0) * p.cantidad;
  });
  return Object.entries(productos)
    .map(([nombre, data]) => ({nombre, ...data}))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 5);
}

function getMesasRentables(visitas: Visita[]): Array<{mesa: string, visitas: number, ingresos: number}> {
  const mesas: Record<string, {visitas: number, ingresos: number}> = {};
  visitas.forEach(v => {
    const key = v.mesa?.nombre || 'Desconocida';
    if (!mesas[key]) mesas[key] = {visitas: 0, ingresos: 0};
    mesas[key].visitas += 1;
    mesas[key].ingresos += v.consumo_total || 0;
  });
  return Object.entries(mesas)
    .map(([mesa, data]) => ({mesa, ...data}))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 5);
}

// ========== 4. SEGMENTACIÓN DE CLIENTES ==========

export interface ClientSegment {
  clienteId: string;
  nombre: string;
  segmento: 'vip' | 'frecuente' | 'regular' | 'nuevo' | 'en_riesgo' | 'perdido';
  score: number; // 0-100
  valorVida: number; // CLV estimado
  ultimaVisita: string;
  frecuenciaVisitas: number; // visitas por mes
  ticketPromedio: number;
  recomendaciones: string[];
}

export const segmentClients = async (
  clientes: Cliente[],
  visitas: Visita[]
): Promise<ClientSegment[]> => {
  // Agrupar visitas por cliente
  const visitasPorCliente: Record<string, Visita[]> = {};
  visitas.forEach(v => {
    if (v.cliente_id) {
      if (!visitasPorCliente[v.cliente_id]) visitasPorCliente[v.cliente_id] = [];
      visitasPorCliente[v.cliente_id].push(v);
    }
  });

  // Calcular métricas por cliente
  const metricas = clientes.map(cliente => {
    const visitasCliente = visitasPorCliente[cliente.id] || [];
    const gastoTotal = visitasCliente.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
    const ticketPromedio = visitasCliente.length > 0 ? gastoTotal / visitasCliente.length : 0;

    // Calcular frecuencia (visitas por mes)
    let frecuencia = 0;
    if (visitasCliente.length > 0) {
      const fechas = visitasCliente.map(v => new Date(v.hora_llegada).getTime());
      const primeraVisita = Math.min(...fechas);
      const ultimaVisita = Math.max(...fechas);
      const meses = Math.max(1, (ultimaVisita - primeraVisita) / (30 * 24 * 60 * 60 * 1000));
      frecuencia = visitasCliente.length / meses;
    }

    const ultimaVisita = visitasCliente.length > 0
      ? visitasCliente.sort((a, b) => new Date(b.hora_llegada).getTime() - new Date(a.hora_llegada).getTime())[0].hora_llegada
      : null;

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      totalVisitas: visitasCliente.length,
      gastoTotal,
      ticketPromedio,
      frecuencia,
      ultimaVisita,
      diasDesdeUltimaVisita: ultimaVisita
        ? Math.floor((Date.now() - new Date(ultimaVisita).getTime()) / (24 * 60 * 60 * 1000))
        : null
    };
  });

  const prompt = `Eres un experto en CRM y segmentación de clientes para "Expendio Cervecería Popular".
Clasifica cada cliente en un segmento y genera recomendaciones personalizadas.

## CLIENTES Y MÉTRICAS
${JSON.stringify(metricas, null, 2)}

## CRITERIOS DE SEGMENTACIÓN
- **VIP**: >10 visitas, ticket promedio alto, visita reciente (<15 días)
- **Frecuente**: 5-10 visitas, visita reciente (<30 días)
- **Regular**: 2-4 visitas, visita reciente (<60 días)
- **Nuevo**: 1 visita en últimos 30 días
- **En riesgo**: Cliente frecuente/VIP sin visita >30 días
- **Perdido**: Sin visita >90 días

## INSTRUCCIONES
Genera un JSON array con la segmentación. Cada objeto debe tener:
- clienteId: ID del cliente
- nombre: Nombre
- segmento: "vip", "frecuente", "regular", "nuevo", "en_riesgo" o "perdido"
- score: Puntuación de valor 0-100
- valorVida: CLV estimado anual en MXN
- ultimaVisita: Fecha última visita (o "Nunca")
- frecuenciaVisitas: Visitas promedio por mes
- ticketPromedio: Ticket promedio en MXN
- recomendaciones: Array de 2-3 acciones específicas para este cliente

RESPONDE SOLO CON EL JSON ARRAY.`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error segmenting clients:', error);
    return [];
  }
};

// ========== 5. ASISTENTE ADMINISTRATIVO ==========

export interface AdminQuery {
  pregunta: string;
  contexto?: {
    visitas?: Visita[];
    pedidos?: Pedido[];
    mesas?: Mesa[];
    clientes?: Cliente[];
    productos?: Producto[];
  };
}

export const askAdminAssistant = async (query: AdminQuery): Promise<string> => {
  const { pregunta, contexto } = query;

  // Construir contexto de datos
  let datosContexto = '';

  if (contexto?.mesas) {
    const libres = contexto.mesas.filter(m => m.estado === 'Libre').length;
    const ocupadas = contexto.mesas.filter(m => m.estado === 'Ocupada').length;
    datosContexto += `\n## MESAS\n- Total: ${contexto.mesas.length}\n- Libres: ${libres}\n- Ocupadas: ${ocupadas}\n`;
  }

  if (contexto?.visitas) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const visitasHoy = contexto.visitas.filter(v => new Date(v.hora_llegada) >= hoy);
    const ingresosHoy = visitasHoy.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
    datosContexto += `\n## VISITAS HOY\n- Cantidad: ${visitasHoy.length}\n- Ingresos: $${ingresosHoy.toFixed(2)} MXN\n`;
  }

  if (contexto?.clientes) {
    datosContexto += `\n## CLIENTES\n- Total registrados: ${contexto.clientes.length}\n`;
  }

  if (contexto?.productos) {
    datosContexto += `\n## PRODUCTOS\n- Disponibles: ${contexto.productos.filter(p => p.disponible).length}\n`;
  }

  const prompt = `Eres el asistente administrativo inteligente de "Expendio Cervecería Popular".
Responde consultas del equipo administrativo de forma clara, precisa y accionable.

## DATOS ACTUALES DEL NEGOCIO
${datosContexto || 'Sin datos de contexto disponibles'}

## PREGUNTA DEL USUARIO
"${pregunta}"

## INSTRUCCIONES
- Responde en español, de forma profesional pero amigable
- Si la pregunta requiere datos que no tienes, indícalo claramente
- Proporciona números específicos cuando sea posible
- Sugiere acciones concretas cuando sea apropiado
- Usa formato markdown para mejor legibilidad
- Sé conciso pero completo (máximo 3-4 párrafos)
- Si detectas una pregunta sobre predicciones o tendencias, indica que es una estimación basada en datos históricos`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error in admin assistant:', error);
    return '❌ No pude procesar tu consulta. Por favor, intenta de nuevo o reformula tu pregunta.';
  }
};

// ========== EXPORTAR SERVICIO UNIFICADO ==========

export const aiBusinessService = {
  // Recomendaciones
  getProductRecommendations,

  // Inventario
  getPredictiveInventory,

  // Analytics
  getBusinessInsights,

  // Segmentación
  segmentClients,

  // Asistente
  askAdminAssistant,
};

export default aiBusinessService;
