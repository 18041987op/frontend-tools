// frontend/src/pages/DashboardAdmin.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
// Fetch only getTools (for stats) and getLoans (for attention list)
import { getTools, getLoans } from '../services/api';

const DashboardAdmin = () => {
  // State for Statistics
  const [tools, setTools] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState('');

  // State for Loans Requiring Attention (Severely Overdue)
  const [attentionLoans, setAttentionLoans] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);
  const [errorAttention, setErrorAttention] = useState('');
  const ADMIN_ESCALATION_DAYS = 2; // Threshold for follow-up list

  const today = new Date();
  // Using 'en-US' locale for English date format for the header
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // *** ADDED HELPER FUNCTION HERE ***
  // Helper function to format date strings (needed for the list)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Using locale 'en-US' for consistency, adjust if needed
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };
  // *** END ADDED HELPER FUNCTION ***

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Reset states
      setLoadingStats(true);
      setLoadingAttention(true);
      setErrorStats('');
      setErrorAttention('');

      try {
        // Fetch only necessary data: stats and attention loans
        const results = await Promise.allSettled([
          getTools(), // For stats [index 0]
          getLoans({ status: 'active', severelyOverdueDays: ADMIN_ESCALATION_DAYS }) // For attention required [index 1]
        ]);

        // Process Tools for Stats
        if (results[0].status === 'fulfilled' && results[0].value.success) {
          setTools(results[0].value.data || []);
        } else {
          const reason = results[0].status === 'rejected' ? results[0].reason : 'Unknown error';
          console.error('Error loading tools stats:', reason);
          setErrorStats(reason?.message || 'Error loading tool statistics.');
        }

        // Process Loans Requiring Attention
        if (results[1].status === 'fulfilled' && results[1].value.success) {
          setAttentionLoans(results[1].value.data || []);
        } else {
           const reason = results[1].status === 'rejected' ? results[1].reason : 'Unknown error';
          console.error('Error loading attention required loans:', reason);
          setErrorAttention(reason?.message || 'Error loading loans requiring attention.');
        }

      } catch (err) {
        // Catch errors not caught by Promise.allSettled (less likely)
        console.error('General error loading dashboard data:', err);
        setErrorStats('General error loading data.');
        setErrorAttention('General error loading data.');
      } finally {
        setLoadingStats(false);
        setLoadingAttention(false);
      }
    };
    fetchDashboardData();
  }, []); // Runs once on mount

  // Calculate statistics
  const total = tools.length;
  const available = tools.filter(t => t.status === 'available').length;
  const onLoan = tools.filter(t => t.status === 'borrowed').length;
  const maintenance = tools.filter(t => t.status === 'maintenance').length;
  const damaged = tools.filter(t => t.status === 'damaged').length;

  return (
    <Layout>
      {/* Apply consistent padding */}
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          {/* Translated Title */}
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          {/* Date Format */}
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>

        {/* Stats Error Message */}
        {errorStats && !loadingStats && (
           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
             {errorStats} {/* API errors should now be in English */}
           </div>
         )}

        {/* Statistics Cards */}
        {loadingStats ? (
          <div className="text-center py-5"><p className="text-gray-500">Loading statistics...</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Card: Total Tools */}
            <div className="bg-blue-400 text-white p-4 rounded-xl shadow-md text-center sm:text-left">
                {/* Translated Text */}
                <p className="text-sm font-medium">Total Tools</p>
                <p className="text-3xl font-bold">{total}</p>
            </div>
            {/* Card: Available */}
            <Link to="/catalog?status=available" className="block bg-green-400 text-white p-4 rounded-xl shadow-md hover:bg-green-500 transition-colors text-center sm:text-left">
                 {/* Translated Text */}
                <p className="text-sm font-medium">Available</p>
                <p className="text-3xl font-bold">{available}</p>
            </Link>
             {/* Card: On Loan */}
             <Link to="/admin/borrowed-tools" className="block bg-yellow-400 text-white p-4 rounded-xl shadow-md hover:bg-yellow-500 transition-colors text-center sm:text-left">
                 {/* Translated Text */}
                <p className="text-sm font-medium">On Loan</p>
                <p className="text-3xl font-bold">{onLoan}</p>
             </Link>
             {/* Card: Maintenance */}
             <Link to="/admin/maintenance" className="block bg-purple-500 text-white p-4 rounded-xl shadow-md hover:bg-purple-600 transition-colors text-center sm:text-left">
                 {/* Translated Text */}
                <p className="text-sm font-medium">Maintenance</p>
                <p className="text-3xl font-bold">{maintenance}</p>
             </Link>
             {/* Card: Damaged */}
             <Link to="/admin/maintenance?status=damaged" className="block bg-red-400 text-white p-4 rounded-xl shadow-md hover:bg-red-500 transition-colors text-center sm:text-left">
                 {/* Translated Text */}
                <p className="text-sm font-medium">Damaged</p>
                <p className="text-3xl font-bold">{damaged}</p>
             </Link>
          </div>
        )}

        {/* Section: Loans Requiring Attention */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-8 border border-yellow-300">
           {/* Translated Title */}
          <h2 className="text-lg font-semibold text-red-700 mb-4">⚠️ Follow-up Required ({attentionLoans.length} Loans {ADMIN_ESCALATION_DAYS}+ Days Overdue)</h2>
          {/* Error Message */}
          {errorAttention && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errorAttention}</p>}
          {/* Loading/Empty/List States */}
          {loadingAttention ? (
             <p className="text-gray-500 italic">Loading...</p> // English Text
          ) : attentionLoans.length === 0 ? (
            <p className="text-gray-500 italic">No loans require immediate follow-up.</p> // English Text
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {attentionLoans.map((loan) => {
                 const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(loan.expectedReturn)) / (1000 * 60 * 60 * 24)));
                 return (
                   <li key={`attention-${loan._id}`} className="py-3">
                     <div className="flex justify-between items-start gap-2">
                       <div>
                         <p className="text-sm font-medium text-gray-900">
                           <Link to={`/tools/${loan.tool?._id}`} className="hover:underline text-blue-600">
                             {loan.tool?.name || 'Deleted Tool'}
                           </Link>
                         </p>
                         <p className="text-xs text-gray-600">
                            {/* Translated Label */}
                           Technician: <span className="font-medium">{loan.technician?.name || 'Unknown'}</span>
                         </p>
                         <p className="text-xs text-red-600">
                            {/* Using the newly added formatDate function */}
                           Due: {formatDate(loan.expectedReturn)}
                           {' '}({daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue) {/* Text already English */}
                         </p>
                       </div>
                        {/* Translated Link Text */}
                       <Link to={`/admin/users/${loan.technician?._id}/edit`} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex-shrink-0">View Tech</Link>
                     </div>
                   </li>
                 );
              })}
            </ul>
          )}
        </div>
        {/* END Section: Loans Requiring Attention */}

      </div> {/* End main padding div */}
    </Layout>
  );
};

