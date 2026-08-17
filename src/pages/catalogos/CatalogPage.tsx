import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  readOnlyOnEdit?: boolean;
  hideOnEdit?: boolean;
  placeholder?: string;
  colSpan?: number;
}

export interface CatalogService<T> {
  getAll: (...args: any[]) => Promise<{ data: T[] | { data: T[]; total: number } }>;
  create: (data: any) => Promise<any>;
  update: (id: number, data: any) => Promise<any>;
  delete: (id: number) => Promise<any>;
}

interface CatalogPageProps<T extends { id?: number }> {
  title: string;
  description?: string;
  columns: Column<T>[];
  fields: FieldDef[];
  initialData?: T[];
  service?: CatalogService<T>;
  formTitle?: (isEdit: boolean) => string;
  extraActions?: (row: T) => React.ReactNode;
}

function CatalogPage<T extends { id?: number }>({
  title, description, columns, fields, initialData = [], service, formTitle, extraActions,
}: CatalogPageProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(!!service);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const res = await service.getAll();
      const raw = res.data as any;
      const items: T[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setData(items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (service) loadData();
  }, [loadData]);

  const openNew = () => {
    setEditItem(null);
    setFormData({});
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: T) => {
    setEditItem(item);
    setFormData({ ...item } as Record<string, unknown>);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      if (f.required && !formData[f.key] && formData[f.key] !== 0) {
        errs[f.key] = `${f.label} es requerido`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseApiError = (e: any, fallback: string): string => {
    const serverErr: string = e?.response?.data?.error ?? '';
    const serverMsg: string = e?.response?.data?.message ?? e?.message ?? fallback;
    if (serverErr === 'Validation error' || serverErr.includes('UNIQUE') || serverErr.includes('duplicate')) {
      return `${serverMsg}: ya existe un registro con esos datos (valor duplicado).`;
    }
    if (serverErr.includes('truncated') || serverErr.includes('Truncated')) {
      return `${serverMsg}: un campo excede la longitud permitida.`;
    }
    if (serverErr.includes('CHECK constraint')) {
      return `${serverMsg}: valor no permitido en ese campo.`;
    }
    if (serverErr.includes('FOREIGN KEY') || serverErr.includes('REFERENCE') || serverErr.includes('conflicted')) {
      return `${serverMsg}: no se puede eliminar porque está siendo utilizado en otros registros.`;
    }
    if (serverErr.includes('notNull Violation')) {
      return `${serverMsg}: faltan campos requeridos.`;
    }
    if (serverErr) return `${serverMsg}: ${serverErr}`;
    return serverMsg;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      if (service) {
        if (editItem) {
          await service.update(editItem.id!, formData);
        } else {
          await service.create(formData);
        }
        await loadData();
      } else {
        if (editItem) {
          setData(d => d.map(item => item.id === editItem.id ? { ...item, ...formData } as T : item));
        } else {
          const newId = Math.max(0, ...data.map(d => d.id ?? 0)) + 1;
          setData(d => [...d, { ...formData, id: newId } as T]);
        }
      }
      setModalOpen(false);
    } catch (e: any) {
      setError(parseApiError(e, 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    setError(null);
    try {
      if (service) {
        await service.delete(deleteItem.id!);
        await loadData();
      } else {
        setData(d => d.filter(item => item.id !== deleteItem.id));
      }
    } catch (e: any) {
      setError(parseApiError(e, 'Error al eliminar'));
    } finally {
      setDeleteItem(null);
      setDeleting(false);
    }
  };

  const filtered = data.filter(row =>
    fields.some(f => {
      const val = (row as Record<string, unknown>)[f.key];
      return val != null && String(val).toLowerCase().includes(search.toLowerCase());
    })
  );

  const isEdit = !!editItem;
  const visibleFields = fields.filter(f => !(isEdit && f.hideOnEdit));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-500 text-sm mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {service && (
            <button onClick={loadData} className="btn-secondary" title="Recargar" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} />Agregar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Cargando datos...</span>
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder={`Buscar en ${title.toLowerCase()}...`}
            onSearch={setSearch}
            searchValue={search}
            pageSize={10}
            actions={row => (
              <>
                {extraActions?.(row)}
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
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={formTitle ? formTitle(isEdit) : isEdit ? `Editar ${title}` : `Nuevo en ${title}`}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4">
          {visibleFields.map(f => (
            <div key={f.key}>
              <label className="label-field">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={String(formData[f.key] ?? '')}
                  onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                  className={`input-field h-20 resize-none ${errors[f.key] ? 'border-red-400' : ''}`}
                  placeholder={f.placeholder}
                  disabled={isEdit && f.readOnlyOnEdit}
                />
              ) : f.type === 'select' ? (
                <select
                  value={String(formData[f.key] ?? '')}
                  onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                  className={`input-field ${errors[f.key] ? 'border-red-400' : ''}`}
                  disabled={isEdit && f.readOnlyOnEdit}
                >
                  <option value="">Seleccionar...</option>
                  {f.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={String(formData[f.key] ?? '')}
                  onChange={e => setFormData(d => ({
                    ...d,
                    [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                  }))}
                  className={`input-field ${errors[f.key] ? 'border-red-400' : ''}`}
                  placeholder={f.placeholder}
                  disabled={isEdit && f.readOnlyOnEdit}
                />
              )}
              {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]}</p>}
            </div>
          ))}
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
        message="¿Eliminar este registro? Esta acción no se puede deshacer."
      />
    </div>
  );
}

export default CatalogPage;
