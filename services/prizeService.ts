/**
 * Servicio de Premios y Cupones
 * Gestiona la creación, validación y redención de cupones
 */

import { supabase } from './supabaseClient';

export type VIPLevel = 'bronce' | 'plata' | 'oro' | 'platino';

export interface Prize {
  id: string;
  name: string;
  icon: string;
  color: string;
  probability: number;
  value?: number; // Valor en pesos (para métricas)
}

export interface VIPPrize extends Prize {
  probabilityByLevel: {
    bronce: number;
    plata: number;
    oro: number;
    platino: number;
  };
}

export interface Coupon {
  id: string;
  code: string;
  prize_id: string;
  prize_name: string;
  cliente_id: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  created_at: string;
  expires_at: string;
  redeemed_at?: string;
  status: 'active' | 'redeemed' | 'expired';
}

// Premios con probabilidades por nivel VIP
export const VIP_PRIZES: VIPPrize[] = [
  {
    id: 'bebida',
    name: 'Bebida Gratis',
    icon: '🍺',
    color: '#FF6B6B',
    probability: 10,
    value: 50,
    probabilityByLevel: { bronce: 8, plata: 12, oro: 15, platino: 20 }
  },
  {
    id: 'postre',
    name: 'Postre Cortesía',
    icon: '🍰',
    color: '#4ECDC4',
    probability: 10,
    value: 45,
    probabilityByLevel: { bronce: 8, plata: 12, oro: 14, platino: 18 }
  },
  {
    id: 'descuento10',
    name: '10% Descuento',
    icon: '💰',
    color: '#45B7D1',
    probability: 15,
    value: 30,
    probabilityByLevel: { bronce: 12, plata: 16, oro: 18, platino: 20 }
  },
  {
    id: '2x1',
    name: '2x1 Próxima Visita',
    icon: '🎁',
    color: '#96CEB4',
    probability: 10,
    value: 100,
    probabilityByLevel: { bronce: 6, plata: 10, oro: 14, platino: 18 }
  },
  {
    id: 'puntos',
    name: '20 Puntos Extra',
    icon: '⭐',
    color: '#FFEAA7',
    probability: 20,
    value: 10,
    probabilityByLevel: { bronce: 25, plata: 22, oro: 18, platino: 12 }
  },
  {
    id: 'shot',
    name: 'Shot Sorpresa',
    icon: '🎉',
    color: '#DDA0DD',
    probability: 10,
    value: 35,
    probabilityByLevel: { bronce: 8, plata: 10, oro: 13, platino: 16 }
  },
  {
    id: 'suerte',
    name: '¡Próxima satisfacción!',
    icon: '🍀',
    color: '#95A5A6',
    probability: 25,
    value: 0,
    probabilityByLevel: { bronce: 33, plata: 18, oro: 8, platino: 1 }
  }
];

// Premios básicos (para compatibilidad)
export const PRIZES: Prize[] = VIP_PRIZES.map(p => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  color: p.color,
  probability: p.probability,
  value: p.value
}));

// Configuración del negocio (para WhatsApp)
export const BUSINESS_CONFIG = {
  whatsapp: '526673442996', // Número de WhatsApp del negocio (México)
  instagram: 'expendio.mx',
  googleMapsUrl: 'https://www.google.com/maps/place/Expendio+Mx/@24.8202106,-107.4030162,17z/data=!3m1!4b1!4m6!3m5!1s0x86bcdb6a4d70131d:0x52b39d898a08c9b9!8m2!3d24.8202106!4d-107.4004413!16s%2Fg%2F11zhx5fj0s?entry=ttu&g_ep=EgoyMDI1MTExNy4wIKXMDSoASAFQAw%3D%3D',
  address: 'Av. Paseo Claussen, Desarrollo Urbano Tres Ríos, Culiacán, Sinaloa',
};

/**
 * Obtener información del nivel VIP
 */
export const VIP_INFO = {
  bronce: {
    name: 'Bronce',
    icon: '🥉',
    color: '#CD7F32',
    minVisits: 0,
    minSpent: 0,
    description: 'Cliente nuevo'
  },
  plata: {
    name: 'Plata',
    icon: '🥈',
    color: '#C0C0C0',
    minVisits: 10,
    minSpent: 2000,
    description: 'Cliente frecuente'
  },
  oro: {
    name: 'Oro',
    icon: '🥇',
    color: '#FFD700',
    minVisits: 20,
    minSpent: 5000,
    description: 'Cliente VIP'
  },
  platino: {
    name: 'Platino',
    icon: '💎',
    color: '#E5E4E2',
    minVisits: 50,
    minSpent: 10000,
    description: 'Cliente Elite'
  }
};

