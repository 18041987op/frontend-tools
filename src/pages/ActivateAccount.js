// src/pages/ActivateAccount.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activateAccount } from '../services/api';

const ActivateAccount = () => {
  const { userId, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const response = await activateAccount(userId, token, password);
      setMessage(response.message);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
        <h1 className="text-2xl font-semibold text-center mb-6">Activar Cuenta</h1>
        {message && (
          <div className="mb-4 p-3 text-center text-red-500 border border-red-500 rounded">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
              placeholder="********"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Activando...' : 'Activar Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivateAccount;


// //src/pages/ActivateAccount.js
// import React, { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// // Importa la función activateAccount desde el archivo api.js
// import { activateAccount } from '../services/api';

// const ActivateAccount = () => {
//   // Extraer parámetros de la URL (userId y token)
//   const { userId, token } = useParams();
//   const navigate = useNavigate();

//   // Estados para las contraseñas, mensaje de respuesta y loading
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Función para manejar el envío del formulario
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validar que las contraseñas coincidan
//     if (password !== confirmPassword) {
//       setMessage('Las contraseñas no coinciden.');
//       return;
//     }

//     try {
//       setLoading(true);
//       // Llamada a la función activateAccount con userId, token y password
//       const response = await activateAccount(userId, token, password);
//       setMessage(response.message);
//       // Redirige al login después de unos segundos si la activación fue exitosa
//       setTimeout(() => {
//         navigate('/login');
//       }, 3000);
//     } catch (error) {
//       setMessage(error.message || 'Error en la activación.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="activation-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
//       <h1>Activar Cuenta</h1>
//       {message && <p>{message}</p>}
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: '1rem' }}>
//           <label>Nueva Contraseña</label>
//           <input
//             type="password"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             required
//             style={{ width: '100%', padding: '0.5rem' }}
//           />
//         </div>
//         <div style={{ marginBottom: '1rem' }}>
//           <label>Confirmar Contraseña</label>
//           <input
//             type="password"
//             value={confirmPassword}
//             onChange={e => setConfirmPassword(e.target.value)}
//             required
//             style={{ width: '100%', padding: '0.5rem' }}
//           />
//         </div>
//         <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
//           {loading ? 'Activando...' : 'Activar Cuenta'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ActivateAccount;
