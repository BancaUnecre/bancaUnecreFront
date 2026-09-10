import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface TerminalAlerta {
  id: number;
  marca: string;
  modelo: string;
  direccion_mac: string;
  sucursal: string;
  minutos_sin_conexion: number | null;
  estado_conexion: string;
  motivo_especifico: string;
  nivel_alerta: 'ok' | 'warning' | 'danger';
}

export const TerminalAlertBanner: React.FC = () => {
  const [alertas, setAlertas] = useState<TerminalAlerta[]>([]);
  const [cerrado, setCerrado] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/terminal-dispositivos/alertas');
      if (res.data.success) {
        setAlertas(res.data.data || []);
      }
    } catch (e) {
      // Silencioso para no saturar
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 20000); // Chequeo cada 20s
    return () => clearInterval(interval);
  }, []);

  if (cerrado || alertas.length === 0) return null;

  const count = alertas.length;
  const principal = alertas[0];

  return (
    <div className="bg-amber-500 border-b border-amber-600 text-white px-4 py-2.5 shadow-sm transition-all animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-1.5 bg-amber-600/60 rounded-lg shrink-0">
            <WifiOff size={17} className="text-amber-100 animate-pulse" />
          </div>
          <div className="truncate">
            <span className="font-bold mr-1.5">
              ⚠️ Alerta de Terminal ({count} fuera de línea):
            </span>
            <span className="text-amber-100 font-medium">
              {principal.marca.toUpperCase()} {principal.modelo} ({principal.sucursal}) — {principal.motivo_especifico}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <Link
            to="/terminales"
            className="flex items-center gap-1 text-xs font-bold bg-amber-600/80 hover:bg-amber-600 px-3 py-1 rounded-lg transition-colors border border-amber-400/40"
          >
            Diagnosticar Terminales <ChevronRight size={13} />
          </Link>
          <button
            onClick={() => setCerrado(true)}
            className="p-1 text-amber-200 hover:text-white rounded transition-colors"
            title="Ocultar aviso"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalAlertBanner;
