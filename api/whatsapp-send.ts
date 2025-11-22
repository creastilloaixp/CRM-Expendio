/**
 * Vercel Serverless Function para enviar mensajes de WhatsApp vía Twilio
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    // Importar Twilio dinámicamente
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    // Asegurar formato correcto del número
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/\D/g, '')}`;

    // Enviar mensaje
    const messageResponse = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    return res.status(200).json({
      success: true,
      messageSid: messageResponse.sid,
      status: messageResponse.status,
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message',
    });
  }
}
