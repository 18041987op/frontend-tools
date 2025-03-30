// src/services/api.js
import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
// const API_URL = window.location.hostname === 'localhost' 
//   ? 'http://localhost:5000/api'
//   : 'https://tools-autorx.onrender.com/api';

const API_URL = 'https://tools-autorx.onrender.com/api';

console.log('API URL configurada:', API_URL); // Log para debugging

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://tools-autorx.onrender.com/api',
  //baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Interceptor para agregar token a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exportar funciones específicas para cada operación
export const login = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al iniciar sesión' };
  }
};

export const getTools = async (filters = {}) => {
  try {
    // Crear cadena de consulta a partir de los filtros
    let queryString = '';
    
    if (Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      
      // Procesar cada filtro
      for (const [key, value] of Object.entries(filters)) {
        // Si el valor es un array, añadir múltiples entradas con el mismo key
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
      
      queryString = `?${params.toString()}`;
    }
    
    console.log('Consultando herramientas con filtros:', queryString);
    
    const response = await api.get(`/tools${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener herramientas' };
  }
};

export default api;

// Agregar esta función de función de registro
export const register = async (name, email, password, role) => {
  try {
    const response = await api.post('/users/register', { 
      name, 
      email, 
      password, 
      role 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al registrar usuario' };
  }
};

export const createTool = async (toolData) => {
  try {
    const response = await api.post('/tools', toolData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear herramienta' };
  }
};

export const getToolById = async (id) => {
  try {
    const response = await api.get(`/tools/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener la herramienta' };
  }
};

// NUEVO: Actualizar una herramienta existente
export const updateTool = async (toolId, toolData) => {
  try {
    // Asegúrate de que toolData contenga solo los campos que quieres permitir editar
    // Ej: { name, category, serialNumber, location, description }
    // NO deberíamos enviar 'status' desde aquí usualmente, se maneja aparte.
    const response = await api.put(`/tools/${toolId}`, toolData);
    return response.data; // Esperamos { success: true, data: updatedTool }
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar la herramienta' };
  }
};

// export const borrowTool = async (loanData) => {
//   try {
//     const response = await api.post('/loans', loanData);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || { message: 'Error al solicitar el préstamo' };
//   }
// };

// Reemplaza la función borrowTool en src/services/api.js

export const borrowTool = async (loanData) => {
  try {
    console.log("Enviando solicitud de préstamo:", loanData);
    
    // Verificar token (debugging)
    const token = localStorage.getItem('token');
    console.log("Token presente:", !!token);
    
    const response = await api.post('/loans', loanData);
    console.log("Respuesta recibida:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al solicitar préstamo:", error);
    
    // Mostrar detalles completos del error
    if (error.response) {
      // El servidor respondió con un código de error
      console.error("Respuesta del servidor:", error.response.status, error.response.data);
      throw error.response.data || { message: 'Error al solicitar el préstamo' };
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error("No se recibió respuesta del servidor");
      throw { message: 'No se obtuvo respuesta del servidor. Verifica la conexión.' };
    } else {
      // Algo ocurrió al configurar la solicitud
      console.error("Error al configurar la solicitud:", error.message);
      throw { message: error.message || 'Error al configurar la solicitud de préstamo' };
    }
  }
};

// Modificar getMyLoans para verificar qué datos se reciben
export const getMyLoans = async () => {
  try {
    console.log('API: Obteniendo préstamos activos...');
    const response = await api.get('/loans/my-tools');
    console.log('API: Préstamos recibidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error al obtener préstamos:', error);
    throw error.response?.data || { message: 'Error al obtener herramientas prestadas' };
  }
};

export const returnTool = async (loanId, returnData) => {
  try {
    console.log(`API: Intentando devolver herramienta con ID: ${loanId}`);
    console.log('API: Datos completos de devolución:', JSON.stringify(returnData));
    const response = await api.put(`/loans/${loanId}/return`, returnData);
    console.log('API: Respuesta completa de devolución:', response);
    return response.data;
  } catch (error) {
    console.error('API: Error completo al devolver herramienta:', error);
    if (error.response) {
      console.error('API: Detalles del error del servidor:', error.response.data);
    }
    throw error.response?.data || { message: 'Error al devolver la herramienta' };
  }
};

// Añadir a src/services/api.js
export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener notificaciones' };
  }
};

