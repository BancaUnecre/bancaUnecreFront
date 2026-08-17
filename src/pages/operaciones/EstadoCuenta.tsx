import React, { useState, useEffect, useCallback } from 'react';
import { Search, Printer, TrendingUp, TrendingDown, CreditCard, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import type { Cliente, Cuenta } from '../../types';
import { clientesService } from '../../services/clientesService';
import { cuentasService } from '../../services/cuentasService';
import { movimientosService } from '../../services/movimientosService';

interface Movimiento {
  id: number;
  folio: string;
  tipo: string;
  cuenta_origen_id: number;
  cuenta_destino_id: number | null;
  importe: number;
  saldo_origen_antes: number;
  saldo_origen_despues: number;
  concepto: string | null;
  estatus: string;
  fecha: string;
}

const fmtMoney = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

const tipoColor: Record<string, string> = {
  TRANSFERENCIA: 'bg-purple-100 text-purple-700',
  DEPOSITO:      'bg-emerald-100 text-emerald-700',
  RETIRO:        'bg-orange-100 text-orange-700',
  PAGO:          'bg-sky-100 text-sky-700',
};

const today = new Date().toISOString().slice(0, 10);
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const EstadoCuenta: React.FC = () => {
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cuentasCliente, setCuentasCliente] = useState<Cuenta[]>([]);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [fechaDesde, setFechaDesde] = useState(firstOfMonth);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [tipoFilter, setTipoFilter] = useState('');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingClientes(true);
      try {
        const res = await clientesService.getAll({ limit: 200 });
        const raw = res.data as any;
        setClientes(Array.isArray(raw) ? raw : (raw?.data ?? []));
      } catch {
        setLoadError('Error al cargar clientes');
      } finally {
        setLoadingClientes(false);
      }
    };
    load();
  }, []);

  const selectCliente = async (c: Cliente) => {
    setCliente(c);
    setCuenta(null);
    setMovimientos([]);
    setClienteSearch('');
    setLoadingCuentas(true);
    try {
      const res = await cuentasService.getByCliente(c.id!);
      const raw = res.data as any;
      setCuentasCliente(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setCuentasCliente([]);
    } finally {
      setLoadingCuentas(false);
    }
  };

  const loadMovimientos = useCallback(async () => {
    if (!cuenta) return;
    setLoadingMovimientos(true);
    try {
      const res = await movimientosService.getAll({ cuenta_id: cuenta.id, limit: 100 });
      const raw = res.data as any;
      let rows: Movimiento[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      if (fechaDesde) rows = rows.filter(m => m.fecha.slice(0, 10) >= fechaDesde);
      if (fechaHasta) rows = rows.filter(m => m.fecha.slice(0, 10) <= fechaHasta);
      if (tipoFilter) rows = rows.filter(m => m.tipo === tipoFilter);
      setMovimientos(rows);
    } catch {
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  }, [cuenta, fechaDesde, fechaHasta, tipoFilter]);

  useEffect(() => {
    loadMovimientos();
  }, [loadMovimientos]);

  const totalAbonos = movimientos
    .filter(m => m.cuenta_destino_id === cuenta?.id)
    .reduce((s, m) => s + Number(m.importe), 0);

  const totalCargos = movimientos
    .filter(m => m.cuenta_origen_id === cuenta?.id)
    .reduce((s, m) => s + Number(m.importe), 0);

  const tiposUnicos = [...new Set(movimientos.map(m => m.tipo))];

  const filteredClientes = clientes.filter(c => {
    const q = clienteSearch.toLowerCase();
    return !q || `${c.nombre} ${c.apellido_paterno}`.toLowerCase().includes(q) || c.rfc.toLowerCase().includes(q);
  });

  const isCargo = (m: Movimiento) => m.cuenta_origen_id === cuenta?.id;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estado de Cuenta</h1>
          <p className="text-gray-500 text-sm mt-0.5">Consulta de movimientos y saldos por cuenta</p>
        </div>
        {cuenta && (
          <button className="btn-secondary"><Printer size={16} />Imprimir / PDF</button>
        )}
      </div>

      {loadError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700">1. Seleccionar Cliente</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={clienteSearch} onChange={e => setClienteSearch(e.target.value)}
                className="input-field pl-8 text-sm" placeholder="Nombre o RFC..." />
            </div>
            {loadingClientes ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" />Cargando...
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredClientes.map(c => (
                  <button key={c.id} onClick={() => selectCliente(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${cliente?.id === c.id ? 'bg-primary-50 text-primary-800 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                    <p className="font-medium leading-tight">{c.nombre} {c.apellido_paterno}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.rfc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {cliente && (
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-700">2. Seleccionar Cuenta</h3>
              {loadingCuentas
                ? <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={14} className="animate-spin" />Cargando...</div>
                : cuentasCliente.length === 0
                  ? <p className="text-xs text-gray-400">Sin cuentas registradas</p>
                  : cuentasCliente.map(c => (
                    <button key={c.id} onClick={() => setCuenta(c)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${cuenta?.id === c.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-mono text-xs font-bold text-gray-800">****{c.numero_cuenta.slice(-4)}</p>
                      <p className="text-xs text-gray-500">{c.tipo_cuenta}</p>
                      <p className="font-bold text-emerald-600 text-sm mt-1">{fmtMoney(c.saldo)}</p>
                    </button>
                  ))
              }
            </div>
          )}

          {cuenta && (
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-700">3. Período</h3>
              <div>
                <label className="label-field text-xs">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="input-field text-sm" />
              </div>
              <div>
                <label className="label-field text-xs">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="input-field text-sm" />
              </div>
              {tiposUnicos.length > 0 && (
                <div>
                  <label className="label-field text-xs">Tipo</label>
                  <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} className="input-field text-sm">
                    <option value="">Todos</option>
                    {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!cuenta ? (
            <div className="card py-20 flex flex-col items-center gap-3 text-gray-300">
              <CreditCard size={48} />
              <p className="text-gray-400 text-sm">Selecciona un cliente y una cuenta para ver el estado de cuenta</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl p-5 text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-primary-300 text-xs font-semibold uppercase tracking-widest">Estado de Cuenta</p>
                    <p className="text-white font-bold text-lg mt-1">{cliente!.nombre} {cliente!.apellido_paterno}</p>
                    <p className="font-mono text-primary-200 mt-0.5">{cuenta.numero_cuenta.match(/.{4}/g)?.join(' ')}</p>
                    {cuenta.clabe && <p className="text-primary-300 text-xs mt-0.5">CLABE: {cuenta.clabe}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-primary-300 text-xs">Saldo Actual</p>
                    <p className="text-3xl font-bold text-white">{fmtMoney(cuenta.saldo)}</p>
                    <p className="text-primary-300 text-xs mt-1">{cuenta.tipo_cuenta} · {cuenta.moneda}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Abonos',  value: fmtMoney(totalAbonos),        icon: TrendingUp,   color: 'text-emerald-600' },
                  { label: 'Total Cargos',  value: fmtMoney(totalCargos),        icon: TrendingDown, color: 'text-red-500' },
                  { label: 'Movimientos',   value: movimientos.length.toString(), icon: BarChart3,    color: 'text-blue-600' },
                  { label: 'Saldo Actual',  value: fmtMoney(cuenta.saldo),       icon: CreditCard,   color: 'text-gray-700' },
                ].map(item => (
                  <div key={item.label} className="card p-4 text-center">
                    <item.icon size={20} className={`mx-auto mb-1 ${item.color}`} />
                    <p className={`font-bold text-base ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="card overflow-hidden">
                {loadingMovimientos ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                    <Loader2 size={20} className="animate-spin" /><span className="text-sm">Cargando movimientos...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-primary-800 text-white">
                          <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Fecha</th>
                          <th className="px-4 py-3 text-left font-semibold">Folio</th>
                          <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                          <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                          <th className="px-4 py-3 text-right font-semibold">Cargo</th>
                          <th className="px-4 py-3 text-right font-semibold">Abono</th>
                          <th className="px-4 py-3 text-right font-semibold">Saldo tras op.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin movimientos en el período seleccionado</td></tr>
                        ) : movimientos.map((m, i) => {
                          const cargo = isCargo(m);
                          const saldoTras = cargo ? m.saldo_origen_despues : m.saldo_origen_antes + Number(m.importe);
                          return (
                            <tr key={m.id} className={`border-t border-gray-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <p className="font-semibold text-gray-800">{new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>
                                <p className="text-xs text-gray-400">{new Date(m.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                              </td>
                              <td className="px-4 py-3"><p className="font-mono text-xs text-gray-500">{m.folio}</p></td>
                              <td className="px-4 py-3 max-w-xs"><p className="text-gray-700 leading-tight">{m.concepto ?? '—'}</p></td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoColor[m.tipo] ?? 'bg-gray-100 text-gray-600'}`}>{m.tipo}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {cargo ? <span className="font-semibold text-red-600">- {fmtMoney(Number(m.importe))}</span> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {!cargo ? <span className="font-semibold text-emerald-600">+ {fmtMoney(Number(m.importe))}</span> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right"><span className="font-bold text-gray-800">{fmtMoney(saldoTras)}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {movimientos.length > 0 && (
                        <tfoot>
                          <tr className="bg-primary-50 border-t-2 border-primary-200">
                            <td colSpan={4} className="px-4 py-3 text-sm font-bold text-primary-800">TOTALES DEL PERÍODO</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">- {fmtMoney(totalCargos)}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">+ {fmtMoney(totalAbonos)}</td>
                            <td className="px-4 py-3 text-right font-bold text-primary-800">{fmtMoney(cuenta.saldo)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstadoCuenta;
