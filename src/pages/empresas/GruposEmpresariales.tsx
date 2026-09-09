import React, { useState, useEffect } from 'react';
import { Plus, Building2, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const GruposEmpresariales: React.FC = () => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for immediate visualization (antes de conectar con el nuevo endpoint de Node)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setGrupos([
        { id: 1, nombre_grupo: 'Corporativo Menonita Cuauhtémoc', empresas_count: 3, limite_credito_global: 500000, activo: true },
        { id: 2, nombre_grupo: 'Grupo Transportes del Norte', empresas_count: 2, limite_credito_global: 250000, activo: true },
        { id: 3, nombre_grupo: 'Familia Wall', empresas_count: 4, limite_credito_global: 1000000, activo: true },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grupos Empresariales</h1>
          <p className="text-gray-500">Gestiona los corporativos (Holdings) y sus líneas de crédito consolidadas.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Nuevo Grupo</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre de grupo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre del Grupo (Holding)</th>
                <th className="px-6 py-4 font-medium">Empresas Afiliadas</th>
                <th className="px-6 py-4 font-medium">Límite de Crédito Global</th>
                <th className="px-6 py-4 font-medium">Estatus</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando grupos...</td>
                </tr>
              ) : grupos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay grupos registrados</td>
                </tr>
              ) : (
                grupos.map((grupo) => (
                  <tr key={grupo.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{grupo.nombre_grupo}</div>
                          <div className="text-sm text-gray-500">ID: {grupo.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                        {grupo.empresas_count} empresas
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      ${grupo.limite_credito_global.toLocaleString('es-MX')} MXN
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GruposEmpresariales;
