import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Printer,
  RefreshCw, Building2, Clock, ShieldCheck, Loader2,
} from 'lucide-react';
const BANCOS_MEXICO: Record<string, string> = {
  '002': 'BBVA México', '006': 'BANCOMEXT', '009': 'BANOBRAS', '012': 'BBVA México',
  '014': 'Santander', '021': 'HSBC', '030': 'Bajío', '032': 'IXE', '036': 'Inbursa',
  '037': 'Multiva', '042': 'Mifel', '044': 'Scotiabank', '058': 'Banregio',
  '059': 'Invex', '060': 'Bansi', '062': 'Afirme', '072': 'Banorte',
  '127': 'Azteca', '128': 'Autofin', '130': 'Compartamos', '133': 'Actinver',
  '135': 'Walmart', '143': 'CIBanco', '147': 'Bankaool', '156': 'Sabadell',
  '166': 'BaBien', '600': 'Monexcb', '601': 'GBM',
};
import type { Cuenta, Cliente } from '../../types';
import { cuentasService } from '../../services/cuentasService';
import { clientesService } from '../../services/clientesService';

type Step = 'form' | 'confirm' | 'success';

interface SpeiForm {
  cuenta_origen_id: number | '';
  clabe_destino: string;
  banco_destino: string;
  nombre_beneficiario: string;
  importe: number;
  concepto: string;
  referencia: string;
}

const fmtMoney = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

const getSLA = () => {
  const h = new Date().getHours();
  if (h < 18) return { msg: 'Mismo día — antes de las 18:30', color: 'text-emerald-600', icon: '⚡' };
  return { msg: 'Siguiente día hábil', color: 'text-amber-600', icon: '🕐' };
};

const validateCLABE = (clabe: string) => clabe.replace(/\D/g, '').length === 18;

