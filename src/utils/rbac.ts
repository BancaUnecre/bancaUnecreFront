/**
 * Utilidades RBAC (Role-Based Access Control) para Banca Unecre
 */

export const ROLE_ALIASES: Record<string, string> = {
  ADMINISTRADOR: 'ADMIN',
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  SUPERVISOR: 'SUPERVISOR',
  CAJERO: 'CAJERO',
  OPERADOR: 'OPERADOR',
  USUARIO: 'USUARIO',
};

export const normalizeRole = (role?: string | null): string => {
  if (!role) return '';
  const trimmed = role.trim().toUpperCase();
  return ROLE_ALIASES[trimmed] || trimmed;
};

export const hasRole = (userRole?: string | null, allowedRoles?: string[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) return false;
  if (normalizedUserRole === 'ADMIN') return true;
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
  return normalizedAllowed.includes(normalizedUserRole);
};

export const isAdmin = (role?: string | null): boolean => {
  return normalizeRole(role) === 'ADMIN';
};

export const isGerenteOrAdmin = (role?: string | null): boolean => {
  const norm = normalizeRole(role);
  return norm === 'ADMIN' || norm === 'GERENTE' || norm === 'SUPERVISOR';
};

export const isOperatorOrAbove = (role?: string | null): boolean => {
  const norm = normalizeRole(role);
  return ['ADMIN', 'GERENTE', 'SUPERVISOR', 'CAJERO', 'OPERADOR'].includes(norm);
};
