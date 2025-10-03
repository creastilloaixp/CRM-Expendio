import React, { useState, useEffect } from 'react';
import { supabaseMock } from '../services/supabaseMock';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';

interface CheckInProps {
  mesaName: string | null;
}

type CheckInStatus = 'checking_session' | 'show_form' | 'sending_otp' | 'awaiting_otp' | 'verifying_otp' | 'creating_visit' | 'error';

const CheckIn: React.FC<CheckInProps> = ({ mesaName }) => {
  const [status, setStatus] = useState<CheckInStatus>('checking_session');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    termsAccepted: false,
    marketingOptIn: false,
  });
  const [otp, setOtp] = useState('');
  const [pendingOtpId, setPendingOtpId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!mesaName) {
      setMessage('El código QR no es válido o está incompleto. Por favor, avisa a nuestro personal.');
      setStatus('error');
      return;
    }
    
    const checkSessionAndProceed = async () => {
      const user = await supabaseMock.getCurrentUser();
      if (user) {
        setStatus('creating_visit');
        // Default to 1 person for returning users
        const result = await supabaseMock.startVisit(mesaName, 1);
        if (result.success) {
          window.location.hash = `/menu?mesa=${mesaName}`;
        } else {
          setMessage(result.message);
          setStatus('error');
        }
      } else {
        setStatus('show_form');
      }
    };
    
    checkSessionAndProceed();
  }, [mesaName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Age verification
    const birthDate = new Date(formData.fechaNacimiento);
    if (!formData.fechaNacimiento || isNaN(birthDate.getTime())) {
      setMessage('Por favor, ingresa una fecha de nacimiento válida.');
      return;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 18) {
        setMessage('Debes ser mayor de 18 años para registrarte.');
        return;
    }

    setStatus('sending_otp');
    const { nombre, email, telefono, fechaNacimiento, marketingOptIn } = formData;
    const result = await supabaseMock.startLoginWithOtp({ nombre, email, telefono, fechaNacimiento, marketingOptIn });
    
    if (result.success && result.pendingOtpId) {
      setPendingOtpId(result.pendingOtpId);
      setMessage(result.message);
      setStatus('awaiting_otp');
    } else {
      setMessage(result.message || 'Hubo un error al enviar el código.');
      setStatus('show_form'); // Go back to form on error
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('verifying_otp');
    const result = await supabaseMock.verifyOtp(pendingOtpId, otp);
    if (result.success) {
      setStatus('creating_visit');
      // Default to 1 person for new users
      const visitResult = await supabaseMock.startVisit(mesaName!, 1);
      if (visitResult.success) {
        window.location.hash = `/menu?mesa=${mesaName}`;
      } else {
        setMessage(visitResult.message);
        setStatus('error');
      }
    } else {
      setMessage(result.message);
      setStatus('awaiting_otp'); // Stay on OTP screen but show error
    }
  };

  const renderHeader = () => (
    <div className="text-center mb-6">
      <h2 className="text-3xl font-bold text-expendio-dark">Bienvenido a</h2>
      <h1 className="font-display text-4xl text-expendio-red tracking-wide">EXPENDIO</h1>
      <p className="text-xl font-semibold mt-4">Estás haciendo check-in en la mesa: <span className="font-bold text-expendio-teal text-2xl">{mesaName}</span></p>
    </div>
  );

  const renderContent = () => {
    switch (status) {
      case 'checking_session':
      case 'creating_visit':
        return <div className="text-center p-12">Verificando...</div>;

      case 'show_form':
      case 'sending_otp':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input id="nombre" label="Nombre Completo" value={formData.nombre} onChange={handleChange} required />
            <Input id="email" label="Correo Electrónico" type="email" value={formData.email} onChange={handleChange} required />
            <Input id="telefono" label="Teléfono" type="tel" value={formData.telefono} onChange={handleChange} required placeholder="10 dígitos" />
            <Input id="fechaNacimiento" label="Fecha de Nacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} required />
            
            <div className="flex items-start space-x-3 pt-2">
              <input id="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleChange} className="h-4 w-4 text-expendio-teal focus:ring-expendio-teal border-gray-300 rounded mt-1"/>
              <div>
                <label htmlFor="termsAccepted" className="font-medium text-gray-700">Términos y Privacidad</label>
                <p className="text-gray-500 text-sm">Acepto los <a href="#" onClick={(e) => e.preventDefault()} className="underline hover:text-expendio-teal">Términos y Condiciones</a> y la <a href="#" onClick={(e) => e.preventDefault()} className="underline hover:text-expendio-teal">Política de Privacidad</a>.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input id="marketingOptIn" type="checkbox" checked={formData.marketingOptIn} onChange={handleChange} className="h-4 w-4 text-expendio-teal focus:ring-expendio-teal border-gray-300 rounded mt-1"/>
              <div>
                <label htmlFor="marketingOptIn" className="font-medium text-gray-700">Promociones</label>
                <p className="text-gray-500 text-sm">Deseo recibir promociones y noticias.</p>
              </div>
            </div>
            
            {message && status === 'show_form' && <p className="text-red-600 text-sm text-center font-semibold pt-2">{message}</p>}

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={status === 'sending_otp' || !formData.termsAccepted}>
                {status === 'sending_otp' ? 'Enviando...' : 'Verificar y Continuar'}
              </Button>
            </div>
          </form>
        );

      case 'awaiting_otp':
      case 'verifying_otp':
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
             <p className="text-center text-gray-600">{message}</p>
             <p className="text-center text-sm text-gray-400">El código de prueba es '123456'.</p>
            <Input id="otp" label="Código de 6 dígitos" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} inputMode="numeric" />
            <Button type="submit" fullWidth disabled={status === 'verifying_otp'}>
              {status === 'verifying_otp' ? 'Verificando...' : 'Confirmar Check-in'}
            </Button>
            {status === 'awaiting_otp' && message.includes('incorrecto') && <p className="text-red-600 text-sm text-center">{message}</p>}
          </form>
        );

      case 'error':
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-expendio-red mb-4">Error</h2>
            <p>{message}</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 sm:mt-8">
      <Card>
        <div className="p-6">
          {renderHeader()}
          {renderContent()}
        </div>
      </Card>
    </div>
  );
};

export default CheckIn;