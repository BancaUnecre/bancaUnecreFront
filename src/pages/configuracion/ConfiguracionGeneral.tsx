import React, { useState } from 'react';
import { Settings, Save, AlertCircle, RefreshCw, Server, Bell, Key, Plus, Trash2, Eye, EyeOff, Folder, Play, CheckCircle, FolderSearch, ChevronRight, CornerLeftUp, FolderPlus, HardDrive, X, CreditCard, Database, Activity, ShieldCheck } from 'lucide-react';

interface Correo { id: number; correo: string; tipo: 'IT' | 'EJECUTIVO'; activo: boolean; eliminado_por?: string; fecha_eliminacion?: string; ip_eliminacion?: string; }

interface CatalogoCronItem {
  id: number;
  clave: string;
  nombre: string;
  frecuencia: string;
  activo: boolean;
}

interface RegistroCronItem {
  id: number;
  nombre_cron: string;
  fecha_ejecucion: string;
  estado: 'Exito' | 'Fallo';
  detalles_resultado?: string;
  notificado_por_correo?: boolean;
}

interface ConexionesData {
  salud: {
    estado: string;
    mensaje: string;
    bloqueos: number;
  };
  sql_server: {
    base_datos: string;
    total_conexiones: number;
    conexiones_activas: number;
    conexiones_dormidas: number;
    hosts_distintos: number;
    logins_distintos: number;
    desglose_programas: Array<{
      programa: string;
      login_name: string;
      conexiones: number;
      ultima_peticion: string;
    }>;
  };
  pool_sequelize: {
    size: number;
    available: number;
    using: number;
    waiting: number;
    max: number;
    min: number;
  };
  timestamp: string;
}

