// src/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Configuración de Firebase desde variables de entorno.
// En desarrollo: define estas variables en .env.local (NO lo subas a git)
// En producción: configúralas en tu proceso de build (CI/CD o Firebase Hosting)
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export { app };

export const storage = getStorage(
  app,
  `gs://${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}`
);

// Auth anónima: necesaria para las reglas de seguridad de Storage
export const auth = getAuth(app);

let authReadyResolve;
export const ensureAuthReady = new Promise((resolve) => (authReadyResolve = resolve));

onAuthStateChanged(auth, (user) => {
  if (user) {
    authReadyResolve?.();
  } else {
    signInAnonymously(auth).catch(() => {
      // Resolvemos igual para no dejar la UI colgada
      authReadyResolve?.();
    });
  }
});
