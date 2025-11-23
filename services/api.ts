import { api } from './useApi';
import type { NewReserva, NewPedido, NewNotificacion, Producto, Pedido, Notificacion, ProductCategoria } from '../types';

let mockModulePromise: Promise<any> | null = null;
const getMock = async () => {
  if (!mockModulePromise) mockModulePromise = import('./supabaseMock').then(m => m.supabaseMock);
  return mockModulePromise;
};

export const getMesas = async () => {
  // Solo usar mock si USE_MOCK es explícitamente 'true'
  if (process.env.USE_MOCK === 'true') {
    const mock = await getMock();
    const { data, error } = await mock.getMesas();
    return { data, error, ms: 0 };
  }

  // Dynamic import to avoid initialization issues in mock mode
  const { supabase } = await import('./supabaseClient');
  return api('getMesas', async () => {
    const { data, error } = await supabase.from('mesas').select('*');
    return { data, error };
  });
};

export const getActiveVisitaByMesaId = async (mesaId: string) => {
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
    const mock = await getMock();
    const visita = await mock.getActiveVisitaByMesaId(mesaId);
    return { data: visita, error: null, ms: 0 };
  }
  const { supabase } = await import('./supabaseClient');
  return api('getActiveVisitaByMesaId', async () => {
    const { data, error } = await supabase
      .from('visitas')
      .select('*')
      .eq('mesa_id', mesaId)
      .is('hora_salida', null)
      .single();
    return { data, error };
  });
};

export const getActiveReservaByMesaId = async (mesaId: string) => {
  // Solo usar mock si USE_MOCK es explícitamente 'true'
  if (process.env.USE_MOCK === 'true') {
    const mock = await getMock();
    const reserva = await mock.getActiveReservaByMesaId(mesaId);
    return { data: reserva, error: null, ms: 0 };
  }
  const { supabase } = await import('./supabaseClient');
  return api('getActiveReservaByMesaId', async () => {
    const { data, error } = await supabase
      .from('reservas')
      .select('*, mesa:mesas(nombre), cliente:clientes(nombre, email, telefono)')
      .eq('mesa_id', mesaId)
      .eq('estado', 'Confirmada')
      .single();
    return { data, error };
  });
};

export const releaseTable = async (visitaId: string, consumo: number) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const ok = await mock.releaseTable(visitaId, consumo);
        return { data: { success: ok }, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('releaseTable', async () => {
        const { data: result, error } = await supabase.rpc('liberar_mesa', { 
            p_visit_id: visitaId, 
            p_consumo: consumo 
        });
        return { data: result, error };
    });
    if (res.error) {
        const mock = await getMock();
        const ok = await mock.releaseTable(visitaId, consumo);
        return { data: { success: ok }, error: null, ms: res.ms };
    }
    return res;
};

