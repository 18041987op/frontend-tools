// src/services/api.js
import axios from 'axios';

// La URL se lee de la variable de entorno.
// En desarrollo: crea un archivo .env.local con REACT_APP_API_URL=http://localhost:5000/api
// En producción: configura la variable en Firebase Hosting o en tu proceso de build
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tools-autorx.onrender.com/api';

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor: agrega el token JWT a cada petición automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Autenticación ────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al iniciar sesión' };
  }
};

export const register = async (name, email, password, role) => {
  try {
    const response = await api.post('/users/register', { name, email, password, role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al registrar usuario' };
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

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export const getUsers = async () => {
  try {
    const response = await api.get('/users');
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

export const adminCreateUser = async (name, email, role) => {
  try {
    const response = await api.post('/users/admin/create', { name, email, role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear usuario' };
  }
};

export const getUserByIdForAdmin = async (userId) => {
  try {
    const response = await api.get(`/users/admin/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener datos del usuario' };
  }
};

export const updateUserByAdmin = async (userId, userData) => {
  try {
    const response = await api.put(`/users/admin/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar usuario' };
  }
};

export const updateUserStatusApi = async (userId, isActive) => {
  try {
    const response = await api.patch(`/users/admin/${userId}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Error al ${isActive ? 'activar' : 'desactivar'} usuario` };
  }
};

// ─── Herramientas ─────────────────────────────────────────────────────────────

export const getTools = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/tools${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener herramientas' };
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

export const createTool = async (toolData) => {
  try {
    const response = await api.post('/tools', toolData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear herramienta' };
  }
};

export const updateTool = async (toolId, toolData) => {
  try {
    const response = await api.put(`/tools/${toolId}`, toolData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar la herramienta' };
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

// ─── Préstamos ────────────────────────────────────────────────────────────────

export const getLoans = async (queryParams = {}) => {
  try {
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const url = queryString ? `/loans?${queryString}` : '/loans';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener préstamos' };
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

export const borrowTool = async (loanData) => {
  try {
    const response = await api.post('/loans', loanData);
    return response.data;
  } catch (error) {
    if (error.request && !error.response) {
      throw { message: 'No se obtuvo respuesta del servidor. Verifica la conexión.' };
    }
    throw error.response?.data || { message: 'Error al solicitar el préstamo' };
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

// Alias de returnTool con formato de datos normalizado
export const returnToolAPI = async (loanId, returnData = {}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay sesión activa');

  const formattedData = returnData.returnCondition
    ? returnData
    : {
        returnCondition: {
          status: returnData.hasDamage ? 'damaged' : 'good',
          hasDamage: !!returnData.hasDamage,
          damageDescription: returnData.damageDescription || '',
        },
      };

  return returnTool(loanId, formattedData);
};

export const transferTool = async (loanId, transferData) => {
  try {
    const response = await api.put(`/loans/${loanId}/transfer`, transferData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al transferir la herramienta' };
  }
};

// ─── Notificaciones ───────────────────────────────────────────────────────────

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
    throw error.response?.data || { message: 'Error al marcar notificación como leída' };
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

// ─── Reportes ─────────────────────────────────────────────────────────────────

export const getLateReturnsReport = async () => {
  try {
    const response = await api.get('/reports/late-returns-by-technician');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener reporte de devoluciones tardías' };
  }
};

export const getDamagedReturnsReport = async () => {
  try {
    const response = await api.get('/reports/damaged-returns-by-technician');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener reporte de herramientas dañadas' };
  }
};

export default api;
