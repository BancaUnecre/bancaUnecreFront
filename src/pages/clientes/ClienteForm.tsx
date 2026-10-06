import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type FieldErrors } from 'react-hook-form';
import { ArrowLeft, Save, User, MapPin, Phone, Briefcase, Shield, FileText, Loader2, AlertCircle, CreditCard, Upload } from 'lucide-react';
import type { Cliente, Estado, TipoIdentificacion, Ocupacion, NivelCuenta, NivelRiesgo } from '../../types';
import { clientesService } from '../../services/clientesService';
import { estadosService } from '../../services/estadosService';
import { tipoIdentificacionService } from '../../services/tipoIdentificacionService';
import { ocupacionesService } from '../../services/ocupacionesService';
import { nivelCuentaService } from '../../services/nivelCuentaService';
import { nivelRiesgoService } from '../../services/nivelRiesgoService';
import AvisoGuardarDialog, { type ProblemaGuardado } from '../../components/common/AvisoGuardarDialog';
import LogoCropper from '../../components/LogoCropper';

type Tab = 'personal' | 'domicilio' | 'contacto' | 'laboral' | 'kyc' | 'terminos';

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'personal', label: 'Datos Personales', icon: User },
  { id: 'domicilio', label: 'Domicilio', icon: MapPin },
  { id: 'contacto', label: 'Contacto', icon: Phone },
  { id: 'laboral', label: 'Info. Laboral', icon: Briefcase },
  { id: 'kyc', label: 'KYC / PEP', icon: Shield },
  { id: 'terminos', label: 'Términos', icon: FileText },
];

/** Etiqueta de campo requerido: el * se pone en rojo cuando el campo tiene un problema. */
const Etq: React.FC<{ err?: unknown; children: React.ReactNode }> = ({ err, children }) => (
  <label className="label-field">
    {children}{' '}
    <span className={err ? 'text-red-600 font-extrabold text-base leading-none' : ''}>*</span>
  </label>
);

