

// src/pages/UserManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import Layout from '../components/Layout';
// Importar las funciones API necesarias
import { adminCreateUser, getUsers, updateUserStatusApi } from '../services/api';

const UserManagement = () => {
  const navigate = useNavigate(); // Hook para navegación

  // --- Estados para la lista de usuarios ---
  const [users, setUsers] = useState([]); // Estado para guardar la lista de usuarios
  const [loadingUsers, setLoadingUsers] = useState(true); // Estado para la carga inicial de usuarios
  const [errorUsers, setErrorUsers] = useState(''); // Estado para errores al cargar usuarios

  // --- Estados para el formulario de creación ---
  const [showCreateUserForm, setShowCreateUserForm] = useState(false); // Visibilidad del formulario
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'technician' }); // Datos del nuevo usuario
  const [createUserMessage, setCreateUserMessage] = useState(''); // Mensaje de éxito/error al crear
  const [createUserLoading, setCreateUserLoading] = useState(false); // Estado de carga para la creación

  // --- Estado para la acción de activar/desactivar ---
  const [statusChangeLoading, setStatusChangeLoading] = useState(null); // Guarda el ID del usuario en proceso
  const [statusChangeError, setStatusChangeError] = useState(''); // Error al cambiar estado

  // --- Cargar lista de usuarios al montar el componente ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true); // Inicia carga
        setErrorUsers(''); // Limpia errores previos
        const response = await getUsers(); // Llama a la API
        setUsers(response.data || []); // Guarda los usuarios en el estado
      } catch (err) {
        setErrorUsers('Error al cargar la lista de usuarios: ' + (err.message || 'Error desconocido'));
        console.error(err);
      } finally {
        setLoadingUsers(false); // Termina carga
      }
    };
    fetchUsers();
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- Manejador de cambios en el formulario de creación ---
  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // --- Manejador para enviar el formulario de creación ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserMessage('');
    try {
      const response = await adminCreateUser(newUser.name, newUser.email, newUser.role);
      setCreateUserMessage(response.message || 'Usuario creado exitosamente y email de activación enviado.');
      setNewUser({ name: '', email: '', role: 'technician' }); // Limpiar formulario
      setShowCreateUserForm(false); // Ocultar formulario
      // Recargar la lista para mostrar el nuevo usuario
      const updatedUsers = await getUsers();
      setUsers(updatedUsers.data || []);
    } catch (error) {
      setCreateUserMessage(error.message || 'Error al crear usuario.');
    } finally {
      setCreateUserLoading(false);
    }
  };

  // --- Manejador para cambiar el estado Activo/Inactivo ---
  const handleUserStatusToggle = async (userId, currentIsActive) => {
    const actionText = currentIsActive ? 'desactivar' : 'activar';
    if (window.confirm(`¿Estás seguro de que quieres ${actionText} a este usuario?`)) {
      setStatusChangeLoading(userId); // Indica que este usuario está procesando
      setStatusChangeError('');
      try {
        const newIsActive = !currentIsActive;
        await updateUserStatusApi(userId, newIsActive); // Llama a la API

        // Actualiza el estado local para reflejar el cambio inmediatamente
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u._id === userId ? { ...u, isActive: newIsActive } : u
          )
        );
      } catch (err) {
        console.error(`Error al ${actionText} usuario:`, err);
        setStatusChangeError(err.message || `Error al ${actionText}`);
      } finally {
        setStatusChangeLoading(null); // Termina el procesamiento para este usuario
      }
    }
  };

  // --- Manejador para el botón Editar ---
  const handleEditUser = (userId) => {
    // Navega a la ruta de edición (aún por crear)
    navigate(`/admin/users/${userId}/edit`);
  };

  // --- Renderizado del Componente ---
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h1>

        {/* Botón para mostrar/ocultar el formulario */}
        <div className="mb-4">
          <button
            onClick={() => setShowCreateUserForm(!showCreateUserForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showCreateUserForm ? 'Ocultar Formulario' : 'Crear Nuevo Usuario'}
          </button>
        </div>

        {/* Formulario de creación (condicional) */}
        {showCreateUserForm && (
          <div className="bg-white rounded-xl shadow p-4 mb-8 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Crear Nuevo Usuario</h2>
            {createUserMessage && (
              <p className={`mb-4 text-sm ${createUserMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {createUserMessage}
              </p>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre:</label>
                <input
                  type="text" name="name" value={newUser.name} onChange={handleNewUserChange} required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <input
                  type="email" name="email" value={newUser.email} onChange={handleNewUserChange} required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol:</label>
                <select
                  name="role" value={newUser.role} onChange={handleNewUserChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="technician">Técnico</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={createUserLoading}
              >
                {createUserLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        )}

        {/* Sección de Lista de Usuarios */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-700 p-4 border-b">Lista de Usuarios</h2>
          {statusChangeError && <p className="p-4 text-red-600 bg-red-50">{statusChangeError}</p>}

          {/* Lógica de renderizado condicional para carga, error o tabla */}
          {loadingUsers ? (
            <p className="p-4 text-gray-500">Cargando usuarios...</p>
          ) : errorUsers ? (
            <p className="p-4 text-red-600">{errorUsers}</p>
          ) : users.length === 0 ? (
             <p className="p-4 text-gray-500">No hay usuarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro Desde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {new Date(user.createdAt).toLocaleDateString()}
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          disabled={statusChangeLoading === user._id}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleUserStatusToggle(user._id, user.isActive)}
                          className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          disabled={statusChangeLoading === user._id}
                        >
                          {statusChangeLoading === user._id ? '...' : (user.isActive ? 'Desactivar' : 'Activar')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserManagement;

// // frontend/src/pages/UserManagement.js

// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// // Asegúrate que adminCreateUser esté exportado y funcione en api.js
// import { getUsers, updateUserStatusApi, adminCreateUser } from '../services/api';
// import { Link, useNavigate } from 'react-router-dom';
// import Layout from '../components/Layout';

// // Componente IsActiveBadge (sin cambios)
// const IsActiveBadge = ({ isActive }) => {
//     const text = isActive ? 'Activo' : 'Inactivo';
//     const bgColor = isActive ? 'bg-green-100' : 'bg-red-100';
//     const textColor = isActive ? 'text-green-800' : 'text-red-800';
//     return (
//         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
//             {text}
//         </span>
//     );
// };

// function UserManagement() {
//     // --- Estados para la lista ---
//     const [users, setUsers] = useState([]);
//     const [loadingUsers, setLoadingUsers] = useState(true); // Renombrado para claridad
//     const [errorUsers, setErrorUsers] = useState(''); // Renombrado para claridad
//     const [filterMode, setFilterMode] = useState('active');
//     const [statusChangeLoading, setStatusChangeLoading] = useState(null); // Para botón Activar/Desactivar
//     const [statusChangeError, setStatusChangeError] = useState(''); // Para botón Activar/Desactivar

//     // --- Estados para Crear Usuario (REINTEGRADOS) ---
//     const [showCreateUserForm, setShowCreateUserForm] = useState(false);
//     const [newUser, setNewUser] = useState({ name: '', email: '', role: 'technician' });
//     const [createUserMessage, setCreateUserMessage] = useState(''); // Éxito/Error al crear
//     const [createUserLoading, setCreateUserLoading] = useState(false);

//     const navigate = useNavigate();

//     // --- Carga y Filtrado (Sin cambios) ---
//     const fetchUsers = useCallback(async () => {
//         try {
//             // No reiniciar loadingUsers aquí si solo es un refresh
//             // setLoadingUsers(true);
//             setErrorUsers('');
//             setCreateUserMessage(''); // Limpiar mensaje de creación al recargar lista
//             setStatusChangeError(''); // Limpiar mensaje de cambio de estado
//             const response = await getUsers();
//             setUsers(response.data || []);
//         } catch (err) {
//             console.error("Error fetching users:", err);
//             setErrorUsers('Error al cargar usuarios. Inténtalo de nuevo más tarde.');
//             setUsers([]);
//         } finally {
//             // setLoadingUsers(false); // Solo poner en false en el useEffect inicial
//         }
//     }, []);

//     // Carga inicial
//     useEffect(() => {
//         setLoadingUsers(true); // Indicar carga inicial
//         fetchUsers().finally(() => setLoadingUsers(false)); // Poner false cuando termine la carga inicial
//     }, [fetchUsers]); // Dependencia fetchUsers

//     const filteredUsers = useMemo(() => {
//         if (filterMode === 'active') {
//             return users.filter(user => typeof user.isActive === 'boolean' && user.isActive === true);
//         }
//         return users;
//     }, [users, filterMode]);

//     // --- Acciones ---
//     const handleEdit = (userId) => {
//         navigate(`/admin/edit-user/${userId}`);
//     };

//     const handleStatusChange = async (userId, currentIsActive) => {
//         const actionText = currentIsActive ? 'desactivar' : 'activar';
//         // Usando confirm simple por ahora, como en tu original
//         if (window.confirm(`¿Estás seguro de que quieres ${actionText} a este usuario?`)) {
//             setStatusChangeLoading(userId);
//             setStatusChangeError('');
//             try {
//                 const newIsActive = !currentIsActive;
//                 await updateUserStatusApi(userId, newIsActive);

//                 // Actualiza estado local inmediatamente en lugar de refetch completo
//                  setUsers(prevUsers =>
//                    prevUsers.map(u =>
//                      u._id === userId ? { ...u, isActive: newIsActive } : u
//                    )
//                  );
//                  // Opcional: mostrar mensaje de éxito si se desea
//                  // setSuccessMessage(`Usuario ${newIsActive ? 'activado' : 'desactivado'}.`);
//                  // setTimeout(() => setSuccessMessage(''), 3000);

//             } catch (err) {
//                 console.error(`Error al ${actionText} usuario:`, err);
//                 setStatusChangeError(err.message || `Error al ${actionText}`);
//             } finally {
//                 setStatusChangeLoading(null);
//             }
//         }
//     };

//     // --- Funciones Crear Usuario (REINTEGRADAS) ---
//     const handleNewUserChange = (e) => {
//         setNewUser({ ...newUser, [e.target.name]: e.target.value });
//     };

//     const handleCreateUser = async (e) => {
//         e.preventDefault();
//         setCreateUserLoading(true);
//         setCreateUserMessage('');
//         try {
//             // Asegúrate que adminCreateUser en api.js envíe { name, email, role }
//             const response = await adminCreateUser(newUser.name, newUser.email, newUser.role);
//             setCreateUserMessage(response.message || 'Usuario creado y email de activación enviado.');
//             setNewUser({ name: '', email: '', role: 'technician' }); // Limpiar form
//             // setShowCreateUserForm(false); // Opcional: Ocultar form tras éxito

//             // Refrescar lista de usuarios para incluir el nuevo
//             fetchUsers();

//              // Opcional: Ocultar mensaje después de unos segundos
//             setTimeout(() => setCreateUserMessage(''), 5000);


//         } catch (error) {
//             setCreateUserMessage(error.message || 'Error al crear usuario.');
//         } finally {
//             setCreateUserLoading(false);
//         }
//     };


//     // --- Renderizado ---
//     return (
//         <Layout>
//             <div className="container mx-auto px-4 py-8"> {/* Ajustado padding si es necesario */}
//                 <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Usuarios</h1>

//                 {/* Mensajes Generales (Podrían unificarse luego) */}
//                 {/* {successMessage && <div className="...">{successMessage}</div>} */}
//                 {errorUsers && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{errorUsers}</div>}
//                 {statusChangeError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{statusChangeError}</div>}


//                  {/* --- Botón y Formulario Crear Usuario (REINTEGRADO) --- */}
//                 <div className="mb-6">
//                     <button
//                         onClick={() => setShowCreateUserForm(!showCreateUserForm)}
//                         // Usando azul consistente para el botón
//                         className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
//                     >
//                         {showCreateUserForm ? 'Ocultar Formulario Crear' : 'Crear Nuevo Usuario'}
//                     </button>
//                 </div>

//                 {showCreateUserForm && (
//                     <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200"> {/* Estilo consistente */}
//                         <h2 className="text-xl font-semibold text-gray-700 mb-4">Crear Nuevo Usuario</h2>
//                         {/* Mensaje específico de creación */}
//                         {createUserMessage && (
//                             <p className={`mb-4 text-sm ${createUserMessage.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'} p-3 rounded`}>
//                                 {createUserMessage}
//                             </p>
//                         )}
//                         <form onSubmit={handleCreateUser} className="space-y-4">
//                             <div>
//                                 <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">Nombre:</label>
//                                 <input
//                                     type="text" id="create-name" name="name" value={newUser.name} onChange={handleNewUserChange} required
//                                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                                 />
//                             </div>
//                             <div>
//                                 <label htmlFor="create-email" className="block text-sm font-medium text-gray-700">Email:</label>
//                                 <input
//                                     type="email" id="create-email" name="email" value={newUser.email} onChange={handleNewUserChange} required
//                                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                                 />
//                             </div>
//                             <div>
//                                 <label htmlFor="create-role" className="block text-sm font-medium text-gray-700">Rol:</label>
//                                 <select
//                                     id="create-role" name="role" value={newUser.role} onChange={handleNewUserChange}
//                                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                                 >
//                                     <option value="technician">Técnico</option>
//                                     <option value="admin">Admin</option>
//                                 </select>
//                             </div>
//                              <div className="flex justify-end">
//                                 <button
//                                     type="submit"
//                                     // Usando azul consistente
//                                     className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//                                     disabled={createUserLoading}
//                                 >
//                                     {createUserLoading ? 'Creando...' : 'Crear y Enviar Activación'}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 )}
//                 {/* --- Fin Sección Crear Usuario --- */}


//                 {/* Filtros (Sin cambios, ya estaban bien) */}
//                 <div className="mb-4 flex items-center space-x-2">
//                     {/* ... botones de filtro ... */}
//                      <span className="text-sm font-medium text-gray-700">Mostrar:</span>
//                     <button
//                         onClick={() => setFilterMode('active')}
//                         className={`px-3 py-1 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
//                             filterMode === 'active' ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                         }`}
//                     > Solo Activos </button>
//                     <button
//                         onClick={() => setFilterMode('all')}
//                         className={`px-3 py-1 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
//                              filterMode === 'all' ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                         }`}
//                     > Todos </button>
//                     {loadingUsers && <span className="text-sm text-gray-500 ml-4">Cargando lista...</span>}
//                 </div>

//                 {/* Contenedor Tabla/Tarjetas */}
//                 <div>
//                     {!loadingUsers && filteredUsers.length === 0 && (
//                         <div className="text-center p-4 text-gray-500 bg-white rounded-lg shadow"> {/* Fondo blanco para consistencia */}
//                             No hay usuarios para mostrar con el filtro actual.
//                         </div>
//                     )}

//                     {!loadingUsers && filteredUsers.length > 0 && (
//                         <>
//                             {/* Vista Tabla */}
//                             <div className="hidden md:block overflow-x-auto shadow-md sm:rounded-lg">
//                                {/* ... Contenido Tabla (sin cambios) ... */}
//                                 <table className="min-w-full bg-white">
//                                 <thead className="bg-gray-800 text-white">
//                                     <tr>
//                                         <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nombre</th>
//                                         <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
//                                         <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Rol</th>
//                                         <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Estado</th>
//                                         <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Acciones</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="text-gray-700">
//                                     {filteredUsers.map(user => (
//                                         <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-100">
//                                             <td className="py-3 px-4">{user.name}</td>
//                                             <td className="py-3 px-4">{user.email}</td>
//                                             <td className="py-3 px-4">{user.role}</td>
//                                             <td className="py-3 px-4">
//                                                 {typeof user.isActive === 'boolean' ? (<IsActiveBadge isActive={user.isActive} />) : (<span className="text-xs text-gray-500">N/A</span>)}
//                                             </td>
//                                             <td className="py-3 px-4 whitespace-nowrap">
//                                                 <button onClick={() => handleEdit(user._id)} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded mr-2 text-sm" aria-label={`Editar usuario ${user.name}`} disabled={statusChangeLoading === user._id}>Editar</button>
//                                                 {typeof user.isActive === 'boolean' && (
//                                                     <button
//                                                         onClick={() => handleStatusChange(user._id, user.isActive)}
//                                                         className={`${user.isActive ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50`}
//                                                         aria-label={`${user.isActive ? 'Desactivar' : 'Activar'} usuario ${user.name}`}
//                                                         disabled={statusChangeLoading === user._id} // Deshabilitar mientras carga
//                                                     >
//                                                          {statusChangeLoading === user._id ? '...' : (user.isActive ? 'Desactivar' : 'Activar')}
//                                                     </button>
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                                 </table>
//                             </div>

//                             {/* Vista Tarjetas */}
//                             <div className="block md:hidden">
//                                 {/* ... Contenido Tarjetas (sin cambios) ... */}
//                                 <div className="grid grid-cols-1 gap-4">
//                                 {filteredUsers.map(user => (
//                                     <div key={user._id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
//                                          <div className="mb-2"><strong className="text-gray-800">Nombre:</strong> <p className="text-gray-600">{user.name}</p></div>
//                                         <div className="mb-2"><strong className="text-gray-800">Email:</strong> <p className="text-gray-600 break-words">{user.email}</p></div>
//                                          <div className="mb-2"><strong className="text-gray-800">Rol:</strong> <p className="text-gray-600">{user.role}</p></div>
//                                         <div className="mb-4"><strong className="text-gray-800">Estado:</strong> <div>{typeof user.isActive === 'boolean' ? (<IsActiveBadge isActive={user.isActive} />) : (<span className="text-xs text-gray-500">N/A</span>)}</div></div>
//                                         <div className="flex justify-end space-x-2 border-t border-gray-200 pt-3 mt-3">
//                                             <button onClick={() => handleEdit(user._id)} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm" aria-label={`Editar usuario ${user.name}`} disabled={statusChangeLoading === user._id}>Editar</button>
//                                              {typeof user.isActive === 'boolean' && (
//                                                 <button
//                                                     onClick={() => handleStatusChange(user._id, user.isActive)}
//                                                     className={`${user.isActive ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50`}
//                                                     aria-label={`${user.isActive ? 'Desactivar' : 'Activar'} usuario ${user.name}`}
//                                                      disabled={statusChangeLoading === user._id} // Deshabilitar mientras carga
//                                                 >
//                                                      {statusChangeLoading === user._id ? '...' : (user.isActive ? 'Desactivar' : 'Activar')}
//                                                 </button>
//                                              )}
//                                         </div>
//                                     </div>
//                                 ))}
//                                 </div>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </Layout>
//     );
// }

// export default UserManagement;