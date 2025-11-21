import React, { useState, useEffect, useCallback } from 'react';
import { getMesas, getActiveVisitaByMesaId, getActiveReservaByMesaId, releaseTable, createReservation, obtenerNotificacionesPendientes, marcarNotificacionAtendida, getUpcomingReservations, cancelReservation, markReservationAsArrived } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { NotificationService } from '../services/notificationService';
import type { Mesa, Visita, Reserva, NewReserva, Notificacion } from '../types';
import { TableStatus } from '../types';
import TableCard from './TableCard';
import TableModal from './TableModal';
import QRCodeModal from './QRCodeModal';
import GlobalAIAssistant from './GlobalAIAssistant';
import { Button } from './common/Button';

const Dashboard: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [currentVisita, setCurrentVisita] = useState<Visita | null>(null);
  const [currentReserva, setCurrentReserva] = useState<Reserva | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(true);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);

  const fetchMesas = useCallback(async () => {
    setLoading(true);
    console.log('Fetching mesas...');
    const { data, error } = await getMesas();
    console.log('Mesas response:', { data, error });
    if (data) {
      console.log('Setting mesas data:', data);
      setMesas(data as Mesa[]);
    }
    if (error) {
      console.error('Error fetching mesas:', error);
    }
    setLoading(false);
  }, []);

  const fetchNotificaciones = useCallback(async () => {
    const { data, error } = await obtenerNotificacionesPendientes();
    if (!error && data) {
      setNotificaciones(Array.isArray(data) ? data : []);
    }
  }, []);

  const fetchReservas = useCallback(async () => {
    const { data, error } = await getUpcomingReservations();
    if (!error && data) {
      setReservas(data);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
    fetchNotificaciones();
    fetchReservas();

    // 🔄 Realtime Subscriptions en lugar de polling
    const notificacionesChannel = supabase
      .channel('dashboard-notificaciones')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones'
        },
        async (payload) => {
          console.log('🔄 Realtime: Nueva notificación', payload);
          fetchNotificaciones();

          // 🔔 Enviar notificación del navegador
          const newNotif = payload.new as any;
          if (newNotif?.tipo === 'Llamar Mesero') {
            await NotificationService.notifyCallWaiter(newNotif.mesa_nombre || 'Desconocida');
          } else if (newNotif?.tipo === 'Pedir Cuenta') {
            await NotificationService.notifyRequestBill(newNotif.mesa_nombre || 'Desconocida');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificaciones'
        },
        () => fetchNotificaciones()
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notificaciones'
        },
        () => fetchNotificaciones()
      )
      .subscribe();

    const reservasChannel = supabase
      .channel('dashboard-reservas')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservas'
        },
        async (payload) => {
          console.log('🔄 Realtime: Nueva reserva', payload);
          fetchReservas();

          // 🔔 Notificación de nueva reserva
          const newReserva = payload.new as any;
          const fecha = newReserva?.fecha_hora ? new Date(newReserva.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
          await NotificationService.notifyNewReservation(
            newReserva?.cliente_nombre || 'Cliente',
            newReserva?.mesa_nombre || 'Mesa',
            fecha
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservas'
        },
        () => fetchReservas()
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reservas'
        },
        () => fetchReservas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificacionesChannel);
      supabase.removeChannel(reservasChannel);
    };
  }, [fetchMesas, fetchNotificaciones, fetchReservas]);

  const handleAtenderNotificacion = async (notificacionId: string) => {
    const { error } = await marcarNotificacionAtendida(notificacionId, 'Staff');
    if (!error) {
      fetchNotificaciones();
    }
  };

  const handleTableClick = async (mesa: Mesa) => {
    console.log('🖱️ Click en mesa:', mesa.nombre, 'Estado:', mesa.estado);
    setSelectedMesa(mesa);
    if (mesa.estado === TableStatus.Ocupada) {
      console.log('📍 Mesa ocupada, buscando visita activa...');
      const { data: visita, error } = await getActiveVisitaByMesaId(mesa.id);
      if (error) {
        console.error('❌ Error fetching active visita:', error);
      }
      console.log('📋 Visita encontrada:', visita);
      setCurrentVisita(visita as Visita | null);
    } else if (mesa.estado === TableStatus.Reservada) {
      console.log('📅 Mesa reservada, buscando reserva activa...');
      const { data: reserva, error } = await getActiveReservaByMesaId(mesa.id);
      if (error) {
        console.error('❌ Error fetching active reserva:', error);
      }
      console.log('📋 Reserva encontrada:', reserva);
      setCurrentReserva(reserva as Reserva | null);
    } else {
      console.log('🆓 Mesa libre');
      setCurrentVisita(null);
      setCurrentReserva(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMesa(null);
    setCurrentVisita(null);
    setCurrentReserva(null);
  };

  const handleReleaseTable = async (visitaId: string, consumo: number) => {
    const { error } = await releaseTable(visitaId, consumo);
    if (error) {
      console.error('Error releasing table:', error);
      return;
    }
    handleCloseModal();
    fetchMesas();
  };

  const handleCreateReservation = async (data: NewReserva) => {
    console.log('📅 Dashboard: Creando reserva con datos:', data);
    const result = await createReservation(data);
    console.log('📅 Dashboard: Resultado de createReservation:', result);

    if (result.error) {
      console.error('❌ Error creating reservation:', result.error);
      alert('Error al crear la reserva: ' + JSON.stringify(result.error));
      return;
    }

    console.log('✅ Reserva creada exitosamente:', result.data);
    alert('✅ Reserva creada exitosamente!');
    handleCloseModal();
    fetchMesas();
  };

  const handleCancelReservation = async (reservaId: string) => {
    console.log('❌ Dashboard: Cancelando reserva:', reservaId);
    const result = await cancelReservation(reservaId);
    if (result.error) {
      console.error('Error canceling reservation:', result.error);
      alert('Error al cancelar la reserva');
      return;
    }
    console.log('✅ Reserva cancelada');
    fetchMesas();
    fetchReservas();
  };

  const handleConfirmArrival = async (reservaId: string) => {
    console.log('✅ Dashboard: Confirmando llegada para reserva:', reservaId);
    const result = await markReservationAsArrived(reservaId);
    if (result.error) {
      console.error('Error confirming arrival:', result.error);
      alert('Error al confirmar llegada');
      return;
    }
    console.log('✅ Visita iniciada desde reserva');
    fetchMesas();
    fetchReservas();
  };

  const handleOpenQR = () => {
    setIsQRModalOpen(true);
  };

  const handleCloseQR = () => {
    setIsQRModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Mesas</h1>
          <div className="flex gap-3 items-center">
            {notificaciones.length > 0 && (
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                🔔
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificaciones.length}
                </span>
              </button>
            )}
            <Button onClick={() => setShowAIAssistant(!showAIAssistant)} variant={showAIAssistant ? "primary" : "outline"}>
              🤖 AI Assistant
            </Button>
            <Button onClick={handleOpenQR} variant="outline">
              Código QR
            </Button>
          </div>
        </div>

        {/* Panel de Notificaciones */}
        {showNotifications && notificaciones.length > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🔔 Notificaciones Pendientes ({notificaciones.length})
              </h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {notificaciones.map((notif: any) => (
                <div
                  key={notif.id}
                  className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-expendio-dark">
                        {notif.mesa_nombre}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          notif.tipo === 'Llamar Mesero'
                            ? 'bg-blue-100 text-blue-800'
                            : notif.tipo === 'Pedir Cuenta'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {notif.tipo}
                      </span>
                    </div>
                    <p className="text-gray-600">{notif.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleTimeString('es-MX')}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAtenderNotificacion(notif.id)}
                    variant="primary"
                    className="ml-4"
                  >
                    Atender
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Assistant Global */}
        {showAIAssistant && (
          <GlobalAIAssistant
            context={{
              mesas,
              reservas,
              notificaciones
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mesas.map((mesa) => (
            <TableCard
              key={mesa.id}
              mesa={mesa}
              onClick={() => handleTableClick(mesa)}
            />
          ))}
        </div>

        {selectedMesa && isModalOpen && (
          <TableModal
            onClose={handleCloseModal}
            mesa={selectedMesa}
            visita={currentVisita}
            reserva={currentReserva}
            onRelease={handleReleaseTable}
            onCreateReservation={handleCreateReservation}
            onCancelReservation={handleCancelReservation}
            onConfirmArrival={handleConfirmArrival}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={handleCloseQR}
        />
      </div>
    </div>
  );
};

export default Dashboard;