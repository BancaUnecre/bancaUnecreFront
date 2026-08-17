import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type FieldErrors } from 'react-hook-form';
import { ArrowLeft, Save, User, MapPin, Phone, Briefcase, Shield, FileText, Loader2, AlertCircle } from 'lucide-react';
import type { Cliente, Estado, TipoIdentificacion, Ocupacion, NivelCuenta, NivelRiesgo } from '../../types';
import { clientesService } from '../../services/clientesService';
import { estadosService } from '../../services/estadosService';
import { tipoIdentificacionService } from '../../services/tipoIdentificacionService';
import { ocupacionesService } from '../../services/ocupacionesService';
import { nivelCuentaService } from '../../services/nivelCuentaService';
import { nivelRiesgoService } from '../../services/nivelRiesgoService';

type Tab = 'personal' | 'domicilio' | 'contacto' | 'laboral' | 'kyc' | 'terminos';

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'personal', label: 'Datos Personales', icon: User },
  { id: 'domicilio', label: 'Domicilio', icon: MapPin },
  { id: 'contacto', label: 'Contacto', icon: Phone },
  { id: 'laboral', label: 'Info. Laboral', icon: Briefcase },
  { id: 'kyc', label: 'KYC / PEP', icon: Shield },
  { id: 'terminos', label: 'Términos', icon: FileText },
];

const ClienteForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingCliente, setLoadingCliente] = useState(isEdit);
  const [apiError, setApiError] = useState<string | null>(null);

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
  };

  const TAB_LABELS: Record<Tab, string> = {
    personal: 'Datos Personales', domicilio: 'Domicilio',
    contacto: 'Contacto', laboral: 'Info. Laboral', kyc: 'KYC / PEP', terminos: 'Términos',
  };

  const onError = (errs: FieldErrors<Cliente>) => {
    const tabOrder: Tab[] = ['personal', 'domicilio', 'contacto', 'laboral', 'kyc', 'terminos'];
    const tabsConError = tabOrder.filter(tab =>
      (Object.keys(errs) as (keyof Cliente)[]).some(f => FIELD_TABS[f] === tab)
    );
    if (tabsConError.length > 0) {
      setActiveTab(tabsConError[0]);
      const nombres = tabsConError.map(t => TAB_LABELS[t]).join(', ');
      setApiError(`Faltan campos requeridos en: ${nombres}. Completa los campos marcados en rojo.`);
    }
  };

  const sanitize = (data: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        v === '' ? null : (typeof v === 'number' && isNaN(v) ? null : v),
      ])
    );

  const onSubmit = async (data: Cliente) => {
    setSaving(true);
    setApiError(null);
    const payload = sanitize(data as unknown as Record<string, unknown>) as unknown as Cliente;
    try {
      if (isEdit) {
        await clientesService.update(Number(id), payload);
      } else {
        await clientesService.create(payload);
      }
      navigate('/clientes');
    } catch (e: any) {
      const serverErr: string = e?.response?.data?.error ?? '';
      let msg: string;
      if (serverErr.includes('notNull Violation')) {
        const CAMPO_LABELS: Record<string, string> = {
          calle: 'Calle', num_exterior: 'Núm. Exterior', colonia: 'Colonia',
          municipio: 'Municipio', estado_id: 'Estado', cp: 'Código Postal',
          telefono_celular: 'Teléfono Celular', email: 'Correo Electrónico',
          ocupacion_id: 'Ocupación', ingreso_mensual: 'Ingreso Mensual',
          origen_recursos: 'Origen de Recursos', nombre: 'Nombre',
          apellido_paterno: 'Apellido Paterno', curp: 'CURP', rfc: 'RFC',
          tipo_identificacion_id: 'Tipo de Identificación',
          num_identificacion: 'Núm. de Identificación',
          vigencia_identificacion: 'Vigencia Identificación',
          genero: 'Género', fecha_nacimiento: 'Fecha de Nacimiento',
        };
        const matches = serverErr.match(/Clientes\.(\w+) cannot be null/g) ?? [];
        const campos = matches.map(m => {
          const field = m.replace('Clientes.', '').replace(' cannot be null', '');
          return CAMPO_LABELS[field] ?? field;
        });
        msg = `Faltan campos requeridos: ${campos.join(', ')}.`;
      } else if (serverErr.includes('CHECK constraint')) {
        msg = 'Valor no permitido en algún campo. Revisa los datos ingresados.';
      } else if (serverErr.includes('UNIQUE') || serverErr.includes('duplicate') || serverErr === 'Validation error') {
        msg = 'Ya existe un cliente con esos datos (CURP, RFC o correo electrónico duplicado).';
      } else {
        msg = e?.response?.data?.message ?? e?.message ?? 'Error al guardar';
      }
      setApiError(msg);
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
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="p-6">

            {/* TAB: Personal */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="label-field">Nombre *</label>
                  <input {...register('nombre', { required: 'Campo requerido' })} className={inputClass(errors.nombre)} placeholder="Nombre(s)" />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="label-field">Apellido Paterno *</label>
                  <input {...register('apellido_paterno', { required: 'Campo requerido' })} className={inputClass(errors.apellido_paterno)} placeholder="Apellido paterno" />
                  {errors.apellido_paterno && <p className="text-red-500 text-xs mt-1">{errors.apellido_paterno.message}</p>}
                </div>
                <div>
                  <label className="label-field">Apellido Materno</label>
                  <input {...register('apellido_materno')} className="input-field" placeholder="Apellido materno" />
                </div>
                <div>
                  <label className="label-field">Fecha de Nacimiento *</label>
                  <input type="date" {...register('fecha_nacimiento', { required: 'Campo requerido' })} className={inputClass(errors.fecha_nacimiento)} />
                  {errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento.message}</p>}
                </div>
                <div>
                  <label className="label-field">Género *</label>
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
                  <label className="label-field">CURP *</label>
                  <input
                    {...register('curp', { required: 'Campo requerido', minLength: { value: 18, message: 'CURP debe tener 18 caracteres' }, maxLength: { value: 18, message: 'CURP debe tener 18 caracteres' } })}
                    className={inputClass(errors.curp)}
                    placeholder="18 caracteres"
                    maxLength={18}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.curp && <p className="text-red-500 text-xs mt-1">{errors.curp.message}</p>}
                </div>
                <div>
                  <label className="label-field">RFC *</label>
                  <input {...register('rfc', { required: 'Campo requerido' })} className={inputClass(errors.rfc)} placeholder="12 o 13 caracteres" maxLength={13} style={{ textTransform: 'uppercase' }} />
                  {errors.rfc && <p className="text-red-500 text-xs mt-1">{errors.rfc.message}</p>}
                </div>
                <div>
                  <label className="label-field">Tipo de Identificación *</label>
                  <select {...register('tipo_identificacion_id', { required: 'Campo requerido', valueAsNumber: true, validate: v => !isNaN(v) || 'Campo requerido' })} className={inputClass(errors.tipo_identificacion_id)}>
                    <option value="">Seleccionar</option>
                    {tiposId.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Número de Identificación *</label>
                  <input {...register('num_identificacion', { required: 'Campo requerido' })} className={inputClass(errors.num_identificacion)} placeholder="Número de doc." />
                </div>
                <div>
                  <label className="label-field">Vigencia Identificación *</label>
                  <input type="date" {...register('vigencia_identificacion', { required: 'Campo requerido' })} className={inputClass(errors.vigencia_identificacion)} />
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
                  <label className="label-field">Calle *</label>
                  <input {...register('calle', { required: 'Campo requerido' })} className={inputClass(errors.calle)} placeholder="Nombre de la calle" />
                </div>
                <div>
                  <label className="label-field">Núm. Exterior *</label>
                  <input {...register('num_exterior', { required: 'Campo requerido' })} className={inputClass(errors.num_exterior)} placeholder="123" />
                </div>
                <div>
                  <label className="label-field">Núm. Interior</label>
                  <input {...register('num_interior')} className="input-field" placeholder="A, 2B, etc." />
                </div>
                <div>
                  <label className="label-field">Colonia *</label>
                  <input {...register('colonia', { required: 'Campo requerido' })} className={inputClass(errors.colonia)} placeholder="Colonia" />
                </div>
                <div>
                  <label className="label-field">Municipio/Alcaldía *</label>
                  <input {...register('municipio', { required: 'Campo requerido' })} className={inputClass(errors.municipio)} placeholder="Municipio" />
                </div>
                <div>
                  <label className="label-field">Estado *</label>
                  <select {...register('estado_id', { required: 'Campo requerido', valueAsNumber: true, validate: v => !isNaN(v) || 'Campo requerido' })} className={inputClass(errors.estado_id)}>
                    <option value="">Seleccionar</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Código Postal *</label>
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
                  <label className="label-field">Teléfono Celular *</label>
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
                  <label className="label-field">Correo Electrónico *</label>
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
                  <label className="label-field">Ocupación *</label>
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
                  <label className="label-field">Ingreso Mensual *</label>
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
                  <label className="label-field">Origen de Recursos *</label>
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
                  <label className="label-field">Nivel de Cuenta *</label>
                  <select {...register('nivel_cuenta_id', { required: true, valueAsNumber: true })} className="input-field">
                    {nivelesCuenta.map(n => <option key={n.id} value={n.id}>{n.nombre} — {n.limite_deposito}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Nivel de Riesgo *</label>
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
                        <label className="label-field">Descripción PEP *</label>
                        <textarea {...register('descripcion_pep')} className="input-field h-20 resize-none" placeholder="Cargo, institución, ámbito..." />
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
                        {...register(item.id as keyof Cliente)}
                        className="w-4 h-4 rounded mt-0.5 accent-primary-700"
                      />
                      <div>
                        <label htmlFor={item.id} className="text-sm font-medium text-gray-800 cursor-pointer">{item.label}</label>
                        {item.required && <span className="text-red-500 ml-1 text-xs">*</span>}
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
