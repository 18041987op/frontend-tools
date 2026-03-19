

// src/components/QRScanner.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Importar desde la librería

const QRScanner = ({ onClose }) => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [scannerInstance, setScannerInstance] = useState(null); // Para guardar la instancia y poder limpiarla

  const [initialized, setInitialized] = useState(false); // bandera para evitar doble init

  useEffect(() => {
    // Si ya está inicializado, no vuelvas a crearlo
    if (initialized) return;
    setInitialized(true);

    // Crear e iniciar el scanner cuando el componente se monta
    const scanner = new Html5QrcodeScanner(
      "qr-scanner-container", // ID del div contenedor
      {
        fps: 10, // Frames por segundo a procesar (opcional)
        qrbox: { width: 250, height: 250 }, // Tamaño de la caja de escaneo (opcional)
        rememberLastUsedCamera: true, // Intentar usar la última cámara (opcional)
        supportedScanTypes: [0] // 0 significa usar la cámara (SCAN_TYPE_CAMERA)
      },
      false // verbose = false
    );
    setScannerInstance(scanner); // Guardar instancia

    // --- Callback si el escaneo es exitoso ---
    const onScanSuccess = (decodedText, decodedResult) => {
      console.log(`Scan Exitoso: ${decodedText}`, decodedResult);
      setScanResult(decodedText); // Guardar resultado
      scanner.clear().then(() => { // Detener el escáner
        console.log("Escáner detenido.");
        // Procesar el resultado
        processScanResult(decodedText);
      }).catch(error => {
         console.error("Fallo al detener el escáner:", error);
         // Igualmente intentar procesar
         processScanResult(decodedText);
      });
    };

    // --- Callback si el escaneo falla (opcional, puede ser ruidoso) ---
    const onScanFailure = (error) => {
      // Puedes ignorar errores comunes o loguearlos si es necesario
      // console.warn(`Scan Error: ${error}`);
    };

    // Renderizar el escáner
    scanner.render(onScanSuccess, onScanFailure);

    // --- Limpiar al desmontar ---
    return () => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error("Fallo al limpiar el escáner al desmontar:", error);
        });
      }
    };
    
  }, []); // El array vacío asegura que se ejecute solo al montar // eslint-disable-next-line react-hooks/exhaustive-deps


  // --- Procesar la URL escaneada ---
  const processScanResult = (url) => {
    try {
      // Intentar parsear la URL
      const parsedUrl = new URL(url);
      // Verificar si la ruta empieza con '/tools/'
      const match = parsedUrl.pathname.match(/^\/tools\/([a-zA-Z0-9]+)$/);

      if (match && match[1]) {
        const toolId = match[1];
        console.log(`ID de herramienta extraído: ${toolId}`);
        navigate(`/tools/${toolId}`); // Navegar a la página de detalles
        onClose(); // Cerrar el modal
      } else {
        setScannerError(`Código QR no parece ser una URL de herramienta válida: ${url}`);
        // Opcional: reiniciar el escáner si queremos permitir múltiples escaneos
        // if (scannerInstance) scannerInstance.render(onScanSuccess, onScanFailure);
      }
    } catch (e) {
      // Si no es una URL válida
      setScannerError(`Contenido del QR no es una URL válida: ${url}`);
      // Opcional: reiniciar escáner
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-center">Escanear Código QR</h2>

      {scannerError && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {scannerError}
        </div>
      )}
       {scanResult && !scannerError && ( // Mostrar si hubo resultado pero aún no navega/cierra
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
          Escaneado: {scanResult}. Redirigiendo...
        </div>
      )}

      {/* Contenedor donde se renderizará la UI del escáner */}
      <div id="qr-scanner-container" className="w-full max-w-md mx-auto border bg-slate-100 rounded">
         {/* El componente Html5QrcodeScanner insertará la UI aquí */}
      </div>

      <p className="mt-4 text-sm text-slate-500 text-center">
        Apunta la cámara de tu dispositivo al código QR de la herramienta.
      </p>

       {/* El botón de cancelar se maneja ahora en Layout.js, pero lo dejamos aquí por si acaso */}
       {/* <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
        </div> */}
    </div>
  );
};

export default QRScanner;

// // src/components/QRScanner.js
// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Html5QrcodeScanner } from 'html5-qrcode'; // Importar desde la librería

// const QRScanner = ({ onClose }) => {
//   const navigate = useNavigate();
//   const [scannerError, setScannerError] = useState(null);
//   const scannerContainerId = "qr-scanner-render-region"; // Usar un ID descriptivo
//   // Usamos useRef para mantener una referencia *estable* al objeto scanner
//   const scannerRef = useRef(null);

