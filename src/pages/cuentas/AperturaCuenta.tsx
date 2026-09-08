import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, CheckCircle2, ChevronRight, CreditCard,
  PiggyBank, BarChart3, FileText, DollarSign, Check, Copy,
  Users, Loader2, AlertCircle,
} from 'lucide-react';
import type { Cliente, Cuenta } from '../../types';
import { clientesService } from '../../services/clientesService';
import { cuentasService } from '../../services/cuentasService';
import { nivelCuentaService } from '../../services/nivelCuentaService';
import type { NivelCuenta } from '../../types';

type TipoCuenta = 'AHORRO' | 'CHEQUES' | 'NOMINA' | 'INVERSION';
type Moneda = 'MXN' | 'USD';

interface CuentaConfig {
  tipo_cuenta: TipoCuenta | '';
  moneda: string;
  nivel_cuenta_id: number;
  saldo: number;
  limite_credito: number;
  dia_corte: number;
  tasa_credito: number;
}

const genAccountNumber = () => '1000' + String(Date.now()).slice(-12).padStart(12, '0');
// CLABE = 3 banco (014) + 3 ciudad (180) + 11 cuenta + 1 control = 18 dÃ­gitos
const genCLABE = (acc: string) => '014180' + acc.slice(-11).padStart(11, '0') + '7';

const TIPO_ICONS: Record<TipoCuenta, React.FC<any>> = {
  AHORRO: PiggyBank, CHEQUES: FileText, NOMINA: CreditCard, INVERSION: BarChart3,
};
const TIPO_DESC: Record<TipoCuenta, string> = {
  AHORRO: 'Genera rendimientos. Ideal para ahorro personal.',
  CHEQUES: 'EmisiÃ³n de cheques y altos volÃºmenes.',
  NOMINA: 'Cuenta transaccional con tarjeta de dÃ©bito.',
  INVERSION: 'Instrumentos financieros con mayor rendimiento.',
};

const fmtMoney = (n: number, currency = 'MXN') =>
  n.toLocaleString('es-MX', { style: 'currency', currency, minimumFractionDigits: 2 });

const nombreCliente = (c: Cliente) =>
  `${c.nombre} ${c.apellido_paterno}${c.apellido_materno ? ' ' + c.apellido_materno : ''}`.trim();

