import React, { useState, useEffect } from 'react';
import { supabaseMock } from '../services/supabaseMock';
import type { Mesa, Visita, Reserva, NewReserva } from '../types';
import { TableStatus } from '../types';
import TableCard from './TableCard';
import TableModal from './TableModal';
import QRCodeModal from './QRCodeModal';
import { Button } from './common/Button';

const Dashboard: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [currentVisita, setCurrentVisita] = useState<Visita | null>(null);
  const [currentReserva, setCurrentReserva] = useState<Reserva | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = supabaseMock.subscribeToTableChanges((updatedMesas) => {
      setMesas(updatedMesas);
      if (loading) setLoading(false);
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableClick = async (mesa: Mesa) => {
    setSelectedMesa(mesa);
    if (mesa.estado === TableStatus.Ocupada) {
      const visita = await supabaseMock.getActiveVisitaByMesaId(mesa.id);
      setCurrentVisita(visita);
    } else if (mesa.estado === TableStatus.Reservada) {
       const reserva = await supabaseMock.getActiveReservaByMesaId(mesa.id);
       setCurrentReserva(reserva);
    } else {
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
    const success = await supabaseMock.releaseTable(visitaId, consumo);
    if(success) {
        handleCloseModal();
    } else {
        alert('Error al liberar la mesa.');
    }
  };

  const handleCreateReservation = async (data: NewReserva) => {
    const { success } = await supabaseMock.handleCreateReservation(data);
    if(success) {
      handleCloseModal();
    } else {
      alert('No se pudo crear la reserva. La mesa ya no está disponible.');
    }
  }

  if (loading) {
    return <div className="text-center p-10">Cargando dashboard...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-expendio-dark">Vista de Mesas</h2>
        <Button onClick={() => setIsQRModalOpen(true)} variant="secondary">Generar Códigos QR</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mesas.map((mesa) => (
          <TableCard 
            key={mesa.id} 
            mesa={mesa} 
            onClick={() => handleTableClick(mesa)}
          />
        ))}
      </div>
      {isModalOpen && selectedMesa && (
        <TableModal
          mesa={selectedMesa}
          visita={currentVisita}
          reserva={currentReserva}
          onClose={handleCloseModal}
          onRelease={handleReleaseTable}
          onCreateReservation={handleCreateReservation}
        />
      )}
      {isQRModalOpen && <QRCodeModal onClose={() => setIsQRModalOpen(false)} />}
    </>
  );
};

export default Dashboard;