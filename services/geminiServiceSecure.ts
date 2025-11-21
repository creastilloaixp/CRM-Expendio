import type { Visita, Cliente } from '../types';
import type { AppContext } from './geminiService';
import { supabase } from './supabaseClient';

// Detectar si estamos en producción
const IS_PRODUCTION = import.meta.env.PROD;
const USE_PROXY = IS_PRODUCTION || import.meta.env.VITE_USE_GEMINI_PROXY === 'true';

/**
 * Llamada segura a Gemini API usando el proxy de Supabase Edge Functions
 * En desarrollo usa la API directa para facilitar testing
 */
async function callGeminiSecure(
  prompt: string,
  systemInstruction?: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> {

  if (USE_PROXY) {
    // PRODUCCIÓN: Usar Edge Function (segura)
    const { data: session } = await supabase.auth.getSession();

    if (!session?.session) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          model
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al llamar al servicio de IA');
    }

    const { text } = await response.json();
    return text;

  } else {
    // DESARROLLO: Usar API directa (facilita debugging)
    const { getAiClient } = await import('./geminiService');
    const geminiClient = await getAiClient();
    const geminiModel = geminiClient.getGenerativeModel({
      model,
      ...(systemInstruction && { systemInstruction })
    });

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  }
}

// Exportar las mismas funciones pero usando el método seguro

export const getInsightsSecure = async (
  visits: Visita[],
  question: string,
  systemInstructionOverride?: string
): Promise<string> => {
  const defaultSystemInstruction = `Eres un analista de datos experto para un restaurante llamado 'Expendio Cervecería Popular'. Tu tarea es analizar los datos de visitas de clientes y responder preguntas en español de forma clara, concisa y amigable.
  - Utiliza los datos proporcionados en formato JSON.
  - Proporciona insights accionables para el negocio cuando sea posible.
  - Formatea tus respuestas usando markdown simple (negritas con **, listas con -) para una mejor legibilidad.
  - No menciones que eres un modelo de IA. Actúa como un asistente analista.
  - Sé breve y directo en tus respuestas.`;

  const systemInstruction = systemInstructionOverride || defaultSystemInstruction;

  const simplifiedVisits = visits.map(v => ({
    llegada: v.hora_llegada,
    salida: v.hora_salida,
    personas: v.numero_personas,
    consumo: v.consumo_total,
    cliente: v.cliente?.nombre,
    mesa: v.mesa?.nombre,
  }));

  const dataContext = JSON.stringify(simplifiedVisits, null, 2);

  const prompt = `${systemInstruction}

Aquí están los datos de las visitas:
${dataContext}

Por favor, responde la siguiente pregunta: "${question}"`;

  try {
    return await callGeminiSecure(prompt, undefined, 'gemini-2.0-flash-exp');
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    if (error instanceof Error) {
      if (error.message.includes("Could not load the AI service")) {
        return "❌ No pude conectar con el servicio de IA. Por favor, recarga la página e inténtalo de nuevo.";
      }
      if (error.message.includes("overloaded") || error.message.includes("503")) {
        return "⏳ El servicio de IA está temporalmente saturado. Por favor, intenta de nuevo en unos segundos.";
      }
      if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("403")) {
        return "🔑 Error de autenticación con la API de IA. Verifica la configuración de la API key.";
      }
    }

    return "❌ Hubo un problema al analizar los datos. Por favor, inténtalo de nuevo en unos momentos.";
  }
};

export const getInsightsWithFullContextSecure = async (
  context: AppContext,
  question: string,
  systemInstructionOverride?: string
): Promise<string> => {
  const defaultSystemInstruction = `Eres el asistente inteligente de 'Expendio Cervecería Popular', un restaurante de alta calidad. Tienes acceso completo a:
- Estado actual de todas las mesas (libres, ocupadas, reservadas)
- Todas las reservas confirmadas
- Historial completo de visitas
- Base de datos de clientes
- Notificaciones pendientes del staff

Tu trabajo es:
- Analizar datos en tiempo real y proporcionar insights accionables
- Responder preguntas sobre operaciones, clientes, reservas, ingresos
- Sugerir mejoras operativas y estratégicas
- Identificar patrones y oportunidades de negocio
- Ayudar con decisiones basadas en datos

Formato de respuesta:
- Usa markdown simple (**, -, listas numeradas)
- Sé conciso pero completo
- Proporciona números específicos cuando sea posible
- Sugiere acciones concretas
- No menciones que eres una IA, actúa como el gerente de datos del restaurante`;

  const systemInstruction = systemInstructionOverride || defaultSystemInstruction;

  // Formatear contexto completo
  const parts: string[] = [];

  if (context.mesas && context.mesas.length > 0) {
    const mesasLibres = context.mesas.filter(m => m.estado === 'Libre').length;
    const mesasOcupadas = context.mesas.filter(m => m.estado === 'Ocupada').length;
    const mesasReservadas = context.mesas.filter(m => m.estado === 'Reservada').length;

    parts.push(`## ESTADO DE MESAS
- Total de mesas: ${context.mesas.length}
- Mesas libres: ${mesasLibres}
- Mesas ocupadas: ${mesasOcupadas}
- Mesas reservadas: ${mesasReservadas}
- Tasa de ocupación: ${((mesasOcupadas / context.mesas.length) * 100).toFixed(1)}%`);
  }

  if (context.reservas && context.reservas.length > 0) {
    const reservasData = context.reservas.map(r => ({
      mesa: r.mesa?.nombre,
      cliente: r.cliente?.nombre,
      telefono: r.cliente?.telefono,
      fecha_hora: r.fecha_hora,
      personas: r.numero_personas,
      estado: r.estado
    }));
    parts.push(`\n## RESERVAS (${context.reservas.length})
${JSON.stringify(reservasData, null, 2)}`);
  }

  if (context.visitas && context.visitas.length > 0) {
    const visitasData = context.visitas.map(v => ({
      mesa: v.mesa?.nombre,
      cliente: v.cliente?.nombre,
      llegada: v.hora_llegada,
      salida: v.hora_salida,
      personas: v.numero_personas,
      consumo: v.consumo_total
    }));

    const totalIngresos = context.visitas
      .filter(v => v.consumo_total)
      .reduce((sum, v) => sum + (v.consumo_total || 0), 0);
    const visitasCompletadas = context.visitas.filter(v => v.hora_salida).length;
    const visitasActivas = context.visitas.filter(v => !v.hora_salida).length;
    const consumoPromedio = visitasCompletadas > 0 ? totalIngresos / visitasCompletadas : 0;

    parts.push(`\n## VISITAS (${context.visitas.length})
- Visitas activas: ${visitasActivas}
- Visitas completadas: ${visitasCompletadas}
- Ingresos totales: $${totalIngresos.toFixed(2)} MXN
- Consumo promedio: $${consumoPromedio.toFixed(2)} MXN

### Detalle de visitas:
${JSON.stringify(visitasData, null, 2)}`);
  }

  if (context.clientes && context.clientes.length > 0) {
    parts.push(`\n## CLIENTES
- Total de clientes registrados: ${context.clientes.length}`);
  }

  if (context.notificaciones && context.notificaciones.length > 0) {
    const notifData = context.notificaciones.map(n => ({
      mesa: n.mesa_nombre,
      tipo: n.tipo,
      mensaje: n.mensaje,
      estado: n.estado
    }));
    parts.push(`\n## NOTIFICACIONES PENDIENTES (${context.notificaciones.length})
${JSON.stringify(notifData, null, 2)}`);
  }

  const dataContext = parts.join('\n');

  const prompt = `${systemInstruction}

# ESTADO ACTUAL DEL RESTAURANTE

${dataContext}

---

**Pregunta del usuario:** "${question}"

Por favor, responde basándote en los datos actuales del restaurante.`;

  try {
    return await callGeminiSecure(prompt, undefined, 'gemini-2.0-flash-exp');
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    if (error instanceof Error) {
      if (error.message.includes("Could not load the AI service")) {
        return "❌ No pude conectar con el servicio de IA. Por favor, recarga la página e inténtalo de nuevo.";
      }
      if (error.message.includes("overloaded") || error.message.includes("503")) {
        return "⏳ El servicio de IA está temporalmente saturado. Por favor, intenta de nuevo en unos segundos.";
      }
      if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("403")) {
        return "🔑 Error de autenticación con la API de IA. Verifica la configuración de la API key.";
      }
    }

    return "❌ Hubo un problema al analizar los datos. Por favor, inténtalo de nuevo en unos momentos.";
  }
};

export const getClienteInsightsSecure = async (
  cliente: Cliente,
  visitas: Visita[]
): Promise<string> => {
  const visitasCompletadas = visitas.filter(v => v.hora_salida);
  const gastoTotal = visitasCompletadas.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
  const gastoPromedio = visitasCompletadas.length > 0 ? gastoTotal / visitasCompletadas.length : 0;

  let frecuencia = 'primera vez';
  if (visitas.length >= 10) frecuencia = 'cliente VIP';
  else if (visitas.length >= 5) frecuencia = 'cliente frecuente';
  else if (visitas.length >= 2) frecuencia = 'cliente recurrente';

  const systemInstruction = `Eres un analista de CRM experto para 'Expendio Cervecería Popular'. Analiza el perfil del cliente y genera insights accionables para el equipo de ventas y marketing.

## DATOS DEL CLIENTE

**Nombre**: ${cliente.nombre}
**Email**: ${cliente.email}
**Teléfono**: ${cliente.telefono}
**Total de visitas**: ${visitas.length}
**Gasto total**: $${gastoTotal.toFixed(2)} MXN
**Gasto promedio**: $${gastoPromedio.toFixed(2)} MXN
**Segmento**: ${frecuencia}

## HISTORIAL DE VISITAS

${JSON.stringify(visitas.map(v => ({
  fecha: v.hora_llegada,
  personas: v.numero_personas,
  consumo: v.consumo_total,
  mesa: v.mesa?.nombre
})), null, 2)}

## TU TAREA

Genera un análisis breve (3-4 párrafos) que incluya:

1. **Perfil del cliente**: Tipo de cliente, comportamiento de consumo, frecuencia
2. **Patrones identificados**: Horarios preferidos, días, tamaño de grupo, preferencias
3. **Recomendaciones de marketing**: Qué promociones ofrecer, cuándo contactar, qué productos sugerir
4. **Predicciones**: Probabilidad de retorno, valor potencial de vida (CLV estimado)

Usa markdown para formatear. Sé específico con números. Enfócate en acciones concretas.`;

  const prompt = systemInstruction;

  try {
    return await callGeminiSecure(prompt, undefined, 'gemini-2.0-flash-exp');
  } catch (error) {
    console.error("Error calling Gemini API for cliente insights:", error);
    return "❌ No se pudieron generar insights. Por favor, intenta de nuevo.";
  }
};
