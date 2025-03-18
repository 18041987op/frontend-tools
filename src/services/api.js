// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: API_URL,
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

export const getTools = async () => {
  try {
    const response = await api.get('/tools');
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

export const getMyLoans = async () => {
  try {
    const response = await api.get('/loans/my-tools');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener herramientas prestadas' };
  }
};

export const returnTool = async (loanId, returnData) => {
  try {
    const response = await api.put(`/loans/${loanId}/return`, returnData);
    return response.data;
  } catch (error) {
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
export const returnToolAPI = async (loanId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw Error('No hay sesión activa');
    }
    
    const response = await axios.put(
      `${API_URL}/loans/${loanId}/return`,
      {},  // Cuerpo vacío, podríamos agregar returnCondition si fuera necesario
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error al devolver herramienta:', error);
    throw error.response?.data?.message || 'Error al devolver la herramienta';
  }
};