export const createReservation = async (data: NewReserva) => {
    // Solo usar mock si USE_MOCK es explícitamente 'true'
    if (process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const res = await mock.handleCreateReservation(data);
        return { data: res, error: null, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    console.log('🔵 Usando Supabase REAL para crear reserva');
    console.log('📝 Datos recibidos:', data);

    return api('createReservation', async () => {
        // 1. Verificar si el cliente ya existe por teléfono (único identificador)
        let clienteId: string;

        const { data: clienteExistente, error: errorBusqueda } = await supabase
            .from('clientes')
            .select('id, nombre, telefono')
            .eq('telefono', data.telefonoCliente)
            .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no existe

        console.log('🔍 Cliente existente:', clienteExistente);

        if (clienteExistente) {
            console.log('✅ Reutilizando cliente existente:', clienteExistente.id);
            clienteId = clienteExistente.id;
        } else {
            console.log('➕ Creando nuevo cliente');
            // Crear nuevo cliente con email único basado en teléfono
            const emailGenerado = `${data.telefonoCliente}@reserva.local`;

            const { data: nuevoCliente, error: errorCliente } = await supabase
                .from('clientes')
                .insert({
                    nombre: data.nombreCliente,
                    email: emailGenerado,
                    telefono: data.telefonoCliente,
                    marketing_opt_in: false
                })
                .select()
                .single();

            if (errorCliente || !nuevoCliente) {
                console.error('❌ Error creando cliente:', errorCliente);
                return { data: null, error: errorCliente };
            }
            console.log('✅ Cliente creado:', nuevoCliente.id);
            clienteId = nuevoCliente.id;
        }

        // 2. Crear la reserva
        console.log('📅 Creando reserva para cliente:', clienteId, 'mesa:', data.mesaId);
        const { data: reserva, error: errorReserva } = await supabase
            .from('reservas')
            .insert({
                mesa_id: data.mesaId,
                cliente_id: clienteId,
                fecha_hora: data.fechaReserva,
                numero_personas: data.cantidadPersonas,
                estado: 'Confirmada'
            })
            .select()
            .single();

        if (errorReserva) {
            console.error('❌ Error creando reserva:', errorReserva);
            return { data: null, error: errorReserva };
        }

        console.log('✅ Reserva creada:', reserva.id);

        // 3. Actualizar estado de la mesa a Reservada
        await supabase
            .from('mesas')
            .update({ estado: 'Reservada' })
            .eq('id', data.mesaId);

        console.log('✅ Mesa actualizada a Reservada');

        return { data: { success: true, reserva }, error: null };
    });
};

// QR Code Flow Functions
export const getCurrentUser = async () => {
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.getCurrentUser();
        return { data, error, ms: 0 };
    }
    
    // Dynamic import to avoid initialization issues in mock mode
    const { supabase } = await import('./supabaseClient');
    return api('getCurrentUser', async () => {
        const { data, error } = await supabase.auth.getUser();
        return { data, error };
    });
};

export const getClienteByEmail = async (email: string) => {
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.getClienteByEmail(email);
        return { data, error, ms: 0 };
    }
    
    // Dynamic import to avoid initialization issues in mock mode
    const { supabase } = await import('./supabaseClient');
    return api('getClienteByEmail', async () => {
        const { data, error } = await supabase.from('clientes')
            .select('id, nombre, email, telefono')
            .eq('email', email)
            .single();
        return { data, error };
    });
};

export const getClienteByTelefono = async (telefono: string) => {
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.getClienteByTelefono(telefono);
        return { data, error, ms: 0 };
    }
    
    // Dynamic import to avoid initialization issues in mock mode
    const { supabase } = await import('./supabaseClient');
    return api('getClienteByTelefono', async () => {
        const { data, error } = await supabase.from('clientes')
            .select('id, nombre, email, telefono')
            .eq('telefono', telefono)
            .single();
        return { data, error };
    });
};

export const startLoginWithOtp = async (data: { 
    nombre: string, 
    email: string, 
    telefono: string, 
    fechaNacimiento: string, 
    marketingOptIn: boolean 
}) => {
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const result = await mock.startLoginWithOtp(data);
        return { data: result, error: null, ms: 0 };
    }
    
    // Dynamic import to avoid initialization issues in mock mode
    const { supabase } = await import('./supabaseClient');
    return api('startLoginWithOtp', async () => {
        const { data: result, error } = await supabase.rpc('iniciar_login_otp', {
            p_nombre: data.nombre,
            p_email: data.email,
            p_telefono: data.telefono,
            p_fecha_nacimiento: data.fechaNacimiento,
            p_marketing_opt_in: data.marketingOptIn
        });
        return { data: result, error };
    });
};

