// src/pages/ToolDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getToolById, borrowTool, transferTool, getLoans, returnToolAPI } from '../services/api';
import TechnicianSelector from '../components/TechnicianSelector';

const ToolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el formulario de préstamo
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowData, setBorrowData] = useState({
    purpose: '',
    vehicle: '',
    expectedReturn: ''
  });
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [borrowSuccess, setBorrowSuccess] = useState('');

  // Estado para el formulario de transferencia
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({
    targetTechnician: '',
    purpose: '',
    vehicle: '',
    expectedReturn: '',
    notes: ''
  });

  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [activeLoan, setActiveLoan] = useState(null);

  // Obtener información del usuario
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  useEffect(() => {
    const fetchTool = async () => {
      try {
        setLoading(true);
        const response = await getToolById(id);
        setTool(response.data);
        
        if (response.data.status === 'borrowed') {
          // Obtener información del préstamo activo
          try {
            const loansResponse = await getLoans({ tool: id, status: 'active' });
            if (loansResponse.data && loansResponse.data.length > 0) {
              setActiveLoan(loansResponse.data[0]);
            }
          } catch (err) {
            console.error('Error al cargar información del préstamo activo', err);
          }
        }
        
        setError('');
      } catch (err) {
        setError('Error al cargar los detalles de la herramienta');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
    // Agregar estos logs
  console.log('Usuario actual:', JSON.stringify(user, null, 2));
  }, [id]);

  const handleBorrowChange = (e) => {
    const { name, value } = e.target;
    setBorrowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setBorrowLoading(true);
    setBorrowError('');
    setBorrowSuccess('');
    
    try {
      console.log('Enviando solicitud de préstamo con datos:', {
        ...borrowData,
        tool: id
      });
      
      // Agregamos la fecha actual más 3 días si no se especificó
      const formData = {
        ...borrowData,
        tool: id,
        expectedReturn: borrowData.expectedReturn || 
                      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      const response = await borrowTool(formData);
      console.log('Respuesta recibida:', response);
      
      setBorrowSuccess('Préstamo solicitado exitosamente');
      setShowBorrowForm(false);
      
      // Actualizar el estado de la herramienta
      setTool(prev => ({
        ...prev,
        status: 'borrowed'
      }));
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/my-tools');
      }, 2000);
    } catch (err) {
      console.error('Error completo:', err);
      const errorMsg = err.message || 'Error al solicitar la herramienta';
      console.error('Mensaje de error:', errorMsg);
      
      if (err.error) {
        console.error('Detalles adicionales:', err.error);
      }
      
      setBorrowError(errorMsg);
    } finally {
      setBorrowLoading(false);
    }
  };
  
  // Funciones para el manejo de transferencias
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar la selección del técnico
  const handleTechnicianSelect = (technicianId) => {
    setTransferData(prev => ({
      ...prev,
      targetTechnician: technicianId
    }));
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');
    
    try {
      if (!transferData.targetTechnician) {
        throw new Error('Debes seleccionar un técnico destino');
      }
      
      // Datos para la transferencia
      const formData = {
        ...transferData,
        expectedReturn: transferData.expectedReturn || 
                      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      // Si el técnico actual solicita la transferencia para sí mismo
      if (user._id === transferData.targetTechnician) {
        // El técnico destino es el usuario actual
        console.log("Solicitando transferencia para ti mismo");
      } else {
        // El técnico destino es otro usuario
        console.log("Solicitando transferencia para otro técnico");
      }
  
      // Realizar la transferencia
      await transferTool(activeLoan._id, formData);
      setTransferSuccess('Solicitud de transferencia enviada exitosamente');
      setShowTransferForm(false);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/catalog');
      }, 2000);
    } catch (err) {
      console.error('Error al transferir:', err);
      setTransferError(err.message || 'Error al solicitar la transferencia de la herramienta');
    } finally {
      setTransferLoading(false);
    }
  };

  // Función para manejar la devolución de herramienta directamente
  const handleReturnTool = () => {
    // Mostrar confirmación antes de proceder
    if (window.confirm('¿Estás seguro de que deseas devolver esta herramienta?')) {
      setLoading(true);
      
      // Llamar a la API para devolver la herramienta
      returnToolAPI(activeLoan._id)
        .then(() => {
          // Éxito
          setLoading(false);
          alert('Herramienta devuelta exitosamente');
          // Redirigir a My Tools o refrescar el estado
          navigate('/my-tools');
        })
        .catch(err => {
          setLoading(false);
          alert('Error al devolver la herramienta: ' + err.message);
        });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando detalles de la herramienta...</p>
        </div>
      </Layout>
    );
  }

  if (error || !tool) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'No se pudo encontrar la herramienta'}</p>
          <button 
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => navigate('/catalog')}
          >
            Volver al Catálogo
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="mb-4 flex items-center">
          <button 
            onClick={() => navigate('/catalog')}
            className="mr-4 text-blue-500 hover:text-blue-700"
          >
            ← Volver al Catálogo
          </button>
          <h1 className="text-2xl font-bold">{tool.name}</h1>
        </div>
        
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 p-4 bg-gray-50">
              <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center mb-4">
                {tool.imageUrl && tool.imageUrl !== 'no-photo.jpg' ? (
                  <img 
                    src={tool.imageUrl} 
                    alt={tool.name} 
                    className="max-w-full max-h-full" 
                  />
                ) : (
                  <div className="text-gray-400">No hay imagen disponible</div>
                )}
              </div>
              
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  tool.status === 'available' ? 'bg-green-100 text-green-800' : 
                  tool.status === 'borrowed' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tool.status === 'available' ? 'Disponible' : 
                   tool.status === 'borrowed' ? 'Prestada' : 
                   'Mantenimiento'}
                </span>
                
                {tool.status === 'borrowed' && activeLoan && (
                  <div className="text-sm mt-1">
                    <p>En uso por: <strong>{activeLoan.technician.name}</strong></p>
                  </div>
                )}
              </div>
              
              {tool.status === 'available' && (
                <button 
                  onClick={() => setShowBorrowForm(true)}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Solicitar Préstamo
                </button>
              )}
              {/* Botón condicional para transferir o devolver */}
              {tool.status === 'borrowed' && activeLoan && (
                user._id === activeLoan.technician._id ? (
                  <button 
                    onClick={() => handleReturnTool()} // Esta función debe implementarse para manejar la devolución
                    className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Devolver Herramienta
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowTransferForm(true)}
                    className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Solicitar Transferencia
                  </button>
                )
              )}
            </div>
            
            <div className="md:w-2/3 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Detalles</h2>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">Categoría:</td>
                      <td className="py-2">
                        {tool.category === 'diagnostico' ? 'Diagnóstico' : 
                         tool.category === 'electricidad' ? 'Electricidad' : 
                         tool.category === 'mecanica' ? 'Mecánica' : 
                         tool.category === 'aire_acondicionado' ? 'Aire Acondicionado' : 
                         tool.category === 'neumaticos' ? 'Neumáticos' : 'Otros'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Número de Serie:</td>
                      <td className="py-2">{tool.serialNumber}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Ubicación:</td>
                      <td className="py-2">{tool.location}</td>
                    </tr>
                    {tool.lastMaintenance && (
                      <tr className="border-b">
                        <td className="py-2 font-semibold">Último Mantenimiento:</td>
                        <td className="py-2">{new Date(tool.lastMaintenance).toLocaleDateString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {tool.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                  <p className="text-gray-700">{tool.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Formulario de Préstamo */}
        {showBorrowForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Solicitar Préstamo</h2>
              
              {borrowError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {borrowError}
                </div>
              )}
              
              {borrowSuccess && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {borrowSuccess}
                </div>
              )}
              
              <form onSubmit={handleBorrowSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purpose">
                    Propósito del Préstamo *
                  </label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    value={borrowData.purpose}
                    onChange={handleBorrowChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Describir para qué necesita la herramienta..."
                    rows="3"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vehicle">
                    Vehículo (Opcional)
                  </label>
                  <input
                    type="text"
                    id="vehicle"
                    name="vehicle"
                    value={borrowData.vehicle}
                    onChange={handleBorrowChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Marca, modelo y año del vehículo"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expectedReturn">
                    Fecha de Devolución Estimada (Opcional)
                  </label>
                  <input
                    type="date"
                    id="expectedReturn"
                    name="expectedReturn"
                    value={borrowData.expectedReturn}
                    onChange={handleBorrowChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se establecerá automáticamente a 3 días a partir de hoy.
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowBorrowForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={borrowLoading}
                  >
                    {borrowLoading ? 'Procesando...' : 'Confirmar Préstamo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Formulario de Transferencia */}
        {showTransferForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Transferir Herramienta</h2>
              
              {transferError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {transferError}
                </div>
              )}
              
              {transferSuccess && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {transferSuccess}
                </div>
              )}
              
              {/* Mensaje adaptado según si el usuario actual tiene la herramienta o no */}
              <p className="mb-4 text-gray-700">
                {user._id.toString() === activeLoan?.technician._id.toString() ? 
                  `Actualmente tienes esta herramienta. Puedes transferirla a otro técnico utilizando este formulario.` :
                  `Esta herramienta está actualmente prestada a ${activeLoan?.technician.name}. Puedes solicitar una transferencia utilizando este formulario.`
                }
              </p>
              
              <form onSubmit={handleTransferSubmit}>
                {/* Selector de técnico */}
                <TechnicianSelector 
                  onSelect={handleTechnicianSelect} 
                  currentTechnicianId={activeLoan?.technician._id} 
                />
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transferPurpose">
                    Propósito del Préstamo *
                  </label>
                  <textarea
                    id="transferPurpose"
                    name="purpose"
                    value={transferData.purpose}
                    onChange={handleTransferChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="¿Para qué necesita el técnico esta herramienta?"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transferVehicle">
                    Vehículo (Opcional)
                  </label>
                  <input
                    type="text"
                    id="transferVehicle"
                    name="vehicle"
                    value={transferData.vehicle}
                    onChange={handleTransferChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Marca, modelo y año del vehículo"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transferExpectedReturn">
                    Fecha de Devolución Estimada (Opcional)
                  </label>
                  <input
                    type="date"
                    id="transferExpectedReturn"
                    name="expectedReturn"
                    value={transferData.expectedReturn}
                    onChange={handleTransferChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se establecerá automáticamente a 3 días a partir de hoy.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transferNotes">
                    Notas (Opcional)
                  </label>
                  <textarea
                    id="transferNotes"
                    name="notes"
                    value={transferData.notes}
                    onChange={handleTransferChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Notas adicionales sobre la transferencia..."
                    rows="2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowTransferForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={transferLoading}
                  >
                    {transferLoading ? 'Procesando...' : 'Confirmar Transferencia'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ToolDetail;