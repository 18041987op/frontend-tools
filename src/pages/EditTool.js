// src/pages/EditTool.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getToolById, updateTool } from '../services/api'; // Usar getToolById que ya existe

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
      // Enviar solo los datos del formulario (sin status)
      const response = await updateTool(toolId, toolData);
      setSuccess(response.message || 'Herramienta actualizada con éxito.');
      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        navigate(`/tools/${toolId}`); // Volver a la página de detalles
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al actualizar la herramienta.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado
  if (loading) {
    return <Layout><p className="p-4 text-center text-gray-500">Cargando datos de la herramienta...</p></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">
           &larr; Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Herramienta</h1>

        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{success}</p>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre:</label>
            <input
              type="text" id="name" name="name" required
              value={toolData.name} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
           {/* Campo Categoría */}
           <div>
             <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría:</label>
             <select
               id="category" name="category" value={toolData.category} onChange={handleChange} required
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             >
                {/* Usar las mismas opciones que en ToolManagement.js */}
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
           <div>
             <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Número de Serie:</label>
             <input
               type="text" id="serialNumber" name="serialNumber"
               value={toolData.serialNumber} onChange={handleChange}
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             />
           </div>
           {/* Campo Ubicación */}
            <div>
             <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación:</label>
             <input
               type="text" id="location" name="location" required
               value={toolData.location} onChange={handleChange}
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             />
           </div>
           {/* Campo Descripción */}
           <div>
             <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción:</label>
             <textarea
               id="description" name="description" rows="3"
               value={toolData.description} onChange={handleChange}
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             />
           </div>

           {/* Botón Guardar */}
           <div className="flex justify-end">
             <button
               type="submit"
               disabled={isSubmitting}
               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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