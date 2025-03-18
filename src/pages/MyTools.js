// src/pages/MyTools.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getMyLoans, returnTool } from '../services/api';

const MyTools = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el modal de devolución
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnData, setReturnData] = useState({
    returnCondition: {
      status: 'good',
      hasDamage: false,
      damageDescription: ''
    }
  });
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  useEffect(() => {
    // Función para cargar los préstamos activos del usuario
    const loadLoans = async () => {
      try {
        setLoading(true);
        const response = await getMyLoans();
        setLoans(response.data || []);
        setError('');
      } catch (err) {
        setError('Error al cargar herramientas prestadas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, []);

  // Calcular días restantes hasta la devolución
  const calculateDaysLeft = (expectedReturn) => {
    const today = new Date();
    const returnDate = new Date(expectedReturn);
    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  // Añadir esta función en el componente MyTools.js, después de calculateDaysLeft

  // Función para mostrar historial de transferencias
  const showTransferHistory = (loan) => {
    if (!loan.transferHistory || loan.transferHistory.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 text-xs text-gray-500">
        <p className="font-semibold">Historial de transferencias:</p>
        <ul className="list-disc pl-4 space-y-1">
          {loan.transferHistory.map((transfer, index) => (
            <li key={index}>
              {new Date(transfer.transferredAt).toLocaleDateString()}: De{' '}
              {transfer.fromTechnician?.name || 'Usuario desconocido'} a{' '}
              {transfer.toTechnician?.name || 'Usuario desconocido'}
              {transfer.notes && ` - "${transfer.notes}"`}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  const handleReturnClick = (loan) => {
    setSelectedLoan(loan);
    setReturnData({
      returnCondition: {
        status: 'good',
        hasDamage: false,
        damageDescription: ''
      }
    });
    setReturnError('');
    setReturnSuccess('');
    setShowReturnModal(true);
  };

  const handleReturnChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'hasDamage') {
      setReturnData(prev => ({
        ...prev,
        returnCondition: {
          ...prev.returnCondition,
          hasDamage: checked,
          status: checked ? 'damaged' : 'good'
        }
      }));
    } else if (name === 'damageDescription') {
      setReturnData(prev => ({
        ...prev,
        returnCondition: {
          ...prev.returnCondition,
          damageDescription: value
        }
      }));
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLoan) return;
    
    try {
      setReturnLoading(true);
      setReturnError('');
      
      await returnTool(selectedLoan._id, returnData);
      
      // Actualizar la lista de préstamos (eliminar el devuelto)
      setLoans(prev => prev.filter(loan => loan._id !== selectedLoan._id));
      
      setReturnSuccess('Herramienta devuelta exitosamente');
      
      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        setShowReturnModal(false);
        setSelectedLoan(null);
      }, 2000);
    } catch (err) {
      setReturnError(err.message || 'Error al devolver la herramienta');
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Mis Herramientas</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Cargando herramientas prestadas...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-600 mb-4">No tienes herramientas prestadas actualmente.</p>
            <button 
              onClick={() => navigate('/catalog')} 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Ver Catálogo de Herramientas
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map(loan => {
              const daysLeft = calculateDaysLeft(loan.expectedReturn);
              return (
                <div key={loan._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{loan.tool.name}</h2>
                    <p className="text-sm text-gray-600">
                      Prestada el: {new Date(loan.borrowedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Devolución esperada: {new Date(loan.expectedReturn).toLocaleDateString()}
                    </p>
                    {/* // Luego, en la sección donde se renderizan los préstamos, justo después de la sección del propósito: */}
                    {loan.purpose && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">Propósito:</span> {loan.purpose}
                      </p>
                    )}
                    {showTransferHistory(loan)}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 1 ? 'text-orange-500' : 'text-green-500'}`}>
                      {daysLeft < 0 
                        ? `Retraso de ${Math.abs(daysLeft)} día(s)` 
                        : `${daysLeft} día(s) restantes`}
                    </p>
                    <button 
                      onClick={() => handleReturnClick(loan)}
                      className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
                    >
                      Devolver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Modal de Devolución */}
        {showReturnModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Devolver Herramienta</h2>
              <p className="mb-4">
                Está devolviendo: <span className="font-semibold">{selectedLoan.tool.name}</span>
              </p>
              
              {returnError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {returnError}
                </div>
              )}
              
              {returnSuccess && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {returnSuccess}
                </div>
              )}
              
              <form onSubmit={handleReturnSubmit}>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasDamage"
                      checked={returnData.returnCondition.hasDamage}
                      onChange={handleReturnChange}
                      className="mr-2"
                    />
                    <span>La herramienta presenta algún daño o problema</span>
                  </label>
                </div>
                
                {returnData.returnCondition.hasDamage && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="damageDescription">
                      Descripción del daño o problema
                    </label>
                    <textarea
                      id="damageDescription"
                      name="damageDescription"
                      value={returnData.returnCondition.damageDescription}
                      onChange={handleReturnChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Describe el daño o problema con la herramienta..."
                      rows="3"
                      required={returnData.returnCondition.hasDamage}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={returnLoading}
                  >
                    {returnLoading ? 'Procesando...' : 'Confirmar Devolución'}
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

export default MyTools;