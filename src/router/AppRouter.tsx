import EmitirTarjeta from '../pages/tarjetas/EmitirTarjeta';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleGuard from '../components/Auth/RoleGuard';
import Login from '../pages/Login';
import Layout from '../components/Layout/Layout';
import Dashboard from '../pages/Dashboard';
import ClientesList from '../pages/clientes/ClientesList';
import ClienteForm from '../pages/clientes/ClienteForm';
import EstadosList from '../pages/catalogos/estados/EstadosList';
import NivelCuentaList from '../pages/catalogos/nivelCuenta/NivelCuentaList';
import NivelRiesgoList from '../pages/catalogos/nivelRiesgo/NivelRiesgoList';
import OcupacionesList from '../pages/catalogos/ocupaciones/OcupacionesList';
import TipoIdentificacionList from '../pages/catalogos/tipoIdentificacion/TipoIdentificacionList';
import EmpresasList from '../pages/empresas/EmpresasList';
import EmpresaDetalle from '../pages/empresas/EmpresaDetalle';
import AperturaCuenta from '../pages/cuentas/AperturaCuenta';
import CuentasList from '../pages/cuentas/CuentasList';
import PagosComercios from '../pages/cuentas/PagosComercios';
import AplicarPagos from '../pages/cuentas/AplicarPagos';
import SucursalesList from '../pages/sucursales/SucursalesList';
import TerminalesList from '../pages/catalogos/terminales/TerminalesList';
import UsuariosList from '../pages/usuarios/UsuariosList';
import ClienteDocumentos from '../pages/clientes/ClienteDocumentos';
import Transferencias from '../pages/operaciones/Transferencias';
import EstadoCuenta from '../pages/operaciones/EstadoCuenta';
import TransferenciasOtrosBancos from '../pages/operaciones/TransferenciasOtrosBancos';
import GeneradorVales from '../pages/operaciones/GeneradorVales';
import DepositoCuenta from '../pages/operaciones/DepositoCuenta';
import RetiroCuenta from '../pages/operaciones/RetiroCuenta';
import Cobranza from '../pages/operaciones/Cobranza';
import AbonosCredito from '../pages/operaciones/AbonosCredito';
import AutorizarVales from '../pages/operaciones/AutorizarVales';
import ConfiguracionGeneral from '../pages/configuracion/ConfiguracionGeneral';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Roles estándar
const ROLES_ADMIN = ['ADMIN', 'ADMINISTRADOR'];
const ROLES_GERENCIA = ['ADMIN', 'ADMINISTRADOR', 'GERENTE', 'SUPERVISOR'];
const ROLES_OPERATIVOS = ['ADMIN', 'ADMINISTRADOR', 'GERENTE', 'SUPERVISOR', 'CAJERO', 'OPERADOR'];

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Tarjetas */}
          <Route path="tarjetas/emitir" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><EmitirTarjeta /></RoleGuard>
          } />

          {/* Clientes */}
          <Route path="clientes" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><ClientesList /></RoleGuard>
          } />
          <Route path="clientes/nuevo" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><ClienteForm /></RoleGuard>
          } />
          <Route path="clientes/:id/editar" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><ClienteForm /></RoleGuard>
          } />
          <Route path="clientes/:id/documentos" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><ClienteDocumentos /></RoleGuard>
          } />

          {/* Empresas */}
          <Route path="empresas" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><EmpresasList /></RoleGuard>
          } />
          <Route path="empresas/nueva" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><EmpresaDetalle /></RoleGuard>
          } />
          <Route path="empresas/:id" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><EmpresaDetalle /></RoleGuard>
          } />

          {/* Cuentas */}
          <Route path="cuentas" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><CuentasList /></RoleGuard>
          } />
          <Route path="cuentas/apertura" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><AperturaCuenta /></RoleGuard>
          } />
          <Route path="cuentas/pagos" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><PagosComercios /></RoleGuard>
          } />
          <Route path="cuentas/aplicar-pagos" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><AplicarPagos /></RoleGuard>
          } />

          {/* Catálogos (Administración / Gerencia) */}
          <Route path="catalogos/estados" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><EstadosList /></RoleGuard>
          } />
          <Route path="catalogos/nivel-cuenta" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><NivelCuentaList /></RoleGuard>
          } />
          <Route path="catalogos/nivel-riesgo" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><NivelRiesgoList /></RoleGuard>
          } />
          <Route path="catalogos/ocupaciones" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><OcupacionesList /></RoleGuard>
          } />
          <Route path="catalogos/tipo-identificacion" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><TipoIdentificacionList /></RoleGuard>
          } />

          {/* Sucursales y Terminales */}
          <Route path="sucursales" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><SucursalesList /></RoleGuard>
          } />
          <Route path="terminales" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><TerminalesList /></RoleGuard>
          } />
          <Route path="catalogos/terminales" element={<Navigate to="/terminales" replace />} />

          {/* Operaciones */}
          <Route path="operaciones/transferencias" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><Transferencias /></RoleGuard>
          } />
          <Route path="operaciones/estado-cuenta" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><EstadoCuenta /></RoleGuard>
          } />
          <Route path="operaciones/spei" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><TransferenciasOtrosBancos /></RoleGuard>
          } />
          <Route path="operaciones/vales" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><GeneradorVales /></RoleGuard>
          } />
          <Route path="operaciones/vales/autorizar" element={
            <RoleGuard allowedRoles={ROLES_GERENCIA}><AutorizarVales /></RoleGuard>
          } />
          <Route path="operaciones/deposito" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><DepositoCuenta /></RoleGuard>
          } />
          <Route path="operaciones/retiro" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><RetiroCuenta /></RoleGuard>
          } />
          <Route path="operaciones/cobranza" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><Cobranza /></RoleGuard>
          } />
          <Route path="operaciones/abonos-credito" element={
            <RoleGuard allowedRoles={ROLES_OPERATIVOS}><AbonosCredito /></RoleGuard>
          } />

          {/* Usuarios del Sistema (Exclusivo Administradores) */}
          <Route path="usuarios" element={
            <RoleGuard allowedRoles={ROLES_ADMIN}><UsuariosList /></RoleGuard>
          } />

          {/* Configuración General (Exclusivo Administradores) */}
          <Route path="configuracion" element={
            <RoleGuard allowedRoles={ROLES_ADMIN}><ConfiguracionGeneral /></RoleGuard>
          } />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;