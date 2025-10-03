import type { Mesa, Cliente, Visita, Reserva, NewReserva } from '../types';
import { TableStatus, ReservationStatus } from '../types';

// Helper to generate tables programmatically
const generateTables = (): Mesa[] => {
    const tables: Mesa[] = [];
    let idCounter = 1;

    const tableGroups: { [key: string]: { count: number; capacity: number } } = {
        'A': { count: 5, capacity: 4 },
        'B': { count: 5, capacity: 4 },
        'C': { count: 5, capacity: 2 },
        'D': { count: 5, capacity: 4 },
        'E': { count: 4, capacity: 2 },
        'F': { count: 5, capacity: 4 },
        'G': { count: 6, capacity: 6 },
    };

    for (const prefix in tableGroups) {
        for (let i = 1; i <= tableGroups[prefix].count; i++) {
            tables.push({
                id: `m${idCounter++}`,
                nombre: `${prefix}${i}`,
                capacidad: tableGroups[prefix].capacity,
                estado: TableStatus.Libre,
            });
        }
    }

    for (let i = 1; i <= 3; i++) {
        tables.push({
            id: `m${idCounter++}`,
            nombre: `Terraza ${i}`,
            capacidad: 2,
            estado: TableStatus.Libre,
        });
    }
    
    // Set some initial states for a more realistic demo
    const findAndSet = (nombre: string, estado: TableStatus) => {
        const mesa = tables.find(m => m.nombre === nombre);
        if (mesa) mesa.estado = estado;
    };

    findAndSet('B2', TableStatus.Ocupada);
    findAndSet('F3', TableStatus.Ocupada);
    findAndSet('G1', TableStatus.Reservada);
    findAndSet('A5', TableStatus.Limpiando);
    findAndSet('Terraza 2', TableStatus.Ocupada);

    return tables;
};

let mockMesas: Mesa[] = generateTables();

let mockClientes: Cliente[] = [
  { id: 'c1', nombre: 'Juan Pérez', email: 'juan.perez@email.com', telefono: '5512345678', fecha_nacimiento: '1990-05-15', fecha_creacion: new Date().toISOString(), marketing_opt_in: true },
  { id: 'c2', nombre: 'Ana García', email: 'ana.garcia@email.com', telefono: '5587654321', fecha_nacimiento: '1995-10-20', fecha_creacion: new Date().toISOString(), marketing_opt_in: false },
];

// Helper to find table ID by name for consistent data mapping
const getMesaId = (nombre: string): string => {
    const mesa = mockMesas.find(m => m.nombre === nombre);
    return mesa ? mesa.id : 'm-not-found';
};


let mockVisitas: Visita[] = [
  { id: 'v1', mesa_id: getMesaId('B2'), cliente_id: 'c1', hora_llegada: new Date(Date.now() - 3600 * 1000).toISOString(), numero_personas: 3 },
  { id: 'v2', mesa_id: getMesaId('F3'), cliente_id: 'c2', hora_llegada: new Date(Date.now() - 1800 * 1000).toISOString(), numero_personas: 2 },
  { id: 'v3', mesa_id: getMesaId('A1'), cliente_id: 'c1', hora_llegada: new Date(Date.now() - 86400 * 2 * 1000).toISOString(), hora_salida: new Date(Date.now() - 86400 * 2 * 1000 + 7200*1000).toISOString(), consumo_total: 850.50, numero_personas: 4 },
  { id: 'v4', mesa_id: getMesaId('Terraza 2'), cliente_id: 'c1', hora_llegada: new Date(Date.now() - 900 * 1000).toISOString(), numero_personas: 2 },
];

let mockReservas: Reserva[] = [
    { id: 'r1', mesa_id: getMesaId('G1'), cliente_id: 'c2', fecha_hora: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), numero_personas: 5, estado: ReservationStatus.Confirmada },
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

// --- Customer Auth & Session Simulation ---
let currentSession: { clienteId: string } | null = null;
let pendingOtps: { [key: string]: { contact: string; code: string; expires: number } } = {};
const MOCK_OTP_CODE = '123456';

