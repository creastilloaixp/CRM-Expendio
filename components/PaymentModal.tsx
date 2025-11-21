import React, { useState } from 'react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { PAYMENT_METHODS, PaymentMethod, registerCashPayment } from '../services/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  mesaNombre: string;
  visitaId: string;
  onPaymentComplete: (method: PaymentMethod, paymentId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  mesaNombre,
  visitaId,
  onPaymentComplete
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const cambio = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0;
  const canPay = selectedMethod === 'cash'
    ? parseFloat(cashReceived) >= total
    : true;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      if (selectedMethod === 'cash') {
        const result = await registerCashPayment(visitaId, total, cambio);
        if (result.success && result.paymentId) {
          onPaymentComplete('cash', result.paymentId);
        }
      } else if (selectedMethod === 'card') {
        // TODO: Integrar Stripe Elements para tarjeta
        // Por ahora simular éxito
        onPaymentComplete('card', `card_${Date.now()}`);
      } else if (selectedMethod === 'transfer') {
        // Mostrar datos de transferencia y confirmar manualmente
        onPaymentComplete('transfer', `transfer_${Date.now()}`);
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-expendio-dark">Cobrar - Mesa {mesaNombre}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500 text-sm">Total a cobrar</p>
            <p className="text-4xl font-bold text-expendio-primary">${total.toFixed(2)}</p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.value}
                  onClick={() => setSelectedMethod(method.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedMethod === method.value
                      ? 'border-expendio-primary bg-expendio-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block">{method.icon}</span>
                  <span className="text-sm">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Efectivo */}
          {selectedMethod === 'cash' && (
            <div className="space-y-3">
              <Input
                id="cashReceived"
                label="Efectivo recibido"
                type="number"
                placeholder="0.00"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
              />
              {parseFloat(cashReceived) >= total && (
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Cambio a devolver</p>
                  <p className="text-2xl font-bold text-green-600">${cambio.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta */}
          {selectedMethod === 'card' && (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-blue-800">
                💳 Terminal de pago lista
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Procesa el pago en la terminal y confirma
              </p>
            </div>
          )}

          {/* Transferencia */}
          {selectedMethod === 'transfer' && (
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <p className="font-medium text-purple-800">📱 Datos para transferencia:</p>
              <div className="text-sm text-purple-700">
                <p><strong>CLABE:</strong> 012345678901234567</p>
                <p><strong>Banco:</strong> BBVA</p>
                <p><strong>Beneficiario:</strong> Expendio</p>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Verifica que el cliente haya enviado el comprobante
              </p>
            </div>
          )}

          {/* Botón de confirmar */}
          <Button
            onClick={handlePayment}
            fullWidth
            disabled={!canPay || isProcessing}
          >
            {isProcessing ? 'Procesando...' : `Confirmar Pago - $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
