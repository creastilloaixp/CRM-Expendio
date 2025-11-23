/**
 * Scanner de QR para que meseros/hostess canjeen cupones
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { supabase } from '../services/supabaseClient';
import { BrowserMultiFormatReader } from '@zxing/library';

interface CouponScannerProps {
  initialCode?: string | null;
}

const CouponScanner: React.FC<CouponScannerProps> = ({ initialCode }) => {
  const [manualCode, setManualCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    coupon?: any;
  } | null>(null);

  // Estados para scanner de cámara
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Auto-validar si viene un código en la URL
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      console.log('📱 Auto-validando código desde QR:', initialCode);
      validateAndRedeemCoupon(initialCode.trim().toUpperCase());
    }
  }, [initialCode]);

  const validateAndRedeemCoupon = async (code: string) => {
    setLoading(true);
    setResult(null);

    try {
      // Buscar cupón en la base de datos
      const { data: coupon, error } = await supabase
        .from('cupones')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !coupon) {
        setResult({
          success: false,
          message: '❌ Cupón no encontrado. Verifica el código.',
        });
        return;
      }

      // 🔒 ANTI-FRAUDE: Verificar si ya fue canjeado
      if (coupon.status === 'redeemed') {
        const fecha = new Date(coupon.redeemed_at).toLocaleString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        setResult({
          success: false,
          message: `⛔ Este cupón ya fue canjeado el ${fecha}`,
        });
        return;
      }

      // 🔒 ANTI-FRAUDE: Verificar si expiró (30 días)
      if (coupon.status === 'expired' || new Date(coupon.expires_at) < new Date()) {
        setResult({
          success: false,
          message: '⏰ Este cupón ya expiró. Los cupones son válidos por 30 días.',
        });
        return;
      }

      // 🔒 ANTI-FRAUDE: Canjear cupón con condición (atomic update)
      // Esto previene race conditions si dos meseros escanean al mismo tiempo
      const { data: updatedCoupon, error: updateError } = await supabase
        .from('cupones')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', coupon.id)
        .eq('status', 'active') // Solo actualiza si sigue activo
        .select()
        .single();

      if (updateError || !updatedCoupon) {
        console.error('Error al canjear:', updateError);
        setResult({
          success: false,
          message: '⚠️ No se pudo canjear. Es posible que ya haya sido usado.',
        });
        return;
      }

      // ✅ ÉXITO
      setResult({
        success: true,
        message: '✅ ¡Cupón canjeado exitosamente!',
        coupon: updatedCoupon,
      });
    } catch (err: any) {
      console.error('Error validando cupón:', err);
      setResult({
        success: false,
        message: '🔴 Error de conexión. Intenta de nuevo.',
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

  // Iniciar escaneo con cámara
  const handleScanQR = async () => {
    setIsScanning(true);
    setCameraError('');
    setResult(null);

    try {
      codeReaderRef.current = new BrowserMultiFormatReader();
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setCameraError('No se detectó ninguna cámara en tu dispositivo');
        setIsScanning(false);
        return;
      }

      // Usar la cámara trasera si está disponible (mejor para móviles)
      const selectedDevice = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('trasera')
      ) || videoInputDevices[0];

      // Iniciar escaneo continuo
      codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            // QR detectado
            const qrText = result.getText();
            console.log('📷 QR detectado:', qrText);

            // Extraer código del QR (puede venir como URL)
            let code = qrText;
            if (qrText.includes('code=')) {
              const urlParams = new URLSearchParams(qrText.split('?')[1]);
              code = urlParams.get('code') || qrText;
            }

            // Detener escaneo
            stopScanning();

            // Validar cupón
            validateAndRedeemCoupon(code.trim().toUpperCase());
          }

          if (error && !(error.name === 'NotFoundException')) {
            // Ignorar NotFoundException (no hay QR en el frame)
            console.error('Error escaneando:', error);
          }
        }
      );
    } catch (err: any) {
      console.error('Error iniciando cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  // Detener escaneo
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

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

          {/* Scanner de QR con cámara */}
          {isScanning ? (
            <div className="mb-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Marco de escaneo */}
                  <div className="border-4 border-expendio-primary w-64 h-64 rounded-lg shadow-lg">
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <p className="text-white bg-black/50 px-4 py-2 rounded-lg text-sm">
                        Enfoca el código QR
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={stopScanning}
                fullWidth
                className="mt-4 bg-gray-600 hover:bg-gray-700"
              >
                ✕ Cancelar Escaneo
              </Button>
              {cameraError && (
                <p className="text-red-600 text-sm mt-2 text-center">{cameraError}</p>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <Button
                onClick={handleScanQR}
                fullWidth
                className="bg-expendio-primary hover:bg-expendio-dark h-16 text-lg"
                disabled={loading}
              >
                📷 Escanear QR con Cámara
              </Button>
            </div>
          )}

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
