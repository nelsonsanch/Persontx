import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhFRCkPBslG0ZSbgq0Z5DuU3N84g_4Qy0",
  authDomain: "gestion-empleados-app.firebaseapp.com",
  projectId: "gestion-empleados-app",
  storageBucket: "gestion-empleados-app.firebasestorage.app",
  messagingSenderId: "427525556289",
  appId: "1:427525556289:web:623488d05c004a655f5ec0",
  measurementId: "G-P04RBVF26M"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Secondary Auth for creating users specific purposes without logging out
import { getApp } from 'firebase/app';
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

export default app;
