import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Unlock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { terminalTarjetasService } from '../../services/terminalTarjetasService';

interface Props {
  cuentaId: number;
  onClose: () => void;
}

const TarjetasTerminalModal: React.FC<Props> = ({ cuentaId, onClose }) => {
  const [tarjeta, setTarjeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');

  const loadTarjeta = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await terminalTarjetasService.getAll({ cuenta_id: cuentaId });
      const items = (res.data.data || []).filter((t: any) => t.estado !== 'cancelada');
      if (items.length > 0) {
        setTarjeta(items[0]);
      } else {
        setTarjeta(null);
      }
    } catch (e: any) {
      setError('Error al cargar la información de la tarjeta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTarjeta();
  }, [cuentaId]);

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroTarjeta || !fechaVencimiento) {
      setError('Llene todos los campos');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await terminalTarjetasService.create({
        cuenta_id: cuentaId,
        numero_tarjeta: numeroTarjeta,
        fecha_vencimiento: fechaVencimiento
      });
      setSuccess('Tarjeta asignada correctamente');
      setNumeroTarjeta('');
      setFechaVencimiento('');
      await loadTarjeta();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al asignar tarjeta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string, motivo: string) => {
    if (!tarjeta) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await terminalTarjetasService.changeStatus(tarjeta.id, { estado: nuevoEstado, motivo });
      setSuccess(`Tarjeta ${nuevoEstado === 'activa' ? 'desbloqueada' : 'bloqueada'} correctamente`);
      await loadTarjeta();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tarjeta Vinculada</h3>
              <p className="text-sm text-gray-500">Gestión de POS de la cuenta</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : tarjeta ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CreditCard size={100} />
                </div>
                <div className="relative z-10">
                  <p className="text-gray-400 text-xs mb-1">Número de Tarjeta</p>
                  <p className="text-xl font-mono tracking-widest mb-4">
                    {tarjeta.numero_tarjeta}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Vencimiento</p>
                      <p className="font-mono text-sm">{tarjeta.fecha_vencimiento}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tarjeta.estado === 'activa' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                        {tarjeta.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {tarjeta.estado === 'activa' ? (
                  <button 
                    onClick={() => handleCambiarEstado('inactiva', 'Bloqueo manual desde panel web')}
                    disabled={isSubmitting}
                    className="flex-1 btn-secondary text-amber-600 border-amber-200 hover:bg-amber-50 flex items-center justify-center gap-2"
                  >
                    <Lock size={16} /> Bloquear Tarjeta
                  </button>
                ) : (
                  <button 
                    onClick={() => handleCambiarEstado('activa', 'Desbloqueo manual desde panel web')}
                    disabled={isSubmitting}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Unlock size={16} /> Desbloquear Tarjeta
                  </button>
                )}
                <button 
                  onClick={() => setShowCancelForm(!showCancelForm)}
                  disabled={isSubmitting}
                  className="flex-1 btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <X size={16} /> Cancelar Tarjeta
                </button>
              </div>

              {showCancelForm && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mt-4">
                  <h4 className="text-sm font-bold text-red-800 mb-2">Cancelar Tarjeta</h4>
                  <p className="text-xs text-red-600 mb-3">Esta acción es irreversible. Se dará de baja la tarjeta por extravío u otros motivos.</p>
                  <input
                    type="text"
                    value={cancelMotivo}
                    onChange={(e) => setCancelMotivo(e.target.value)}
                    placeholder="Escribe la razón de la cancelación..."
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setShowCancelForm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Omitir
                    </button>
                    <button 
                      onClick={() => handleCambiarEstado('cancelada', cancelMotivo || 'Cancelación manual')}
                      disabled={!cancelMotivo.trim() || isSubmitting}
                      className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Cancelación
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAsignar} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={28} className="text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900">Sin tarjeta asignada</h4>
                <p className="text-sm text-gray-500">Asigna una tarjeta física para permitir pagos en terminal.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tarjeta (16 dígitos)</label>
                <input 
                  type="text" 
                  maxLength={16}
                  value={numeroTarjeta}
                  onChange={e => setNumeroTarjeta(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento (MM/AA)</label>
                <input 
                  type="text" 
                  maxLength={5}
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder="12/28"
                  required
                />
              </div>

              <button type="submit" disabled={isSubmitting || numeroTarjeta.length < 16} className="w-full btn-primary mt-2">
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Vincular Tarjeta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TarjetasTerminalModal;
