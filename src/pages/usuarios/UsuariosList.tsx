import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, AlertCircle, RefreshCw,
  CheckCircle2, XCircle, X, Save, ShieldCheck, User2,
} from 'lucide-react';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { UsuarioSistema, Sucursal } from '../../types';
import { usuariosSistemaService } from '../../services/usuariosSistemaService';
import { sucursalesService } from '../../services/sucursalesService';
import { clientesService } from '../../services/clientesService';
import { empresasService } from '../../services/empresasService';

const ROL_STYLES: Record<string, string> = {
  ADMINISTRADOR: 'bg-red-100 text-red-700',
  ADMIN: 'bg-red-100 text-red-700',
  SUPERVISOR: 'bg-amber-100 text-amber-700',
  OPERADOR: 'bg-blue-100 text-blue-700',
  CUMPLIMIENTO: 'bg-purple-100 text-purple-700',
};

const UsuariosList: React.FC = () => {
  const [data, setData] = useState<UsuarioSistema[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<UsuarioSistema | null>(null);
  const [deleteItem, setDeleteItem] = useState<UsuarioSistema | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Partial<UsuarioSistema & { contrasena: string }>>({ activo: true, rol: 'ADMINISTRADOR' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tipo, setTipo] = useState<'admin' | 'cliente' | 'empresa'>('admin');
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selLabel, setSelLabel] = useState('');

  useEffect(() => {
    if (tipo === 'admin' || busca.trim() === '') { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = tipo === 'cliente'
          ? await clientesService.getAll({ buscar: busca, limit: 10 } as any)
          : await empresasService.getAll({ buscar: busca, limit: 10 } as any);
        const raw: any = res.data;
        setResultados(Array.isArray(raw) ? raw : (raw?.data ?? []));
      } catch { setResultados([]); } finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [busca, tipo]);

  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usuariosSistemaService.getAll({ page, limit });
      const raw = res.data as any;
      const items: UsuarioSistema[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setData(items);
      setTotal(raw?.total ?? items.length);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    sucursalesService.getAll({ limit: 200 }).then(res => {
      const raw = res.data as any;
      setSucursales(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }).catch(() => {});
  }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({ activo: true, rol: 'ADMINISTRADOR' });
    setFormErrors({});
    setTipo('admin'); setBusca(''); setResultados([]); setSelLabel('');
    setModalOpen(true);
  };

  const openEdit = (item: UsuarioSistema) => {
    setEditItem(item);
    setForm({ ...item, contrasena: '' });
    setFormErrors({});
    const r = String(item.rol || '').toUpperCase();
    const tp = r === 'CLIENTE' ? 'cliente' : r === 'EMPRESA' ? 'empresa' : 'admin';
    setTipo(tp as any); setBusca(''); setResultados([]);
    setSelLabel(tp === 'cliente' && item.cliente_id ? `Cliente #${item.cliente_id}` : tp === 'empresa' && item.empresa_id ? `Empresa #${item.empresa_id}` : '');
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre_usuario) errs.nombre_usuario = 'Usuario es requerido';
    if (!form.nombre_completo) errs.nombre_completo = 'Nombre completo es requerido';
    if (!editItem && !form.contrasena) errs.contrasena = 'Contraseña es requerida para nuevo usuario';
    if (!form.rol) errs.rol = 'Rol es requerido';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        nombre_usuario: form.nombre_usuario!,
        nombre_completo: form.nombre_completo!,
        activo: form.activo ?? true,
      };
      if (tipo === 'cliente') {
        if (!form.cliente_id) { setFormErrors({ sel: 'Selecciona el cliente' }); setSaving(false); return; }
        payload.rol = 'CLIENTE'; payload.cliente_id = form.cliente_id; payload.empresa_id = null; payload.sucursal_id = null;
      } else if (tipo === 'empresa') {
        if (!form.empresa_id) { setFormErrors({ sel: 'Selecciona la empresa' }); setSaving(false); return; }
        payload.rol = 'EMPRESA'; payload.empresa_id = form.empresa_id; payload.cliente_id = null; payload.sucursal_id = null;
      } else {
        payload.rol = form.rol as UsuarioSistema['rol']; payload.sucursal_id = form.sucursal_id; payload.cliente_id = null; payload.empresa_id = null;
      }
      if (form.contrasena) payload.contrasena = form.contrasena;

      if (editItem?.id) {
        await usuariosSistemaService.update(editItem.id, payload);
      } else {
        await usuariosSistemaService.create(payload);
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
      await usuariosSistemaService.delete(deleteItem.id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al eliminar');
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const filtered = data.filter(u =>
    [u.nombre_usuario, u.nombre_completo, u.rol].some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<UsuarioSistema>[] = [
    { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
    {
      key: 'nombre_completo',
      header: 'Usuario',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <User2 size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{r.nombre_completo}</p>
            <p className="text-xs text-gray-500 font-mono">@{r.nombre_usuario}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: r => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${ROL_STYLES[r.rol] ?? 'bg-gray-100 text-gray-700'}`}>
          <ShieldCheck size={10} />{r.rol}
        </span>
      ),
    },
    {
      key: 'sucursal_nombre',
      header: 'Sucursal',
      render: r => {
        const suc = sucursales.find(s => s.id === r.sucursal_id);
        return suc ? <span className="text-sm text-gray-700">{suc.nombre}</span> : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'activo',
      header: 'Estatus',
      render: r => r.activo
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle2 size={11} />Activo</span>
        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold"><XCircle size={11} />Inactivo</span>,
    },
    { key: 'fecha_alta', header: 'Alta', render: r => r.fecha_alta ? new Date(r.fecha_alta).toLocaleDateString('es-MX') : <span className="text-gray-400">—</span> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión de operadores, supervisores y administradores
            {total > 0 && <span className="ml-2 text-primary-600 font-medium">({total} registros)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} />Nuevo Usuario
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
            <span className="text-sm">Cargando usuarios...</span>
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Buscar por nombre, usuario o rol..."
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Nombre de Usuario <span className="text-red-500">*</span></label>
              <input
                value={form.nombre_usuario ?? ''}
                onChange={e => setForm(f => ({ ...f, nombre_usuario: e.target.value }))}
                className={`input-field ${formErrors.nombre_usuario ? 'border-red-400' : ''}`}
                placeholder="jperez"
                disabled={!!editItem}
              />
              {formErrors.nombre_usuario && <p className="text-red-500 text-xs mt-1">{formErrors.nombre_usuario}</p>}
            </div>
            <div>
              <label className="label-field">Nombre Completo <span className="text-red-500">*</span></label>
              <input
                value={form.nombre_completo ?? ''}
                onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))}
                className={`input-field ${formErrors.nombre_completo ? 'border-red-400' : ''}`}
                placeholder="Juan Pérez López"
              />
              {formErrors.nombre_completo && <p className="text-red-500 text-xs mt-1">{formErrors.nombre_completo}</p>}
            </div>
          </div>
          <div>
            <label className="label-field">Contraseña {!editItem && <span className="text-red-500">*</span>}{editItem && <span className="text-gray-400 text-xs ml-1">(dejar vacío para no cambiar)</span>}</label>
            <input
              type="password"
              value={form.contrasena ?? ''}
              onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
              className={`input-field ${formErrors.contrasena ? 'border-red-400' : ''}`}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {formErrors.contrasena && <p className="text-red-500 text-xs mt-1">{formErrors.contrasena}</p>}
          </div>
          {/* Tipo de usuario */}
          <div>
            <label className="label-field">Tipo de usuario <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {([['admin', 'Administración'], ['cliente', 'Cliente'], ['empresa', 'Empresa']] as const).map(([t, l]) => (
                <button key={t} type="button"
                  onClick={() => { setTipo(t); setBusca(''); setResultados([]); setSelLabel(''); setForm(f => ({ ...f, cliente_id: undefined, empresa_id: undefined })); }}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${tipo === t ? 'bg-primary-50 border-primary-500 text-primary-800 font-medium' : 'border-gray-300 text-gray-600'}`}>{l}</button>
              ))}
            </div>
          </div>

          {tipo === 'admin' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Rol <span className="text-red-500">*</span></label>
                <select value={form.rol ?? 'ADMINISTRADOR'} onChange={e => setForm(f => ({ ...f, rol: e.target.value as UsuarioSistema['rol'] }))} className="input-field">
                  <option value="OPERADOR">Operador</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="CUMPLIMIENTO">Cumplimiento</option>
                </select>
              </div>
              <div>
                <label className="label-field">Sucursal</label>
                <select value={form.sucursal_id ?? ''} onChange={e => setForm(f => ({ ...f, sucursal_id: e.target.value ? Number(e.target.value) : undefined }))} className="input-field">
                  <option value="">Sin sucursal</option>
                  {sucursales.filter(s => s.activa).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {(tipo === 'cliente' || tipo === 'empresa') && (
            <div className="relative">
              <label className="label-field">{tipo === 'cliente' ? 'Cliente' : 'Empresa'} asociado <span className="text-red-500">*</span></label>
              {selLabel ? (
                <div className="flex items-center justify-between input-field bg-primary-50 border-primary-300">
                  <span className="text-sm font-medium text-primary-800">{selLabel}</span>
                  <button type="button" onClick={() => { setSelLabel(''); setForm(f => ({ ...f, cliente_id: undefined, empresa_id: undefined })); }} className="text-xs text-red-600 font-medium">Cambiar</button>
                </div>
              ) : (
                <>
                  <input className="input-field" value={busca} onChange={e => setBusca(e.target.value)} placeholder={tipo === 'cliente' ? 'Buscar por nombre, CURP o RFC…' : 'Buscar por nombre o RFC…'} />
                  {busca.trim() !== '' && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-auto">
                      {buscando ? <div className="p-3 text-center text-gray-400 text-sm">Buscando…</div>
                        : resultados.length === 0 ? <div className="p-3 text-center text-gray-400 text-sm">Sin coincidencias</div>
                        : resultados.map((r: any) => (
                          <button key={r.id} type="button"
                            onClick={() => {
                              const label = tipo === 'cliente' ? `${r.nombre} ${r.apellido_paterno ?? ''}`.trim() : r.razon_social;
                              setSelLabel(label); setResultados([]); setBusca('');
                              setForm(f => ({ ...f, cliente_id: tipo === 'cliente' ? r.id : undefined, empresa_id: tipo === 'empresa' ? r.id : undefined, rol: (tipo === 'cliente' ? 'CLIENTE' : 'EMPRESA') as any }));
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0">
                            <span className="font-medium text-gray-800">{tipo === 'cliente' ? `${r.nombre} ${r.apellido_paterno ?? ''} ${r.apellido_materno ?? ''}` : r.razon_social}</span>
                            <span className="text-xs text-gray-400 block">{tipo === 'cliente' ? r.curp : r.rfc}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
              {formErrors.sel && <p className="text-red-500 text-xs mt-1">{formErrors.sel}</p>}
              {tipo === 'cliente' && <p className="text-xs text-gray-400 mt-1">Un cliente solo puede tener un usuario.</p>}
              {tipo === 'empresa' && <p className="text-xs text-gray-400 mt-1">Una empresa puede tener varios usuarios.</p>}
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo_usr"
              checked={form.activo ?? true}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <label htmlFor="activo_usr" className="text-sm font-medium text-gray-700">Usuario activo</label>
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
        message={`¿Eliminar al usuario "${deleteItem?.nombre_completo}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default UsuariosList;
