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
  telefono?: string;
  fecha_creacion: string;
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

export type NewVisita = {
  mesaNombre: string;
  clienteNombre: string;
  clienteEmail: string;
  numeroPersonas: number;
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
    clienteNombre: string;
    clienteEmail: string;
    fecha: string;
    hora: string;
    numeroPersonas: number;
}

export type Message = {
  role: 'user' | 'model';
  content: string;
};