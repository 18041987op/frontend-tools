// src/pages/BorrowedTools.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Para enlazar a los detalles
import Layout from '../components/Layout';
import { getLoans } from '../services/api'; // Usaremos getLoans para obtener info detallada

const BorrowedTools = () => {
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBorrowedTools = async () => {
      setLoading(true);
      setError('');
      try {
        // Llamamos a getLoans con el filtro de estado 'active'
        // Nota: getLoans devuelve préstamos, que incluyen info de la herramienta y el técnico
        const response = await getLoans({ status: 'active' });
        setActiveLoans(response.data || []);
      } catch (err) {
        console.error('Error fetching borrowed tools:', err);
        setError('No se pudieron cargar las herramientas prestadas.');
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowedTools();
  }, []);

  // Función para calcular días restantes
  const calculateDaysLeft = (expectedReturn) => {
    const today = new Date();
    // Asegurarse que la fecha de devolución no tenga la hora para comparar solo días
    const returnDate = new Date(expectedReturn);
    returnDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };


  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Herramientas Actualmente en Préstamo</h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : activeLoans.length === 0 ? (
          <p className="text-gray-600">No hay herramientas prestadas en este momento.</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herramienta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestada a</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Préstamo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devolución Esperada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Restantes / Retraso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeLoans.map((loan) => {
                    const daysLeft = calculateDaysLeft(loan.expectedReturn);
                    return (
                      <tr key={loan._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.tool?.name || 'Herramienta Eliminada'}
                           {loan.tool?.serialNumber && <span className="block text-xs text-gray-500">S/N: {loan.tool.serialNumber}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loan.technician?.name || 'Técnico Desconocido'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(loan.borrowedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(loan.expectedReturn).toLocaleDateString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          daysLeft < 0 ? 'text-red-600' : daysLeft <= 1 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {daysLeft < 0 ? `Retraso (${Math.abs(daysLeft)}d)` : `${daysLeft}d restantes`}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {/* Enlace para ver detalles de la herramienta si aún existe */}
                          {loan.tool?._id && (
                             <Link to={`/tools/${loan.tool._id}`} className="text-blue-600 hover:text-blue-900">
                                Ver Herramienta
                             </Link>
                          )}
                           {/* Aquí podrías añadir un botón para forzar devolución (admin) si lo necesitas */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BorrowedTools;