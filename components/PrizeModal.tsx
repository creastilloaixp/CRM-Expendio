import React, { useState, useEffect } from 'react';
import { Button } from './common/Button';
import SpinWheel, { DEFAULT_PRIZES } from './SpinWheel';
import type { Prize } from './SpinWheel';
import { createCoupon, getWhatsAppUrl, BUSINESS_CONFIG, PRIZES } from '../services/prizeService';
import type { Coupon } from '../services/prizeService';

// Error boundary simple
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-center p-4"><p>Error al cargar. <button onClick={() => window.location.reload()} className="underline">Recargar</button></p></div>;
    }
    return this.props.children;
  }
}

interface PrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  onPrizeAwarded?: (prize: Prize, coupon: Coupon) => void;
}

type ModalStep = 'spin' | 'result' | 'claim';

const PrizeModal: React.FC<PrizeModalProps> = ({
  isOpen,
  onClose,
  clienteId,
  clienteNombre,
  clienteTelefono,
  onPrizeAwarded
}) => {
  const [step, setStep] = useState<ModalStep>('spin');
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('spin');
      setWonPrize(null);
      setCoupon(null);
    }
  }, [isOpen]);

  const handleSpinComplete = async (prize: Prize) => {
    setWonPrize(prize);

    // Crear cupón si no es "suerte para la próxima"
    if (prize.id !== 'suerte') {
      setIsCreatingCoupon(true);
      const fullPrize = PRIZES.find(p => p.id === prize.id) || prize;
      const { data } = await createCoupon(fullPrize, clienteId, clienteNombre, clienteTelefono);
      if (data) {
        setCoupon(data);
        onPrizeAwarded?.(prize, data);
      }
      setIsCreatingCoupon(false);
    }

    // Mostrar resultado después de un momento
    setTimeout(() => setStep('result'), 500);
  };

  const handleClaimPrize = () => {
    setStep('claim');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gradient-to-b from-expendio-bg to-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-expendio-dark text-white p-4 text-center">
          <h2 className="text-2xl font-display">
            {step === 'spin' && '🎰 ¡Gira la Ruleta!'}
            {step === 'result' && '🎉 ¡Resultado!'}
            {step === 'claim' && '🎁 Reclama tu Premio'}
          </h2>
        </div>

        <div className="p-6">
          {/* Step: Spin */}
          {step === 'spin' && (
            <div className="flex flex-col items-center">
              <p className="text-gray-600 mb-4 text-center">
                ¡Gracias por visitarnos! Gira la ruleta y gana premios increíbles
              </p>
              <SpinWheel
                prizes={DEFAULT_PRIZES}
                onSpinComplete={handleSpinComplete}
              />
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && wonPrize && (
            <div className="text-center space-y-6">
              <div className="text-8xl animate-bounce">{wonPrize.icon}</div>

              {wonPrize.id === 'suerte' ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-700">
                    ¡Suerte para la próxima!
                  </h3>
                  <p className="text-gray-500">
                    No te preocupes, en tu próxima visita tendrás otra oportunidad
                  </p>
                  <Button onClick={onClose} fullWidth>
                    Continuar
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-expendio-dark">
                    ¡Ganaste {wonPrize.name}!
                  </h3>

                  {coupon && (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Tu código de cupón:</p>
                      <p className="text-3xl font-mono font-bold text-expendio-primary tracking-wider">
                        {coupon.code}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Válido hasta: {new Date(coupon.expires_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  )}

                  <Button onClick={handleClaimPrize} fullWidth>
                    🎁 Reclamar Premio
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step: Claim */}
          {step === 'claim' && wonPrize && coupon && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  Reclama tu premio por WhatsApp o síguenos en redes
                </p>
              </div>

              {/* Cupón */}
              <div className="bg-gradient-to-r from-expendio-primary to-expendio-red p-4 rounded-lg text-white text-center">
                <p className="text-sm opacity-80">Cupón</p>
                <p className="text-2xl font-mono font-bold">{coupon.code}</p>
                <p className="text-lg">{wonPrize.icon} {wonPrize.name}</p>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                {/* WhatsApp - Principal */}
                <a
                  href={getWhatsAppUrl(coupon, wonPrize as any)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button fullWidth className="bg-green-500 hover:bg-green-600">
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Reclamar por WhatsApp
                    </span>
                  </Button>
                </a>

                {/* Instagram */}
                <a
                  href={`https://instagram.com/${BUSINESS_CONFIG.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button fullWidth variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-50">
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Síguenos en Instagram
                    </span>
                  </Button>
                </a>

                {/* Google Maps */}
                <a
                  href={BUSINESS_CONFIG.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button fullWidth variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C7.802 0 4 3.403 4 7.602 4 11.8 7.469 16.812 12 24c4.531-7.188 8-12.2 8-16.398C20 3.403 16.199 0 12 0zm0 11a3 3 0 110-6 3 3 0 010 6z"/>
                      </svg>
                      Ver Ubicación
                    </span>
                  </Button>
                </a>
              </div>

              {/* Cerrar */}
              <button
                onClick={onClose}
                className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700"
              >
                Cerrar y continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrizeModal;
