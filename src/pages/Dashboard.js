// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getTools } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    borrowed: 0,
    available: 0,
    maintenance: 0,
    damaged: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Verificar si el usuario es administrador
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    // Función para cargar estadísticas
    const loadStats = async () => {
      try {
        setLoading(true);
        // Obtener todas las herramientas
        const response = await getTools();
        const tools = response.data || [];
        
        // Calcular estadísticas
        const newStats = {
          total: tools.length,
          borrowed: tools.filter(tool => tool.status === 'borrowed').length,
          available: tools.filter(tool => tool.status === 'available').length,
          maintenance: tools.filter(tool => tool.status === 'maintenance').length,
          damaged: tools.filter(tool => tool.status === 'damaged').length
        };
        
        setStats(newStats);
        setError('');
      } catch (err) {
        setError('Error al cargar estadísticas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta de estadísticas - Herramientas Totales */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-gray-700">Herramientas Totales</h2>
              <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
            </div>
            
            {/* Tarjeta de estadísticas - Herramientas Prestadas */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-gray-700">Prestadas</h2>
              <p className="text-3xl font-bold text-orange-500">{stats.borrowed}</p>
            </div>
      
            {/* Tarjeta de estadísticas - Herramientas Disponibles */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-gray-700">Disponibles</h2>
              <p className="text-3xl font-bold text-green-500">{stats.available}</p>
            </div>
            
            {/* Tarjeta de estadísticas - Herramientas en Mantenimiento */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-gray-700">En Mantenimiento</h2>
              <p className="text-3xl font-bold text-yellow-500">{stats.maintenance}</p>
              {isAdmin && stats.maintenance > 0 && (
                <Link to="/admin/maintenance" className="text-sm text-blue-500 hover:underline">
                  Ver herramientas en mantenimiento
                </Link>
              )}
            </div>
            
            {/* Tarjeta de estadísticas - Herramientas Dañadas */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-gray-700">Dañadas</h2>
              <p className="text-3xl font-bold text-red-500">{stats.damaged}</p>
              {isAdmin && stats.damaged > 0 && (
                <Link to="/admin/maintenance" className="text-sm text-blue-500 hover:underline">
                  Ver herramientas dañadas
                </Link>
              )}
            </div>
          </div>
        )}
        {/* Actividad Reciente */}
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">Hace 2 horas</p>
              <p>Juan Pérez solicitó Scanner OBD2</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">Hace 3 horas</p>
              <p>María López devolvió Multímetro</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">Ayer</p>
              <p>Carlos Gómez reportó daño en Tester de Batería</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;