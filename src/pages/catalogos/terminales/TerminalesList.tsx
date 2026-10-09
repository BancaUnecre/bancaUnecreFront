import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, MonitorSmartphone, Loader2, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import DataTable, { type Column } from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import type { TerminalDispositivo, Sucursal } from '../../../types';
import { terminalDispositivosService } from '../../../services/terminalDispositivosService';
import { sucursalesService } from '../../../services/sucursalesService';
import { cuentasService } from '../../../services/cuentasService';
import { X, Save } from 'lucide-react';

const TerminalesList: React.FC = () => {
  const [data, setData] = useState<TerminalDispositivo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TerminalDispositivo | null>(null);
  const [deleteItem, setDeleteItem] = useState<TerminalDispositivo | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<Partial<TerminalDispositivo>>({ habilitada: true, conexion_activa: false });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await terminalDispositivosService.getAll({ page, limit });
      const raw = res.data as any;
      const items: TerminalDispositivo[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setData(items);
      setTotal(raw?.total ?? items.length);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cargar terminales');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    sucursalesService.getAll({ page: 1, limit: 1000 }).then(res => {
      const raw = res.data as any;
      setSucursales(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }).catch(() => {});
    cuentasService.getAll({ page: 1, limit: 1000 } as any).then(res => {
      const raw = res.data as any;
      setCuentas(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }).catch(() => {});
  }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({ habilitada: true, conexion_activa: false });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: TerminalDispositivo) => {
    setEditItem(item);
    setForm({ ...item, habilitada: Boolean(item.habilitada), conexion_activa: Boolean(item.conexion_activa) });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.sucursal_id) errs.sucursal_id = 'Sucursal es requerida';
    if (!(form as any).cuenta_destino_id) errs.cuenta_destino_id = 'La cuenta destino es requerida';
    if (!form.marca) errs.marca = 'Marca es requerida';
    if (!form.modelo) errs.modelo = 'Modelo es requerido';
    if (!form.direccion_mac) errs.direccion_mac = 'MAC/No. Serie es requerido';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        sucursal_id: form.sucursal_id!,
        cuenta_destino_id: (form as any).cuenta_destino_id ?? null,
        marca: form.marca!,
        modelo: form.modelo!,
        direccion_mac: form.direccion_mac!,
        habilitada: form.habilitada ? 1 : 0,
        conexion_activa: form.conexion_activa ? 1 : 0,
      };
      if (editItem?.id) {
        await terminalDispositivosService.update(editItem.id, payload);
      } else {
        await terminalDispositivosService.create(payload);
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
      await terminalDispositivosService.delete(deleteItem.id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al desactivar');
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const filtered = data.filter(s =>
    [s.marca, s.modelo, s.direccion_mac, s.sucursal?.nombre].some(v => v && String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<TerminalDispositivo>[] = [
    { key: 'id', header: 'ID', className: 'w-16 text-gray-500' },
    {
      key: 'equipo',
      header: 'Terminal',
      render: r => (
        <div className="flex items-center gap-2">
          <MonitorSmartphone size={15} className="text-primary-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{r.marca} {r.modelo}</span>
        </div>
      ),
    },
    { key: 'direccion_mac', header: 'SN / MAC', className: 'font-mono text-sm' },
    {
      key: 'sucursal_nombre',
      header: 'Sucursal Asignada',
      render: r => <span className="text-sm text-gray-700">{r.sucursal?.nombre || '—'}</span>
    },
    {
      key: 'estado_conexion',
      header: 'Conexión / Red',
      render: r => {
        const estado = (r as any).estado_conexion || (r.conexion_activa ? 'conectada' : 'desconectada');
        const motivo = (r as any).motivo_desconexion;

        if (estado === 'conectada') {
          return (
            <div className="flex items-center gap-1.5" title="En línea y transmitiendo">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">En Línea</span>
            </div>
          );
        }

        if (estado === 'mantenimiento') {
          return (
            <div className="flex items-center gap-1.5" title={motivo || 'Sistema en mantenimiento'}>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-700">Mantenimiento</span>
            </div>
          );
        }

        if (estado === 'nunca_conectada') {
          return (
            <div className="flex flex-col" title={motivo}>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> Sin enlace
              </span>
              <span className="text-[10px] text-gray-400">Nunca conectada</span>
            </div>
          );
        }

        if (estado === 'inactiva') {
          return (
            <span className="text-xs text-gray-400 font-medium">Deshabilitada</span>
          );
        }

        // Desconectada
        return (
          <div className="flex flex-col max-w-xs" title={motivo}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-red-600">Desconectada</span>
            </div>
            {motivo && (
              <span className="text-[11px] text-red-500/90 truncate max-w-[220px]" title={motivo}>
                {motivo}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'habilitada',
      header: 'Estatus',
      render: r => r.habilitada
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle2 size={11} />Activa</span>
        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold"><XCircle size={11} />Inactiva</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terminales</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gestión de terminales físicas (POS / Sunmi)
            {total > 0 && <span className="ml-2 text-primary-600 font-medium">({total} registros)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} />Nueva Terminal
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
            <span className="text-sm">Cargando terminales...</span>
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Buscar por marca, modelo, serie o sucursal..."
            onSearch={setSearch}
            searchValue={search}
            pageSize={limit}
            actions={row => (
              <>
                <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setDeleteItem(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Desactivar">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          />
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Terminal' : 'Nueva Terminal'} size="lg">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label-field">Sucursal <span className="text-red-500">*</span></label>
            <select
              value={form.sucursal_id ?? ''}
              onChange={e => setForm(f => ({ ...f, sucursal_id: e.target.value ? Number(e.target.value) : undefined }))}
              className={`input-field ${formErrors.sucursal_id ? 'border-red-400' : ''}`}
            >
              <option value="">Seleccionar...</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {formErrors.sucursal_id && <p className="text-red-500 text-xs mt-1">{formErrors.sucursal_id}</p>}
          </div>
          <div>
            <label className="label-field">Cuenta destino (empresa) <span className="text-red-500">*</span></label>
            <select
              value={(form as any).cuenta_destino_id ?? ''}
              onChange={e => setForm(f => ({ ...f, cuenta_destino_id: e.target.value ? Number(e.target.value) : undefined } as any))}
              className="input-field"
            >
              <option value="">Seleccionar cuenta de la empresa...</option>
              {(() => {
                const emp = sucursales.find(su => su.id === form.sucursal_id)?.empresa_id;
                return cuentas.filter((c: any) => c.empresa_id && c.empresa_id === emp)
                  .map((c: any) => <option key={c.id} value={c.id}>{c.numero_cuenta} — {c.tipo_cuenta}</option>);
              })()}
            </select>
            <p className="text-xs text-gray-400 mt-1">Cada venta en esta terminal abonará (adeudo de Unecre) a esta cuenta.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Marca <span className="text-red-500">*</span></label>
              <input
                value={form.marca ?? ''}
                onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                className={`input-field ${formErrors.marca ? 'border-red-400' : ''}`}
                placeholder="Sunmi, Ingenico..."
              />
              {formErrors.marca && <p className="text-red-500 text-xs mt-1">{formErrors.marca}</p>}
            </div>
            <div>
              <label className="label-field">Modelo <span className="text-red-500">*</span></label>
              <input
                value={form.modelo ?? ''}
                onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                className={`input-field ${formErrors.modelo ? 'border-red-400' : ''}`}
                placeholder="V3, Move5000..."
              />
              {formErrors.modelo && <p className="text-red-500 text-xs mt-1">{formErrors.modelo}</p>}
            </div>
          </div>
          <div>
            <label className="label-field">Dirección MAC o Número de Serie <span className="text-red-500">*</span></label>
            <input
              value={form.direccion_mac ?? ''}
              onChange={e => setForm(f => ({ ...f, direccion_mac: e.target.value }))}
              className={`input-field font-mono text-sm ${formErrors.direccion_mac ? 'border-red-400' : ''}`}
              placeholder="00:1A:2B:3C:4D:5E o UUID"
            />
            {formErrors.direccion_mac && <p className="text-red-500 text-xs mt-1">{formErrors.direccion_mac}</p>}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="habilitada"
              checked={form.habilitada ?? true}
              onChange={e => setForm(f => ({ ...f, habilitada: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <label htmlFor="habilitada" className="text-sm font-medium text-gray-700">Terminal habilitada</label>
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
        message={`¿Desactivar la terminal "${deleteItem?.marca} ${deleteItem?.modelo}"?`}
      />
    </div>
  );
};

export default TerminalesList;