export default DashboardAdmin;


//********************************** */

// // frontend/src/pages/DashboardAdmin.js
// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { Link } from 'react-router-dom';
// // Removed getLoans for recent activity, keep getTools for stats and getLoans for attention loans
// import { getTools, getLoans } from '../services/api';

// const DashboardAdmin = () => {
//   // State for Statistics
//   const [tools, setTools] = useState([]);
//   const [loadingStats, setLoadingStats] = useState(true);
//   const [errorStats, setErrorStats] = useState('');

//   // State for Loans Requiring Attention (Severely Overdue)
//   const [attentionLoans, setAttentionLoans] = useState([]);
//   const [loadingAttention, setLoadingAttention] = useState(true);
//   const [errorAttention, setErrorAttention] = useState('');
//   const ADMIN_ESCALATION_DAYS = 2; // Threshold for follow-up list

//   const today = new Date();
//   // Keep date format or change as needed, e.g., 'en-US'
//   const formattedDate = today.toLocaleDateString('es-ES', {
//     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
//   });

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       // Reset states
//       setLoadingStats(true);
//       setLoadingAttention(true);
//       setErrorStats('');
//       setErrorAttention('');

//       try {
//         // Fetch only necessary data: stats and attention loans
//         const results = await Promise.allSettled([
//           getTools(), // For stats [index 0]
//           getLoans({ status: 'active', severelyOverdueDays: ADMIN_ESCALATION_DAYS }) // For attention required [index 1]
//         ]);

//         // Process Tools for Stats
//         if (results[0].status === 'fulfilled') {
//           setTools(results[0].value.data || []);
//         } else {
//           console.error('Error loading tools stats:', results[0].reason);
//           setErrorStats('Error loading tool statistics.');
//         }