// Fix: Refactored all methods to use object method shorthand syntax (`methodName() {}`)
// instead of arrow functions (`methodName: () => {}`). This change ensures that the `this`
// keyword is correctly bound to the `supabaseMock` object itself, resolving an error
// in `markReservationAsArrived` where `this` was undefined.
export const supabaseMock = {
  // Staff login
  async login(password: string): Promise<boolean> {
    await new Promise(res => setTimeout(res, 500));
    return password === '1234';
  },
  
  // --- Customer Check-in Flow ---
  async getCurrentUser(): Promise<Cliente | null> {
    await new Promise(res => setTimeout(res, 300));
    if (currentSession) {
      return mockClientes.find(c => c.id === currentSession.clienteId) || null;
    }
    return null;
  },

  async startLoginWithOtp(data: { nombre: string, email: string, telefono: string, fechaNacimiento: string, marketingOptIn: boolean }): Promise<{ success: boolean; pendingOtpId?: string; message: string }> {
    await new Promise(res => setTimeout(res, 700));
    const { nombre, email, telefono, fechaNacimiento, marketingOptIn } = data;
    
    let cliente = mockClientes.find(c => c.email === email || c.telefono === telefono);
    if (!cliente) {
        cliente = {
            id: `c${mockClientes.length + 1}`,
            nombre,
            email,
            telefono,
            fecha_nacimiento: fechaNacimiento,
            fecha_creacion: new Date().toISOString(),
            marketing_opt_in: marketingOptIn,
        };
        mockClientes.push(cliente);
    } else {
        if (!cliente.nombre) cliente.nombre = nombre;
        cliente.fecha_nacimiento = fechaNacimiento;
        cliente.marketing_opt_in = marketingOptIn;
    }

    const pendingOtpId = `otp_${Date.now()}`;
    pendingOtps[pendingOtpId] = { contact: telefono, code: MOCK_OTP_CODE, expires: Date.now() + 5 * 60 * 1000 };

    console.log(`Mock OTP para ${telefono}: ${MOCK_OTP_CODE}`);
    return { success: true, pendingOtpId, message: `Se ha enviado un código a ${telefono}.` };
  },

  async verifyOtp(pendingOtpId: string, code: string): Promise<{ success: boolean; message: string }> {
    await new Promise(res => setTimeout(res, 1000));
    const otpData = pendingOtps[pendingOtpId];

    if (!otpData || otpData.expires < Date.now()) return { success: false, message: 'El código ha expirado o no es válido.' };
    if (otpData.code !== code) return { success: false, message: 'El código ingresado es incorrecto.' };

    const cliente = mockClientes.find(c => c.telefono === otpData.contact);
    if (cliente) {
        currentSession = { clienteId: cliente.id };
        delete pendingOtps[pendingOtpId];
        return { success: true, message: 'Verificación exitosa.' };
    }
    return { success: false, message: 'No se pudo encontrar la cuenta del cliente.' };
  },

  async startVisit(mesaNombre: string, numeroPersonas: number): Promise<{ success: boolean; message: string }> {
    await new Promise(res => setTimeout(res, 500));
    if (!currentSession) return { success: false, message: 'No hay una sesión de cliente activa.' };
    
    const mesa = mockMesas.find(m => m.nombre === mesaNombre);
    if (!mesa) return { success: false, message: 'Mesa no encontrada.' };
    if (mesa.estado !== TableStatus.Libre && mesa.estado !== TableStatus.Reservada) return { success: false, message: 'La mesa no está disponible para check-in.' };

    const newVisita: Visita = {
      id: `v${mockVisitas.length + 1}`,
      mesa_id: mesa.id,
      cliente_id: currentSession.clienteId,
      numero_personas: numeroPersonas,
      hora_llegada: new Date().toISOString(),
    };
    mockVisitas.push(newVisita);

    if(mesa.estado === TableStatus.Reservada) {
        const reserva = mockReservas.find(r => r.mesa_id === mesa.id && r.estado === ReservationStatus.Confirmada);
        if (reserva) reserva.estado = ReservationStatus.Completada;
    }
    
    mesa.estado = TableStatus.Ocupada;
    notifyTableListener();
    notifyReservationListener();
    return { success: true, message: '¡Check-in exitoso!' };
  },

  // --- Staff-facing methods ---
  async getTables(): Promise<Mesa[]> {
    await new Promise(res => setTimeout(res, 300));
    return [...mockMesas];
  },

  async getActiveVisitaByMesaId(mesaId: string): Promise<Visita | null> {
     await new Promise(res => setTimeout(res, 200));
     const visita = mockVisitas.find(v => v.mesa_id === mesaId && !v.hora_salida) || null;
     if (visita) {
       const cliente = mockClientes.find(c => c.id === visita.cliente_id);
       return {...visita, cliente: cliente ? {nombre: cliente.nombre, email: cliente.email} : undefined };
     }
     return null;
  },

  async getActiveReservaByMesaId(mesaId: string): Promise<Reserva | null> {
    await new Promise(res => setTimeout(res, 200));
    const reserva = mockReservas.find(r => r.mesa_id === mesaId && r.estado === ReservationStatus.Confirmada) || null;
    if(reserva) {
        const cliente = mockClientes.find(c => c.id === reserva.cliente_id);
        return {...reserva, cliente: cliente ? {nombre: cliente.nombre, email: cliente.email} : undefined };
    }
    return null;
  },

  subscribeToTableChanges(callback: TableListener): (() => void) {
    tableListener = callback;
    callback([...mockMesas]);
    return () => { tableListener = null; };
  },
  
  subscribeToAllReservations(callback: ReservationListener): (() => void) {
      reservationListener = callback;
      notifyReservationListener();
      return () => { reservationListener = null; };
  },

  async handleCreateReservation(data: NewReserva): Promise<{success: boolean}> {
    await new Promise(res => setTimeout(res, 1000));
    const mesa = mockMesas.find(m => m.id === data.mesaId);
    if(!mesa || mesa.estado !== TableStatus.Libre) return {success: false};

    let cliente = mockClientes.find(c => c.email === data.clienteEmail);
    if (!cliente) {
      cliente = {
        id: `c${mockClientes.length + 1}`,
        nombre: data.clienteNombre,
        email: data.clienteEmail,
        telefono: 'N/A', // Staff doesn't need to provide phone for reservations
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

  async releaseTable(visitaId: string, consumo: number): Promise<boolean> {
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

  async cancelReservation(reservaId: string): Promise<void> {
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

  async markReservationAsArrived(reservaId: string): Promise<void> {
      await new Promise(res => setTimeout(res, 500));
      const reserva = mockReservas.find(r => r.id === reservaId);
      if(reserva && reserva.estado === ReservationStatus.Confirmada) {
          const mesa = mockMesas.find(m => m.id === reserva.mesa_id);
          if (mesa) {
              this.startVisit(mesa.nombre, reserva.numero_personas);
          }
      }
  },

  async getVisitsByDateRange(start: Date, end: Date): Promise<Visita[]> {
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