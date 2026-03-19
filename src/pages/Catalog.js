

//src/pages/Catalog.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getTools } from '../services/api';
import { useNavigate } from 'react-router-dom';
// Importa los iconos necesarios (actualizados)
import {
  FaWrench, FaTools, FaSnowflake, FaBolt, FaMicroscope, FaRulerCombined,
  FaOilCan, FaCarCrash, FaCog, FaDotCircle, FaChevronDown, FaChevronUp,
  FaWind, FaHardHat, FaCarBattery // <-- NUEVOS/REASIGNADOS
} from 'react-icons/fa';

const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial" font-size="24" fill="#6b7280">
        Sin imagen
      </text>
    </svg>
  `);

// Mapeo de slugs de categoría a nombres legibles, iconos y COLORES
// AJUSTA ESTOS SEGÚN TUS PREFERENCIAS
const categoryDetails = {
  'diagnostico': { name: 'Diagnóstico', icon: <FaMicroscope size={28} className="text-primary-500" /> },
  'manuales': { name: 'Herramientas Manuales', icon: <FaTools size={28} className="text-slate-700" /> },
  // SEPARADOS:
  'electricas': { name: 'Herramientas Eléctricas', icon: <FaCarBattery size={28} className="text-yellow-500" /> }, // <-- Icono Batería
  'neumaticas': { name: 'Herramientas Neumáticas', icon: <FaWind size={28} className="text-cyan-500" /> },       // <-- Icono Viento (Aire)
  'electricas_neumaticas': {name: 'Herramientas Eléctricas y Neumáticas', icon: <FaBolt className="text-purple-500" size={24} />,color: 'purple'},
  'medicion': { name: 'Herramientas de Medición', icon: <FaRulerCombined size={28} className="text-purple-500" /> },
  'motor_transmision': { name: 'Motor y Transmisión', icon: <FaCog size={28} className="text-orange-500" /> },
  'suspension_frenos': { name: 'Suspensión, Dirección y Frenos', icon: <FaCarCrash size={28} className="text-red-500" /> },
  'aire_acondicionado': { name: 'Aire Acondicionado (A/C)', icon: <FaSnowflake size={28} className="text-primary-300" /> }, // Color ajustado para diferenciar
  'neumaticos_ruedas': { name: 'Neumáticos y Ruedas', icon: <FaDotCircle size={28} className="text-lime-600" /> },
  'manejo_fluidos': { name: 'Manejo de Fluidos', icon: <FaOilCan size={28} className="text-teal-500" /> },
  'elevacion_soporte': { name: 'Equipos de Elevación y Soporte', icon: <FaHardHat size={28} className="text-indigo-500" /> }, // <-- Icono Casco
  'otros': { name: 'Otros / Misceláneos', icon: <FaWrench size={28} className="text-slate-500" /> },
};

const Catalog = () => {
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = useState([]);

  // Fetch inicial de herramientas
  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      try {
        const res = await getTools();
        const toolsData = res.data || [];
        setTools(toolsData);
        setFilteredTools(toolsData);
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
         setLoading(false);
      }
    };
    fetchTools();
  }, []);

  // Efecto para filtrar herramientas
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = tools.filter((tool) =>
      (tool.name || '').toLowerCase().includes(lowerSearch) ||
      (tool.serialNumber || '').toLowerCase().includes(lowerSearch) ||
      (tool.location || '').toLowerCase().includes(lowerSearch) ||
      (categoryDetails[tool.category]?.name || tool.category || '').toLowerCase().includes(lowerSearch)
    );
    setFilteredTools(filtered);
  }, [search, tools]);

  // Agrupar herramientas filtradas por categoría
  const groupedTools = filteredTools.reduce((acc, tool) => {
    // CORRECCIÓN: Manejar el caso antiguo 'electricas_neumaticas' agrupándolo en 'otros' o como prefieras
    let categoryKey = tool.category || 'otros';
    if (categoryKey === 'electricas_neumaticas') {
        // Decide dónde agrupar las herramientas viejas, por ejemplo, en 'otros'
        // O podrías intentar adivinar basado en el nombre, pero es más complejo.
        // Aquí las mandamos a 'otros' por simplicidad.
         console.warn(`Herramienta "${tool.name}" tiene categoría obsoleta 'electricas_neumaticas', movida a 'Otros'`);
         categoryKey = 'otros';
    }

    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(tool);
    return acc;
  }, {});

  // Ordenar categorías
  const sortedCategories = Object.keys(groupedTools).sort((a, b) => {
     const nameA = categoryDetails[a]?.name || a;
     const nameB = categoryDetails[b]?.name || b;
     return nameA.localeCompare(nameB);
  });

  // Función toggle (sin cambios)
  const toggleCategory = (categoryKey) => {
    setOpenCategories(prevOpen =>
        prevOpen.includes(categoryKey)
            ? prevOpen.filter(key => key !== categoryKey)
            : [...prevOpen, categoryKey]
    );
  };

  // Función para color de estado (sin cambios)
  const getStatusColor = (status) => {
     const normalizedStatus = status ? status.toLowerCase() : '';
     switch (normalizedStatus) {
       case 'disponible': case 'available': return 'bg-green-100 text-green-700';
       case 'en uso': case 'borrowed': return 'bg-yellow-100 text-yellow-800';
       case 'dañada': case 'damaged': return 'bg-red-100 text-red-700';
       case 'en reparación': case 'maintenance': case 'in repair': return 'bg-orange-100 text-orange-700';
       default: return 'bg-slate-100 text-slate-600';
     }
   };

  // Renderizado
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Catálogo de Herramientas</h1>

        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por nombre, serial, ubicación, categoría..."
          className="w-full sm:w-96 mb-6 px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-primary-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Contenido principal */}
        {loading ? (
            <p className="text-slate-500 text-center py-10">Cargando herramientas...</p>
        ) : sortedCategories.length === 0 ? (
             <p className="mt-8 text-slate-500 text-center">
                {search ? 'No se encontraron herramientas con ese criterio.' : 'No hay herramientas en el catálogo.'}
            </p>
        ) : (
           sortedCategories.map(categoryKey => {
              const isOpen = openCategories.includes(categoryKey);
              const categoryInfo = categoryDetails[categoryKey] || { name: categoryKey, icon: <FaWrench size={24} className="text-slate-500" /> }; // Fallback
              return (
                <div key={categoryKey} className="mb-6 bg-white rounded-lg shadow overflow-hidden">
                  {/* Título de la Categoría Clickable */}
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full flex justify-between items-center p-4 border-b hover:bg-slate-50 focus:outline-none"
                    aria-expanded={isOpen} // Para accesibilidad
                    aria-controls={`category-content-${categoryKey}`}
                  >
                    <div className="flex items-center">
                      {/* Clonar el icono para ajustar tamaño si es necesario */}
                      {React.cloneElement(categoryInfo.icon, { size: 24, className: `${categoryInfo.icon.props.className} mr-3` })}
                      <span className="ml-0 text-lg font-semibold text-slate-700"> {/* Ajustado ml-0 */}
                        {categoryInfo.name}
                      </span>
                    </div>
                    {isOpen ? <FaChevronUp className="text-slate-500"/> : <FaChevronDown className="text-slate-500"/>}
                  </button>

                  {/* Grid de Herramientas (Condicional) */}
                  {isOpen && (
                    <div id={`category-content-${categoryKey}`} className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {groupedTools[categoryKey].map((tool) => {
                        const toolCategoryInfo = categoryDetails[tool.category] || categoryDetails['otros'];
                        return (
                          <div
                            key={tool._id}
                            className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex flex-col justify-between border border-slate-100"
                          >
                                  {/* ⬇️⬇️⬇️ AGREGAR LA IMAGEN AQUÍ COMO PRIMER ELEMENTO ⬇️⬇️⬇️ */}
                                  <div className="w-full h-48 bg-slate-200 rounded-lg overflow-hidden mb-4">
                                    <img
                                      src={tool.image || PLACEHOLDER_IMG}
                                      alt={tool.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                                    />
                                  </div>
                                  {/* ⬆️⬆️⬆️ FIN DE LA IMAGEN ⬆️⬆️⬆️ */}

                            {/* Encabezado Tarjeta */}
                            <div className="flex items-center justify-between mb-4">
                              {/* Usar el icono de la categoría con su color */}
                              {toolCategoryInfo.icon}
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(tool.status)}`}>
                                {tool.status === 'available' ? 'Disponible' :
                                 tool.status === 'borrowed' ? 'En Uso' :
                                 tool.status === 'damaged' ? 'Dañada' :
                                 tool.status === 'maintenance' ? 'Mantenimiento' :
                                 (tool.status || 'Desconocido')}
                              </span>
                            </div>

                            {/* Contenido Tarjeta */}
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                              {tool.name || 'Sin nombre'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-1">
                              <span className="font-medium text-slate-700">Loc:</span> {tool.location || 'N/A'}
                            </p>
                            {tool.serialNumber && (
                              <p className="text-sm text-slate-500 mb-1">
                                  <span className="font-medium text-slate-700">S/N:</span> {tool.serialNumber}
                              </p>
                             )}

                            {/* Botón */}
                            <button
                              onClick={() => navigate(`/tools/${tool._id}`)}
                              className="mt-4 w-full bg-primary-600 text-white text-sm px-4 py-2 rounded hover:bg-primary-700"
                            >
                              Ver Detalles
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
         )}
      </div>
    </Layout>
  );
};

