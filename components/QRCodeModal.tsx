import React, { useState, useEffect } from 'react';
import type { Mesa } from '../types';
import { getMesas } from '../services/api';
import { Button } from './common/Button';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        
        const fetchMesas = async () => {
            try {
                const { data, error } = await getMesas();
                if (error) {
                    console.error('Error fetching mesas:', error);
                    setLoading(false);
                    return;
                }
                if (data) {
                    setMesas(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching mesas:', error);
                setLoading(false);
            }
        }
        fetchMesas();
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handlePrint = () => {
        window.print();
    };

    const generateQRCodeUrl = (mesaNombre: string) => {
        // Using window.location.origin ensures we get the base URL (e.g., https://example.com)
        // without any extra path information that might be present in preview environments,
        // which was causing the 404 error.
        const baseUrl = window.location.origin;
        const checkInUrl = `${baseUrl}/?mesa=${mesaNombre}#/checkin`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(checkInUrl)}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 print:p-0 print:bg-white" onClick={onClose}>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-area, .print-area * {
                            visibility: visible;
                        }
                        .print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 1rem;
                        }
                        .no-print {
                            display: none;
                        }
                        .qr-code-item {
                            page-break-inside: avoid;
                            border: 1px dashed #ccc;
                        }
                    }
                `}
            </style>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:rounded-none print:max-h-full" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex justify-between items-center no-print">
                    <h2 className="text-2xl font-bold text-expendio-dark">Códigos QR para Mesas</h2>
                    <div className="flex items-center">
                        <Button onClick={handlePrint} variant="secondary">Imprimir</Button>
                        <Button onClick={onClose} variant="secondary" className="ml-4">Cerrar</Button>
                        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-700 text-3xl font-light">&times;</button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto print-area">
                    {loading ? (
                        <p className="text-center">Cargando mesas...</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {mesas.map(mesa => (
                                <div key={mesa.id} className="text-center p-4 rounded-lg qr-code-item flex flex-col items-center justify-center">
                                    <img src={generateQRCodeUrl(mesa.nombre)} alt={`QR for ${mesa.nombre}`} className="mx-auto" width="150" height="150" />
                                    <p className="mt-4 font-display text-3xl text-expendio-dark">{mesa.nombre}</p>
                                    <p className="text-sm text-gray-500">Escanear para Check-in</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;