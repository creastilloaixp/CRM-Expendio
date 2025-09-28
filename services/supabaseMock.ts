import type { Mesa, Cliente, Visita, NewVisita, Reserva, NewReserva } from '../types';
import { TableStatus, ReservationStatus } from '../types';

let mockMesas: Mesa[] = [
  { id: 'm1', nombre: 'F1', capacidad: 4, estado: TableStatus.Libre },
  { id: 'm2', nombre: 'F2', capacidad: 4, estado: TableStatus.Ocupada },
  { id: 'm3', nombre: 'F3', capacidad: 2, estado: TableStatus.Libre },
  { id: 'm4', nombre: 'G4', capacidad: 6, estado: TableStatus.Reservada },
  { id: 'm5', nombre: 'G5', capacidad: 6, estado: TableStatus.Libre },
  { id: 'm6', nombre: 'AC3', capacidad: 8, estado: TableStatus.Limpiando },
  { id: 'm7', nombre: 'B1', capacidad: 2, estado: TableStatus.Ocupada },
  { id: 'm8', nombre: 'B2', capacidad: 2, estado: TableStatus.Libre },
];

let mockClientes: Cliente[] = [
  { id: 'c1', nombre: 'Juan Pérez', email: 'juan.perez@email.com', fecha_creacion: new Date().toISOString() },
  { id: 'c2', nombre: 'Ana García', email: 'ana.garcia@email.com', fecha_creacion: new Date().toISOString() },
];

let mockVisitas: Visita[] = [
  { id: 'v1', mesa_id: 'm2', cliente_id: 'c1', hora_llegada: new Date(Date.now() - 3600 * 1000).toISOString(), numero_personas: 3 },
  { id: 'v2', mesa_id: 'm7', cliente_id: 'c2', hora_llegada: new Date(Date.now() - 1800 * 1000).toISOString(), numero_personas: 2 },
  { id: 'v3', mesa_id: 'm1', cliente_id: 'c1', hora_llegada: new Date(Date.now() - 86400 * 2 * 1000).toISOString(), hora_salida: new Date(Date.now() - 86400 * 2 * 1000 + 7200*1000).toISOString(), consumo_total: 850.50, numero_personas: 4 },
];

let mockReservas: Reserva[] = [
    { id: 'r1', mesa_id: 'm4', cliente_id: 'c2', fecha_hora: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), numero_personas: 5, estado: ReservationStatus.Confirmada },
];


type TableListener = (mesas: Mesa[]) => void;
let tableListener: TableListener | null = null;

type ReservationListener = (reservas: Reserva[]) => void;
let reservationListener: ReservationListener | null = null;

const notifyTableListener = () => {
  if (tableListener) {
    tableListener([...mockMesas]);
  }
};

