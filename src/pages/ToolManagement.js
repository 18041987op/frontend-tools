// src/pages/ToolManagement.js
import React, { useState } from 'react'; // No necesitas useEffect aquí si AdminRoute protege
import { useNavigate } from 'react-router-dom'; // useNavigate podría ser útil aún
import Layout from '../components/Layout';
import { createTool } from '../services/api';
import QRCode from 'react-qr-code';

const ToolManagement = () => {
  const navigate = useNavigate(); // Mantenemos navigate por si se usa en el futuro
  const [formData, setFormData] = useState({
    name: '',
    category: 'diagnostico',
    serialNumber: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrToolId, setQrToolId] = useState('');
  const [qrToolName, setQrToolName] = useState('');
  const [createdTool, setCreatedTool] = useState(null);

  // La verificación de isAdmin ya no es necesaria aquí, AdminRoute lo hace.
  // const user = JSON.parse(localStorage.getItem('user') || '{}');
  // const isAdmin = user.role === 'admin';

  // Función para generar QR (sin cambios)
  const handleGenerateQR = (toolId, toolName) => {
    setQrToolId(toolId);
    setQrToolName(toolName);
    setShowQR(true);
  };

  // Función para descargar QR (sin cambios, pero revisa el ID)
  const handleDownloadQR = () => {
    const svgElement = document.getElementById('qr-code-svg'); // ID específico del SVG en el modal
    if (!svgElement) {
        console.error("Elemento SVG del QR no encontrado para descarga.");
        alert("Error al preparar la descarga del QR.");
        return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
        const svgSize = svgElement.getBoundingClientRect();
        canvas.width = svgSize.width || 256; // Usar tamaño o fallback
        canvas.height = svgSize.height || 256;
        ctx.fillStyle = "#FFFFFF"; // Fondo blanco por si acaso
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png")
                              .replace("image/png", "image/octet-stream");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-${qrToolName.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };
     img.onerror = () => {
      console.error("Error al cargar el SVG en la imagen para descarga.");
       alert("Error al generar imagen para descarga.");
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // La verificación isAdmin ya no es necesaria aquí
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Podríamos querer añadir addedBy aquí si el backend lo espera
      // const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      // const response = await createTool({ ...formData, addedBy: userId });
      const response = await createTool(formData);

      setSuccess('Herramienta creada exitosamente');
      setCreatedTool(response.data);
      setFormData({
        name: '',
        category: 'diagnostico',
        serialNumber: '',
        location: '',
        description: ''
      });
    } catch (err) {
      setError(err.message || 'Error al crear la herramienta');
    } finally {
      setLoading(false);
    }
  };

  // El useEffect y el if(!isAdmin) para redirección han sido eliminados
  // porque AdminRoute se encarga de eso.

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Administración de Herramientas</h1>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna del Formulario */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Agregar Nueva Herramienta</h2>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex justify-between items-center">
                <span>{success}</span>
                {createdTool && (
                  <button
                    onClick={() => handleGenerateQR(createdTool._id, createdTool.name)}
                    className="ml-4 text-blue-600 hover:text-blue-800 font-semibold"
                    aria-label="Generar Código QR"
                  >
                    Generar QR
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Campo Nombre */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Nombre de la Herramienta
                </label>
                <input
                  type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ej: Scanner OBD2 Autel"
                />
              </div>

              {/* Campo Categoría */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Categoría
                </label>
                <select
                  id="category" name="category" value={formData.category} onChange={handleChange} required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                   {/* Las opciones actualizadas */}
                   <option value="diagnostico">Diagnóstico</option>
                   <option value="manuales">Herramientas Manuales</option>
                   <option value="electricas">Herramientas Eléctricas</option>
                   <option value="neumaticas">Herramientas Neumáticas</option>
                   <option value="medicion">Herramientas de Medición</option>
                   <option value="motor_transmision">Motor y Transmisión</option>
                   <option value="suspension_frenos">Suspensión, Dirección y Frenos</option>
                   <option value="aire_acondicionado">Aire Acondicionado (A/C)</option>
                   <option value="neumaticos_ruedas">Neumáticos y Ruedas</option>
                   <option value="manejo_fluidos">Manejo de Fluidos</option>
                   <option value="elevacion_soporte">Equipos de Elevación y Soporte</option>
                   <option value="otros">Otros / Misceláneos</option>
                </select>
              </div>

              {/* Campo Número de Serie */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serialNumber">
                  Número de Serie (Opcional pero recomendado)
                </label>
                <input
                  type="text" id="serialNumber" name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ej: AUTL-MX808-12345"
                />
              </div>

              {/* Campo Ubicación */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                  Ubicación
                </label>
                <input
                  type="text" id="location" name="location" value={formData.location} onChange={handleChange} required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Ej: Gabinete 3, Estante B"
                />
              </div>

              {/* Campo Descripción */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Descripción (Opcional)
                </label>
                <textarea
                  id="description" name="description" value={formData.description} onChange={handleChange} rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Detalles adicionales sobre la herramienta..."
                />
              </div>

              {/* Botón Guardar */}
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Herramienta'}
                </button>
              </div>
            </form>
          </div>

          {/* Columna de Instrucciones */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Instrucciones</h2>
             <p className="mb-4">
              Utilice este formulario para añadir nuevas herramientas al inventario del taller.
            </p>
            <p className="mb-4">
              <strong>Campos requeridos:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Nombre de la herramienta</li>
              <li>Categoría</li>
              <li>Ubicación en el taller</li>
            </ul>
             <p>El número de serie y la descripción son opcionales pero muy recomendados.</p>
          </div>
        </div>

        {/* Modal de código QR */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4 text-center">Código QR para {qrToolName}</h2>
              <div className="flex justify-center mb-4 bg-white p-4 rounded">
                {/* Contenedor extra para la descarga */}
                 <div id="qr-container-for-download">
                     <QRCode
                       id="qr-code-svg" // Asegúrate que este ID sea único si el modal se renderiza multiples veces o usa refs
                       value={`${window.location.origin}/tools/${qrToolId}`}
                       size={256}
                       level="H"
                       bgColor="#FFFFFF"
                       fgColor="#000000"
                       // title={qrToolName} // title no es un prop estándar de react-qr-code
                     />
                 </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Escanea este código para ver los detalles de la herramienta.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowQR(false)}
                  className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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

export default ToolManagement;





// src/pages/ToolManagement.js

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { createTool } from '../services/api';
// import QRCode from 'react-qr-code';


// const ToolManagement = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: '',
//     category: 'diagnostico',
//     serialNumber: '',
//     location: '',
//     description: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [showQR, setShowQR] = useState(false);
//   const [qrToolId, setQrToolId] = useState('');
//   const [qrToolName, setQrToolName] = useState('');
//   const [createdTool, setCreatedTool] = useState(null);

//   // Verificar si el usuario es administrador
//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   const isAdmin = user.role === 'admin';


// // Función para generar QR
// const handleGenerateQR = (toolId, toolName) => {
//   setQrToolId(toolId);
//   setQrToolName(toolName);
//   setShowQR(true);
// };

// // Función para descargar QR
// const handleDownloadQR = () => {
//   const canvas = document.getElementById('qr-code');
//   const pngUrl = canvas
//     .toDataURL('image/png')
//     .replace('image/png', 'image/octet-stream');
  
//   const downloadLink = document.createElement('a');
//   downloadLink.href = pngUrl;
//   downloadLink.download = `qr-${qrToolName.replace(/\s+/g, '-').toLowerCase()}.png`;
//   document.body.appendChild(downloadLink);
//   downloadLink.click();
//   document.body.removeChild(downloadLink);
// };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevState => ({
//       ...prevState,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!isAdmin) {
//       setError('No tienes permisos para realizar esta acción');
//       return;
//     }
    
//     try {
//       setLoading(true);
//       setError('');
//       setSuccess('');
      
//       const response = await createTool(formData);
      
//       setSuccess('Herramienta creada exitosamente');
//       setCreatedTool(response.data); // Guardar la herramienta creada
      
//       // Limpiar el formulario
//       setFormData({
//         name: '',
//         category: 'diagnostico',
//         serialNumber: '',
//         location: '',
//         description: ''
//       });
//     } catch (err) {
//       setError(err.message || 'Error al crear la herramienta');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Redirigir si no es admin
//   if (!isAdmin) {
//     return (
//       <Layout>
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//           <p>No tienes permisos para acceder a esta página.</p>
//           <button 
//             className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
//             onClick={() => navigate('/dashboard')}
//           >
//             Volver al Dashboard
//           </button>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div>
//         <h1 className="text-2xl font-bold mb-6">Administración de Herramientas</h1>
        
//         <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="bg-white p-6 rounded shadow">
//             <h2 className="text-xl font-semibold mb-4">Agregar Nueva Herramienta</h2>
            
//             {error && (
//               <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//                 {error}
//               </div>
//             )}
            
//             {success && (
//               <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
//                 {success}
//                 {createdTool && (
//                   <button
//                     onClick={() => handleGenerateQR(createdTool._id, createdTool.name)}
//                     className="ml-4 text-blue-500 hover:text-blue-700"
//                   >
//                     Generar QR
//                   </button>
//                 )}
//               </div>
//             )}
            
//             <form onSubmit={handleSubmit}>
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
//                   Nombre de la Herramienta
//                 </label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   placeholder="Scanner OBD2 Autel"
//                   required
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
//                   Categoría
//                 </label>
//                 <select
//                   id="category"
//                   name="category"
//                   value={formData.category}
//                   onChange={handleChange}
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   required
//                 >
//                   <option value="diagnostico">Diagnóstico</option>
//                   <option value="electricidad">Electricidad</option>
//                   <option value="mecanica">Mecánica</option>
//                   <option value="aire_acondicionado">Aire Acondicionado</option>
//                   <option value="neumaticos">Neumáticos</option>
//                   <option value="otros">Otros</option>
//                 </select>
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serialNumber">
//                   Número de Serie
//                 </label>
//                 <input
//                   type="text"
//                   id="serialNumber"
//                   name="serialNumber"
//                   value={formData.serialNumber}
//                   onChange={handleChange}
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   placeholder="SCAN-001"
//                   required
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
//                   Ubicación
//                 </label>
//                 <input
//                   type="text"
//                   id="location"
//                   name="location"
//                   value={formData.location}
//                   onChange={handleChange}
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   placeholder="Estante 3, Sección B"
//                   required
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
//                   Descripción
//                 </label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                   placeholder="Descripción detallada de la herramienta..."
//                   rows="3"
//                 />
//               </div>
              
//               <div className="flex items-center justify-end">
//                 <button
//                   type="submit"
//                   className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                   disabled={loading}
//                 >
//                   {loading ? 'Guardando...' : 'Guardar Herramienta'}
//                 </button>
//               </div>
//             </form>
//           </div>
          
//           <div className="bg-white p-6 rounded shadow">
//             <h2 className="text-xl font-semibold mb-4">Instrucciones</h2>
//             <p className="mb-4">
//               Utilice este formulario para añadir nuevas herramientas al inventario del taller.
//             </p>
//             <p className="mb-4">
//               <strong>Campos requeridos:</strong>
//             </p>
//             <ul className="list-disc pl-5 space-y-1 mb-4">
//               <li>Nombre de la herramienta</li>
//               <li>Categoría</li>
//               <li>Número de serie (debe ser único)</li>
//               <li>Ubicación en el taller</li>
//             </ul>
//             <p>
//               La descripción es opcional pero recomendada para proporcionar información adicional.
//             </p>
//           </div>
//         </div>
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

// export default ToolManagement;