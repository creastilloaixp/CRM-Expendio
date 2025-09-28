import React from 'react';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'reports' | 'reservations') => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout, onNavigate, currentView }) => {
  const NavButton: React.FC<{ view: 'dashboard' | 'reports' | 'reservations'; label: string }> = ({ view, label }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
          isActive
            ? 'bg-expendio-maroon text-white'
            : 'text-expendio-dark hover:bg-expendio-red/10'
        }`}
      >
        {label}
      </button>
    );
  };
    
  return (
    <header className="bg-expendio-bg shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center h-20">
        <div className="text-center">
          <h1 className="font-display text-4xl text-expendio-red tracking-wide">EXPENDIO</h1>
          <p className="font-script text-xl text-expendio-maroon -mt-2">Cervecería Popular</p>
        </div>
        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <nav className="hidden sm:flex items-center space-x-2 bg-gray-200/50 p-1 rounded-lg">
              <NavButton view="dashboard" label="Dashboard" />
              <NavButton view="reports" label="Reportes" />
              <NavButton view="reservations" label="Reservas" />
            </nav>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-expendio-red text-white rounded-md font-semibold hover:bg-expendio-red/90 transition-colors duration-200"
            >
              Salir
            </button>
          </div>
        )}
      </div>
       {isAuthenticated && (
          <nav className="sm:hidden flex items-center justify-center space-x-2 bg-gray-200/50 p-2">
            <NavButton view="dashboard" label="Dashboard" />
            <NavButton view="reports" label="Reportes" />
            <NavButton view="reservations" label="Reservas" />
          </nav>
        )}
    </header>
  );
};

export default Header;