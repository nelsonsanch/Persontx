import { useState, useEffect, createContext, useContext } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null); // Nuevo estado para datos completos
  const [dataScopeId, setDataScopeId] = useState(null); // ID del "Dueño de los datos" (Cliente)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Consultar el rol del usuario en Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data); // Guardar todo el documento
            setUserRole(data.rol || 'cliente');

            // Determinar el Scope de Datos
            if (data.rol === 'trabajador' && data.clienteId) {
              // Si es trabajador, ve los datos de su Jefe (Cliente)
              setDataScopeId(data.clienteId);
            } else {
              // Si es Admin o Cliente, o no tiene jefe, ve sus propios datos
              setDataScopeId(user.uid);
            }

          } else {
            // Si no existe en Firestore, asignar rol por defecto
            setUserRole('cliente');
            setDataScopeId(user.uid);
          }
        } catch (error) {
          console.error('Error al obtener rol del usuario:', error);
          setUserRole('cliente'); // Rol por defecto en caso de error
          setDataScopeId(user.uid);
        }
      } else {
        setUserRole(null);
        setUserData(null);
        setDataScopeId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    userData, // Exportar datos completos
    dataScopeId, // Exportar ID del dueño de los datos
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
