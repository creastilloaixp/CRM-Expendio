/**
 * Webhook para recibir mensajes de WhatsApp desde Meta Cloud API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const VERIFY_TOKEN = 'expendio_webhook_2024'; // Cambiar por token seguro

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificación del webhook (GET request de Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  // Recibir mensajes (POST request)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Verificar que es un mensaje de WhatsApp
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages) {
          const message = value.messages[0];
          const from = message.from; // Número del usuario
          const messageBody = message.text?.body; // Texto del mensaje
          const messageId = message.id;

          console.log(`📩 Mensaje recibido de ${from}: ${messageBody}`);

          // Procesar mensaje con el agente
          await processIncomingMessage(from, messageBody, messageId);
        }
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Procesar mensaje entrante y responder con el agente
 */
async function processIncomingMessage(from: string, message: string, messageId: string) {
  const messageLower = message.toLowerCase().trim();

  // Lógica del agente conversacional
  let responseMessage = '';

  // Respuesta a "sí" para reservación
  if (messageLower.includes('si') || messageLower.includes('sí')) {
    responseMessage = `¡Perfecto! 📅

Para hacer tu reservación, necesito algunos datos:

1. ¿Para cuántas personas?
2. ¿Qué día prefieres? (ej: Viernes 15 de Diciembre)
3. ¿A qué hora? (1PM - 2AM)

Responde con estos datos y te confirmo tu reservación. 😊`;
  }
  // Respuesta a datos de reservación (detectar números y fechas)
  else if (messageLower.match(/\d+\s*(persona|people|pax)/i)) {
    responseMessage = `Perfecto, estoy registrando tu reservación.

Un mesero te confirmará en breve por este chat.

Mientras tanto:
📸 Síguenos en Instagram: @expendio.mx
⭐ Déjanos tu reseña en Google
📍 Av. Paseo Claussen, Tres Ríos

¡Te esperamos! 🍻`;
  }
  // Respuesta a agradecimiento
  else if (messageLower.includes('gracias') || messageLower.includes('thanks')) {
    responseMessage = `¡De nada! Estamos para servirte 😊

Si necesitas algo más, escríbeme sin compromiso.

¡Salud! 🍺`;
  }
  // Respuesta default
  else {
    responseMessage = `¡Hola! 👋

Gracias por contactarnos.

¿En qué podemos ayudarte?
- Hacer una reservación
- Consultar el menú
- Información sobre eventos

Un mesero te atenderá pronto. 🍻`;
  }

  // Enviar respuesta automática
  await sendWhatsAppResponse(from, responseMessage);
}

/**
 * Enviar respuesta de WhatsApp
 */
async function sendWhatsAppResponse(to: string, message: string) {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error('Meta credentials not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send response');
    }

    console.log(`✅ Respuesta enviada a ${to}`);
  } catch (error: any) {
    console.error('Error sending response:', error);
  }
}
