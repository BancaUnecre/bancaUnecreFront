import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Calendar, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const Cobranza: React.FC = () => {
  const [cuentaId, setCuentaId] = useState('');
  const [cortes, setCortes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [montoPagar, setMontoPagar] = useState<number | ''>('');
  const [formaPago, setFormaPago] = useState<'efectivo' | 'saldo'>('efectivo');
  const [selectedCorte, setSelectedCorte] = useState<any>(null);

  const buscarCortes = async () => {
    if (!cuentaId) return;
    setLoading(true); setError('');
    try {
      const res = await api.get(`/cortes/${cuentaId}`);
      if (res.data.success) {
        setCortes(res.data.data);
      }
    } catch (e: any) {
      setError('Error al buscar cortes');
    } finally {
      setLoading(false);
    }
  };

  const ejecutarCorteManual = async () => {
    try {
      if (!confirm("¿Ejecutar cortes para el día de hoy manualmente?")) return;
      setLoading(true);
      const res = await api.post('/cortes/ejecutar', {});
      alert(res.data.message);
      if (cuentaId) buscarCortes();
    } catch(e: any) {
      alert("Error ejecutando corte: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const pagarCorte = async () => {
    if (!selectedCorte || !montoPagar) return;
    try {
      setLoading(true);
      const res = await api.post(`/cortes/pagar/${selectedCorte.id}`, {
        monto: Number(montoPagar),
        de_saldo: formaPago === 'saldo'
      });
      alert('Pago registrado con éxito');
      setSelectedCorte(null);
      setMontoPagar('');
      buscarCortes();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobranza y Cortes</h1>
          <p className="text-gray-500 mt-1">Gestión de pagos de tarjetas de crédito y estados de cuenta.</p>
        </div>
        <button onClick={ejecutarCorteManual} className="btn-secondary flex items-center gap-2">
          <Calendar size={18} /> Ejecutar Corte del Día (Manual)
        </button>
      </div>

      <div className="card p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="label-field">ID de Cuenta</label>
            <input type="text" value={cuentaId} onChange={e => setCuentaId(e.target.value)} className="input-field" placeholder="Ej. 1" />
          </div>
          <div className="flex items-end">
            <button onClick={buscarCortes} disabled={loading || !cuentaId} className="btn-primary py-2.5 px-6">
              <Search size={18} className="mr-2 inline" /> Buscar Cortes
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

      {cortes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Historial de Cortes</h2>
            {cortes.map(c => (
              <div key={c.id} className={`card p-4 border-l-4 cursor-pointer transition-all ${selectedCorte?.id === c.id ? 'ring-2 ring-primary-500' : ''} ${c.estatus === 'PAGADO' ? 'border-l-green-500' : 'border-l-amber-500'}`}
                onClick={() => c.estatus !== 'PAGADO' && setSelectedCorte(c)}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">Corte: {new Date(c.fecha_corte).toLocaleDateString()}</span>
                  {c.estatus === 'PAGADO' ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">PAGADO</span> : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">PENDIENTE</span>}
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>Saldo Total: <span className="font-semibold">${Number(c.saldo_actual).toLocaleString('es-MX')}</span></div>
                  <div>Pago Mínimo: <span className="font-semibold">${Number(c.pago_minimo).toLocaleString('es-MX')}</span></div>
                  <div>Abonado: <span className="text-green-600 font-semibold">${Number(c.abonos_mes).toLocaleString('es-MX')}</span></div>
                  <div>Vence: {new Date(c.fecha_limite_pago).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>

          {selectedCorte && (
            <div className="card p-6 bg-primary-50/30">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-primary-600" /> Registrar Pago
              </h2>
              <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 space-y-2 text-sm">
                <div className="flex justify-between"><span>Deuda Total Restante:</span> <span className="font-bold">${(Number(selectedCorte.saldo_actual) - Number(selectedCorte.abonos_mes)).toLocaleString('es-MX')}</span></div>
                <div className="flex justify-between text-gray-500"><span>Pago Mínimo Sugerido:</span> <span>${Number(selectedCorte.pago_minimo).toLocaleString('es-MX')}</span></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-field">Monto a Pagar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min={1} value={montoPagar} onChange={e => setMontoPagar(Number(e.target.value))} className="input-field pl-8" placeholder="0.00" />
                  </div>
                </div>
                
                <div>
                  <label className="label-field">Forma de Pago</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg flex-1 bg-white hover:bg-gray-50">
                      <input type="radio" name="forma_pago" checked={formaPago === 'efectivo'} onChange={() => setFormaPago('efectivo')} />
                      <span>Efectivo en Caja</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg flex-1 bg-white hover:bg-gray-50">
                      <input type="radio" name="forma_pago" checked={formaPago === 'saldo'} onChange={() => setFormaPago('saldo')} />
                      <span>Saldo de la Cuenta</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setSelectedCorte(null)} className="btn-secondary flex-1">Cancelar</button>
                  <button onClick={pagarCorte} disabled={loading || !montoPagar} className="btn-primary flex-1 justify-center">
                    Procesar Pago
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cobranza;
