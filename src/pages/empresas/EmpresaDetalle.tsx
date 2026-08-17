import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Save, Building2, Users, Upload, X, Plus,
  Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle,
} from 'lucide-react';
import type { Empresa, EmpresaCliente, Cliente, Cuenta } from '../../types';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable, { type Column } from '../../components/common/DataTable';
import { empresasService } from '../../services/empresasService';
import { empresaClientesService } from '../../services/empresaClientesService';
import { clientesService } from '../../services/clientesService';
import { cuentasService } from '../../services/cuentasService';

type Tab = 'datos' | 'clientes';

interface VincularForm {
  cliente_id: number;
  cuenta_id: number;
  limite_credito: number;
}

const fmtMoney = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const EmpresaDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'nueva';
  const empresaId = isNew ? null : Number(id);

  const [activeTab, setActiveTab] = useState<Tab>('datos');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoMime, setLogoMime] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [vinculaciones, setVinculaciones] = useState<EmpresaCliente[]>([]);
  const [loadingVinc, setLoadingVinc] = useState(false);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [deleteVinc, setDeleteVinc] = useState<EmpresaCliente | null>(null);
  const [deletingVinc, setDeletingVinc] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [cuentasCliente, setCuentasCliente] = useState<Cuenta[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [vincForm, setVincForm] = useState<VincularForm>({ cliente_id: 0, cuenta_id: 0, limite_credito: 0 });
  const [vincErrors, setVincErrors] = useState<Record<string, string>>({});
  const [savingVinc, setSavingVinc] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Empresa>({
    defaultValues: { activo: true },
  });

  const loadEmpresa = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await empresasService.getById(empresaId);
      const raw = res.data as any;
      const data: Empresa = raw?.data ?? raw;
      setEmpresa(data);
      reset(data);
      if (data.logo) {
        setLogoPreview(data.logo);
        setLogoMime(data.logo_tipo_mime ?? 'image/png');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  }, [empresaId, reset]);

  const loadVinculaciones = useCallback(async () => {
    if (!empresaId) return;
    setLoadingVinc(true);
    try {
      const res = await empresaClientesService.getByEmpresa(empresaId);
      const raw = res.data as any;
      const items: EmpresaCliente[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setVinculaciones(items);
    } catch {
      /* ignore */
    } finally {
      setLoadingVinc(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (!isNew) {
      loadEmpresa();
      loadVinculaciones();
    }
  }, [isNew, loadEmpresa, loadVinculaciones]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mime = result.match(/:(.*?);/)?.[1] ?? 'image/png';
      setLogoPreview(result);
      setLogoMime(mime);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: Empresa) => {
    setSaving(true);
    setError(null);
    try {
      // Strip server-managed fields that cause SQL errors (fechas, id)
      const { id: _id, fecha_alta: _fa, fecha_modificacion: _fm, logo: _l, logo_tipo_mime: _lm, ...rest } = data as any;
      const payload: any = { ...rest };

      // Incluir logo si fue cargado/cambiado
      payload.logo = logoPreview ?? null;
      payload.logo_tipo_mime = logoPreview ? logoMime : null;

      if (isNew) {
        await empresasService.create(payload);
        navigate('/empresas');
      } else {
        await empresasService.update(empresaId!, payload);
        await loadEmpresa();
      }
    } catch (e: any) {
      const serverErr: string = e?.response?.data?.error ?? '';
      const serverMsg: string = e?.response?.data?.message ?? e?.message ?? 'Error al guardar';
      let msg = serverMsg;
      if (serverErr.includes('notNull Violation')) {
        const CAMPO_LABELS: Record<string, string> = {
          razon_social: 'Razón Social', rfc: 'RFC',
        };
        const matches = serverErr.match(/empresas\.(\w+) cannot be null/gi) ?? [];
        const campos = matches.map((m: string) => {
          const field = m.replace(/empresas\./i, '').replace(' cannot be null', '');
          return CAMPO_LABELS[field] ?? field;
        });
        msg = campos.length > 0
          ? `Faltan campos requeridos: ${campos.join(', ')}.`
          : 'Faltan campos requeridos en el formulario.';
      } else if (serverErr.includes('UNIQUE') || serverErr.includes('duplicate') || serverErr === 'Validation error') {
        msg = 'Ya existe una empresa con ese RFC.';
      } else if (serverErr.includes('CHECK constraint')) {
        msg = 'Valor no permitido en algún campo. Revisa los datos ingresados.';
      } else if (serverErr) {
        msg = `${serverMsg}: ${serverErr}`;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

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

  useEffect(() => {
    if (vincularOpen) searchClientes('');
  }, [vincularOpen, searchClientes]);

  const handleClienteSearchChange = (q: string) => {
    setClienteSearch(q);
    searchClientes(q);
  };

  const selectCliente = async (c: Cliente) => {
    setSelectedCliente(c);
    setVincForm(f => ({ ...f, cliente_id: c.id!, cuenta_id: 0 }));
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

  const validateVinc = () => {
    const errs: Record<string, string> = {};
    if (!vincForm.cliente_id) errs.cliente = 'Selecciona un cliente';
    if (!vincForm.cuenta_id) errs.cuenta = 'Selecciona una cuenta';
    if (vincForm.limite_credito < 0) errs.limite = 'El límite no puede ser negativo';
    setVincErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleVincularSave = async () => {
    if (!validateVinc() || !empresaId) return;
    setSavingVinc(true);
    try {
      await empresaClientesService.create({
        empresa_id: empresaId,
        cliente_id: vincForm.cliente_id,
        cuenta_id: vincForm.cuenta_id,
        limite_credito: vincForm.limite_credito,
        total_debito: 0,
        activo: true,
      });
      await loadVinculaciones();
      setVincularOpen(false);
      setSelectedCliente(null);
      setClienteSearch('');
      setVincForm({ cliente_id: 0, cuenta_id: 0, limite_credito: 0 });
    } catch (e: any) {
      const serverMsg: string = e?.response?.data?.message ?? 'Error al vincular';
      const serverErr: string = e?.response?.data?.error ?? '';
      setVincErrors({ general: serverErr ? `${serverMsg}: ${serverErr}` : serverMsg });
    } finally {
      setSavingVinc(false);
    }
  };

  const handleDesvincular = async () => {
    if (!deleteVinc?.id) return;
    setDeletingVinc(true);
    try {
      await empresaClientesService.delete(deleteVinc.id);
      await loadVinculaciones();
    } catch {
      /* ignore */
    } finally {
      setDeletingVinc(false);
      setDeleteVinc(null);
    }
  };

  const openVincular = () => {
    setSelectedCliente(null);
    setClienteSearch('');
    setCuentasCliente([]);
    setVincForm({ cliente_id: 0, cuenta_id: 0, limite_credito: 0 });
    setVincErrors({});
    setVincularOpen(true);
  };

  const vincColumns: Column<EmpresaCliente>[] = [
    {
      key: 'cliente_nombre',
      header: 'Cliente',
      render: r => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{r.cliente_nombre ?? `Cliente #${r.cliente_id}`}</p>
          <p className="text-xs text-gray-500 font-mono">{r.cliente_rfc ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'cuenta_numero',
      header: 'Cuenta',
      render: r => (
        <div>
          <p className="font-mono text-xs font-semibold text-gray-800">{r.cuenta_numero ?? `Cuenta #${r.cuenta_id}`}</p>
          <p className="text-xs text-gray-500">{r.cuenta_tipo ?? ''} · {r.cuenta_moneda ?? 'MXN'}</p>
        </div>
      ),
    },
    {
      key: 'limite_credito',
      header: 'Límite Crédito',
      render: r => <span className="font-semibold text-blue-700">{fmtMoney(r.limite_credito)}</span>,
    },
    {
      key: 'total_debito',
      header: 'Total Débito',
      render: r => <span className={r.total_debito > 0 ? 'font-semibold text-red-600' : 'text-gray-400'}>{fmtMoney(r.total_debito)}</span>,
    },
    {
      key: 'activo',
      header: 'Estatus',
      render: r => r.activo
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle2 size={11} />Activo</span>
        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold"><XCircle size={11} />Inactivo</span>,
    },
  ];

  const tabs = [
    { id: 'datos' as Tab, label: 'Datos de la Empresa', icon: Building2 },
    { id: 'clientes' as Tab, label: `Clientes Vinculados (${vinculaciones.length})`, icon: Users, disabled: isNew },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <span>Cargando empresa...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/empresas')} className="btn-secondary">
          <ArrowLeft size={16} />Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Nueva Empresa' : (empresa?.razon_social ?? 'Empresa')}
          </h1>
          <p className="text-gray-500 text-sm">
            {isNew ? 'Complete los datos de la empresa' : `RFC: ${empresa?.rfc}`}
          </p>
        </div>
        {empresa && (
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${empresa.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {empresa.activo ? 'Activa' : 'Inactiva'}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 bg-primary-50'
                  : tab.disabled
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={15} />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'datos' && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              {/* Logo */}
              <div className="flex items-start gap-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden bg-white flex-shrink-0 group"
                >
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-primary-500">
                      <Upload size={22} /><span className="text-xs">Logo</span>
                    </div>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Logotipo de la empresa</h3>
                  <p className="text-sm text-gray-500 mb-3">PNG, JPG, SVG · 200×200px recomendado</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3">
                      <Upload size={13} />{logoPreview ? 'Cambiar' : 'Subir'} imagen
                    </button>
                    {logoPreview && (
                      <button type="button" onClick={() => { setLogoPreview(null); setLogoMime(''); }} className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1">
                        <X size={13} />Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="label-field">Razón Social <span className="text-red-500">*</span></label>
                  <input {...register('razon_social', { required: 'Campo requerido' })} className={`input-field ${errors.razon_social ? 'border-red-400' : ''}`} placeholder="Empresa SA de CV" />
                  {errors.razon_social && <p className="text-red-500 text-xs mt-1">{errors.razon_social.message}</p>}
                </div>
                <div>
                  <label className="label-field">Nombre Comercial</label>
                  <input {...register('nombre_comercial')} className="input-field" placeholder="Nombre corto" />
                </div>
                <div>
                  <label className="label-field">RFC <span className="text-red-500">*</span></label>
                  <input {...register('rfc', { required: 'Campo requerido' })} className={`input-field ${errors.rfc ? 'border-red-400' : ''}`} placeholder="ABC850101AB1" style={{ textTransform: 'uppercase' }} />
                  {errors.rfc && <p className="text-red-500 text-xs mt-1">{errors.rfc.message}</p>}
                </div>
                <div>
                  <label className="label-field">Sector</label>
                  <input {...register('sector')} className="input-field" placeholder="Comercio, Servicios, etc." />
                </div>
                <div>
                  <label className="label-field">Teléfono</label>
                  <input {...register('telefono')} className="input-field" placeholder="10 dígitos" />
                </div>
                <div>
                  <label className="label-field">Email de Contacto</label>
                  <input type="email" {...register('email_contacto')} className="input-field" placeholder="contacto@empresa.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="label-field">Domicilio Fiscal</label>
                  <textarea {...register('domicilio_fiscal')} className="input-field h-20 resize-none" placeholder="Calle, número, colonia, ciudad, estado, CP" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="activo" {...register('activo')} className="w-4 h-4 rounded accent-primary-700" />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">Empresa activa</label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Guardando...' : isNew ? 'Registrar Empresa' : 'Actualizar Empresa'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'clientes' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Clientes y Cuentas Vinculadas</h3>
              <button onClick={openVincular} className="btn-primary">
                <Plus size={15} />Vincular Cliente
              </button>
            </div>

            {loadingVinc ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Cargando vinculaciones...</span>
              </div>
            ) : (
              <DataTable
                data={vinculaciones}
                columns={vincColumns}
                searchPlaceholder="Buscar cliente o cuenta..."
                pageSize={10}
                actions={row => (
                  <button
                    onClick={() => setDeleteVinc(row)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Desvincular"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal: Vincular cliente */}
      <Modal isOpen={vincularOpen} onClose={() => setVincularOpen(false)} title="Vincular Cliente a la Empresa" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label-field">Buscar Cliente</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={clienteSearch}
                onChange={e => handleClienteSearchChange(e.target.value)}
                className="input-field pl-9"
                placeholder="Nombre, RFC o CURP..."
              />
            </div>
            {vincErrors.cliente && <p className="text-red-500 text-xs mt-1">{vincErrors.cliente}</p>}
            <div className="border border-gray-200 rounded-xl mt-2 max-h-48 overflow-y-auto divide-y divide-gray-50">
              {loadingClientes ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                  <Loader2 size={16} className="animate-spin" />Buscando...
                </div>
              ) : clientes.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin resultados</p>
              ) : clientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCliente(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 transition-colors ${selectedCliente?.id === c.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.nombre[0]}{c.apellido_paterno[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{c.nombre} {c.apellido_paterno} {c.apellido_materno ?? ''}</p>
                    <p className="text-xs text-gray-500 font-mono">{c.rfc}</p>
                  </div>
                  {selectedCliente?.id === c.id && <CheckCircle2 size={16} className="text-primary-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {selectedCliente && (
            <div>
              <label className="label-field">Cuenta Bancaria <span className="text-red-500">*</span></label>
              {loadingCuentas ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <Loader2 size={14} className="animate-spin" />Cargando cuentas...
                </div>
              ) : (
                <select
                  value={vincForm.cuenta_id}
                  onChange={e => setVincForm(f => ({ ...f, cuenta_id: Number(e.target.value) }))}
                  className="input-field"
                >
                  <option value={0}>Seleccionar cuenta...</option>
                  {cuentasCliente.map(cu => (
                    <option key={cu.id} value={cu.id}>
                      {cu.numero_cuenta} · {cu.tipo_cuenta} · {cu.moneda}
                    </option>
                  ))}
                </select>
              )}
              {vincErrors.cuenta && <p className="text-red-500 text-xs mt-1">{vincErrors.cuenta}</p>}
            </div>
          )}

          <div>
            <label className="label-field">Límite de Crédito</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={vincForm.limite_credito}
                onChange={e => setVincForm(f => ({ ...f, limite_credito: Number(e.target.value) }))}
                className="input-field pl-7"
                placeholder="0.00"
              />
            </div>
            {vincErrors.limite && <p className="text-red-500 text-xs mt-1">{vincErrors.limite}</p>}
          </div>

          {vincErrors.general && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={14} />{vincErrors.general}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setVincularOpen(false)} className="btn-secondary flex-1 justify-center">
              <X size={15} />Cancelar
            </button>
            <button onClick={handleVincularSave} disabled={savingVinc || !selectedCliente || !vincForm.cuenta_id} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {savingVinc ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
              {savingVinc ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteVinc}
        onClose={() => setDeleteVinc(null)}
        onConfirm={handleDesvincular}
        loading={deletingVinc}
        message="¿Desvincular este cliente de la empresa? Se registrará como inactivo."
      />
    </div>
  );
};

export default EmpresaDetalle;
