import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Banknote, RefreshCw, Store } from 'lucide-react';
import { empresasService } from '../../services/empresasService';
import { pagosComerciosService } from '../../services/pagosComerciosService';
import Modal from '../../components/common/Modal';

const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
const fecha = (f?: string) => (f ? new Date(f).toLocaleDateString('es-MX') : '—');
const nombreCliente = (v: any) => [v.nombre, v.apellido_paterno, v.apellido_materno].filter(Boolean).join(' ') || 'Cliente';

const PagosComercios: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState<number | ''>('');
  const [ventas, setVentas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    empresasService.getAll({ page: 1, limit: 1000 } as any)
      .then(r => { const raw = r.data as any; setEmpresas(Array.isArray(raw) ? raw : (raw?.data ?? [])); })
      .catch(() => {});
  }, []);

  const cargar = async (eid: number) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await pagosComerciosService.getVentas(eid);
      const d = (r.data as any)?.data ?? r.data;
      setVentas(d?.ventas ?? []); setTotal(d?.total ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar las ventas');
      setVentas([]); setTotal(0);
    } finally { setLoading(false); }
  };

  const onSelect = (v: string) => {
    const eid = v ? Number(v) : '';
    setEmpresaId(eid); setResult(null);
    if (eid) cargar(eid); else { setVentas([]); setTotal(0); }
  };

  const generarPago = async () => {
    if (!empresaId) return;
    setPaying(true); setError(null);
    try {
      const r = await pagosComerciosService.pagar(empresaId as number);
      const d = (r.data as any)?.data ?? r.data;
      setResult(d); setConfirm(false);
      await cargar(empresaId as number);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al generar el pago');
      setConfirm(false);
    } finally { setPaying(false); }
  };

  const empresaSel = empresas.find((e: any) => e.id === empresaId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagos a comercios</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Liquida al comercio las ventas a crédito que registraron sus terminales.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <label className="label-field">Comercio (empresa)</label>
            <select value={empresaId} onChange={e => onSelect(e.target.value)} className="input-field">
              <option value="">Seleccionar comercio...</option>
              {empresas.map((e: any) => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
            </select>
          </div>
          {empresaId !== '' && (
            <button onClick={() => cargar(empresaId as number)} className="btn-secondary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Actualizar
            </button>
          )}
        </div>

        {result && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm">
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pago generado y aplicado</p>
              <p>Se abonaron <b>{money(result.total)}</b> a la cuenta de {empresaSel?.razon_social} por {result.num_ventas} venta(s). Folio de pago #{result.id}.</p>
            </div>
          </div>
        )}

        {empresaId === '' ? (
          <div className="text-center py-14 text-gray-400 text-sm flex flex-col items-center gap-2">
            <Store size={28} className="text-gray-300" />
            Elige un comercio para ver sus ventas a crédito pendientes de liquidar.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-14 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" /><span className="text-sm">Cargando ventas...</span>
          </div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm">
            Este comercio no tiene ventas a crédito pendientes de liquidar.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5">Folio</th>
                    <th className="text-left px-4 py-2.5">Cliente</th>
                    <th className="text-left px-4 py-2.5">Fecha</th>
                    <th className="text-center px-4 py-2.5">Días créd.</th>
                    <th className="text-right px-4 py-2.5">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ventas.map((v: any) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{v.folio}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{nombreCliente(v)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{fecha(v.fecha)}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{v.dias_credito || 0}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{money(v.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total a pagar · {ventas.length} venta(s)</p>
                <p className="text-2xl font-bold text-primary-700">{money(total)}</p>
              </div>
              <button onClick={() => setConfirm(true)} className="btn-primary" disabled={total <= 0}>
                <Banknote size={16} />Generar pago
              </button>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Confirmar pago al comercio" size="md">
        <p className="text-sm text-gray-600">
          Se abonarán <b>{money(total)}</b> a la cuenta de <b>{empresaSel?.razon_social}</b> por {ventas.length} venta(s) a crédito,
          y esas ventas quedarán marcadas como liquidadas. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setConfirm(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={generarPago} disabled={paying} className="btn-primary flex-1 justify-center">
            {paying ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
            {paying ? 'Aplicando...' : 'Confirmar pago'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PagosComercios;
