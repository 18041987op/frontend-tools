// src/pages/EditTool.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getToolById, updateTool } from '../services/api'; // Usar getToolById que ya existe
import { uploadToolImage } from '../services/storage'; // ⬅️ NUEVO: helper para subir a Firebase

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#6b7280">
        Sin imagen
      </text>
    </svg>
  `);

const EditTool = () => {
  const { id: toolId } = useParams(); // Obtener ID de la URL
  const navigate = useNavigate();

  const [toolData, setToolData] = useState({
    name: '',
    category: 'otros', // Default inicial
    serialNumber: '',
    location: '',
    description: ''
    // NO incluimos 'status' aquí, se maneja en otra parte (MaintenanceTools)
  });
  const [currentImage, setCurrentImage] = useState(''); // ⬅️ NUEVO: URL actual
  const [imageFile, setImageFile] = useState(null);     // ⬅️ NUEVO: archivo seleccionado
  const [imagePreview, setImagePreview] = useState(''); // ⬅️ NUEVO: preview local

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos de la herramienta al montar
  useEffect(() => {
    const fetchToolData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getToolById(toolId);
        if (response.success && response.data) {
          // Poblar el estado del formulario con los datos actuales
          setToolData({
            name: response.data.name || '',
            category: response.data.category || 'otros',
            serialNumber: response.data.serialNumber || '',
            location: response.data.location || '',
            description: response.data.description || ''
          });
          setCurrentImage(response.data.image || ''); // ⬅️ NUEVO
          setImagePreview('');                        // limpiar preview si lo hubiera
          setImageFile(null);
        } else {
          setError('No se pudieron cargar los datos de la herramienta.');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar datos de la herramienta.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchToolData();
  }, [toolId]); // Dependencia: toolId

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setToolData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // 1) Actualizar datos básicos primero (sin tocar status)
      const baseUpdate = {
        name: toolData.name,
        category: toolData.category,
        serialNumber: toolData.serialNumber || undefined,
        location: toolData.location,
        description: toolData.description || ''
      };

      await updateTool(toolId, baseUpdate);

      // 2) Si seleccionaron NUEVA imagen, subirla a Storage y luego guardar URL en backend
      if (imageFile) {
        const url = await uploadToolImage(imageFile, toolId); // sube a /tools/<id>/...
        await updateTool(toolId, { image: url });             // guarda en campo "image"
      }

      setSuccess('Herramienta actualizada con éxito.');
      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        navigate(`/tools/${toolId}`); // Volver a la página de detalles
      }, 1200);

    } catch (err) {
      setError(err.message || 'Error al actualizar la herramienta.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado
  if (loading) {
    return <Layout><p className="p-4 text-center text-slate-500">Cargando datos de la herramienta...</p></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 text-primary-600 hover:underline">
           &larr; Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Herramienta</h1>

        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{success}</p>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          {/* Imagen actual + carga de nueva imagen (opcional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Imagen Actual</label>
            <div className="mt-2 w-full rounded-lg overflow-hidden bg-slate-100" style={{ aspectRatio: '16 / 9' }}>
              <img
                src={imagePreview || currentImage || PLACEHOLDER_IMG}
                alt={toolData.name || 'Tool image'}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
              />
            </div>

            <label htmlFor="image" className="block text-sm font-medium text-slate-700 mt-3">Reemplazar imagen (opcional)</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-slate-700"
              onChange={(e) => {
                const f = (e.target.files && e.target.files[0]) || null; // evita ?.[] por compatibilidad
                setImageFile(f);
                setImagePreview(f ? URL.createObjectURL(f) : '');
              }}
            />
            <p className="text-xs text-slate-500 mt-1">Formatos: JPG/PNG. Tamaño máx: 5MB.</p>
          </div>

          {/* Campo Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre:</label>
            <input
              type="text" id="name" name="name" required
              value={toolData.name} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Campo Categoría */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700">Categoría:</label>
            <select
              id="category" name="category" value={toolData.category} onChange={handleChange} required
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {/* Usar las mismas opciones que en ToolManagement.js */}
              <option value="diagnostico">Diagnóstico</option>
              <option value="manuales">Herramientas Manuales</option>
              <option value="electricas">Herramientas Eléctricas</option>
              <option value="neumaticas">Herramientas Neumáticas</option>
              <option value="electricas_neumaticas">Herramientas Eléctricas y Neumáticas</option>
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
          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-slate-700">Número de Serie:</label>
            <input
              type="text" id="serialNumber" name="serialNumber"
              value={toolData.serialNumber} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Campo Ubicación */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-700">Ubicación:</label>
            <input
              type="text" id="location" name="location" required
              value={toolData.location} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Campo Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción:</label>
            <textarea
              id="description" name="description" rows="3"
              value={toolData.description} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditTool;


// // src/pages/EditTool.js
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { getToolById, updateTool } from '../services/api'; // Usar getToolById que ya existe

// const EditTool = () => {
//   const { id: toolId } = useParams(); // Obtener ID de la URL
//   const navigate = useNavigate();

//   const [toolData, setToolData] = useState({
//     name: '',
//     category: 'otros', // Default inicial
//     serialNumber: '',
//     location: '',
//     description: ''
//     // NO incluimos 'status' aquí, se maneja en otra parte (MaintenanceTools)
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Cargar datos de la herramienta al montar
//   useEffect(() => {
//     const fetchToolData = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const response = await getToolById(toolId);
//         if (response.success && response.data) {
//           // Poblar el estado del formulario con los datos actuales
//           setToolData({
//             name: response.data.name || '',
//             category: response.data.category || 'otros',
//             serialNumber: response.data.serialNumber || '',
//             location: response.data.location || '',
//             description: response.data.description || ''
//           });
//         } else {
//           setError('No se pudieron cargar los datos de la herramienta.');
//         }
//       } catch (err) {
//         setError(err.message || 'Error al cargar datos de la herramienta.');
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchToolData();
//   }, [toolId]); // Dependencia: toolId

//   // Manejar cambios en el formulario
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setToolData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Manejar envío del formulario
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');
//     setSuccess('');
//     try {
//       // Enviar solo los datos del formulario (sin status)
//       const response = await updateTool(toolId, toolData);
//       setSuccess(response.message || 'Herramienta actualizada con éxito.');
//       // Opcional: redirigir después de un tiempo
//       setTimeout(() => {
//         navigate(`/tools/${toolId}`); // Volver a la página de detalles
//       }, 1500);

//     } catch (err) {
//       setError(err.message || 'Error al actualizar la herramienta.');
//       console.error(err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Renderizado
//   if (loading) {
//     return <Layout><p className="p-4 text-center text-slate-500">Cargando datos de la herramienta...</p></Layout>;
//   }

//   return (
//     <Layout>
//       <div className="p-4 sm:p-6 md:p-8 max-w-lg mx-auto">
//         <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">
//            &larr; Volver
//         </button>
//         <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Herramienta</h1>

//         {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
//         {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{success}</p>}

//         <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
//           {/* Campo Nombre */}
//           <div>
//             <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre:</label>
//             <input
//               type="text" id="name" name="name" required
//               value={toolData.name} onChange={handleChange}
//               className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
//            {/* Campo Categoría */}
//            <div>
//              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría:</label>
//              <select
//                id="category" name="category" value={toolData.category} onChange={handleChange} required
//                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//              >
//                 {/* Usar las mismas opciones que en ToolManagement.js */}
//                 <option value="diagnostico">Diagnóstico</option>
//                 <option value="manuales">Herramientas Manuales</option>
//                 <option value="electricas">Herramientas Eléctricas</option>
//                 <option value="neumaticas">Herramientas Neumáticas</option>
//                 <option value="medicion">Herramientas de Medición</option>
//                 <option value="motor_transmision">Motor y Transmisión</option>
//                 <option value="suspension_frenos">Suspensión, Dirección y Frenos</option>
//                 <option value="aire_acondicionado">Aire Acondicionado (A/C)</option>
//                 <option value="neumaticos_ruedas">Neumáticos y Ruedas</option>
//                 <option value="manejo_fluidos">Manejo de Fluidos</option>
//                 <option value="elevacion_soporte">Equipos de Elevación y Soporte</option>
//                 <option value="otros">Otros / Misceláneos</option>
//              </select>
//            </div>
//            {/* Campo Número de Serie */}
//            <div>
//              <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Número de Serie:</label>
//              <input
//                type="text" id="serialNumber" name="serialNumber"
//                value={toolData.serialNumber} onChange={handleChange}
//                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//              />
//            </div>
//            {/* Campo Ubicación */}
//             <div>
//              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación:</label>
//              <input
//                type="text" id="location" name="location" required
//                value={toolData.location} onChange={handleChange}
//                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//              />
//            </div>
//            {/* Campo Descripción */}
//            <div>
//              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción:</label>
//              <textarea
//                id="description" name="description" rows="3"
//                value={toolData.description} onChange={handleChange}
//                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//              />
//            </div>

//            {/* Botón Guardar */}
//            <div className="flex justify-end">
//              <button
//                type="submit"
//                disabled={isSubmitting}
//                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//              >
//                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
//              </button>
//            </div>
//         </form>
//       </div>
//     </Layout>
//   );
// };

// export default EditTool;