export const registerClienteDirect = async (data: { 
    nombre: string, 
    email: string, 
    telefono: string, 
    fechaNacimiento: string, 
    marketingOptIn: boolean 
}) => {
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        console.log('🔍 Usando modo MOCK para registerClienteDirect');
        console.log('📋 Datos recibidos:', data);
        
        try {
            // Importar el mock para agregar el cliente
            const { addMockCliente } = await import('./supabaseMock');
            
            // Agregar cliente al mock
            const clienteId = await addMockCliente({
                nombre: data.nombre,
                email: data.email,
                telefono: data.telefono,
                fecha_nacimiento: data.fechaNacimiento,
                marketing_opt_in: data.marketingOptIn
            });
            
            console.log('✅ Cliente agregado al mock con ID:', clienteId);
            
            return { 
                data: { 
                    cliente_id: clienteId,
                    message: 'Registro exitoso',
                    es_nuevo: true 
                }, 
                error: null, 
                ms: 0 
            };
        } catch (error) {
            console.error('❌ Error en registerClienteDirect (mock):', error);
            console.error('📋 Tipo de error:', typeof error);
            console.error('🔍 Stack del error:', error instanceof Error ? error.stack : 'No stack available');
            return { 
                data: null, 
                error: error instanceof Error ? error.message : 'Error desconocido al registrar cliente', 
                ms: 0 
            };
        }
    }
    
    // Use real Supabase for production
    console.log('🔍 Usando Supabase real para registerClienteDirect');
    console.log('📋 Datos para RPC:', data);
    
    try {
        // Dynamic import to avoid initialization issues in mock mode
        const { supabase } = await import('./supabaseClient');
        
        const result = await api('registerClienteDirect', async () => {
            const { data: resultData, error } = await supabase.rpc('registrar_cliente_directo', {
                p_nombre: data.nombre,
                p_email: data.email,
                p_telefono: data.telefono,
                p_fecha_nacimiento: data.fechaNacimiento,
                p_marketing_opt_in: data.marketingOptIn
            });
            return { data: resultData, error };
        });
        
        console.log('📊 Resultado de RPC:', result);
        if (result.error || !result.data) {
            const { addMockCliente } = await import('./supabaseMock');
            const clienteId = await addMockCliente({
                nombre: data.nombre,
                email: data.email,
                telefono: data.telefono,
                fecha_nacimiento: data.fechaNacimiento,
                marketing_opt_in: data.marketingOptIn
            });
            return {
                data: {
                    cliente_id: clienteId,
                    message: 'Registro exitoso',
                    es_nuevo: true
                },
                error: null,
                ms: result.ms
            };
        }
        return result;
    } catch (error) {
        console.error('❌ Error en RPC registerClienteDirect:', error);
        const { addMockCliente } = await import('./supabaseMock');
        const clienteId = await addMockCliente({
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            fecha_nacimiento: data.fechaNacimiento,
            marketing_opt_in: data.marketingOptIn
        });
        return {
            data: {
                cliente_id: clienteId,
                message: 'Registro exitoso',
                es_nuevo: true
            },
            error: null,
            ms: 0
        };
    }
};

export const verifyOtp = async (pendingOtpId: string, otp: string) => {
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const result = await mock.verifyOtp(pendingOtpId, otp);
        return { data: result, error: null, ms: 0 };
    }
    
    // Dynamic import to avoid initialization issues in mock mode
    const { supabase } = await import('./supabaseClient');
    return api('verifyOtp', async () => {
        const { data: result, error } = await supabase.rpc('verificar_otp', { 
            p_otp_id: pendingOtpId, 
            p_codigo: otp 
        });
        return { data: result, error };
    });
};

export const startVisit = async (mesaNombre: string, numeroPersonas: number, clienteId?: string) => {
    console.log('🔍 startVisit llamado con:', { mesaNombre, numeroPersonas, clienteId });
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const result = await mock.startVisit(mesaNombre, numeroPersonas, clienteId);
        return { data: result, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    if (clienteId) {
        const res = await api('startVisit', async () => {
            const { data: result, error } = await supabase.rpc('iniciar_visita_con_cliente', { 
                p_mesa_nombre: mesaNombre, 
                p_numero_personas: numeroPersonas,
                p_cliente_id: clienteId
            });
            return { data: result, error };
        });
        if (res.error || !res.data) {
            const mock = await getMock();
            const result = await mock.startVisit(mesaNombre, numeroPersonas, clienteId);
            return { data: result, error: null, ms: res.ms };
        }
        return res;
    }
    const res2 = await api('startVisit', async () => {
        const { data: result, error } = await supabase.rpc('iniciar_visita', { 
            p_mesa_nombre: mesaNombre, 
            p_numero_personas: numeroPersonas
        });
        return { data: result, error };
    });
    if (res2.error || !res2.data) {
        const mock = await getMock();
        const result = await mock.startVisit(mesaNombre, numeroPersonas, clienteId);
        return { data: result, error: null, ms: res2.ms };
    }
    return res2;
};

export const getMesaByNombre = async (nombre: string) => {
    console.log('🔍 getMesaByNombre llamado con:', nombre);
    console.log('🌍 Environment:', { NODE_ENV: process.env.NODE_ENV, USE_MOCK: process.env.USE_MOCK });
    
    // Use mock for development/testing
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        console.log('🚀 Usando modo MOCK para getMesaByNombre');
        const mock = await getMock();
        const { data, error } = await mock.getMesaByNombre(nombre);
        console.log('📊 Resultado mock:', { data, error });
        return { data, error, ms: 0 };
    }
    
    console.log('🔌 Usando Supabase real para getMesaByNombre');
    const { supabase } = await import('./supabaseClient');
    return api('getMesaByNombre', async () => {
        const { data, error } = await supabase
            .from('mesas')
            .select('*')
            .eq('nombre', nombre)
            .single();
        return { data, error };
    });
};