export default Catalog;



// import React, { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { getTools } from '../services/api';
// import { useNavigate } from 'react-router-dom';
// import { FaWrench, FaTools, FaSnowflake, FaBolt, FaMicroscope } from 'react-icons/fa';
// //import QRCode from 'react-qr-code';
// import { Link } from 'react-router-dom';

// const Catalog = () => {
//   const [tools, setTools] = useState([]);
//   const [filteredTools, setFilteredTools] = useState([]);
//   const [search, setSearch] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchTools = async () => {
//       try {
//         const res = await getTools();
//         setTools(res.data);
//         setFilteredTools(res.data);
//       } catch (error) {
//         console.error('Error fetching tools:', error);
//       }
//     };
//     fetchTools();
//   }, []);

//   useEffect(() => {
//     const filtered = tools.filter((tool) =>
//       (tool.nombre || tool.name || '').toLowerCase().includes(search.toLowerCase())
//     );
//     setFilteredTools(filtered);
//   }, [search, tools]);

//   const getStatusColor = (status) => {
//     const normalizedStatus = status ? status.toLowerCase() : '';
//     switch (status) {
//       case 'Disponible':
//       case 'available':
//         return 'bg-green-100 text-green-700';
//       case 'En uso':
//       case 'borrowed':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'Dañada':
//       case 'Damaged':
//         return 'bg-red-100 text-red-700';
//       case 'En reparación':
//       case 'maintenance':
//         return 'bg-orange-100 text-orange-700';
//       default:
//         return 'bg-gray-100 text-gray-600';
//     }
//   };

