/**
 * Componente de debugging para cupones
 * Permite ver el estado de cupones y hacer pruebas manuales
 */

import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { supabase } from '../services/supabaseClient';

const CouponDebug: React.FC = () => {
  const [cupones, setCupones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const loadCupones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error cargando cupones:', error);
      } else {
        setCupones(data || []);
      }
    } catch (err) {
      console.error('Excepción:', err);
    } finally {
      setLoading(false);
    }
  };

  const testCanje = async (code: string) => {
    setTestResult(null);
    console.log('🧪 TEST: Intentando canjear código:', code);

    // Mostrar resultado inicial
    setTestResult({ success: false, step: 'starting', message: 'Iniciando test...' });

    try {
      // Paso 1: Buscar cupón
      console.log('🧪 TEST Paso 1: Buscando cupón...');
      const { data: coupon, error: searchError } = await supabase
        .from('cupones')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      console.log('🧪 TEST: Resultado búsqueda:', { coupon, searchError });

      if (searchError || !coupon) {
        console.error('❌ Error en búsqueda:', searchError);
        setTestResult({
          success: false,
          step: 'search',
          error: searchError,
          message: `No se encontró el cupón: ${searchError?.message || 'Unknown error'}`
        });
        return;
      }

      console.log('✅ Cupón encontrado:', coupon);

      // Paso 2: Verificar estado
      console.log('🧪 TEST Paso 2: Verificando estado...');
      if (coupon.status !== 'active') {
        console.warn('⚠️ Cupón no está activo:', coupon.status);
        setTestResult({
          success: false,
          step: 'status',
          coupon,
          message: `Cupón no está activo. Estado actual: ${coupon.status}`
        });
        return;
      }

      console.log('✅ Cupón está activo');

      // Paso 3: Intentar update
      console.log('🧪 TEST Paso 3: Intentando actualizar a redeemed...');
      const updateData = {
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
      };
      console.log('📝 Datos del update:', updateData);

      const { data: updated, error: updateError } = await supabase
        .from('cupones')
        .update(updateData)
        .eq('id', coupon.id)
        .eq('status', 'active')
        .select()
        .single();

      console.log('🧪 TEST: Resultado update:', { updated, updateError });

      if (updateError) {
        console.error('❌ Error en update:', updateError);
        console.error('❌ Detalles completos:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
      }

      setTestResult({
        success: !updateError && !!updated,
        step: 'update',
        coupon,
        updated,
        error: updateError,
        message: updateError
          ? `Error al actualizar: ${updateError.message}`
          : '✅ Cupón canjeado exitosamente!'
      });

      if (!updateError && updated) {
        console.log('✅ TEST EXITOSO: Cupón canjeado correctamente');
        // Recargar lista
        setTimeout(() => loadCupones(), 1000);
      }
    } catch (err: any) {
      console.error('🧪 TEST: Excepción:', err);
      console.error('🧪 Stack trace:', err.stack);
      setTestResult({
        success: false,
        step: 'exception',
        error: err,
        message: `Excepción: ${err.message || 'Unknown error'}`
      });
    }
  };

  useEffect(() => {
    loadCupones();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">🔧 Debug de Cupones</h1>

          {/* Test manual */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold mb-2">Test Manual de Canje</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                placeholder="EXP-XXXXXX"
                className="flex-1 px-4 py-2 border rounded font-mono"
              />
              <Button onClick={() => testCanje(testCode)} disabled={!testCode}>
                Probar Canje
              </Button>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg border-2 ${testResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{testResult.success ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResult.message || (testResult.success ? 'Éxito' : 'Error')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Paso: {testResult.step}
                    </p>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                    Ver detalles técnicos (JSON)
                  </summary>
                  <pre className="text-xs overflow-auto mt-2 p-2 bg-white rounded border">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Lista de cupones */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Últimos 10 Cupones</h3>
            <Button onClick={loadCupones} disabled={loading}>
              {loading ? 'Cargando...' : '🔄 Recargar'}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-expendio-primary mx-auto"></div>
            </div>
          ) : cupones.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay cupones registrados</p>
          ) : (
            <div className="space-y-3">
              {cupones.map((cupon) => (
                <div
                  key={cupon.id}
                  className={`p-4 border-2 rounded-lg ${
                    cupon.status === 'active' ? 'border-green-500 bg-green-50' :
                    cupon.status === 'redeemed' ? 'border-gray-400 bg-gray-50' :
                    'border-red-400 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-bold text-lg">{cupon.code}</p>
                      <p className="text-sm text-gray-600">
                        {cupon.prize_icon} {cupon.prize_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cliente: {cupon.cliente_nombre || cupon.cliente_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Creado: {new Date(cupon.created_at).toLocaleString('es-MX')}
                      </p>
                      {cupon.redeemed_at && (
                        <p className="text-xs text-gray-500">
                          Canjeado: {new Date(cupon.redeemed_at).toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        cupon.status === 'active' ? 'bg-green-500 text-white' :
                        cupon.status === 'redeemed' ? 'bg-gray-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {cupon.status.toUpperCase()}
                      </span>
                      {cupon.status === 'active' && (
                        <Button
                          onClick={() => testCanje(cupon.code)}
                          className="mt-2 text-xs"
                          size="sm"
                        >
                          Test Canje
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Info de conexión */}
      <Card>
        <div className="p-4">
          <h3 className="font-bold mb-2">🔌 Estado de Conexión</h3>
          <div className="text-xs font-mono space-y-1">
            <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ No configurado'}</p>
            <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CouponDebug;
