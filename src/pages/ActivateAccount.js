//src/pages/ActivateAccount.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Importa la función activateAccount desde el archivo api.js
import { activateAccount } from '../services/api';

const ActivateAccount = () => {
  // Extraer parámetros de la URL (userId y token)
  const { userId, token } = useParams();
  const navigate = useNavigate();

  // Estados para las contraseñas, mensaje de respuesta y loading
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      // Llamada a la función activateAccount con userId, token y password
      const response = await activateAccount(userId, token, password);
      setMessage(response.message);
      // Redirige al login después de unos segundos si la activación fue exitosa
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage(error.message || 'Error en la activación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activation-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h1>Activar Cuenta</h1>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Nueva Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Confirmar Contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
          {loading ? 'Activando...' : 'Activar Cuenta'}
        </button>
      </form>
    </div>
  );
};

export default ActivateAccount;
