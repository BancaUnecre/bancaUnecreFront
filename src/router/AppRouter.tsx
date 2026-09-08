import EmitirTarjeta from '../pages/tarjetas/EmitirTarjeta';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="tarjetas/emitir" element={<EmitirTarjeta />} />
                    <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<ClientesList />} />
          <Route path="clientes/nuevo" element={<ClienteForm />} />
          <Route path="clientes/:id/editar" element={<ClienteForm />} />
          <Route path="clientes/:id/documentos" element={<ClienteDocumentos />} />
          <Route path="catalogos/estados" element={<EstadosList />} />
          <Route path="catalogos/nivel-cuenta" element={<NivelCuentaList />} />
          <Route path="catalogos/nivel-riesgo" element={<NivelRiesgoList />} />
          <Route path="catalogos/ocupaciones" element={<OcupacionesList />} />
          <Route path="catalogos/tipo-identificacion" element={<TipoIdentificacionList />} />
          <Route path="empresas" element={<EmpresasList />} />
          <Route path="empresas/nueva" element={<EmpresaDetalle />} />
          <Route path="empresas/:id" element={<EmpresaDetalle />} />
          <Route path="cuentas" element={<CuentasList />} />
          <Route path="cuentas/apertura" element={<AperturaCuenta />} />
          <Route path="sucursales" element={<SucursalesList />} />
          <Route path="terminales" element={<TerminalesList />} />
          <Route path="usuarios" element={<UsuariosList />} />
          <Route path="operaciones/transferencias" element={<Transferencias />} />
          <Route path="operaciones/estado-cuenta" element={<EstadoCuenta />} />
          <Route path="operaciones/spei" element={<TransferenciasOtrosBancos />} />
          <Route path="operaciones/vales" element={<GeneradorVales />} />
          <Route path="operaciones/vales/autorizar" element={<AutorizarVales />} />
          <Route path="operaciones/deposito" element={<DepositoCuenta />} />
          <Route path="operaciones/retiro" element={<RetiroCuenta />} />
          <Route path="operaciones/cobranza" element={<Cobranza />} />
          <Route path="operaciones/abonos-credito" element={<AbonosCredito />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;


