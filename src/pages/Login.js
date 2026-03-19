// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { HiOutlineWrench, HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/dashboard');
      } else {
        setError('Credenciales incorrectas o cuenta no activada.');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg h-screen overflow-hidden relative flex flex-col items-center justify-center px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 login-gradient" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.22) 100%)' }}
      />

      {/* ── Centered content ── */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5 animate-fade-in">

        {/* Hero headline */}
        <div className="text-center animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
            AutoRx Center
          </h1>
          <p className="mt-1 text-sm text-white/80 max-w-[280px] mx-auto leading-snug">
            Tool Management System — Control inteligente de herramientas
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {[
            { icon: '🔧', text: 'Control de Inventario' },
            { icon: '📱', text: 'Escaneo QR' },
            { icon: '📊', text: 'Reportes en Tiempo Real' },
          ].map((pill) => (
            <span
              key={pill.text}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/90 select-none floating-pill"
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <span>{pill.icon}</span>
              <span>{pill.text}</span>
            </span>
          ))}
        </div>

        {/* ── Glass login card ── */}
        <div
          className="w-full rounded-2xl p-6 shadow-2xl animate-slide-up"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
            animationDelay: '0.1s',
          }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center shadow-sm">
                <HiOutlineWrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">AutoRx Center</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Tool Management</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-600" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm
                    focus:border-primary-400 focus:ring-4 focus:ring-primary-100
                    transition-all outline-none bg-white/70"
                  placeholder="usuario@ejemplo.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-600" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm
                    focus:border-primary-400 focus:ring-4 focus:ring-primary-100
                    transition-all outline-none bg-white/70"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <button
              className="w-full btn-primary py-2.5 text-sm font-bold shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed transition-all
                hover:scale-[1.02] active:scale-[0.97]"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <HiOutlineShieldCheck className="w-3.5 h-3.5" />
            Acceso seguro — Rivera's Investments LLC
          </p>
        </div>
      </div>

      {/* Inline styles for login-specific animations */}
      <style>{`
        .login-gradient {
          background: linear-gradient(135deg, #1E6FAE 0%, #104567 40%, #0B2F45 70%, #F7941D 100%);
          background-size: 300% 300%;
          animation: gradientShift 12s ease infinite;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .floating-pill {
          animation: floatPill 3.5s ease-in-out infinite;
        }
        .floating-pill:nth-child(2) { animation-delay: 0.8s; animation-duration: 4s; }
        .floating-pill:nth-child(3) { animation-delay: 1.5s; animation-duration: 3.2s; }
        @keyframes floatPill {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default Login;
