// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';
import QRScanner from './QRScanner';
import { getUnreadNotificationsCount } from '../services/api';

/**
 * Layout principal de la aplicación
 * Este componente envuelve todas las páginas y proporciona la estructura
 * común con sidebar, header y área de contenido principal
 */
const Layout = ({ children }) => {
  // ======== HOOKS Y ESTADO ========
  // Navegación y ubicación
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para controlar elementos de UI
  const [sidebarOpen, setSidebarOpen] = useState(true);         // Control de visibilidad del sidebar en móvil
  const [showScanner, setShowScanner] = useState(false);        // Control del modal de escáner QR
  const [unreadNotifications, setUnreadNotifications] = useState(0); // Contador de notificaciones
  
  // Información del usuario desde localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  // ======== FUNCIONES Y MANEJADORES DE EVENTOS ========
  /**
   * Cierra la sesión eliminando el token y redirigiendo a login
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // ======== EFECTOS ========
  /**
   * Obtiene el conteo de notificaciones no leídas al cargar
   * y configura una actualización periódica cada 5 minutos
   */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationsCount();
        setUnreadNotifications(response.count || 0);
      } catch (error) {
        console.error('Error al obtener conteo de notificaciones:', error);
      }
    };

    // Realizar la primera carga
    fetchUnreadCount();
    
    // Configurar intervalo para actualizaciones periódicas
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    
    // Limpiar intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  // ======== RENDERIZADO ========
  return (
    <div className="flex h-screen bg-gray-100">
      {/* ======== SIDEBAR (NAVEGACIÓN LATERAL) ======== */}
      <div className={`bg-gray-800 text-white w-64 ${sidebarOpen ? 'block' : 'hidden'} md:block flex-shrink-0`}>
        {/* Logo o título de la aplicación */}
        <div className="p-4 font-bold text-lg border-b border-gray-700">
          Sistema de Herramientas
        </div>
        
        {/* Navegación principal */}
        <nav className="mt-4">
          <ul>
            {/* Enlaces de navegación común */}
            <li>
              <Link 
                to="/dashboard" 
                className={`block py-2 px-4 ${location.pathname === '/dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/catalog" 
                className={`block py-2 px-4 ${location.pathname === '/catalog' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                Catálogo de Herramientas
              </Link>
            </li>
            <li>
              <Link 
                to="/my-tools" 
                className={`block py-2 px-4 ${location.pathname === '/my-tools' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                Mis Herramientas
              </Link>
            </li>
            
            {/* Enlaces solo para administradores */}
            {isAdmin && (
              <li>
                <Link 
                  to="/admin/tools" 
                  className={`block py-2 px-4 ${location.pathname === '/admin/tools' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                >
                  Administrar Herramientas
                </Link>
              </li>
            )}

            {isAdmin && (
              <li>
                <Link 
                  to="/admin/maintenance" 
                  className={`block py-2 px-4 ${location.pathname === '/admin/maintenance' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                >
                  Herramientas en Mantenimiento
                </Link>
              </li>
            )}
            
            {/* 
              PUNTO DE EXTENSIÓN:
              Aquí puedes agregar más enlaces de navegación.
              Para enlaces accesibles a todos, agrégalos directamente.
              Para enlaces restringidos, úsalos dentro de una condición como:
              {isAdmin && (<li>...</li>)}
            */}
          </ul>
        </nav>
      </div>

      {/* ======== CONTENIDO PRINCIPAL ======== */}
      <div className="flex flex-col flex-1">
        {/* ======== HEADER (BARRA SUPERIOR) ======== */}
        <header className="bg-white shadow-md px-4 py-2 flex justify-between items-center">
          {/* Lado izquierdo del header */}
          <div className="flex items-center">
            {/* Botón para mostrar/ocultar sidebar en móvil */}
            <button 
              className="md:hidden mr-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold">Taller Automotriz</h1>
          </div>
          
          {/* Lado derecho del header: acciones globales */}
          <div className="flex items-center">
            {/* Botón para escanear QR */}
            <button
              onClick={() => setShowScanner(true)}
              className="mr-4 text-blue-500 hover:text-blue-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="ml-1 hidden md:inline">Escanear QR</span>
            </button>
            
            {/* Panel de notificaciones */}
            <NotificationsPanel 
              unreadCount={unreadNotifications} 
              setUnreadCount={setUnreadNotifications} 
            />
            
            {/* Nombre de usuario */}
            <span className="mx-4">{user.name || 'Usuario'}</span>
            
            {/* Botón para cerrar sesión */}
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Cerrar sesión
            </button>
            
            {/* 
              PUNTO DE EXTENSIÓN:
              Para agregar más botones o acciones globales, 
              insértalos en este div, antes del botón de cierre de sesión.
              Ejemplo:
              <button className="mr-4 text-blue-500 hover:text-blue-700">Nueva Acción</button>
            */}
          </div>
        </header>

        {/* ======== CONTENIDO DE PÁGINA ======== */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
      
      {/* ======== MODALES Y OVERLAYS ======== */}
      {/* Modal de escáner QR */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <QRScanner onClose={() => setShowScanner(false)} />
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowScanner(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 
        PUNTO DE EXTENSIÓN:
        Aquí puedes agregar más modales o ventanas emergentes.
        Sigue el patrón del modal de QR Scanner:
        {showMiModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            ...contenido del modal...
          </div>
        )}
      */}
    </div>
  );
};

export default Layout;