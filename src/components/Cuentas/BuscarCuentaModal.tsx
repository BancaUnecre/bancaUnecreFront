import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import api from '../../services/api';
import type { CuentaBuscada } from '../../types/cuenta.types';

interface BuscarCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cuenta: CuentaBuscada) => void;
}

const formatFecha = (fecha: string | null): string => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const BuscarCuentaModal: React.FC<BuscarCuentaModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const parsedQuery = query.trim().replace(/\s+/g, '%');
      const { data } = await api.get(`/cuentas/buscar?q=${encodeURIComponent(parsedQuery)}`);
      if (data.success) {
        setResultados(data.data);
      } else {
        alert('API Error: ' + data.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">

          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Buscar Cuenta / Cliente</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X size={24} /></button>
          </div>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nombre, Apellido, CURP, RFC o ID Cuenta..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
            />
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2">
              <Search size={18} />
              <span className="text-sm font-medium">Buscar</span>
            </button>
          </form>

          {/* Resultados */}
          <div className="max-h-80 overflow-y-auto rounded-md border border-gray-200">
            {loading ? (
              <p className="text-center py-6 text-gray-500">Buscando...</p>
            ) : resultados.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cuenta</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Titular</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">F. Nacimiento</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CURP</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RFC</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {resultados.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap font-bold text-gray-900">#{r.cuenta_id}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                        {r.nombre} {r.apellido_paterno} {r.apellido_materno || ''}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatFecha(r.fecha_nacimiento)}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-600">{r.curp || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-600">{r.rfc || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            onSelect(r as CuentaBuscada);
                            onClose();
                          }}
                          className="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded hover:bg-primary-700 transition-colors"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : query && !loading ? (
              <p className="text-center py-6 text-gray-500">No se encontraron resultados para "{query}".</p>
            ) : (
              <p className="text-center py-6 text-gray-400 text-sm">Ingresa un nombre, CURP, RFC o ID de cuenta para buscar.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
