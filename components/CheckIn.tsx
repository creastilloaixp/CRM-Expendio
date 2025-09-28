import React, { useState } from 'react';
import type { NewVisita } from '../types';
import { supabaseMock } from '../services/supabaseMock';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';


interface CheckInProps {
  mesaName: string | null;
}

const CheckIn: React.FC<CheckInProps> = ({ mesaName }) => {
  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteEmail: '',
    numeroPersonas: 1,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesaName) {
        setStatus('error');
        setMessage('Error: No se ha especificado una mesa.');
        return;
    }
    setStatus('loading');
    const checkInData: NewVisita = { ...formData, mesaNombre: mesaName };
    const result = await supabaseMock.handleCheckIn(checkInData);
    setMessage(result.message);
    if(result.success) {
        setStatus('success');
    } else {
        setStatus('error');
    }
  };

  if (!mesaName) {
    return (
        <div className="max-w-md mx-auto mt-10">
            <Card>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-expendio-red mb-4">Error de Check-in</h2>
                    <p>El código QR no es válido o está incompleto. Por favor, avisa a nuestro personal.</p>
                </div>
            </Card>
        </div>
    );
  }
  
  if (status === 'success') {
      return (
        <div className="max-w-md mx-auto mt-10">
            <Card>
                <div className="p-8 text-center">
                    <h2 className="text-3xl font-display text-expendio-teal mb-4">¡Listo!</h2>
                    <p className="text-lg">{message}</p>
                </div>
            </Card>
        </div>
      );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-expendio-dark">Bienvenido a</h2>
            <h1 className="font-display text-4xl text-expendio-red tracking-wide">EXPENDIO</h1>
            <p className="text-xl font-semibold mt-4">Estás haciendo check-in en la mesa: <span className="font-bold text-expendio-teal text-2xl">{mesaName}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input id="clienteNombre" label="Nombre Completo" value={formData.clienteNombre} onChange={handleChange} required />
            <Input id="clienteEmail" label="Email" type="email" value={formData.clienteEmail} onChange={handleChange} required />
            <Input id="numeroPersonas" label="Número de Personas" type="number" value={formData.numeroPersonas} onChange={handleChange} min={1} required />
            
            <div className="flex items-start space-x-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 text-expendio-teal focus:ring-expendio-teal border-gray-300 rounded mt-1"
                aria-describedby="terms-description"
              />
              <div className="text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  Términos y Promociones
                </label>
                <p id="terms-description" className="text-gray-500">
                  Acepto los Términos y Condiciones y deseo recibir promociones.
                </p>
              </div>
            </div>

            <Button type="submit" fullWidth disabled={status === 'loading' || !agreedToTerms}>
              {status === 'loading' ? 'Registrando...' : 'Confirmar Check-in'}
            </Button>
            {status === 'error' && <p className="text-red-600 text-center mt-4">{message}</p>}
          </form>
        </div>
      </Card>
    </div>
  );
};

export default CheckIn;