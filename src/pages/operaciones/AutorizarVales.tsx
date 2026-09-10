import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle2, Search } from 'lucide-react';
import api from '../../services/api';
import { CobroErrorModal, type CobroErrorData } from '../../components/common/CobroErrorModal';

const AutorizarVales: React.FC = () => {
  const [vales, setVales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cuentaId, setCuentaId] = useState('1'); // Por defecto para Manuel
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [errorModalData, setErrorModalData] = useState<CobroErrorData | null>(null);

  const fetchPendientes = async () => {
    if (!cuentaId) return;
    setLoading(true);
    try {
      const response = await api.get(`/terminal-vales/pendientes/${cuentaId}`);
      if (response.data.success) {
        setVales(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vales', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
    // Podríamos poner un polling aquí para refrescar cada 5 segundos
    const interval = setInterval(fetchPendientes, 5000);
    return () => clearInterval(interval);
  }, [cuentaId]);

  const handleAutorizar = async (transaccionId: number) => {
    setActionLoading(transaccionId);
    try {
      const response = await api.post(`/terminal-vales/autorizar/${transaccionId}`);
      if (response.data.success) {
        // Refrescar lista
        fetchPendientes();
        alert('Cobro autorizado exitosamente');
      }
    } catch (error: any) {
      const errRes = error?.response?.data;
      const mensaje = errRes?.message || errRes?.error || error.message || 'Error al autorizar el vale';
      const isFondos = mensaje.toLowerCase().includes('insuficiente') || mensaje.toLowerCase().includes('saldo');
      const val = vales.find(v => v.id === transaccionId);
      setErrorModalData({
        codigo: errRes?.codigo || (isFondos ? 'FONDOS_INSUFICIENTES' : 'ERROR_AUTORIZACION_VALE'),
        mensaje: mensaje,
        motivoDetallado: errRes?.detalles || errRes?.error || mensaje,
        montoSolicitado: val?.monto,
        cuentaId: cuentaId,
        origen: 'vale',
        accionSugerida: isFondos 
          ? 'El cliente no dispone de suficiente crédito o saldo disponible para autorizar este vale.'
          : 'El vale no pudo ser procesado. Verifique que no haya expirado o haya sido cancelado en la terminal POS.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vales Pendientes de Autorización</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Aquí aparecerán los cobros en tiempo real que están esperando tu confirmación.
        </p>
      </div>

      <div className="flex gap-4 items-end bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Revisar cuenta ID
          </label>
          <input
            type="number"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button onClick={fetchPendientes} className="btn-secondary px-4 py-2 h-[42px] flex items-center gap-2">
          <Search size={16} /> Buscar
        </button>
      </div>

      <div className="space-y-4">
        {loading && vales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Buscando cobros pendientes...</div>
        ) : vales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Todo al día</h3>
            <p className="text-gray-500">No tienes ningún cobro de vale pendiente de autorizar.</p>
          </div>
        ) : (
          vales.map((vale) => (
            <div key={vale.id} className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      <Clock size={12} /> Esperando tu autorización
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      Token Vale: {vale.token_seguro}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {vale.transacciones?.map((txn: any) => (
                    <div key={txn.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between border border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Monto a cobrar en terminal</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(txn.monto_cobrado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Escaneado: {new Date(txn.fecha_escaneo).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleAutorizar(txn.id)}
                        disabled={actionLoading === txn.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <ShieldCheck size={20} />
                        {actionLoading === txn.id ? 'Autorizando...' : 'Autorizar Cobro'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal UX de error especializado en autorización de vales */}
      <CobroErrorModal 
        isOpen={!!errorModalData}
        errorData={errorModalData}
        onClose={() => setErrorModalData(null)}
      />
    </div>
  );
};

export default AutorizarVales;