//         // Process Loans Requiring Attention
//         if (results[1].status === 'fulfilled') {
//           setAttentionLoans(results[1].value.data || []);
//         } else {
//           console.error('Error loading attention required loans:', results[1].reason);
//           setErrorAttention('Error loading loans requiring attention.');
//         }

//       } catch (err) {
//         console.error('General error loading dashboard data:', err);
//         setErrorStats('General error loading data.');
//         setErrorAttention('General error loading data.');
//       } finally {
//         setLoadingStats(false);
//         setLoadingAttention(false);
//       }
//     };
//     fetchDashboardData();
//   }, []); // Runs once on mount

//   // Calculate statistics
//   const total = tools.length;
//   const available = tools.filter(t => t.status === 'available').length;
//   const onLoan = tools.filter(t => t.status === 'borrowed').length;
//   const maintenance = tools.filter(t => t.status === 'maintenance').length;
//   const damaged = tools.filter(t => t.status === 'damaged').length;

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
//           <p className="text-sm text-gray-500">{formattedDate}</p>
//         </div>

//         {/* Stats Error */}
//         {errorStats && !loadingStats && (
//            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//              {errorStats}
//            </div>
//          )}

//         {/* Statistics Cards */}
//         {loadingStats ? (
//           <div className="text-center py-5"><p className="text-gray-500">Loading statistics...</p></div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
//             {/* Card: Total Tools */}
//             <div className="bg-blue-400 text-white p-4 rounded-xl shadow-md text-center sm:text-left">
//                 <p className="text-sm font-medium">Total Tools</p>
//                 <p className="text-3xl font-bold">{total}</p>
//             </div>
//             {/* Card: Available */}
//             <Link to="/catalog?status=available" className="block bg-green-400 text-white p-4 rounded-xl shadow-md hover:bg-green-500 transition-colors text-center sm:text-left">
//                 <p className="text-sm font-medium">Available</p>
//                 <p className="text-3xl font-bold">{available}</p>
//             </Link>
//              {/* Card: On Loan */}
//              <Link to="/admin/borrowed-tools" className="block bg-yellow-400 text-white p-4 rounded-xl shadow-md hover:bg-yellow-500 transition-colors text-center sm:text-left">
//                 <p className="text-sm font-medium">On Loan</p>
//                 <p className="text-3xl font-bold">{onLoan}</p>
//              </Link>
//              {/* Card: Maintenance */}
//              <Link to="/admin/maintenance" className="block bg-purple-500 text-white p-4 rounded-xl shadow-md hover:bg-purple-600 transition-colors text-center sm:text-left">
//                 <p className="text-sm font-medium">Maintenance</p>
//                 <p className="text-3xl font-bold">{maintenance}</p>
//              </Link>
//              {/* Card: Damaged */}
//              <Link to="/admin/maintenance?status=damaged" className="block bg-red-400 text-white p-4 rounded-xl shadow-md hover:bg-red-500 transition-colors text-center sm:text-left">
//                 <p className="text-sm font-medium">Damaged</p>
//                 <p className="text-3xl font-bold">{damaged}</p>
//              </Link>
//           </div>
//         )}

//         {/* Section: Loans Requiring Attention */}
//         <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-8 border border-yellow-300">
//           <h2 className="text-lg font-semibold text-red-700 mb-4">⚠️ Follow-up Required ({attentionLoans.length} Loans {ADMIN_ESCALATION_DAYS}+ Days Overdue)</h2>
//           {errorAttention && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errorAttention}</p>}
//           {loadingAttention ? (
//              <p className="text-gray-500 italic">Loading...</p>
//           ) : attentionLoans.length === 0 ? (
//             <p className="text-gray-500 italic">No loans require immediate follow-up.</p>
//           ) : (
//             <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto"> {/* Scrollable list */}
//               {attentionLoans.map((loan) => {
//                  const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(loan.expectedReturn)) / (1000 * 60 * 60 * 24)));
//                  return (
//                    <li key={`attention-${loan._id}`} className="py-3">
//                      <div className="flex justify-between items-start gap-2">
//                        <div>
//                          <p className="text-sm font-medium text-gray-900">
//                            <Link to={`/tools/${loan.tool?._id}`} className="hover:underline text-blue-600">
//                              {loan.tool?.name || 'Deleted Tool'}
//                            </Link>
//                          </p>
//                          <p className="text-xs text-gray-600">
//                            Technician: <span className="font-medium">{loan.technician?.name || 'Unknown'}</span>
//                          </p>
//                          <p className="text-xs text-red-600">
//                            Due: {new Date(loan.expectedReturn).toLocaleDateString()}
//                            {' '}({daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue)
//                          </p>
//                        </div>
//                        <Link to={`/admin/users/${loan.technician?._id}/edit`} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex-shrink-0">View Tech</Link>
//                      </div>
//                    </li>
//                  );
//               })}
//             </ul>
//           )}
//         </div>
//         {/* END Section: Loans Requiring Attention */}