//   const getTypeIcon = (type) => {
//     switch (type) {
//       case 'Diagnóstico':
//       case 'Diagnostic':
//         return <FaMicroscope size={28} className="text-blue-500" />;
//       case 'Eléctrica':
//       case 'Electric':
//         return <FaBolt size={28} className="text-yellow-500" />;
//       case 'Manual':
//         return <FaTools size={28} className="text-gray-700" />;
//       case 'A/C':
//         return <FaSnowflake size={28} className="text-cyan-500" />;
//       default:
//         return <FaWrench size={28} className="text-gray-500" />;
//     }
//   };

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8">
//         <h1 className="text-2xl font-bold text-gray-800 mb-4">Tool Catalog</h1>

//         {/* Search bar */}
//         <input
//           type="text"
//           placeholder="Search tool..."
//           className="w-full sm:w-96 mb-6 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         {/* Tool grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {filteredTools.map((tool) => (
//             <div
//               key={tool._id}
//               className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex flex-col justify-between border border-gray-100"
//             >
//               {/* Header with icon and status */}
//               <div className="flex items-center justify-between mb-4">
//                 {getTypeIcon(tool.tipo || tool.type)}
//                 <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(tool.estado || tool.status)}`}>
//                   {tool.estado || tool.status || 'No status'}
//                 </span>
//               </div>

//               {/* Content */}
//               <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                 {tool.nombre || tool.name || 'No name'}
//               </h3>

//               <p className="text-sm text-gray-500 mb-1">
//                 <span className="font-medium text-gray-700">Location:</span> {tool.ubicacion || tool.location || 'Not specified'}
//               </p>
//               <p className="text-sm text-gray-500 mb-4">
//                 <span className="font-medium text-gray-700">Type:</span> {tool.tipo || tool.type || 'General'}
//               </p>

