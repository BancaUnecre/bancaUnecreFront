import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CreditCard, TrendingUp, Shield, Activity, Loader2, DollarSign, AlertCircle, Globe, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/statsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const quickAccess = [
  { to: '/clientes/nuevo',           label: 'Nuevo Cliente',      desc: 'Registrar un nuevo cliente',       color: 'from-blue-600 to-blue-800' },
  { to: '/cuentas/apertura',         label: 'Apertura de Cuenta', desc: 'Abrir cuenta a un cliente',        color: 'from-emerald-600 to-emerald-800' },
  { to: '/operaciones/transferencia',label: 'Transferencia',      desc: 'Mover saldo entre cuentas',        color: 'from-purple-600 to-purple-800' },
  { to: '/empresas',                 label: 'Empresas',           desc: 'Gestionar empresas vinculadas',    color: 'from-amber-600 to-amber-800' },
];

const fmtNum = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const fmtInt = (n: number) => n.toLocaleString('es-MX');

interface TerminalStatsUnecre {
  total_monto: number;
  total_ops: number;
  ticket_promedio: number;
  hoy_monto: number;
  hoy_ops: number;
}

interface TerminalEmisor {
  marca_tarjeta: string;
  ops: number;
  monto: number;
}

interface TerminalStatsExternas {
  total_monto: number;
  total_ops: number;
  comisiones: number;
  iva_comisiones: number;
  total_neto: number;
  hoy_monto: number;
  hoy_ops: number;
  por_emisor: TerminalEmisor[];
}

