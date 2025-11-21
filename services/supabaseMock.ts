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

// Sistema de puntos y descuentos
interface ClientePuntos {
  clienteId: string;
  puntos: number;
  ultimaVisita: string;
  descuentoDisponible: number;
}

let clientesPuntos: ClientePuntos[] = [];

// Cargar sesión desde localStorage al iniciar
const cargarSesion = () => {
  console.log('📂 Cargando sesión desde localStorage...');
  const sesionGuardada = localStorage.getItem('crm_session');
  console.log('📄 Sesión guardada:', sesionGuardada);
  if (sesionGuardada) {
    try {
      const sesion = JSON.parse(sesionGuardada);
      console.log('📊 Sesión parseada:', sesion);
      if (sesion.expires > Date.now()) {
        currentSession = { clienteId: sesion.clienteId };
        console.log('✅ Sesión restaurada:', currentSession);
      } else {
        console.log('⏰ Sesión expirada, eliminando...');
        localStorage.removeItem('crm_session');
      }
    } catch (e) {
      console.error('Error al cargar sesión:', e);
    }
  } else {
    console.log('❌ No hay sesión guardada');
  }
};

// Guardar sesión en localStorage
const guardarSesion = (clienteId: string) => {
  const sesion = {
    clienteId,
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  };
  localStorage.setItem('crm_session', JSON.stringify(sesion));
};

// Inicializar sesión al cargar el módulo
console.log('🚀 SUPABASE MOCK MODULE LOADING...');
cargarSesion();

