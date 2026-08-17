import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CreditCard, TrendingUp, Shield, Activity, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/statsService';

const quickAccess = [
  { to: '/clientes/nuevo',           label: 'Nuevo Cliente',      desc: 'Registrar un nuevo cliente',       color: 'from-blue-600 to-blue-800' },
  { to: '/cuentas/apertura',         label: 'Apertura de Cuenta', desc: 'Abrir cuenta a un cliente',        color: 'from-emerald-600 to-emerald-800' },
  { to: '/operaciones/transferencia',label: 'Transferencia',      desc: 'Mover saldo entre cuentas',        color: 'from-purple-600 to-purple-800' },
  { to: '/empresas',                 label: 'Empresas',           desc: 'Gestionar empresas vinculadas',    color: 'from-amber-600 to-amber-800' },
];

const fmtNum = (n: number) => n.toLocaleString('es-MX');

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();
  const hora = now.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const [stats, setStats] = useState({ clientes_activos: 0, cuentas_activas: 0, operaciones_hoy: 0, alertas_pendientes: 0 });
  const [actividad, setActividad] = useState<{ movimientos: any[]; clientes: any[] }>({ movimientos: [], clientes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [resStats, resActividad] = await Promise.all([
          statsService.getResumen(),
          statsService.getActividadReciente(),
        ]);
        const s = (resStats.data as any)?.data ?? {};
        setStats({
          clientes_activos:   s.clientes_activos   ?? 0,
          cuentas_activas:    s.cuentas_activas    ?? 0,
          operaciones_hoy:    s.operaciones_hoy    ?? 0,
          alertas_pendientes: s.alertas_pendientes ?? 0,
        });
        const a = (resActividad.data as any)?.data ?? {};
        setActividad({ movimientos: a.movimientos ?? [], clientes: a.clientes ?? [] });
      } catch { /* silencioso — muestra ceros */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Clientes Activos',    value: stats.clientes_activos,   icon: Users,       color: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700' },
    { label: 'Cuentas Activas',     value: stats.cuentas_activas,    icon: CreditCard,  color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
    { label: 'Operaciones Hoy',     value: stats.operaciones_hoy,    icon: Activity,    color: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700' },
    { label: 'Alertas Pendientes',  value: stats.alertas_pendientes, icon: Shield,      color: 'bg-red-500',     light: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{saludo}, {user?.nombre}</h1>
            <p className="text-primary-300 mt-1">
              {now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-300 text-sm">Rol</p>
            <p className="text-white font-semibold capitalize">{user?.rol?.toLowerCase() ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                {loading
                  ? <div className="mt-2"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
                  : <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(s.value)}</p>
                }
              </div>
              <div className={`${s.color} p-3 rounded-xl`}>
                <s.icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`bg-gradient-to-br ${item.color} rounded-xl p-5 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
            >
              <TrendingUp size={24} className="mb-3 opacity-80" />
              <p className="font-bold">{item.label}</p>
              <p className="text-sm opacity-75 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary-600" />
            Últimas Transferencias
          </h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : actividad.movimientos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {actividad.movimientos.map((m: any) => (
                <div key={m.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700">
                      Transferencia <span className="font-mono font-semibold">{m.folio}</span> — ${Number(m.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-xs text-gray-400">{new Date(m.fecha).toLocaleString('es-MX')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary-600" />
            Clientes Recientes
          </h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : actividad.clientes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin clientes registrados</p>
          ) : (
            <div className="space-y-3">
              {actividad.clientes.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700 font-medium">{c.nombre} {c.apellido_paterno}</span>
                    <p className="text-xs text-gray-400">Alta: {new Date(c.fecha_alta).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
