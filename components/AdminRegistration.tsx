import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';

interface AdminRegistrationProps {
  onRegister: (email: string, password: string) => Promise<void>;
  onCancel: () => void;
}

const AdminRegistration: React.FC<AdminRegistrationProps> = ({ onRegister, onCancel }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el administrador');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-expendio-dark mb-2">Registro de Administrador</h2>
          <p className="text-center text-gray-500 mb-6">Crea una cuenta de administrador para acceder al sistema</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuempresa.com"
              label="Email del Administrador"
              required
            />
            
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              label="Contraseña"
              required
            />
            
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              label="Confirmar Contraseña"
              required
            />
            
            <div className="flex gap-3">
              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Administrador'}
              </Button>
              
              <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AdminRegistration;