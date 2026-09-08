import React, { useState } from 'react';
import { Search, CreditCard, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { BuscarCuentaModal } from '../../components/Cuentas/BuscarCuentaModal';
import type { CuentaBuscada } from '../../types/cuenta.types';

const AbonosCredito: React.FC = () => {
  const [cuenta, setCuenta] = useState<CuentaBuscada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedCredito, setSelectedCredito] = useState<any>(null);
  const [montoAbono, setMontoAbono] = useState<number | ''>('');
  const [formaPago, setFormaPago] = useState<'efectivo' | 'saldo'>('efectivo');

  const buscarCreditos = async (c_id: number) => {
    setLoading(true); setError(''); setSelectedCredito(null);
    try {
      const res = await api.get(`/creditos/${c_id}`);
      if (res.data.success) {
        setCreditos(res.data.data);
        if (res.data.data.length === 0) {
          setError('No hay compras a crédito pendientes para esta cuenta.');
        }
      }
    } catch (e: any) {
      setError('Error al buscar créditos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCuenta = (c: CuentaBuscada) => {
    setCuenta(c);
    setIsModalOpen(false);
    buscarCreditos(c.cuenta_id);
  };

  const abonarCredito = async () => {
    if (!selectedCredito || !montoAbono || !cuenta) return;
    try {
      setLoading(true);
      const res = await api.post(`/creditos/abonar`, {
        movimiento_id: selectedCredito.id,
        cuenta_id: cuenta.cuenta_id,
        monto: Number(montoAbono),
        forma_pago: formaPago
      });
      alert(res.data.message);
      setSelectedCredito(null);
      setMontoAbono('');
      buscarCreditos(cuenta.cuenta_id);
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || "Error al procesar el abono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonos a Compras Individuales</h1>
        <p className="text-gray-500 mt-1">Liquida o abona a compras a crédito específicas.</p>
      </div>

      <div className="card p-6">
        <label className="label-field mb-2">Seleccionar Cliente / Cuenta</label>
        {!cuenta ? (
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <CreditCard size={24} className="mb-2" />
            <span className="text-sm font-medium">Click para buscar cliente y seleccionar cuenta</span>
          </button>
        ) : (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="text-xs font-semibold text-primary-600 uppercase">Cuenta #{cuenta.cuenta_id}</div>
              <div className="font-bold text-gray-900">{cuenta.nombre} {cuenta.apellido_paterno}</div>
              <div className="text-sm text-gray-500">Saldo actual: ${Number(cuenta.saldo).toLocaleString('es-MX')}</div>
            </div>
            <button onClick={() => { setCuenta(null); setCreditos([]); setSelectedCredito(null); setError(''); }} className="btn-secondary text-sm">Cambiar</button>
          </div>
        )}
      </div>

      {error && <div className="bg-amber-50 text-amber-600 p-4 rounded-lg">{error}</div>}

      {creditos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Compras Pendientes</h2>
            {creditos.map(c => (
              <div key={c.id} className={`card p-4 border-l-4 cursor-pointer transition-all ${selectedCredito?.id === c.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-l-blue-500'}`}
                onClick={() => setSelectedCredito(c)}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">Folio: {c.folio}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{new Date(c.fecha).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>Importe Original: <span className="font-semibold">${Number(c.importe).toLocaleString('es-MX')}</span></div>
                  <div>Días Crédito: <span className="font-semibold">{c.dias_credito}</span></div>
                  <div className="col-span-2 text-lg text-primary-700">Saldo Pendiente: <span className="font-bold">${Number(c.saldo_pendiente).toLocaleString('es-MX')}</span></div>
                </div>
              </div>
            ))}
          </div>

          {selectedCredito && (
            <div className="card p-6 bg-primary-50/30 self-start">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-primary-600" /> Abonar a Compra
              </h2>
              <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 space-y-2 text-sm">
                <div className="flex justify-between"><span>Folio:</span> <span>{selectedCredito.folio}</span></div>
                <div className="flex justify-between text-lg"><span>Saldo Pendiente:</span> <span className="font-bold text-red-600">${Number(selectedCredito.saldo_pendiente).toLocaleString('es-MX')}</span></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-field">Monto a Abonar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min={1} max={selectedCredito.saldo_pendiente} value={montoAbono} onChange={e => setMontoAbono(Number(e.target.value))} className="input-field pl-8" placeholder="0.00" />
                  </div>
                </div>
                
                <div>
                  <label className="label-field">Forma de Pago</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg flex-1 bg-white hover:bg-gray-50">
                      <input type="radio" name="forma_pago" checked={formaPago === 'efectivo'} onChange={() => setFormaPago('efectivo')} />
                      <span>Efectivo (Caja)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg flex-1 bg-white hover:bg-gray-50">
                      <input type="radio" name="forma_pago" checked={formaPago === 'saldo'} onChange={() => setFormaPago('saldo')} />
                      <span>Saldo (Cuenta)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setSelectedCredito(null)} className="btn-secondary flex-1">Cancelar</button>
                  <button onClick={abonarCredito} disabled={loading || !montoAbono} className="btn-primary flex-1 justify-center">
                    Aplicar Abono
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <BuscarCuentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectCuenta}
      />
    </div>
  );
};

export default AbonosCredito;
