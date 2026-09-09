import React, { useState } from 'react';
import { Settings, Save, AlertCircle, RefreshCw, Server, Bell, Key, Plus, Trash2 } from 'lucide-react';

interface Correo { id: number; correo: string; tipo: 'IT' | 'EJECUTIVO'; activo: boolean; }

const ConfiguracionGeneral: React.FC = () => {
  const [correos, setCorreos] = useState<Correo[]>([
    { id: 1, correo: 'meny8083@gmail.com', tipo: 'IT', activo: true },
    { id: 2, correo: 'sistemas@unecre.com', tipo: 'IT', activo: false },
    { id: 3, correo: 'jacobo@unecre.com', tipo: 'EJECUTIVO', activo: true },
  ]);
  const [nuevoCorreoIT, setNuevoCorreoIT] = useState('');
  const [nuevoCorreoEje, setNuevoCorreoEje] = useState('');

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
        <button className="btn-primary flex items-center gap-2">
          <Save size={18} />
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Entorno */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Server size={20} className="text-blue-500" />
            Entorno del Sistema
          </h2>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Entorno Activo</label>
            <select className="input-field">
              <option value="Pruebas">Pruebas (QA)</option>
              <option value="Produccion">Producción (Live)</option>
            </select>
            <p className="text-xs text-gray-500">
              Precaución: Cambiar el entorno requiere reiniciar el backend.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Modo Mantenimiento</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-gray-600">Activar página de mantenimiento para cajeros</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Alertas */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Bell size={20} className="text-amber-500" />
            Correos de Notificación
          </h2>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Alertas IT / Errores</label>
            <div className="flex gap-2">
              <input type="email" className="input-field" placeholder="Nuevo correo IT..." value={nuevoCorreoIT} onChange={e => setNuevoCorreoIT(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCorreo('IT', nuevoCorreoIT)} />
              <button type="button" onClick={() => agregarCorreo('IT', nuevoCorreoIT)} className="btn-secondary px-3"><Plus size={18} /></button>
            </div>
            <ul className="mt-2 space-y-2">
              {correosIT.map(c => (
                <li key={c.id} className={`flex items-center justify-between p-2 rounded-lg text-sm border ${c.activo ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-red-50 border-red-100 text-red-500 line-through opacity-70'}`}>
                  <span>{c.correo}</span>
                  <button onClick={() => toggleCorreoActivo(c.id)} className={`p-1 rounded hover:bg-gray-200 transition-colors ${c.activo ? 'text-red-500' : 'text-emerald-600'}`} title={c.activo ? 'Eliminar (Desactivar)' : 'Restaurar'}>
                    {c.activo ? <Trash2 size={15} /> : <RefreshCw size={15} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700">Alertas Ejecutivas</label>
            <div className="flex gap-2">
              <input type="email" className="input-field" placeholder="Nuevo correo ejecutivo..." value={nuevoCorreoEje} onChange={e => setNuevoCorreoEje(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCorreo('EJECUTIVO', nuevoCorreoEje)} />
              <button type="button" onClick={() => agregarCorreo('EJECUTIVO', nuevoCorreoEje)} className="btn-secondary px-3"><Plus size={18} /></button>
            </div>
            <ul className="mt-2 space-y-2">
              {correosEje.map(c => (
                <li key={c.id} className={`flex items-center justify-between p-2 rounded-lg text-sm border ${c.activo ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-red-50 border-red-100 text-red-500 line-through opacity-70'}`}>
                  <span>{c.correo}</span>
                  <button onClick={() => toggleCorreoActivo(c.id)} className={`p-1 rounded hover:bg-gray-200 transition-colors ${c.activo ? 'text-red-500' : 'text-emerald-600'}`} title={c.activo ? 'Eliminar (Desactivar)' : 'Restaurar'}>
                    {c.activo ? <Trash2 size={15} /> : <RefreshCw size={15} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel 3: Tareas Automáticas */}
        <div className="card p-6 space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <RefreshCw size={20} className="text-emerald-500" />
            Tareas en Segundo Plano (Crons)
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-semibold text-gray-800">Motor de Crons</p>
              <p className="text-sm text-gray-500">Ejecución automática de vales vencidos y reportes.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">ACTIVO</span>
              <button className="btn-secondary text-xs py-1">Pausar Motor</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionGeneral;
