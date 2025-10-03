import React, { useState, useEffect } from 'react';
import type { Cliente } from '../types';
import { supabaseMock } from '../services/supabaseMock';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface MenuProps {
  mesaName: string | null;
}

const Menu: React.FC<MenuProps> = ({ mesaName }) => {
    const [user, setUser] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = await supabaseMock.getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        }
        fetchUser();
    }, []);

    if (loading) {
        return (
             <div className="max-w-md mx-auto mt-10">
                <Card>
                    <div className="p-8 text-center">
                        <p>Cargando tu mesa...</p>
                    </div>
                </Card>
            </div>
        );
    }
    
    if (!mesaName || !user) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <Card>
                    <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-expendio-red mb-4">Error de Sesión</h2>
                        <p>No se pudo cargar la información. Por favor, intenta escanear el código QR nuevamente.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10">
            <Card>
                <div className="p-8 text-center">
                    <h2 className="text-3xl font-bold text-expendio-dark">
                        ¡Bienvenid@, <span className="text-expendio-teal">{user.nombre}</span>!
                    </h2>
                    <p className="text-xl mt-2">Estás en la mesa <span className="font-bold">{mesaName}</span>.</p>
                    <p className="mt-4 text-gray-600">¿Qué te gustaría hacer?</p>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button variant="secondary" onClick={() => alert('Mostrando menú...')}>Ver Menú</Button>
                        <Button variant="primary" onClick={() => alert('Se ha notificado a un mesero.')}>Llamar Mesero</Button>
                        <Button onClick={() => alert('Solicitando la cuenta...')} className="bg-gray-700 hover:bg-gray-800 focus:ring-gray-600">Pedir la Cuenta</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Menu;