//         {/* Removed Recent Activity and General Alerts sections */}

//       </div>
//     </Layout>
//   );
// };

// export default DashboardAdmin;

// src/pages/DashboardAdmin.js
// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { Link } from 'react-router-dom';

// // MODIFICADO: Importar getLoans
// import { getTools, getLoans } from '../services/api';

// const DashboardAdmin = () => {
//   const [tools, setTools] = useState([]);
//   // const [loans, setLoans] = useState([]); // Ya no necesitamos todos los préstamos aquí
//   const [loadingStats, setLoadingStats] = useState(true); // Carga para estadísticas
//   const [errorStats, setErrorStats] = useState('');       // Error para estadísticas

//   // NUEVO: Estados para Actividad Reciente
//   const [recentActivity, setRecentActivity] = useState([]);
//   const [loadingActivity, setLoadingActivity] = useState(true); // Carga separada
//   const [errorActivity, setErrorActivity] = useState('');       // Error separado

//   // --- State for Loans Requiring Attention ---
//   const [attentionLoans, setAttentionLoans] = useState([]);
//   const [loadingAttention, setLoadingAttention] = useState(true);
//   const [errorAttention, setErrorAttention] = useState('');
//   const ADMIN_ESCALATION_DAYS = 2; // Or use the value from your notification config

//   const today = new Date();
//   const formattedDate = today.toLocaleDateString('es-ES', { /* ... opciones ... */ });

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setLoadingStats(true);
//       setLoadingActivity(true);
//       setErrorStats('');
//       setErrorActivity('');
            
//       try {
//         // Usamos Promise.allSettled para que una petición no falle la otra
//         const results = await Promise.allSettled([
//           getTools(), // For stats [index 0]
//           getLoans({ sortBy: '-updatedAt', limit: 5 }), // For recent activity [index 1]
//           getLoans({ status: 'active', severelyOverdueDays: ADMIN_ESCALATION_DAYS }) // For attention required [index 2] 
//         ]);

//         // Procesar resultado de getTools
//         if (results[0].status === 'fulfilled') {
//           setTools(results[0].value.data || []);
//         } else {
//           console.error('Error al cargar herramientas:', results[0].reason);
//           setErrorStats('Error al cargar estadísticas de herramientas.');
//         }

//         // Procesar resultado de getLoans
//         if (results[1].status === 'fulfilled') {
//           setRecentActivity(results[1].value.data || []);
//         } else {
//           console.error('Error al cargar actividad reciente:', results[1].reason);
//           setErrorActivity('Error al cargar la actividad reciente.');
//         }

//         // Process result for attention required loans (index 2)
//         if (results[2].status === 'fulfilled') {
//           setAttentionLoans(results[2].value.data || []);
//         } else {
//           console.error('Error loading attention required loans:', results[2].reason);
//           setErrorAttention('Error al cargar préstamos que requieren atención.');
//         }

//       } catch (err) {
//         // Este catch es por si Promise.allSettled falla (raro)
//         console.error('Error general al cargar datos del dashboard:', err);
//         setErrorStats('Error general al cargar datos.');
//         setErrorActivity('Error general al cargar datos.');
//       } finally {
//         setLoadingStats(false);
//         setLoadingActivity(false);
//         setLoadingAttention(false); // <-- AÑADIR ESTA
//         //setLoadingLateReport(false); // <-- for Reports Quizas tenga que remover esta linea ya que la pagina de reportes es otra.
//       }
//     };
//     fetchDashboardData();
//   }, []);

