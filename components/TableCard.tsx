import React, { useState, useEffect } from 'react';
import type { Mesa, Reserva } from '../types';
import { TableStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { supabaseMock } from '../services/supabaseMock';

interface TableCardProps {
  mesa: Mesa;
  onClick: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ mesa, onClick }) => {
  const { bg, text, ring } = STATUS_COLORS[mesa.estado];
  const [reserva, setReserva] = useState<Reserva | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (mesa.estado === TableStatus.Reservada) {
      supabaseMock.getActiveReservaByMesaId(mesa.id).then(data => {
        if(isMounted) setReserva(data);
      });
    } else {
       setReserva(null);
    }
    return () => { isMounted = false; };
  }, [mesa.estado, mesa.id]);

  const getReservationTime = () => {
    if (!reserva) return '';
    return new Date(reserva.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-lg border-2 border-transparent ${bg}`}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-display text-3xl text-expendio-dark">{mesa.nombre}</h3>
        <div className="text-right">
            <p className="text-xs text-gray-500">Capacidad</p>
            <p className="font-bold text-xl text-expendio-dark">{mesa.capacidad}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${bg} ${text} ring-2 ${ring}`}>
          {mesa.estado}
        </span>
        {mesa.estado === TableStatus.Reservada && reserva && (
          <span className="font-bold text-sm text-blue-800">{getReservationTime()}</span>
        )}
      </div>
    </div>
  );
};

export default TableCard;