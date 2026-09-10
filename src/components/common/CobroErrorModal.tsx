import React from 'react';
import { 
  AlertOctagon, X, CreditCard, DollarSign, WifiOff, ShieldAlert, 
  HelpCircle, ArrowRight, RefreshCw, AlertTriangle
} from 'lucide-react';

export interface CobroErrorData {
  codigo?: string;
  mensaje: string;
  motivoDetallado?: string;
  montoSolicitado?: number;
  saldoActual?: number;
  saldoFaltante?: number;
  numeroTarjeta?: string;
  cuentaId?: number | string;
  accionSugerida?: string;
  origen?: 'pos' | 'cobranza' | 'abono' | 'vale' | 'general';
}

interface CobroErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorData: CobroErrorData | null;
  onActionClick?: (accion: string) => void;
}

export const CobroErrorModal: React.FC<CobroErrorModalProps> = ({
  isOpen,
  onClose,
  errorData,
  onActionClick
}) => {
  if (!isOpen || !errorData) return null;

  // Analizar y categorizar el error para mostrar diagnósticos automáticos inteligentes
  const texto = (errorData.mensaje || errorData.codigo || '').toLowerCase();
  
  let Icono = AlertOctagon;
  let colorHeader = 'bg-red-500';
  let colorBadge = 'bg-red-100 text-red-700 border-red-200';
  let categoria = 'RECHAZO DE OPERACIÓN';
  let accionRecomendada = errorData.accionSugerida;

  if (texto.includes('insuficiente') || errorData.codigo === 'FONDOS_INSUFICIENTES') {
    Icono = DollarSign;
    categoria = 'FONDOS INSUFICIENTES';
    if (!accionRecomendada) {
      accionRecomendada = 'El saldo en cuenta no cubre el monto solicitado. Sugiera al cliente realizar un depósito previo en ventanilla o liquidar con efectivo.';
    }
  } else if (texto.includes('bloqueada') || texto.includes('bloqueado') || errorData.codigo === 'TARJETA_BLOQUEADA') {
    Icono = ShieldAlert;
    categoria = 'TARJETA O CUENTA BLOQUEADA';
    if (!accionRecomendada) {
      accionRecomendada = 'El plástico o la cuenta bancaria están bloqueados preventivamente. Solicite al cliente una identificación oficial o acuda con el supervisor para revisión.';
    }
  } else if (texto.includes('conexion') || texto.includes('terminal') || texto.includes('red') || texto.includes('desconectada')) {
    Icono = WifiOff;
    categoria = 'FALLO DE CONEXIÓN CON TERMINAL';
    colorHeader = 'bg-amber-500';
    colorBadge = 'bg-amber-100 text-amber-700 border-amber-200';
    if (!accionRecomendada) {
      accionRecomendada = 'La terminal física no responde. Verifique que la terminal esté encendida, con batería y conectada a la red Wi-Fi de la sucursal.';
    }
  } else if (texto.includes('expirado') || texto.includes('vencido') || texto.includes('caducado')) {
    Icono = AlertTriangle;
    categoria = 'VALE O VENCIMIENTO INVÁLIDO';
    colorHeader = 'bg-amber-600';
    colorBadge = 'bg-amber-100 text-amber-800 border-amber-200';
    if (!accionRecomendada) {
      accionRecomendada = 'La vigencia del documento o vale ha expirado. Solicite un nuevo vale vigente al emisor.';
    }
  }

  const fmt = (n?: number) => n !== undefined ? n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col z-10 animate-scaleUp">
        
        {/* Banner Superior de Error */}
        <div className={`${colorHeader} text-white px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Icono size={26} className="text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase opacity-90 block">
                Alerta para el Cajero
              </span>
              <h3 className="text-lg font-bold leading-tight">
                {categoria}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido del Diagnóstico */}
        <div className="p-6 space-y-5">
          
          {/* Motivo Principal */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Motivo Específico del Rechazo:
            </p>
            <p className="text-base font-semibold text-gray-900 leading-snug">
              {errorData.mensaje}
            </p>
            {errorData.motivoDetallado && (
              <p className="text-xs text-gray-600 mt-2 border-t border-gray-200 pt-2 leading-relaxed">
                {errorData.motivoDetallado}
              </p>
            )}
          </div>

          {/* Desglose Financiero (si aplica fondos insuficientes o saldo) */}
          {(errorData.montoSolicitado !== undefined || errorData.saldoActual !== undefined) && (
            <div className="grid grid-cols-2 gap-3 bg-red-50/60 border border-red-100 rounded-xl p-4 text-sm">
              {errorData.montoSolicitado !== undefined && (
                <div>
                  <span className="text-xs text-gray-500 block">Monto Solicitado:</span>
                  <span className="font-bold text-gray-800 text-base">{fmt(errorData.montoSolicitado)}</span>
                </div>
              )}
              {errorData.saldoActual !== undefined && (
                <div>
                  <span className="text-xs text-gray-500 block">Saldo en Cuenta:</span>
                  <span className="font-bold text-red-600 text-base">{fmt(errorData.saldoActual)}</span>
                </div>
              )}
              {errorData.saldoFaltante !== undefined && (
                <div className="col-span-2 pt-2 border-t border-red-200 flex justify-between items-center text-xs">
                  <span className="font-semibold text-red-700">Saldo Faltante para Cubrir Operación:</span>
                  <span className="font-bold text-red-800 text-sm">{fmt(errorData.saldoFaltante)}</span>
                </div>
              )}
            </div>
          )}

          {/* Guía de Acción para el Cajero */}
          {accionRecomendada && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
              <HelpCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-0.5">
                  ¿Qué debe hacer el cajero?
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {accionRecomendada}
                </p>
              </div>
            </div>
          )}

          {/* Metadata de la Operación */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
            {errorData.numeroTarjeta && (
              <span>Tarjeta: <strong className="font-mono text-gray-600">{errorData.numeroTarjeta}</strong></span>
            )}
            {errorData.cuentaId && (
              <span>Cuenta: <strong className="font-mono text-gray-600">#{errorData.cuentaId}</strong></span>
            )}
            <span>Hora: <strong className="text-gray-600">{new Date().toLocaleTimeString('es-MX')}</strong></span>
          </div>

        </div>

        {/* Footer con Botones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default CobroErrorModal;