// Fix: Refactored all methods to use object method shorthand syntax (`methodName() {}`)
// instead of arrow functions (`methodName: () => {}`). This change ensures that the `this`
// keyword is correctly bound to the `supabaseMock` object itself, resolving an error
// in `markReservationAsArrived` where `this` was undefined.
export const supabaseMock = {
  // Staff login (Mock - accepts any non-empty password for development)
  async login(password: string): Promise<boolean> {
    await new Promise(res => setTimeout(res, 500));
    console.log('🔓 Mock login - Development mode: accepting any non-empty password');
    return password.length > 0;
  },
  
  // --- Customer Check-in Flow ---
  async getCurrentUser(): Promise<{ data: { user: any | null }, error: any | null }> {
    await new Promise(res => setTimeout(res, 300));
    console.log('🔍 Mock getCurrentUser called, currentSession:', currentSession);
    
    // If no current session, try to restore from localStorage
    if (!currentSession) {
      console.log('🔄 No current session, trying to restore from localStorage...');
      const sesionGuardada = localStorage.getItem('crm_session');
      if (sesionGuardada) {
        try {
          const sesion = JSON.parse(sesionGuardada);
          if (sesion.expires > Date.now()) {
            currentSession = { clienteId: sesion.clienteId };
            console.log('✅ Session restored from localStorage:', currentSession);
          } else {
            console.log('⏰ Session expired, removing from localStorage');
            localStorage.removeItem('crm_session');
          }
        } catch (e) {
          console.error('Error restoring session:', e);
        }
      }
    }
    
    if (currentSession) {
      const cliente = mockClientes.find(c => c.id === currentSession.clienteId);
      console.log('👤 Cliente encontrado:', cliente);
      if (cliente) {
        return {
          data: {
            user: {
              id: cliente.id,
              email: cliente.email,
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString()
            }
          },
          error: null
        };
      }
    }
    console.log('❌ Mock getCurrentUser: No session or cliente not found');
    return { data: { user: null }, error: { message: 'Auth session missing!' } };
  },

  async getClienteByEmail(email: string): Promise<{ data: { id: string, nombre: string, email: string, telefono: string } | null, error: any | null }> {
    await new Promise(res => setTimeout(res, 300));
    const cliente = mockClientes.find(c => c.email === email);
    if (cliente) {
      return {
        data: { 
          id: cliente.id, 
          nombre: cliente.nombre, 
          email: cliente.email, 
          telefono: cliente.telefono 
        },
        error: null
      };
    }
    return { data: null, error: { message: 'Cliente no encontrado' } };
  },

  async getClienteByTelefono(telefono: string): Promise<{ data: { id: string, nombre: string, email: string, telefono: string } | null, error: any | null }> {
    await new Promise(res => setTimeout(res, 300));
    const cliente = mockClientes.find(c => c.telefono === telefono);
    if (cliente) {
      return {
        data: { 
          id: cliente.id, 
          nombre: cliente.nombre, 
          email: cliente.email, 
          telefono: cliente.telefono 
        },
        error: null
      };
    }
    return { data: null, error: { message: 'Cliente no encontrado' } };
  },

  async startLoginWithOtp(data: { nombre: string, email: string, telefono: string, fechaNacimiento: string, marketingOptIn: boolean }): Promise<{ otp_id: string; message: string; otp_code?: string }> {
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
    return { 
      otp_id: pendingOtpId, 
      message: `Se ha enviado un código a ${telefono}.`,
      otp_code: MOCK_OTP_CODE // Incluir el código para desarrollo
    };
  },

  async verifyOtp(pendingOtpId: string, code: string): Promise<{ success: boolean; message: string }> {
    await new Promise(res => setTimeout(res, 1000));
    const otpData = pendingOtps[pendingOtpId];

    if (!otpData || otpData.expires < Date.now()) return { success: false, message: 'El código ha expirado o no es válido.' };
    if (otpData.code !== code) return { success: false, message: 'El código ingresado es incorrecto.' };

    const cliente = mockClientes.find(c => c.telefono === otpData.contact);
    if (cliente) {
        currentSession = { clienteId: cliente.id };
        guardarSesion(cliente.id); // Guardar sesión en localStorage
        delete pendingOtps[pendingOtpId];
        
        // Inicializar puntos del cliente si no existe
        if (!clientesPuntos.find(cp => cp.clienteId === cliente.id)) {
          clientesPuntos.push({
            clienteId: cliente.id,
            puntos: 0,
            ultimaVisita: new Date().toISOString(),
            descuentoDisponible: 0
          });
        }
        
        return { success: true, message: 'Verificación exitosa.' };
    }
    return { success: false, message: 'No se pudo encontrar la cuenta del cliente.' };
  },

  async startVisit(mesaNombre: string, numeroPersonas: number, clienteIdParam?: string): Promise<{ success: boolean; message: string; puntos?: number; descuento?: number; bienvenida?: string }> {
    await new Promise(res => setTimeout(res, 500));
    
    // Usar clienteId del parámetro o de la sesión actual
    const clienteIdToUse = clienteIdParam || currentSession?.clienteId;
    
    if (!clienteIdToUse) return { success: false, message: 'No hay un cliente especificado.' };
    
    const mesa = mockMesas.find(m => m.nombre === mesaNombre);
    if (!mesa) return { success: false, message: 'Mesa no encontrada.' };
    if (mesa.estado !== TableStatus.Libre && mesa.estado !== TableStatus.Reservada) return { success: false, message: 'La mesa no está disponible para check-in.' };

    const cliente = mockClientes.find(c => c.id === clienteIdToUse);
    if (!cliente) return { success: false, message: 'Cliente no encontrado.' };

    // Calcular puntos y descuentos
    let clientePuntos = clientesPuntos.find(cp => cp.clienteId === clienteIdToUse);
    if (!clientePuntos) {
      clientePuntos = {
        clienteId: clienteIdToUse,
        puntos: 0,
        ultimaVisita: new Date().toISOString(),
        descuentoDisponible: 0
      };
      clientesPuntos.push(clientePuntos);
    }

    // Acumular puntos (10 puntos por persona)
    const puntosGanados = numeroPersonas * 10;
    clientePuntos.puntos += puntosGanados;
    clientePuntos.ultimaVisita = new Date().toISOString();

    // Calcular descuento si tiene más de 100 puntos
    let descuentoAplicado = 0;
    let mensajeBienvenida = `¡Bienvenido ${cliente.nombre}!`;
    
    if (clientePuntos.puntos >= 100) {
      descuentoAplicado = Math.floor(clientePuntos.puntos / 100) * 50; // $50 pesos por cada 100 puntos
      clientePuntos.descuentoDisponible = descuentoAplicado;
      mensajeBienvenida += ` Tienes ${clientePuntos.puntos} puntos y un descuento de $${descuentoAplicado} pesos disponible.`;
    } else {
      mensajeBienvenida += ` Has ganado ${puntosGanados} puntos. Total: ${clientePuntos.puntos} puntos.`;
    }

    const newVisita: Visita = {
      id: `v${mockVisitas.length + 1}`,
      mesa_id: mesa.id,
      cliente_id: clienteIdToUse,
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
    
    return { 
      success: true, 
      message: '¡Check-in exitoso!', 
      puntos: clientePuntos.puntos, 
      descuento: descuentoAplicado,
      bienvenida: mensajeBienvenida
    };
  },

  // --- Staff-facing methods ---
  async getMesaByNombre(nombre: string): Promise<{ data: Mesa | null, error: any | null }> {
    await new Promise(res => setTimeout(res, 300));
    const mesa = mockMesas.find(m => m.nombre === nombre);
    if (mesa) {
      return { data: mesa, error: null };
    }
    return { data: null, error: { message: `La mesa "${nombre}" no existe.` } };
  },

  async getMesas(): Promise<{ data: Mesa[] | null, error: any | null }> {
    await new Promise(res => setTimeout(res, 300));
    return { data: mockMesas, error: null };
  },

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

    let cliente = mockClientes.find(c => c.email === data.nombreCliente); // Using nombreCliente as email for now
    if (!cliente) {
      cliente = {
        id: `c${mockClientes.length + 1}`,
        nombre: data.nombreCliente,
        email: data.nombreCliente, // Using nombreCliente as email for now
        telefono: data.telefonoCliente,
        fecha_creacion: new Date().toISOString(),
      };
      mockClientes.push(cliente);
    }

    const fechaHora = new Date(data.fechaReserva);

    const newReserva: Reserva = {
      id: `r${mockReservas.length + 1}`,
      mesa_id: mesa.id,
      cliente_id: cliente.id,
      fecha_hora: fechaHora.toISOString(),
      numero_personas: data.cantidadPersonas,
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
  },

  async logout(): Promise<void> {
    currentSession = null;
    localStorage.removeItem('crm_session');
  },

  async getClientePuntos(clienteId: string): Promise<ClientePuntos | null> {
    await new Promise(res => setTimeout(res, 200));
    return clientesPuntos.find(cp => cp.clienteId === clienteId) || null;
  },

  async addMockCliente(clienteData: { nombre: string; email: string; telefono: string; fecha_nacimiento: string; marketing_opt_in: boolean }): Promise<string> {
    await new Promise(res => setTimeout(res, 300));

    // Verificar si el cliente ya existe
    const clienteExistente = mockClientes.find(c => c.email === clienteData.email || c.telefono === clienteData.telefono);
    if (clienteExistente) {
      return clienteExistente.id;
    }

    // Crear nuevo cliente
    const nuevoCliente: Cliente = {
      id: `c${mockClientes.length + 1}`,
      nombre: clienteData.nombre,
      email: clienteData.email,
      telefono: clienteData.telefono,
      fecha_nacimiento: clienteData.fecha_nacimiento,
      marketing_opt_in: clienteData.marketing_opt_in,
      fecha_creacion: new Date().toISOString(),
    };

    mockClientes.push(nuevoCliente);
    console.log('✅ Cliente agregado al mock:', nuevoCliente);

    return nuevoCliente.id;
  },

  // ========== NUEVAS FUNCIONES STUB PARA PRODUCTOS, PEDIDOS Y NOTIFICACIONES ==========

  async getProductos(categoria?: string) {
    await new Promise(res => setTimeout(res, 300));
    console.log('📦 Mock: getProductos llamado (retornando array vacío - usar Supabase real)');
    return { data: [], error: null };
  },

  async getProductoById(productoId: string) {
    await new Promise(res => setTimeout(res, 200));
    console.log('📦 Mock: getProductoById llamado (retornando null - usar Supabase real)');
    return { data: null, error: null };
  },

  async crearPedido(data: any) {
    await new Promise(res => setTimeout(res, 500));
    console.log('🍔 Mock: crearPedido llamado (retornando success - usar Supabase real)');
    return { success: true, message: 'Pedido creado en mock' };
  },

  async obtenerPedidosVisita(visitaId: string) {
    await new Promise(res => setTimeout(res, 300));
    console.log('📋 Mock: obtenerPedidosVisita llamado (retornando array vacío - usar Supabase real)');
    return { data: [], error: null };
  },

  async calcularTotalPedidos(visitaId: string) {
    await new Promise(res => setTimeout(res, 200));
    console.log('💰 Mock: calcularTotalPedidos llamado (retornando 0 - usar Supabase real)');
    return 0;
  },

  async crearNotificacion(data: any) {
    await new Promise(res => setTimeout(res, 400));
    console.log('🔔 Mock: crearNotificacion llamado (retornando success - usar Supabase real)');
    return { success: true, message: 'Notificación creada en mock' };
  },

  async obtenerNotificacionesPendientes() {
    await new Promise(res => setTimeout(res, 300));
    console.log('📬 Mock: obtenerNotificacionesPendientes llamado (retornando array vacío - usar Supabase real)');
    return { data: [], error: null };
  },

  async marcarNotificacionAtendida(notificacionId: string, atendidaPor?: string) {
    await new Promise(res => setTimeout(res, 300));
    console.log('✅ Mock: marcarNotificacionAtendida llamado (retornando success - usar Supabase real)');
    return { success: true };
  },

  async getVisitaActivaByClienteId(clienteId: string) {
    await new Promise(res => setTimeout(res, 300));
    const visita = mockVisitas.find(v => v.cliente_id === clienteId && !v.hora_salida);
    if (visita) {
      const mesa = mockMesas.find(m => m.id === visita.mesa_id);
      return { ...visita, mesa: mesa ? { nombre: mesa.nombre } : undefined };
    }
    return null;
  },

  async createClientSession(email: string, telefono: string) {
    await new Promise(res => setTimeout(res, 200));
    console.log('🔑 Mock createClientSession called for:', { email, telefono });

    // Simulate creating a session
    const sessionData = {
      user: { email, telefono },
      access_token: `mock_token_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Store in localStorage (simulating Supabase session)
    localStorage.setItem('expendio_session', JSON.stringify(sessionData));

    return {
      data: {
        user: sessionData.user,
        session: sessionData
      },
      error: null
    };
  },

  async getClientes() {
    await new Promise(res => setTimeout(res, 300));
    console.log('👥 Mock: getClientes llamado');
    return {
      data: mockClientes.map(c => ({
        ...c,
        fecha_creacion: c.fecha_creacion || new Date().toISOString()
      })),
      error: null
    };
  },

  async getVisitasByClienteId(clienteId: string) {
    await new Promise(res => setTimeout(res, 300));
    console.log('📊 Mock: getVisitasByClienteId llamado para cliente:', clienteId);
    const visitas = mockVisitas
      .filter(v => v.cliente_id === clienteId)
      .map(v => {
        const mesa = mockMesas.find(m => m.id === v.mesa_id);
        const cliente = mockClientes.find(c => c.id === v.cliente_id);
        return {
          ...v,
          mesa: mesa ? { nombre: mesa.nombre } : undefined,
          cliente: cliente ? { nombre: cliente.nombre, email: cliente.email } : undefined
        };
      })
      .sort((a, b) => new Date(b.hora_llegada).getTime() - new Date(a.hora_llegada).getTime());

    return visitas;
  }
};

// Export helper functions
export const addMockCliente = supabaseMock.addMockCliente.bind(supabaseMock);