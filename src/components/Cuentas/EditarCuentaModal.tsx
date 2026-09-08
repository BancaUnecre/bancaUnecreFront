import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Cuenta } from '../../types';
import { cuentasService } from '../../services/cuentasService';

interface EditarCuentaModalProps {
  cuenta: Cuenta;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditarCuentaModal({ cuenta, isOpen, onClose, onSaved }: EditarCuentaModalProps) {
  const [limiteCredito, setLimiteCredito] = useState<number>(0);
  const [tasaCredito, setTasaCredito] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLimiteCredito(cuenta.limite_credito || 0);
      setTasaCredito(cuenta.tasa_credito || 0);
      setError(null);
    }
  }, [isOpen, cuenta]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await cuentasService.update(cuenta.id!, {
        limite_credito: Number(limiteCredito) || 0,
        tasa_credito: Number(tasaCredito) || 0,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error al actualizar la cuenta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Editar Parámetros</h2>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{cuenta.numero_cuenta}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite de Crédito
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={limiteCredito}
                  onChange={e => setLimiteCredito(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Crédito (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max="100"
                  value={tasaCredito}
                  onChange={e => setTasaCredito(Number(e.target.value))}
                  className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow outline-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

