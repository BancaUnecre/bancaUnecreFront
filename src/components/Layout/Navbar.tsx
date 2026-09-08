import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, User, ChevronDown, Menu, X, KeyRound } from 'lucide-react';
import CambiarPassword from '../CambiarPassword';

interface NavbarProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cambiarPassOpen, setCambiarPassOpen] = useState(false);

  return (
    <>
    {cambiarPassOpen && <CambiarPassword onClose={() => setCambiarPassOpen(false)} />}
    <header className="h-16 bg-primary-900 border-b border-primary-800 flex items-center px-4 gap-4 sticky top-0 z-30">
      <button onClick={onMenuToggle} className="p-2 text-white hover:bg-primary-700 rounded-lg transition-colors lg:hidden">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center font-bold text-primary-900 text-sm">BU</div>
        <span className="text-white font-bold text-lg hidden sm:block">Banco Unecre</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-primary-200 hover:text-white hover:bg-primary-700 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-gold-400 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2 text-primary-100 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.nombre}</span>
            <ChevronDown size={14} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user?.nombre}</p>
                <p className="text-xs text-gray-500">{user?.rol}</p>
              </div>
              <button
                onClick={() => { setCambiarPassOpen(true); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <KeyRound size={14} />
                Cambiar contraseña
              </button>
              <button
                onClick={() => { logout(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
};

export default Navbar;
