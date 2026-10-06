import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, isGerenteOrAdmin } from '../../utils/rbac';
import {
  LayoutDashboard, Users, BookOpen, ChevronDown, ChevronRight,
  MapPin, CreditCard, Shield, Briefcase, IdCard, Building2,
  Factory, PlusCircle,
  ListOrdered, UserCog, MonitorSmartphone, Settings, Banknote, HandCoins } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const catalogosItems = [
  { to: '/catalogos/estados',            label: 'Estados',             icon: MapPin },
  { to: '/catalogos/nivel-cuenta',       label: 'Nivel Cuenta',        icon: CreditCard },
  { to: '/catalogos/nivel-riesgo',       label: 'Nivel Riesgo',        icon: Shield },
  { to: '/catalogos/ocupaciones',        label: 'Ocupaciones',         icon: Briefcase },
  { to: '/catalogos/tipo-identificacion',label: 'Tipo Identificación', icon: IdCard },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [catalogsOpen, setCatalogsOpen] = useState(() =>
    location.pathname.startsWith('/catalogos')
  );

  const isSuperUser = 
    (user?.username || '').toLowerCase().includes('meny') ||
    (user?.nombre || '').toLowerCase().includes('meny');

  const adminRole = isSuperUser || isAdmin(user?.rol);
  const gerenteOrAdminRole = isSuperUser || isGerenteOrAdmin(user?.rol);


  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-primary-100 hover:bg-primary-700/60 hover:text-white'
    }`;

  const submenuClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-primary-200 hover:bg-primary-700/60 hover:text-white'
    }`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-primary-900 border-r border-primary-800 z-20 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">

          {/* Dashboard */}
          <NavLink to="/dashboard" className={navLinkClass} onClick={onClose} end>
            <LayoutDashboard size={18} />Dashboard
          </NavLink>

          {/* Clientes */}
          <NavLink to="/clientes" className={navLinkClass} onClick={onClose}>
            <Users size={18} />Clientes
          </NavLink>

          {/* Empresas */}
          <NavLink to="/empresas" className={navLinkClass} onClick={onClose}>
            <Factory size={18} />Empresas
          </NavLink>

          {/* Separator */}
          <div className="pt-3 pb-1">
            <p className="text-primary-500 text-xs font-semibold uppercase tracking-widest px-3">Cuentas</p>
          </div>

          <NavLink to="/cuentas/apertura" className={navLinkClass} onClick={onClose}>
            <PlusCircle size={18} />Apertura de Cuenta
          </NavLink>

          <NavLink to="/cuentas" className={navLinkClass} onClick={onClose} end>
            <ListOrdered size={18} />Consulta de Cuentas
          </NavLink>

          <NavLink to="/cuentas/pagos" className={navLinkClass} onClick={onClose}>
            <Banknote size={18} />Pagos
          </NavLink>

          <NavLink to="/cuentas/aplicar-pagos" className={navLinkClass} onClick={onClose}>
            <HandCoins size={18} />Aplicar Pagos
          </NavLink>

          {/* Operaciones: movido al portal de clientes/empresas (clientes.bancaunecre.com) */}

          {/* Sección de Gestión y Administración (Gerencia y Admins) */}
          {gerenteOrAdminRole && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-primary-500 text-xs font-semibold uppercase tracking-widest px-3">Gestión & Control</p>
              </div>

              {/* Catalogos submenu */}
              <div>
                <button
                  onClick={() => setCatalogsOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-100 hover:bg-primary-700/60 hover:text-white transition-all"
                >
                  <BookOpen size={18} />
                  <span className="flex-1 text-left">Catálogos</span>
                  {catalogsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {catalogsOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-primary-700 pl-3">
                    {catalogosItems.map(item => (
                      <NavLink key={item.to} to={item.to} className={submenuClass} onClick={onClose}>
                        <item.icon size={15} />{item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              <NavLink to="/sucursales" className={navLinkClass} onClick={onClose}>
                <Building2 size={18} />Sucursales
              </NavLink>

              <NavLink to="/terminales" className={navLinkClass} onClick={onClose}>
                <MonitorSmartphone size={18} />Terminales
              </NavLink>
            </>
          )}

          {/* Configuración y Usuarios del Sistema (Exclusivo Administrador) */}
          {adminRole && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-primary-500 text-xs font-semibold uppercase tracking-widest px-3">Administración</p>
              </div>

              <NavLink to="/usuarios" className={navLinkClass} onClick={onClose}>
                <UserCog size={18} />Usuarios del Sistema
              </NavLink>

              <NavLink to="/configuracion" className={navLinkClass} onClick={onClose}>
                <Settings size={18} />Configuración General
              </NavLink>
            </>
          )}
        </div>

        <div className="p-3 border-t border-primary-800">
          <p className="text-xs text-primary-400 text-center">Banco Unecre © 2026</p>
          <p className="text-xs text-primary-500 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;