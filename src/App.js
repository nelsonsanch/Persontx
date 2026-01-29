import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import ClienteDashboard from './pages/ClienteDashboard';
import AdminDashboard from './pages/AdminDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- CÓDIGO EXISTENTE ---
// 1. Importamos la nueva página que creamos
import HojaDeVida from './pages/HojaDeVida';

// --- CÓDIGO NUEVO PARA PORTAL DE TRABAJADORES ---
// 2. Importamos el portal de trabajadores
import PortalTrabajadores from './components/common/PortalTrabajadores';
// --- FIN DE CÓDIGO NUEVO ---

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userRole } = useAuth();

  console.log('=== PROTECTED ROUTE DEBUG ===');
  console.log('Usuario:', user?.email);
  console.log('Rol actual:', userRole);
  console.log('Rol requerido:', requiredRole);
  console.log('=============================');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // PERMISO ESPECIAL: Permitir que 'trabajador' acceda a rutas de 'cliente'
  if (requiredRole === 'cliente' && userRole === 'trabajador') {
    console.log('✅ Acceso permitido a trabajador en ruta de cliente');
    // Continúa para renderizar children
  }
  else if (requiredRole && userRole !== requiredRole) {
    console.log('❌ Rol no coincide, redirigiendo según rol real...');

    if (userRole === 'admin') {
      console.log('🔄 Redirigiendo admin a /admin');
      return <Navigate to="/admin" replace />;
    }
    else if (userRole === 'cliente') {
      console.log('🔄 Redirigiendo cliente a /cliente');
      return <Navigate to="/cliente" replace />;
    }
    // Si es trabajador y falló la validación anterior (por ejemplo si intentara entrar a admin)
    else if (userRole === 'trabajador') {
      console.log('🔄 Redirigiendo trabajador a /cliente');
      return <Navigate to="/cliente" replace />;
    }
    else {
      console.log('🔄 Sin rol definido, redirigiendo a login');
      return <Navigate to="/login" replace />;
    }
  }

  console.log('✅ Acceso permitido');
  return children;
};

const AppRoutes = () => {
  const { user, userRole } = useAuth();

  console.log('=== APP ROUTES DEBUG ===');
  console.log('Usuario:', user?.email);
  console.log('Rol:', userRole);
  console.log('========================');

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user && userRole ? (
            userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/cliente" replace />
          ) : <Login />
        }
      />

      {/* --- CÓDIGO NUEVO PARA PORTAL DE TRABAJADORES --- */}
      {/* Ruta PÚBLICA para que los trabajadores accedan con cédula */}
      <Route
        path="/trabajador"
        element={<PortalTrabajadores />}
      />

      {/* NUEVA RUTA: Portal de trabajadores para encuestas */}
      <Route
        path="/portal-trabajadores"
        element={<PortalTrabajadores />}
      />
      {/* --- FIN DE CÓDIGO NUEVO --- */}

      <Route
        path="/cliente"
        element={
          <ProtectedRoute requiredRole="cliente">
            <ClienteDashboard />
          </ProtectedRoute>
        }
      />

      {/* --- CÓDIGO EXISTENTE --- */}
      {/* 2. Añadimos la nueva ruta para la Hoja de Vida */}
      {/* El ":trabajadorId" es un parámetro que le pasaremos para saber de qué trabajador mostrar la info */}
      <Route
        path="/cliente/trabajador/:trabajadorId"
        element={
          <ProtectedRoute requiredRole="cliente">
            <HojaDeVida />
          </ProtectedRoute>
        }
      />
      {/* --- FIN DE CÓDIGO EXISTENTE --- */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user && userRole ? (
            userRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/cliente" replace />
          ) : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;