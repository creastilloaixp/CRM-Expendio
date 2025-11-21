import React, { useState, useEffect } from 'react';
import type { Mesa, Reserva } from '../types';
import { TableStatus } from '../types';
import { STATUS_COLORS } from '../constants';

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
      (async () => {
        const { supabaseMock } = await import('../services/supabaseMock');
        const data = await supabaseMock.getActiveReservaByMesaId(mesa.id);
        if(isMounted) setReserva(data);
      })();
    } else {
       setReserva(null);
    }
    return () => { isMounted = false; };
  }, [mesa.estado, mesa.id]);

  const getReservationTime = () => {
    if (!reserva) return '';
    return new Date(reserva.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (mesa.estado) {
      case TableStatus.Libre:
        return '✅';
      case TableStatus.Ocupada:
        return '👥';
      case TableStatus.Reservada:
        return '📅';
      default:
        return '❓';
    }
  };

  const getActionText = () => {
    switch (mesa.estado) {
      case TableStatus.Libre:
        return 'Hacer check-in';
      case TableStatus.Ocupada:
        return 'Ver detalles';
      case TableStatus.Reservada:
        return 'Ver reserva';
      default:
        return 'Ver información';
    }
  };

  const isClickable = mesa.estado === TableStatus.Libre || mesa.estado === TableStatus.Reservada;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`p-4 rounded-lg shadow-md transition-all duration-200 ease-in-out transform border-2 border-transparent ${
        isClickable 
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' 
          : 'cursor-not-allowed opacity-60'
      } ${bg}`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <h3 className="font-display text-3xl text-expendio-dark">{mesa.nombre}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Capacidad</p>
          <p className="font-bold text-xl text-expendio-dark">{mesa.capacidad}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${bg} ${text} ring-2 ${ring}`}>
          {mesa.estado}
        </span>
        
        <div className="text-right">
          {mesa.estado === TableStatus.Reservada && reserva && (
            <span className="font-bold text-sm text-blue-800 block">{getReservationTime()}</span>
          )}
          
          {isClickable && (
            <span className="text-xs text-expendio-red font-medium mt-1 block">
              {getActionText()}
            </span>
          )}
          
          {!isClickable && (
            <span className="text-xs text-gray-500 mt-1 block">
              No disponible
            </span>
          )}
        </div>
      </div>

      {mesa.estado === TableStatus.Libre && (
        <div className="mt-3 bg-green-100 border border-green-300 rounded-lg p-2">
          <p className="text-xs text-green-800 text-center font-medium">
            ✨ ¡Mesa disponible! Escanea el código QR para hacer check-in
          </p>
        </div>
      )}
    </div>
  );
};

export default TableCard;