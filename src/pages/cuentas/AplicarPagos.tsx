import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Banknote, RefreshCw, Inbox } from 'lucide-react';
import { pagosClientesService } from '../../services/pagosClientesService';
import Modal from '../../components/common/Modal';

const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
const fecha = (f?: string) => (f ? new Date(f).toLocaleString('es-MX') : '—');
const nombreCliente = (v: any) => [v.nombre, v.apellido_paterno, v.apellido_materno].filter(Boolean).join(' ') || `Cliente #${v.cliente_id}`;

const AplicarPagos: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true); setError(null);
    try {
      const r = await pagosClientesService.pendientes();
      const d = (r.data as any)?.data ?? r.data;
      setRows(Array.isArray(d) ? d : (d?.data ?? []));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar pagos pendientes');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const aplicar = async () => {
    if (!sel) return;
    setApplying(true); setError(null);
    try {
      const r = await pagosClientesService.aplicar(sel.id);
      const d = (r.data as any)?.data ?? r.data;
      setOk(`Pago de ${nombreCliente(sel)} aplicado: ${money(d?.aplicado_a_credito ?? sel.monto)} a crédito${d?.excedente_a_saldo > 0 ? ` y ${money(d.excedente_a_saldo)} a saldo a favor` : ''}.`);
      setSel(null);
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al aplicar el pago');
      setSel(null);
    } finally { setApplying(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aplicar pagos de clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Registra el pago del cliente y salda su crédito.</p>
        </div>
        <button onClick={cargar} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}
      {ok && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />{ok}
          <button onClick={() => setOk(null)} className="ml-auto text-emerald-600">×</button>
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-14 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" /><span className="text-sm">Cargando...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm flex flex-col items-center gap-2">
            <Inbox size={28} className="text-gray-300" />
            No hay fichas de pago pendientes de aplicar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Referencia</th>
                  <th className="text-left px-4 py-2.5">Cliente</th>
                  <th className="text-left px-4 py-2.5">Método</th>
                  <th className="text-left px-4 py-2.5">Generada</th>
                  <th className="text-right px-4 py-2.5">Monto</th>
                  <th className="text-right px-4 py-2.5">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.referencia}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{nombreCliente(r)}</td>
                    <td className="px-4 py-2.5 text-gray-700">{r.metodo}</td>
                    <td className="px-4 py-2.5 text-gray-600">{fecha(r.fecha_generacion)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{money(r.monto)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setSel(r)} className="btn-primary py-1.5 px-3 text-xs">
                        <Banknote size={14} />Aplicar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!sel} onClose={() => setSel(null)} title="Aplicar pago" size="md">
        {sel && (
          <>
            <p className="text-sm text-gray-600">
              Se aplicará el pago de <b>{money(sel.monto)}</b> de <b>{nombreCliente(sel)}</b> (ref. {sel.referencia}, {sel.metodo})
              y se saldará su crédito. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSel(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={aplicar} disabled={applying} className="btn-primary flex-1 justify-center">
                {applying ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                {applying ? 'Aplicando...' : 'Confirmar y saldar'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AplicarPagos;