const notifyReservationListener = () => {
  if (reservationListener) {
    const upcomingReservations = mockReservas
      .filter(r => r.estado === ReservationStatus.Confirmada && new Date(r.fecha_hora) > new Date())
      .map(r => {
          const mesa = mockMesas.find(m => m.id === r.mesa_id);
          const cliente = mockClientes.find(c => c.id === r.cliente_id);
          return { ...r, mesa, cliente };
      })
      .sort((a,b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
    reservationListener(upcomingReservations);
  }
};


const simulateRealtime = () => {
    setInterval(() => {
        const cleaningTables = mockMesas.filter(m => m.estado === TableStatus.Limpiando);
        if (cleaningTables.length > 0) {
            const tableToFree = cleaningTables[Math.floor(Math.random() * cleaningTables.length)];
            tableToFree.estado = TableStatus.Libre;
            notifyTableListener();
        }
    }, 5000);
};

// Start simulation
simulateRealtime();


export const supabaseMock = {
  login: async (password: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 500));
    return password === '1234';
  },

  getTables: async (): Promise<Mesa[]> => {
    await new Promise(res => setTimeout(res, 300));
    return [...mockMesas];
  },

  getActiveVisitaByMesaId: async (mesaId: string): Promise<Visita | null> => {
     await new Promise(res => setTimeout(res, 200));
     const visita = mockVisitas.find(v => v.mesa_id === mesaId && !v.hora_salida) || null;
     if (visita) {
       const cliente = mockClientes.find(c => c.id === visita.cliente_id);
       return {...visita, cliente: cliente ? {nombre: cliente.nombre, email: cliente.email} : undefined };
     }
     return null;
  },

  getActiveReservaByMesaId: async (mesaId: string): Promise<Reserva | null> => {
    await new Promise(res => setTimeout(res, 200));
    const reserva = mockReservas.find(r => r.mesa_id === mesaId && r.estado === ReservationStatus.Confirmada) || null;
    if(reserva) {
        const cliente = mockClientes.find(c => c.id === reserva.cliente_id);
        return {...reserva, cliente: cliente ? {nombre: cliente.nombre, email: cliente.email} : undefined };
    }
    return null;
  },

  subscribeToTableChanges: (callback: TableListener): (() => void) => {
    tableListener = callback;
    // initial call
    callback([...mockMesas]);
    return () => {
      tableListener = null;
    };
  },
  
  subscribeToAllReservations: (callback: ReservationListener): (() => void) => {
      reservationListener = callback;
      // initial call
      notifyReservationListener();
      return () => {
          reservationListener = null;
      };
  },

  handleCheckIn: async (data: NewVisita): Promise<{ success: boolean; message: string }> => {
    await new Promise(res => setTimeout(res, 1000));
    const mesa = mockMesas.find(m => m.nombre === data.mesaNombre);
    if (!mesa) return { success: false, message: 'Mesa no encontrada.' };
    if (mesa.estado !== TableStatus.Libre) return { success: false, message: 'La mesa no está disponible.' };

    let cliente = mockClientes.find(c => c.email === data.clienteEmail);
    if (!cliente) {
      cliente = {
        id: `c${mockClientes.length + 1}`,
        nombre: data.clienteNombre,
        email: data.clienteEmail,
        fecha_creacion: new Date().toISOString(),
      };
      mockClientes.push(cliente);
    }
    
    const newVisita: Visita = {
      id: `v${mockVisitas.length + 1}`,
      mesa_id: mesa.id,
      cliente_id: cliente.id,
      numero_personas: data.numeroPersonas,
      hora_llegada: new Date().toISOString(),
    };
    mockVisitas.push(newVisita);

    mesa.estado = TableStatus.Ocupada;
    notifyTableListener();
    return { success: true, message: '¡Check-in exitoso! Disfrute su estancia.' };
  },

  handleCreateReservation: async (data: NewReserva): Promise<{success: boolean}> => {
    await new Promise(res => setTimeout(res, 1000));
    const mesa = mockMesas.find(m => m.id === data.mesaId);
    if(!mesa || mesa.estado !== TableStatus.Libre) return {success: false};

    let cliente = mockClientes.find(c => c.email === data.clienteEmail);
    if (!cliente) {
      cliente = {
        id: `c${mockClientes.length + 1}`,
        nombre: data.clienteNombre,
        email: data.clienteEmail,
        fecha_creacion: new Date().toISOString(),
      };
      mockClientes.push(cliente);
    }

    const fechaHora = new Date(`${data.fecha}T${data.hora}`);

    const newReserva: Reserva = {
      id: `r${mockReservas.length + 1}`,
      mesa_id: mesa.id,
      cliente_id: cliente.id,
      fecha_hora: fechaHora.toISOString(),
      numero_personas: data.numeroPersonas,
      estado: ReservationStatus.Confirmada
    };
    mockReservas.push(newReserva);
    
    mesa.estado = TableStatus.Reservada;
    notifyTableListener();
    notifyReservationListener();

    return {success: true};
  },

  releaseTable: async (visitaId: string, consumo: number): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 700));
    const visita = mockVisitas.find(v => v.id === visitaId);
    if (!visita) return false;

    visita.hora_salida = new Date().toISOString();
    visita.consumo_total = consumo;

    const mesa = mockMesas.find(m => m.id === visita.mesa_id);
    if (mesa) {
      mesa.estado = TableStatus.Limpiando;
      notifyTableListener();
    }
    return true;
  },

  cancelReservation: async (reservaId: string): Promise<void> => {
    await new Promise(res => setTimeout(res, 500));
    const reserva = mockReservas.find(r => r.id === reservaId);
    if(reserva) {
        reserva.estado = ReservationStatus.Cancelada;
        const mesa = mockMesas.find(m => m.id === reserva.mesa_id);
        if(mesa && mesa.estado === TableStatus.Reservada) {
            mesa.estado = TableStatus.Libre;
            notifyTableListener();
        }
        notifyReservationListener();
    }
  },

  markReservationAsArrived: async (reservaId: string): Promise<void> => {
      await new Promise(res => setTimeout(res, 500));
      const reserva = mockReservas.find(r => r.id === reservaId);
      if(reserva && reserva.estado === ReservationStatus.Confirmada) {
          reserva.estado = ReservationStatus.Completada;
          const mesa = mockMesas.find(m => m.id === reserva.mesa_id);
          if (mesa) {
              mesa.estado = TableStatus.Ocupada;
              const newVisita: Visita = {
                id: `v${mockVisitas.length + 1}`,
                mesa_id: mesa.id,
                cliente_id: reserva.cliente_id,
                numero_personas: reserva.numero_personas,
                hora_llegada: new Date().toISOString(),
              };
              mockVisitas.push(newVisita);
              notifyTableListener();
          }
          notifyReservationListener();
      }
  },

  getVisitsByDateRange: async (start: Date, end: Date): Promise<Visita[]> => {
    await new Promise(res => setTimeout(res, 1200));
    return mockVisitas
      .filter(v => {
        const visitDate = new Date(v.hora_llegada);
        return visitDate >= start && visitDate <= end;
      })
      .map(v => {
        const mesa = mockMesas.find(m => m.id === v.mesa_id);
        const cliente = mockClientes.find(c => c.id === v.cliente_id);
        return {
          ...v,
          mesa: mesa ? { nombre: mesa.nombre } : undefined,
          cliente: cliente ? { nombre: cliente.nombre, email: cliente.email } : undefined,
        };
      })
      .sort((a, b) => new Date(b.hora_llegada).getTime() - new Date(a.hora_llegada).getTime());
  }
};