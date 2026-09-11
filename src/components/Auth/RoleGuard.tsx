import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasRole, normalizeRole } from '../../utils/rbac';

interface RoleGuardProps {
  allowedRoles?: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, redirectTo }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const authorized = hasRole(user.rol, allowedRoles);

  if (!authorized) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 shadow-sm">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido (403)</h1>
        <p className="text-gray-600 max-w-md mb-6 text-sm">
          Tu usuario (<span className="font-semibold text-gray-800">{user.nombre || user.username}</span>) con rol{' '}
          <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded font-mono font-bold">
            {normalizeRole(user.rol) || 'SIN ROL'}
          </span>{' '}
          no cuenta con los permisos requeridos para ingresar a este módulo bancario.
        </p>
        {allowedRoles && allowedRoles.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-lg mb-6 max-w-md flex items-center gap-2 text-left">
            <Lock size={16} className="shrink-0 text-amber-600" />
            <div>
              <span className="font-bold">Módulos autorizados para:</span> {allowedRoles.join(', ')}
            </div>
          </div>
        )}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition"
        >
          <ArrowLeft size={16} /> Volver al Inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;