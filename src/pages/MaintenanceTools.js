// src/pages/MaintenanceTools.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getTools, updateToolStatus } from '../services/api';

const MaintenanceTools = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Verificar si el usuario es administrador
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    // Función para cargar las herramientas en mantenimiento o dañadas
    const loadTools = async () => {
      try {
        setLoading(true);
        // Obtener herramientas filtradas por estado
        const response = await getTools({ status: ['maintenance', 'damaged'] });
        setTools(response.data || []);
        setError('');
      } catch (err) {
        setError('Error al cargar herramientas en mantenimiento');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  // Función para cambiar el estado de una herramienta
  const handleStatusChange = async (toolId, newStatus) => {
    try {
      setError('');
      setUpdateSuccess('');
      
      await updateToolStatus(toolId, { status: newStatus });
      
      // Actualizar la lista localmente
      setTools(prevTools => 
        prevTools.map(tool => 
          tool._id === toolId 
            ? { ...tool, status: newStatus } 
            : tool
        )
      );
      
      setUpdateSuccess(`Estado de la herramienta actualizado a: ${newStatus}`);
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        setUpdateSuccess('');
      }, 3000);
      
    } catch (err) {
      setError('Error al actualizar el estado de la herramienta');
      console.error(err);
    }
  };

  // Función para marcar como reparada (cambiar a disponible)
  const markAsRepaired = (toolId) => {
    handleStatusChange(toolId, 'available');
  };

  // Redireccionar si no es admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>No tienes permisos para acceder a esta página.</p>
          <button 
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Herramientas en Mantenimiento</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {updateSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {updateSuccess}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Cargando herramientas...</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-600 mb-4">No hay herramientas en mantenimiento actualmente.</p>
            <button 
              onClick={() => navigate('/catalog')} 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Ver Catálogo de Herramientas
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Herramienta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tools.map((tool) => (
                  <tr key={tool._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-sm text-gray-500">{tool.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tool.category === 'diagnostico' ? 'Diagnóstico' : 
                         tool.category === 'electricidad' ? 'Electricidad' : 
                         tool.category === 'mecanica' ? 'Mecánica' : 
                         tool.category === 'aire_acondicionado' ? 'Aire Acondicionado' : 
                         tool.category === 'neumaticos' ? 'Neumáticos' : 'Otros'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tool.status === 'damaged' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tool.status === 'damaged' ? 'Dañada' : 'Mantenimiento'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => markAsRepaired(tool._id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Marcar como Reparada
                      </button>
                      <button
                        onClick={() => navigate(`/tools/${tool._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MaintenanceTools;