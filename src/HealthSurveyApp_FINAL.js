import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importaciones principales
import { NotificationProvider } from './NotificationService';
import { SurveyStateProvider } from './SurveyStateManager';
import NotificationCenter from './NotificationCenter';
import PerformanceMonitorPanel from './PerformanceOptimizer';

// Lazy loading de componentes para optimización
const EncuestaLogin = lazy(() => import('./EncuestaLogin_COMPLETO'));
const PortalEncuestas = lazy(() => import('./PortalEncuestas_COMPLETO'));
const FormularioEncuesta = lazy(() => import('./FormularioEncuesta_COMPLETO'));
const EncuestaCompletada = lazy(() => import('./EncuestaCompletada_COMPLETO'));
const DashboardSalud = lazy(() => import('./DashboardSalud_COMPLETO'));
const StateMonitoringPanel = lazy(() => import('./StateMonitoringPanel'));
const IntegrationTestRunner = lazy(() => import('./IntegrationTests'));

/**
 * Aplicación Principal del Sistema de Encuestas de Salud Ocupacional
 * 
 * Esta es la aplicación integrada final que combina todos los componentes
 * desarrollados para crear un sistema completo de gestión de encuestas de salud.
 */

// Configuración de la aplicación
const APP_CONFIG = {
  NAME: 'Sistema de Encuestas de Salud Ocupacional',
  VERSION: '1.0.0',
  AUTHOR: 'Equipo de Desarrollo',
  FEATURES: {
    AUTHENTICATION: true,
    PDF_GENERATION: true,
    AI_ANALYSIS: true,
    NOTIFICATIONS: true,
    STATE_MANAGEMENT: true,
    PERFORMANCE_MONITORING: true,
    INTEGRATION_TESTS: true
  },
  ROUTES: {
    LOGIN: '/login',
    PORTAL: '/portal',
    SURVEY: '/encuesta',
    COMPLETED: '/completada',
    DASHBOARD: '/dashboard',
    MONITORING: '/monitoring',
    TESTS: '/tests'
  }
};

// Componente de carga
const LoadingSpinner = ({ message = 'Cargando...' }) => (
  <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">Cargando...</span>
    </div>
    <h5 className="text-primary">{message}</h5>
    <p className="text-muted">Sistema de Encuestas de Salud Ocupacional</p>
  </div>
);

