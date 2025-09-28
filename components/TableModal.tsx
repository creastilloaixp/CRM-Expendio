import React, { useState } from 'react';
import type { Mesa, Visita, Reserva, NewReserva } from '../types';
import { TableStatus } from '../types';
import { Button } from './common/Button';
import { Input } from './common/Input';

interface ReservationFormProps {
    mesaId: string;
    onSubmit: (data: NewReserva) => Promise<void>;
    isSubmitting: boolean;
}

const ReservationForm: React.FC<ReservationFormProps> = ({ mesaId, onSubmit, isSubmitting }) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const defaultTime = now.toTimeString().substring(0,5);

    const [formData, setFormData] = useState({
        clienteNombre: '',
        clienteEmail: '',
        fecha: today,
        hora: defaultTime,
        numeroPersonas: 2
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...formData, mesaId });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-bold text-lg text-expendio-dark">Crear Nueva Reserva</h3>
            <Input id="clienteNombre" label="Nombre del Cliente" onChange={handleChange} value={formData.clienteNombre} required/>
            <Input id="clienteEmail" label="Email del Cliente" type="email" onChange={handleChange} value={formData.clienteEmail} required/>
            <div className="grid grid-cols-2 gap-4">
                <Input id="fecha" label="Fecha" type="date" onChange={handleChange} value={formData.fecha} min={today} required/>
                <Input id="hora" label="Hora" type="time" onChange={handleChange} value={formData.hora} required/>
            </div>
            <Input id="numeroPersonas" label="Número de Personas" type="number" onChange={handleChange} value={formData.numeroPersonas} min={1} required/>
            <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}
            </Button>
        </form>
    )
}


interface TableModalProps {
  mesa: Mesa;
  visita: Visita | null;
  reserva: Reserva | null;
  onClose: () => void;
  onRelease: (visitaId: string, consumo: number) => Promise<void>;
  onCreateReservation: (data: NewReserva) => Promise<void>;
}

const TableModal: React.FC<TableModalProps> = ({ mesa, visita, reserva, onClose, onRelease, onCreateReservation }) => {
  const [consumo, setConsumo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRelease = async () => {
      if(visita && consumo) {
          setIsSubmitting(true);
          await onRelease(visita.id, parseFloat(consumo));
          setIsSubmitting(false);
      }
  }
  
  const handleCreateReservation = async (data: NewReserva) => {
    setIsSubmitting(true);
    await onCreateReservation(data);
    setIsSubmitting(false);
  }

  const formatDateTime = (isoString?: string) => {
      if(!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) + 
             ' a las ' + 
             date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
  
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  const renderContent = () => {
    switch(mesa.estado) {
        case TableStatus.Ocupada:
            if (!visita) return <p className="text-center py-8">Cargando datos de la visita...</p>;
            return (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-500 text-sm">Cliente</h4>
                    <p className="text-xl">{visita.cliente?.nombre}</p>
                    <p className="text-sm text-gray-500">{visita.cliente?.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Personas</h4>
                        <p className="text-xl">{visita.numero_personas}</p>
                     </div>
                      <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Llegada</h4>
                        <p className="text-xl">{formatTime(visita.hora_llegada)}</p>
                     </div>
                  </div>
                  <div className="pt-4 border-t">
                     <Input 
                        id="consumo"
                        label="Consumo Total ($)"
                        type="number"
                        placeholder="Ej: 850.50"
                        value={consumo}
                        onChange={(e) => setConsumo(e.target.value)}
                     />
                     <Button onClick={handleRelease} fullWidth className="mt-4" disabled={!consumo || isSubmitting}>
                        {isSubmitting ? 'Liberando...' : 'Liberar Mesa y Cobrar'}
                     </Button>
                  </div>
                </div>
            );
        case TableStatus.Reservada:
            if(!reserva) return <p className="text-center py-8">Cargando datos de la reserva...</p>;
            return (
                 <div className="space-y-4 text-center">
                    <h3 className="font-bold text-lg text-expendio-dark">Reserva Confirmada</h3>
                    <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Cliente</h4>
                        <p className="text-xl">{reserva.cliente?.nombre}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Fecha y Hora</h4>
                        <p className="text-xl">{formatDateTime(reserva.fecha_hora)}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Personas</h4>
                        <p className="text-xl">{reserva.numero_personas}</p>
                    </div>
                 </div>
            );
        case TableStatus.Libre:
            return <ReservationForm mesaId={mesa.id} onSubmit={handleCreateReservation} isSubmitting={isSubmitting} />
        default:
            return (
                <p className="text-gray-600 text-center py-8">
                  Esta mesa está actualmente '{mesa.estado}'.
                </p>
            );
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-display text-expendio-dark">Mesa {mesa.nombre}</h2>
              <p className={`font-semibold text-lg ${
                mesa.estado === TableStatus.Ocupada ? 'text-expendio-red' : 
                mesa.estado === TableStatus.Reservada ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {mesa.estado}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
          </div>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TableModal;