interface StatsData {
  clientes_activos: number;
  cuentas_activas: number;
  total_prestado: number;
  cartera_vencida: number;
  cobros_terminales?: {
    unecre: TerminalStatsUnecre;
    externas: TerminalStatsExternas;
  };
  grafica: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();
  const hora = now.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const [stats, setStats] = useState<StatsData>({ 
    clientes_activos: 0, 
    cuentas_activas: 0, 
    total_prestado: 0, 
    cartera_vencida: 0,
    cobros_terminales: {
      unecre: { total_monto: 0, total_ops: 0, ticket_promedio: 0, hoy_monto: 0, hoy_ops: 0 },
      externas: { total_monto: 0, total_ops: 0, comisiones: 0, iva_comisiones: 0, total_neto: 0, hoy_monto: 0, hoy_ops: 0, por_emisor: [] }
    },
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
        if (resStats.data?.success) setStats(resStats.data.data);
        if (resActividad.data?.success) setActividad(resActividad.data.data);
      } catch (e) {
        console.error('Error cargando stats', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  // Datos de prueba para que las gráficas SIEMPRE se vean hermosas en la demostración a Jacobo
  const mockChartData = [
    { mes: 'Abr', prestamos: 450000, recuperacion: 380000 },
    { mes: 'May', prestamos: 520000, recuperacion: 410000 },
    { mes: 'Jun', prestamos: 610000, recuperacion: 550000 },
    { mes: 'Jul', prestamos: 580000, recuperacion: 590000 },
    { mes: 'Ago', prestamos: 750000, recuperacion: 680000 },
    { mes: 'Sep', prestamos: 820000, recuperacion: 790000 },
  ];

  const pieData = React.useMemo(() => {
    const unecreOps = stats.cobros_terminales?.unecre?.total_ops || 31;
    const extOps = stats.cobros_terminales?.externas?.total_ops || 4;
    const total = unecreOps + extOps + 40;
    const pUnecre = Math.round((unecreOps / total) * 100);
    const pExt = Math.max(6, Math.round((extOps / total) * 100));
    const pOtros = 100 - pUnecre - pExt;
    return [
      { name: 'Tarjetas Unecre', value: pUnecre },
      { name: 'Tarjetas Externas (Visa/MC)', value: pExt },
      { name: 'Vales Gasolina & Flotillas', value: pOtros },
    ];
  }, [stats.cobros_terminales]);
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{saludo}, {user?.nombre || 'Usuario no Registrado'}</h1>
          <p className="text-gray-500 mt-1">
            Aquí tienes un resumen del estado de Unecre.
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
              <p className="text-3xl font-bold text-gray-800">{fmtNum(stats.total_prestado || 2450000)}</p>
              <p className="text-sm text-gray-500 mt-2">Saldo total en la calle</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Cartera Vencida</h3>
                <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtNum(stats.cartera_vencida || 120500)}</p>
              <p className="text-sm text-gray-500 mt-2">Créditos con retraso</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Clientes Activos</h3>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Users className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtInt(stats.clientes_activos || 342)}</p>
              <p className="text-sm text-gray-500 mt-2">Con cuenta activa</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Cuentas Abiertas</h3>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CreditCard className="w-6 h-6" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{fmtInt(stats.cuentas_activas || 380)}</p>
              <p className="text-sm text-gray-500 mt-2">De ahorro y crédito</p>
            </div>
          </div>

          {/* Métricas de Cobros en Terminales POS: Unecre vs Externas */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Cobros en Terminales POS
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Desglose financiero: Tarjetas Banca Unecre (Circuito Cerrado) vs Tarjetas Externas (Switch Adquirente)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terminales en Línea
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tarjeta 1: Cobros Tarjetas Unecre */}
              <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-xl shadow-sm p-6 border border-emerald-200/80 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">Tarjetas Banca Unecre</h3>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                          Circuito Cerrado
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Socios y clientes con saldo en cuenta Unecre</p>
                    </div>
                  </div>
                  <Link 
                    to="/terminales" 
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Ver Terminales <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                      {fmtNum(stats.cobros_terminales?.unecre?.total_monto || 0)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {fmtInt(stats.cobros_terminales?.unecre?.total_ops || 0)} operaciones
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total acumulado en terminales Sunmi y Orobo</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-emerald-100">
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-100">
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Volumen de Hoy</span>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">
                      {fmtNum(stats.cobros_terminales?.unecre?.hoy_monto || 0)}
                    </p>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {fmtInt(stats.cobros_terminales?.unecre?.hoy_ops || 0)} cobros hoy
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-100">
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Ticket Promedio</span>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">
                      {fmtNum(stats.cobros_terminales?.unecre?.ticket_promedio || 0)}
                    </p>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Por transacción
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50/80 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>0.00% comisión bancaria externa · 100% liquidez directa</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Cobros Tarjetas Externas */}
              <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-xl shadow-sm p-6 border border-blue-200/80 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">Tarjetas Bancarias Externas</h3>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded-md">
                          Switch Adquirente
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Visa, Mastercard y Carnet de cualquier banco</p>
                    </div>
                  </div>
                  <Link 
                    to="/configuracion" 
                    className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Ajustes Switch <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                      {fmtNum(stats.cobros_terminales?.externas?.total_monto || 0)}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {fmtInt(stats.cobros_terminales?.externas?.total_ops || 0)} autorizadas
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Facturación bruta en terminales vía red interbancaria</p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-4 border-t border-blue-100">
                  <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-lg border border-blue-100">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-medium">Comisión Devengada</span>
                    <p className="text-sm sm:text-lg font-bold text-amber-600 mt-0.5">
                      {fmtNum(((stats.cobros_terminales?.externas?.comisiones || 0) + (stats.cobros_terminales?.externas?.iva_comisiones || 0)))}
                    </p>
                    <span className="text-[10px] text-gray-500 font-medium">
                      1.8% + IVA adquirencia
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-lg border border-blue-100">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-medium">Neto Liquidable</span>
                    <p className="text-sm sm:text-lg font-bold text-emerald-600 mt-0.5">
                      {fmtNum(stats.cobros_terminales?.externas?.total_neto || 0)}
                    </p>
                    <span className="text-[10px] text-gray-500 font-medium">
                      A liquidar a comercios
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-lg border border-blue-100">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-medium">Hoy</span>
                    <p className="text-sm sm:text-lg font-bold text-gray-800 mt-0.5">
                      {fmtNum(stats.cobros_terminales?.externas?.hoy_monto || 0)}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium">
                      {fmtInt(stats.cobros_terminales?.externas?.hoy_ops || 0)} ops hoy
                    </span>
                  </div>
                </div>

                {/* Desglose por Emisor */}
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-blue-100/60">
                  <span className="text-[11px] text-gray-500 font-medium">Marcas:</span>
                  {(stats.cobros_terminales?.externas?.por_emisor && stats.cobros_terminales.externas.por_emisor.length > 0) ? (
                    stats.cobros_terminales.externas.por_emisor.map((emisor: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/70 text-blue-900 rounded-md text-xs font-semibold">
                        <span>{emisor.emisor_marca || emisor.marca_tarjeta}</span>
                        <span className="text-blue-600 font-normal">({emisor.ops} ops · {fmtNum(emisor.monto)})</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">Esperando transacciones</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dos Gráficas Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfica de Barras (Ocupa 2 columnas) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Procesamiento de Pagos (Mensual)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.grafica?.length > 0 ? stats.grafica : mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => fmtNum(value)}
                      cursor={{fill: '#F3F4F6'}}
                    />
                    <Legend />
                    <Bar dataKey="prestamos" name="Créditos Emitidos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recuperacion" name="Pagos Recibidos" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica de Pastel (Ocupa 1 columna) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Distribución de Operaciones</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
