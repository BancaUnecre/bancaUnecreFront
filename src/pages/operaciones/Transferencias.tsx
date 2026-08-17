import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ArrowDownUp, Check, CheckCircle2, RefreshCw, Printer, Loader2, AlertCircle, Search } from 'lucide-react';
import type { Cuenta, Cliente } from '../../types';
import { cuentasService } from '../../services/cuentasService';
import { clientesService } from '../../services/clientesService';
import { movimientosService } from '../../services/movimientosService';

type Step = 'form' | 'confirm' | 'success';

interface TrfForm {
  origen_id: number | '';
  destino_id: number | '';
  importe: number;
  concepto: string;
}

const fmtMoney = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

const CuentaCard: React.FC<{
  cuenta: Cuenta;
  clienteNombre: string;
  selected?: boolean;
  onClick?: () => void;
  label: string;
}> = ({ cuenta, clienteNombre, selected, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
      selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="font-mono font-bold text-gray-800 text-sm">{cuenta.numero_cuenta.match(/.{4}/g)?.join(' ')}</p>
        <p className="text-xs text-gray-500 mt-0.5">{cuenta.tipo_cuenta} · {clienteNombre}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-400">Saldo disponible</p>
        <p className="font-bold text-emerald-600 text-lg">{fmtMoney(cuenta.saldo)}</p>
      </div>
    </div>
    {selected && <CheckCircle2 size={16} className="text-primary-600 mt-2" />}
  </button>
);

const Transferencias: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<TrfForm>({ origen_id: '', destino_id: '', importe: 0, concepto: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [folio, setFolio] = useState('');
  const [fechaOp, setFechaOp] = useState('');

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchOrigen, setSearchOrigen] = useState('');
  const [searchDestino, setSearchDestino] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [resCuentas, resClientes] = await Promise.all([
          cuentasService.getAll({ limit: 200 }),
          clientesService.getAll({ limit: 200 }),
        ]);
        const unwrap = (r: any) => Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setCuentas(unwrap(resCuentas).filter((c: Cuenta) => c.estatus === 1));
        setClientes(unwrap(resClientes));
      } catch {
        setLoadError('Error al cargar cuentas. Verifica la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getNombre = (cuenta: Cuenta) => {
    const c = clientes.find(cl => cl.id === cuenta.cliente_id);
    return c ? `${c.nombre} ${c.apellido_paterno}` : `Cliente ${cuenta.cliente_id}`;
  };

  const allCuentas = cuentas;
  const cuentaOrigen = allCuentas.find(c => c.id === form.origen_id);
  const cuentaDestino = allCuentas.find(c => c.id === form.destino_id);
  const destinoOptions = allCuentas.filter(c => c.id !== form.origen_id);

  const filterCuentas = (list: Cuenta[], q: string) => {
    if (!q.trim()) return list;
    const lq = q.toLowerCase();
    return list.filter(c =>
      c.numero_cuenta.toLowerCase().includes(lq) ||
      getNombre(c).toLowerCase().includes(lq)
    );
  };

  const origenFiltradas = filterCuentas(allCuentas, searchOrigen);
  const destinoFiltradas = filterCuentas(destinoOptions, searchDestino);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.origen_id) e.origen = 'Selecciona la cuenta origen';
    if (!form.destino_id) e.destino = 'Selecciona la cuenta destino';
    if (!form.importe || form.importe <= 0) e.importe = 'Ingresa un importe válido';
    if (cuentaOrigen && form.importe > cuentaOrigen.saldo) e.importe = `Saldo insuficiente. Disponible: ${fmtMoney(cuentaOrigen.saldo)}`;
    if (!form.concepto.trim()) e.concepto = 'Ingresa un concepto';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setApiError(null);
    try {
      const res = await movimientosService.transferir({
        cuenta_origen_id: form.origen_id as number,
        cuenta_destino_id: form.destino_id as number,
        importe: form.importe,
        concepto: form.concepto,
      });
      const result = (res.data as any)?.data ?? res.data;
      setFolio(result?.folio ?? `TRF-${Date.now().toString().slice(-8)}`);
      setFechaOp(result?.fecha ?? new Date().toISOString());
      // Actualizar saldo local de la cuenta origen
      setCuentas(prev => prev.map(c => {
        if (c.id === form.origen_id) return { ...c, saldo: result?.saldo_origen_despues ?? c.saldo };
        return c;
      }));
      setStep('success');
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? e?.message ?? 'Error al procesar la transferencia';
      setApiError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setForm({ origen_id: '', destino_id: '', importe: 0, concepto: '' });
    setErrors({});
    setApiError(null);
    setSearchOrigen('');
    setSearchDestino('');
    setStep('form');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <span>Cargando cuentas...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm max-w-xl mx-auto mt-10">
        <AlertCircle size={16} className="flex-shrink-0" />{loadError}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transferencia entre Cuentas</h1>
        <p className="text-gray-500 text-sm mt-0.5">Movimiento interno entre cuentas del banco — Sin comisión · Inmediato</p>
      </div>

      {step !== 'success' && (
        <div className="flex gap-1">
          {(['form', 'confirm'] as const).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step === s || (step === 'confirm' && i === 0) ? 'bg-primary-600' : 'bg-gray-200'}`} />
          ))}
        </div>
      )}

      {step === 'form' && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="label-field">Cuenta Origen</label>
            {allCuentas.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-3 border border-dashed border-gray-200 rounded-xl text-center">No hay cuentas activas disponibles</p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchOrigen}
                    onChange={e => setSearchOrigen(e.target.value)}
                    className="input-field pl-8 text-sm py-2"
                    placeholder="Buscar por número de cuenta o cliente..."
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {origenFiltradas.length === 0
                    ? <p className="text-sm text-gray-400 italic p-3 text-center">Sin resultados</p>
                    : origenFiltradas.map(c => (
                        <CuentaCard
                          key={c.id} cuenta={c} clienteNombre={getNombre(c)} label="Origen"
                          selected={form.origen_id === c.id}
                          onClick={() => { setForm(f => ({ ...f, origen_id: c.id, destino_id: f.destino_id === c.id ? '' : f.destino_id })); setSearchDestino(''); }}
                        />
                      ))
                  }
                </div>
              </>
            )}
            {errors.origen && <p className="text-red-500 text-xs mt-1">{errors.origen}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <ArrowDownUp size={16} className="text-primary-700" />
            </div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div>
            <label className="label-field">Cuenta Destino</label>
            {!form.origen_id ? (
              <p className="text-sm text-gray-400 italic p-3 border border-dashed border-gray-200 rounded-xl text-center">
                Primero selecciona la cuenta origen
              </p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchDestino}
                    onChange={e => setSearchDestino(e.target.value)}
                    className="input-field pl-8 text-sm py-2"
                    placeholder="Buscar por número de cuenta o cliente..."
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {destinoFiltradas.length === 0
                    ? <p className="text-sm text-gray-400 italic p-3 text-center">Sin resultados</p>
                    : destinoFiltradas.map(c => (
                        <CuentaCard
                          key={c.id} cuenta={c} clienteNombre={getNombre(c)} label="Destino"
                          selected={form.destino_id === c.id}
                          onClick={() => setForm(f => ({ ...f, destino_id: c.id }))}
                        />
                      ))
                  }
                </div>
              </>
            )}
            {errors.destino && <p className="text-red-500 text-xs mt-1">{errors.destino}</p>}
          </div>

          <div>
            <label className="label-field">Importe a Transferir</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="number" min={0.01} step={0.01}
                value={form.importe || ''}
                onChange={e => setForm(f => ({ ...f, importe: Number(e.target.value) }))}
                className={`input-field pl-7 text-lg font-bold ${errors.importe ? 'border-red-400' : ''}`}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MXN</span>
            </div>
            {cuentaOrigen && form.importe > 0 && (
              <p className={`text-xs mt-1 ${form.importe > cuentaOrigen.saldo ? 'text-red-500' : 'text-gray-400'}`}>
                Saldo disponible: {fmtMoney(cuentaOrigen.saldo)}
              </p>
            )}
            {errors.importe && <p className="text-red-500 text-xs mt-1">{errors.importe}</p>}
          </div>

          <div>
            <label className="label-field">Concepto</label>
            <input
              type="text"
              value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className={`input-field ${errors.concepto ? 'border-red-400' : ''}`}
              placeholder="Descripción de la transferencia"
              maxLength={100}
            />
            {errors.concepto && <p className="text-red-500 text-xs mt-1">{errors.concepto}</p>}
          </div>

          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm">
            <span className="text-gray-600">Comisión</span>
            <span className="font-bold text-emerald-700">$0.00 — Sin costo</span>
          </div>

          <button
            onClick={() => { if (validate()) setStep('confirm'); }}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 'confirm' && cuentaOrigen && cuentaDestino && (
        <div className="card p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">Confirma los detalles de la transferencia</p>
          </div>

          <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-primary-300 text-xs mb-1">Origen</p>
                <p className="font-mono text-sm font-bold">****{cuentaOrigen.numero_cuenta.slice(-4)}</p>
                <p className="text-primary-300 text-xs mt-1">{cuentaOrigen.tipo_cuenta}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={22} />
                <p className="font-bold text-xl">{fmtMoney(form.importe)}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-primary-300 text-xs mb-1">Destino</p>
                <p className="font-mono text-sm font-bold">****{cuentaDestino.numero_cuenta.slice(-4)}</p>
                <p className="text-primary-300 text-xs mt-1">{cuentaDestino.tipo_cuenta}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
            {[
              ['Cuenta Origen', `****${cuentaOrigen.numero_cuenta.slice(-4)} · ${cuentaOrigen.tipo_cuenta}`],
              ['Cuenta Destino', `****${cuentaDestino.numero_cuenta.slice(-4)} · ${cuentaDestino.tipo_cuenta}`],
              ['Importe', fmtMoney(form.importe)],
              ['Concepto', form.concepto],
              ['Fecha y hora', new Date(fechaOp).toLocaleString('es-MX')],
              ['Comisión', '$0.00'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-semibold ${k === 'Importe' ? 'text-primary-800 text-base' : 'text-gray-800'}`}>{v}</span>
              </div>
            ))}
          </div>

          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />{apiError}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('form')} className="btn-secondary flex-1 justify-center">
              <ArrowLeft size={16} />Modificar
            </button>
            <button onClick={handleConfirm} disabled={processing} className="btn-primary flex-1 justify-center py-3">
              {processing
                ? <><Loader2 size={16} className="animate-spin" />Procesando...</>
                : <><Check size={16} />Autorizar Transferencia</>
              }
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Transferencia Realizada!</h2>
            <p className="text-emerald-100 text-sm mt-1">El movimiento se ha procesado correctamente</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="border border-dashed border-gray-300 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comprobante de Transferencia</p>
                <p className="text-xs font-mono text-gray-500">{folio}</p>
              </div>
              {[
                ['Fecha y hora', new Date(fechaOp).toLocaleString('es-MX')],
                ['Origen', `****${cuentaOrigen!.numero_cuenta.slice(-4)}`],
                ['Destino', `****${cuentaDestino!.numero_cuenta.slice(-4)}`],
                ['Importe', fmtMoney(form.importe)],
                ['Concepto', form.concepto],
                ['Estatus', 'Completada'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center"><Printer size={15} />Imprimir</button>
              <button onClick={resetForm} className="btn-primary flex-1 justify-center"><RefreshCw size={15} />Nueva Transferencia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transferencias;
