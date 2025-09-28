
import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';

interface LoginProps {
  onLogin: (password: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('loading');
    await onLogin(password);
    setIsLoading('');
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-expendio-dark mb-2">Acceso Personal</h2>
          <p className="text-center text-gray-500 mb-6">Ingresa tu contraseña para continuar.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              label="Contraseña"
              required
            />
            <Button type="submit" fullWidth disabled={isLoading === 'loading'}>
              {isLoading === 'loading' ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <p className="text-xs text-center text-gray-400 pt-2">Hint: la contraseña es '1234'</p>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Login;
