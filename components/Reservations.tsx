import React, { useState, useEffect } from 'react';
import type { Reserva, ReservationStatus } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { getUpcomingReservations, cancelReservation, markReservationAsArrived } from '../services/api';
import { supabase } from '../services/supabaseClient';

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    console.log('📅 Reservations: Cargando reservas...');
    const { data, error } = await getUpcomingReservations();
    console.log('📅 Reservations: Resultado:', { data, error });
    if (!error && data) {
      console.log('✅ Reservations: Se encontraron', data.length, 'reservas');
      setReservations(data);
    } else if (error) {
      console.error('❌ Reservations: Error:', error);
    } else {
      console.log('ℹ️ Reservations: No hay reservas');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReservations();

    // 🔄 Realtime Subscription en lugar de polling
    const reservasChannel = supabase
      .channel('reservations-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas'
        },
        (payload) => {
          console.log('🔄 Realtime: Cambio en reservas', payload);
          loadReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservasChannel);
    };
  }, []);

  const handleCancel = async (reservaId: string) => {
    if(window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      await cancelReservation(reservaId);
      await loadReservations(); // Recargar después de cancelar
    }
  };

  const handleArrival = async (reservaId: string) => {
    await markReservationAsArrived(reservaId);
    await loadReservations(); // Recargar después de marcar llegada
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long'
    }) + ' a las ' + date.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-expendio-dark mb-4">Próximas Reservas</h2>
        {loading ? (
          <p>Cargando reservas...</p>
        ) : reservations.length > 0 ? (
          <div className="space-y-4">
            {reservations.map(reserva => (
              <div key={reserva.id} className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <p className="font-bold text-lg text-expendio-dark">Mesa {reserva.mesa?.nombre}</p>
                    <p className="text-gray-600">{reserva.cliente?.nombre} ({reserva.numero_personas} personas)</p>
                    <p className="text-sm text-expendio-teal font-semibold">{formatDateTime(reserva.fecha_hora)}</p>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                    <Button onClick={() => handleArrival(reserva.id)} variant='secondary'>Marcar Llegada</Button>
                    <Button onClick={() => handleCancel(reserva.id)} className="bg-gray-400 hover:bg-gray-500 focus:ring-gray-400">Cancelar</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No hay reservas confirmadas.</p>
        )}
      </div>
    </Card>
  );
};

export default Reservations;