//               <button
//                 onClick={() => navigate(`/tools/${tool._id}`)}
//                 className="mt-auto bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
//               >
//                 View Details
//               </button>
//             </div>
//           ))}
//         </div>

//         {filteredTools.length === 0 && (
//           <p className="mt-8 text-gray-500 text-center">No tools found with that name.</p>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default Catalog;



// <<<-------*****-------------*****-------------*****-------------*****-------------*****-------------*****------>>>>

// // src/pages/Catalog.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { getTools, getLoans } from '../services/api';
// import QRCode from 'react-qr-code';

// const Catalog = () => {
//   const [tools, setTools] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showQR, setShowQR] = useState(false);
//   const [qrToolId, setQrToolId] = useState('');
//   const [qrToolName, setQrToolName] = useState('');

//   // Obtener información del usuario actual
//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   console.log('Tools loaded:', tools); // ESTA LINEA ES TEMPORARIA PARA VERIFICAR QUE LAS HERRAMIENTAS SE CARGUEN CORRECTAMENTE

//   useEffect(() => {
//     // Función para cargar las herramientas
//     const loadTools = async () => {
//       try {
//         setLoading(true);
//         const response = await getTools();
//         const tools = response.data || [];
        
//         // Para cada herramienta prestada, obtener información del técnico
//         for (const tool of tools) {
//           if (tool.status === 'borrowed') {
//             try {
//               const loansResponse = await getLoans({ tool: tool._id, status: 'active' });
//               if (loansResponse.data && loansResponse.data.length > 0) {
//                 tool.currentLoan = loansResponse.data[0];
//               }
//             } catch (err) {
//               console.error(`Error al obtener préstamo para herramienta ${tool._id}`, err);
//             }
//           }
//         }
        
//         setTools(tools);
//         setError('');
//       } catch (err) {
//         setError('Error al cargar herramientas');
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadTools();
//   }, []);

//   // Función para filtrar herramientas por búsqueda (mejorada)
//   const filteredTools = tools.filter(tool => {
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       tool.name.toLowerCase().includes(searchLower) ||
//       tool.category.toLowerCase().includes(searchLower) ||
//       (tool.location && tool.location.toLowerCase().includes(searchLower)) ||
//       (tool.serialNumber && tool.serialNumber.toLowerCase().includes(searchLower))
//     );
//   });

//   // Función para generar QR
//   const handleGenerateQR = (toolId, toolName) => {
//     setQrToolId(toolId);
//     setQrToolName(toolName);
//     setShowQR(true);
//   };

//   // Función para descargar QR
//   const handleDownloadQR = () => {
//     const canvas = document.getElementById('qr-code');
//     const pngUrl = canvas
//       .toDataURL('image/png')
//       .replace('image/png', 'image/octet-stream');
    
//     const downloadLink = document.createElement('a');
//     downloadLink.href = pngUrl;
//     downloadLink.download = `qr-${qrToolName.replace(/\s+/g, '-').toLowerCase()}.png`;
//     document.body.appendChild(downloadLink);
//     downloadLink.click();
//     document.body.removeChild(downloadLink);
//   };

//   // Función auxiliar para determinar si mostrar el botón de transferir
//   const shouldShowTransferOption = (tool) => {
//     return tool.status === 'borrowed' && tool.currentLoan;
//   };

//   return (
//     <Layout>
//       <div>
//         {/* Barra de búsqueda mejorada */}
//         <div className="mb-6">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <h1 className="text-2xl font-bold mb-4 md:mb-0">Catálogo de Herramientas</h1>
            
//             <div className="w-full md:w-auto md:flex-1 md:max-w-md mx-0 md:mx-4">
//               <div className="relative">
//                 <input 
//                   type="text" 
//                   placeholder="Buscar por nombre, categoría, ubicación..." 
//                   className="w-full border rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                 </div>
//                 {searchTerm && (
//                   <button 
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                     onClick={() => setSearchTerm('')}
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   </button>
//                 )}
//               </div>
//             </div>
            
//             <div className="mt-4 md:mt-0">
//               <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
//                 </svg>
//                 Filtrar
//               </button>
//             </div>
//           </div>
          