/**
 * Obtener premios ajustados por nivel VIP
 */
export const getPrizesByVIPLevel = (vipLevel: VIPLevel = 'bronce'): Prize[] => {
  return VIP_PRIZES.map(prize => ({
    ...prize,
    probability: prize.probabilityByLevel[vipLevel]
  }));
};

/**
 * Generar código único de cupón
 */
export const generateCouponCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = 'EXP';
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Crear cupón para un cliente
 */
export const createCoupon = async (
  prize: Prize,
  clienteId: string,
  clienteNombre?: string,
  clienteTelefono?: string
): Promise<{ data?: Coupon; error?: string }> => {
  const code = generateCouponCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expira en 30 días

  const couponData = {
    code,
    prize_id: prize.id,
    prize_name: prize.name,
    prize_icon: prize.icon,
    prize_value: prize.value || 0,
    cliente_id: clienteId,
    cliente_nombre: clienteNombre,
    cliente_telefono: clienteTelefono,
    expires_at: expiresAt.toISOString(),
    status: 'active'
  };

  try {
    const { data, error } = await supabase
      .from('cupones')
      .insert(couponData)
      .select()
      .single();

    if (error) {
      console.error('Error Supabase creando cupón:', error);
      // Retornar cupón simulado si Supabase falla
      // Esto permite que la app funcione aunque la BD esté caída
      return {
        data: {
          id: `temp_${Date.now()}`,
          code,
          prize_id: prize.id,
          prize_name: prize.name,
          prize_icon: prize.icon,
          cliente_id: clienteId,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          redeemed_at: undefined,
          status: 'active' as const
        }
      };
    }

    return { data };
  } catch (err: any) {
    console.error('Excepción creando cupón:', err);
    // Retornar cupón simulado en caso de excepción
    return {
      data: {
        id: `temp_${Date.now()}`,
        code,
        prize_id: prize.id,
        prize_name: prize.name,
        prize_icon: prize.icon,
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        redeemed_at: undefined,
        status: 'active' as const
      }
    };
  }
};

/**
 * Validar cupón por código
 */
export const validateCoupon = async (code: string): Promise<{ data?: Coupon; error?: string }> => {
  const { data, error } = await supabase
    .from('cupones')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    return { error: 'Cupón no encontrado' };
  }

  if (data.status === 'redeemed') {
    return { error: 'Este cupón ya fue canjeado' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { error: 'Este cupón ha expirado' };
  }

  return { data };
};

/**
 * Canjear cupón
 */
export const redeemCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase
    .from('cupones')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString()
    })
    .eq('code', code.toUpperCase())
    .eq('status', 'active')
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: 'No se pudo canjear el cupón' };
  }

  return { success: true };
};

/**
 * Generar mensaje de WhatsApp para reclamar premio
 */
export const generateWhatsAppMessage = (coupon: Coupon, prize: Prize): string => {
  const message = `🎉 ¡Hola! Quiero reclamar mi premio de Expendio!

📋 *Código de cupón:* ${coupon.code}
🎁 *Premio:* ${prize.icon} ${prize.name}
👤 *Nombre:* ${coupon.cliente_nombre || 'Cliente'}

¡Gracias por la experiencia! 🙌`;

  return encodeURIComponent(message);
};

/**
 * Generar URL de WhatsApp
 */
export const getWhatsAppUrl = (coupon: Coupon, prize: Prize): string => {
  const message = generateWhatsAppMessage(coupon, prize);
  return `https://wa.me/${BUSINESS_CONFIG.whatsapp}?text=${message}`;
};

/**
 * Obtener estadísticas de cupones (para métricas CAC)
 */
export const getCouponStats = async (): Promise<{
  total: number;
  redeemed: number;
  redemptionRate: number;
  totalValue: number;
  avgValuePerCoupon: number;
}> => {
  const { data, error } = await supabase
    .from('cupones')
    .select('status, prize_value');

  if (error || !data) {
    return { total: 0, redeemed: 0, redemptionRate: 0, totalValue: 0, avgValuePerCoupon: 0 };
  }

  const total = data.length;
  const redeemed = data.filter(c => c.status === 'redeemed').length;
  const totalValue = data.filter(c => c.status === 'redeemed').reduce((sum, c) => sum + (c.prize_value || 0), 0);

  return {
    total,
    redeemed,
    redemptionRate: total > 0 ? (redeemed / total) * 100 : 0,
    totalValue,
    avgValuePerCoupon: redeemed > 0 ? totalValue / redeemed : 0
  };
};