//   // Cálculo de estadísticas (solo necesita 'tools')
//   const total = tools.length;
//   const disponibles = tools.filter(t => t.status === 'available').length;
//   const enUso = tools.filter(t => t.status === 'borrowed').length;
//   const enReparacion = tools.filter(t => t.status === 'maintenance').length;
//   const danadas = tools.filter(t => t.status === 'damaged').length;

//   // Función para formatear fechas relativas simples
//    const formatRelativeDate = (dateString) => {
//       const date = new Date(dateString);
//       const now = new Date();
//       const diffSeconds = Math.round((now - date) / 1000);
//       const diffMinutes = Math.round(diffSeconds / 60);
//       const diffHours = Math.round(diffMinutes / 60);
//       const diffDays = Math.round(diffHours / 24);

//       if (diffSeconds < 60) return `Hace segundos`;
//       if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
//       if (diffHours < 24) return `Hace ${diffHours} h`;
//       if (diffDays === 1) return `Ayer`;
//       if (diffDays < 7) return `Hace ${diffDays} días`;
//       return date.toLocaleDateString(); // Fecha completa si es más antiguo
//   };


//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8">
//         {/* ... (Título, Fecha, Error de Stats) ... */}
//          <div className="mb-6">
//            <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
//            <p className="text-sm text-gray-500">{formattedDate}</p>
//          </div>
//          {errorStats && (
//             <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//               {errorStats}
//             </div>
//           )}

//         {/* Tarjetas de conteo (dependen de loadingStats) */}
//         {loadingStats ? (
//           <div className="text-center py-5"><p className="text-gray-500">Cargando estadísticas...</p></div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
//              {/* ... (Las 5 tarjetas <Link> o <div> como las tenías) ... */}
//                <div className="bg-blue-400 text-white p-4 rounded-xl shadow-md text-center sm:text-left"><p className="text-sm font-medium">Total Herramientas</p><p className="text-3xl font-bold">{total}</p></div>
//                <Link to="/catalog?status=available" className="block bg-green-400 text-white p-4 rounded-xl shadow-md hover:bg-green-500 transition-colors text-center sm:text-left"><p className="text-sm font-medium">Disponibles</p><p className="text-3xl font-bold">{disponibles}</p></Link>
//                <Link to="/admin/borrowed-tools" className="block bg-yellow-400 text-white p-4 rounded-xl shadow-md hover:bg-yellow-500 transition-colors text-center sm:text-left"><p className="text-sm font-medium">En Préstamo</p><p className="text-3xl font-bold">{enUso}</p></Link>
//                <Link to="/admin/maintenance" className="block bg-purple-500 text-white p-4 rounded-xl shadow-md hover:bg-purple-600 transition-colors text-center sm:text-left"><p className="text-sm font-medium">En Reparación</p><p className="text-3xl font-bold">{enReparacion}</p></Link>
//                <Link to="/admin/maintenance" className="block bg-red-400 text-white p-4 rounded-xl shadow-md hover:bg-red-500 transition-colors text-center sm:text-left"><p className="text-sm font-medium">Dañadas</p><p className="text-3xl font-bold">{danadas}</p></Link>
//           </div>
//         )}
//          {/* NUEVA SECCIÓN: Préstamos que Requieren Atención */}
//         <div className="bg-white rounded-xl shadow p-4 mb-8 border border-yellow-300"> {/* Borde amarillo para destacar */}
//           <h2 className="text-lg font-semibold text-red-700 mb-4">⚠️ Seguimiento Requerido (Vencidos por {ADMIN_ESCALATION_DAYS}+ días)</h2> {/* Título destacado */}
//           {errorAttention && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errorAttention}</p>}
//           {loadingAttention ? (
//              <p className="text-gray-500 italic">Cargando...</p>
//           ) : attentionLoans.length === 0 ? (
//             <p className="text-gray-500 italic">No hay préstamos con retraso significativo.</p>
//           ) : (
//             <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto"> {/* Limitar altura y scroll */}
//               {attentionLoans.map((loan) => {
//                  // Simple calculation for display, assumes expectedReturn is a valid Date
//                  const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(loan.expectedReturn)) / (1000 * 60 * 60 * 24)));
//                  return (
//                    <li key={`attention-${loan._id}`} className="py-3">
//                      <div className="flex justify-between items-start gap-2">
//                        <div>
//                          <p className="text-sm font-medium text-gray-900">
//                            {/* Link tool name to tool detail page */}
//                            <Link to={`/tools/${loan.tool?._id}`} className="hover:underline text-blue-600">
//                              {loan.tool?.name || 'Herramienta Eliminada'}
//                            </Link>
//                          </p>
//                          <p className="text-xs text-gray-600">
//                            Técnico: <span className="font-medium">{loan.technician?.name || 'Desconocido'}</span>
//                          </p>
//                          <p className="text-xs text-red-600"> {/* Highlight overdue info */}
//                            Venció: {new Date(loan.expectedReturn).toLocaleDateString()}
//                            {' '}({daysOverdue} {daysOverdue === 1 ? 'día' : 'días'} de retraso)
//                          </p>
//                        </div>
//                        {/* Optional: Link to technician details if needed */}
//                        {/* <Link to={`/admin/users/${loan.technician?._id}/edit`} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Ver Téc.</Link> */}
//                      </div>
//                    </li>
//                  );
//               })}
//             </ul>
//           )}
//         </div>
//         {/* FIN NUEVA SECCIÓN */}

