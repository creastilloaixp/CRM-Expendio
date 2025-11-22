import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import {
  aiBusinessService,
  type ProductRecommendation,
  type InventoryPrediction,
  type BusinessInsight,
  type ClientSegment
} from '../services/aiBusinessService';
import { getMesas, getClientes, getProductos } from '../services/api';
import type { Mesa, Cliente, Producto, Visita, Pedido } from '../types';
import { marked } from 'marked';

type TabType = 'asistente' | 'insights' | 'clientes' | 'inventario' | 'recomendaciones';

const AIBusinessDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('asistente');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  // AI Results
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [segmentos, setSegmentos] = useState<ClientSegment[]>([]);
  const [inventario, setInventario] = useState<InventoryPrediction[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<ProductRecommendation[]>([]);

  // Asistente
  const [pregunta, setPregunta] = useState('');
  const [respuestaAsistente, setRespuestaAsistente] = useState('');
  const [historialChat, setHistorialChat] = useState<{pregunta: string, respuesta: string}[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mesasRes, clientesRes, productosRes] = await Promise.all([
          getMesas(),
          getClientes(),
          getProductos()
        ]);
        if (mesasRes.data) setMesas(mesasRes.data);
        if (clientesRes.data) setClientes(clientesRes.data);
        if (productosRes.data) setProductos(productosRes.data);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  // Handlers
  const handleGetInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiBusinessService.getBusinessInsights([], [], mesas, 'semana');
      setInsights(result);
    } catch (err) {
      setError('Error al obtener insights');
    }
    setIsLoading(false);
  };

  const handleSegmentClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiBusinessService.segmentClients(clientes, []);
      setSegmentos(result);
    } catch (err) {
      setError('Error al segmentar clientes');
    }
    setIsLoading(false);
  };

  const handleGetInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiBusinessService.getPredictiveInventory(productos, []);
      setInventario(result);
    } catch (err) {
      setError('Error al predecir inventario');
    }
    setIsLoading(false);
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiBusinessService.getProductRecommendations(null, [], productos);
      setRecomendaciones(result);
    } catch (err) {
      setError('Error al obtener recomendaciones');
    }
    setIsLoading(false);
  };

  const handleAskAssistant = async () => {
    if (!pregunta.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const respuesta = await aiBusinessService.askAdminAssistant({
        pregunta,
        contexto: { mesas, clientes, productos }
      });
      setRespuestaAsistente(respuesta);
      setHistorialChat(prev => [...prev, { pregunta, respuesta }]);
      setPregunta('');
    } catch (err) {
      setError('Error al consultar asistente');
    }
    setIsLoading(false);
  };

  const preguntasRapidas = [
    '¿Cuántas mesas tenemos ocupadas?',
    '¿Cuál es el ticket promedio de hoy?',
    '¿Qué producto se vende más?',
    '¿Cuántos clientes nuevos esta semana?',
    '¿Cómo está el rendimiento del negocio?'
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-expendio-dark">Centro de Inteligencia IA</h1>
        <p className="text-gray-600 mt-1">Análisis inteligente y asistencia para tu negocio</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'asistente', label: 'Asistente IA', icon: '🤖' },
          { id: 'insights', label: 'Insights', icon: '📊' },
          { id: 'clientes', label: 'Segmentación', icon: '👥' },
          { id: 'inventario', label: 'Inventario', icon: '📦' },
          { id: 'recomendaciones', label: 'Recomendaciones', icon: '💡' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-expendio-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Asistente IA */}
      {activeTab === 'asistente' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Asistente Administrativo</h2>

                {/* Historial */}
                <div className="h-80 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-lg p-4">
                  {historialChat.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      <p className="text-4xl mb-2">🤖</p>
                      <p>¡Hola! Soy tu asistente de negocio.</p>
                      <p className="text-sm">Pregúntame sobre ventas, clientes, operaciones...</p>
                    </div>
                  ) : (
                    historialChat.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-end">
                          <div className="bg-expendio-primary text-white px-4 py-2 rounded-lg max-w-[80%]">
                            {item.pregunta}
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border px-4 py-2 rounded-lg max-w-[80%] prose prose-sm"
                               dangerouslySetInnerHTML={{ __html: marked(item.respuesta) }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pregunta}
                    onChange={(e) => setPregunta(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskAssistant()}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-expendio-primary focus:outline-none"
                  />
                  <Button onClick={handleAskAssistant} disabled={isLoading || !pregunta.trim()}>
                    {isLoading ? '...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Preguntas rápidas */}
          <div>
            <Card>
              <div className="p-4">
                <h3 className="font-bold mb-3">Preguntas Rápidas</h3>
                <div className="space-y-2">
                  {preguntasRapidas.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPregunta(p)}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="mt-4">
              <div className="p-4">
                <h3 className="font-bold mb-3">Estado Actual</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mesas</span>
                    <span className="font-medium">{mesas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ocupadas</span>
                    <span className="font-medium text-orange-600">
                      {mesas.filter(m => m.estado === 'Ocupada').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clientes</span>
                    <span className="font-medium">{clientes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Productos</span>
                    <span className="font-medium">{productos.length}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Insights */}
      {activeTab === 'insights' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Insights de Negocio</h2>
            <Button onClick={handleGetInsights} disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Generar Insights'}
            </Button>
          </div>

          {insights.length === 0 ? (
            <Card>
              <div className="p-10 text-center text-gray-500">
                <p className="text-4xl mb-2">📊</p>
                <p>Haz clic en "Generar Insights" para obtener análisis inteligente</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, idx) => (
                <Card key={idx}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        insight.tipo === 'oportunidad' ? 'bg-green-100 text-green-800' :
                        insight.tipo === 'alerta' ? 'bg-red-100 text-red-800' :
                        insight.tipo === 'tendencia' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {insight.tipo.toUpperCase()}
                      </span>
                      <span className={`text-xs ${
                        insight.impacto === 'alto' ? 'text-red-600 font-bold' :
                        insight.impacto === 'medio' ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        Impacto {insight.impacto}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{insight.titulo}</h3>
                    <p className="text-gray-600 text-sm mb-2">{insight.descripcion}</p>
                    {insight.accion && (
                      <p className="text-sm text-expendio-primary font-medium">
                        → {insight.accion}
                      </p>
                    )}
                    {insight.metrica && (
                      <p className="text-xs text-gray-400 mt-2">{insight.metrica}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Segmentación de Clientes */}
      {activeTab === 'clientes' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Segmentación de Clientes</h2>
            <Button onClick={handleSegmentClients} disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Segmentar Clientes'}
            </Button>
          </div>

          {segmentos.length === 0 ? (
            <Card>
              <div className="p-10 text-center text-gray-500">
                <p className="text-4xl mb-2">👥</p>
                <p>Haz clic en "Segmentar Clientes" para clasificar automáticamente</p>
                <p className="text-sm mt-1">{clientes.length} clientes disponibles para análisis</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {['vip', 'frecuente', 'regular', 'nuevo', 'en_riesgo', 'perdido'].map(seg => {
                  const count = segmentos.filter(s => s.segmento === seg).length;
                  const colors: Record<string, string> = {
                    vip: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    frecuente: 'bg-green-100 text-green-800 border-green-300',
                    regular: 'bg-blue-100 text-blue-800 border-blue-300',
                    nuevo: 'bg-purple-100 text-purple-800 border-purple-300',
                    en_riesgo: 'bg-orange-100 text-orange-800 border-orange-300',
                    perdido: 'bg-red-100 text-red-800 border-red-300'
                  };
                  return (
                    <div key={seg} className={`p-3 rounded-lg border ${colors[seg]}`}>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs uppercase">{seg.replace('_', ' ')}</div>
                    </div>
                  );
                })}
              </div>

              {/* Lista */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Cliente</th>
                        <th className="px-4 py-2 text-left">Segmento</th>
                        <th className="px-4 py-2 text-right">Score</th>
                        <th className="px-4 py-2 text-right">CLV</th>
                        <th className="px-4 py-2 text-right">Ticket Prom.</th>
                        <th className="px-4 py-2 text-left">Recomendaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segmentos.slice(0, 20).map((seg, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{seg.nombre}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              seg.segmento === 'vip' ? 'bg-yellow-100 text-yellow-800' :
                              seg.segmento === 'frecuente' ? 'bg-green-100 text-green-800' :
                              seg.segmento === 'en_riesgo' ? 'bg-orange-100 text-orange-800' :
                              seg.segmento === 'perdido' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {seg.segmento.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">{seg.score}</td>
                          <td className="px-4 py-2 text-right">${seg.valorVida?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">${typeof seg.ticketPromedio === 'number' ? seg.ticketPromedio.toFixed(0) : '0'}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {seg.recomendaciones?.[0] || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Inventario Predictivo */}
      {activeTab === 'inventario' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Inventario Predictivo</h2>
            <Button onClick={handleGetInventory} disabled={isLoading}>
              {isLoading ? 'Analizando...' : 'Predecir Inventario'}
            </Button>
          </div>

          {inventario.length === 0 ? (
            <Card>
              <div className="p-10 text-center text-gray-500">
                <p className="text-4xl mb-2">📦</p>
                <p>Haz clic en "Predecir Inventario" para ver alertas de stock</p>
                <p className="text-sm mt-1">{productos.length} productos en catálogo</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {inventario.map((item, idx) => (
                <Card key={idx}>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{item.nombre}</h3>
                      <p className="text-sm text-gray-600">
                        Stock: {item.stockActual} | Consumo diario: {typeof item.consumoPromedioDiario === 'number' ? item.consumoPromedioDiario.toFixed(1) : '0.0'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.urgencia === 'critico' ? 'bg-red-100 text-red-800' :
                        item.urgencia === 'alto' ? 'bg-orange-100 text-orange-800' :
                        item.urgencia === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.diasHastaAgotarse} días
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{item.recomendacion}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recomendaciones */}
      {activeTab === 'recomendaciones' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Recomendaciones de Productos</h2>
            <Button onClick={handleGetRecommendations} disabled={isLoading}>
              {isLoading ? 'Generando...' : 'Generar Recomendaciones'}
            </Button>
          </div>

          {recomendaciones.length === 0 ? (
            <Card>
              <div className="p-10 text-center text-gray-500">
                <p className="text-4xl mb-2">💡</p>
                <p>Haz clic en "Generar Recomendaciones" para sugerencias personalizadas</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recomendaciones.map((rec, idx) => (
                <Card key={idx}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{rec.nombre}</h3>
                      <span className="text-sm text-gray-500">{rec.confianza}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-expendio-primary h-2 rounded-full"
                        style={{ width: `${rec.confianza}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{rec.razon}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIBusinessDashboard;
