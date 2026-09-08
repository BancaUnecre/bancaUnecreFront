import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title = 'Confirmar acción', message,
  confirmLabel = 'Eliminar', loading,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="text-red-600" size={28} />
      </div>
      <p className="text-center text-gray-600">{message}</p>
      <div className="flex gap-3 w-full">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
        <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
          {loading ? 'Procesando...' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
