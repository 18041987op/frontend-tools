// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
// Importar Link
import { Link, useNavigate } from 'react-router-dom';
import { getMyLoans } from '../services/api';

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Para errores de carga
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError(''); // Limpiar errores
      try {
        const response = await getMyLoans();
        // Asegurarse de que solo procesamos préstamos activos aquí si la API no lo hizo
        setLoans(response.data?.filter(loan => loan.status === 'active') || []);
      } catch (error) {
        console.error('Error al cargar herramientas:', error);
        setError('No se pudieron cargar tus herramientas prestadas.'); // Mensaje de error
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // --- NUEVA FUNCIÓN: Formatear tiempo restante/vencido ---
  const formatTimeRemaining = (expectedReturn) => {
    const now = new Date();
    const returnDate = new Date(expectedReturn);
    const diffTime = returnDate.getTime() - now.getTime(); // Diferencia en milisegundos

    const totalMinutes = Math.floor(diffTime / (1000 * 60));
    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Ceil para días restantes

    if (totalMinutes < 0) {
      // Vencido
      const overdueSeconds = Math.abs(Math.floor(diffTime / 1000));
      if (overdueSeconds < 3600 * 2) { // Menos de 2 horas vencido
        return { text: `Retraso (${Math.floor(overdueSeconds / 60)}m)`, status: 'overdue' };
      } else if (overdueSeconds < 86400 * 2) { // Menos de 2 días vencido
        return { text: `Retraso (${Math.floor(overdueSeconds / 3600)}h)`, status: 'overdue' };
      } else { // Vencido por 2 días o más
        return { text: `Retraso (${Math.floor(overdueSeconds / 86400)}d)`, status: 'overdue' };
      }
    } else if (totalMinutes < 60) {
      // Vence en menos de 1 hora
      return { text: `Vence en ${totalMinutes}m`, status: 'dueSoon' }; // Urgente
    } else if (totalHours < 6) {
        // Vence en menos de 6 horas
      return { text: `Vence en ${totalHours}h`, status: 'dueSoon' }; // Urgente
    } else if (totalHours < 24) {
      // Vence hoy (más de 6 horas restantes)
      return { text: `Vence hoy (${totalHours}h)`, status: 'dueToday' }; // Menos urgente
    } else if (totalDays === 1) {
        // Vence mañana
      return { text: `Vence mañana`, status: 'safe' };
    } else {
      // Vence en más de 1 día
      return { text: `Quedan ${totalDays}d`, status: 'safe' };
    }
  };

  // --- NUEVA FUNCIÓN: Obtener clase de color según estado del tiempo ---
  const getStatusColorClass = (status) => {
      switch (status) {
          case 'overdue': return 'text-red-600';
          case 'dueSoon': return 'text-orange-500'; // Naranja para urgencia alta
          case 'dueToday': return 'text-yellow-600'; // Amarillo para urgencia media
          case 'safe': return 'text-green-600';
          default: return 'text-gray-500';
      }
  };

  // Datos mockeados para Herramientas Populares (actualizados para incluir término de búsqueda)
  // En una implementación real, esto vendría del backend
  const popularTools = [
    { name: "Scanner OBD2", searchTerm: "Scanner OBD2 Autel MaxiCOM MK808" }, // Usar nombre completo para búsqueda
    { name: "Multímetro", searchTerm: "Multímetro Digital Fluke 87V" },
    { name: "Cargador A/C", searchTerm: "Juego Manómetros A/C R134a" } // Ejemplo, ajustar al nombre real
  ];


  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        {/* Saludo y Fecha */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Hola, {user.name || 'Técnico'} 👋</h1>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>

        {/* Mostrar error si existe */}
         {error && (
           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
             {error}
           </div>
         )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Mis Herramientas Actuales */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Mis Herramientas Actuales</h2>
              {loading ? (
                <p className="text-gray-500">Cargando herramientas...</p>
              ) : loans.length === 0 ? (
                <p className="text-gray-500">No tienes herramientas prestadas.</p>
              ) : (
                <div className="space-y-4">
                  {/* MODIFICADO: Iterar y hacer clickables las tarjetas */}
                  {loans.map((loan) => {
                     console.log(`DEBUG Loan ID: ${loan._id}, Expected Return RAW: ${loan.expectedReturn}, Type: ${typeof loan.expectedReturn}`);
                    // Calcular tiempo y estado
                    const timeInfo = formatTimeRemaining(loan.expectedReturn);
                    console.log(`DEBUG Loan ID: ${loan._id}, Calculated Time Info:`, timeInfo);

                    const colorClass = getStatusColorClass(timeInfo.status);

                    return (
                      <Link
                        key={loan._id}
                        to={`/tools/${loan.tool?._id}`} // Enlace al detalle de la herramienta
                        className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label={`Ver detalles de ${loan.tool?.name || 'herramienta'}`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                           {/* Info de la herramienta */}
                           <div>
                            <p className="font-medium text-gray-800">{loan.tool?.name || 'Herramienta no encontrada'}</p>
                            <p className="text-sm text-gray-500">
                                Loc: {loan.tool?.location || 'N/A'}
                                {loan.tool?.serialNumber && ` - S/N: ${loan.tool.serialNumber}`}
                             </p>
                          </div>
                          {/* Indicador de tiempo restante/vencido */}
                          <p className={`text-sm font-semibold mt-2 sm:mt-0 ${colorClass}`}>
                            {timeInfo.text}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Alertas */}
          <div>
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Alertas</h2>
               {/* La lógica de alertas ahora se basa en el cálculo de tiempo */}
               {!loading && loans.filter(l => formatTimeRemaining(l.expectedReturn).status === 'overdue').length > 0 ? (
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {loans
                    .filter(l => formatTimeRemaining(l.expectedReturn).status === 'overdue')
                    .map((late) => (
                      <li key={`alert-${late._id}`}>
                         {late.tool?.name || 'Herramienta'} vencida.
                      </li>
                    ))}
                </ul>
              ) : loading ? (
                 <p className="text-sm text-gray-500 italic">Cargando...</p>
              ) : (
                <p className="text-sm text-gray-500 italic">Sin alertas por ahora.</p>
              )}
            </div>
          </div>
        </div>

        {/* Herramientas populares (Ahora son links a búsqueda) */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Herramientas Populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularTools.map((tool, idx) => (
              <Link
                key={idx}
                to={`/catalog?search=${encodeURIComponent(tool.searchTerm)}`} // Enlace a búsqueda
                className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label={`Buscar ${tool.name}`}
              >
                <div className="h-20 bg-blue-100 rounded mb-2 flex items-center justify-center text-blue-500">
                   {/* Podrías poner un icono genérico aquí si quieres */}
                  Imagen Placeholder
                </div>
                <p className="text-sm text-gray-700 font-medium">{tool.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;


// // src/pages/Dashboard.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { getTools } from '../services/api';

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     total: 0,
//     borrowed: 0,
//     available: 0,
//     maintenance: 0,
//     damaged: 0
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
  
//   // Verificar si el usuario es administrador
//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   const isAdmin = user.role === 'admin';

//   useEffect(() => {
//     // Función para cargar estadísticas
//     const loadStats = async () => {
//       try {
//         setLoading(true);
//         // Obtener todas las herramientas
//         const response = await getTools();
//         const tools = response.data || [];
        
//         // Calcular estadísticas
//         const newStats = {
//           total: tools.length,
//           borrowed: tools.filter(tool => tool.status === 'borrowed').length,
//           available: tools.filter(tool => tool.status === 'available').length,
//           maintenance: tools.filter(tool => tool.status === 'maintenance').length,
//           damaged: tools.filter(tool => tool.status === 'damaged').length
//         };
        
//         setStats(newStats);
//         setError('');
//       } catch (err) {
//         setError('Error al cargar estadísticas');
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadStats();
//   }, []);

//   return (
//     <Layout>
//       <div>
//         <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//             {error}
//           </div>
//         )}
        
//         {loading ? (
//           <div className="text-center py-4">
//             <p className="text-gray-500">Cargando estadísticas...</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {/* Tarjeta de estadísticas - Herramientas Totales */}
//             <div className="bg-white p-4 rounded shadow">
//               <h2 className="text-lg font-semibold text-gray-700">Herramientas Totales</h2>
//               <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
//             </div>
            
//             {/* Tarjeta de estadísticas - Herramientas Prestadas */}
//             <div className="bg-white p-4 rounded shadow">
//               <h2 className="text-lg font-semibold text-gray-700">Prestadas</h2>
//               <p className="text-3xl font-bold text-orange-500">{stats.borrowed}</p>
//             </div>
      
//             {/* Tarjeta de estadísticas - Herramientas Disponibles */}
//             <div className="bg-white p-4 rounded shadow">
//               <h2 className="text-lg font-semibold text-gray-700">Disponibles</h2>
//               <p className="text-3xl font-bold text-green-500">{stats.available}</p>
//             </div>
            
//             {/* Tarjeta de estadísticas - Herramientas en Mantenimiento */}
//             <div className="bg-white p-4 rounded shadow">
//               <h2 className="text-lg font-semibold text-gray-700">En Mantenimiento</h2>
//               <p className="text-3xl font-bold text-yellow-500">{stats.maintenance}</p>
//               {isAdmin && stats.maintenance > 0 && (
//                 <Link to="/admin/maintenance" className="text-sm text-blue-500 hover:underline">
//                   Ver herramientas en mantenimiento
//                 </Link>
//               )}
//             </div>
            
//             {/* Tarjeta de estadísticas - Herramientas Dañadas */}
//             <div className="bg-white p-4 rounded shadow">
//               <h2 className="text-lg font-semibold text-gray-700">Dañadas</h2>
//               <p className="text-3xl font-bold text-red-500">{stats.damaged}</p>
//               {isAdmin && stats.damaged > 0 && (
//                 <Link to="/admin/maintenance" className="text-sm text-blue-500 hover:underline">
//                   Ver herramientas dañadas
//                 </Link>
//               )}
//             </div>
//           </div>
//         )}
//         {/* Actividad Reciente */}
//         <div className="mt-6 bg-white p-4 rounded shadow">
//           <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
//           <div className="space-y-3">
//             <div className="border-b pb-2">
//               <p className="text-sm text-gray-600">Hace 2 horas</p>
//               <p>Juan Pérez solicitó Scanner OBD2</p>
//             </div>
//             <div className="border-b pb-2">
//               <p className="text-sm text-gray-600">Hace 3 horas</p>
//               <p>María López devolvió Multímetro</p>
//             </div>
//             <div className="border-b pb-2">
//               <p className="text-sm text-gray-600">Ayer</p>
//               <p>Carlos Gómez reportó daño en Tester de Batería</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default Dashboard;