//           {searchTerm && (
//             <div className="mt-2 text-sm text-gray-600">
//               {filteredTools.length === 0 ? (
//                 <p>No se encontraron herramientas que coincidan con "{searchTerm}"</p>
//               ) : (
//                 <p>Se encontraron {filteredTools.length} herramientas para "{searchTerm}"</p>
//               )}
//             </div>
//           )}
//         </div>

//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//             {error}
//           </div>
//         )}

//         {loading ? (
//           <div className="text-center py-10">
//             <p className="text-gray-500">Cargando herramientas...</p>
//           </div>
//         ) : (
//           <div className="bg-white rounded shadow overflow-x-auto">
//             {filteredTools.length === 0 ? (
//               <div className="text-center py-10">
//                 <p className="text-gray-500">No se encontraron herramientas</p>
//               </div>
//             ) : (
//               <table className="min-w-full">
//                 <thead>
//                   <tr className="bg-gray-200 text-gray-700">
//                     <th className="py-2 px-4 text-left">Nombre</th>
//                     <th className="py-2 px-4 text-left">Categoría</th>
//                     <th className="py-2 px-4 text-left">Estado</th>
//                     <th className="py-2 px-4 text-left">Ubicación</th>
//                     <th className="py-2 px-4 text-left">Acciones</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredTools.map(tool => (
//                     <tr key={tool._id} className="border-b">
//                       <td className="py-2 px-4">{tool.name}</td>
//                       <td className="py-2 px-4">
//                         {tool.category === 'diagnostico' ? 'Diagnóstico' : 
//                          tool.category === 'electricidad' ? 'Electricidad' : 
//                          tool.category === 'mecanica' ? 'Mecánica' : 
//                          tool.category === 'aire_acondicionado' ? 'Aire Acondicionado' : 
//                          tool.category === 'neumaticos' ? 'Neumáticos' : 'Otros'}
//                       </td>
//                       <td className="py-2 px-4">
//                         <span className={`px-2 py-1 rounded text-xs font-semibold ${
//                           tool.status === 'available' ? 'bg-green-100 text-green-800' : 
//                           tool.status === 'borrowed' ? 'bg-red-100 text-red-800' : 
//                           'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {tool.status === 'available' ? 'Disponible' : 
//                            tool.status === 'borrowed' ? 'Prestada' : 
//                            'Mantenimiento'}
//                         </span>
//                         {tool.status === 'borrowed' && tool.currentLoan && (
//                           <div className="text-xs text-gray-600 mt-1">
//                             En uso por: {tool.currentLoan.technician.name}
//                           </div>
//                         )}
//                       </td>
//                       <td className="py-2 px-4">{tool.location}</td>
//                       <td className="py-2 px-4">
//                         <Link to={`/tools/${tool._id}`} className="text-blue-500 hover:text-blue-700 mr-2">
//                           Ver
//                         </Link>
//                         {tool.status === 'available' && (
//                           <Link to={`/tools/${tool._id}`} className="text-green-500 hover:text-green-700 mr-2">
//                             Solicitar
//                           </Link>
//                         )}
//                         {shouldShowTransferOption(tool) && (
//                           <Link to={`/tools/${tool._id}`} className="text-purple-500 hover:text-purple-700 mr-2">
//                             {user._id === tool.currentLoan?.technician._id ? 'Devolver' : 'Solicitar Transferencia'}
//                           </Link>
//                         )}
//                         <button
//                           onClick={() => handleGenerateQR(tool._id, tool.name)}
//                           className="text-purple-500 hover:text-purple-700"
//                         >
//                           QR
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         )}

//         {/* Modal de código QR */}
//         {showQR && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg p-8 max-w-md w-full">
//               <h2 className="text-xl font-semibold mb-4">Código QR para {qrToolName}</h2>
              
//               <div className="flex justify-center mb-4">
//                 <QRCode 
//                   id="qr-code"
//                   value={`${window.location.origin}/tools/${qrToolId}`}
//                   size={200}
//                   level="H"
//                 />
//               </div>
              
//               <p className="text-sm text-gray-600 mb-4 text-center">
//                 Este código QR enlaza directamente a los detalles de la herramienta.
//               </p>
              
//               <div className="flex items-center justify-between">
//                 <button
//                   type="button"
//                   onClick={() => setShowQR(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                 >
//                   Cerrar
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleDownloadQR}
//                   className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                 >
//                   Descargar QR
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default Catalog;