const CAMPO_LABELS: Record<string, string> = {
  nombre: 'Nombre', apellido_paterno: 'Apellido Paterno', fecha_nacimiento: 'Fecha de Nacimiento',
  genero: 'Género', curp: 'CURP', rfc: 'RFC', tipo_identificacion_id: 'Tipo de Identificación',
  num_identificacion: 'Número de Identificación', vigencia_identificacion: 'Vigencia Identificación',
  calle: 'Calle', num_exterior: 'Núm. Exterior', colonia: 'Colonia', municipio: 'Municipio/Alcaldía',
  estado_id: 'Estado', cp: 'Código Postal', telefono_celular: 'Teléfono Celular', email: 'Correo Electrónico',
  ocupacion_id: 'Ocupación', ingreso_mensual: 'Ingreso Mensual', origen_recursos: 'Origen de Recursos',
  nivel_cuenta_id: 'Nivel de Cuenta', nivel_riesgo_id: 'Nivel de Riesgo', descripcion_pep: 'Descripción PEP',
  acepta_terminos: 'Términos y Condiciones', acepta_uso_datos: 'Uso de datos personales', tipo_domicilio: 'Tipo de Domicilio',
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
/** Valida una fecha yyyy-mm-dd de input date (el navegador deja capturar años de 5 dígitos). */
const fechaValida = (v: unknown) => {
  const t = String(v ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  const d = new Date(t + 'T00:00:00');
  return !isNaN(d.getTime()) && d.getFullYear() >= 1900;
};
const RX_CURP = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{5}[0-9A-Z]\d$/i;
const RX_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

const ClienteForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingCliente, setLoadingCliente] = useState(isEdit);
  const [apiError, setApiError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ titulo?: string; descripcion?: string; problemas: ProblemaGuardado[] } | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [rawFoto, setRawFoto] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [estados, setEstados] = useState<Estado[]>([]);
  const [tiposId, setTiposId] = useState<TipoIdentificacion[]>([]);
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [nivelesCuenta, setNivelesCuenta] = useState<NivelCuenta[]>([]);
  const [nivelesRiesgo, setNivelesRiesgo] = useState<NivelRiesgo[]>([]);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Cliente>({
    defaultValues: {
      nacionalidad: 'MEXICANA',
      pais_nacimiento: 'MÉXICO',
      pais_residencia: 'MÉXICO',
      nivel_cuenta_id: 1,
      nivel_riesgo_id: 1,
      estatus: 1,
      es_pep: false,
      tiene_familiar_pep: false,
      curp_validado_renapo: false,
      rfc_validado_sat: false,
      ine_validado_ine: false,
      acepta_terminos: false,
      acepta_uso_datos: false,
      acepta_grabacion: false,
      metodo_contratacion: 'PRESENCIAL',
      otros_ingresos: 0,
    },
  });

  const esPep = watch('es_pep');
  const tieneFamiliarPep = watch('tiene_familiar_pep');

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCats(true);
      try {
        const [resEstados, resTipos, resOcup, resNivCuenta, resNivRiesgo] = await Promise.all([
          estadosService.getAll(),
          tipoIdentificacionService.getAll(),
          ocupacionesService.getAll(),
          nivelCuentaService.getAll(),
          nivelRiesgoService.getAll(),
        ]);
        const unwrap = (r: any) => Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setEstados(unwrap(resEstados));
        setTiposId(unwrap(resTipos));
        setOcupaciones(unwrap(resOcup));
        setNivelesCuenta(unwrap(resNivCuenta));
        setNivelesRiesgo(unwrap(resNivRiesgo));
      } catch {
        setApiError('Error al cargar catálogos. Verifica la conexión con el servidor.');
      } finally {
        setLoadingCats(false);
      }
    };
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const loadCliente = async () => {
      setLoadingCliente(true);
      try {
        const res = await clientesService.getById(Number(id));
        const raw = res.data as any;
        const cliente = raw?.data ?? raw;
        reset(cliente);
        setFotoPreview(cliente?.foto ?? null);
      } catch (e: any) {
        setApiError(e?.response?.data?.message ?? 'Error al cargar datos del cliente');
      } finally {
        setLoadingCliente(false);
      }
    };
    loadCliente();
  }, [id, isEdit, reset]);

  const FIELD_TABS: Partial<Record<keyof Cliente, Tab>> = {
    nombre: 'personal', apellido_paterno: 'personal', fecha_nacimiento: 'personal',
    genero: 'personal', curp: 'personal', rfc: 'personal',
    tipo_identificacion_id: 'personal', num_identificacion: 'personal', vigencia_identificacion: 'personal',
    calle: 'domicilio', num_exterior: 'domicilio', colonia: 'domicilio',
    municipio: 'domicilio', estado_id: 'domicilio', cp: 'domicilio',
    telefono_celular: 'contacto', email: 'contacto',
    ocupacion_id: 'laboral', ingreso_mensual: 'laboral', origen_recursos: 'laboral',
    nivel_cuenta_id: 'laboral', nivel_riesgo_id: 'laboral', descripcion_pep: 'kyc',
    acepta_terminos: 'terminos', acepta_uso_datos: 'terminos', tipo_domicilio: 'domicilio',
  };

  const TAB_LABELS: Record<Tab, string> = {
    personal: 'Datos Personales', domicilio: 'Domicilio',
    contacto: 'Contacto', laboral: 'Info. Laboral', kyc: 'KYC / PEP', terminos: 'Términos',
  };

  const tabOrder: Tab[] = ['personal', 'domicilio', 'contacto', 'laboral', 'kyc', 'terminos'];
  const tabDeLabel = (label: string) => tabOrder.find(t => TAB_LABELS[t] === label);

  const onError = (errs: FieldErrors<Cliente>) => {
    const campos = (Object.keys(errs) as (keyof Cliente)[])
      .sort((x, y) => tabOrder.indexOf(FIELD_TABS[x] ?? 'personal') - tabOrder.indexOf(FIELD_TABS[y] ?? 'personal'));
    if (!campos.length) return;
    setActiveTab(FIELD_TABS[campos[0]] ?? 'personal');
    setApiError(null);
    setAviso({
      descripcion: `Hay ${campos.length} campo(s) con problema. Los campos marcados tienen el * en rojo.`,
      problemas: campos.map(f => {
        const m = (errs[f] as { message?: string } | undefined)?.message;
        return {
          seccion: TAB_LABELS[FIELD_TABS[f] ?? 'personal'],
          campo: CAMPO_LABELS[f as string] ?? String(f),
          motivo: m && m !== 'Campo requerido' ? m : 'Falta capturarlo (es obligatorio).',
        };
      }),
    });
  };

  /** Si el API rechazó por duplicado, averigua qué dato (CURP / RFC) ya pertenece a otro cliente. */
  const buscarDuplicados = async (data: Cliente): Promise<ProblemaGuardado[]> => {
    const out: ProblemaGuardado[] = [];
    for (const [campo, valor] of [['curp', data.curp], ['rfc', data.rfc]] as const) {
      const v = String(valor ?? '').trim().toUpperCase();
      if (!v) continue;
      try {
        const r = await clientesService.getAll({ buscar: v, limit: 20 });
        const raw = r.data as any;
        const lista: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const otro = lista.find(c => String(c[campo] ?? '').trim().toUpperCase() === v && String(c.id) !== String(id ?? ''));
        if (otro) {
          const nombre = [otro.nombre, otro.apellido_paterno, otro.apellido_materno].filter(Boolean).join(' ');
          out.push({
            seccion: TAB_LABELS.personal, campo: CAMPO_LABELS[campo],
            motivo: `${v} ya está registrado al cliente #${otro.id} ${nombre}. No puede repetirse.`,
          });
        }
      } catch { /* sin detalle: se cae al mensaje genérico */ }
    }
    return out;
  };

  const sanitize = (data: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        v === '' ? null : (typeof v === 'number' && isNaN(v) ? null : v),
      ])
    );

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawFoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const applyFoto = (dataUrl: string) => { setFotoPreview(dataUrl); setRawFoto(null); };

  const onSubmit = async (data: Cliente) => {
    setSaving(true);
    setApiError(null);
    const payload = sanitize(data as unknown as Record<string, unknown>) as unknown as Cliente;
    (payload as any).foto = fotoPreview ?? null;
    try {
      if (isEdit) {
        await clientesService.update(Number(id), payload);
      } else {
        await clientesService.create(payload);
      }
      navigate('/clientes');
    } catch (e: any) {
      const serverErr: string = e?.response?.data?.error ?? '';
      let problemas: ProblemaGuardado[] = [];
      if (serverErr.includes('notNull Violation')) {
        const matches = serverErr.match(/Clientes\.(\w+) cannot be null/g) ?? [];
        problemas = matches.map(m => {
          const f = m.replace('Clientes.', '').replace(' cannot be null', '');
          return { seccion: TAB_LABELS[FIELD_TABS[f as keyof Cliente] ?? 'personal'], campo: CAMPO_LABELS[f] ?? f, motivo: 'Falta capturarlo (es obligatorio).' };
        });
      } else if (serverErr.includes('CHECK constraint')) {
        const CHECKS: [RegExp, string, string][] = [
          [/chk_curp_formato/, 'curp', 'Debe tener exactamente 18 caracteres.'],
          [/chk_cp_formato/, 'cp', 'Debe tener exactamente 5 dígitos.'],
          [/chk_ingresos/, 'ingreso_mensual', 'No puede ser negativo.'],
          [/chk_pep_desc/, 'descripcion_pep', 'Si el cliente es PEP hay que describir el cargo.'],
          [/genero/, 'genero', 'Selecciona Masculino o Femenino.'],
          [/tipo_d/, 'tipo_domicilio', 'Valor no permitido.'],
        ];
        problemas = CHECKS.filter(([rx]) => rx.test(serverErr))
          .map(([, f, motivo]) => ({ seccion: TAB_LABELS[FIELD_TABS[f as keyof Cliente] ?? 'personal'], campo: CAMPO_LABELS[f] ?? f, motivo }));
        if (!problemas.length) problemas = [{ campo: 'Datos', motivo: 'Algún campo tiene un valor no permitido. Detalle del servidor: ' + serverErr }];
      } else if (serverErr.includes('UNIQUE') || serverErr.includes('duplicate') || serverErr === 'Validation error') {
        problemas = await buscarDuplicados(data);
        if (!problemas.length) problemas = [{ seccion: TAB_LABELS.personal, campo: 'CURP / RFC / correo', motivo: 'Ya existe otro cliente con alguno de estos datos; no pueden repetirse.' }];
      } else if (/invalid date/i.test(serverErr)) {
        problemas = [{ seccion: TAB_LABELS.personal, campo: 'Fechas', motivo: 'Alguna fecha no es válida (revisa Fecha de Nacimiento y Vigencia).' }];
      } else {
        problemas = [{ campo: e?.response?.data?.message ?? 'Error', motivo: serverErr || e?.message || 'El servidor no pudo guardar el cliente.' }];
      }
      const primera = problemas.find(p => p.seccion)?.seccion;
      if (primera) setActiveTab(tabDeLabel(primera) ?? activeTab);
      setApiError(null);
      setAviso({ titulo: 'El servidor rechazó el registro', descripcion: 'No se guardó el cliente por lo siguiente:', problemas });
      setSaving(false);
    }
  };

  const inputClass = (err?: unknown) => `input-field ${err ? 'border-red-400 focus:ring-red-400' : ''}`;
  const activeTabIndex = TABS.findIndex(t => t.id === activeTab);
  const isLoading = loadingCats || loadingCliente;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <span>Cargando {loadingCliente ? 'datos del cliente' : 'catálogos'}...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/clientes')} className="btn-secondary">
          <ArrowLeft size={16} />Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
          <p className="text-gray-500 text-sm">Complete todos los campos requeridos</p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {apiError}
        </div>
      )}

      <AvisoGuardarDialog
        isOpen={!!aviso}
        onClose={() => setAviso(null)}
        titulo={aviso?.titulo}
        descripcion={aviso?.descripcion}
        problemas={aviso?.problemas ?? []}
        onIrASeccion={(sec) => { const t = tabDeLabel(sec); if (t) setActiveTab(t); }}
      />

      <div className="card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={15} />{tab.label}
              {(Object.keys(errors) as (keyof Cliente)[]).some(f => FIELD_TABS[f] === tab.id) && (
                <span className="ml-1 h-2 w-2 rounded-full bg-red-500" title="Hay campos con problema" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="p-6">

            {/* TAB: Personal */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2 lg:col-span-3 flex items-center gap-5 pb-5 mb-1 border-b border-gray-100">
                  <div onClick={() => fotoInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-primary-400 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white flex-shrink-0 group">
                    {fotoPreview
                      ? <img src={fotoPreview} className="w-full h-full object-cover" alt="Foto" />
                      : <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-primary-500"><User size={22} /><span className="text-xs">Foto</span></div>}
                  </div>
                  <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                  {rawFoto && <LogoCropper src={rawFoto} round title="Ajustar fotografía" onApply={applyFoto} onCancel={() => setRawFoto(null)} />}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Fotografía del cliente</h3>
                    <p className="text-sm text-gray-500 mb-2">PNG, JPG · se muestra en círculo</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fotoInputRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3"><Upload size={13} />{fotoPreview ? 'Cambiar' : 'Subir'} foto</button>
                      {fotoPreview && <button type="button" onClick={() => setRawFoto(fotoPreview)} className="btn-secondary text-xs py-1.5 px-3">Ajustar</button>}
                      {fotoPreview && <button type="button" onClick={() => setFotoPreview(null)} className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Quitar</button>}
                    </div>
                  </div>
                </div>
                <div>
                  <Etq err={errors.nombre}>Nombre</Etq>
                  <input {...register('nombre', { required: 'Campo requerido' })} className={inputClass(errors.nombre)} placeholder="Nombre(s)" />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <Etq err={errors.apellido_paterno}>Apellido Paterno</Etq>
                  <input {...register('apellido_paterno', { required: 'Campo requerido' })} className={inputClass(errors.apellido_paterno)} placeholder="Apellido paterno" />
                  {errors.apellido_paterno && <p className="text-red-500 text-xs mt-1">{errors.apellido_paterno.message}</p>}
                </div>
                <div>
                  <label className="label-field">Apellido Materno</label>
                  <input {...register('apellido_materno')} className="input-field" placeholder="Apellido materno" />
                </div>
                <div>
                  <Etq err={errors.fecha_nacimiento}>Fecha de Nacimiento</Etq>
                  <input type="date" {...register('fecha_nacimiento', { required: 'Campo requerido', validate: v => (fechaValida(v) ? (String(v) <= hoyISO() || 'No puede ser una fecha futura.') : 'Fecha inválida: revisa el año (debe tener 4 dígitos).') })} className={inputClass(errors.fecha_nacimiento)} />
                  {errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento.message}</p>}
                </div>
                <div>
                  <Etq err={errors.genero}>Género</Etq>
                  <select {...register('genero', { required: 'Campo requerido' })} className={inputClass(errors.genero)}>
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                  {errors.genero && <p className="text-red-500 text-xs mt-1">{errors.genero.message}</p>}
                </div>
                <div>
                  <label className="label-field">Nacionalidad</label>
                  <input {...register('nacionalidad')} className="input-field" />
                </div>
                <div>
                  <label className="label-field">País de Nacimiento</label>
                  <input {...register('pais_nacimiento')} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Entidad de Nacimiento</label>
                  <select {...register('entidad_nacimiento_id', { valueAsNumber: true })} className="input-field">
                    <option value="">Seleccionar</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-3 border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Identificación</h3>
                </div>
                <div>
                  <Etq err={errors.curp}>CURP</Etq>
                  <input
                    {...register('curp', { required: 'Campo requerido', minLength: { value: 18, message: 'CURP debe tener 18 caracteres' }, maxLength: { value: 18, message: 'CURP debe tener 18 caracteres' }, pattern: { value: RX_CURP, message: 'Formato de CURP inválido.' } })}
                    className={inputClass(errors.curp)}
                    placeholder="18 caracteres"
                    maxLength={18}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.curp && <p className="text-red-500 text-xs mt-1">{errors.curp.message}</p>}
                </div>
                <div>
                  <Etq err={errors.rfc}>RFC</Etq>
                  <input {...register('rfc', { required: 'Campo requerido', pattern: { value: RX_RFC, message: 'Formato de RFC inválido (12 o 13 caracteres).' } })} className={inputClass(errors.rfc)} placeholder="12 o 13 caracteres" maxLength={13} style={{ textTransform: 'uppercase' }} />
                  {errors.rfc && <p className="text-red-500 text-xs mt-1">{errors.rfc.message}</p>}
                </div>
                <div>
                  <Etq err={errors.tipo_identificacion_id}>Tipo de Identificación</Etq>
                  <select {...register('tipo_identificacion_id', { required: 'Campo requerido', valueAsNumber: true, validate: v => !isNaN(v) || 'Campo requerido' })} className={inputClass(errors.tipo_identificacion_id)}>
                    <option value="">Seleccionar</option>
                    {tiposId.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <Etq err={errors.num_identificacion}>Número de Identificación</Etq>
                  <input {...register('num_identificacion', { required: 'Campo requerido' })} className={inputClass(errors.num_identificacion)} placeholder="Número de doc." />
                  {errors.num_identificacion && <p className="text-red-500 text-xs mt-1">{errors.num_identificacion.message}</p>}
                </div>
                <div>
                  <Etq err={errors.vigencia_identificacion}>Vigencia Identificación</Etq>
                  <input type="date" {...register('vigencia_identificacion', { required: 'Campo requerido', validate: v => (fechaValida(v) ? (String(v) >= hoyISO() || 'La identificación está vencida.') : 'Fecha inválida: revisa el año (debe tener 4 dígitos).') })} className={inputClass(errors.vigencia_identificacion)} />
                  {errors.vigencia_identificacion && <p className="text-red-500 text-xs mt-1">{errors.vigencia_identificacion.message}</p>}
                </div>
                <div>
                  <label className="label-field">Clave de Elector</label>
                  <input {...register('clave_elector')} className="input-field" placeholder="Opcional" maxLength={20} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="curp_val" {...register('curp_validado_renapo')} className="w-4 h-4 rounded" />
                  <label htmlFor="curp_val" className="text-sm text-gray-700">CURP validado RENAPO</label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="rfc_val" {...register('rfc_validado_sat')} className="w-4 h-4 rounded" />
                  <label htmlFor="rfc_val" className="text-sm text-gray-700">RFC validado SAT</label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="ine_val" {...register('ine_validado_ine')} className="w-4 h-4 rounded" />
                  <label htmlFor="ine_val" className="text-sm text-gray-700">INE validado INE</label>
                </div>
              </div>
            )}

            {/* TAB: Domicilio */}
            {activeTab === 'domicilio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Etq err={errors.calle}>Calle</Etq>
                  <input {...register('calle', { required: 'Campo requerido' })} className={inputClass(errors.calle)} placeholder="Nombre de la calle" />
                </div>
                <div>
                  <Etq err={errors.num_exterior}>Núm. Exterior</Etq>
                  <input {...register('num_exterior', { required: 'Campo requerido' })} className={inputClass(errors.num_exterior)} placeholder="123" />
                </div>
                <div>
                  <label className="label-field">Núm. Interior</label>
                  <input {...register('num_interior')} className="input-field" placeholder="A, 2B, etc." />
                </div>
                <div>
                  <Etq err={errors.colonia}>Colonia</Etq>
                  <input {...register('colonia', { required: 'Campo requerido' })} className={inputClass(errors.colonia)} placeholder="Colonia" />
                </div>
                <div>
                  <Etq err={errors.municipio}>Municipio/Alcaldía</Etq>
                  <input {...register('municipio', { required: 'Campo requerido' })} className={inputClass(errors.municipio)} placeholder="Municipio" />
                </div>
                <div>
                  <Etq err={errors.estado_id}>Estado</Etq>
                  <select {...register('estado_id', { required: 'Campo requerido', valueAsNumber: true, validate: v => !isNaN(v) || 'Campo requerido' })} className={inputClass(errors.estado_id)}>
                    <option value="">Seleccionar</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <Etq err={errors.cp}>Código Postal</Etq>
                  <input
                    {...register('cp', { required: 'Campo requerido', minLength: { value: 5, message: 'CP de 5 dígitos' }, maxLength: 5 })}
                    className={inputClass(errors.cp)}
                    placeholder="12345"
                    maxLength={5}
                  />
                  {errors.cp && <p className="text-red-500 text-xs mt-1">{errors.cp.message}</p>}
                </div>
                <div>
                  <label className="label-field">País de Residencia</label>
                  <input {...register('pais_residencia')} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Tipo de Domicilio</label>
                  <select {...register('tipo_domicilio')} className="input-field">
                    <option value="">Seleccionar</option>
                    <option value="PROPIO">Propio</option>
                    <option value="RENTADO">Rentado</option>
                    <option value="FAMILIAR">Familiar</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Antigüedad en domicilio (meses)</label>
                  <input type="number" {...register('antiguedad_domicilio_meses', { valueAsNumber: true })} className="input-field" placeholder="0" min={0} />
                </div>
              </div>
            )}

            {/* TAB: Contacto */}
            {activeTab === 'contacto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Etq err={errors.telefono_celular}>Teléfono Celular</Etq>
                  <input {...register('telefono_celular', { required: 'Campo requerido' })} className={inputClass(errors.telefono_celular)} placeholder="10 dígitos" maxLength={15} />
                </div>
                <div>
                  <label className="label-field">Teléfono Casa</label>
                  <input {...register('telefono_casa')} className="input-field" placeholder="10 dígitos" maxLength={15} />
                </div>
                <div>
                  <label className="label-field">Teléfono Trabajo</label>
                  <input {...register('telefono_trabajo')} className="input-field" placeholder="10 dígitos" maxLength={15} />
                </div>
                <div>
                  <Etq err={errors.email}>Correo Electrónico</Etq>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Campo requerido',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                    })}
                    className={inputClass(errors.email)}
                    placeholder="ejemplo@correo.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>
            )}

            {/* TAB: Laboral */}
            {activeTab === 'laboral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Etq err={errors.ocupacion_id}>Ocupación</Etq>
                  <select {...register('ocupacion_id', { required: 'Campo requerido', valueAsNumber: true, validate: v => !isNaN(v) || 'Campo requerido' })} className={inputClass(errors.ocupacion_id)}>
                    <option value="">Seleccionar</option>
                    {ocupaciones.map(o => <option key={o.id} value={o.id}>{o.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Empresa/Empleador</label>
                  <input {...register('empresa_trabajo')} className="input-field" placeholder="Nombre de la empresa" />
                </div>
                <div>
                  <label className="label-field">Giro del Negocio</label>
                  <input {...register('giro_negocio')} className="input-field" placeholder="Tipo de negocio" />
                </div>
                <div>
                  <Etq err={errors.ingreso_mensual}>Ingreso Mensual</Etq>
                  <input
                    type="number"
                    step="0.01"
                    {...register('ingreso_mensual', { required: 'Campo requerido', valueAsNumber: true, min: { value: 0, message: 'Debe ser positivo' } })}
                    className={inputClass(errors.ingreso_mensual)}
                    placeholder="0.00"
                  />
                  {errors.ingreso_mensual && <p className="text-red-500 text-xs mt-1">{errors.ingreso_mensual.message}</p>}
                </div>
                <div>
                  <label className="label-field">Otros Ingresos</label>
                  <input type="number" step="0.01" {...register('otros_ingresos', { valueAsNumber: true })} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <Etq err={errors.origen_recursos}>Origen de Recursos</Etq>
                  <select {...register('origen_recursos', { required: 'Campo requerido' })} className={inputClass(errors.origen_recursos)}>
                    <option value="">Seleccionar</option>
                    <option value="SALARIO">Salario</option>
                    <option value="NEGOCIO PROPIO">Negocio Propio</option>
                    <option value="INVERSIÓN">Inversión</option>
                    <option value="HERENCIA">Herencia</option>
                    <option value="PENSIÓN">Pensión</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <Etq err={errors.nivel_cuenta_id}>Nivel de Cuenta</Etq>
                  <select {...register('nivel_cuenta_id', { required: true, valueAsNumber: true })} className="input-field">
                    {nivelesCuenta.map(n => <option key={n.id} value={n.id}>{n.nombre} — {n.limite_deposito}</option>)}
                  </select>
                </div>
                <div>
                  <Etq err={errors.nivel_riesgo_id}>Nivel de Riesgo</Etq>
                  <select {...register('nivel_riesgo_id', { required: true, valueAsNumber: true })} className="input-field">
                    {nivelesRiesgo.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* TAB: KYC / PEP */}
            {activeTab === 'kyc' && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-800 mb-3">Persona Políticamente Expuesta (PEP)</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="es_pep" {...register('es_pep')} className="w-4 h-4 rounded accent-amber-600" />
                      <label htmlFor="es_pep" className="text-sm font-medium text-gray-700">El cliente ES una Persona Políticamente Expuesta</label>
                    </div>
                    {esPep && (
                      <div>
                        <Etq err={errors.descripcion_pep}>Descripción PEP</Etq>
                        <textarea {...register('descripcion_pep', { validate: v => !watch('es_pep') || !!String(v ?? '').trim() || 'Si el cliente es PEP hay que describir el cargo.' })} className="input-field h-20 resize-none" placeholder="Cargo, institución, ámbito..." />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="familiar_pep" {...register('tiene_familiar_pep')} className="w-4 h-4 rounded accent-amber-600" />
                      <label htmlFor="familiar_pep" className="text-sm font-medium text-gray-700">Tiene familiar que es PEP</label>
                    </div>
                    {tieneFamiliarPep && (
                      <div>
                        <label className="label-field">Descripción del familiar PEP</label>
                        <textarea {...register('descripcion_familiar_pep')} className="input-field h-20 resize-none" placeholder="Nombre, cargo, parentesco..." />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label-field">Estatus del Cliente</label>
                  <select {...register('estatus', { valueAsNumber: true })} className="input-field max-w-xs">
                    <option value={1}>Activo</option>
                    <option value={2}>Bloqueado</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Método de Contratación</label>
                  <select {...register('metodo_contratacion')} className="input-field max-w-xs">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="MOVIL">Móvil</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB: Términos */}
            {activeTab === 'terminos' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-blue-900">Consentimientos y Aceptaciones</h3>
                  {[
                    { id: 'acepta_terminos', label: 'Acepta Términos y Condiciones', required: true },
                    { id: 'acepta_uso_datos', label: 'Acepta el uso y tratamiento de datos personales (LFPDPPP)', required: true },
                    { id: 'acepta_grabacion', label: 'Acepta grabación de video identificación', required: false },
                  ].map(item => (
                    <div key={item.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-blue-100">
                      <input
                        type="checkbox"
                        id={item.id}
                        {...register(item.id as keyof Cliente, item.required ? { validate: v => v === true || 'Debe aceptarse para dar de alta al cliente.' } : undefined)}
                        className="w-4 h-4 rounded mt-0.5 accent-primary-700"
                      />
                      <div>
                        <label htmlFor={item.id} className="text-sm font-medium text-gray-800 cursor-pointer">{item.label}</label>
                        {item.required && <span className={errors[item.id as keyof Cliente] ? 'text-red-600 ml-1 font-extrabold' : 'text-red-500 ml-1 text-xs'}>*</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Al dar de alta al cliente confirmas que has verificado su identidad conforme a las políticas KYC y la normativa PLD vigentes.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
            <div className="flex gap-2">
              {activeTabIndex > 0 && (
                <button type="button" onClick={() => setActiveTab(TABS[activeTabIndex - 1].id)} className="btn-secondary">
                  Anterior
                </button>
              )}
              {activeTabIndex < TABS.length - 1 && (
                <button type="button" onClick={() => setActiveTab(TABS[activeTabIndex + 1].id)} className="btn-primary">
                  Siguiente
                </button>
              )}
            </div>
            
              {isEdit && <button
                type="button"
                onClick={() => navigate(`/tarjetas/emitir?cliente=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mr-4"
              >
                <CreditCard size={18} />
                Emitir Tarjeta
              </button>}
            <button type="submit" disabled={saving} className="btn-success">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Cliente' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;
