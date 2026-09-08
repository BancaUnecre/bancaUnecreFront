import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, CreditCard, PiggyBank, FileText, BarChart3, ListOrdered, SmartphoneNfc } from 'lucide-react';
import DataTable, { type Column } from '../../components/common/DataTable';
import type { Cuenta } from '../../types';
import { cuentasService } from '../../services/cuentasService';
import MovimientosModal from '../../components/Cuentas/MovimientosModal';
import TarjetasTerminalModal from '../../components/Cuentas/TarjetasTerminalModal';
import EditarCuentaModal from '../../components/Cuentas/EditarCuentaModal';
import { Settings2 } from 'lucide-react';

const fmtMoney = (n: number, currency = 'MXN') =>
  n.toLocaleString('es-MX', { style: 'currency', currency, minimumFractionDigits: 2 });

const TIPO_ICON: Record<string, React.FC<any>> = {
  AHORRO: PiggyBank,
  CHEQUES: FileText,
  NOMINA: CreditCard,
  INVERSION: BarChart3,
};

const EstatusBadge: React.FC<{ estatus: number }> = ({ estatus }) => {
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: 'Activa', cls: 'bg-emerald-100 text-emerald-700' },
    0: { label: 'Cerrada', cls: 'bg-gray-100 text-gray-600' },
  };
  const { label, cls } = map[estatus] ?? { label: 'Desconocido', cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
};

const CuentasList: React.FC = () => {
  const [data, setData] = useState<Cuenta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCuentaId, setSelectedCuentaId] = useState<number | null>(null);
  const [selectedTarjetaCuentaId, setSelectedTarjetaCuentaId] = useState<number | null>(null);
  const [cuentaParaEditar, setCuentaParaEditar] = useState<Cuenta | null>(null);

  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cuentasService.getAll({ page, limit });
      const raw = res.data as any;
      const items: Cuenta[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setData(items);
      setTotal(raw?.total ?? items.length);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data.filter(c =>
    [c.numero_cuenta, c.clabe, c.tipo_cuenta].some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Cuenta>[] = [
    { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
    {
      key: 'numero_cuenta',
      header: 'Cuenta',
      render: r => {
        const Icon = TIPO_ICON[r.tipo_cuenta] ?? CreditCard;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-primary-600" />
            </div>
            <div>
              <p className="font-mono font-semibold text-gray-900 text-sm tracking-wide">{r.numero_cuenta}</p>
              <p className="text-xs text-gray-500">{r.tipo_cuenta} Â· {r.moneda}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'clabe', header: 'CLABE', className: 'font-mono text-xs text-gray-700', render: r => r.clabe ?? <span className="text-gray-400">â€”</span> },
    { key: 'cliente_id', header: 'Cliente ID', className: 'text-gray-600' },
    
    {
      key: 'saldos',
      header: 'Saldos',
      render: r => {
        const retenido = Number(r.saldo_retenido) || 0;
        const disponible = r.saldo - retenido;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 mr-2">Total:</span>
              <span className={`font-bold ${r.saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {fmtMoney(r.saldo, r.moneda)}
              </span>
            </div>
            {retenido > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 mr-2">Retenido:</span>
                <span className="text-orange-600 font-medium">
                  -{fmtMoney(retenido, r.moneda)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-0.5 mt-0.5">
              <span className="text-gray-600 font-medium mr-2">Dispon:</span>
              <span className={`font-bold ${disponible >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
                {fmtMoney(disponible, r.moneda)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'limite_credito',
      header: 'LÃ­mite CrÃ©dito',
      render: r => r.limite_credito > 0
        ? <span className="text-blue-700 font-semibold">{fmtMoney(r.limite_credito, r.moneda)}</span>
        : <span className="text-gray-400">â€”</span>,
    },
    { key: 'dia_corte', header: 'Día de Corte', render: r => <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium text-xs">{r.dia_corte === 31 ? 'Último del mes' : 'Día ' + (r.dia_corte ?? 1)}</span> },
      { key: 'estatus', header: 'Estatus', render: r => <EstatusBadge estatus={r.estatus} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: r => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCuentaId(r.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors whitespace-nowrap"
          >
            <ListOrdered size={14} />
            Movimientos
          </button>
          <button
            onClick={() => setCuentaParaEditar(r)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <Settings2 size={14} />
            Editar
          </button>
          <button
            onClick={() => setSelectedTarjetaCuentaId(r.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            <SmartphoneNfc size={14} />
            Terminal POS
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas Bancarias</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Consulta de todas las cuentas en el sistema
            {total > 0 && <span className="ml-2 text-primary-600 font-medium">({total} registros)</span>}
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Recargar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Cargando cuentas...</span>
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Buscar por nÃºmero, CLABE o tipo..."
            onSearch={setSearch}
            searchValue={search}
            pageSize={limit}
          />
        )}
        {!loading && total > limit && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <span className="text-sm text-gray-500">PÃ¡gina {page} Â· {Math.ceil(total / limit)} pÃ¡ginas Â· {total} cuentas</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-sm disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="btn-secondary py-1 px-3 text-sm disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {selectedCuentaId && (
        <MovimientosModal
          cuentaId={selectedCuentaId}
          onClose={() => setSelectedCuentaId(null)}
        />
      )}

      {selectedTarjetaCuentaId && (
        <TarjetasTerminalModal
          cuentaId={selectedTarjetaCuentaId}
          onClose={() => setSelectedTarjetaCuentaId(null)}
        />
      )}
      {cuentaParaEditar && (
        <EditarCuentaModal
          isOpen={true}
          cuenta={cuentaParaEditar}
          onClose={() => setCuentaParaEditar(null)}
          onSaved={() => { setCuentaParaEditar(null); loadData(); }}
        />
      )}
    </div>
  );
};

export default CuentasList;




