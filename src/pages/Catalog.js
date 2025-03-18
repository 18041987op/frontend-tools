// src/pages/Catalog.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getTools, getLoans } from '../services/api';
import QRCode from 'react-qr-code';

const Catalog = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrToolId, setQrToolId] = useState('');
  const [qrToolName, setQrToolName] = useState('');

  // Obtener información del usuario actual
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Tools loaded:', tools); // ESTA LINEA ES TEMPORARIA PARA VERIFICAR QUE LAS HERRAMIENTAS SE CARGUEN CORRECTAMENTE

  useEffect(() => {
    // Función para cargar las herramientas
    const loadTools = async () => {
      try {
        setLoading(true);
        const response = await getTools();
        const tools = response.data || [];
        
        // Para cada herramienta prestada, obtener información del técnico
        for (const tool of tools) {
          if (tool.status === 'borrowed') {
            try {
              const loansResponse = await getLoans({ tool: tool._id, status: 'active' });
              if (loansResponse.data && loansResponse.data.length > 0) {
                tool.currentLoan = loansResponse.data[0];
              }
            } catch (err) {
              console.error(`Error al obtener préstamo para herramienta ${tool._id}`, err);
            }
          }
        }
        
        setTools(tools);
        setError('');
      } catch (err) {
        setError('Error al cargar herramientas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  // Función para filtrar herramientas por búsqueda (mejorada)
  const filteredTools = tools.filter(tool => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.category.toLowerCase().includes(searchLower) ||
      (tool.location && tool.location.toLowerCase().includes(searchLower)) ||
      (tool.serialNumber && tool.serialNumber.toLowerCase().includes(searchLower))
    );
  });

  // Función para generar QR
  const handleGenerateQR = (toolId, toolName) => {
    setQrToolId(toolId);
    setQrToolName(toolName);
    setShowQR(true);
  };

  // Función para descargar QR
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code');
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${qrToolName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Función auxiliar para determinar si mostrar el botón de transferir
  const shouldShowTransferOption = (tool) => {
    return tool.status === 'borrowed' && tool.currentLoan;
  };

  return (
    <Layout>
      <div>
        {/* Barra de búsqueda mejorada */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold mb-4 md:mb-0">Catálogo de Herramientas</h1>
            
            <div className="w-full md:w-auto md:flex-1 md:max-w-md mx-0 md:mx-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, categoría, ubicación..." 
                  className="w-full border rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearchTerm('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtrar
              </button>
            </div>
          </div>
          
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredTools.length === 0 ? (
                <p>No se encontraron herramientas que coincidan con "{searchTerm}"</p>
              ) : (
                <p>Se encontraron {filteredTools.length} herramientas para "{searchTerm}"</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Cargando herramientas...</p>
          </div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            {filteredTools.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No se encontraron herramientas</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="py-2 px-4 text-left">Nombre</th>
                    <th className="py-2 px-4 text-left">Categoría</th>
                    <th className="py-2 px-4 text-left">Estado</th>
                    <th className="py-2 px-4 text-left">Ubicación</th>
                    <th className="py-2 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map(tool => (
                    <tr key={tool._id} className="border-b">
                      <td className="py-2 px-4">{tool.name}</td>
                      <td className="py-2 px-4">
                        {tool.category === 'diagnostico' ? 'Diagnóstico' : 
                         tool.category === 'electricidad' ? 'Electricidad' : 
                         tool.category === 'mecanica' ? 'Mecánica' : 
                         tool.category === 'aire_acondicionado' ? 'Aire Acondicionado' : 
                         tool.category === 'neumaticos' ? 'Neumáticos' : 'Otros'}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          tool.status === 'available' ? 'bg-green-100 text-green-800' : 
                          tool.status === 'borrowed' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tool.status === 'available' ? 'Disponible' : 
                           tool.status === 'borrowed' ? 'Prestada' : 
                           'Mantenimiento'}
                        </span>
                        {tool.status === 'borrowed' && tool.currentLoan && (
                          <div className="text-xs text-gray-600 mt-1">
                            En uso por: {tool.currentLoan.technician.name}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">{tool.location}</td>
                      <td className="py-2 px-4">
                        <Link to={`/tools/${tool._id}`} className="text-blue-500 hover:text-blue-700 mr-2">
                          Ver
                        </Link>
                        {tool.status === 'available' && (
                          <Link to={`/tools/${tool._id}`} className="text-green-500 hover:text-green-700 mr-2">
                            Solicitar
                          </Link>
                        )}
                        {shouldShowTransferOption(tool) && (
                          <Link to={`/tools/${tool._id}`} className="text-purple-500 hover:text-purple-700 mr-2">
                            {user._id === tool.currentLoan?.technician._id ? 'Devolver' : 'Solicitar Transferencia'}
                          </Link>
                        )}
                        <button
                          onClick={() => handleGenerateQR(tool._id, tool.name)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal de código QR */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Código QR para {qrToolName}</h2>
              
              <div className="flex justify-center mb-4">
                <QRCode 
                  id="qr-code"
                  value={`${window.location.origin}/tools/${qrToolId}`}
                  size={200}
                  level="H"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                Este código QR enlaza directamente a los detalles de la herramienta.
              </p>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowQR(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Descargar QR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Catalog;