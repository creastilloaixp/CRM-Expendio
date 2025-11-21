import type { Visita, Mesa, Reserva, Cliente } from '../types';
import type { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

let ai: GoogleGenerativeAI | null = null;

// Make the function async to handle the dynamic import and export it
export const getAiClient = async (): Promise<GoogleGenerativeAI> => {
    if (!ai) {
        try {
            // Dynamically import the module.
            // This moves the network request from app load time to the first-use time.
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            ai = new GoogleGenerativeAI(process.env.API_KEY || '');
        } catch (e) {
            console.error("Failed to load @google/generative-ai module", e);
            throw new Error("Could not load the AI service.");
        }
    }
    return ai;
};

// Contexto completo de la aplicación
export interface AppContext {
  visitas?: Visita[];
  mesas?: Mesa[];
  reservas?: Reserva[];
  clientes?: Cliente[];
  notificaciones?: any[];
}

const formatVisitsForAI = (visits: Visita[]): string => {
  const simplifiedVisits = visits.map(v => ({
    llegada: v.hora_llegada,
    salida: v.hora_salida,
    personas: v.numero_personas,
    consumo: v.consumo_total,
    cliente: v.cliente?.nombre,
    mesa: v.mesa?.nombre,
  }));
  return JSON.stringify(simplifiedVisits, null, 2);
};

const formatFullContextForAI = (context: AppContext): string => {
  const parts: string[] = [];

  // Estadísticas de mesas
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

  // Reservas
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

  // Visitas
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

  // Clientes
  if (context.clientes && context.clientes.length > 0) {
    parts.push(`\n## CLIENTES
- Total de clientes registrados: ${context.clientes.length}`);
  }

  // Notificaciones
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

  return parts.join('\n');
};

// Función original: Solo con visitas (para compatibilidad)
export const getInsights = async (visits: Visita[], question: string, systemInstructionOverride?: string): Promise<string> => {
  const modelName = 'gemini-2.0-flash-exp';

  const defaultSystemInstruction = `Eres un analista de datos experto para un restaurante llamado 'Expendio Cervecería Popular'. Tu tarea es analizar los datos de visitas de clientes y responder preguntas en español de forma clara, concisa y amigable.
  - Utiliza los datos proporcionados en formato JSON.
  - Proporciona insights accionables para el negocio cuando sea posible.
  - Formatea tus respuestas usando markdown simple (negritas con **, listas con -) para una mejor legibilidad.
  - No menciones que eres un modelo de IA. Actúa como un asistente analista.
  - Sé breve y directo en tus respuestas.`;

  const systemInstruction = systemInstructionOverride || defaultSystemInstruction;
  const dataContext = formatVisitsForAI(visits);

  const prompt = `${systemInstruction}

Aquí están los datos de las visitas:
${dataContext}

Por favor, responde la siguiente pregunta: "${question}"`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Manejo específico de errores
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

// Nueva función: Con contexto completo de la aplicación
export const getInsightsWithFullContext = async (context: AppContext, question: string, systemInstructionOverride?: string): Promise<string> => {
  const modelName = 'gemini-2.0-flash-exp';

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
  const dataContext = formatFullContextForAI(context);

  const prompt = `${systemInstruction}

# ESTADO ACTUAL DEL RESTAURANTE

${dataContext}

---

**Pregunta del usuario:** "${question}"

Por favor, responde basándote en los datos actuales del restaurante.`;

  try {
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
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

// Insights personalizados para clientes
export const getClienteInsights = async (cliente: Cliente, visitas: Visita[]): Promise<string> => {
  const modelName = 'gemini-2.0-flash-exp';

  const visitasCompletadas = visitas.filter(v => v.hora_salida);
  const gastoTotal = visitasCompletadas.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
  const gastoPromedio = visitasCompletadas.length > 0 ? gastoTotal / visitasCompletadas.length : 0;

  // Análisis de frecuencia
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
    const geminiClient = await getAiClient();
    const model = geminiClient.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API for cliente insights:", error);
    return "❌ No se pudieron generar insights. Por favor, intenta de nuevo.";
  }
};

// --- New Chatbot Functionality ---
export const createChat = async (systemInstruction: string): Promise<ChatSession> => {
  const geminiClient = await getAiClient();
  const model = geminiClient.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: systemInstruction
  });
  return model.startChat();
};


// --- New Live API Functionality ---
// NOTA: Las funcionalidades de Live API requieren @google/genai
// Por ahora están deshabilitadas mientras usamos @google/generative-ai

// // Audio helper functions from documentation
// export function encode(bytes: Uint8Array): string {
//   let binary = '';
//   const len = bytes.byteLength;
//   for (let i = 0; i < len; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return btoa(binary);
// }

// export function decode(base64: string): Uint8Array {
//   const binaryString = atob(base64);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes;
// }

// export async function decodeAudioData(
//   data: Uint8Array,
//   ctx: AudioContext,
//   sampleRate: number,
//   numChannels: number,
// ): Promise<AudioBuffer> {
//   const dataInt16 = new Int16Array(data.buffer);
//   const frameCount = dataInt16.length / numChannels;
//   const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

//   for (let channel = 0; channel < numChannels; channel++) {
//     const channelData = buffer.getChannelData(channel);
//     for (let i = 0; i < frameCount; i++) {
//       channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
//     }
//   }
//   return buffer;
// }

// export function createBlob(data: Float32Array): Blob {
//   const l = data.length;
//   const int16 = new Int16Array(l);
//   for (let i = 0; i < l; i++) {
//     int16[i] = data[i] * 32768;
//   }
//   return {
//     data: encode(new Uint8Array(int16.buffer)),
//     mimeType: 'audio/pcm;rate=16000',
//   };
// }

// export const connectToLiveSession = async (callbacks: LiveSessionCallbacks): Promise<LiveSession> => {
//     const geminiClient = await getAiClient();
//     const { Modality } = await import('@google/genai');

//     const session = await geminiClient.live.connect({
//         model: 'gemini-1.5-flash',
//         callbacks,
//         config: {
//             responseModalities: [Modality.AUDIO],
//             speechConfig: {
//                 voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
//             },
//             systemInstruction: 'Eres un asistente amigable y conversacional para el restaurante Expendio. Responde de forma concisa y natural en español.',
//             outputAudioTranscription: {},
//             inputAudioTranscription: {},
//         },
//     });
//     return session;
// };