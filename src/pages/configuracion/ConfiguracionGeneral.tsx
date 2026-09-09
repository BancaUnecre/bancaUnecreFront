import React from 'react';
import { Settings, Save, AlertCircle, RefreshCw, Server, Bell, Key } from 'lucide-react';

const ConfiguracionGeneral: React.FC = () => {
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
            <input type="email" className="input-field" placeholder="ej. sistemas@unecre.com" defaultValue="meny8083@gmail.com" />
            <p className="text-xs text-gray-500">Separar múltiples correos con coma.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Alertas Ejecutivas</label>
            <input type="email" className="input-field" placeholder="ej. direccion@unecre.com" />
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
