/**
 * Servicio de Pagos con Stripe
 * Para producción: configurar webhook en Supabase Edge Functions
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe public key (safe to expose)
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

/**
 * Crear intento de pago (en producción esto va en el backend)
 * Por ahora simula la respuesta del servidor
 */
export const createPaymentIntent = async (
  amount: number,
  mesaId: string,
  visitaId: string,
  description: string
): Promise<{ data?: PaymentIntent; error?: string }> => {
  // En producción: llamar a Supabase Edge Function o tu backend
  // POST /api/create-payment-intent

  if (!STRIPE_PUBLIC_KEY) {
    return { error: 'Stripe no está configurado. Agrega VITE_STRIPE_PUBLIC_KEY en .env' };
  }

  try {
    // Simulación - En producción esto viene del backend
    console.log('💳 Creando PaymentIntent:', { amount, mesaId, visitaId, description });

    // TODO: Reemplazar con llamada real al backend
    // const response = await fetch('/api/create-payment-intent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount, mesaId, visitaId, description })
    // });
    // const data = await response.json();

    return {
      data: {
        clientSecret: 'pi_simulated_secret', // Viene del backend en producción
        amount,
        currency: 'mxn'
      }
    };
  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    return { error: 'Error al procesar el pago' };
  }
};

/**
 * Procesar pago con tarjeta
 */
export const processCardPayment = async (
  clientSecret: string,
  cardElement: any
): Promise<PaymentResult> => {
  const stripe = await getStripe();

  if (!stripe) {
    return { success: false, error: 'Stripe no está disponible' };
  }

  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (paymentIntent?.status === 'succeeded') {
      return { success: true, paymentId: paymentIntent.id };
    }

    return { success: false, error: 'El pago no se completó' };
  } catch (error) {
    console.error('Error procesando pago:', error);
    return { success: false, error: 'Error al procesar el pago' };
  }
};

/**
 * Registrar pago en efectivo
 */
export const registerCashPayment = async (
  visitaId: string,
  amount: number,
  cambio: number
): Promise<PaymentResult> => {
  console.log('💵 Pago en efectivo registrado:', { visitaId, amount, cambio });

  // Aquí podrías guardar en Supabase el registro del pago
  return {
    success: true,
    paymentId: `cash_${Date.now()}`
  };
};

/**
 * Métodos de pago disponibles
 */
export type PaymentMethod = 'card' | 'cash' | 'transfer';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'card', label: 'Tarjeta', icon: '💳' },
  { value: 'transfer', label: 'Transferencia', icon: '📱' }
];
