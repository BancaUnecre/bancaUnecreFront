import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ProblemaGuardado {
  /** Pestaña o sección donde está el problema (ej. "Datos Personales"). */
  seccion?: string;
  campo: string;
  motivo: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  descripcion?: string;
  problemas: ProblemaGuardado[];
  /** Al hacer clic en una sección, ir a ella (opcional). */
  onIrASeccion?: (seccion: string) => void;
}

/** Ventana estilo shadcn (AlertDialog) que explica por qué no se puede guardar. */
const AvisoGuardarDialog: React.FC<Props> = ({
  isOpen, onClose, titulo = 'No se puede guardar', descripcion, problemas, onIrASeccion,
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const secciones = [...new Set(problemas.map(p => p.seccion ?? ''))];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-2xl max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-sm text-gray-400 hover:text-gray-700" aria-label="Cerrar">
          <X size={16} />
        </button>
        <div className="flex gap-3 px-6 pt-6 pb-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {descripcion ?? 'Corrige lo siguiente y vuelve a intentar. Los campos con problema tienen el * en rojo.'}
            </p>
          </div>
        </div>
        <div className="overflow-y-auto px-6 pb-2 space-y-3">
          {secciones.map(s => (
            <div key={s || '-'} className="rounded-md border border-red-100 bg-red-50/60">
              {s && (
                <button
                  type="button"
                  disabled={!onIrASeccion}
                  onClick={() => { onIrASeccion?.(s); onClose(); }}
                  className="w-full text-left px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-red-700 enabled:hover:underline"
                >
                  {s}
                </button>
              )}
              <ul className="px-3 py-2 space-y-1">
                {problemas.filter(p => (p.seccion ?? '') === s).map((p, i) => (
                  <li key={i} className="text-sm text-gray-800">
                    <span className="font-medium">{p.campo}:</span> <span className="text-gray-600">{p.motivo}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-primary">Entendido</button>
        </div>
      </div>
    </div>
  );
};

export default AvisoGuardarDialog;
