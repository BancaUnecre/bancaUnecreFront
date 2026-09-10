import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TerminalAlertBanner from '../Terminales/TerminalAlertBanner';
import api from '../../services/api';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mantenimiento, setMantenimiento] = useState(false);

  useEffect(() => {
    const checkMantenimiento = () => {
      api.get('/configuracion/status')
        .then(res => {
          if (res.data && typeof res.data.mantenimiento_activo === 'boolean') {
            setMantenimiento(res.data.mantenimiento_activo);
          }
        })
        .catch(() => {});
    };

    checkMantenimiento();
    const interval = setInterval(checkMantenimiento, 15000);

    const onMantenimientoChange = (e: any) => {
      setMantenimiento(!!e.detail);
    };
    window.addEventListener('mantenimiento-changed', onMantenimientoChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mantenimiento-changed', onMantenimientoChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {mantenimiento && (
        <div className="lg:ml-64 bg-red-600 text-white px-4 py-2 text-sm font-semibold flex items-center justify-between shadow-md sticky top-16 z-30 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>⚠️ MODO MANTENIMIENTO ACTIVO: Las terminales POS (Sunmi/Urovo) y operaciones bancarias están pausadas.</span>
          </div>
          <Link to="/configuracion" className="underline text-xs bg-red-700 hover:bg-red-800 px-2.5 py-1 rounded transition">
            Configuración
          </Link>
        </div>
      )}

      <div className="lg:ml-64">
        <TerminalAlertBanner />
      </div>

      <main className="lg:ml-64 pt-4 px-4 pb-8 min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
