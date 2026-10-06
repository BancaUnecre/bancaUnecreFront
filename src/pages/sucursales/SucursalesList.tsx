import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Building2, Loader2, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { Sucursal, Estado } from '../../types';
import { sucursalesService } from '../../services/sucursalesService';
import { estadosService } from '../../services/estadosService';
import { empresasService } from '../../services/empresasService';
import { X, Save } from 'lucide-react';

const SucursalesList: React.FC = () => {
  const [data, setData] = useState<Sucursal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Sucursal | null>(null);
  const [deleteItem, setDeleteItem] = useState<Sucursal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<Partial<Sucursal>>({ activa: true });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sucursalesService.getAll({ page, limit });
      const raw = res.data as any;
      const items: Sucursal[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setData(items);
      setTotal(raw?.total ?? items.length);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    estadosService.getAll().then(res => {
      const raw = res.data as any;
      setEstados(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }).catch(() => {});
    empresasService.getAll({ page: 1, limit: 1000 } as any).then(res => {
      const raw = res.data as any;
      setEmpresas(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }).catch(() => {});
  }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({ activa: true });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: Sucursal) => {
    setEditItem(item);
    setForm({ ...item });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.empresa_id) errs.empresa_id = 'La empresa es requerida';
    if (!form.numero) errs.numero = 'Número es requerido';
    if (!form.nombre) errs.nombre = 'Nombre es requerido';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        empresa_id: form.empresa_id,
        numero: form.numero!,
        nombre: form.nombre!,
        direccion: form.direccion,
        estado_id: form.estado_id,
        activa: form.activa ?? true,
      };
      if (editItem?.id) {
        await sucursalesService.update(editItem.id, payload);
      } else {
        await sucursalesService.create(payload);
      }
      await loadData();
      setModalOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setDeleting(true);
    try {
      await sucursalesService.delete(deleteItem.id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al eliminar');
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const filtered = data.filter(s =>
    [s.numero, s.nombre, s.direccion].some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Sucursal>[] = [
    { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
    { key: 'numero', header: 'Número', className: 'font-mono font-semibold text-primary-700' },
    { key: 'empresa_nombre', header: 'Empresa', render: r => { const em = empresas.find((e: any) => e.id === (r as any).empresa_id); return em ? <span className="text-sm text-gray-700">{em.razon_social}</span> : <span className="text-gray-400">—</span>; } },
    {
      key: 'nombre',
      header: 'Sucursal',
      render: r => (
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-primary-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{r.nombre}</span>
        </div>
      ),
    },
    { key: 'direccion', header: 'Dirección', render: r => r.direccion ?? <span className="text-gray-400">—</span> },
    {
      key: 'estado_nombre',
      header: 'Estado',
      render: r => {
        const est = estados.find(e => e.id === r.estado_id);
        return est ? <span className="text-sm text-gray-700">{est.nombre}</span> : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'activa',
      header: 'Estatus',
      render: r => r.activa
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle2 size={11} />Activa</span>
        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold"><XCircle size={11} />Inactiva</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión de sucursales bancarias
            {total > 0 && <span className="ml-2 text-primary-600 font-medium">({total} registros)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} />Nueva Sucursal
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Cargando sucursales...</span>
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Buscar por número, nombre o dirección..."
            onSearch={setSearch}
            searchValue={search}
            pageSize={limit}
            actions={row => (
              <>
                <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setDeleteItem(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Sucursal' : 'Nueva Sucursal'} size="lg">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label-field">Empresa <span className="text-red-500">*</span></label>
            <select
              value={form.empresa_id ?? ''}
              onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value ? Number(e.target.value) : undefined }))}
              className={`input-field ${formErrors.empresa_id ? 'border-red-400' : ''}`}
            >
              <option value="">Seleccionar empresa...</option>
              {empresas.map((em: any) => <option key={em.id} value={em.id}>{em.razon_social}</option>)}
            </select>
            {formErrors.empresa_id && <p className="text-red-500 text-xs mt-1">{formErrors.empresa_id}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Número <span className="text-red-500">*</span></label>
              <input
                value={form.numero ?? ''}
                onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                className={`input-field ${formErrors.numero ? 'border-red-400' : ''}`}
                placeholder="SUC-001"
              />
              {formErrors.numero && <p className="text-red-500 text-xs mt-1">{formErrors.numero}</p>}
            </div>
            <div>
              <label className="label-field">Nombre <span className="text-red-500">*</span></label>
              <input
                value={form.nombre ?? ''}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className={`input-field ${formErrors.nombre ? 'border-red-400' : ''}`}
                placeholder="Sucursal Centro"
              />
              {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
            </div>
          </div>
          <div>
            <label className="label-field">Dirección</label>
            <input
              value={form.direccion ?? ''}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
              className="input-field"
              placeholder="Av. Principal 123, Col. Centro"
            />
          </div>
          <div>
            <label className="label-field">Estado</label>
            <select
              value={form.estado_id ?? ''}
              onChange={e => setForm(f => ({ ...f, estado_id: e.target.value ? Number(e.target.value) : undefined }))}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activa"
              checked={form.activa ?? true}
              onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <label htmlFor="activa" className="text-sm font-medium text-gray-700">Sucursal activa</label>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle size={14} />{error}
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">
            <X size={16} />Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`¿Eliminar la sucursal "${deleteItem?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default SucursalesList;
