// src/pages/EditUser.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUserByIdForAdmin, updateUserByAdmin } from '../services/api';

const EditUser = () => {
  const { id: userId } = useParams(); // Obtiene el ID del usuario de la URL
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: 'technician',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del usuario al montar
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getUserByIdForAdmin(userId);
        if (response.success && response.data) {
          setUserData({
            name: response.data.name || '',
            email: response.data.email || '',
            role: response.data.role || 'technician',
            isActive: response.data.isActive === undefined ? true : response.data.isActive, // Manejar caso donde isActive no exista
          });
        } else {
          setError('No se pudieron cargar los datos del usuario.');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar datos del usuario.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]); // Dependencia: userId

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      // Prepara los datos a enviar (solo los campos editables)
      const dataToUpdate = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive,
      };

      const response = await updateUserByAdmin(userId, dataToUpdate);
      setSuccess(response.message || 'Usuario actualizado con éxito.');

      // Redirigir después de un breve momento
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al actualizar el usuario.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado
  if (loading) {
    return <Layout><p className="p-4 text-center text-slate-500">Cargando datos del usuario...</p></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4 text-primary-600 hover:underline">
          &larr; Volver a Gestión de Usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar Usuario</h1>

        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{success}</p>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre:</label>
            <input
              type="text" id="name" name="name" required
              value={userData.name} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email:</label>
            <input
              type="email" id="email" name="email" required
              value={userData.email} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">Rol:</label>
            <select
              id="role" name="role" value={userData.role} onChange={handleChange}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="technician">Técnico</option>
              <option value="admin">Admin</option>
            </select>
          </div>
           <div className="flex items-center">
             <input
                id="isActive" name="isActive" type="checkbox"
                checked={userData.isActive} onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded mr-2"
             />
             <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Usuario Activo</label>
           </div>

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

export default EditUser;