import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, UserCheck, UserX, FolderOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { Cliente } from '../../types';
import { clientesService } from '../../services/clientesService';

const EstatusBadge: React.FC<{ estatus: number }> = ({ estatus }) => {
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: 'Activo', cls: 'bg-emerald-100 text-emerald-700' },
    2: { label: 'Bloqueado', cls: 'bg-red-100 text-red-700' },
    0: { label: 'Inactivo', cls: 'bg-gray-100 text-gray-600' },
  };
  const { label, cls } = map[estatus] ?? { label: 'Desconocido', cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
};

const ClientesList: React.FC = () => {
  const [data, setData] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientesService.getAll({ page, limit, buscar: search || undefined });
      const raw = res.data as any;
      const items: Cliente[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const totalCount: number = raw?.total ?? items.length;
      setData(items);
      setTotal(totalCount);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await clientesService.delete(deleteId);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al eliminar');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const columns: Column<Cliente>[] = [
    { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
    {
      key: 'nombre',
      header: 'Nombre Completo',
      render: r => (
        <span className="font-medium text-gray-900">
          {r.nombre} {r.apellido_paterno} {r.apellido_materno ?? ''}
        </span>
      ),
    },
    { key: 'curp', header: 'CURP', className: 'font-mono text-xs' },
    { key: 'rfc', header: 'RFC', className: 'font-mono text-xs' },
    { key: 'email', header: 'Email' },
    { key: 'telefono_celular', header: 'Teléfono' },
    {
      key: 'es_pep',
      header: 'PEP',
      render: r => r.es_pep
        ? <span className="flex items-center gap-1 text-amber-700"><UserCheck size={14} /> Sí</span>
        : <span className="text-gray-400 flex items-center gap-1"><UserX size={14} /> No</span>,
    },
    { key: 'estatus', header: 'Estatus', render: r => <EstatusBadge estatus={r.estatus} /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión y registro de clientes bancarios
            {total > 0 && <span className="ml-2 text-primary-600 font-medium">({total} registros)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-secondary" title="Recargar" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/clientes/nuevo" className="btn-primary">
            <Plus size={16} />Nuevo Cliente
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Cargando clientes...</span>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Buscar por nombre, CURP, RFC, email..."
            onSearch={handleSearch}
            searchValue={search}
            pageSize={limit}
            actions={row => (
              <>
                <Link
                  to={`/clientes/${row.id}/editar`}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar datos"
                >
                  <Edit2 size={15} />
                </Link>
                <Link
                  to={`/clientes/${row.id}/documentos`}
                  className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  title="Documentos"
                >
                  <FolderOpen size={15} />
                </Link>
                <button
                  onClick={() => setDeleteId(row.id!)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Dar de baja"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          />
        )}
        {!loading && total > limit && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <span className="text-sm text-gray-500">
              Página {page} · {Math.ceil(total / limit)} páginas · {total} registros
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1 px-3 text-sm disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="btn-secondary py-1 px-3 text-sm disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="¿Confirmas la baja de este cliente? Se registrará como inactivo en el sistema."
      />
    </div>
  );
};

export default ClientesList;
