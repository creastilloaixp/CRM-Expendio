import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import type { Cliente, Visita } from '../types';
import { getClientes, getVisitasByCliente } from '../services/api';
import { getClienteInsights } from '../services/geminiService';

interface ClienteConMetricas extends Cliente {
  total_visitas: number;
  ultima_visita: string | null;
  gasto_total: number;
  gasto_promedio: number;
  frecuencia_dias: number | null;
}

interface ClienteDetalle {
  cliente: Cliente;
  visitas: Visita[];
  metricas: {
    total_visitas: number;
    gasto_total: number;
    gasto_promedio: number;
    personas_promedio: number;
    mesas_favoritas: string[];
    dias_desde_ultima_visita: number;
  };
}

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteConMetricas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<ClienteDetalle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'visitas' | 'gasto' | 'reciente'>('nombre');
  const [filterSegment, setFilterSegment] = useState<'todos' | 'vip' | 'frecuentes' | 'nuevos' | 'inactivos'>('todos');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const { data: clientesData } = await getClientes();

      if (!clientesData) {
        setClientes([]);
        return;
      }

      // Obtener visitas de cada cliente y calcular métricas
      const clientesConMetricas = await Promise.all(
        clientesData.map(async (cliente) => {
          const { data: visitas } = await getVisitasByCliente(cliente.id);

          if (!visitas || visitas.length === 0) {
            return {
              ...cliente,
              total_visitas: 0,
              ultima_visita: null,
              gasto_total: 0,
              gasto_promedio: 0,
              frecuencia_dias: null
            };
          }

          const visitasCompletadas = visitas.filter(v => v.hora_salida);
          const gastoTotal = visitasCompletadas.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
          const ultimaVisita = visitas.sort((a, b) =>
            new Date(b.hora_llegada).getTime() - new Date(a.hora_llegada).getTime()
          )[0];

          // Calcular frecuencia (días promedio entre visitas)
          let frecuenciaDias = null;
          if (visitasCompletadas.length > 1) {
            const fechas = visitasCompletadas
              .map(v => new Date(v.hora_llegada).getTime())
              .sort((a, b) => a - b);
            const diferencias = [];
            for (let i = 1; i < fechas.length; i++) {
              diferencias.push((fechas[i] - fechas[i - 1]) / (1000 * 60 * 60 * 24));
            }
            frecuenciaDias = Math.round(diferencias.reduce((a, b) => a + b, 0) / diferencias.length);
          }

          return {
            ...cliente,
            total_visitas: visitas.length,
            ultima_visita: ultimaVisita?.hora_llegada || null,
            gasto_total: gastoTotal,
            gasto_promedio: visitasCompletadas.length > 0 ? gastoTotal / visitasCompletadas.length : 0,
            frecuencia_dias: frecuenciaDias
          };
        })
      );

      setClientes(clientesConMetricas);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClienteDetalle = async (cliente: ClienteConMetricas) => {
    const { data: visitas } = await getVisitasByCliente(cliente.id);

    if (!visitas || visitas.length === 0) {
      setSelectedCliente({
        cliente,
        visitas: [],
        metricas: {
          total_visitas: 0,
          gasto_total: 0,
          gasto_promedio: 0,
          personas_promedio: 0,
          mesas_favoritas: [],
          dias_desde_ultima_visita: 0
        }
      });
      return;
    }

    const visitasCompletadas = visitas.filter(v => v.hora_salida);
    const gastoTotal = visitasCompletadas.reduce((sum, v) => sum + (v.consumo_total || 0), 0);
    const personasPromedio = visitas.reduce((sum, v) => sum + v.numero_personas, 0) / visitas.length;

    // Mesas favoritas
    const mesaCount: Record<string, number> = {};
    visitas.forEach(v => {
      const mesa = v.mesa?.nombre || 'Desconocida';
      mesaCount[mesa] = (mesaCount[mesa] || 0) + 1;
    });
    const mesasFavoritas = Object.entries(mesaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mesa]) => mesa);

    // Días desde última visita
    const ultimaVisita = new Date(visitas[0].hora_llegada);
    const hoy = new Date();
    const diasDesdeUltima = Math.floor((hoy.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

    setSelectedCliente({
      cliente,
      visitas,
      metricas: {
        total_visitas: visitas.length,
        gasto_total: gastoTotal,
        gasto_promedio: visitasCompletadas.length > 0 ? gastoTotal / visitasCompletadas.length : 0,
        personas_promedio: Math.round(personasPromedio * 10) / 10,
        mesas_favoritas: mesasFavoritas,
        dias_desde_ultima_visita: diasDesdeUltima
      }
    });
  };

  const generateAIInsight = async (cliente: ClienteDetalle) => {
    setLoadingInsight(true);
    setAiInsight('');

    try {
      const insight = await getClienteInsights(cliente.cliente, cliente.visitas);
      setAiInsight(insight);
    } catch (error) {
      console.error('Error generando insight:', error);
      setAiInsight('❌ Error al generar análisis. Intenta de nuevo.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const getSegmentoCliente = (cliente: ClienteConMetricas): string => {
    if (cliente.total_visitas === 0) return 'nuevo';
    if (cliente.gasto_total > 2000) return 'vip';
    if (cliente.total_visitas >= 5) return 'frecuente';

    const diasDesdeUltima = cliente.ultima_visita
      ? Math.floor((new Date().getTime() - new Date(cliente.ultima_visita).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (diasDesdeUltima > 60) return 'inactivo';
    return 'ocasional';
  };

  const filteredAndSortedClientes = clientes
    .filter(cliente => {
      // Filtro de búsqueda
      const matchSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefono.includes(searchTerm);

      // Filtro de segmento
      if (filterSegment === 'todos') return matchSearch;
      const segmento = getSegmentoCliente(cliente);

      if (filterSegment === 'vip') return matchSearch && segmento === 'vip';
      if (filterSegment === 'frecuentes') return matchSearch && segmento === 'frecuente';
      if (filterSegment === 'nuevos') return matchSearch && (segmento === 'nuevo' || cliente.total_visitas <= 2);
      if (filterSegment === 'inactivos') return matchSearch && segmento === 'inactivo';

      return matchSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'visitas':
          return b.total_visitas - a.total_visitas;
        case 'gasto':
          return b.gasto_total - a.gasto_total;
        case 'reciente':
          if (!a.ultima_visita) return 1;
          if (!b.ultima_visita) return -1;
          return new Date(b.ultima_visita).getTime() - new Date(a.ultima_visita).getTime();
        default:
          return 0;
      }
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getSegmentoBadgeColor = (segmento: string) => {
    switch (segmento) {
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'frecuente': return 'bg-green-100 text-green-800 border-green-300';
      case 'nuevo': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'inactivo': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getSegmentoLabel = (segmento: string) => {
    switch (segmento) {
      case 'vip': return '👑 VIP';
      case 'frecuente': return '⭐ Frecuente';
      case 'nuevo': return '🆕 Nuevo';
      case 'inactivo': return '💤 Inactivo';
      default: return '👤 Ocasional';
    }
  };

  // Calcular estadísticas generales
  const stats = {
    total: clientes.length,
    vip: clientes.filter(c => getSegmentoCliente(c) === 'vip').length,
    frecuentes: clientes.filter(c => getSegmentoCliente(c) === 'frecuente').length,
    nuevos: clientes.filter(c => getSegmentoCliente(c) === 'nuevo' || c.total_visitas <= 2).length,
    inactivos: clientes.filter(c => getSegmentoCliente(c) === 'inactivo').length,
    gastoTotal: clientes.reduce((sum, c) => sum + c.gasto_total, 0),
    visitasTotal: clientes.reduce((sum, c) => sum + c.total_visitas, 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-expendio-teal mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedCliente) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => setSelectedCliente(null)}
              className="mb-2 text-sm"
            >
              ← Volver a lista
            </Button>
            <h1 className="text-3xl font-bold text-expendio-dark">
              {selectedCliente.cliente.nombre}
            </h1>
            <p className="text-gray-600">{selectedCliente.cliente.email}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getSegmentoBadgeColor(getSegmentoCliente(selectedCliente.cliente as ClienteConMetricas))}`}>
            {getSegmentoLabel(getSegmentoCliente(selectedCliente.cliente as ClienteConMetricas))}
          </span>
        </div>

        {/* Métricas del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Total de Visitas</p>
              <p className="text-2xl font-bold text-expendio-dark">{selectedCliente.metricas.total_visitas}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Gasto Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCliente.metricas.gasto_total)}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Gasto Promedio</p>
              <p className="text-2xl font-bold text-expendio-teal">{formatCurrency(selectedCliente.metricas.gasto_promedio)}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Personas Promedio</p>
              <p className="text-2xl font-bold text-expendio-dark">{selectedCliente.metricas.personas_promedio}</p>
            </div>
          </Card>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-expendio-dark mb-4">Información de Contacto</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Teléfono:</span> {selectedCliente.cliente.telefono}</p>
                <p><span className="font-semibold">Email:</span> {selectedCliente.cliente.email}</p>
                <p><span className="font-semibold">Miembro desde:</span> {formatDate(selectedCliente.cliente.fecha_creacion)}</p>
                <p><span className="font-semibold">Última visita:</span> Hace {selectedCliente.metricas.dias_desde_ultima_visita} días</p>
                <p><span className="font-semibold">Marketing:</span> {selectedCliente.cliente.marketing_opt_in ? '✅ Acepta' : '❌ No acepta'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold text-expendio-dark mb-4">Preferencias</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Mesas favoritas:</span></p>
                <div className="flex gap-2 flex-wrap">
                  {selectedCliente.metricas.mesas_favoritas.map(mesa => (
                    <span key={mesa} className="px-3 py-1 bg-expendio-teal/10 text-expendio-teal rounded-full text-sm">
                      {mesa}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-expendio-dark">🤖 Análisis con IA & Recomendaciones de Marketing</h3>
              <Button
                onClick={() => generateAIInsight(selectedCliente)}
                disabled={loadingInsight}
              >
                {loadingInsight ? 'Generando...' : 'Generar Análisis'}
              </Button>
            </div>
            {aiInsight && (
              <div className="bg-gray-50 rounded-lg p-4 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') }} />
              </div>
            )}
          </div>
        </Card>

        {/* Historial de Visitas */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-expendio-dark mb-4">Historial de Visitas</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Mesa</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Personas</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Duración</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Consumo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedCliente.visitas.map(visita => {
                    const llegada = new Date(visita.hora_llegada);
                    const salida = visita.hora_salida ? new Date(visita.hora_salida) : null;
                    const duracion = salida
                      ? Math.round((salida.getTime() - llegada.getTime()) / (1000 * 60))
                      : null;

                    return (
                      <tr key={visita.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{formatDate(visita.hora_llegada)}</td>
                        <td className="px-4 py-3 text-sm">{visita.mesa?.nombre || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{visita.numero_personas}</td>
                        <td className="px-4 py-3 text-sm">{duracion ? `${duracion} min` : 'En curso'}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {visita.consumo_total ? formatCurrency(visita.consumo_total) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-expendio-dark mb-2">Gestión de Clientes</h1>
        <p className="text-gray-600">Administra y analiza el comportamiento de tus clientes</p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-expendio-dark">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Clientes</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.vip}</p>
            <p className="text-sm text-gray-600">VIP 👑</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.frecuentes}</p>
            <p className="text-sm text-gray-600">Frecuentes ⭐</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.nuevos}</p>
            <p className="text-sm text-gray-600">Nuevos 🆕</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{stats.inactivos}</p>
            <p className="text-sm text-gray-600">Inactivos 💤</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.gastoTotal)}</p>
            <p className="text-sm text-gray-600">Gasto Total</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-expendio-teal">{stats.visitasTotal}</p>
            <p className="text-sm text-gray-600">Visitas Total</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Buscar cliente
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, email o teléfono..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-expendio-teal focus:border-transparent"
              />
            </div>

            {/* Segmento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Filtrar por segmento
              </label>
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-expendio-teal focus:border-transparent"
              >
                <option value="todos">Todos los clientes</option>
                <option value="vip">👑 VIP (Gasto &gt; $2000)</option>
                <option value="frecuentes">⭐ Frecuentes (5+ visitas)</option>
                <option value="nuevos">🆕 Nuevos (≤2 visitas)</option>
                <option value="inactivos">💤 Inactivos (&gt;60 días)</option>
              </select>
            </div>

            {/* Ordenar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ↕️ Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-expendio-teal focus:border-transparent"
              >
                <option value="nombre">Nombre (A-Z)</option>
                <option value="visitas">Más visitas</option>
                <option value="gasto">Mayor gasto</option>
                <option value="reciente">Más reciente</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segmento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Visita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frecuencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedClientes.map(cliente => (
                <tr key={cliente.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => loadClienteDetalle(cliente)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                      <div className="text-sm text-gray-500">{cliente.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getSegmentoBadgeColor(getSegmentoCliente(cliente))}`}>
                      {getSegmentoLabel(getSegmentoCliente(cliente))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.total_visitas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(cliente.gasto_total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(cliente.ultima_visita)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.frecuencia_dias ? `Cada ${cliente.frecuencia_dias} días` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadClienteDetalle(cliente);
                      }}
                      className="text-expendio-teal hover:text-expendio-teal/80"
                    >
                      Ver detalle →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedClientes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron clientes con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Clientes;
