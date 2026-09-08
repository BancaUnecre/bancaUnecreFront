import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CreditCard, TrendingUp, Shield, Activity, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/statsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

const quickAccess = [
  { to: '/clientes/nuevo',           label: 'Nuevo Cliente',      desc: 'Registrar un nuevo cliente',       color: 'from-blue-600 to-blue-800' },
  { to: '/cuentas/apertura',         label: 'Apertura de Cuenta', desc: 'Abrir cuenta a un cliente',        color: 'from-emerald-600 to-emerald-800' },
  { to: '/operaciones/transferencia',label: 'Transferencia',      desc: 'Mover saldo entre cuentas',        color: 'from-purple-600 to-purple-800' },
  { to: '/empresas',                 label: 'Empresas',           desc: 'Gestionar empresas vinculadas',    color: 'from-amber-600 to-amber-800' },
];

const fmtNum = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const fmtInt = (n: number) => n.toLocaleString('es-MX');

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();
  const hora = now.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const [stats, setStats] = useState({ 
    clientes_activos: 0, 
    cuentas_activas: 0, 
    total_prestado: 0, 
    cartera_vencida: 0,
    grafica: [] 
  });
  const [actividad, setActividad] = useState<{ movimientos: any[]; clientes: any[] }>({ movimientos: [], clientes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [resStats, resActividad] = await Promise.all([
          statsService.getResumen(),
          statsService.getActividadReciente(),
        ]);
        if (resStats.data.success) setStats(resStats.data.data);
        if (resActividad.data.success) setActividad(resActividad.data.data);
      } catch (e) {
        console.error('Error cargando stats', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{saludo}, {user?.nombre || 'Usuario'}</h1>
          <p className="text-gray-500 mt-1">
            Aquí tienes un resumen del estado de tu sucursal.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
          <Shield className="w-5 h-5" />
          <span>{user?.rol === 'admin' ? 'Administrador' : 'Cajero'}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Tarjetas de Metricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Capital Colocado</h3>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtNum(stats.total_prestado)}</p>
              <p className="text-sm text-gray-500 mt-2">Saldo total en la calle</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Cartera Vencida</h3>
                <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtNum(stats.cartera_vencida)}</p>
              <p className="text-sm text-gray-500 mt-2">Créditos con retraso</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Clientes Activos</h3>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Users className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtInt(stats.clientes_activos)}</p>
              <p className="text-sm text-gray-500 mt-2">Con cuenta activa</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Cuentas Abiertas</h3>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CreditCard className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtInt(stats.cuentas_activas)}</p>
              <p className="text-sm text-gray-500 mt-2">De ahorro y crédito</p>
            </div>
          </div>

          {/* Gráfica de Préstamos vs Recuperación */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Comportamiento del Crédito (Últimos Meses)</h3>
            <div className="h-80 w-full">
              {stats.grafica && stats.grafica.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.grafica} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      formatter={(value: number) => fmtNum(value)}
                      cursor={{fill: '#F3F4F6'}}
                    />
                    <Legend />
                    <Bar dataKey="prestamos" name="Dinero Prestado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recuperacion" name="Dinero Recuperado (Abonos)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No hay datos suficientes para graficar</div>
              )}
            </div>
          </div>

          {/* Accesos Rapidos */}
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccess.map((item, idx) => (
              <Link
                key={idx}
                to={item.to}
                className={`group block p-6 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-1`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-bold text-lg">{item.label}</h3>
                <p className="text-white/80 text-sm mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
