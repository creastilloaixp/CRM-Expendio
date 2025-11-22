/**
 * Servicio de WhatsApp - Cliente
 * Llama a la API serverless de Twilio para enviar mensajes
 */

export interface WhatsAppMessage {
  to: string; // Número de teléfono con código de país (ej: +526673442996)
  message: string;
}

/**
 * Enviar mensaje de WhatsApp vía Twilio
 */
export const sendWhatsAppMessage = async (data: WhatsAppMessage): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> => {
  try {
    const response = await fetch('/api/whatsapp-send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result;
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Enviar mensaje de bienvenida cuando un cliente gana un premio
 */
export const sendPrizeWelcomeMessage = async (
  clientePhone: string,
  clienteNombre: string,
  prizeName: string,
  couponCode: string
): Promise<boolean> => {
  const message = `
¡Hola ${clienteNombre}! 🎉

¡Felicidades por ganar *${prizeName}* en Expendio Mx!

Tu código de cupón es: *${couponCode}*

📍 Ubicación: Av. Paseo Claussen, Tres Ríos, Culiacán
⏰ Horarios: Lun-Dom 1PM-2AM
📸 Síguenos: @expendio.mx

¿Te gustaría hacer una reservación para tu próxima visita? Responde "SÍ" y te ayudo a agendar.

¡Gracias por visitarnos! 🍻
`.trim();

  const result = await sendWhatsAppMessage({
    to: clientePhone,
    message,
  });

  return result.success;
};

/**
 * Enviar recordatorio de reservación
 */
export const sendReservationReminder = async (
  clientePhone: string,
  clienteNombre: string,
  fecha: string,
  mesa: string
): Promise<boolean> => {
  const message = `
¡Hola ${clienteNombre}! 👋

Te recordamos tu reservación en *Expendio Mx*:

📅 Fecha: ${fecha}
🪑 Mesa: ${mesa}
📍 Av. Paseo Claussen, Tres Ríos

¿Confirmas tu asistencia? Responde SÍ para confirmar.

¡Te esperamos! 🎊
`.trim();

  const result = await sendWhatsAppMessage({
    to: clientePhone,
    message,
  });

  return result.success;
};