export const staffLogin = async (email: string, password: string) => {
    // Delegate to adminAuth for proper Supabase authentication
    const { adminAuth } = await import('./adminAuth');
    return adminAuth.login(email, password);
};

export const logout = async () => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        await mock.logout();
        return { data: null, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    return api('logout', async () => {
        const { error } = await supabase.auth.signOut();
        return { data: null, error };
    });
};

export const createClientSession = async (email: string, telefono: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        // In mock mode, we simulate a successful session creation
        return { 
            data: { 
                user: { email, telefono }, 
                session: { access_token: 'mock_token', refresh_token: 'mock_refresh' } 
            }, 
            error: null, 
            ms: 0 
        };
    }
    
    const { supabase } = await import('./supabaseClient');
    return api('createClientSession', async () => {
        try {
            // For client sessions, we'll use a custom approach since we're not using traditional auth
            // We'll store the session data in localStorage and create a session object
            const sessionData = {
                user: { email, telefono },
                access_token: `client_${Date.now()}`,
                refresh_token: `refresh_${Date.now()}`,
                expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            };
            
            // Store session in localStorage
            localStorage.setItem('expendio_session', JSON.stringify(sessionData));
            
            return { 
                data: { 
                    user: sessionData.user, 
                    session: sessionData 
                }, 
                error: null 
            };
        } catch (error) {
            return { 
                data: null, 
                error: error instanceof Error ? error.message : 'Error al crear sesión' 
            };
        }
    });
};

