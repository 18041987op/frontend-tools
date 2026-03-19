// src/components/Layout.js
import React, { useState, useEffect, useRef } from 'react';
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
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';

// ─── App brand constants ─────────────────────────────────────────────────────
const APP_NAME = 'AutoRx Center';
const APP_TAGLINE = 'Tool Management System';

// ─── Cross-app URLs ──────────────────────────────────────────────────────────
const TRAINING_URL = 'https://training.autorxcenter.com/login';
const MANAGEMENT_URL = 'https://management.autorxcenter.com/';

// ─── Navigation items ────────────────────────────────────────────────────────
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

// ─── Helper ──────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// ─── Layout ──────────────────────────────────────────────────────────────────
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

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 flex flex-col flex-shrink-0
          bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:h-full overflow-y-auto
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <HiOutlineWrench className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-slate-900 tracking-tight">{APP_NAME}</p>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">{APP_TAGLINE}</p>
            </div>
          </Link>
          <button
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 pt-4 pb-2">
          <div className="card p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{user.name || 'Usuario'}</p>
                <p className="truncate text-xs text-slate-500">{user.email || ''}</p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                {isAdmin ? 'Admin' : 'Técnico'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-3">
          {/* General items */}
          <div className="flex flex-col gap-0.5">
            {navItems.filter(i => !i.adminOnly).map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={isActive ? 'nav-item-active' : 'nav-item-idle'}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="mt-4">
              <p className="px-3 mb-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Administración
              </p>
              <div className="flex flex-col gap-0.5">
                {navItems.filter(i => i.adminOnly).map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={isActive ? 'nav-item-active' : 'nav-item-idle'}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* ── Cross-App Navigation ── */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="px-3 mb-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Otras Apps
          </p>
          <div className="flex flex-col gap-1.5">
            {/* Training — visible to all users */}
            <a
              href={TRAINING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="app-switch-btn border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
            >
              <span className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              </span>
              <span className="flex-1 text-left">Training</span>
              <HiArrowTopRightOnSquare className="w-3 h-3 opacity-50" />
            </a>

            {/* Management — admin only */}
            {isAdmin && (
              <a
                href={MANAGEMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-switch-btn border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100"
              >
                <span className="w-6 h-6 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </span>
                <span className="flex-1 text-left">Management</span>
                <HiArrowTopRightOnSquare className="w-3 h-3 opacity-50" />
              </a>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="px-4 py-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <HiArrowRightOnRectangle className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT AREA ══════════ */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            {/* Left: hamburger + brand (mobile) */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <HiBars3 className="w-5 h-5" />
              </button>

              {/* Mobile brand */}
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
                  <HiOutlineWrench className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-extrabold text-slate-900">{APP_NAME}</span>
              </div>

              {/* Desktop: page title area */}
              <div className="hidden md:block">
                <h1 className="text-sm font-semibold text-slate-800">{APP_NAME} — {APP_TAGLINE}</h1>
              </div>
            </div>

            {/* Right: QR + Notifications */}
            <div className="flex items-center gap-1.5">
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
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
                  <HiOutlineWrench className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">{APP_NAME}</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">{APP_TAGLINE}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <a href="mailto:autorxcenter@gmail.com" className="hover:text-primary-500 transition-colors">
                  Support
                </a>
                <span className="text-slate-300">·</span>
                <span>&copy; {new Date().getFullYear()} Rivera's Investments LLC</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ══════════ QR SCANNER MODAL ══════════ */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