const Steps: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['Seleccionar Cliente', 'Configurar Cuenta', 'Confirmar'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-primary-700 text-white ring-4 ring-primary-200' : 'bg-gray-200 text-gray-500'}`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? 'text-primary-800' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 flex-shrink-0 ${n < current ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const AperturaCuenta: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [nivelesCuenta, setNivelesCuenta] = useState<NivelCuenta[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cuentasCliente, setCuentasCliente] = useState<Cuenta[]>([]);
  const [config, setConfig] = useState<CuentaConfig>({
    tipo_cuenta: '', moneda: 'MXN', nivel_cuenta_id: 1, saldo: 0, limite_credito: 0, dia_corte: 1, tasa_credito: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ numero: string; clabe: string; folio: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    nivelCuentaService.getAll().then(res => {
      const raw = res.data as any;
      setNivelesCuenta(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }).catch(() => {});
  }, []);

  const searchClientes = useCallback(async (q: string) => {
    setLoadingClientes(true);
    try {
      const res = await clientesService.getAll({ buscar: q || undefined, limit: 50 });
      const raw = res.data as any;
      setClientes(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  }, []);

  useEffect(() => { searchClientes(''); }, [searchClientes]);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    searchClientes(q);
  };

  const handleSelectCliente = async (c: Cliente) => {
    setCliente(c);
    try {
      const res = await cuentasService.getByCliente(c.id!);
      const raw = res.data as any;
      setCuentasCliente(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setCuentasCliente([]);
    }
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!config.tipo_cuenta) e.tipo = 'Selecciona un tipo de cuenta';
    if (config.saldo < 0) e.deposito = 'El depÃ³sito no puede ser negativo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!cliente) return;
    setProcessing(true);
    setApiError(null);
    const numero = genAccountNumber();
    const clabe = genCLABE(numero);
    try {
      await cuentasService.create({
        cliente_id: cliente.id!,
        numero_cuenta: numero,
        clabe,
        tipo_cuenta: config.tipo_cuenta as string,
        moneda: config.moneda,
        saldo: Number(config.saldo) || 0,
        limite_credito: Number(config.limite_credito) || 0,
        dia_corte: Number(config.dia_corte) || 1,
        tasa_credito: Number(config.tasa_credito) || 0,
        nivel_cuenta_id: config.nivel_cuenta_id,
        estatus: 1,
      } as any);
      setResult({ numero, clabe, folio: `APT-${Date.now().toString().slice(-8)}` });
      setStep(4);
    } catch (e: any) {
      const serverErr: string = e?.response?.data?.error ?? '';
      const serverMsg: string = e?.response?.data?.message ?? e?.message ?? 'Error al aperturar la cuenta';
      let msg = serverMsg;
      if (serverErr.includes('UNIQUE') || serverErr.includes('duplicate') || serverErr === 'Validation error') {
        msg = 'Ya existe una cuenta con ese nÃºmero o CLABE. Intenta de nuevo.';
      } else if (serverErr.includes('truncated') || serverErr.includes('Truncated')) {
        msg = `${serverMsg}: un campo excede la longitud permitida.`;
      } else if (serverErr) {
        msg = `${serverMsg}: ${serverErr}`;
      }
      setApiError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const nivelActual = nivelesCuenta.find(n => n.id === config.nivel_cuenta_id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft size={16} />Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apertura de Cuenta</h1>
          <p className="text-gray-500 text-sm">Registro de nueva cuenta bancaria para un cliente</p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{apiError}
        </div>
      )}

      {step < 4 && (
        <div className="card p-6">
          <Steps current={step} />

          {/* PASO 1: Seleccionar cliente */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="input-field pl-9"
                  placeholder="Buscar cliente por nombre, RFC o CURP..."
                  autoFocus
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {loadingClientes ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />Buscando...
                  </div>
                ) : clientes.length === 0 ? (
                  <p className="text-center py-10 text-gray-400 text-sm">Sin resultados</p>
                ) : clientes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCliente(c)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-primary-50 transition-colors ${cliente?.id === c.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {c.nombre[0]}{c.apellido_paterno[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{nombreCliente(c)}</p>
                      <p className="text-xs text-gray-500 font-mono">{c.rfc} Â· {c.curp}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{cuentasCliente.length} cuentas</span>
                      {cliente?.id === c.id && <CheckCircle2 size={18} className="text-primary-600" />}
                    </div>
                  </button>
                ))}
              </div>

              {cliente && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold">
                      {cliente.nombre[0]}{cliente.apellido_paterno[0]}
                    </div>
                    <div>
                      <p className="font-bold text-primary-900">{nombreCliente(cliente)}</p>
                      <p className="text-xs text-primary-600">{cuentasCliente.length} cuenta(s) Â· Nivel {cliente.nivel_cuenta_id}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="text-primary-600" size={22} />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => { if (cliente) setStep(2); }}
                  disabled={!cliente}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Configurar cuenta */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="label-field mb-2">Tipo de Cuenta <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {(['AHORRO', 'CHEQUES', 'NOMINA', 'INVERSION'] as TipoCuenta[]).map(tipo => {
                    const Icon = TIPO_ICONS[tipo];
                    const sel = config.tipo_cuenta === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setConfig(c => ({ ...c, tipo_cuenta: tipo }))}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${sel ? 'bg-primary-100' : 'bg-gray-100'}`}>
                          <Icon size={20} className={sel ? 'text-primary-700' : 'text-gray-500'} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${sel ? 'text-primary-800' : 'text-gray-700'}`}>{tipo}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{TIPO_DESC[tipo]}</p>
                        </div>
                        {sel && <CheckCircle2 size={16} className="text-primary-600 ml-auto flex-shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
                {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>}
              </div>

              <div>
                <label className="label-field mb-2">Moneda</label>
                <div className="flex gap-3">
                  {(['MXN', 'USD'] as Moneda[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, moneda: m }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${config.moneda === m ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <DollarSign size={14} />{m}
                      {config.moneda === m && <CheckCircle2 size={14} className="text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {nivelesCuenta.length > 0 && (
                <div>
                  <label className="label-field mb-2">Nivel de Cuenta</label>
                  <div className="grid grid-cols-3 gap-3">
                    {nivelesCuenta.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setConfig(c => ({ ...c, nivel_cuenta_id: n.id }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${config.nivel_cuenta_id === n.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <p className="font-semibold text-sm text-gray-800">{n.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.limite_deposito}</p>
                        {config.nivel_cuenta_id === n.id && <CheckCircle2 size={14} className="text-primary-600 mt-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">DepÃ³sito Inicial</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={config.saldo}
                      onChange={e => setConfig(c => ({ ...c, saldo: Number(e.target.value) }))}
                      className={`input-field pl-7 ${errors.deposito ? 'border-red-400' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.deposito && <p className="text-red-500 text-xs mt-1">{errors.deposito}</p>}
                </div>
                {(config.tipo_cuenta === 'CHEQUES' || config.tipo_cuenta === 'INVERSION') && (
                  <>
                    <div>
                      <div>
  <label className="label-field">Día de Corte</label>
  <div className="relative mb-4">
    <select
      value={config.dia_corte}
      onChange={e => setConfig(c => ({ ...c, dia_corte: Number(e.target.value) }))}
      className="input-field"
    >
      {[...Array(28)].map((_, i) => (
        <option key={i+1} value={i+1}>Día {i+1}</option>
      ))}
      <option value={31}>Último día del mes</option>
    </select>
  </div>
</div>
<label className="label-field">Límite de Crédito</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={config.limite_credito}
                          onChange={e => setConfig(c => ({ ...c, limite_credito: Number(e.target.value) }))}
                          className="input-field pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label-field">Tasa de CrÃ©dito (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={config.tasa_credito}
                          onChange={e => setConfig(c => ({ ...c, tasa_credito: Number(e.target.value) }))}
                          className="input-field pr-7"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft size={16} />Anterior
                </button>
                <button onClick={() => { if (validateStep2()) setStep(3); }} className="btn-primary">
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: ConfirmaciÃ³n */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <span className="text-amber-600 text-lg">âš ï¸</span>
                <p className="text-sm text-amber-800">Revisa los datos antes de aperturar. Una vez creada la cuenta, el nÃºmero y CLABE no podrÃ¡n cambiarse.</p>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Titular</p>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold">
                    {cliente!.nombre[0]}{cliente!.apellido_paterno[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{nombreCliente(cliente!)}</p>
                    <p className="text-xs text-gray-500 font-mono">{cliente!.rfc} Â· {cliente!.curp}</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ConfiguraciÃ³n</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    ['Tipo de cuenta', config.tipo_cuenta],
                    ['Moneda', config.moneda],
                    ['Nivel', nivelActual?.nombre ?? `#${config.nivel_cuenta_id}`],
                    ['DepÃ³sito inicial', fmtMoney(config.saldo, config.moneda)],
                    ...(config.limite_credito > 0 ? [['LÃ­mite de crÃ©dito', fmtMoney(config.limite_credito, config.moneda)]] : []),
                    ...(config.tasa_credito > 0 ? [['Tasa de crÃ©dito', `${config.tasa_credito}%`]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-semibold text-gray-800">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft size={16} />Anterior
                </button>
                <button onClick={handleConfirm} disabled={processing} className="btn-success">
                  {processing ? (
                    <><Loader2 size={16} className="animate-spin" />Aperturando...</>
                  ) : (
                    <><CreditCard size={16} />Confirmar y Aperturar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASO 4: Ã‰xito */}
      {step === 4 && result && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Â¡Cuenta Aperturada!</h2>
            <p className="text-emerald-100 mt-1 text-sm">La cuenta ha sido creada exitosamente en el sistema</p>
            <p className="text-emerald-200 text-xs mt-1">Folio: {result.folio}</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-primary-900 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative">
                <p className="text-primary-300 text-xs font-semibold uppercase tracking-widest mb-1">Banco Unecre</p>
                <p className="text-white/60 text-xs mb-4">{config.tipo_cuenta} Â· {config.moneda}</p>
                <p className="text-2xl font-bold tracking-widest font-mono mb-1">
                  {result.numero.match(/.{4}/g)?.join(' ')}
                </p>
                <p className="text-primary-300 text-xs">CLABE: {result.clabe}</p>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-primary-300 text-xs">Titular</p>
                    <p className="text-white font-semibold text-sm">{nombreCliente(cliente!)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-300 text-xs">Saldo inicial</p>
                    <p className="text-emerald-400 font-bold">{fmtMoney(config.saldo, config.moneda)}</p>
                  </div>
                </div>
              </div>
            </div>

            {[
              { label: 'NÃºmero de Cuenta', value: result.numero, key: 'numero' },
              { label: 'CLABE Interbancaria', value: result.clabe, key: 'clabe' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="font-mono font-bold text-gray-800">{item.value}</p>
                </div>
                <button onClick={() => copyText(item.value, item.key)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  {copied === item.key ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} className="text-gray-400" />}
                </button>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/clientes')} className="btn-secondary flex-1 justify-center">
                <Users size={16} />Ver Clientes
              </button>
              <button
                onClick={() => {
                  setStep(1); setCliente(null); setSearch(''); setResult(null); setApiError(null);
                  setConfig({ tipo_cuenta: '', moneda: 'MXN', nivel_cuenta_id: 1, saldo: 0, limite_credito: 0, dia_corte: 1, tasa_credito: 0 });
                }}
                className="btn-primary flex-1 justify-center"
              >
                <CreditCard size={16} />Nueva Apertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AperturaCuenta;