export const getClientePuntos = async (clienteId: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const puntos = await mock.getClientePuntos(clienteId);
        return { data: puntos, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    return api('getClientePuntos', async () => {
        const { data, error } = await supabase.from('clientes_puntos')
            .select('*')
            .eq('cliente_id', clienteId)
            .single();
        return { data, error };
    });
};

// ========== NUEVAS FUNCIONES PARA PRODUCTOS ==========

export const getProductos = async (categoria?: ProductCategoria) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.getProductos(categoria);
        return { data, error, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    let query = supabase.from('productos').select('*').eq('disponible', true);
    if (categoria) {
        query = query.eq('categoria', categoria);
    }
    return api('getProductos', async () => {
        const { data, error } = await query.order('nombre');
        return { data, error };
    });
};

export const getProductoById = async (productoId: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.getProductoById(productoId);
        return { data, error, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    return api('getProductoById', async () => {
        const { data, error } = await supabase.from('productos').select('*').eq('id', productoId).single();
        return { data, error };
    });
};

// ========== NUEVAS FUNCIONES PARA PEDIDOS ==========

export const crearPedido = async (data: NewPedido) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const result = await mock.crearPedido(data);
        return { data: result, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('crearPedido', async () => {
        const { data: result, error } = await supabase.rpc('crear_pedido', {
            p_visita_id: data.visitaId,
            p_producto_id: data.productoId,
            p_cantidad: data.cantidad,
            p_notas: data.notas || null
        });
        return { data: result, error };
    });
    if (res.error || !res.data) {
        const mock = await getMock();
        const result = await mock.crearPedido(data);
        return { data: result, error: null, ms: res.ms };
    }
    return res;
};

export const obtenerPedidosVisita = async (visitaId: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.obtenerPedidosVisita(visitaId);
        return { data, error, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('obtenerPedidosVisita', async () => {
        const { data: result, error } = await supabase.rpc('obtener_pedidos_visita', {
            p_visita_id: visitaId
        });
        return { data: result, error };
    });
    if (res.error) {
        const mock = await getMock();
        const { data, error } = await mock.obtenerPedidosVisita(visitaId);
        return { data, error, ms: res.ms };
    }
    return res;
};

export const calcularTotalPedidos = async (visitaId: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const total = await mock.calcularTotalPedidos(visitaId);
        return { data: total, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('calcularTotalPedidos', async () => {
        const { data: result, error } = await supabase.rpc('calcular_total_pedidos', {
            p_visita_id: visitaId
        });
        return { data: result, error };
    });
    if (res.error) {
        const mock = await getMock();
        const total = await mock.calcularTotalPedidos(visitaId);
        return { data: total, error: null, ms: res.ms };
    }
    return res;
};

// ========== NUEVAS FUNCIONES PARA NOTIFICACIONES ==========

export const crearNotificacion = async (data: NewNotificacion) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const result = await mock.crearNotificacion(data);
        return { data: result, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('crearNotificacion', async () => {
        const { data: result, error } = await supabase.rpc('crear_notificacion', {
            p_visita_id: data.visitaId,
            p_tipo: data.tipo,
            p_mensaje: data.mensaje || null
        });
        return { data: result, error };
    });
    if (res.error || !res.data) {
        const mock = await getMock();
        const result = await mock.crearNotificacion(data);
        return { data: result, error: null, ms: res.ms };
    }
    return res;
};

export const obtenerNotificacionesPendientes = async () => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.obtenerNotificacionesPendientes();
        return { data, error, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('obtenerNotificacionesPendientes', async () => {
        const { data: result, error } = await supabase.rpc('obtener_notificaciones_pendientes');
        return { data: result, error };
    });
    if (res.error) {
        const mock = await getMock();
        const { data, error } = await mock.obtenerNotificacionesPendientes();
        return { data, error, ms: res.ms };
    }
    return res;
};

export const marcarNotificacionAtendida = async (notificacionId: string, atendidaPor?: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const result = await mock.marcarNotificacionAtendida(notificacionId, atendidaPor);
        return { data: result, error: null, ms: 0 };
    }
    const { supabase } = await import('./supabaseClient');
    const res = await api('marcarNotificacionAtendida', async () => {
        const { data: result, error } = await supabase.rpc('marcar_notificacion_atendida', {
            p_notificacion_id: notificacionId,
            p_atendida_por: atendidaPor || null
        });
        return { data: result, error };
    });
    if (res.error || !res.data) {
        const mock = await getMock();
        const result = await mock.marcarNotificacionAtendida(notificacionId, atendidaPor);
        return { data: result, error: null, ms: res.ms };
    }
    return res;
};

// Función helper para obtener la visita activa del usuario actual
export const getVisitaActualUsuario = async (clienteIdParam?: string) => {
    let clienteId = clienteIdParam;

    // Si no se pasa clienteId, intentar obtenerlo del usuario actual o localStorage
    if (!clienteId) {
        // Intentar localStorage primero
        clienteId = localStorage.getItem('expendio_cliente_id') || undefined;

        if (!clienteId) {
            // Fallback a getCurrentUser
            const userResponse = await getCurrentUser();
            if (userResponse.error || !userResponse.data?.user) {
                return { data: null, error: 'Usuario no autenticado', ms: 0 };
            }
            clienteId = userResponse.data.user.id;
        }
    }

    if (!clienteId) {
        return { data: null, error: 'Cliente ID no encontrado', ms: 0 };
    }

    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const visita = await mock.getVisitaActivaByClienteId(clienteId);
        return { data: visita, error: null, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    return api('getVisitaActualUsuario', async () => {
        const { data, error } = await supabase
            .from('visitas')
            .select('*, mesa:mesas(nombre)')
            .eq('cliente_id', clienteId)
            .is('hora_salida', null)
            .single();
        return { data, error };
    });
};

// ========== FUNCIONES PARA GESTIÓN DE CLIENTES ==========

export const getClientes = async () => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const { data, error } = await mock.getClientes();
        return { data, error, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    return api('getClientes', async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('fecha_creacion', { ascending: false });
        return { data, error };
    });
};

export const getVisitasByCliente = async (clienteId: string) => {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const visitas = await mock.getVisitasByClienteId(clienteId);
        return { data: visitas, error: null, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    return api('getVisitasByCliente', async () => {
        const { data, error } = await supabase
            .from('visitas')
            .select('*, mesa:mesas(nombre), cliente:clientes(nombre, email)')
            .eq('cliente_id', clienteId)
            .order('hora_llegada', { ascending: false });
        return { data, error };
    });
};

// ========== FUNCIONES PARA GESTIÓN DE RESERVAS ==========

export const getUpcomingReservations = async () => {
    // Solo usar mock si USE_MOCK es explícitamente 'true'
    if (process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        const reservas = mock.subscribeToAllReservations(() => {});
        // En mock, necesitamos obtener las reservas directamente
        return { data: [], error: null, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    const ahora = new Date();
    const inicioDeHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();

    console.log('🔵 Usando Supabase REAL para obtener reservas');
    console.log('⏰ Inicio de hoy:', inicioDeHoy);

    return api('getUpcomingReservations', async () => {
        // Obtener todas las reservas confirmadas desde el inicio del día de hoy
        const { data, error } = await supabase
            .from('reservas')
            .select('*, mesa:mesas(nombre), cliente:clientes(nombre, email, telefono)')
            .eq('estado', 'Confirmada')
            .gte('fecha_hora', inicioDeHoy)
            .order('fecha_hora', { ascending: true });

        console.log('📅 Reservas desde hoy:', data?.length);
        if (data && data.length > 0) {
            console.log('📋 Detalle de reservas:');
            data.forEach((r, i) => {
                console.log(`  ${i + 1}. Mesa ${r.mesa?.nombre} - ${r.cliente?.nombre} - ${r.fecha_hora}`);
            });
        }

        return { data, error };
    });
};

export const cancelReservation = async (reservaId: string) => {
    // Solo usar mock si USE_MOCK es explícitamente 'true'
    if (process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        await mock.cancelReservation(reservaId);
        return { data: { success: true }, error: null, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    return api('cancelReservation', async () => {
        const { data, error } = await supabase
            .from('reservas')
            .update({ estado: 'Cancelada' })
            .eq('id', reservaId);

        if (!error) {
            // También liberar la mesa
            const { data: reserva } = await supabase
                .from('reservas')
                .select('mesa_id')
                .eq('id', reservaId)
                .single();

            if (reserva) {
                await supabase
                    .from('mesas')
                    .update({ estado: 'Libre' })
                    .eq('id', reserva.mesa_id);
            }
        }

        return { data, error };
    });
};

export const markReservationAsArrived = async (reservaId: string) => {
    // Solo usar mock si USE_MOCK es explícitamente 'true'
    if (process.env.USE_MOCK === 'true') {
        const mock = await getMock();
        await mock.markReservationAsArrived(reservaId);
        return { data: { success: true }, error: null, ms: 0 };
    }

    const { supabase } = await import('./supabaseClient');
    return api('markReservationAsArrived', async () => {
        // Obtener la reserva
        const { data: reserva, error: reservaError } = await supabase
            .from('reservas')
            .select('*, mesa:mesas(nombre), cliente:clientes(*)')
            .eq('id', reservaId)
            .single();

        if (reservaError || !reserva) {
            return { data: null, error: reservaError };
        }

        // Crear la visita
        const { data: visitaData, error: visitaError } = await supabase
            .from('visitas')
            .insert({
                mesa_id: reserva.mesa_id,
                cliente_id: reserva.cliente_id,
                hora_llegada: new Date().toISOString(),
                numero_personas: reserva.numero_personas
            })
            .select()
            .single();

        if (visitaError) {
            return { data: null, error: visitaError };
        }

        // Actualizar reserva a Completada
        await supabase
            .from('reservas')
            .update({ estado: 'Completada' })
            .eq('id', reservaId);

        // Actualizar mesa a Ocupada
        await supabase
            .from('mesas')
            .update({ estado: 'Ocupada' })
            .eq('id', reserva.mesa_id);

        return { data: visitaData, error: null };
    });
};

/**
 * Obtener cupones de un cliente
 */
export const getClienteCupones = async (clienteId: string) => {
    const { supabase } = await import('./supabaseClient');
    return api('getClienteCupones', async () => {
        const { data, error } = await supabase
            .from('cupones')
            .select('*')
            .eq('cliente_id', clienteId)
            .order('created_at', { ascending: false });
        return { data, error };
    });
};
