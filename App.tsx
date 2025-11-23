import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import { staffLogin } from './services/api';
import { adminRegistration } from './services/adminRegistration';
import { supabase } from './services/supabaseClient';

// Lazy loading de componentes para mejorar performance
const EnhancedLogin = lazy(() => import('./components/EnhancedLogin'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Reports = lazy(() => import('./components/Reports'));
const CheckIn = lazy(() => import('./components/CheckIn'));
const Reservations = lazy(() => import('./components/Reservations'));
const Menu = lazy(() => import('./components/MenuWithCart'));
const Analytics = lazy(() => import('./components/Analytics'));
const CouponScanner = lazy(() => import('./components/CouponScanner'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const VoiceAssistant = lazy(() => import('./components/VoiceAssistant'));
const Clientes = lazy(() => import('./components/Clientes'));
const Kitchen = lazy(() => import('./components/Kitchen'));
const AIBusinessDashboard = lazy(() => import('./components/AIBusinessDashboard'));

type View = 'login' | 'dashboard' | 'reports' | 'checkin' | 'reservations' | 'menu' | 'analytics' | 'chatbot' | 'voice-assistant' | 'clientes' | 'kitchen' | 'ai-dashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('login');
  const [checkInMesa, setCheckInMesa] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verificar sesión existente al cargar y escuchar cambios
  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
      }
    };
    checkSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        window.location.hash = '/login';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const parseHash = useCallback(() => {
    console.log('🌍 App: parseHash llamado');
    console.log('🌍 App: window.location:', window.location.href);
    
    // Recommended: Read from search params (e.g., /?mesa=F1#/checkin)
    const mainSearchParams = new URLSearchParams(window.location.search);
    let mesa = mainSearchParams.get('mesa');
    console.log('🌍 App: mesa desde search params:', mesa);

    const hash = window.location.hash.substring(1);
    const [path, queryString] = hash.split('?');
    console.log('🌍 App: hash:', hash, 'path:', path, 'queryString:', queryString);
    
    // Backwards compatibility: Read from hash if not in search (e.g., /#/checkin?mesa=F1)
    if (!mesa && queryString) {
        const hashParams = new URLSearchParams(queryString);
        mesa = hashParams.get('mesa');
        console.log('🌍 App: mesa desde hash params:', mesa);
    }
    
    console.log('🌍 App: mesa final:', mesa);
    
    if (path.startsWith('/checkin')) {
      console.log('🌍 App: Setting checkin mesa:', mesa);
      setCheckInMesa(mesa);
      setCurrentView('checkin');
    } else if (path.startsWith('/menu')) {
        setCurrentView('menu');
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
        case '/analytics':
          setCurrentView('analytics');
          break;
        case '/chatbot':
          setCurrentView('chatbot');
          break;
        case '/voice-assistant':
          setCurrentView('voice-assistant');
          break;
        case '/clientes':
          setCurrentView('clientes');
          break;
        case '/kitchen':
          setCurrentView('kitchen');
          break;
        case '/ai-dashboard':
          setCurrentView('ai-dashboard');
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

  const handleLogin = async (email: string, password: string) => {
    console.log('🔐 App: Intentando login con email:', email);

    const result = await staffLogin(email, password);

    if (result.error) {
      alert('Credenciales incorrectas: ' + result.error);
    } else if (result.data?.success) {
      setIsAuthenticated(true);
      window.location.hash = '/dashboard';
    } else {
      alert('Credenciales incorrectas');
    }
  };

  const handleRegister = async (email: string, password: string) => {
    console.log('🔐 App: Intentando registro con email:', email);
    
    try {
      const result = await adminRegistration.registerAdmin(email, password);
      
      if (result.error) {
        alert('Error al registrar: ' + result.error);
      } else if (result.data?.success) {
        alert('Administrador registrado exitosamente. Ahora puedes iniciar sesión.');
      } else {
        alert('Error al registrar el administrador');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error al registrar el administrador');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    window.location.hash = '/login';
  };
  
  const navigate = (view: 'dashboard' | 'reports' | 'reservations' | 'analytics' | 'chatbot' | 'voice-assistant' | 'clientes' | 'kitchen' | 'ai-dashboard') => {
      window.location.hash = `/${view}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10 text-expendio-dark">Cargando...</div>;
    }

    if (currentView === 'checkin') {
      return <CheckIn mesaName={checkInMesa} />;
    }
    
    if (currentView === 'menu') {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const mesa = params.get('mesa');
        return <Menu mesaName={mesa} />;
    }

    if (currentView === 'scanner') {
      return <CouponScanner />;
    }

    if (!isAuthenticated) {
      return (
        <EnhancedLogin 
          onLogin={handleLogin}
          onRegister={handleRegister}
          defaultEmail={process.env.ADMIN_EMAIL || ''}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <Reports />;
      case 'reservations':
        return <Reservations />;
      case 'analytics':
        return <Analytics />;
      case 'chatbot':
        return <Chatbot />;
      case 'voice-assistant':
        return <VoiceAssistant />;
      case 'clientes':
        return <Clientes />;
      case 'kitchen':
        return <Kitchen />;
      case 'ai-dashboard':
        return <AIBusinessDashboard />;
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
        <Suspense fallback={<LoadingSpinner fullScreen message="Cargando componente..." />}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
};

export default App;