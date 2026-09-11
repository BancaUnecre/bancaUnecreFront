import React, { useState } from 'react';
import { Settings, Save, AlertCircle, RefreshCw, Server, Bell, Key, Plus, Trash2, Eye, EyeOff, Folder, Play, CheckCircle } from 'lucide-react';

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

  React.useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/configuracion/status')
        .then(res => {
          if (res.data) {
            setMantenimientoActivo(!!res.data.mantenimiento_activo);
            setMantenimientoMotivo(res.data.mantenimiento_motivo || '');
            setMantenimientoIniciadoPor(res.data.mantenimiento_iniciado_por || '');
            setMantenimientoFechaInicio(res.data.mantenimiento_fecha_inicio || '');
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

  const correosIT = correos.filter(c => c.tipo === 'IT');
  const correosEje = correos.filter(c => c.tipo === 'EJECUTIVO');

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
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="input-field flex-1 font-mono text-xs" 
                  value={rutaReportesAlertas}
                  onChange={e => setRutaReportesAlertas(e.target.value)}
                  placeholder="C:\discos\proyectos\banco\bancaUnecreAPI\reportes\alertas"
                />
                <button 
                  type="button" 
                  onClick={handleGuardarRutaAlertas}
                  disabled={guardandoRuta}
                  className="btn-primary px-4 py-2 flex items-center gap-1.5 text-xs font-semibold"
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
      </div>
    </div>
  );
};

export default ConfiguracionGeneral;
