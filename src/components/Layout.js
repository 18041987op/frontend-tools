// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';
import QRScanner from './QRScanner';
import { getUnreadNotificationsCount } from '../services/api';
import {
  HiOutlineHome,
  HiOutlineWrench,
  HiOutlineArrowPath,
  HiOutlineWrenchScrewdriver,
  HiOutlineBriefcase,
  HiOutlineCog6Tooth,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineQrCode,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark,
} from 'react-icons/hi2';

const navItems = [
  { to: '/dashboard',            label: 'Dashboard',            icon: HiOutlineHome,              adminOnly: false },
  { to: '/catalog',              label: 'Catálogo',             icon: HiOutlineWrench,             adminOnly: false },
  { to: '/my-tools',             label: 'Mis Herramientas',     icon: HiOutlineBriefcase,          adminOnly: false },
  { to: '/admin/borrowed-tools', label: 'Prestadas',            icon: HiOutlineArrowPath,          adminOnly: true  },
  { to: '/admin/maintenance',    label: 'Mantenimiento',        icon: HiOutlineWrenchScrewdriver,  adminOnly: true  },
  { to: '/admin/tools',          label: 'Admin Herramientas',   icon: HiOutlineCog6Tooth,          adminOnly: true  },
  { to: '/admin/users',          label: 'Gestión de Usuarios',  icon: HiOutlineUsers,              adminOnly: true  },
  { to: '/admin/reports',        label: 'Reportes',             icon: HiOutlineChartBar,           adminOnly: true  },
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationsCount();
        setUnreadNotifications(response.count || 0);
      } catch (error) {
        console.error('Error al obtener conteo de notificaciones:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======== SIDEBAR ======== */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-30
          bg-slate-900 text-white w-64 flex flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <HiOutlineWrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">AutoRx Tools</p>
              <p className="text-xs text-slate-400">Control de Inventario</p>
            </div>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Navegación
          </p>
          <ul className="space-y-0.5">
            {visibleNavItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors group">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{getInitials(user.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name || 'Usuario'}</p>
              <p className="text-xs text-slate-400 truncate">{isAdmin ? 'Administrador' : 'Técnico'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1"
            >
              <HiArrowRightOnRectangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======== MAIN CONTENT AREA ======== */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        {/* ======== HEADER ======== */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <HiBars3 className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">Taller Automotriz</h1>
              <p className="text-xs text-slate-400 hidden md:block">Rivera's Investments LLC</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              title="Escanear QR"
            >
              <HiOutlineQrCode className="w-5 h-5" />
              <span className="hidden md:inline">Escanear QR</span>
            </button>
            <NotificationsPanel unreadCount={unreadNotifications} setUnreadCount={setUnreadNotifications} />
          </div>
        </header>

        {/* ======== PAGE CONTENT ======== */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {children}
        </main>

        {/* ======== FOOTER ======== */}
        <footer className="bg-white px-4 py-2.5 border-t border-slate-200 text-center text-xs text-slate-400 flex-shrink-0">
          &copy; {new Date().getFullYear()} Rivera's Investments LLC. Todos los derechos reservados.
        </footer>
      </div>

      {/* ======== QR SCANNER MODAL ======== */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Escanear Código QR</h3>
            <QRScanner onClose={() => setShowScanner(false)} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowScanner(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
