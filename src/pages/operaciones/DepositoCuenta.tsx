import React, { useState } from 'react';
import { BuscarCuentaModal } from '../../components/Cuentas/BuscarCuentaModal';
import type { CuentaBuscada } from '../../types/cuenta.types';
import { Search, User, CreditCard, Calendar, FileText, X } from 'lucide-react';
import api from '../../services/api';

const formatFecha = (fecha: string | null): string => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const TitularCard: React.FC<{ cuenta: CuentaBuscada; onClear: () => void }> = ({ cuenta, onClear }) => (
  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex justify-between items-start">
      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Titular de la cuenta</span>
      <button type="button" onClick={onClear} className="text-blue-300 hover:text-blue-500">
        <X size={16} />
      </button>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <User size={14} className="text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-blue-400">Nombre completo</p>
          <p className="text-sm font-semibold text-blue-900">
            {cuenta.nombre} {cuenta.apellido_paterno} {cuenta.apellido_materno || ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CreditCard size={14} className="text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-blue-400">No. Cuenta</p>
          <p className="text-sm font-semibold text-blue-900">#{cuenta.cuenta_id}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-blue-400">Fecha de nacimiento</p>
          <p className="text-sm font-medium text-blue-800">{formatFecha(cuenta.fecha_nacimiento)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-blue-400">CURP</p>
          <p className="text-sm font-mono text-blue-800">{cuenta.curp || '—'}</p>
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <FileText size={14} className="text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-blue-400">RFC</p>
          <p className="text-sm font-mono text-blue-800">{cuenta.rfc || '—'}</p>
        </div>
      </div>
    </div>
  </div>
);

const DepositoCuenta: React.FC = () => {
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaBuscada | null>(null);
  const [importe, setImporte] = useState('');
  const [concepto, setConcepto] = useState('Deposito en efectivo');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  const handleDeposito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaSeleccionada || !importe || parseFloat(importe) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Por favor seleccione una cuenta y un monto valido.' });
      return;
    }
    setLoading(true);
    setMensaje(null);
    try {
      const { data } = await api.post('/movimientos/deposito', {
        cuenta_id: cuentaSeleccionada.cuenta_id,
        importe: parseFloat(importe),
        concepto,
      });
      if (data.success) {
        setMensaje({ tipo: 'exito', texto: `Deposito exitoso. Folio: ${data.folio}` });
        setCuentaSeleccionada(null);
        setImporte('');
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al depositar' });
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Fallo de conexion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Depositar a Cuenta</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl">
        {mensaje && (
          <div className={`p-4 rounded-md mb-4 ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {mensaje.texto}
          </div>
        )}
        <form onSubmit={handleDeposito} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Buscar Cuenta</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                readOnly
                value={cuentaSeleccionada ? `#${cuentaSeleccionada.cuenta_id} — ${cuentaSeleccionada.nombre} ${cuentaSeleccionada.apellido_paterno}` : ''}
                placeholder="Haz clic en buscar para seleccionar una cuenta..."
                className="flex-1 rounded-none rounded-l-md border-gray-300 bg-gray-50 text-gray-600 sm:text-sm border p-2 cursor-default"
              />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-medium"
              >
                <Search size={16} />
                Buscar
              </button>
            </div>
            {cuentaSeleccionada && (
              <TitularCard cuenta={cuentaSeleccionada} onClear={() => setCuentaSeleccionada(null)} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto a Depositar ($)</label>
            <input type="number" step="0.01" value={importe} onChange={e => setImporte(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Concepto</label>
            <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
          </div>
          <button type="submit" disabled={loading || !cuentaSeleccionada} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
            {loading ? 'Procesando...' : 'Aplicar Deposito'}
          </button>
        </form>
      </div>
      <BuscarCuentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(cuenta) => setCuentaSeleccionada(cuenta)}
      />
    </div>
  );
};
export default DepositoCuenta;