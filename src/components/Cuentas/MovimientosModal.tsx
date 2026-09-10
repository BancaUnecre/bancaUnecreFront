import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, TrendingUp, TrendingDown, FileText, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';
import { exportService } from '../../services/exportService';

interface MovimientosModalProps {
  cuentaId: number;
  onClose: () => void;
}

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
  tipo_pago?: string;
  dias_credito?: number;
}

const fmtMoney = (n: number) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

const tipoColor: Record<string, string> = {
  TRANSFERENCIA: 'bg-purple-100 text-purple-700',
  DEPOSITO:      'bg-emerald-100 text-emerald-700',
  RETIRO:        'bg-orange-100 text-orange-700',
  PAGO:          'bg-sky-100 text-sky-700',
  'COMPRA POS':  'bg-sky-100 text-sky-700',
  ABONO:         'bg-emerald-100 text-emerald-700',
  APERTURA:      'bg-blue-100 text-blue-700',
};

const MovimientosModal: React.FC<MovimientosModalProps> = ({ cuentaId, onClose }) => {
  const [data, setData]       = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportService.descargarEstadoCuentaPdf(cuentaId);
    } catch (err: any) {
      alert('Error al exportar PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await exportService.descargarEstadoCuentaExcel(cuentaId);
    } catch (err: any) {
      alert('Error al exportar Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      setExportingExcel(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/movimientos?cuenta_id=${cuentaId}`);
        const raw = res.data as any;
        setData(Array.isArray(raw) ? raw : (raw?.data ?? []));
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Error al cargar movimientos');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [cuentaId]);

  // DEPOSITO / ABONO = abono, RETIRO/PAGO = cargo, TRANSFERENCIA = si es destino es abono
  const isAbono = (m: Movimiento) => {
    if (m.tipo === 'DEPOSITO' || m.tipo === 'ABONO' || m.tipo === 'APERTURA') return true;
    if (m.tipo === 'RETIRO' || m.tipo === 'PAGO' || m.tipo === 'COMPRA POS') return false;
    return m.cuenta_destino_id === cuentaId;
  };

  const totalAbonos = data.filter(m => isAbono(m)).reduce((s, m) => s + Number(m.importe), 0);
  const totalCargos = data.filter(m => !isAbono(m)).reduce((s, m) => s + Number(m.importe), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Historial de Movimientos</h2>
            <p className="text-sm text-gray-500 mt-1">Cuenta #{cuentaId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Descargar Estado de Cuenta en PDF"
            >
              {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Descargar Estado de Cuenta en Excel (.xlsx)"
            >
              {exportingExcel ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Resumen */}
        {!loading && !error && data.length > 0 && (
          <div className="bg-gray-50/50 p-4 border-b border-gray-100 grid grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Abonos</p>
                <p className="font-bold text-emerald-600">{fmtMoney(totalAbonos)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-lg text-red-600">
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Cargos</p>
                <p className="font-bold text-red-600">{fmtMoney(totalCargos)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-gray-500">Movimientos</p>
                <p className="font-bold text-gray-700">{data.length} registros</p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl mx-4 mt-4 px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />{error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Cargando movimientos...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No se encontraron movimientos para esta cuenta.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-white text-left">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Folio</th>
                  <th className="px-4 py-3 font-semibold">Concepto / Detalles</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-right">Cargo</th>
                  <th className="px-4 py-3 font-semibold text-right">Abono</th>
                  <th className="px-4 py-3 font-semibold text-right">Saldo tras op.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m, i) => {
                  const abono = isAbono(m);
                  return (
                    <tr
                      key={m.id}
                      className={`border-t border-gray-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-gray-800">
                          {new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(m.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-500">{m.folio}</p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-gray-700 leading-tight">{m.concepto ?? '-'}</p>
                        {(m.tipo === 'PAGO' || m.tipo === 'COMPRA POS') && m.tipo_pago === 'CREDITO' && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider shadow-sm">
                            Venta a Crédito ({m.dias_credito} días)
                          </span>
                        )}
                        {(m.tipo === 'PAGO' || m.tipo === 'COMPRA POS') && m.tipo_pago === 'DEBITO' && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                            Pago con Saldo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoColor[m.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!abono
                          ? <span className="font-semibold text-red-600">- {fmtMoney(Number(m.importe))}</span>
                          : <span className="text-gray-300">-</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {abono
                          ? <span className="font-semibold text-emerald-600">+ {fmtMoney(Number(m.importe))}</span>
                          : <span className="text-gray-300">-</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-800">{fmtMoney(m.saldo_origen_despues)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovimientosModal;
