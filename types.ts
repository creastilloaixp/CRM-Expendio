export enum TableStatus {
  Libre = 'Libre',
  Ocupada = 'Ocupada',
  Reservada = 'Reservada',
  Limpiando = 'Limpiando'
}

export enum ReservationStatus {
  Confirmada = 'Confirmada',
  Completada = 'Completada',
  Cancelada = 'Cancelada'
}

export interface Mesa {
  id: string;
  nombre: string;
  capacidad: number;
  estado: TableStatus;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_nacimiento?: string;
  fecha_creacion: string;
  marketing_opt_in?: boolean;
}

export interface Visita {
  id: string;
  mesa_id: string;
  cliente_id: string;
  hora_llegada: string;
  hora_salida?: string | null;
  numero_personas: number;
  consumo_total?: number | null;
  mesa?: { nombre: string };
  cliente?: { nombre: string; email: string };
}

export interface Reserva {
  id: string;
  mesa_id: string;
  cliente_id: string;
  fecha_hora: string;
  numero_personas: number;
  estado: ReservationStatus;
  mesa?: { nombre: string };
  cliente?: { nombre: string; email: string };
}

export type NewReserva = {
    mesaId: string;
    nombreCliente: string;
    telefonoCliente: string;
    fechaReserva: string;
    cantidadPersonas: number;
}

export type Message = {
  role: 'user' | 'model';
  content: string;
};

// ========== NUEVOS TIPOS PARA PRODUCTOS, PEDIDOS Y NOTIFICACIONES ==========

export enum ProductCategoria {
  Cervezas = 'Cervezas',
  Hamburguesas = 'Hamburguesas',
  Tacos = 'Tacos',
  Alitas = 'Alitas',
  Bebidas = 'Bebidas',
  Postres = 'Postres',
  Entradas = 'Entradas'
}

export enum PedidoEstado {
  Pendiente = 'Pendiente',
  EnPreparacion = 'En Preparación',
  Listo = 'Listo',
  Entregado = 'Entregado',
  Cancelado = 'Cancelado'
}

export enum NotificacionTipo {
  LlamarMesero = 'Llamar Mesero',
  PedirCuenta = 'Pedir Cuenta',
  Urgente = 'Urgente'
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: ProductCategoria;
  imagen_url?: string;
  disponible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  visita_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado: PedidoEstado;
  notas?: string;
  created_at: string;
  updated_at: string;
  producto?: Producto;
}

export interface Notificacion {
  id: string;
  visita_id: string;
  mesa_id: string;
  tipo: NotificacionTipo;
  mensaje: string;
  leida: boolean;
  atendida: boolean;
  atendida_por?: string;
  created_at: string;
  updated_at: string;
  atendida_at?: string;
  mesa?: { nombre: string };
}

export type NewPedido = {
  visitaId: string;
  productoId: string;
  cantidad: number;
  notas?: string;
};

export type NewNotificacion = {
  visitaId: string;
  tipo: NotificacionTipo;
  mensaje?: string;
};