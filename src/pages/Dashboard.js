// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { getMyLoans } from '../services/api';
import {
  HiOutlineWrenchScrewdriver,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineWrench,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getMyLoans();
        setLoans(response.data?.filter(loan => loan.status === 'active') || []);
      } catch (error) {
        console.error('Error al cargar herramientas:', error);
        setError('No se pudieron cargar tus herramientas prestadas.');
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formatTimeRemaining = (expectedReturn) => {
    const now = new Date();
    const returnDate = new Date(expectedReturn);
    const diffTime = returnDate.getTime() - now.getTime();
    const totalMinutes = Math.floor(diffTime / (1000 * 60));
    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (totalMinutes < 0) {
      const overdueSeconds = Math.abs(Math.floor(diffTime / 1000));
      if (overdueSeconds < 3600 * 2)  return { text: `Retraso (${Math.floor(overdueSeconds / 60)}m)`,    status: 'overdue' };
      if (overdueSeconds < 86400 * 2) return { text: `Retraso (${Math.floor(overdueSeconds / 3600)}h)`,  status: 'overdue' };
      return                                 { text: `Retraso (${Math.floor(overdueSeconds / 86400)}d)`, status: 'overdue' };
    }
    if (totalMinutes < 60)  return { text: `Vence en ${totalMinutes}m`,     status: 'dueSoon'  };
    if (totalHours < 6)     return { text: `Vence en ${totalHours}h`,       status: 'dueSoon'  };
    if (totalHours < 24)    return { text: `Vence hoy (${totalHours}h)`,    status: 'dueToday' };
    if (totalDays === 1)    return { text: `Vence mañana`,                   status: 'safe'     };
    return                         { text: `Quedan ${totalDays}d`,           status: 'safe'     };
  };

  const statusConfig = {
    overdue:  { badge: 'bg-red-100 text-red-700 border border-red-200',      borderL: 'border-l-red-500',    icon: HiOutlineExclamationTriangle, iconColor: 'text-red-500'    },
    dueSoon:  { badge: 'bg-orange-100 text-orange-700 border border-orange-200', borderL: 'border-l-orange-500', icon: HiOutlineClock,               iconColor: 'text-orange-500' },
    dueToday: { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', borderL: 'border-l-yellow-500', icon: HiOutlineClock,               iconColor: 'text-yellow-500' },
    safe:     { badge: 'bg-green-100 text-green-700 border border-green-200', borderL: 'border-l-green-500',   icon: HiOutlineCheckCircle,         iconColor: 'text-green-500'  },
  };

  const popularTools = [
    { name: 'Scanner OBD2',    searchTerm: 'Scanner OBD2',         icon: HiOutlineCpuChip,           color: 'bg-blue-50 text-blue-600'   },
    { name: 'Multímetro',      searchTerm: 'Multímetro Digital',   icon: HiOutlineBolt,              color: 'bg-yellow-50 text-yellow-600' },
    { name: 'Cargador A/C',    searchTerm: 'Juego Manómetros A/C', icon: HiOutlineWrench,            color: 'bg-green-50 text-green-600' },
    { name: 'Herramientas',    searchTerm: '',                     icon: HiOutlineWrenchScrewdriver, color: 'bg-purple-50 text-purple-600' },
  ];

  const overdueCount = !loading
    ? loans.filter(l => formatTimeRemaining(l.expectedReturn).status === 'overdue').length
    : 0;

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">

        {/* ── Hero greeting banner ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Hola, {user.name || 'Técnico'} 👋</h1>
          <p className="text-slate-400 text-sm capitalize">{formattedDate}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="bg-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
              <HiOutlineWrenchScrewdriver className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">
                {loading ? '...' : loans.length} herramienta{loans.length !== 1 ? 's' : ''} activa{loans.length !== 1 ? 's' : ''}
              </span>
            </div>
            {overdueCount > 0 && (
              <div className="bg-red-900 bg-opacity-60 rounded-xl px-4 py-2 flex items-center gap-2">
                <HiOutlineExclamationTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-300">
                  {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Mis Herramientas Actuales ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <HiOutlineWrenchScrewdriver className="w-5 h-5 text-blue-600" />
                  Mis Herramientas Actuales
                </h2>
                {!loading && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {loans.length} activa{loans.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : loans.length === 0 ? (
                  <div className="text-center py-10">
                    <HiOutlineCheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No tienes herramientas prestadas.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {loans.map((loan) => {
                      const timeInfo = formatTimeRemaining(loan.expectedReturn);
                      const config = statusConfig[timeInfo.status] || statusConfig.safe;
                      const StatusIcon = config.icon;
                      return (
                        <Link
                          key={loan._id}
                          to={`/tools/${loan.tool?._id}`}
                          className={`block border-l-4 ${config.borderL} bg-slate-50 hover:bg-slate-100 rounded-r-xl p-4 transition-colors`}
                          aria-label={`Ver detalles de ${loan.tool?.name || 'herramienta'}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {loan.tool?.name || 'Herramienta no encontrada'}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {loan.tool?.location || 'Sin ubicación'}
                                {loan.tool?.serialNumber && ` · S/N: ${loan.tool.serialNumber}`}
                              </p>
                            </div>
                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${config.badge}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {timeInfo.text}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Alertas ── */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />
                  Alertas
                </h2>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : loans.filter(l => formatTimeRemaining(l.expectedReturn).status === 'overdue').length > 0 ? (
                  <ul className="space-y-2">
                    {loans
                      .filter(l => formatTimeRemaining(l.expectedReturn).status === 'overdue')
                      .map((late) => (
                        <li key={`alert-${late._id}`} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                          <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-red-700">
                            <span className="font-semibold">{late.tool?.name || 'Herramienta'}</span> está vencida.
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <HiOutlineCheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Sin alertas activas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Acceso Rápido ── */}
        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <HiOutlineSquares2X2 className="w-5 h-5 text-blue-600" />
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {popularTools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={idx}
                  to={tool.searchTerm ? `/catalog?search=${encodeURIComponent(tool.searchTerm)}` : '/catalog'}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all text-center group"
                  aria-label={`Buscar ${tool.name}`}
                >
                  <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">{tool.name}</p>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
