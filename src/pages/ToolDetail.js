// src/pages/ToolDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getToolById, borrowTool, transferTool, getLoans, returnToolAPI, getTechnicians } from '../services/api'; // Importar getTechnicians
import TechnicianSelector from '../components/TechnicianSelector'; // Asumiendo que lo usas para transferir
import { Link } from 'react-router-dom'; // Asegúrate que Link esté importado

const ToolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Estados para Préstamo ---
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowData, setBorrowData] = useState({
    purpose: '',
    vehicle: '',
    loanDuration: '3d', // Default 3 días
    expectedReturn: '' // Para fecha custom
  });
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [borrowSuccess, setBorrowSuccess] = useState('');

  // --- Estados para Transferencia ---
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({
    targetTechnician: '',
    purpose: '',
    vehicle: '',
    loanDuration: '3d', // Añadir duración también para transferencia
    expectedReturn: '', // Añadir fecha custom para transferencia
    notes: ''
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [activeLoan, setActiveLoan] = useState(null); // Para guardar info del préstamo activo si existe

  // Obtener información del usuario actual
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin'; // Verificar si es admin

  // --- Efecto para cargar datos de la herramienta y préstamo activo ---
  useEffect(() => {
    const fetchToolAndLoan = async () => {
      setLoading(true);
      setError('');
      setActiveLoan(null); // Resetear préstamo activo

      try {
        // Cargar herramienta
        const toolResponse = await getToolById(id);
        const currentTool = toolResponse.data;
        setTool(currentTool);

        // Si está prestada, cargar los detalles del préstamo activo
        if (currentTool && currentTool.status === 'borrowed') {
          try {
            const loansResponse = await getLoans({ tool: id, status: 'active' });
            if (loansResponse.data && loansResponse.data.length > 0) {
              setActiveLoan(loansResponse.data[0]); // Guardar el préstamo activo
            } else {
               console.warn("La herramienta está 'borrowed' pero no se encontró préstamo activo.");
               // Opcional: Podrías intentar cambiar el estado de la herramienta a 'available' si esto ocurre
            }
          } catch (loanErr) {
            console.error('Error al cargar información del préstamo activo:', loanErr);
            // No establecer error principal aquí, solo loguear el error del préstamo
          }
        }
      } catch (err) {
        setError('Error al cargar los detalles de la herramienta.');
        console.error(err);
        setTool(null); // Asegura que no se muestre nada si hay error
      } finally {
        setLoading(false);
      }
    };

    fetchToolAndLoan();
  }, [id]); // Dependencia: id de la herramienta

  // --- Manejadores de Formularios ---

  // Cambios en formulario de préstamo
  const handleBorrowChange = (e) => {
    const { name, value } = e.target;
    setBorrowData(prev => ({
      ...prev,
      [name]: value,
      // Limpiar fecha específica si se selecciona una duración predefinida
      expectedReturn: name === 'loanDuration' && value !== 'custom' ? '' : prev.expectedReturn
    }));
  };

  // Envío de formulario de préstamo
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setBorrowLoading(true);
    setBorrowError('');
    setBorrowSuccess('');

    try {
      const payload = {
        tool: id,
        purpose: borrowData.purpose,
        vehicle: borrowData.vehicle || undefined, // Enviar solo si tiene valor
      };

      // Añadir duración o fecha específica al payload
      if (borrowData.loanDuration === 'custom' && borrowData.expectedReturn) {
        payload.expectedReturn = borrowData.expectedReturn;
      } else if (borrowData.loanDuration !== 'custom') {
        payload.loanDuration = borrowData.loanDuration;
      } else {
         // Si es custom pero no hay fecha, podría lanzar error o usar default (backend ya lo hace)
         // Podríamos añadir validación aquí
         if (borrowData.loanDuration === 'custom' && !borrowData.expectedReturn) {
             throw new Error("Selecciona una fecha de devolución específica.");
         }
         payload.loanDuration = borrowData.loanDuration; // Enviar 'custom' si es necesario
      }

      // *** DEBUG LOG ***
      console.log('DEBUG: Datos enviados al backend para crear préstamo:', payload);

      const response = await borrowTool(payload); // Llama a la API

      setBorrowSuccess('Préstamo solicitado exitosamente');
      setShowBorrowForm(false); // Oculta el formulario
      // Actualizar estado local de la herramienta y préstamo
      setTool(prev => ({ ...prev, status: 'borrowed' }));
      // Necesitaríamos recargar el préstamo activo si quisiéramos mostrarlo inmediatamente
      // Podríamos hacerlo aquí o simplemente confiar en la redirección
      setActiveLoan(response.data); // Asumir que la API devuelve el préstamo creado

      setTimeout(() => {
        navigate('/my-tools'); // Redirigir a Mis Herramientas
      }, 1500); // Tiempo reducido

    } catch (err) {
      console.error('Error completo al solicitar préstamo:', err);
      setBorrowError(err.message || 'Error al solicitar la herramienta');
    } finally {
      setBorrowLoading(false);
    }
  };

  // Cambios en formulario de transferencia
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
     setTransferData(prev => ({
      ...prev,
      [name]: value,
       // Limpiar fecha específica si se selecciona duración predefinida
       expectedReturn: name === 'loanDuration' && value !== 'custom' ? '' : prev.expectedReturn
    }));
  };

  // Selección de técnico en el selector
  const handleTechnicianSelect = (technicianId) => {
    setTransferData(prev => ({ ...prev, targetTechnician: technicianId }));
  };

  // Envío de formulario de transferencia
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!activeLoan) {
      setTransferError('No hay un préstamo activo para transferir.');
      return;
    }
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');

    try {
      if (!transferData.targetTechnician) {
        throw new Error('Debes seleccionar un técnico destino.');
      }

      const payload = {
        targetTechnician: transferData.targetTechnician,
        purpose: transferData.purpose,
        vehicle: transferData.vehicle || undefined,
        notes: transferData.notes || undefined,
      };

       // Añadir duración o fecha específica al payload
      if (transferData.loanDuration === 'custom' && transferData.expectedReturn) {
        payload.expectedReturn = transferData.expectedReturn;
      } else if (transferData.loanDuration !== 'custom') {
        payload.loanDuration = transferData.loanDuration; // Enviar la duración ej: "1h", "3d"
      } else {
         if (transferData.loanDuration === 'custom' && !transferData.expectedReturn) {
             throw new Error("Selecciona una fecha de devolución específica.");
         }
         // Si es 'custom' sin fecha explícita, el backend debería manejar el default
      }

       // *** DEBUG LOG ***
       console.log('DEBUG: Datos enviados al backend para transferir préstamo:', payload);

      await transferTool(activeLoan._id, payload); // Llama a la API

      setTransferSuccess('Transferencia solicitada/realizada exitosamente.'); // El backend decide si es inmediato o requiere confirmación
      setShowTransferForm(false);
      // Actualizar UI localmente
      setTool(prev => ({ ...prev, status: 'borrowed' })); // Sigue prestada, pero a otro user
      setActiveLoan(null); // Ya no es el préstamo activo de este usuario (asumiendo que la transferencia es inmediata)

      setTimeout(() => {
        navigate('/catalog'); // Volver al catálogo o al dashboard
      }, 1500);

    } catch (err) {
      console.error('Error al transferir:', err);
      setTransferError(err.message || 'Error al transferir la herramienta.');
    } finally {
      setTransferLoading(false);
    }
  };

   // Devolución directa (simplificada, ya no usa el modal de MyTools)
   const handleDirectReturn = async () => {
    if (!activeLoan) {
      alert("Error: No se encontró un préstamo activo para esta herramienta.");
      return;
    }
    if (window.confirm('¿Confirmas la devolución de esta herramienta?')) {
      const hasDamage = window.confirm('¿La herramienta tiene algún daño o problema?');
      let damageDescription = '';
      if (hasDamage) {
        damageDescription = prompt('Por favor, describe brevemente el daño:', '');
      }

      const returnPayload = {
        returnCondition: {
          hasDamage: hasDamage,
          status: hasDamage ? 'damaged' : 'good',
          damageDescription: damageDescription || (hasDamage ? 'Daño reportado sin descripción' : '')
        }
      };

      setLoading(true); // Usar el loading general
      setError('');
      try {
        await returnToolAPI(activeLoan._id, returnPayload);
        alert('Herramienta devuelta exitosamente.');
        // Actualizar UI
        setTool(prev => ({ ...prev, status: returnPayload.returnCondition.status }));
        setActiveLoan(null);
        // Opcional: redirigir
        // navigate('/my-tools');
      } catch (err) {
        console.error('Error al devolver herramienta:', err);
        setError('Error al devolver la herramienta: ' + err.message);
        alert('Error al devolver la herramienta: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };


  // --- Renderizado ---

  if (loading) {
    return <Layout><div className="text-center py-10"><p className="text-gray-500">Cargando...</p></div></Layout>;
  }

  if (error || !tool) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'No se pudo encontrar la herramienta.'}</p>
          <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate('/catalog')}>
            Volver al Catálogo
          </button>
        </div>
      </Layout>
    );
  }

  // Determinar si el usuario actual tiene la herramienta prestada
  const currentUserHasTool = activeLoan && activeLoan.technician._id === user._id;

  console.log("DEBUG: Datos COMPLETOS herramienta:", JSON.stringify(tool, null, 2)); // Muestra TODO el objeto formateado
  console.log(`DEBUG: Location: ${tool?.location}, Description: ${tool?.description}`);
  console.log("DEBUG: Datos de la herramienta en estado antes de renderizar:", tool);

  return (
    <Layout>
      <div>
        {/* Encabezado */}
        <div className="mb-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-blue-500 hover:text-blue-700">
             ← Volver
          </button>
          <h1 className="text-2xl font-bold">{tool.name}</h1>
        </div>

        {/* Contenedor Principal */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Panel Izquierdo: Imagen y Acciones */}
            <div className="w-full md:w-1/3 p-4 bg-gray-50 border-b md:border-b-0 md:border-r">
              <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center mb-4 text-gray-400 italic">
                {/* TODO: Implementar carga/muestra de imagen real */}
                Imagen Pendiente
              </div>

              <div className="mb-4">
                 {/* Estado Actual */}
                 <span className={`inline-block px-3 py-1 rounded text-sm font-semibold mb-2 ${
                     tool.status === 'available' ? 'bg-green-100 text-green-800' :
                     tool.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : // Amarillo para prestado aquí
                     tool.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                     tool.status === 'damaged' ? 'bg-red-100 text-red-700' :
                     'bg-gray-100 text-gray-600'
                 }`}>
                     { tool.status === 'available' ? 'Disponible' :
                       tool.status === 'borrowed' ? 'En Préstamo' :
                       tool.status === 'maintenance' ? 'Mantenimiento' :
                       tool.status === 'damaged' ? 'Dañada' :
                       'Desconocido'}
                 </span>

                {/* Info del préstamo si existe */}
                {tool.status === 'borrowed' && activeLoan && (
                  <div className="text-sm mt-1 border-t pt-2">
                    <p>Prestada a: <strong>{activeLoan.technician.name}</strong></p>
                    <p>Desde: {new Date(activeLoan.borrowedAt).toLocaleDateString()}</p>
                    <p>Devolución: {new Date(activeLoan.expectedReturn).toLocaleDateString()}</p>
                    {activeLoan.purpose && <p>Propósito: {activeLoan.purpose}</p>}
                    {activeLoan.vehicle && <p>Vehículo: {activeLoan.vehicle}</p>}
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2">
                {tool.status === 'available' && (
                  <button
                    onClick={() => setShowBorrowForm(true)}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Solicitar Préstamo
                  </button>
                )}

                {tool.status === 'borrowed' && activeLoan && (
                  currentUserHasTool ? (
                    // Si el usuario actual tiene la herramienta
                    <button
                      onClick={handleDirectReturn}
                      className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={loading} // Deshabilitar si ya se está procesando algo
                    >
                      {loading ? 'Procesando...' : 'Devolver Herramienta'}
                    </button>
                  ) : (
                     // Si otro técnico tiene la herramienta
                     <button
                        onClick={() => setShowTransferForm(true)}
                        className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                     >
                       Solicitar Transferencia
                     </button>
                  )
                )}

                 {/* Botón de Transferencia también si el usuario actual la tiene */}
                 {tool.status === 'borrowed' && currentUserHasTool && (
                    <button
                       onClick={() => setShowTransferForm(true)}
                       className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                     >
                       Transferir a Otro Técnico
                     </button>
                 )}

                 {/* TODO: Botones para Admin (Ej: Marcar para mantenimiento) */}
                 {/* NUEVO: Botón Editar (Solo para Admin) */}
                 {isAdmin && (
                    <Link
                        to={`/admin/tools/${tool._id}/edit`}
                        className="block w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Editar Herramienta
                    </Link>
                    )}
              </div>
            </div>

            {/* Panel Derecho: Detalles */}
            <div className="w-full md:w-2/3 p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3 border-b pb-2">Detalles de la Herramienta</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Categoría</dt>
                  <dd className="mt-1 text-gray-900">{tool.category}</dd> {/* Podrías usar categoryDetails aquí si lo importas */}
                </div>
                 <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Número de Serie</dt>
                  <dd className="mt-1 text-gray-900">{tool.serialNumber || 'N/A'}</dd>
                </div>
                 <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Ubicación</dt>
                  <dd className="mt-1 text-gray-900">{tool.location || 'N/A'}</dd>
                </div>
                {tool.lastMaintenance && (
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-gray-500">Último Mantenimiento</dt>
                    <dd className="mt-1 text-gray-900">{new Date(tool.lastMaintenance).toLocaleDateString()}</dd>
                  </div>
                )}
                 <div className="sm:col-span-2">
                  <dt className="font-medium text-gray-500">Descripción</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{tool.description || 'Sin descripción.'}</dd>
                </div>
                 <div className="sm:col-span-2">
                  <dt className="font-medium text-gray-500">Añadida el</dt>
                  <dd className="mt-1 text-gray-900">{new Date(tool.createdAt).toLocaleDateString()}</dd>
                </div>
                 {/* Podrías añadir 'addedBy' si lo populaste en el backend */}
              </dl>

              {/* TODO: Podría ir historial de préstamos aquí si se implementa */}

            </div>
          </div>
        </div>

        {/* --- Modales --- */}

        {/* Modal Formulario de Préstamo */}
        {showBorrowForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Solicitar Préstamo: {tool.name}</h2>
              {borrowError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{borrowError}</p>}
              {borrowSuccess && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{borrowSuccess}</p>}
              <form onSubmit={handleBorrowSubmit} className="space-y-4">
                 {/* Campos: purpose, loanDuration, expectedReturn (condicional), vehicle */}
                 <div>
                   <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Propósito *</label>
                   <textarea id="purpose" name="purpose" value={borrowData.purpose} onChange={handleBorrowChange} required rows="3" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
                 </div>
                 <div>
                   <label htmlFor="loanDuration" className="block text-sm font-medium text-gray-700">Duración *</label>
                   <select id="loanDuration" name="loanDuration" value={borrowData.loanDuration} onChange={handleBorrowChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                     <option value="1h">1 hora</option>
                     <option value="2h">2 horas</option>
                     <option value="4h">4 horas</option>
                     <option value="8h">8 horas (1 turno)</option>
                     <option value="1d">1 día</option>
                     <option value="2d">2 días</option>
                     <option value="3d">3 días</option>
                     <option value="5d">5 días</option>
                     <option value="7d">1 semana</option>
                     <option value="custom">Fecha específica</option>
                   </select>
                 </div>
                 {borrowData.loanDuration === 'custom' && (
                   <div>
                     <label htmlFor="expectedReturn" className="block text-sm font-medium text-gray-700">Fecha Devolución *</label>
                     <input type="date" id="expectedReturn" name="expectedReturn" value={borrowData.expectedReturn} onChange={handleBorrowChange} required min={new Date().toISOString().split('T')[0]} className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                   </div>
                 )}
                  <div>
                     <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">Vehículo (Opcional)</label>
                     <input type="text" id="vehicle" name="vehicle" value={borrowData.vehicle} onChange={handleBorrowChange} placeholder="Marca, Modelo, Año, Placa..." className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                  </div>
                 {/* Botones */}
                 <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowBorrowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
                   <button type="submit" disabled={borrowLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">{borrowLoading ? 'Solicitando...' : 'Confirmar Préstamo'}</button>
                 </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Formulario de Transferencia */}
        {showTransferForm && activeLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
               <h2 className="text-xl font-semibold mb-4">Transferir: {tool.name}</h2>
               {transferError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{transferError}</p>}
               {transferSuccess && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{transferSuccess}</p>}
               <p className="mb-4 text-sm text-gray-600">
                 {currentUserHasTool ? 'Transfiere esta herramienta a otro técnico.' : `Solicitando transferencia de ${activeLoan.technician.name}.`}
               </p>
               <form onSubmit={handleTransferSubmit} className="space-y-4">
                  {/* Selector de Técnico */}
                  <TechnicianSelector
                     onSelect={handleTechnicianSelect}
                     currentTechnicianId={user._id} // Excluirse a sí mismo de la lista
                     label="Transferir a *"
                  />
                  {/* Campos: purpose, loanDuration, expectedReturn, vehicle, notes */}
                  <div>
                    <label htmlFor="transferPurpose" className="block text-sm font-medium text-gray-700">Propósito *</label>
                    <textarea id="transferPurpose" name="purpose" value={transferData.purpose} onChange={handleTransferChange} required rows="2" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
                  </div>
                  <div>
                   <label htmlFor="transferLoanDuration" className="block text-sm font-medium text-gray-700">Nueva Duración *</label>
                   <select id="transferLoanDuration" name="loanDuration" value={transferData.loanDuration} onChange={handleTransferChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                     {/* Opciones de duración */}
                     <option value="1h">1 hora</option>
                     <option value="2h">2 horas</option>
                     <option value="4h">4 horas</option>
                     <option value="8h">8 horas (1 turno)</option>
                     <option value="1d">1 día</option>
                     <option value="2d">2 días</option>
                     <option value="3d">3 días</option>
                     <option value="5d">5 días</option>
                     <option value="7d">1 semana</option>
                     <option value="custom">Fecha específica</option>
                   </select>
                 </div>
                 {transferData.loanDuration === 'custom' && (
                   <div>
                     <label htmlFor="transferExpectedReturn" className="block text-sm font-medium text-gray-700">Nueva Fecha Devolución *</label>
                     <input type="date" id="transferExpectedReturn" name="expectedReturn" value={transferData.expectedReturn} onChange={handleTransferChange} required min={new Date().toISOString().split('T')[0]} className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                   </div>
                 )}
                  <div>
                     <label htmlFor="transferVehicle" className="block text-sm font-medium text-gray-700">Vehículo (Opcional)</label>
                     <input type="text" id="transferVehicle" name="vehicle" value={transferData.vehicle} onChange={handleTransferChange} placeholder="Marca, Modelo, Año, Placa..." className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                  </div>
                  <div>
                     <label htmlFor="transferNotes" className="block text-sm font-medium text-gray-700">Notas (Opcional)</label>
                     <textarea id="transferNotes" name="notes" value={transferData.notes} onChange={handleTransferChange} rows="2" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
                  </div>
                 {/* Botones */}
                 <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowTransferForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
                   <button type="submit" disabled={transferLoading} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">{transferLoading ? 'Procesando...' : 'Confirmar Transferencia'}</button>
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