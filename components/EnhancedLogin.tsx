import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';

interface EnhancedLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  defaultEmail?: string;
}

const EnhancedLogin: React.FC<EnhancedLoginProps> = ({ 
  onLogin, 
  onRegister, 
  defaultEmail = '' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
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
      // After successful registration, switch to login mode
      setMode('login');
      setError('');
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
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('login')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-expendio-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-expendio-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Registrar Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-bold text-center text-expendio-dark mb-2">Acceso Personal</h2>
              <p className="text-center text-gray-500 mb-6">Ingresa tus credenciales para continuar.</p>
              
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tuempresa.com"
                label="Email"
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
              
              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-2xl font-bold text-center text-expendio-dark mb-2">Registro de Administrador</h2>
              <p className="text-center text-gray-500 mb-6">Crea una cuenta de administrador para acceder al sistema.</p>
              
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
              
              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Administrador'}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EnhancedLogin;