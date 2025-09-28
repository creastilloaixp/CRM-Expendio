import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import CheckIn from './components/CheckIn';
import Reservations from './components/Reservations';
import { supabaseMock } from './services/supabaseMock';

type View = 'login' | 'dashboard' | 'reports' | 'checkin' | 'reservations';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('login');
  const [checkInMesa, setCheckInMesa] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const parseHash = useCallback(() => {
    const hash = window.location.hash.substring(1);
    const [path, queryString] = hash.split('?');
    
    if (path.startsWith('/checkin')) {
      const params = new URLSearchParams(queryString);
      const mesa = params.get('mesa');
      setCheckInMesa(mesa);
      setCurrentView('checkin');
    } else if (isAuthenticated) {
      switch (path) {
        case '/dashboard':
          setCurrentView('dashboard');
          break;
        case '/reports':
          setCurrentView('reports');
          break;
        case '/reservations':
          setCurrentView('reservations');
          break;
        default:
          setCurrentView('dashboard');
      }
    } else {
      setCurrentView('login');
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => {
      window.removeEventListener('hashchange', parseHash);
    };
  }, [parseHash]);

  const handleLogin = async (password: string) => {
    const success = await supabaseMock.login(password);
    if (success) {
      setIsAuthenticated(true);
      window.location.hash = '/dashboard';
    } else {
      alert('Contraseña incorrecta.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    window.location.hash = '/login';
  };
  
  const navigate = (view: 'dashboard' | 'reports' | 'reservations') => {
      window.location.hash = `/${view}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10 text-expendio-dark">Cargando...</div>;
    }

    if (currentView === 'checkin') {
      return <CheckIn mesaName={checkInMesa} />;
    }

    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <Reports />;
      case 'reservations':
        return <Reservations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-expendio-bg font-sans text-expendio-dark">
      <Header 
        isAuthenticated={isAuthenticated} 
        onLogout={handleLogout} 
        onNavigate={navigate}
        currentView={currentView}
      />
      <main className="p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;