import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Ingresa usuario y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500 rounded-2xl shadow-2xl mb-4">
            <Building2 size={36} className="text-primary-900" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Banco Unecre</h1>
          <p className="text-primary-300 mt-1 text-sm">Sistema de Gestión Bancaria</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-9"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="label-field">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-9 pr-10"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(o => !o)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-800 hover:bg-primary-900 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" />Ingresando...</> : 'Ingresar al Sistema'}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-6">
            © 2026 Banco Unecre — Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
