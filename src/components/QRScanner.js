// src/components/QRScanner.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const QRScanner = ({ onClose }) => {
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        // Solicitar acceso a la cámara
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        // Asignar el stream al elemento de video
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(`No se pudo acceder a la cámara: ${err.message}`);
      }
    };

    startCamera();

    // Limpiar al desmontar
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Función para simular un escaneo exitoso
  const simulateScan = () => {
    // En una implementación real, aquí procesaríamos la imagen del video
    // para detectar y decodificar códigos QR
    navigate('/catalog');
    onClose();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Escanear Código QR</h2>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="w-full max-w-md mx-auto">
        {/* Video element to show camera feed */}
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '300px', backgroundColor: '#000' }}
          className="rounded"
        />
        
        {cameraActive ? (
          <div className="my-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            Cámara activa. En una implementación completa, detectaríamos automáticamente códigos QR.
          </div>
        ) : (
          <div className="my-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded text-center">
            Iniciando cámara...
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
          
          <button
            onClick={simulateScan}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            disabled={!cameraActive}
          >
            Simular Escaneo
          </button>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-gray-500 text-center">
        Nota: Esta es una versión simplificada del escáner QR.
        <br />
        Utiliza el botón "Simular Escaneo" para continuar.
      </p>
    </div>
  );
};

export default QRScanner;