/**
 * Scanner de QR para que meseros/hostess canjeen cupones
 */

import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { supabase } from '../services/supabaseClient';

interface ScannedCoupon {
  type: string;
  coupon_code: string;
  coupon_id: string;
  prize_name: string;
  cliente_nombre?: string;
}

const CouponScanner: React.FC = () => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    coupon?: any;
  } | null>(null);

  const validateAndRedeemCoupon = async (code: string) => {
    setLoading(true);
    setResult(null);

    try {
      // Buscar cupón en la base de datos
      const { data: coupon, error } = await supabase
        .from('cupones')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !coupon) {
        setResult({
          success: false,
          message: 'Cupón no encontrado',
        });
        return;
      }

      // Verificar si ya fue canjeado
      if (coupon.status === 'redeemed') {
        setResult({
          success: false,
          message: `Este cupón ya fue canjeado el ${new Date(coupon.redeemed_at).toLocaleString('es-MX')}`,
        });
        return;
      }

      // Verificar si expiró
      if (coupon.status === 'expired' || new Date(coupon.expires_at) < new Date()) {
        setResult({
          success: false,
          message: 'Este cupón ya expiró',
        });
        return;
      }

      // Canjear cupón
      const { error: updateError } = await supabase
        .from('cupones')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', coupon.id);

      if (updateError) {
        throw updateError;
      }

      setResult({
        success: true,
        message: '¡Cupón canjeado exitosamente!',
        coupon,
      });
    } catch (err: any) {
      console.error('Error validando cupón:', err);
      setResult({
        success: false,
        message: 'Error al validar cupón',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      validateAndRedeemCoupon(manualCode.trim().toUpperCase());
    }
  };

  const handleScanQR = () => {
    // En producción, esto abriría la cámara para escanear
    alert('Funcionalidad de escaneo de QR próximamente. Por ahora usa el código manual.');
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-expendio-dark mb-2">
            Canjear Cupón
          </h1>
          <p className="text-gray-600 mb-6">
            Escanea el QR del cliente o ingresa el código manualmente
          </p>

          {/* Botón para escanear QR */}
          <div className="mb-6">
            <Button
              onClick={handleScanQR}
              fullWidth
              className="bg-expendio-primary hover:bg-expendio-dark h-16 text-lg"
            >
              📷 Escanear QR
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-gray-500 text-sm">O</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Entrada manual de código */}
          <form onSubmit={handleManualSubmit} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código del cupón
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="EXP-XXXXXX"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono"
                maxLength={12}
              />
              <Button
                type="submit"
                disabled={loading || !manualCode.trim()}
                className="px-6"
              >
                {loading ? 'Validando...' : 'Validar'}
              </Button>
            </div>
          </form>

          {/* Resultado */}
          {result && (
            <div
              className={`p-6 rounded-lg border-2 ${
                result.success
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="text-center">
                <div className="text-6xl mb-3">
                  {result.success ? '✅' : '❌'}
                </div>
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {result.message}
                </h3>

                {result.success && result.coupon && (
                  <div className="mt-4 space-y-2">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Premio:</p>
                      <p className="text-xl font-bold text-expendio-primary">
                        {result.coupon.prize_icon} {result.coupon.prize_name}
                      </p>
                    </div>
                    {result.coupon.cliente_nombre && (
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Cliente:</p>
                        <p className="text-lg font-semibold">
                          {result.coupon.cliente_nombre}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => {
                    setResult(null);
                    setManualCode('');
                  }}
                  fullWidth
                  className="mt-6"
                >
                  Canjear otro cupón
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CouponScanner;