//       </div>
//     </Layout>
//   );
// };

// export default DashboardAdmin;

// Fin 

// // src/pages/DashboardAdmin.js
// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { Link } from 'react-router-dom';
// // MODIFICADO: Importar getLoans también
// import { getTools, getLoans } from '../services/api';

// const DashboardAdmin = () => {
//   const [tools, setTools] = useState([]);
//   // MODIFICADO: Descomentar y usar el estado para loans
//   const [loans, setLoans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const today = new Date();
//   const formattedDate = today.toLocaleDateString('es-ES', {
//     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         // Usamos Promise.all para cargar herramientas y préstamos en paralelo
//         const [toolsRes, loansRes] = await Promise.all([
//           getTools(),
//           // Obtenemos todos los préstamos activos para alertas y actividad reciente
//           // Ordenamos por fecha de creación descendente para tener los más nuevos primero
//           getLoans({ status: 'active', sortBy: '-createdAt' })
//         ]);

//         setTools(toolsRes.data || []);
//         setLoans(loansRes.data || []); // Guardamos los préstamos activos

//       } catch (err) {
//         console.error('Error al cargar datos del dashboard admin:', err);
//         setError('Error al cargar los datos del dashboard.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []); // Se ejecuta solo una vez al montar

//   // Cálculo de estadísticas (sin cambios)
//   const total = tools.length;
//   const disponibles = tools.filter(t => t.status === 'available').length;
//   const enUso = tools.filter(t => t.status === 'borrowed').length; // Basado en estado de herramienta
//   const enReparacion = tools.filter(t => t.status === 'maintenance').length;
//   const danadas = tools.filter(t => t.status === 'damaged').length;

//   // NUEVO: Calcular préstamos vencidos para Alertas
//   const overdueLoans = loans.filter(l => new Date(l.expectedReturn) < today && l.status === 'active');

//   // NUEVO: Obtener los últimos 5 préstamos para Actividad Reciente (ya vienen ordenados)
//   const recentActivityLoans = loans.slice(0, 5);

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8">
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
//           <p className="text-sm text-gray-500">{formattedDate}</p>
//         </div>

//         {error && (
//           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//             {error}
//           </div>
//         )}

//         {loading ? (
//            <div className="text-center py-10"><p className="text-gray-500">Cargando...</p></div>
//         ) : (
//           <> {/* Fragment para envolver todo el contenido condicional */}
//             {/* Tarjetas de conteo (sin cambios respecto a la versión anterior) */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
//                {/* ... tarjetas ... */}
//                <div className="bg-blue-400 text-white p-4 rounded-xl shadow-md text-center sm:text-left"><p className="text-sm font-medium">Total Herramientas</p><p className="text-3xl font-bold">{total}</p></div>
//                <Link to="/catalog?status=available" className="block bg-green-400 text-white p-4 rounded-xl shadow-md hover:bg-green-500 transition-colors text-center sm:text-left"><p className="text-sm font-medium">Disponibles</p><p className="text-3xl font-bold">{disponibles}</p></Link>
//                <Link to="/admin/borrowed-tools" className="block bg-yellow-400 text-white p-4 rounded-xl shadow-md hover:bg-yellow-500 transition-colors text-center sm:text-left"><p className="text-sm font-medium">En Préstamo</p><p className="text-3xl font-bold">{enUso}</p></Link>
//                <Link to="/admin/maintenance" className="block bg-purple-500 text-white p-4 rounded-xl shadow-md hover:bg-purple-600 transition-colors text-center sm:text-left"><p className="text-sm font-medium">En Reparación</p><p className="text-3xl font-bold">{enReparacion}</p></Link>
//                <Link to="/admin/maintenance" className="block bg-red-400 text-white p-4 rounded-xl shadow-md hover:bg-red-500 transition-colors text-center sm:text-left"><p className="text-sm font-medium">Dañadas</p><p className="text-3xl font-bold">{danadas}</p></Link>
//             </div>