const TransferenciasOtrosBancos: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<SpeiForm>({
    cuenta_origen_id: '', clabe_destino: '', banco_destino: '',
    nombre_beneficiario: '', importe: 0, concepto: '', referencia: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [folio] = useState(`SPEI-${Date.now().toString().slice(-10)}`);
  const [fechaOp] = useState(new Date().toISOString());
  const sla = getSLA();

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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

  const cuentaOrigen = cuentas.find(c => c.id === form.cuenta_origen_id);
  const clienteOrigen = cuentaOrigen ? clientes.find(c => c.id === cuentaOrigen.cliente_id) : null;

  useEffect(() => {
    const digits = form.clabe_destino.replace(/\D/g, '');
    if (digits.length >= 3) {
      const code = digits.slice(0, 3);
      const banco = BANCOS_MEXICO[code];
      setForm(f => ({ ...f, banco_destino: banco ?? '' }));
    } else {
      setForm(f => ({ ...f, banco_destino: '' }));
    }
  }, [form.clabe_destino]);

  const formatCLABE = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 18);
    return digits.match(/.{1,6}/g)?.join(' ') ?? digits;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.cuenta_origen_id) e.origen = 'Selecciona la cuenta origen';
    if (!validateCLABE(form.clabe_destino)) e.clabe = 'La CLABE debe tener 18 dígitos';
    if (!form.banco_destino) e.banco = 'Banco destino no reconocido';
    if (!form.nombre_beneficiario.trim()) e.beneficiario = 'Ingresa el nombre del beneficiario';
    if (!form.importe || form.importe <= 0) e.importe = 'Ingresa un importe válido';
    if (cuentaOrigen && form.importe > cuentaOrigen.saldo) e.importe = `Saldo insuficiente. Disponible: ${fmtMoney(cuentaOrigen.saldo)}`;
    if (form.importe > 999999.99) e.importe = 'El límite por operación SPEI es $999,999.99';
    if (!form.concepto.trim()) e.concepto = 'El concepto es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setStep('success');
  };

  const resetForm = () => {
    setForm({ cuenta_origen_id: '', clabe_destino: '', banco_destino: '', nombre_beneficiario: '', importe: 0, concepto: '', referencia: '' });
    setErrors({});
    setStep('form');
  };

  const clabeRaw = form.clabe_destino.replace(/\D/g, '');

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
        <h1 className="text-2xl font-bold text-gray-900">Transferencia SPEI a Otros Bancos</h1>
        <p className="text-gray-500 text-sm mt-0.5">Sistema de Pagos Electrónicos Interbancarios — Banco de México</p>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${sla.color === 'text-emerald-600' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <span className="text-lg">{sla.icon}</span>
        <div>
          <p className={`text-sm font-semibold ${sla.color}`}>{sla.msg}</p>
          <p className="text-xs text-gray-500">Transferencias SPEI antes de las 18:30 h son acreditadas el mismo día</p>
        </div>
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
            <label className="label-field">Cuenta Origen <span className="text-red-500">*</span></label>
            {cuentas.length === 0
              ? <p className="text-sm text-gray-400 italic p-3 border border-dashed border-gray-200 rounded-xl text-center">No hay cuentas activas</p>
              : <div className="space-y-2">
                  {cuentas.map(c => {
                    const cli = clientes.find(x => x.id === c.cliente_id);
                    const sel = form.cuenta_origen_id === c.id;
                    return (
                      <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, cuenta_origen_id: c.id }))}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono font-bold text-sm text-gray-800">{c.numero_cuenta.match(/.{4}/g)?.join(' ')}</p>
                            <p className="text-xs text-gray-500">{c.tipo_cuenta} · {cli ? `${cli.nombre} ${cli.apellido_paterno}` : '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{fmtMoney(c.saldo)}</p>
                            <p className="text-xs text-gray-400">{c.moneda}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
            }
            {errors.origen && <p className="text-red-500 text-xs mt-1">{errors.origen}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium px-2">BANCO DESTINO</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div>
            <label className="label-field">CLABE Interbancaria Destino <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formatCLABE(form.clabe_destino)}
              onChange={e => setForm(f => ({ ...f, clabe_destino: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
              className={`input-field font-mono text-base tracking-widest ${errors.clabe ? 'border-red-400' : clabeRaw.length === 18 ? 'border-emerald-400' : ''}`}
              placeholder="000000 000000 000000"
              maxLength={21}
            />
            <div className="mt-1.5 h-5">
              {clabeRaw.length >= 3 && form.banco_destino ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /><Building2 size={12} />{form.banco_destino}
                </span>
              ) : clabeRaw.length >= 3 && !form.banco_destino ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600"><AlertCircle size={12} />Banco no identificado</span>
              ) : null}
            </div>
            {errors.clabe && <p className="text-red-500 text-xs mt-1">{errors.clabe}</p>}
            {errors.banco && <p className="text-red-500 text-xs">{errors.banco}</p>}
          </div>

          <div>
            <label className="label-field">Nombre del Beneficiario <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.nombre_beneficiario}
              onChange={e => setForm(f => ({ ...f, nombre_beneficiario: e.target.value.toUpperCase() }))}
              className={`input-field uppercase ${errors.beneficiario ? 'border-red-400' : ''}`}
              placeholder="NOMBRE COMPLETO O RAZÓN SOCIAL"
              maxLength={80}
            />
            {errors.beneficiario && <p className="text-red-500 text-xs mt-1">{errors.beneficiario}</p>}
          </div>

          <div>
            <label className="label-field">Importe <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
              <input
                type="number" min={0.01} step={0.01} max={999999.99}
                value={form.importe || ''}
                onChange={e => setForm(f => ({ ...f, importe: Number(e.target.value) }))}
                className={`input-field pl-8 text-xl font-bold ${errors.importe ? 'border-red-400' : ''}`}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">MXN</span>
            </div>
            {cuentaOrigen && form.importe > 0 && (
              <p className={`text-xs mt-1 ${form.importe > cuentaOrigen.saldo ? 'text-red-500' : 'text-gray-400'}`}>
                Disponible: {fmtMoney(cuentaOrigen.saldo)}
              </p>
            )}
            {errors.importe && <p className="text-red-500 text-xs mt-1">{errors.importe}</p>}
          </div>

          <div>
            <label className="label-field">Concepto <span className="text-red-500">*</span></label>
            <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className={`input-field ${errors.concepto ? 'border-red-400' : ''}`}
              placeholder="Motivo de la transferencia" maxLength={60} />
            <p className="text-xs text-gray-400 mt-0.5">{form.concepto.length}/60 caracteres</p>
            {errors.concepto && <p className="text-red-500 text-xs">{errors.concepto}</p>}
          </div>

          <div>
            <label className="label-field">Referencia Numérica <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input type="text" value={form.referencia}
              onChange={e => setForm(f => ({ ...f, referencia: e.target.value.replace(/\D/g, '').slice(0, 7) }))}
              className="input-field font-mono" placeholder="Hasta 7 dígitos" maxLength={7} />
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-gray-700">Comisión SPEI</p>
              <p className="text-xs text-gray-400 mt-0.5">Transferencias entre las 6:30 y 18:30 hrs</p>
            </div>
            <span className="font-bold text-emerald-700">$0.00</span>
          </div>

          <button onClick={() => { if (validate()) setStep('confirm'); }} className="btn-primary w-full justify-center py-3 text-base">
            Continuar <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="card p-6 space-y-5">
          <div className="text-center">
            <ShieldCheck size={28} className="text-primary-600 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Confirma tu transferencia SPEI</p>
            <p className="text-xs text-gray-500">Verifica que los datos sean correctos antes de autorizar</p>
          </div>

          <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-300 text-xs">Cuenta Origen</p>
                <p className="font-mono font-bold">****{cuentaOrigen?.numero_cuenta.slice(-4)}</p>
                <p className="text-primary-300 text-xs">{clienteOrigen ? `${clienteOrigen.nombre} ${clienteOrigen.apellido_paterno}` : '—'}</p>
              </div>
              <ArrowRight size={22} />
              <div className="text-right">
                <p className="text-primary-300 text-xs">Banco Destino</p>
                <p className="font-bold">{form.banco_destino || 'Banco'}</p>
                <p className="text-primary-300 text-xs">{form.nombre_beneficiario}</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-primary-300 text-sm">Importe a transferir</p>
              <p className="text-4xl font-bold text-white">{fmtMoney(form.importe)}</p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
            {([
              ['CLABE Destino', form.clabe_destino.replace(/\D/g, '').match(/.{6}/g)?.join(' ')],
              ['Banco Destino', form.banco_destino],
              ['Beneficiario', form.nombre_beneficiario],
              ['Importe', fmtMoney(form.importe)],
              ['Concepto', form.concepto],
              ...(form.referencia ? [['Referencia', form.referencia]] : []),
              ['Comisión', '$0.00'],
              ['Fecha aplicación', sla.msg],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className={`font-semibold ${k === 'Importe' ? 'text-primary-800 text-base' : 'text-gray-800'} text-right max-w-[60%] break-all`}>{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            Una vez autorizada, la transferencia SPEI no puede cancelarse. Verifica el número de CLABE y el nombre del beneficiario.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('form')} className="btn-secondary flex-1 justify-center"><ArrowLeft size={16} />Modificar</button>
            <button onClick={handleConfirm} disabled={processing} className="btn-primary flex-1 justify-center py-3">
              {processing
                ? <><Loader2 size={16} className="animate-spin" />Enviando SPEI...</>
                : <><ShieldCheck size={16} />Autorizar SPEI</>
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
            <h2 className="text-2xl font-bold text-white">¡SPEI Enviado!</h2>
            <p className="text-emerald-100 text-sm mt-1">Tu transferencia interbancaria fue enviada exitosamente</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="border border-dashed border-gray-300 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comprobante SPEI</p>
                <p className="text-xs font-mono font-bold text-primary-700">{folio}</p>
              </div>
              <div className="h-px bg-gray-100" />
              {([
                ['Fecha y hora', new Date(fechaOp).toLocaleString('es-MX')],
                ['Banco destino', form.banco_destino],
                ['CLABE destino', form.clabe_destino.replace(/\D/g, '').match(/.{6}/g)?.join(' ') ?? ''],
                ['Beneficiario', form.nombre_beneficiario],
                ['Importe', fmtMoney(form.importe)],
                ['Concepto', form.concepto],
                ...(form.referencia ? [['Referencia', form.referencia]] : []),
                ['Aplicación', sla.msg],
                ['Estatus', 'Enviado a Banxico'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[55%] break-all">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              <Clock size={14} className="flex-shrink-0" />
              Conserva el folio <strong className="font-mono mx-1">{folio}</strong> para cualquier aclaración
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

export default TransferenciasOtrosBancos;