// Componente de error
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error, errorInfo) => {
      setHasError(true);
      setError(error);
      console.error('Error en la aplicación:', error, errorInfo);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">🚨 Error en la Aplicación</h4>
            <p>Ha ocurrido un error inesperado en el sistema.</p>
            <hr />
            <p className="mb-0">
              <button 
                className="btn btn-outline-danger"
                onClick={() => window.location.reload()}
              >
                🔄 Recargar Aplicación
              </button>
            </p>
          </div>
          {error && (
            <details className="mt-3">
              <summary className="btn btn-sm btn-outline-secondary">Ver detalles técnicos</summary>
              <pre className="text-start mt-2 p-3 bg-light border rounded">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return children;
};

// Header de la aplicación
const AppHeader = ({ user, onLogout, showNotifications = true }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center" href="#/">
          <span className="me-2">🏥</span>
          <div>
            <div className="fw-bold">Encuestas de Salud</div>
            <small className="opacity-75">Sistema Ocupacional</small>
          </div>
        </a>

        <div className="navbar-nav ms-auto d-flex flex-row align-items-center gap-3">
          {/* Información del usuario */}
          {user && (
            <div className="nav-item d-flex align-items-center text-white">
              <div className="me-3">
                <div className="fw-bold">{user.nombre}</div>
                <small className="opacity-75">{user.cargo}</small>
              </div>
              <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center"
                   style={{ width: '40px', height: '40px' }}>
                <strong>{user.nombre?.charAt(0) || '👤'}</strong>
              </div>
            </div>
          )}

          {/* Centro de notificaciones */}
          {showNotifications && <NotificationCenter />}

          {/* Botón de logout */}
          {user && onLogout && (
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={onLogout}
              title="Cerrar Sesión"
            >
              🚪 Salir
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Footer de la aplicación
const AppFooter = () => {
  return (
    <footer className="bg-light border-top py-3 mt-auto">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-6">
            <small className="text-muted">
              © 2024 {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
            </small>
          </div>
          <div className="col-md-6 text-md-end">
            <small className="text-muted">
              Desarrollado por {APP_CONFIG.AUTHOR}
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Componente principal de la aplicación
const HealthSurveyApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appMode, setAppMode] = useState('production'); // production, development, testing

  // Inicialización de la aplicación
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Inicializando Sistema de Encuestas de Salud...');
      
      // Verificar sesión existente
      const savedSession = localStorage.getItem('health_survey_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (isValidSession(session)) {
            setCurrentUser(session.user);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.warn('Sesión guardada inválida:', error);
          localStorage.removeItem('health_survey_session');
        }
      }

      // Detectar modo de desarrollo
      if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        setAppMode('development');
        console.log('🔧 Modo de desarrollo activado');
      }

      console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidSession = (session) => {
    if (!session || !session.user || !session.expiresAt) return false;
    return new Date(session.expiresAt) > new Date();
  };

  const handleLogin = (userData) => {
    const session = {
      user: userData,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    localStorage.setItem('health_survey_session', JSON.stringify(session));
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    console.log('✅ Usuario autenticado:', userData.nombre);
  };

  const handleLogout = () => {
    localStorage.removeItem('health_survey_session');
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    console.log('👋 Usuario desconectado');
  };

  // Rutas protegidas
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to={APP_CONFIG.ROUTES.LOGIN} replace />;
    }
    return children;
  };

  // Rutas administrativas (solo para desarrollo/testing)
  const AdminRoute = ({ children }) => {
    if (appMode === 'production') {
      return <Navigate to={APP_CONFIG.ROUTES.PORTAL} replace />;
    }
    return children;
  };

  if (isLoading) {
    return <LoadingSpinner message="Inicializando sistema..." />;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <SurveyStateProvider>
          <Router>
            <div className="d-flex flex-column min-vh-100">
              {/* Header */}
              <AppHeader 
                user={currentUser} 
                onLogout={handleLogout}
                showNotifications={isAuthenticated}
              />

              {/* Contenido principal */}
              <main className="flex-grow-1">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Ruta de login */}
                    <Route 
                      path={APP_CONFIG.ROUTES.LOGIN} 
                      element={
                        isAuthenticated ? 
                        <Navigate to={APP_CONFIG.ROUTES.PORTAL} replace /> :
                        <EncuestaLogin onLogin={handleLogin} />
                      } 
                    />

                    {/* Portal principal */}
                    <Route 
                      path={APP_CONFIG.ROUTES.PORTAL} 
                      element={
                        <ProtectedRoute>
                          <PortalEncuestas user={currentUser} />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Formulario de encuesta */}
                    <Route 
                      path={APP_CONFIG.ROUTES.SURVEY} 
                      element={
                        <ProtectedRoute>
                          <FormularioEncuesta user={currentUser} />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Encuesta completada */}
                    <Route 
                      path={APP_CONFIG.ROUTES.COMPLETED} 
                      element={
                        <ProtectedRoute>
                          <EncuestaCompletada user={currentUser} />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Dashboard administrativo */}
                    <Route 
                      path={APP_CONFIG.ROUTES.DASHBOARD} 
                      element={
                        <AdminRoute>
                          <DashboardSalud />
                        </AdminRoute>
                      } 
                    />

                    {/* Panel de monitoreo */}
                    <Route 
                      path={APP_CONFIG.ROUTES.MONITORING} 
                      element={
                        <AdminRoute>
                          <StateMonitoringPanel />
                        </AdminRoute>
                      } 
                    />

                    {/* Pruebas de integración */}
                    <Route 
                      path={APP_CONFIG.ROUTES.TESTS} 
                      element={
                        <AdminRoute>
                          <IntegrationTestRunner />
                        </AdminRoute>
                      } 
                    />

                    {/* Ruta por defecto */}
                    <Route 
                      path="/" 
                      element={
                        <Navigate 
                          to={isAuthenticated ? APP_CONFIG.ROUTES.PORTAL : APP_CONFIG.ROUTES.LOGIN} 
                          replace 
                        />
                      } 
                    />

                    {/* Ruta 404 */}
                    <Route 
                      path="*" 
                      element={
                        <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                          <div className="text-center">
                            <h1 className="display-1">404</h1>
                            <h4>Página no encontrada</h4>
                            <p className="text-muted">La página que busca no existe.</p>
                            <button 
                              className="btn btn-primary"
                              onClick={() => window.history.back()}
                            >
                              ← Volver
                            </button>
                          </div>
                        </div>
                      } 
                    />
                  </Routes>
                </Suspense>
              </main>

              {/* Footer */}
              <AppFooter />

              {/* Monitor de rendimiento (solo en desarrollo) */}
              {appMode === 'development' && <PerformanceMonitorPanel />}

              {/* Panel de desarrollo */}
              {appMode === 'development' && (
                <DevelopmentPanel 
                  currentUser={currentUser}
                  appMode={appMode}
                  onModeChange={setAppMode}
                />
              )}
            </div>
          </Router>
        </SurveyStateProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

// Panel de desarrollo (solo visible en modo desarrollo)
const DevelopmentPanel = ({ currentUser, appMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="development-panel position-fixed bottom-0 start-0 m-3" style={{ zIndex: 1000 }}>
      <div className={`card ${isOpen ? '' : 'collapsed'}`} style={{ width: isOpen ? '300px' : 'auto' }}>
        <div 
          className="card-header bg-warning text-dark d-flex justify-content-between align-items-center"
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: 'pointer' }}
        >
          <small className="fw-bold">🔧 Panel de Desarrollo</small>
          <small>{isOpen ? '▼' : '▶'}</small>
        </div>
        
        {isOpen && (
          <div className="card-body p-3">
            <div className="mb-3">
              <small className="text-muted">Modo actual:</small>
              <div className="btn-group btn-group-sm w-100">
                <button 
                  className={`btn ${appMode === 'development' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => onModeChange('development')}
                >
                  Dev
                </button>
                <button 
                  className={`btn ${appMode === 'testing' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => onModeChange('testing')}
                >
                  Test
                </button>
                <button 
                  className={`btn ${appMode === 'production' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => onModeChange('production')}
                >
                  Prod
                </button>
              </div>
            </div>

            <div className="mb-3">
              <small className="text-muted">Usuario actual:</small>
              <div className="small">
                {currentUser ? currentUser.nombre : 'No autenticado'}
              </div>
            </div>

            <div className="mb-3">
              <small className="text-muted">Características:</small>
              <div className="small">
                {Object.entries(APP_CONFIG.FEATURES)
                  .filter(([, enabled]) => enabled)
                  .map(([feature]) => (
                    <div key={feature} className="text-success">
                      ✅ {feature.replace('_', ' ')}
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="d-grid gap-1">
              <a href="/dashboard" className="btn btn-sm btn-outline-primary">
                📊 Dashboard
              </a>
              <a href="/monitoring" className="btn btn-sm btn-outline-info">
                ⚙️ Monitoreo
              </a>
              <a href="/tests" className="btn btn-sm btn-outline-warning">
                🧪 Pruebas
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Información del sistema
export const getSystemInfo = () => {
  return {
    name: APP_CONFIG.NAME,
    version: APP_CONFIG.VERSION,
    author: APP_CONFIG.AUTHOR,
    features: APP_CONFIG.FEATURES,
    buildDate: new Date().toISOString(),
    components: [
      'EncuestaLogin_COMPLETO',
      'PortalEncuestas_COMPLETO', 
      'FormularioEncuesta_COMPLETO',
      'EncuestaCompletada_COMPLETO',
      'AuthService',
      'PDFGeneratorService',
      'AIAnalysisService',
      'DashboardSalud_COMPLETO',
      'NotificationService',
      'SurveyStateManager',
      'StateMonitoringPanel',
      'PerformanceOptimizer',
      'IntegrationTests'
    ],
    dependencies: [
      'React',
      'React Router',
      'Recharts',
      'jsPDF',
      'pdfMake',
      'OpenAI',
      'Bootstrap'
    ]
  };
};

export default HealthSurveyApp;
