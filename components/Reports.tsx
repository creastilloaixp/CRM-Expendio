
import React, { useState, useCallback } from 'react';
import type { Visita } from '../types';
import { supabaseMock } from '../services/supabaseMock';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';
import AIAssistant from './AIAssistant';

const Reports: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [visits, setVisits] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleFetchReports = useCallback(async () => {
    setLoading(true);
    setReportGenerated(false);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const data = await supabaseMock.getVisitsByDateRange(start, end);
    setVisits(data);
    setLoading(false);
    setReportGenerated(true);
  }, [startDate, endDate]);

  const downloadCSV = () => {
    if (visits.length === 0) return;

    const headers = "Mesa,Cliente,Email,Personas,Consumo Total,Fecha Llegada,Hora Llegada,Fecha Salida,Hora Salida";
    const rows = visits.map(v => {
      const llegada = new Date(v.hora_llegada);
      const salida = v.hora_salida ? new Date(v.hora_salida) : null;
      return [
        v.mesa?.nombre || 'N/A',
        `"${v.cliente?.nombre || 'N/A'}"`,
        v.cliente?.email || 'N/A',
        v.numero_personas,
        v.consumo_total || 0,
        llegada.toLocaleDateString('es-MX'),
        llegada.toLocaleTimeString('es-MX'),
        salida ? salida.toLocaleDateString('es-MX') : 'N/A',
        salida ? salida.toLocaleTimeString('es-MX') : 'N/A'
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_expendio_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value?: number | null) => {
    return (value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-expendio-dark mb-4">Reporte de Visitas</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg">
          <Input id="startDate" label="Fecha de Inicio" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input id="endDate" label="Fecha de Fin" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <Button onClick={handleFetchReports} disabled={loading}>
            {loading ? 'Cargando...' : 'Generar Reporte'}
          </Button>
        </div>

        {loading ? <p className="text-center py-8">Cargando reporte...</p> : (
          reportGenerated && (
            <>
              {visits.length > 0 && (
                <div className="mb-4">
                  <Button onClick={downloadCSV} variant="secondary">
                    Exportar a CSV
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                {visits.length > 0 ? (
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3">Mesa</th>
                        <th scope="col" className="px-6 py-3">Cliente</th>
                        <th scope="col" className="px-6 py-3">Personas</th>
                        <th scope="col" className="px-6 py-3">Consumo</th>
                        <th scope="col" className="px-6 py-3">Llegada</th>
                        <th scope="col" className="px-6 py-3">Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map(v => (
                        <tr key={v.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-bold text-expendio-dark">{v.mesa?.nombre}</td>
                          <td className="px-6 py-4">
                              <div>{v.cliente?.nombre}</div>
                              <div className="text-xs text-gray-400">{v.cliente?.email}</div>
                          </td>
                          <td className="px-6 py-4">{v.numero_personas}</td>
                          <td className="px-6 py-4 font-semibold">{formatCurrency(v.consumo_total)}</td>
                          <td className="px-6 py-4">{new Date(v.hora_llegada).toLocaleString('es-MX')}</td>
                          <td className="px-6 py-4">{v.hora_salida ? new Date(v.hora_salida).toLocaleString('es-MX') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center text-gray-500 py-8">No hay visitas en el rango de fechas seleccionado.</p>
                }
              </div>
              
              {visits.length > 0 && (
                <AIAssistant visits={visits} />
              )}
            </>
          )
        )}
      </div>
    </Card>
  );
};

export default Reports;