//   // Función para procesar el resultado del escaneo
//   const processScanResult = useCallback((url) => {
//     try {
//       const parsedUrl = new URL(url);
//       const match = parsedUrl.pathname.match(/^\/tools\/([a-zA-Z0-9]+)$/);
//       if (match && match[1]) {
//         const toolId = match[1];
//         console.log(`ID de herramienta extraído: ${toolId}`);
//         navigate(`/tools/${toolId}`);
//         onClose(); // Cerrar modal después de navegar
//       } else {
//         setScannerError(`Código QR no parece ser una URL de herramienta válida: ${url}`);
//         // Podríamos reiniciar el scanner aquí si quisiéramos permitir múltiples escaneos fallidos
//       }
//     } catch (e) {
//       setScannerError(`Contenido del QR no es una URL válida: ${url}`);
//     }
//   }, [navigate, onClose]);

//   // Efecto para montar y desmontar el escáner
//   useEffect(() => {
//     // Solo inicializar si no existe ya una instancia activa en nuestro ref
//     if (!scannerRef.current) {
//       console.log('DEBUG: Inicializando Html5QrcodeScanner...');

//       // Crear la instancia
//       const scanner = new Html5QrcodeScanner(
//         scannerContainerId,
//         {
//           fps: 10,
//           qrbox: (viewfinderWidth, viewfinderHeight) => {
//             // Calcular tamaño de la caja de escaneo (ej. 70% del menor lado)
//             const minEdgePercentage = 0.7;
//             const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
//             const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
//             return { width: qrboxSize, height: qrboxSize };
//           },
//           rememberLastUsedCamera: true,
//           supportedScanTypes: [0] // SCAN_TYPE_CAMERA
//         },
//         /* verbose= */ false
//       );

//       // --- Callbacks ---
//       const onScanSuccess = (decodedText, decodedResult) => {
//         console.log(`Scan Exitoso: ${decodedText}`);
//         // Limpiar el escáner ANTES de procesar
//         if (scannerRef.current) {
//           scannerRef.current.clear()
//             .then(() => {
//               console.log("Escáner detenido por éxito.");
//               processScanResult(decodedText);
//             })
//             .catch(err => {
//               console.error('Fallo al detener escáner tras éxito:', err);
//               processScanResult(decodedText); // Intentar procesar de todos modos
//             });
//           scannerRef.current = null; // Marcar como limpiado
//         }
//       };

//       const onScanFailure = (error) => {
//         // Ignorar errores comunes tipo "QR code not found"
//         // console.warn(`Scan Failure: ${error}`);

//         // MODIFICADO: Añadir log de error para depuración
//       console.error(`DEBUG: onScanFailure error: ${error}`);
//       // Probablemente no quieras establecer un error en la UI por cada frame sin QR
//       // setScannerError(`Error de escaneo: ${error}`);
//       };

//       // Renderizar e iniciar el escaneo
//       // Verificar si el elemento contenedor existe ANTES de renderizar
//        const containerElement = document.getElementById(scannerContainerId);
//         if (containerElement) {
//             scanner.render(onScanSuccess, onScanFailure);
//             scannerRef.current = scanner; // Guardar la instancia solo si render() se llamó
//             console.log("DEBUG: scanner.render() llamado.");
//         } else {
//              console.error(`DEBUG: Contenedor "${scannerContainerId}" no encontrado al intentar renderizar.`);
//              setScannerError("Error al iniciar UI del escáner.");
//         }

//     } else {
//        console.log("DEBUG: Ya existe instancia de escáner, saltando inicialización.");
//     }

//     // --- Función de Limpieza ---
//     return () => {
//       console.log("DEBUG: Ejecutando limpieza de QRScanner...");
//       // Si existe una instancia en el ref, intenta limpiarla
//       if (scannerRef.current) {
//         console.log("DEBUG: Limpiando instancia del escáner...");
//         scannerRef.current.clear()
//           .then(() => console.log("DEBUG: Limpieza del escáner exitosa."))
//           .catch(error => console.error("DEBUG: Fallo al limpiar el escáner:", error))
//           .finally(() => {
//             scannerRef.current = null; // Asegurarse de limpiar la referencia
//           });
//       } else {
//         console.log("DEBUG: No había instancia activa para limpiar.");
//       }
//     };
//   // Dependencia: Solo queremos que se ejecute al montar/desmontar el componente
//   // y que processScanResult sea estable.
//   }, [processScanResult]);


//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-4 text-center">Escanear Código QR</h2>
//       {scannerError && (
//         <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
//           {scannerError}
//         </div>
//       )}
//       {/* Contenedor con ID único donde la librería inyectará la UI */}
//       {/* Asegúrate que este ID no se repita en ningún otro lugar */}
//       <div id={scannerContainerId} className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto border bg-gray-100 rounded min-h-[300px]"></div>
//       <p className="mt-4 text-sm text-gray-500 text-center">
//         Apunta la cámara al código QR.
//       </p>
//        {/* El botón Cancelar está en Layout.js */}
//     </div>
//   );
// };

// export default QRScanner;