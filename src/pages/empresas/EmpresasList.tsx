import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2, Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { Empresa } from '../../types';
import { empresasService } from '../../services/empresasService';

const EmpresasList: React.FC = () => {
  const [data, setData] = useState<Empresa[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteItem, setDeleteItem] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState<'activas' | 'inactivas' | 'todas'>('activas');

  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await empresasService.getAll({ page, limit, buscar: search || undefined, estatus: filtroEstatus });
      const raw = res.data as any;
      const items: Empresa[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setData(items);
      setTotal(raw?.total ?? items.length);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, [page, search, filtroEstatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      await empresasService.delete(deleteItem.id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al eliminar');
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const columns: Column<Empresa>[] = [
    {
      key: 'razon_social',
      header: 'Empresa',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{r.razon_social}</p>
            {r.nombre_comercial && <p className="text-xs text-gray-500">{r.nombre_comercial}</p>}
          </div>
        </div>
      ),
    },
    { key: 'rfc', header: 'RFC', className: 'font-mono text-xs text-gray-700' },
    {
      key: 'sector',
      header: 'Sector',
      render: r => r.sector
        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{r.sector}</span>
        : <span className="text-gray-400">—</span>,
    },
    { key: 'telefono', header: 'Teléfono', render: r => r.telefono ?? <span className="text-gray-400">—</span> },
    { key: 'email_contacto', header: 'Email', render: r => r.email_contacto ?? <span className="text-gray-400">—</span> },
    {
      key: 'activo',
      header: 'Estatus',
      render: r => r.activo
        ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Activa</span>
        : <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Inactiva</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión de empresas y sus clientes/cuentas vinculadas
            {total > 0 && <span className="ml-2 text-primary-600 font-medium">({total} registros)</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 shadow-sm"
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value as any)}
          >
            <option value="activas">Solo empresas activas</option>
            <option value="todas">Empresas activas e inactivas</option>
            <option value="inactivas">Mostrar solo inactivas</option>
          </select>
          <button onClick={loadData} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/empresas/nueva" className="btn-primary">
            <Plus size={16} />Nueva Empresa
          </Link>
        </div>
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
            <span className="text-sm">Cargando empresas...</span>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Buscar por nombre, RFC, sector..."
            onSearch={handleSearch}
            searchValue={search}
            pageSize={limit}
            actions={row => (
              <>
                <Link to={`/empresas/${row.id}`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ver detalle">
                  <Eye size={15} />
                </Link>
                <Link to={`/empresas/${row.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                  <Edit2 size={15} />
                </Link>
                <button onClick={() => setDeleteItem(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Desactivar">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          />
        )}
        {!loading && total > limit && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <span className="text-sm text-gray-500">Página {page} · {Math.ceil(total / limit)} páginas</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-sm disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="btn-secondary py-1 px-3 text-sm disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`¿Desactivar la empresa "${deleteItem?.razon_social}"? Se registrará como inactiva.`}
      />
    </div>
  );
};

export default EmpresasList;
