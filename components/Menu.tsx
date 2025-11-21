import React, { useState, useEffect } from 'react';
import type { Cliente, Producto, ProductCategoria, NotificacionTipo } from '../types';
import { getCurrentUser, getProductos, crearNotificacion, getVisitaActualUsuario, calcularTotalPedidos, releaseTable } from '../services/api';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface MenuProps {
  mesaName: string | null;
}

const Menu: React.FC<MenuProps> = ({ mesaName }) => {
    const [user, setUser] = useState<Cliente | null>(null);
    const [visitaId, setVisitaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [categoriaActual, setCategoriaActual] = useState<ProductCategoria | 'Todas'>('Todas');
    const [showCuentaModal, setShowCuentaModal] = useState(false);
    const [totalCuenta, setTotalCuenta] = useState(0);
    const [loadingCuenta, setLoadingCuenta] = useState(false);
    const [processingNotification, setProcessingNotification] = useState(false);

    useEffect(() => {
        const initializeMenu = async () => {
            try {
                // Intentar obtener datos de localStorage primero
                const clienteId = localStorage.getItem('expendio_cliente_id');
                const visitaIdLocal = localStorage.getItem('expendio_visita_id');
                const nombre = localStorage.getItem('expendio_user_nombre');
                const email = localStorage.getItem('expendio_user_email');
                const telefono = localStorage.getItem('expendio_user_phone');

                if (clienteId && nombre && email) {
                    // Usuario desde localStorage
                    const cliente: Cliente = {
                        id: clienteId,
                        nombre: nombre,
                        email: email,
                        telefono: telefono || '',
                        fecha_nacimiento: null,
                        marketing_opt_in: false,
                        fecha_creacion: new Date().toISOString()
                    };
                    setUser(cliente);

                    if (visitaIdLocal) {
                        setVisitaId(visitaIdLocal);
                    } else {
                        // Intentar obtener visita activa del cliente
                        const visitaResponse = await getVisitaActualUsuario(clienteId);
                        if (visitaResponse.data) {
                            setVisitaId(visitaResponse.data.id);
                            localStorage.setItem('expendio_visita_id', visitaResponse.data.id);
                        }
                    }
                } else {
                    // Intentar obtener de sesión Supabase (fallback)
                    const { data, error } = await getCurrentUser();
                    if (!error && data?.user) {
                        const cliente: Cliente = {
                            id: data.user.id,
                            nombre: data.user.user_metadata?.nombre || 'Usuario',
                            email: data.user.email || '',
                            telefono: data.user.user_metadata?.telefono || '',
                            fecha_nacimiento: data.user.user_metadata?.fechaNacimiento || null,
                            marketing_opt_in: data.user.user_metadata?.marketingOptIn || false,
                            fecha_creacion: data.user.created_at
                        };
                        setUser(cliente);

                        const visitaResponse = await getVisitaActualUsuario(data.user.id);
                        if (visitaResponse.data) {
                            setVisitaId(visitaResponse.data.id);
                        }
                    }
                }
            } catch (error) {
                console.error('Error inicializando menú:', error);
            } finally {
                setLoading(false);
            }
        };
        initializeMenu();
    }, []);

    const handleVerMenu = async () => {
        setShowMenuModal(true);
        setLoadingProductos(true);
        try {
            const { data, error } = await getProductos();
            if (!error && data) {
                setProductos(data as Producto[]);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoadingProductos(false);
        }
    };

    const handleLlamarMesero = async () => {
        if (!visitaId) {
            alert('No se pudo encontrar tu visita activa.');
            return;
        }

        setProcessingNotification(true);
        try {
            const { data, error } = await crearNotificacion({
                visitaId,
                tipo: 'Llamar Mesero' as NotificacionTipo
            });

            if (!error) {
                alert('✅ Un mesero ha sido notificado y vendrá en breve.');
            } else {
                alert('Error al notificar al mesero. Por favor intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al notificar al mesero.');
        } finally {
            setProcessingNotification(false);
        }
    };

    const handlePedirCuenta = async () => {
        if (!visitaId) {
            alert('No se pudo encontrar tu visita activa.');
            return;
        }

        setLoadingCuenta(true);
        setShowCuentaModal(true);

        try {
            const { data, error } = await calcularTotalPedidos(visitaId);
            if (!error && typeof data === 'number') {
                setTotalCuenta(data);
            }

            // También crear notificación
            await crearNotificacion({
                visitaId,
                tipo: 'Pedir Cuenta' as NotificacionTipo
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingCuenta(false);
        }
    };

    const handleConfirmarPago = async () => {
        if (!visitaId) return;

        setLoadingCuenta(true);
        try {
            const { data, error } = await releaseTable(visitaId, totalCuenta);
            if (!error) {
                alert('✅ ¡Gracias por tu visita! Tu cuenta ha sido procesada.');
                window.location.hash = '/';
            } else {
                alert('Error al procesar la cuenta. Por favor habla con el personal.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la cuenta.');
        } finally {
            setLoadingCuenta(false);
        }
    };

    const productosFiltrados = categoriaActual === 'Todas'
        ? productos
        : productos.filter(p => p.categoria === categoriaActual);

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
        <>
            <div className="max-w-md mx-auto mt-10">
                <Card>
                    <div className="p-8 text-center">
                        <h2 className="text-3xl font-bold text-expendio-dark">
                            ¡Bienvenid@, <span className="text-expendio-teal">{user.nombre}</span>!
                        </h2>
                        <p className="text-xl mt-2">Estás en la mesa <span className="font-bold">{mesaName}</span>.</p>
                        <p className="mt-4 text-gray-600">¿Qué te gustaría hacer?</p>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button variant="secondary" onClick={handleVerMenu}>
                                📋 Ver Menú
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleLlamarMesero}
                                disabled={processingNotification}
                            >
                                {processingNotification ? 'Notificando...' : '🙋 Llamar Mesero'}
                            </Button>
                            <Button
                                onClick={handlePedirCuenta}
                                className="bg-gray-700 hover:bg-gray-800 focus:ring-gray-600"
                            >
                                💳 Pedir la Cuenta
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal Ver Menú */}
            {showMenuModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-expendio-dark">Nuestro Menú</h3>
                                <button
                                    onClick={() => setShowMenuModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-3xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Filtros de categoría */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['Todas', 'Cervezas', 'Hamburguesas', 'Tacos', 'Alitas', 'Bebidas', 'Entradas', 'Postres'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoriaActual(cat as any)}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            categoriaActual === cat
                                                ? 'bg-expendio-teal text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {loadingProductos ? (
                                <p className="text-center text-gray-600">Cargando productos...</p>
                            ) : productosFiltrados.length === 0 ? (
                                <p className="text-center text-gray-600">No hay productos disponibles en esta categoría.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {productosFiltrados.map(producto => (
                                        <div key={producto.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-expendio-dark">{producto.nombre}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
                                                    <p className="text-lg font-bold text-expendio-teal mt-2">
                                                        ${producto.precio.toFixed(2)} MXN
                                                    </p>
                                                </div>
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{producto.categoria}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-600 text-center">
                                Para ordenar, llama a un mesero usando el botón "Llamar Mesero"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pedir Cuenta */}
            {showCuentaModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-expendio-dark mb-4">Tu Cuenta</h3>

                            {loadingCuenta ? (
                                <p className="text-center py-8">Calculando total...</p>
                            ) : (
                                <div>
                                    <div className="bg-gray-100 rounded-lg p-6 mb-6">
                                        <p className="text-gray-600 mb-2">Total a pagar:</p>
                                        <p className="text-4xl font-bold text-expendio-teal">
                                            ${totalCuenta.toFixed(2)} <span className="text-xl">MXN</span>
                                        </p>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-6">
                                        Un mesero ha sido notificado y vendrá con tu cuenta en breve.
                                    </p>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setShowCuentaModal(false)}
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleConfirmarPago}
                                            className="flex-1 bg-expendio-teal hover:bg-teal-600"
                                            disabled={loadingCuenta}
                                        >
                                            {loadingCuenta ? 'Procesando...' : 'Confirmar Pago'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Menu;