//             {/* MODIFICADO: Actividad reciente */}
//             <div className="bg-white rounded-xl shadow p-4 mb-8">
//               <h2 className="text-lg font-semibold text-gray-700 mb-4">Actividad Reciente</h2>
//               {recentActivityLoans.length === 0 ? (
//                 <p className="text-gray-500 italic">No hay actividad reciente para mostrar.</p>
//               ) : (
//                 <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto"> {/* Limitar altura y añadir scroll */}
//                   {recentActivityLoans.map((loan) => (
//                     <li key={loan._id} className="py-3">
//                       <p className="text-sm text-gray-800">
//                          <span className='font-medium'>{loan.technician?.name || 'Usuario desconocido'}</span>{' '}
//                          solicitó{' '}
//                          <span className='font-medium'>{loan.tool?.name || 'herramienta eliminada'}</span>
//                          {/* Podríamos añadir si fue devuelto o transferido si cargamos más tipos de actividad */}
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         {new Date(loan.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
//                       </p>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>

//             {/* MODIFICADO: Alertas */}
//             <div className="bg-white rounded-xl shadow p-4 mb-8">
//               <h2 className="text-lg font-semibold text-gray-700 mb-4">Alertas</h2>
//               {overdueLoans.length === 0 ? (
//                 <p className="text-gray-500 italic">No hay alertas actualmente.</p>
//               ) : (
//                 <ul className="list-disc list-inside text-sm text-red-600 space-y-2">
//                   {overdueLoans.map((lateLoan) => (
//                     <li key={lateLoan._id}>
//                        Herramienta <span className='font-medium'>{lateLoan.tool?.name || 'Eliminada'}</span> prestada a <span className='font-medium'>{lateLoan.technician?.name || 'Desconocido'}</span> está vencida (Esperada: {new Date(lateLoan.expectedReturn).toLocaleDateString()}).
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default DashboardAdmin;



// // src/pages/DashboardAdmin.js
// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { getTools, getMyLoans} from '../services/api';

// const DashboardAdmin = () => {
//   const [tools, setTools] = useState([]);
//   const [loans, setLoans] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const today = new Date();
//   const formattedDate = today.toLocaleDateString('es-ES', {
//     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [toolsRes, loansRes] = await Promise.all([
//           getTools(),
//           getMyLoans(), // Asegúrate que getMyLoans sea la función correcta aquí si es para admin. Si no, podría ser getLoans() sin filtro.
//         ]);
//         setTools(toolsRes.data || []);
//         setLoans(loansRes.data || []); // Ajusta si la respuesta de getMyLoans tiene otra estructura
//       } catch (err) {
//         console.error('Error al cargar datos del dashboard admin:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const total = tools.length;
//   const disponibles = tools.filter(t => t.estado === 'Disponible' || t.status === 'available').length; // Ajustado para ambos nombres de estado
//   const enUso = tools.filter(t => t.estado === 'En uso' || t.status === 'borrowed').length;          // Ajustado
//   const enReparacion = tools.filter(t => t.estado === 'En reparación' || t.status === 'maintenance').length; // Ajustado
//   const danadas = tools.filter(t => t.estado === 'Dañada' || t.status === 'damaged').length;            // Ajustado

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8">
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
//           <p className="text-sm text-gray-500">{formattedDate}</p>
//         </div>

//         {/* Tarjetas de conteo */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
//           {/* ... (tus tarjetas de conteo - sin cambios) ... */}
//           <div className="bg-blue-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">Total Herramientas</p>
//             <p className="text-3xl font-bold">{total}</p>
//           </div>
//           <div className="bg-green-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">Disponibles</p>
//             <p className="text-3xl font-bold">{disponibles}</p>
//           </div>
//           <div className="bg-yellow-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">En Préstamo</p>
//             <p className="text-3xl font-bold">{enUso}</p>
//           </div>
//           <div className="bg-orange-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">En Reparación</p>
//             <p className="text-3xl font-bold">{enReparacion}</p>
//           </div>
//           <div className="bg-red-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">Dañadas</p>
//             <p className="text-3xl font-bold">{danadas}</p>
//           </div>
//         </div>

//         {/* Actividad reciente y Alertas */}
//         {/* ... (secciones de Actividad Reciente y Alertas - sin cambios) ... */}
//         <div className="bg-white rounded-xl shadow p-4 mb-8">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">Actividad Reciente</h2>
//            {/* ... (contenido de actividad reciente) ... */}
//         </div>

//         <div className="bg-white rounded-xl shadow p-4 mb-8">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">Alertas</h2>
//            {/* ... (contenido de alertas) ... */}
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default DashboardAdmin;




// // src/pages/DashboardAdmin.js
// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { getTools, getMyLoans } from '../services/api';

// const DashboardAdmin = () => {
//   const [tools, setTools] = useState([]);
//   const [loans, setLoans] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const today = new Date();
//   const formattedDate = today.toLocaleDateString('es-ES', {
//     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [toolsRes, loansRes] = await Promise.all([
//           getTools(),
//           getMyLoans(),
//         ]);
//         setTools(toolsRes.data || []);
//         setLoans(loansRes.data || []);
//       } catch (err) {
//         console.error('Error al cargar datos del dashboard admin:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const total = tools.length;
//   const disponibles = tools.filter(t => t.estado === 'Disponible').length;
//   const enUso = tools.filter(t => t.estado === 'En uso').length;
//   const enReparacion = tools.filter(t => t.estado === 'En reparación').length;
//   const danadas = tools.filter(t => t.estado === 'Dañada').length;

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8">
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
//           <p className="text-sm text-gray-500">{formattedDate}</p>
//         </div>

//         {/* Tarjetas de conteo */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
//           <div className="bg-blue-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">Total Herramientas</p>
//             <p className="text-3xl font-bold">{total}</p>
//           </div>
//           <div className="bg-green-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">Disponibles</p>
//             <p className="text-3xl font-bold">{disponibles}</p>
//           </div>
//           <div className="bg-yellow-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">En Préstamo</p>
//             <p className="text-3xl font-bold">{enUso}</p>
//           </div>
//           <div className="bg-orange-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">En Reparación</p>
//             <p className="text-3xl font-bold">{enReparacion}</p>
//           </div>
//           <div className="bg-red-400 text-white p-4 rounded-xl shadow-md">
//             <p className="text-sm">Dañadas</p>
//             <p className="text-3xl font-bold">{danadas}</p>
//           </div>
//         </div>

//         {/* Actividad reciente */}
//         <div className="bg-white rounded-xl shadow p-4 mb-8">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">Actividad Reciente</h2>
//           {loading ? (
//             <p className="text-gray-500">Cargando actividad...</p>
//           ) : loans.length === 0 ? (
//             <p className="text-gray-500">No hay préstamos recientes.</p>
//           ) : (
//             <ul className="divide-y divide-gray-200">
//               {loans.slice(0, 5).map((loan) => (
//                 <li key={loan._id} className="py-3">
//                   <p className="text-sm text-gray-800 font-medium">
//                     {loan.user?.name || 'Usuario'} solicitó {loan.tool?.name || 'herramienta'}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {new Date(loan.createdAt).toLocaleString('es-ES')}
//                   </p>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         {/* Alertas */}
//         <div className="bg-white rounded-xl shadow p-4">
//           <h2 className="text-lg font-semibold text-gray-700 mb-4">Alertas</h2>
//           {loans.filter(l => new Date(l.expectedReturn) < new Date()).length > 0 ? (
//             <ul className="list-disc list-inside text-sm text-red-600 space-y-2">
//               {loans
//                 .filter(l => new Date(l.expectedReturn) < new Date())
//                 .map((late) => (
//                   <li key={late._id}>{late.tool?.name || 'Herramienta'} no ha sido devuelta</li>
//                 ))}
//             </ul>
//           ) : (
//             <p className="text-sm text-gray-500">Sin alertas por ahora</p>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default DashboardAdmin;
