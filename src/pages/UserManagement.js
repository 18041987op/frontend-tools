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