export const getUnreadNotificationsCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener conteo de notificaciones' };
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw  error.response?.data || { message: 'Error al marcar notificación como leída' };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al marcar notificaciones como leídas' };
  }
};

// Agregar esta función al archivo src/services/api.js

export const transferTool = async (loanId, transferData) => {
  try {
    const response = await api.put(`/loans/${loanId}/transfer`, transferData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al transferir la herramienta' };
  }
};

export const getLoans = async (queryParams = {}) => {
  try {
    // Convertir parámetros de consulta a string de consulta para la URL
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const url = queryString ? `/loans?${queryString}` : '/loans';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener préstamos' };
  }
};

// NUEVO: Función para obtener todos los usuarios (requiere ser admin)
export const getUsers = async () => {
  try {
    const response = await api.get('/users'); // Llama a la ruta GET /api/users
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener la lista de usuarios' };
  }
};

export const getTechnicians = async () => {
  try {
    const response = await api.get('/users/technicians');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener lista de técnicos' };
  }
};

export const updateToolStatus = async (toolId, statusData) => {
  try {
    const response = await api.patch(`/tools/${toolId}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar el estado de la herramienta' };
  }
};

// Devolver una herramienta
export const returnToolAPI = async (loanId, returnData = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw Error('No hay sesión activa');
    }
    
    console.log(`returnToolAPI: Devolviendo herramienta con ID: ${loanId}`, returnData);
    
    // Asegurarnos de que returnData tenga la estructura correcta
    const formattedData = returnData.returnCondition 
      ? returnData  // Si ya tiene la estructura correcta, usarla directamente
      : { 
          returnCondition: {
            status: returnData.hasDamage ? 'damaged' : 'good',
            hasDamage: !!returnData.hasDamage,
            damageDescription: returnData.damageDescription || ''
          }
        };
    
    console.log('Datos formateados para enviar:', formattedData);
    
    const response = await api.put(`/loans/${loanId}/return`, formattedData);
    
    return response.data;
  } catch (error) {
    console.error('Error al devolver herramienta:', error);
    
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    }
    
    throw error.response?.data?.message || 'Error al devolver la herramienta';
  }
};

export const activateAccount = async (userId, token, password) => {
  try {
    const response = await api.post(`/users/activate/${userId}/${token}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al activar la cuenta' };
  }
};

export const adminCreateUser = async (name, email, role) => {
  try {
    // Usa '/admin/users' y NO incluyas un prefijo adicional
    const response = await api.post('/users/admin/users', { name, email, role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear usuario' };
  }
};

// NUEVA FUNCIÓN: Actualizar estado activo/inactivo de un usuario
export const updateUserStatusApi = async (userId, isActive) => {
  try {
    const response = await api.patch(`/users/${userId}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Error al ${isActive ? 'activar' : 'desactivar'} usuario` };
  }
};

// NUEVO: Obtener datos de un usuario específico por ID (para Admin)
export const getUserByIdForAdmin = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data; // Esperamos { success: true, data: user }
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener datos del usuario' };
  }
};

// NUEVO: Actualizar datos de un usuario por ID (por Admin)
export const updateUserByAdmin = async (userId, userData) => {
  try {
    // Asegúrate de enviar solo los campos que quieres actualizar (ej: name, email, role, isActive)
    const response = await api.put(`/users/${userId}`, userData);
    return response.data; // Esperamos { success: true, message: '...', data: updatedUser }
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar usuario' };
  }
};