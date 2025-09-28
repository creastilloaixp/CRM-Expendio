import type { Visita } from '../types';

let ai: any | null = null;

// Make the function async to handle the dynamic import
const getAiClient = async (): Promise<any> => {
    if (!ai) {
        try {
            // Dynamically import the module.
            // This moves the network request from app load time to the first-use time.
            const { GoogleGenAI } = await import('@google/genai');
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to load @google/genai module", e);
            throw new Error("Could not load the AI service.");
        }
    }
    return ai;
};


const formatVisitsForAI = (visits: Visita[]): string => {
  const simplifiedVisits = visits.map(v => ({
    llegada: v.hora_llegada,
    salida: v.hora_salida,
    personas: v.numero_personas,
    consumo: v.consumo_total,
    cliente: v.cliente?.nombre,
  }));
  return JSON.stringify(simplifiedVisits, null, 2);
};

export const getInsights = async (visits: Visita[], question: string): Promise<string> => {
  const model = 'gemini-2.5-flash';

  const systemInstruction = `Eres un analista de datos experto para un restaurante llamado 'Expendio Cervecería Popular'. Tu tarea es analizar los datos de visitas de clientes y responder preguntas en español de forma clara, concisa y amigable.
  - Utiliza los datos proporcionados en formato JSON.
  - Proporciona insights accionables para el negocio cuando sea posible.
  - Formatea tus respuestas usando markdown simple (negritas con **, listas con -) para una mejor legibilidad.
  - No menciones que eres un modelo de IA. Actúa como un asistente analista.
  - Sé breve y directo en tus respuestas.`;
  
  const dataContext = formatVisitsForAI(visits);

  const prompt = `Aquí están los datos de las visitas:
${dataContext}

Por favor, responde la siguiente pregunta: "${question}"`;

  try {
    const geminiClient = await getAiClient();
    const response = await geminiClient.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
          systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes("Could not load the AI service")) {
        return "Lo siento, no pude conectar con el servicio de IA. Por favor, recarga la página e inténtalo de nuevo.";
    }
    return "Lo siento, tuve un problema al analizar los datos. Por favor, inténtalo de nuevo.";
  }
};
