// frontend/src/pages/MyTools.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getMyLoans, returnToolAPI } from '../services/api';

const MyTools = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnData, setReturnData] = useState({
    returnCondition: { status: 'good', hasDamage: false, damageDescription: '' }
  });
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  // --- Fetch active loans for the current user ---
  const loadLoans = useCallback(async () => { // Wrap in useCallback
    setLoading(true);
    setError('');
    try {
      const response = await getMyLoans();
      // Filter on frontend just in case API didn't filter by 'active' status
      setLoans(response.data?.filter(loan => loan.status === 'active') || []);
    } catch (err) {
      console.error('Detailed error loading loans:', err);
      setError('Error loading borrowed tools.'); // English error
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array for useCallback

  useEffect(() => {
    loadLoans();
  }, [loadLoans]); // useEffect depends on the memoized loadLoans

  // --- Time Formatting Logic (Copied from Dashboard.js) ---
  const formatTimeRemaining = useCallback((expectedReturn) => {
    if (!expectedReturn) return { text: 'N/A', status: 'unknown' };
    const now = new Date();
    const returnDate = new Date(expectedReturn);
    const diffTime = returnDate.getTime() - now.getTime();

    const totalMinutes = Math.floor(diffTime / (1000 * 60));
    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (totalMinutes < 0) {
      const overdueSeconds = Math.abs(Math.floor(diffTime / 1000));
      if (overdueSeconds < 3600 * 2) return { text: `Overdue (${Math.floor(overdueSeconds / 60)}m)`, status: 'overdue' };
      if (overdueSeconds < 86400 * 2) return { text: `Overdue (${Math.floor(overdueSeconds / 3600)}h)`, status: 'overdue' };
      return { text: `Overdue (${Math.floor(overdueSeconds / 86400)}d)`, status: 'overdue' };
    }
    if (totalMinutes < 60) return { text: `Due in ${totalMinutes}m`, status: 'dueSoon' };
    if (totalHours < 6) return { text: `Due in ${totalHours}h`, status: 'dueSoon' };
    if (totalHours < 24) return { text: `Due today (${totalHours}h)`, status: 'dueToday' };
    if (totalDays === 1) return { text: `Due tomorrow`, status: 'safe' };
    return { text: `${totalDays}d remaining`, status: 'safe' };
  }, []);

  const getStatusColorClass = useCallback((status) => {
      switch (status) {
          case 'overdue': return 'text-red-600';
          case 'dueSoon': return 'text-orange-500';
          case 'dueToday': return 'text-yellow-600';
          case 'safe': return 'text-green-600';
          default: return 'text-slate-500';
      }
  }, []);

  const formatDate = useCallback((dateString) => { // Memoize formatDate too
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) { return 'Invalid Date'; }
  }, []);
  // --- End Time Formatting ---

  // --- Return Modal Handlers ---
  const handleReturnClick = (loan) => {
    setSelectedLoan(loan);
    setReturnData({
      returnCondition: { status: 'good', hasDamage: false, damageDescription: '' }
    });
    setReturnError('');
    setReturnSuccess('');
    setShowReturnModal(true);
  };

  const handleReturnChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReturnData(prev => ({
      ...prev,
      returnCondition: {
        ...prev.returnCondition,
        hasDamage: name === 'hasDamage' ? checked : prev.returnCondition.hasDamage,
        status: (name === 'hasDamage' && checked) ? 'damaged' : 'good', // Set status based on damage flag
        damageDescription: name === 'damageDescription' ? value : prev.returnCondition.damageDescription
      }
    }));
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setReturnLoading(true);
    setReturnError('');
    setReturnSuccess('');
    try {
      await returnToolAPI(selectedLoan._id, returnData);
      setReturnSuccess('Tool returned successfully.'); // English message
      // Refresh the list after successful return
      loadLoans(); // Call the memoized function
      // Close modal after a delay
      setTimeout(() => {
        setShowReturnModal(false);
        setSelectedLoan(null);
        setReturnSuccess(''); // Clear success message
      }, 1500); // Reduced delay
    } catch (err) {
      console.error('Error returning tool:', err);
      setReturnError(err.message || 'Error returning tool.'); // English message
    } finally {
      setReturnLoading(false);
    }
  };
  // --- End Return Modal Handlers ---

  return (
    <Layout>
      {/* Added consistent padding */}
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">My Borrowed Tools</h1> {/* English Title */}

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error} {/* Error messages from API should be English now */}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-slate-500">Loading borrowed tools...</p> {/* English Text */}
          </div>
        ) : loans.length === 0 ? (
          // Added consistent styling
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <p className="text-slate-600 mb-4">You currently have no tools on loan.</p> {/* English Text */}
            <button
              onClick={() => navigate('/catalog')}
              className="bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
            >
              View Tool Catalog {/* English Text */}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map(loan => {
              if (!loan.tool) {
                 // Handle case where tool might have been deleted
                 console.warn(`Loan ${loan._id} references a deleted tool.`);
                 return (
                    <div key={loan._id} className="bg-red-50 p-4 rounded-xl shadow flex justify-between items-center opacity-75"> {/* Consistent Style */}
                       <p className='text-red-700 text-sm'>Active loan for a deleted tool (Loan ID: {loan._id}). Please contact an administrator.</p>
                    </div>
                 );
              }

              const timeInfo = formatTimeRemaining(loan.expectedReturn);
              const colorClass = getStatusColorClass(timeInfo.status);

              return (
                // Added consistent styling to the card
                <div key={loan._id} className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Link to tool details */}
                  <Link to={`/tools/${loan.tool._id}`} className="flex-grow hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded p-1 -m-1">
                      <h2 className="text-lg font-semibold text-slate-900">{loan.tool.name}</h2>
                      <p className="text-sm text-slate-600">
                        Borrowed: {formatDate(loan.borrowedAt)} | Return Due: {formatDate(loan.expectedReturn)}
                      </p>
                      {/* English Labels */}
                      {loan.purpose && (
                         <p className="text-sm text-slate-500 mt-1">
                          Purpose: {loan.purpose}
                         </p>
                      )}
                      {loan.vehicle && (
                         <p className="text-sm text-slate-500">
                          Vehicle: {loan.vehicle}
                         </p>
                      )}
                      {/* Consider showing transfer history here if needed */}
                  </Link>

                  {/* Status and Actions */}
                  <div className="flex-shrink-0 flex flex-col sm:items-end w-full sm:w-auto space-y-2">
                    <p className={`text-sm font-semibold ${colorClass}`}>
                      {timeInfo.text} {/* Time text already in English */}
                    </p>
                    <button
                      onClick={() => handleReturnClick(loan)} // Opens the return modal
                      className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    >
                      Return {/* English Text */}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Return Modal - Translate visible text */}
        {showReturnModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Return Tool: {selectedLoan.tool?.name || 'Unknown Tool'}</h2>
              {returnError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{returnError}</p>}
              {returnSuccess && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{returnSuccess}</p>}
              <form onSubmit={handleReturnSubmit}>
                <div className="mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox" name="hasDamage"
                      checked={returnData.returnCondition.hasDamage} onChange={handleReturnChange}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                    <span className="text-sm text-slate-700">Report damage or issue with the tool?</span> {/* English Text */}
                  </label>
                </div>
                {returnData.returnCondition.hasDamage && (
                  <div className="mb-4">
                    <label htmlFor="damageDescription" className="block text-sm font-medium text-slate-700 mb-1">
                      Describe Damage/Issue *
                    </label>
                    <textarea
                      id="damageDescription" name="damageDescription" required={returnData.returnCondition.hasDamage}
                      value={returnData.returnCondition.damageDescription} onChange={handleReturnChange} rows="3"
                      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-slate-300 rounded-md p-2"
                      placeholder="Briefly describe the problem..." // English Text
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowReturnModal(false)} className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded">Cancel</button> {/* English Text */}
                  <button type="submit" disabled={returnLoading} className="bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">{returnLoading ? 'Processing...' : 'Confirm Return'}</button> {/* English Text */}
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

// // src/pages/MyTools.js
// import React, { useState, useEffect, useCallback } from 'react';
// // MODIFICADO: Importar Link
// import { useNavigate, Link } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { getMyLoans, returnToolAPI } from '../services/api'; // Cambiado a returnToolAPI si esa es la función correcta

// const MyTools = () => {
//   const navigate = useNavigate();
//   const [loans, setLoans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Estados para el modal de devolución (se mantiene por si se reutiliza, aunque el botón ahora está fuera)
//   const [showReturnModal, setShowReturnModal] = useState(false);
//   const [selectedLoan, setSelectedLoan] = useState(null);
//   const [returnData, setReturnData] = useState({
//     returnCondition: { status: 'good', hasDamage: false, damageDescription: '' }
//   });
//   const [returnLoading, setReturnLoading] = useState(false);
//   const [returnError, setReturnError] = useState('');
//   const [returnSuccess, setReturnSuccess] = useState('');

//   // Cargar préstamos activos
//   useEffect(() => {
//     const loadLoans = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const response = await getMyLoans();
//         setLoans(response.data?.filter(loan => loan.status === 'active') || []);
//       } catch (err) {
//         console.error('Error detallado al cargar préstamos:', err);
//         setError('Error al cargar herramientas prestadas.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadLoans();
//   }, []); // Carga solo al montar

//   // --- NUEVO: Funciones copiadas/adaptadas de Dashboard.js ---
//   const formatTimeRemaining = useCallback((expectedReturn) => {
//     const now = new Date();
//     const returnDate = new Date(expectedReturn);
//     const diffTime = returnDate.getTime() - now.getTime();

//     const totalMinutes = Math.floor(diffTime / (1000 * 60));
//     const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
//     const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (totalMinutes < 0) {
//       const overdueSeconds = Math.abs(Math.floor(diffTime / 1000));
//       if (overdueSeconds < 3600 * 2) return { text: `Retraso (${Math.floor(overdueSeconds / 60)}m)`, status: 'overdue' };
//       if (overdueSeconds < 86400 * 2) return { text: `Retraso (${Math.floor(overdueSeconds / 3600)}h)`, status: 'overdue' };
//       return { text: `Retraso (${Math.floor(overdueSeconds / 86400)}d)`, status: 'overdue' };
//     }
//     if (totalMinutes < 60) return { text: `Vence en ${totalMinutes}m`, status: 'dueSoon' };
//     if (totalHours < 6) return { text: `Vence en ${totalHours}h`, status: 'dueSoon' };
//     if (totalHours < 24) return { text: `Vence hoy (${totalHours}h)`, status: 'dueToday' };
//     if (totalDays === 1) return { text: `Vence mañana`, status: 'safe' };
//     return { text: `Quedan ${totalDays}d`, status: 'safe' };
//   }, []); // useCallback para evitar redefiniciones innecesarias

//   const getStatusColorClass = useCallback((status) => {
//       switch (status) {
//           case 'overdue': return 'text-red-600';
//           case 'dueSoon': return 'text-orange-500';
//           case 'dueToday': return 'text-yellow-600';
//           case 'safe': return 'text-green-600';
//           default: return 'text-slate-500';
//       }
//   }, []);
//   // --- FIN NUEVAS FUNCIONES ---

//   // --- Funciones para el modal de devolución ---
//   const handleReturnClick = (loan) => {
//     setSelectedLoan(loan);
//     setReturnData({
//       returnCondition: { status: 'good', hasDamage: false, damageDescription: '' }
//     });
//     setReturnError('');
//     setReturnSuccess('');
//     setShowReturnModal(true);
//   };

//   const handleReturnChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setReturnData(prev => ({
//       ...prev,
//       returnCondition: {
//         ...prev.returnCondition,
//         hasDamage: name === 'hasDamage' ? checked : prev.returnCondition.hasDamage,
//         status: (name === 'hasDamage' && checked) ? 'damaged' : 'good',
//         damageDescription: name === 'damageDescription' ? value : prev.returnCondition.damageDescription
//       }
//     }));
//   };

//   const handleReturnSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedLoan) return;
//     setReturnLoading(true);
//     setReturnError('');
//     setReturnSuccess('');
//     try {
//       await returnToolAPI(selectedLoan._id, returnData); // Usar returnToolAPI
//       setReturnSuccess('Herramienta devuelta exitosamente.');
//       setLoans(prevLoans => prevLoans.filter(loan => loan._id !== selectedLoan._id)); // Actualizar lista local
//       setTimeout(() => {
//         setShowReturnModal(false);
//         setSelectedLoan(null);
//         setReturnSuccess(''); // Limpiar mensaje
//       }, 1500);
//     } catch (err) {
//       console.error('Error completo al devolver herramienta:', err);
//       setReturnError(err.message || 'Error al devolver la herramienta.');
//     } finally {
//       setReturnLoading(false);
//     }
//   };

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8"> {/* Añadido padding */}
//         <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Herramientas en Préstamo</h1>

//         {error && (
//           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//             {error}
//           </div>
//         )}

//         {loading ? (
//           <div className="text-center py-10">
//             <p className="text-gray-500">Cargando...</p>
//           </div>
//         ) : loans.length === 0 ? (
//           <div className="bg-white p-6 rounded shadow text-center">
//             <p className="text-gray-600 mb-4">No tienes herramientas prestadas actualmente.</p>
//             <button
//               onClick={() => navigate('/catalog')}
//               className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//             >
//               Ver Catálogo
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {/* MODIFICADO: Iterar y usar nueva lógica + Link */}
//             {loans.map(loan => {
//               if (!loan.tool) {
//                  // Manejar caso donde la herramienta pudo ser eliminada
//                  console.warn(`Préstamo ${loan._id} referencia a una herramienta eliminada.`);
//                  return (
//                     <div key={loan._id} className="bg-red-50 p-4 rounded shadow flex justify-between items-center opacity-75">
//                        <p className='text-red-700 text-sm'>Préstamo activo para herramienta eliminada (ID Préstamo: {loan._id}). Contacta al administrador.</p>
//                        {/* Podrías añadir botón para forzar devolución si es necesario */}
//                     </div>
//                  );
//               }

//               const timeInfo = formatTimeRemaining(loan.expectedReturn);
//               const colorClass = getStatusColorClass(timeInfo.status);

//               return (
//                 <div key={loan._id} className="bg-white p-4 rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center">
//                   {/* Sección de Información (Ahora es un Link) */}
//                    <Link to={`/tools/${loan.tool._id}`} className="flex-grow mb-3 sm:mb-0 sm:mr-4 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-1 -m-1">
//                       <h2 className="text-lg font-semibold text-gray-900">{loan.tool.name}</h2>
//                       <p className="text-sm text-gray-600">
//                         Prestada: {new Date(loan.borrowedAt).toLocaleDateString()} | Devolver: {new Date(loan.expectedReturn).toLocaleDateString()}
//                       </p>
//                       {loan.purpose && (
//                          <p className="text-sm text-gray-500 mt-1">
//                           Propósito: {loan.purpose}
//                          </p>
//                       )}
//                       {loan.vehicle && (
//                          <p className="text-sm text-gray-500">
//                           Vehículo: {loan.vehicle}
//                          </p>
//                       )}
//                       {/* Aquí podrías añadir el historial de transferencia si lo implementaste */}
//                    </Link>

//                   {/* Sección de Estado y Acciones */}
//                   <div className="flex-shrink-0 flex flex-col sm:items-end w-full sm:w-auto">
//                     <p className={`text-sm font-semibold mb-2 ${colorClass}`}>
//                       {timeInfo.text}
//                     </p>
//                     <button
//                       onClick={() => handleReturnClick(loan)}
//                       className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-sm"
//                     >
//                       Devolver
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Modal de Devolución (Sin cambios en su estructura interna) */}
//         {showReturnModal && selectedLoan && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
//               <h2 className="text-xl font-semibold mb-4">Devolver: {selectedLoan.tool.name}</h2>
//               {returnError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{returnError}</p>}
//               {returnSuccess && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{returnSuccess}</p>}
//               <form onSubmit={handleReturnSubmit}>
//                 <div className="mb-4">
//                   <label className="flex items-center cursor-pointer">
//                     <input
//                       type="checkbox" name="hasDamage"
//                       checked={returnData.returnCondition.hasDamage} onChange={handleReturnChange}
//                       className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
//                     />
//                     <span className="text-sm text-gray-700">¿La herramienta presenta algún daño/problema?</span>
//                   </label>
//                 </div>
//                 {returnData.returnCondition.hasDamage && (
//                   <div className="mb-4">
//                     <label htmlFor="damageDescription" className="block text-sm font-medium text-slate-700 mb-1">
//                       Descripción del daño o problema *
//                     </label>
//                     <textarea
//                       id="damageDescription" name="damageDescription" required={returnData.returnCondition.hasDamage}
//                       value={returnData.returnCondition.damageDescription} onChange={handleReturnChange} rows="3"
//                       className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-slate-300 rounded-md p-2"
//                       placeholder="Describe brevemente el problema..."
//                     />
//                   </div>
//                 )}
//                 <div className="flex justify-end gap-3 pt-4">
//                   <button type="button" onClick={() => setShowReturnModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
//                   <button type="submit" disabled={returnLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">{returnLoading ? 'Procesando...' : 'Confirmar Devolución'}</button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default MyTools;

// // src/pages/MyTools.js
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { getMyLoans, returnTool } from '../services/api';

// const MyTools = () => {
//   const navigate = useNavigate();
//   const [loans, setLoans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
  
//   // Estado para el modal de devolución
//   const [showReturnModal, setShowReturnModal] = useState(false);
//   const [selectedLoan, setSelectedLoan] = useState(null);
//   const [returnData, setReturnData] = useState({
//     returnCondition: {
//       status: 'good',
//       hasDamage: false,
//       damageDescription: ''
//     }
//   });
//   const [returnLoading, setReturnLoading] = useState(false);
//   const [returnError, setReturnError] = useState('');
//   const [returnSuccess, setReturnSuccess] = useState('');

//   useEffect(() => {
//     const loadLoans = async () => {
//       try {
//         setLoading(true);
//         const response = await getMyLoans();
        
//         // Filtro manual para asegurar que solo se muestran préstamos activos
//         if (response.data && Array.isArray(response.data)) {
//           const activeLoans = response.data.filter(loan => loan.status === 'active');
//           console.log(`Filtrando en frontend: ${activeLoans.length} préstamos activos de ${response.data.length} totales`);
//           setLoans(activeLoans);
//         } else {
//           setLoans([]);
//         }
        
//         setError('');
//       } catch (err) {
//         console.error('Error detallado:', err);
//         setError('Error al cargar herramientas prestadas');
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     loadLoans();
//   }, []);

//   // useEffect(() => {
//   //   const loadLoans = async () => {
//   //     try {
//   //       setLoading(true);
//   //       console.log('Cargando préstamos iniciales...');
//   //       const response = await getMyLoans();
//   //       console.log('Préstamos iniciales cargados:', response);
//   //       setLoans(response.data || []);
//   //       setError('');
//   //     } catch (err) {
//   //       console.error('Error detallado al cargar préstamos:', err);
//   //       setError('Error al cargar herramientas prestadas');
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };
  
//   //   loadLoans();
//   // }, []);

//   // Calcular días restantes hasta la devolución
//   const calculateDaysLeft = (expectedReturn) => {
//     const today = new Date();
//     const returnDate = new Date(expectedReturn);
//     const diffTime = returnDate - today;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
//   };
//   // Añadir esta función en el componente MyTools.js, después de calculateDaysLeft

//   // Función para mostrar historial de transferencias
//   const showTransferHistory = (loan) => {
//     if (!loan.transferHistory || loan.transferHistory.length === 0) {
//       return null;
//     }

//     return (
//       <div className="mt-2 text-xs text-gray-500">
//         <p className="font-semibold">Historial de transferencias:</p>
//         <ul className="list-disc pl-4 space-y-1">
//           {loan.transferHistory.map((transfer, index) => (
//             <li key={index}>
//               {new Date(transfer.transferredAt).toLocaleDateString()}: De{' '}
//               {transfer.fromTechnician?.name || 'Usuario desconocido'} a{' '}
//               {transfer.toTechnician?.name || 'Usuario desconocido'}
//               {transfer.notes && ` - "${transfer.notes}"`}
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   };
//   const handleReturnClick = (loan) => {
//     setSelectedLoan(loan);
//     setReturnData({
//       returnCondition: {
//         status: 'good',
//         hasDamage: false,
//         damageDescription: ''
//       }
//     });
//     setReturnError('');
//     setReturnSuccess('');
//     setShowReturnModal(true);
//   };

//   const handleReturnChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name === 'hasDamage') {
//       setReturnData(prev => ({
//         ...prev,
//         returnCondition: {
//           ...prev.returnCondition,
//           hasDamage: checked,
//           status: checked ? 'damaged' : 'good'
//         }
//       }));
//     } else if (name === 'damageDescription') {
//       setReturnData(prev => ({
//         ...prev,
//         returnCondition: {
//           ...prev.returnCondition,
//           damageDescription: value
//         }
//       }));
//     }
//   };

//   const handleReturnSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!selectedLoan) return;
    
//     try {
//       setReturnLoading(true);
//       setReturnError('');
      
//       console.log('Devolviendo herramienta con ID:', selectedLoan._id);
//       console.log('Datos de devolución:', returnData);
      
//       try {
//         await returnTool(selectedLoan._id, returnData);
//         setReturnSuccess('Herramienta devuelta exitosamente');
//       } catch (returnErr) {
//         // Si el error es que la herramienta ya ha sido devuelta, lo tratamos como un éxito
//         if (returnErr.message === 'Esta herramienta ya ha sido devuelta') {
//           setReturnSuccess('Herramienta actualizada en el sistema');
//         } else {
//           // Para otros errores, los propagamos
//           throw returnErr;
//         }
//       }
      
//       // En cualquier caso, eliminamos el préstamo de la lista local
//       setLoans(prevLoans => prevLoans.filter(loan => loan._id !== selectedLoan._id));
      
//       // Cerrar el modal después de 2 segundos
//       setTimeout(() => {
//         setShowReturnModal(false);
//         setSelectedLoan(null);
//       }, 2000);
//     } catch (err) {
//       console.error('Error completo al devolver herramienta:', err);
//       setReturnError(err.message || 'Error al devolver la herramienta');
//     } finally {
//       setReturnLoading(false);
//     }
//   };

//   return (
//     <Layout>
//       <div>
//         <h1 className="text-2xl font-bold mb-6">Mis Herramientas</h1>
        
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//             {error}
//           </div>
//         )}
        
//         {loading ? (
//           <div className="text-center py-10">
//             <p className="text-gray-500">Cargando herramientas prestadas...</p>
//           </div>
//         ) : loans.length === 0 ? (
//           <div className="bg-white p-6 rounded shadow text-center">
//             <p className="text-gray-600 mb-4">No tienes herramientas prestadas actualmente.</p>
//             <button 
//               onClick={() => navigate('/catalog')} 
//               className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//             >
//               Ver Catálogo de Herramientas
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {loans.map(loan => {
//               const daysLeft = calculateDaysLeft(loan.expectedReturn);
//               return (
//                 <div key={loan._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
//                   <div>
//                     <h2 className="text-lg font-semibold">{loan.tool.name}</h2>
//                     <p className="text-sm text-gray-600">
//                       Prestada el: {new Date(loan.borrowedAt).toLocaleDateString()}
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       Devolución esperada: {new Date(loan.expectedReturn).toLocaleDateString()}
//                     </p>
//                     {/* // Luego, en la sección donde se renderizan los préstamos, justo después de la sección del propósito: */}
//                     {loan.purpose && (
//                       <p className="text-sm text-gray-600 mt-1">
//                         <span className="font-semibold">Propósito:</span> {loan.purpose}
//                       </p>
//                     )}
//                     {showTransferHistory(loan)}
//                   </div>
//                   <div className="text-right">
//                     <p className={`font-bold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 1 ? 'text-orange-500' : 'text-green-500'}`}>
//                       {daysLeft < 0 
//                         ? `Retraso de ${Math.abs(daysLeft)} día(s)` 
//                         : `${daysLeft} día(s) restantes`}
//                     </p>
//                     <button 
//                       onClick={() => handleReturnClick(loan)}
//                       className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
//                     >
//                       Devolver
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
        
//         {/* Modal de Devolución */}
//         {showReturnModal && selectedLoan && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg p-8 max-w-md w-full">
//               <h2 className="text-xl font-semibold mb-4">Devolver Herramienta</h2>
//               <p className="mb-4">
//                 Está devolviendo: <span className="font-semibold">{selectedLoan.tool.name}</span>
//               </p>
              
//               {returnError && (
//                 <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//                   {returnError}
//                 </div>
//               )}
              
//               {returnSuccess && (
//                 <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
//                   {returnSuccess}
//                 </div>
//               )}
              
//               <form onSubmit={handleReturnSubmit}>
//                 <div className="mb-4">
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       name="hasDamage"
//                       checked={returnData.returnCondition.hasDamage}
//                       onChange={handleReturnChange}
//                       className="mr-2"
//                     />
//                     <span>La herramienta presenta algún daño o problema</span>
//                   </label>
//                 </div>
                
//                 {returnData.returnCondition.hasDamage && (
//                   <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="damageDescription">
//                       Descripción del daño o problema
//                     </label>
//                     <textarea
//                       id="damageDescription"
//                       name="damageDescription"
//                       value={returnData.returnCondition.damageDescription}
//                       onChange={handleReturnChange}
//                       className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       placeholder="Describe el daño o problema con la herramienta..."
//                       rows="3"
//                       required={returnData.returnCondition.hasDamage}
//                     />
//                   </div>
//                 )}
                
//                 <div className="flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={() => setShowReturnModal(false)}
//                     className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                   >
//                     Cancelar
//                   </button>
//                   <button
//                     type="submit"
//                     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                     disabled={returnLoading}
//                   >
//                     {returnLoading ? 'Procesando...' : 'Confirmar Devolución'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default MyTools;