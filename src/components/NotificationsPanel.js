// src/components/NotificationsPanel.js

import React, { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';

const NotificationsPanel = ({ unreadCount, setUnreadCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    // Cierra el panel cuando se hace clic fuera de él
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && !event.target.closest('.notification-bell')) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getNotifications();
      setNotifications(response.data || []);
    } catch (err) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowPanel(!showPanel);
    if (!showPanel) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification._id);
        
        // Actualizar la lista local
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        
        // Actualizar contador de no leídas
        if (unreadCount > 0) {
          setUnreadCount(unreadCount - 1);
        }
      }
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Actualizar todas las notificaciones como leídas
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Poner el contador en 0
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    }
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Hoy
      return `Hoy, ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else if (diffDays === 1) {
      // Ayer
      return `Ayer, ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else if (diffDays < 7) {
      // Esta semana
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `${days[date.getDay()]}, ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else {
      // Más de una semana
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      {/* Campana de notificaciones */}
      <button 
        className="notification-bell relative text-white focus:outline-none"
        onClick={handleBellClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Indicador de notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Panel de notificaciones */}
      {showPanel && (
        <div 
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20"
        >
          <div className="py-2 px-3 bg-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-4 text-center text-gray-500">Cargando...</div>
            ) : error ? (
              <div className="py-4 text-center text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="py-4 text-center text-gray-500">No tienes notificaciones</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification._id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                      <p className={`mt-1 text-sm ${!notification.read ? 'text-blue-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${!notification.read ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;