const ConfiguracionGeneral: React.FC = () => {
  const [correos, setCorreos] = useState<Correo[]>([
    { id: 1, correo: 'meny8083@gmail.com', tipo: 'IT', activo: true },
    { id: 2, correo: 'sistemas@unecre.com', tipo: 'IT', activo: false },
    { id: 3, correo: 'jacobo@unecre.com', tipo: 'EJECUTIVO', activo: true },
  ]);
  const [nuevoCorreoIT, setNuevoCorreoIT] = useState('');
  const [nuevoCorreoEje, setNuevoCorreoEje] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mostrarEliminadosIT, setMostrarEliminadosIT] = useState(false);
  const [mostrarEliminadosEje, setMostrarEliminadosEje] = useState(false);
  const [mantenimientoActivo, setMantenimientoActivo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados de Crons
  const [cronsActivosMaster, setCronsActivosMaster] = useState(true);
  const [catalogoCrons, setCatalogoCrons] = useState<CatalogoCronItem[]>([]);
  const [historialCrons, setHistorialCrons] = useState<RegistroCronItem[]>([]);

  // Estados de Auditoría de Mantenimiento
  const [mantenimientoMotivo, setMantenimientoMotivo] = useState('');
  const [mantenimientoIniciadoPor, setMantenimientoIniciadoPor] = useState('');
  const [mantenimientoFechaInicio, setMantenimientoFechaInicio] = useState('');

  // Modal para capturar motivo
  const [modalMantenimientoOpen, setModalMantenimientoOpen] = useState(false);
  const [motivoInput, setMotivoInput] = useState('');
  const [iniciadoPorInput, setIniciadoPorInput] = useState('Administrador TI (Meny)');
  const [procesandoMantenimiento, setProcesandoMantenimiento] = useState(false);

  // Estados de Ruta de Reportes CSV de Alertas
  const [rutaReportesAlertas, setRutaReportesAlertas] = useState('C:\\discos\\proyectos\\banco\\bancaUnecreAPI\\reportes\\alertas');
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [mensajeRuta, setMensajeRuta] = useState('');
  const [ejecutandoCronManual, setEjecutandoCronManual] = useState(false);

  // Estados de Switch Bancario / Tarjetas Externas
  const [aceptarTarjetasExternas, setAceptarTarjetasExternas] = useState(false);
  const [procesandoTarjetasExternas, setProcesandoTarjetasExternas] = useState(false);
  const [mensajeTarjetasExternas, setMensajeTarjetasExternas] = useState('');

  // Estados del Explorador de Directorios del Servidor
  const [modalExploradorOpen, setModalExploradorOpen] = useState(false);
  const [exploradorRutaActual, setExploradorRutaActual] = useState('');
  const [exploradorRutaPadre, setExploradorRutaPadre] = useState<string | null>(null);
  const [exploradorCarpetas, setExploradorCarpetas] = useState<string[]>([]);
  const [exploradorUnidades, setExploradorUnidades] = useState<string[]>([]);
  const [cargandoExplorador, setCargandoExplorador] = useState(false);
  const [errorExplorador, setErrorExplorador] = useState('');
  const [mostrarCrearCarpeta, setMostrarCrearCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [creandoCarpeta, setCreandoCarpeta] = useState(false);

  // Estados del Monitor de Conexiones en Vivo
  const [monitorConexiones, setMonitorConexiones] = useState<ConexionesData | null>(null);
  const [cargandoConexiones, setCargandoConexiones] = useState(false);

  const cargarConexiones = async () => {
    setCargandoConexiones(true);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.get('/stats/conexiones');
      if (res.data?.success) {
        setMonitorConexiones(res.data.data);
      }
    } catch (e) {
      console.error('Error cargando conexiones:', e);
    } finally {
      setCargandoConexiones(false);
    }
  };

  React.useEffect(() => {
    cargarConexiones();
    import('../../services/api').then(({ default: api }) => {
      api.get('/configuracion/status')
        .then(res => {
          if (res.data) {
            setMantenimientoActivo(!!res.data.mantenimiento_activo);
            setMantenimientoMotivo(res.data.mantenimiento_motivo || '');
            setMantenimientoIniciadoPor(res.data.mantenimiento_iniciado_por || '');
            setMantenimientoFechaInicio(res.data.mantenimiento_fecha_inicio || '');
            setAceptarTarjetasExternas(!!res.data.aceptar_tarjetas_externas);
          }
        })
        .catch(err => console.error('Error cargando estado de mantenimiento:', err));

      api.get('/configuracion/crons')
        .then(res => {
          if (res.data) {
            setCronsActivosMaster(res.data.crons_activos);
            setCatalogoCrons(res.data.crons || []);
            setHistorialCrons(res.data.historial || []);
          }
        })
        .catch(err => console.error('Error cargando crons:', err));

      api.get('/configuracion/ruta-alertas')
        .then(res => {
          if (res.data && res.data.ruta_reportes_alertas) {
            setRutaReportesAlertas(res.data.ruta_reportes_alertas);
          }
        })
        .catch(err => console.error('Error cargando ruta de alertas:', err));
    });
  }, []);

  const handleGuardarRutaAlertas = async () => {
    setGuardandoRuta(true);
    setMensajeRuta('');
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.put('/configuracion/ruta-alertas', { ruta: rutaReportesAlertas });
      if (res.data && res.data.success) {
        setMensajeRuta('Ruta de reportes actualizada correctamente.');
        setTimeout(() => setMensajeRuta(''), 4000);
      }
    } catch (err: any) {
      console.error('Error al guardar ruta:', err);
      setMensajeRuta('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setGuardandoRuta(false);
    }
  };

  const cargarDirectorio = async (ruta?: string) => {
    setCargandoExplorador(true);
    setErrorExplorador('');
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.get('/configuracion/explorar-directorios', { params: { ruta } });
      if (res.data && res.data.success) {
        setExploradorRutaActual(res.data.rutaActual);
        setExploradorRutaPadre(res.data.rutaPadre);
        setExploradorCarpetas(res.data.carpetas || []);
        setExploradorUnidades(res.data.unidades || []);
      }
    } catch (err: any) {
      console.error('Error al explorar directorio:', err);
      setErrorExplorador(err.response?.data?.error || err.message || 'Error al leer directorio del servidor');
    } finally {
      setCargandoExplorador(false);
    }
  };

  const handleAbrirExplorador = (rutaInicial?: string) => {
    setModalExploradorOpen(true);
    setMostrarCrearCarpeta(false);
    setNombreNuevaCarpeta('');
    cargarDirectorio(rutaInicial || rutaReportesAlertas);
  };

  const handleEntrarCarpeta = (nombre: string) => {
    const separador = exploradorRutaActual.endsWith('\\') || exploradorRutaActual.endsWith('/') ? '' : '\\';
    const nuevaRuta = `${exploradorRutaActual}${separador}${nombre}`;
    cargarDirectorio(nuevaRuta);
  };

  const handleSubirNivel = () => {
    if (exploradorRutaPadre) {
      cargarDirectorio(exploradorRutaPadre);
    }
  };

  const handleCrearCarpeta = async () => {
    if (!nombreNuevaCarpeta.trim()) return;
    setCreandoCarpeta(true);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.post('/configuracion/crear-directorio', {
        rutaBase: exploradorRutaActual,
        nombreCarpeta: nombreNuevaCarpeta.trim()
      });
      if (res.data && res.data.success) {
        setNombreNuevaCarpeta('');
        setMostrarCrearCarpeta(false);
        cargarDirectorio(exploradorRutaActual);
      }
    } catch (err: any) {
      alert('Error creando carpeta: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreandoCarpeta(false);
    }
  };

  const handleSeleccionarCarpeta = () => {
    setRutaReportesAlertas(exploradorRutaActual);
    setModalExploradorOpen(false);
  };

  const handleEjecutarReporteAlertas = async (turno: 'MANANA' | 'TARDE') => {
    setEjecutandoCronManual(true);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.post('/configuracion/crons/alertas/ejecutar', { turno });
      if (res.data && res.data.success) {
        alert(`¡Reporte de Turno ${res.data.turno} ejecutado con éxito!\n\nIncidentes detectados: ${res.data.totalAlertas} (${res.data.totalRed} de red, ${res.data.totalClientes} de clientes)\nArchivo CSV guardado en:\n${res.data.csvPath}`);
        // Recargar historial de crons
        const resCrons = await api.get('/configuracion/crons');
        if (resCrons.data) setHistorialCrons(resCrons.data.historial || []);
      }
    } catch (err: any) {
      alert('Error ejecutando reporte: ' + (err.response?.data?.error || err.message));
    } finally {
      setEjecutandoCronManual(false);
    }
  };

  const handleToggleMasterCrons = async () => {
    const nuevo = !cronsActivosMaster;
    setCronsActivosMaster(nuevo);
    try {
      const { default: api } = await import('../../services/api');
      await api.put('/configuracion/crons/master', { activo: nuevo });
    } catch (err) {
      console.error('Error al actualizar master crons:', err);
    }
  };

  const handleToggleIndividualCron = async (id: number, activoActual: boolean) => {
    const nuevo = !activoActual;
    setCatalogoCrons(catalogoCrons.map(c => c.id === id ? { ...c, activo: nuevo } : c));
    try {
      const { default: api } = await import('../../services/api');
      await api.put(`/configuracion/crons/${id}`, { activo: nuevo });
    } catch (err) {
      console.error('Error al actualizar cron:', err);
    }
  };

  const formatFrecuencia = (frec: string) => {
    if (frec === '0 * * * *') return 'Cada hora en punto';
    if (frec === '0 1 * * *') return 'Todos los días a la 01:00 AM';
    if (frec === '*/15 * * * *') return 'Cada 15 minutos';
    return frec;
  };

  const handleClickCheckboxMantenimiento = () => {
    if (!mantenimientoActivo) {
      setMotivoInput('');
      setModalMantenimientoOpen(true);
    } else {
      if (window.confirm('¿Deseas finalizar el Modo Mantenimiento y reanudar operaciones en terminales POS?')) {
        handleDesactivarMantenimiento();
      }
    }
  };

  const handleConfirmarActivarMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoInput.trim()) {
      alert('Debes ingresar el motivo del mantenimiento obligatoriamente.');
      return;
    }
    setProcesandoMantenimiento(true);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.put('/configuracion/mantenimiento', {
        activo: true,
        motivo: motivoInput.trim(),
        iniciado_por: iniciadoPorInput.trim()
      });
      if (res.data && res.data.success) {
        setMantenimientoActivo(true);
        setMantenimientoMotivo(res.data.mantenimiento_motivo);
        setMantenimientoIniciadoPor(res.data.mantenimiento_iniciado_por);
        setMantenimientoFechaInicio(res.data.mantenimiento_fecha_inicio);
        setModalMantenimientoOpen(false);
        window.dispatchEvent(new CustomEvent('mantenimiento-changed', { detail: true }));
      }
    } catch (err: any) {
      alert('Error activando mantenimiento: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcesandoMantenimiento(false);
    }
  };

  const handleDesactivarMantenimiento = async () => {
    setProcesandoMantenimiento(true);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.put('/configuracion/mantenimiento', { 
        activo: false,
        iniciado_por: iniciadoPorInput 
      });
      if (res.data && res.data.success) {
        setMantenimientoActivo(false);
        setMantenimientoMotivo('');
        setMantenimientoIniciadoPor('');
        setMantenimientoFechaInicio('');
        window.dispatchEvent(new CustomEvent('mantenimiento-changed', { detail: false }));
      }
    } catch (err: any) {
      alert('Error desactivando mantenimiento: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcesandoMantenimiento(false);
    }
  };

  const handleGuardarCambios = async () => {
    setGuardando(true);
    try {
      const { default: api } = await import('../../services/api');
      await api.put('/configuracion/mantenimiento', { activo: mantenimientoActivo });
      alert('Configuración guardada exitosamente.');
    } catch (err) {
      alert('Error guardando cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const agregarCorreo = (tipo: 'IT' | 'EJECUTIVO', correo: string) => {
    if (!correo.trim()) return;
    setCorreos([...correos, { id: Date.now(), correo, tipo, activo: true }]);
    if (tipo === 'IT') setNuevoCorreoIT(''); else setNuevoCorreoEje('');
  };

  const toggleCorreoActivo = (id: number) => {
    setCorreos(correos.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  const handleToggleTarjetasExternas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.checked;
    setProcesandoTarjetasExternas(true);
    setMensajeTarjetasExternas('');
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.put('/configuracion/tarjetas-externas', { activo: nuevoValor });
      if (res.data && res.data.success) {
        setAceptarTarjetasExternas(res.data.aceptar_tarjetas_externas);
        setMensajeTarjetasExternas(res.data.message);
        setTimeout(() => setMensajeTarjetasExternas(''), 5000);
      }
    } catch (err: any) {
      alert('Error actualizando switch de tarjetas externas: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcesandoTarjetasExternas(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={28} className="text-primary-600" />
            Configuración General
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ajustes globales del sistema, correos, y variables de entorno
          </p>
        </div>
        <button 
          onClick={handleGuardarCambios}
          disabled={guardando}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Entorno y Conexiones */}
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Server size={20} className="text-blue-500" />
              Entorno del Sistema
            </h2>
            
            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium text-gray-700">Entorno Activo</label>
              <select className="input-field">
                <option value="Pruebas">Pruebas (QA)</option>
                <option value="Produccion">Producción (Live)</option>
              </select>
              <p className="text-xs text-gray-500">
                Precaución: Cambiar el entorno requiere reiniciar el backend.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Modo Mantenimiento</label>
              <div className="mt-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary-600 rounded cursor-pointer" 
                  checked={mantenimientoActivo}
                  onChange={handleClickCheckboxMantenimiento}
                  disabled={procesandoMantenimiento}
                />
                <span className={`text-sm ${mantenimientoActivo ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                  {mantenimientoActivo ? 'SISTEMA EN MANTENIMIENTO (CAJEROS BLOQUEADOS)' : 'Activar página de mantenimiento para cajeros'}
                </span>
              </div>

              {mantenimientoActivo && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle size={14} /> Mantenimiento en curso
                  </p>
                  <p><span className="font-semibold">Motivo:</span> {mantenimientoMotivo || 'Sin especificar'}</p>
                  <p><span className="font-semibold">Iniciado por:</span> {mantenimientoIniciadoPor || 'Administrador TI'}</p>
                  <p><span className="font-semibold">Hora de Inicio:</span> {mantenimientoFechaInicio ? new Date(mantenimientoFechaInicio).toLocaleString() : 'Reciente'}</p>
                </div>
              )}
            </div>

            {/* Control de Switch Bancario / Tarjetas Externas */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                Switch Bancario — Tarjetas Externas (Visa / Mastercard)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer" 
                  checked={aceptarTarjetasExternas}
                  onChange={handleToggleTarjetasExternas}
                  disabled={procesandoTarjetasExternas}
                />
                <span className={`text-sm font-semibold ${aceptarTarjetasExternas ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {aceptarTarjetasExternas 
                    ? 'SWITCH ACTIVO: Aceptando tarjetas de cualquier banco (Circuito Abierto)' 
                    : 'EXCLUSIVO UNECRE: Tarjetas externas bloqueadas (Circuito Cerrado)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {aceptarTarjetasExternas 
                  ? 'Las terminales Orobo y Sunmi procesarán cobros con tarjetas bancarias externas enviando autorización al Switch Adquirente.' 
                  : 'Las terminales Orobo y Sunmi solo aceptarán tarjetas emitidas por Banca Unecre (BIN 415231). Cualquier plástico foráneo será declinado automáticamente.'}
              </p>

              {mensajeTarjetasExternas && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                  {mensajeTarjetasExternas}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Key size={20} className="text-purple-500" />
              Credenciales de Envío SMTP
            </h2>
            
            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium text-gray-700">Usuario SMTP (Correo Saliente)</label>
              <input type="email" className="input-field" defaultValue="meny8083@gmail.com" />
            </div>

            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium text-gray-700">Contraseña SMTP (App Password)</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input-field pr-10" 
                  defaultValue="hxzc skbf bbew mmze" 
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Si usas Gmail, debes generar una contraseña de aplicación en tu cuenta de Google.</p>
            </div>
          </div>

          {/* Tarjeta de Ruta de Reportes de Alertas */}
          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Folder size={20} className="text-emerald-500" />
              Ruta de Archivos CSV (Reportes de Alertas)
            </h2>
            
            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Directorio en Servidor (Cron 6:00 AM y 6:00 PM)
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input 
                  type="text" 
                  className="input-field flex-1 font-mono text-xs" 
                  value={rutaReportesAlertas}
                  onChange={e => setRutaReportesAlertas(e.target.value)}
                  placeholder="C:\discos\proyectos\banco\bancaUnecreAPI\reportes\alertas"
                />
                <button 
                  type="button" 
                  onClick={() => handleAbrirExplorador(rutaReportesAlertas)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
                  title="Examinar y buscar carpetas en el servidor"
                >
                  <FolderSearch size={15} className="text-emerald-600" />
                  Buscar Carpeta
                </button>
                <button 
                  type="button" 
                  onClick={handleGuardarRutaAlertas}
                  disabled={guardandoRuta}
                  className="btn-primary px-4 py-2 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                >
                  <Save size={14} />
                  {guardandoRuta ? 'Guardando...' : 'Guardar Ruta'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Aquí se depositarán los archivos CSV generados por el cron semidiurno de alertas (6:00 AM y 6:00 PM).
              </p>

              {mensajeRuta && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${mensajeRuta.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {mensajeRuta.includes('Error') ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                  <span>{mensajeRuta}</span>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Ejecución Manual de Prueba:</span>
                <button
                  type="button"
                  onClick={() => handleEjecutarReporteAlertas('MANANA')}
                  disabled={ejecutandoCronManual}
                  className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-medium transition-colors flex items-center gap-1"
                >
                  <Play size={12} /> Probar Turno Mañana (6 AM)
                </button>
                <button
                  type="button"
                  onClick={() => handleEjecutarReporteAlertas('TARDE')}
                  disabled={ejecutandoCronManual}
                  className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded font-medium transition-colors flex items-center gap-1"
                >
                  <Play size={12} /> Probar Turno Tarde (6 PM)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Alertas */}
        <div className="card p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-amber-500" />
              Correos de Notificación
            </h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Alertas IT / Errores</label>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="mostrarEliminadosIT" 
                  className="w-3 h-3 text-primary-600 rounded"
                  checked={mostrarEliminadosIT}
                  onChange={(e) => setMostrarEliminadosIT(e.target.checked)}
                />
                <label htmlFor="mostrarEliminadosIT" className="text-xs text-gray-500 cursor-pointer">Mostrar eliminados</label>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="email" className="input-field" placeholder="Nuevo correo IT..." value={nuevoCorreoIT} onChange={e => setNuevoCorreoIT(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCorreo('IT', nuevoCorreoIT)} />
              <button type="button" onClick={() => agregarCorreo('IT', nuevoCorreoIT)} className="btn-secondary px-3"><Plus size={18} /></button>
            </div>
            <ul className="mt-2 space-y-2">
              {correosIT.filter(c => c.activo || mostrarEliminadosIT).map(c => (
                <li key={c.id} className={`flex flex-col p-2 rounded-lg text-sm border ${c.activo ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={!c.activo ? 'text-red-500 line-through opacity-70' : ''}>{c.correo}</span>
                    <button onClick={() => toggleCorreoActivo(c.id)} className={`p-1 rounded hover:bg-gray-200 transition-colors ${c.activo ? 'text-red-500' : 'text-emerald-600'}`} title={c.activo ? 'Eliminar (Desactivar)' : 'Restaurar'}>
                      {c.activo ? <Trash2 size={15} /> : <RefreshCw size={15} />}
                    </button>
                  </div>
                  {!c.activo && (
                    <div className="mt-1 text-[10px] text-red-400 font-medium bg-red-100/50 p-1 rounded">
                      Eliminado por: {c.eliminado_por || 'Admin'} el {c.fecha_eliminacion || 'Hoy'} (IP: {c.ip_eliminacion || '127.0.0.1'})
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Alertas Ejecutivas</label>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="mostrarEliminadosEje" 
                  className="w-3 h-3 text-primary-600 rounded"
                  checked={mostrarEliminadosEje}
                  onChange={(e) => setMostrarEliminadosEje(e.target.checked)}
                />
                <label htmlFor="mostrarEliminadosEje" className="text-xs text-gray-500 cursor-pointer">Mostrar eliminados</label>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="email" className="input-field" placeholder="Nuevo correo ejecutivo..." value={nuevoCorreoEje} onChange={e => setNuevoCorreoEje(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCorreo('EJECUTIVO', nuevoCorreoEje)} />
              <button type="button" onClick={() => agregarCorreo('EJECUTIVO', nuevoCorreoEje)} className="btn-secondary px-3"><Plus size={18} /></button>
            </div>
            <ul className="mt-2 space-y-2">
              {correosEje.filter(c => c.activo || mostrarEliminadosEje).map(c => (
                <li key={c.id} className={`flex flex-col p-2 rounded-lg text-sm border ${c.activo ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={!c.activo ? 'text-red-500 line-through opacity-70' : ''}>{c.correo}</span>
                    <button onClick={() => toggleCorreoActivo(c.id)} className={`p-1 rounded hover:bg-gray-200 transition-colors ${c.activo ? 'text-red-500' : 'text-emerald-600'}`} title={c.activo ? 'Eliminar (Desactivar)' : 'Restaurar'}>
                      {c.activo ? <Trash2 size={15} /> : <RefreshCw size={15} />}
                    </button>
                  </div>
                  {!c.activo && (
                    <div className="mt-1 text-[10px] text-red-400 font-medium bg-red-100/50 p-1 rounded">
                      Eliminado por: {c.eliminado_por || 'Admin'} el {c.fecha_eliminacion || 'Hoy'} (IP: {c.ip_eliminacion || '127.0.0.1'})
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel 3: Tareas Automáticas (Historial de Crons) */}
        <div className="card p-6 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <RefreshCw size={20} className="text-emerald-500" />
              Gestión y Auditoría de Crons
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Interruptor Maestro:</span>
              <button 
                onClick={handleToggleMasterCrons}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cronsActivosMaster ? 'bg-emerald-500' : 'bg-gray-300'}`}
                title={cronsActivosMaster ? 'Desactivar todos los crons' : 'Activar todos los crons'}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cronsActivosMaster ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {catalogoCrons.length === 0 ? (
              <div className="col-span-2 p-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg">
                Cargando tareas programadas...
              </div>
            ) : (
              catalogoCrons.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{c.nombre}</p>
                    <p className="text-xs text-gray-500">Ejecución: {formatFrecuencia(c.frecuencia)} ({c.clave})</p>
                  </div>
                  <button 
                    onClick={() => handleToggleIndividualCron(c.id, c.activo)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.activo ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    title={c.activo ? 'Desactivar cron' : 'Activar cron'}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${c.activo ? 'translate-x-5' : 'translate-x-1'}`}></span>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3">Cron</th>
                  <th className="px-4 py-3">Fecha de Ejecución</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Resultado / Filas Afectadas / Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historialCrons.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">
                      No hay registros de auditoría de crons recientes en la base de datos.
                    </td>
                  </tr>
                ) : (
                  historialCrons.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{h.nombre_cron}</td>
                      <td className="px-4 py-3">{new Date(h.fecha_ejecucion).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold px-2 py-1 rounded text-xs ${h.estado === 'Exito' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                          {h.estado === 'Exito' ? 'Éxito' : 'Fallo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{h.detalles_resultado || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 4: Monitor de Conexiones SQL Server (DMV) y Pool Sequelize */}
        <div className="card p-6 space-y-4 md:col-span-2 border border-slate-200 shadow-sm rounded-xl bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Database size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Monitor de Conexiones en Vivo y Salud de Base de Datos
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 ${
                    monitorConexiones?.salud.estado === 'OPTIMO'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : monitorConexiones?.salud.estado === 'ALERTA'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      monitorConexiones?.salud.estado === 'OPTIMO' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`} />
                    {monitorConexiones?.salud.estado || 'CARGANDO'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Telemetría en tiempo real de SQL Server (`sys.dm_exec_sessions`) y conexiones activas del pool de la API
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarConexiones}
              disabled={cargandoConexiones}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
              title="Refrescar métricas de conexiones ahora"
            >
              <RefreshCw size={14} className={cargandoConexiones ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              {cargandoConexiones ? 'Consultando DMV...' : 'Actualizar Conexiones'}
            </button>
          </div>

          {/* KPI Cards de Salud de Conexiones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* KPI 1: Base de Datos & Conexiones Totales */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                BD: {monitorConexiones?.sql_server.base_datos || 'banco'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {monitorConexiones?.sql_server.total_conexiones || 0}
                </span>
                <span className="text-xs font-medium text-slate-600">conexiones vivas</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="text-emerald-700 font-semibold">{monitorConexiones?.sql_server.conexiones_activas || 0} activas</span>
                <span>·</span>
                <span>{monitorConexiones?.sql_server.conexiones_dormidas || 0} inactivas</span>
              </div>
            </div>

            {/* KPI 2: Pool Sequelize (API Node.js) */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                Pool de la API (Sequelize)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-900">
                  {monitorConexiones?.pool_sequelize.using || 0} / {monitorConexiones?.pool_sequelize.max || 25}
                </span>
                <span className="text-xs font-medium text-blue-600">en ejecución</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-blue-600">
                <span>{monitorConexiones?.pool_sequelize.available || 0} libres</span>
                <span>·</span>
                <span className={monitorConexiones?.pool_sequelize.waiting ? 'text-red-600 font-bold' : ''}>
                  {monitorConexiones?.pool_sequelize.waiting || 0} en cola
                </span>
              </div>
            </div>

            {/* KPI 3: Bloqueos Transaccionales */}
            <div className={`p-4 rounded-xl border ${
              (monitorConexiones?.salud.bloqueos || 0) === 0
                ? 'bg-emerald-50/50 border-emerald-100'
                : 'bg-red-50 border-red-200'
            }`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                (monitorConexiones?.salud.bloqueos || 0) === 0 ? 'text-emerald-700' : 'text-red-700'
              }`}>
                Bloqueos Detectados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${
                  (monitorConexiones?.salud.bloqueos || 0) === 0 ? 'text-emerald-900' : 'text-red-900'
                }`}>
                  {monitorConexiones?.salud.bloqueos || 0}
                </span>
                <span className="text-xs font-medium text-gray-500">procesos bloqueados</span>
              </div>
              <div className="mt-2 text-[11px] font-medium text-emerald-800">
                {(monitorConexiones?.salud.bloqueos || 0) === 0 ? 'Cero bloqueos (NOLOCK activo)' : 'Atención requerida'}
              </div>
            </div>

            {/* KPI 4: Usuarios & Hosts */}
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                Usuarios y Orígenes
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-900">
                  {monitorConexiones?.sql_server.logins_distintos || 1}
                </span>
                <span className="text-xs font-medium text-purple-600">logins SQL</span>
              </div>
              <div className="mt-2 text-[11px] text-purple-600">
                Desde {monitorConexiones?.sql_server.hosts_distintos || 1} equipo(s)
              </div>
            </div>
          </div>

          {/* Tabla de Desglose de Conexiones por Aplicación */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Desglose de Conexiones Activas por Aplicación / Driver
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Aplicación / Driver</th>
                    <th className="px-4 py-2.5">Usuario SQL</th>
                    <th className="px-4 py-2.5 text-center">Conexiones Abiertas</th>
                    <th className="px-4 py-2.5">Última Petición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {monitorConexiones?.sql_server.desglose_programas && monitorConexiones.sql_server.desglose_programas.length > 0 ? (
                    monitorConexiones.sql_server.desglose_programas.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{p.programa}</td>
                        <td className="px-4 py-2.5 text-slate-600">{p.login_name}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-blue-700">{p.conexiones}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.ultima_peticion ? new Date(p.ultima_peticion).toLocaleTimeString() : 'En curso'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                        Sin conexiones registradas en este instante.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Aislamiento SQL Server: Consultas con `READ_UNCOMMITTED` automático para prevenir bloqueos en base compartida.</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Actualizado: {monitorConexiones?.timestamp ? new Date(monitorConexiones.timestamp).toLocaleTimeString() : '-'}
            </span>
          </div>
        </div>
      {modalMantenimientoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-gray-100 pb-3">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Activar Modo Mantenimiento</h3>
            </div>

            <p className="text-sm text-gray-600">
              Esta acción bloqueará de inmediato las terminales POS en sucursales, pausará el Watchdog de Windows y despachará un correo de notificación a TI y Ejecutivos.
            </p>

            <form onSubmit={handleConfirmarActivarMantenimiento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motivo del Mantenimiento <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  className="input-field w-full text-sm"
                  placeholder="Ej. Migración de base de datos, actualización de kernel EMV en terminales..."
                  value={motivoInput}
                  onChange={(e) => setMotivoInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Iniciado por
                </label>
                <input
                  type="text"
                  className="input-field w-full text-sm"
                  value={iniciadoPorInput}
                  onChange={(e) => setIniciadoPorInput(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMantenimientoOpen(false)}
                  disabled={procesandoMantenimiento}
                  className="btn-secondary text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoMantenimiento}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                >
                  {procesandoMantenimiento ? 'Activando...' : 'Confirmar y Activar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Explorador de Carpetas del Servidor */}
      {modalExploradorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FolderSearch size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Explorador de Carpetas del Servidor</h3>
                  <p className="text-xs text-gray-500">Selecciona la carpeta física en el servidor donde se guardarán los reportes CSV</p>
                </div>
              </div>
              <button
                onClick={() => setModalExploradorOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector de Unidades de Disco (Windows) */}
            {exploradorUnidades.length > 0 && (
              <div className="flex items-center gap-1.5 pt-3 pb-1 overflow-x-auto text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-1 mr-1">
                  <HardDrive size={13} /> Unidades:
                </span>
                {exploradorUnidades.map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => cargarDirectorio(u)}
                    className={`px-2.5 py-1 rounded border text-xs font-mono font-semibold transition-colors flex items-center gap-1 ${
                      exploradorRutaActual.startsWith(u)
                        ? 'bg-primary-50 text-primary-700 border-primary-300'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <HardDrive size={12} />
                    {u}
                  </button>
                ))}
              </div>
            )}

            {/* Barra de Navegación y Ruta Actual */}
            <div className="pt-2 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubirNivel}
                  disabled={!exploradorRutaPadre || cargandoExplorador}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Subir un nivel (Carpeta superior)"
                >
                  <CornerLeftUp size={14} /> Subir
                </button>

                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-800 truncate" title={exploradorRutaActual}>
                  {exploradorRutaActual}
                </div>

                <button
                  type="button"
                  onClick={() => cargarDirectorio(exploradorRutaActual)}
                  disabled={cargandoExplorador}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="Recargar carpeta"
                >
                  <RefreshCw size={14} className={cargandoExplorador ? 'animate-spin' : ''} />
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarCrearCarpeta(!mostrarCrearCarpeta)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Crear nueva subcarpeta"
                >
                  <FolderPlus size={14} /> Nueva Carpeta
                </button>
              </div>

              {/* Input desplegable para crear carpeta */}
              {mostrarCrearCarpeta && (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2 animate-fade-in">
                  <input
                    type="text"
                    className="input-field text-xs py-1 flex-1 bg-white"
                    placeholder="Nombre de la nueva subcarpeta (ej. reportes_2026)..."
                    value={nombreNuevaCarpeta}
                    onChange={e => setNombreNuevaCarpeta(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCrearCarpeta()}
                  />
                  <button
                    type="button"
                    onClick={handleCrearCarpeta}
                    disabled={creandoCarpeta || !nombreNuevaCarpeta.trim()}
                    className="btn-primary text-xs py-1 px-3"
                  >
                    {creandoCarpeta ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMostrarCrearCarpeta(false); setNombreNuevaCarpeta(''); }}
                    className="text-gray-400 hover:text-gray-600 text-xs px-1"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Carpetas */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 divide-y divide-gray-100 bg-gray-50/50 min-h-[200px] max-h-[300px]">
              {cargandoExplorador ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs gap-2">
                  <RefreshCw size={24} className="animate-spin text-primary-600" />
                  <span>Leyendo directorios del servidor...</span>
                </div>
              ) : errorExplorador ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorExplorador}</span>
                </div>
              ) : exploradorCarpetas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs gap-1">
                  <Folder size={28} className="opacity-40" />
                  <span className="font-medium">Carpeta vacía</span>
                  <span className="text-[11px] text-gray-400">No contiene subdirectorios visibles. Puedes seleccionar esta carpeta o crear una nueva.</span>
                </div>
              ) : (
                exploradorCarpetas.map((nombre) => (
                  <div
                    key={nombre}
                    onClick={() => handleEntrarCarpeta(nombre)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white hover:shadow-xs cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder size={18} className="text-amber-500 fill-amber-100 shrink-0 group-hover:text-amber-600" />
                      <span className="text-xs font-medium text-gray-800 truncate">{nombre}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-600 shrink-0" />
                  </div>
                ))
              )}
            </div>

            {/* Rutas Rápidas Sugeridas */}
            <div className="pt-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              <span className="font-semibold text-gray-600 text-[11px]">Accesos rápidos:</span>
              <button
                type="button"
                onClick={() => cargarDirectorio('C:\\discos\\proyectos\\banco\\bancaUnecreAPI\\reportes\\alertas')}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-mono transition-colors"
              >
                /reportes/alertas
              </button>
              <button
                type="button"
                onClick={() => cargarDirectorio('C:\\discos\\proyectos\\banco\\bancaUnecreAPI\\reportes')}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-mono transition-colors"
              >
                /reportes
              </button>
              <button
                type="button"
                onClick={() => cargarDirectorio('C:\\')}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-mono transition-colors"
              >
                C:\
              </button>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-3">
              <div className="text-xs text-gray-500 truncate max-w-sm">
                <span className="font-medium text-gray-700">Ruta elegida:</span> <span className="font-mono text-gray-800">{exploradorRutaActual}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalExploradorOpen(false)}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSeleccionarCarpeta}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-semibold"
                >
                  <CheckCircle size={14} /> Seleccionar Esta Carpeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      <HardResetSection />
    </div>
  );
};

function HardResetSection() {
  const [pass, setPass] = React.useState('');
  const [confirmar, setConfirmar] = React.useState(false);
  const [ejec, setEjec] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const run = async () => {
    setEjec(true); setMsg(null);
    try {
      const api = (await import('../../services/api')).default;
      const r = await api.post('/config-admin/hard-reset', { pass });
      setMsg({ ok: true, text: (r.data as any)?.message || 'Sistema reiniciado.' });
      setConfirmar(false); setPass('');
    } catch (e: any) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Error al reiniciar' });
    } finally { setEjec(false); }
  };
  return (
    <div className="card p-6 border-2 border-red-200 bg-red-50/40 mt-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-1"><Trash2 size={18} className="text-red-600" /><h3 className="text-lg font-bold text-red-700">Zona de peligro — Hard Reset</h3></div>
      <p className="text-sm text-gray-600 mb-4">Borra <b>toda la data</b> del sistema (cuentas, clientes, empresas, movimientos, tarjetas, terminales…), resetea los IDs y deja solo el usuario <b>admin</b>. No se puede deshacer.</p>
      <div className="flex flex-wrap items-center gap-3">
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Contraseña de Hard Reset"
          className="input-field max-w-xs" />
        <button onClick={() => setConfirmar(true)} disabled={!pass || ejec}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
          <Trash2 size={16} />Hard Reset
        </button>
      </div>
      {msg && <p className={`text-sm mt-3 ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h4 className="font-bold text-red-700 text-lg mb-2">¿Borrar TODO el sistema?</h4>
            <p className="text-sm text-gray-600 mb-5">Se eliminará toda la data y se recreará el usuario admin. Esta acción es irreversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={run} disabled={ejec} className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2">
                {ejec ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}{ejec ? 'Borrando...' : 'Sí, borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfiguracionGeneral;
