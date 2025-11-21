import React, { useState, useEffect, useMemo } from 'react';
import type { Visita } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import AIAssistant from './AIAssistant';

const KPICard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <Card className="p-4 text-center">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-4xl font-bold text-expendio-dark mt-1">{value}</p>
    </Card>
);

const BarChart: React.FC<{ title: string; data: { label: string; value: number }[]; yLabel?: string; }> = ({ title, data, yLabel }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-bold text-expendio-dark mb-2">{title}</h3>
            <div className="flex-grow flex items-end space-x-2 pt-4">
                {data.map(({ label, value }) => (
                    <div key={label} className="flex-1 flex flex-col items-center justify-end group">
                        <div className="text-xs font-bold text-expendio-dark opacity-0 group-hover:opacity-100 transition-opacity">{yLabel}{value.toLocaleString('es-MX')}</div>
                        <div
                            className="w-full bg-expendio-teal/60 hover:bg-expendio-teal rounded-t-md transition-colors"
                            style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                        />
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const Analytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [visits, setVisits] = useState<Visita[]>([]);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    });

    useEffect(() => {
        const fetchVisits = async () => {
            setLoading(true);
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            const { supabaseMock } = await import('../services/supabaseMock');
            const data = await supabaseMock.getVisitsByDateRange(start, end);
            setVisits(data);
            setLoading(false);
        };
        fetchVisits();
    }, [dateRange]);

    const {
        totalRevenue,
        totalVisits,
        avgSpend,
        avgPartySize,
        visitsByDayOfWeek,
        visitsByHour,
        topCustomers
    } = useMemo(() => {
        const revenue = visits.reduce((acc, v) => acc + (v.consumo_total || 0), 0);
        const numVisits = visits.length;

        // Group visits by day of the week
        const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        visits.forEach(v => {
            const day = new Date(v.hora_llegada).getDay();
            dayOfWeekCounts[day]++;
        });
        const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayOfWeekData = dayOfWeekCounts.map((value, i) => ({ label: dayLabels[i], value }));
        
        // Group visits by hour
        const hourCounts = Array(24).fill(0);
        visits.forEach(v => {
            const hour = new Date(v.hora_llegada).getHours();
            hourCounts[hour]++;
        });
        const hourData = hourCounts.map((value, i) => ({ label: `${i}h`, value })).slice(10, 24); // Filter for relevant hours
        
        // Top customers
        const customerData: { [id: string]: { name: string; visits: number; spend: number } } = {};
        visits.forEach(v => {
            if (v.cliente_id && v.cliente) {
                if (!customerData[v.cliente_id]) {
                    customerData[v.cliente_id] = { name: v.cliente.nombre, visits: 0, spend: 0 };
                }
                customerData[v.cliente_id].visits++;
                customerData[v.cliente_id].spend += v.consumo_total || 0;
            }
        });
        const sortedCustomers = Object.values(customerData).sort((a,b) => b.spend - a.spend).slice(0, 5);


        return {
            totalRevenue: revenue,
            totalVisits: numVisits,
            avgSpend: numVisits > 0 ? revenue / numVisits : 0,
            avgPartySize: numVisits > 0 ? visits.reduce((acc, v) => acc + v.numero_personas, 0) / numVisits : 0,
            visitsByDayOfWeek: dayOfWeekData,
            visitsByHour: hourData,
            topCustomers: sortedCustomers
        };
    }, [visits]);
    
    const formatCurrency = (value: number) => value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    
    const aiSystemPrompt = `Eres un estratega de negocios y científico de datos para el restaurante 'Expendio Cervecería Popular'. Analiza los datos de visitas y proporciona insights accionables y estratégicos. Piensa en tendencias, oportunidades de marketing, optimización de personal y formas de aumentar ingresos. Sé proactivo en tus recomendaciones. Responde en español y usa markdown.`;
    const aiSuggestions = [
        "Resume las tendencias clave de este período",
        "¿Qué día fue el más concurrido y por qué?",
        "Sugiere una promoción basada en nuestras horas más lentas",
        "¿Qué podemos hacer para aumentar el consumo promedio?"
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-expendio-dark">Dashboard Analítico</h2>

            <Card>
                <div className="p-4 flex flex-wrap items-center gap-4">
                    <p className="font-semibold">Rango de Fechas:</p>
                    <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2"/>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2"/>
                </div>
            </Card>
            
            {loading ? <p className="text-center py-10">Cargando análisis...</p> : visits.length === 0 ? <p className="text-center py-10">No hay datos de visitas en el rango seleccionado.</p> : (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Ingresos Totales" value={formatCurrency(totalRevenue)} />
                    <KPICard title="Visitas Totales" value={totalVisits.toLocaleString('es-MX')} />
                    <KPICard title="Consumo Promedio" value={formatCurrency(avgSpend)} />
                    <KPICard title="Personas por Visita" value={avgPartySize.toFixed(1)} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChart title="Visitas por Día de la Semana" data={visitsByDayOfWeek} />
                    <BarChart title="Horas Pico (Visitas por Hora)" data={visitsByHour} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                   <div className="lg:col-span-2">
                       <Card className="p-4 h-full">
                           <h3 className="text-lg font-bold text-expendio-dark mb-4">Top 5 Clientes (por consumo)</h3>
                           <ul className="space-y-3">
                               {topCustomers.map(c => (
                                   <li key={c.name} className="flex justify-between items-center text-sm">
                                       <div>
                                           <p className="font-semibold text-expendio-dark">{c.name}</p>
                                           <p className="text-gray-500">{c.visits} visitas</p>
                                       </div>
                                       <p className="font-bold text-expendio-teal">{formatCurrency(c.spend)}</p>
                                   </li>
                               ))}
                           </ul>
                       </Card>
                   </div>
                   <div className="lg:col-span-3">
                       <AIAssistant visits={visits} systemPrompt={aiSystemPrompt} suggestions={aiSuggestions} />
                   </div>
                </div>
            </>
            )}
        </div>
    );
};

export default Analytics;
