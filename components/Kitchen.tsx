import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Pedido, PedidoEstado } from '../types';
import { supabase } from '../services/supabaseClient';
import { NotificationService } from '../services/notificationService';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface PedidoExtended extends Pedido {
    producto?: { nombre: string; categoria: string };
    visita?: {
        mesa?: { nombre: string };
        cliente?: { nombre: string };
    };
}

const Kitchen: React.FC = () => {
    const [pedidos, setPedidos] = useState<PedidoExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<PedidoEstado | 'Todos'>('Todos');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousPedidosCount = useRef<number>(0);

    // 🔊 Crear audio para notificaciones
    useEffect(() => {
        // Crear audio programáticamente (simple beep usando Web Audio API)
        const createBeep = () => {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        };

        audioRef.current = { play: createBeep } as any;
    }, []);

    const fetchPedidos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    producto:productos(nombre, categoria),
                    visita:visitas(
                        mesa:mesas(nombre),
                        cliente:clientes(nombre)
                    )
                `)
                .neq('estado', 'Entregado')
                .neq('estado', 'Cancelado')
                .order('created_at', { ascending: true });

            if (!error && data) {
                setPedidos(data as PedidoExtended[]);

                // 🔊 Reproducir sonido si hay pedidos nuevos
                if (previousPedidosCount.current > 0 && data.length > previousPedidosCount.current) {
                    audioRef.current?.play();

                    // 🔔 Usar servicio centralizado de notificaciones
                    const lastPedido = data[data.length - 1];
                    await NotificationService.notifyNewOrder(
                        lastPedido.visita?.mesa?.nombre || 'Desconocida',
                        lastPedido.producto?.nombre || 'Producto'
                    );
                }

                previousPedidosCount.current = data.length;
            }
        } catch (error) {
            console.error('Error fetching pedidos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPedidos();

        // 🔄 Realtime Subscription en lugar de polling
        const pedidosChannel = supabase
            .channel('kitchen-pedidos')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'pedidos'
                },
                (payload) => {
                    console.log('🔄 Realtime: Cambio en pedidos', payload);
                    fetchPedidos(); // Refrescar cuando hay cambios
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(pedidosChannel);
        };
    }, [fetchPedidos]);

    const handleUpdateEstado = async (pedidoId: string, nuevoEstado: PedidoEstado) => {
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
                .eq('id', pedidoId);

            if (!error) {
                // Actualizar estado local inmediatamente
                setPedidos(prev =>
                    prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p)
                );

                // Si el estado es "Entregado", remover del listado después de 2 segundos
                if (nuevoEstado === 'Entregado') {
                    setTimeout(() => {
                        setPedidos(prev => prev.filter(p => p.id !== pedidoId));
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error updating pedido estado:', error);
            alert('Error al actualizar el estado del pedido');
        }
    };

    const getEstadoColor = (estado: PedidoEstado): string => {
        switch (estado) {
            case 'Pendiente':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'En Preparación':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'Listo':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'Entregado':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'Cancelado':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getNextEstado = (estadoActual: PedidoEstado): PedidoEstado | null => {
        switch (estadoActual) {
            case 'Pendiente':
                return 'En Preparación';
            case 'En Preparación':
                return 'Listo';
            case 'Listo':
                return 'Entregado';
            default:
                return null;
        }
    };

    const getTimeSince = (createdAt: string): string => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins === 1) return '1 minuto';
        if (diffMins < 60) return `${diffMins} minutos`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1 hora';
        return `${diffHours} horas`;
    };

    const pedidosFiltrados = filter === 'Todos'
        ? pedidos
        : pedidos.filter(p => p.estado === filter);

    const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
    const pedidosEnPrep = pedidos.filter(p => p.estado === 'En Preparación').length;
    const pedidosListos = pedidos.filter(p => p.estado === 'Listo').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-expendio-teal"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🍳 Dashboard de Cocina</h1>
                    <p className="text-gray-600">Gestiona los pedidos en tiempo real</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-red-50 border-red-200">
                        <div className="p-4">
                            <p className="text-sm text-red-600 font-medium">Pendientes</p>
                            <p className="text-3xl font-bold text-red-700">{pedidosPendientes}</p>
                        </div>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                        <div className="p-4">
                            <p className="text-sm text-yellow-600 font-medium">En Preparación</p>
                            <p className="text-3xl font-bold text-yellow-700">{pedidosEnPrep}</p>
                        </div>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <div className="p-4">
                            <p className="text-sm text-green-600 font-medium">Listos</p>
                            <p className="text-3xl font-bold text-green-700">{pedidosListos}</p>
                        </div>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <div className="p-4">
                            <p className="text-sm text-blue-600 font-medium">Total Activos</p>
                            <p className="text-3xl font-bold text-blue-700">{pedidos.length}</p>
                        </div>
                    </Card>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {['Todos', 'Pendiente', 'En Preparación', 'Listo'].map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFilter(estado as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filter === estado
                                    ? 'bg-expendio-teal text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {estado}
                        </button>
                    ))}
                </div>

                {/* Lista de Pedidos */}
                {pedidosFiltrados.length === 0 ? (
                    <Card>
                        <div className="p-12 text-center">
                            <p className="text-gray-500 text-lg">
                                {filter === 'Todos'
                                    ? '🎉 No hay pedidos activos en este momento'
                                    : `No hay pedidos en estado "${filter}"`
                                }
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pedidosFiltrados.map(pedido => {
                            const nextEstado = getNextEstado(pedido.estado as PedidoEstado);
                            const timeSince = getTimeSince(pedido.created_at);

                            return (
                                <Card key={pedido.id} className={`border-2 ${getEstadoColor(pedido.estado as PedidoEstado)}`}>
                                    <div className="p-5">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-expendio-dark">
                                                    Mesa {pedido.visita?.mesa?.nombre || 'N/A'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {pedido.visita?.cliente?.nombre || 'Cliente sin nombre'}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(pedido.estado as PedidoEstado)}`}>
                                                {pedido.estado}
                                            </span>
                                        </div>

                                        {/* Producto */}
                                        <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <p className="font-bold text-expendio-dark">
                                                        {pedido.cantidad}x {pedido.producto?.nombre || 'Producto desconocido'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {pedido.producto?.categoria}
                                                    </p>
                                                    {pedido.notas && (
                                                        <p className="text-sm text-gray-700 mt-2 italic">
                                                            📝 {pedido.notas}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timer */}
                                        <div className="mb-4">
                                            <p className={`text-sm ${
                                                timeSince.includes('hora') || parseInt(timeSince) > 15
                                                    ? 'text-red-600 font-bold'
                                                    : 'text-gray-600'
                                            }`}>
                                                🕐 Hace {timeSince}
                                            </p>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex gap-2">
                                            {nextEstado && (
                                                <Button
                                                    onClick={() => handleUpdateEstado(pedido.id, nextEstado)}
                                                    className="flex-1 bg-expendio-teal hover:bg-teal-600"
                                                >
                                                    {nextEstado === 'En Preparación' && '👨‍🍳 Iniciar'}
                                                    {nextEstado === 'Listo' && '✅ Marcar Listo'}
                                                    {nextEstado === 'Entregado' && '🚀 Entregar'}
                                                </Button>
                                            )}
                                            {pedido.estado !== 'Cancelado' && (
                                                <Button
                                                    onClick={() => handleUpdateEstado(pedido.id, 'Cancelado')}
                                                    variant="secondary"
                                                    className="bg-red-100 hover:bg-red-200 text-red-700"
                                                >
                                                    ❌
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Kitchen;
