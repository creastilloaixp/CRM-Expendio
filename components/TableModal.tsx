import React, { useState, useEffect } from 'react';
import type { Mesa, Visita, Reserva, NewReserva, Pedido } from '../types';
import { TableStatus } from '../types';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { obtenerPedidosVisita, calcularTotalPedidos } from '../services/api';

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
        nombreCliente: '',
        telefonoCliente: '',
        fechaReserva: today,
        horaReserva: defaultTime,
        cantidadPersonas: 2
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fechaHora = `${formData.fechaReserva}T${formData.horaReserva}:00`;
        onSubmit({
            mesaId,
            nombreCliente: formData.nombreCliente,
            telefonoCliente: formData.telefonoCliente,
            fechaReserva: fechaHora,
            cantidadPersonas: formData.cantidadPersonas
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-bold text-lg text-expendio-dark">Crear Nueva Reserva</h3>
            <Input id="nombreCliente" label="Nombre del Cliente" onChange={handleChange} value={formData.nombreCliente} required/>
            <Input id="telefonoCliente" label="Teléfono del Cliente" type="tel" onChange={handleChange} value={formData.telefonoCliente} required/>
            <div className="grid grid-cols-2 gap-4">
                <Input id="fechaReserva" label="Fecha" type="date" onChange={handleChange} value={formData.fechaReserva} min={today} required/>
                <Input id="horaReserva" label="Hora" type="time" onChange={handleChange} value={formData.horaReserva} required/>
            </div>
            <Input id="cantidadPersonas" label="Número de Personas" type="number" onChange={handleChange} value={formData.cantidadPersonas} min={1} required/>
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
  onCancelReservation?: (reservaId: string) => Promise<void>;
  onConfirmArrival?: (reservaId: string) => Promise<void>;
}

const TableModal: React.FC<TableModalProps> = ({ mesa, visita, reserva, onClose, onRelease, onCreateReservation, onCancelReservation, onConfirmArrival }) => {
  const [consumo, setConsumo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [totalPedidos, setTotalPedidos] = useState<number>(0);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  // Cargar pedidos cuando hay una visita activa
  useEffect(() => {
    const fetchPedidos = async () => {
      if (visita?.id) {
        setLoadingPedidos(true);
        const [pedidosRes, totalRes] = await Promise.all([
          obtenerPedidosVisita(visita.id),
          calcularTotalPedidos(visita.id)
        ]);
        if (pedidosRes.data) setPedidos(pedidosRes.data);
        if (totalRes.data) {
          setTotalPedidos(totalRes.data);
          setConsumo(totalRes.data.toString());
        }
        setLoadingPedidos(false);
      }
    };
    fetchPedidos();
  }, [visita?.id]);

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

  const handleCancelReservation = async () => {
    if (reserva && onCancelReservation) {
      if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
        setIsSubmitting(true);
        await onCancelReservation(reserva.id);
        setIsSubmitting(false);
        onClose();
      }
    }
  }

  const handleConfirmArrival = async () => {
    if (reserva && onConfirmArrival) {
      setIsSubmitting(true);
      await onConfirmArrival(reserva.id);
      setIsSubmitting(false);
      onClose();
    }
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
                    <p className="text-xl">{visita.cliente?.nombre || 'Cliente sin registro'}</p>
                    <p className="text-sm text-gray-500">{visita.cliente?.email || ''}</p>
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

                  {/* Pedidos activos */}
                  {loadingPedidos ? (
                    <div className="text-center py-2 text-gray-500">Cargando pedidos...</div>
                  ) : pedidos.length > 0 ? (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-500 text-sm mb-2">Pedidos ({pedidos.length})</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {pedidos.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                            <span>{p.cantidad}x {p.producto_nombre || p.producto?.nombre || 'Producto'}</span>
                            <span className="font-medium">${(p.precio_unitario * p.cantidad).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-expendio-primary">${totalPedidos.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t text-center text-gray-400 text-sm">
                      Sin pedidos registrados
                    </div>
                  )}

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
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg text-expendio-dark text-center">Reserva Confirmada</h3>
                    <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Cliente</h4>
                        <p className="text-xl">{reserva.cliente?.nombre || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500">{reserva.cliente?.email || 'Sin email'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Teléfono</h4>
                        <p className="text-xl">{reserva.cliente?.telefono || 'Sin teléfono'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Fecha y Hora</h4>
                        <p className="text-xl">{formatDateTime(reserva.fecha_hora)}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-500 text-sm">Personas</h4>
                        <p className="text-xl">{reserva.numero_personas}</p>
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-4 border-t space-y-2">
                      {onConfirmArrival && (
                        <Button
                          onClick={handleConfirmArrival}
                          fullWidth
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Procesando...' : '✅ Cliente Llegó - Iniciar Visita'}
                        </Button>
                      )}
                      {onCancelReservation && (
                        <Button
                          onClick={handleCancelReservation}
                          fullWidth
                          disabled={isSubmitting}
                          className="bg-gray-400 hover:bg-gray-500"
                        >
                          {isSubmitting ? 'Cancelando...' : '❌ Cancelar Reserva'}
                        </Button>
                      )}
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