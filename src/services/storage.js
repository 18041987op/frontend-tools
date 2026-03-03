// src/services/storage.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tools-autorx.onrender.com/api';

/**
 * Sube una imagen al backend, que luego la sube a Firebase Storage
 * @param {File} file - archivo imagen
 * @param {string} toolId - id de la herramienta
 * @returns {Promise<string>} URL de la imagen
 */
export async function uploadToolImage(file, toolId) {
  if (!file) throw new Error("No file provided");
  if (!toolId) throw new Error("Missing toolId");

  try {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('image', file);
    formData.append('toolId', toolId);

    // Obtener token JWT
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No estás autenticado. Por favor inicia sesión.');
    }

    console.log('📤 Subiendo imagen al backend...');

    // Enviar al backend
    const response = await axios.post(
      `${API_BASE_URL}/upload/tool-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Imagen subida:', response.data.url);
      return response.data.url;
    } else {
      throw new Error(response.data.message || 'Error al subir imagen');
    }

  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al subir imagen');
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor');
    } else {
      throw new Error(error.message);
    }
  }
}