import CryptoJS from 'crypto-js';

// Configuración de seguridad
const AUTH_CONFIG = {
  SECRET_KEY: process.env.REACT_APP_AUTH_SECRET || 'encuestas-salud-2024-secret-key',
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  STORAGE_KEY: 'encuesta_auth_token',
  MAX_ATTEMPTS: 3,
  LOCKOUT_TIME: 15 * 60 * 1000 // 15 minutos
};

class AuthService {
  constructor() {
    this.failedAttempts = new Map();
  }

  /**
   * Genera un hash seguro para la contraseña
   */
  generatePasswordHash(cedula, fechaIngreso) {
    // Crear un hash basado en cédula + fecha de ingreso
    const baseString = `${cedula}-${fechaIngreso}-${AUTH_CONFIG.SECRET_KEY}`;
    return CryptoJS.SHA256(baseString).toString().substring(0, 8).toUpperCase();
  }

  /**
   * Encripta datos sensibles
   */
  encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), AUTH_CONFIG.SECRET_KEY).toString();
  }

  /**
   * Desencripta datos
   */
  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, AUTH_CONFIG.SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Error al desencriptar datos:', error);
      return null;
    }
  }

  /**
   * Genera un token JWT personalizado
   */
  generateToken(trabajadorData) {
    const payload = {
      cedula: trabajadorData.cedula,
      nombre: trabajadorData.nombre,
      clienteId: trabajadorData.clienteId,
      cargo: trabajadorData.cargo,
      area: trabajadorData.area,
      fechaIngreso: trabajadorData.fechaIngreso,
      timestamp: Date.now(),
      expires: Date.now() + AUTH_CONFIG.TOKEN_EXPIRY
    };

    return this.encryptData(payload);
  }

  /**
   * Valida un token
   */
  validateToken(token) {
    if (!token) return null;

    const payload = this.decryptData(token);
    if (!payload) return null;

    // Verificar expiración
    if (Date.now() > payload.expires) {
      this.logout();
      return null;
    }

    return payload;
  }

  /**
   * Verifica si un usuario está bloqueado por intentos fallidos
   */
  isUserLocked(cedula) {
    const attempts = this.failedAttempts.get(cedula);
    if (!attempts) return false;

    if (attempts.count >= AUTH_CONFIG.MAX_ATTEMPTS) {
      const timeElapsed = Date.now() - attempts.lastAttempt;
      if (timeElapsed < AUTH_CONFIG.LOCKOUT_TIME) {
        return true;
      } else {
        // Resetear intentos después del tiempo de bloqueo
        this.failedAttempts.delete(cedula);
        return false;
      }
    }

    return false;
  }

  /**
   * Registra un intento fallido de login
   */
  recordFailedAttempt(cedula) {
    const attempts = this.failedAttempts.get(cedula) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.failedAttempts.set(cedula, attempts);
  }

  /**
   * Limpia los intentos fallidos de un usuario
   */
  clearFailedAttempts(cedula) {
    this.failedAttempts.delete(cedula);
  }

  /**
   * Autentica a un trabajador
   */
  async authenticateWorker(cedula, password, trabajadoresData) {
    // Verificar si el usuario está bloqueado
    if (this.isUserLocked(cedula)) {
      const attempts = this.failedAttempts.get(cedula);
      const remainingTime = Math.ceil((AUTH_CONFIG.LOCKOUT_TIME - (Date.now() - attempts.lastAttempt)) / 60000);
      throw new Error(`Usuario bloqueado. Intente nuevamente en ${remainingTime} minutos.`);
    }

    // Buscar el trabajador en la base de datos
    const trabajador = trabajadoresData.find(t => t.cedula === cedula);
    
    if (!trabajador) {
      this.recordFailedAttempt(cedula);
      throw new Error('Cédula no encontrada en el sistema');
    }

    // Verificar que el trabajador tenga una encuesta asignada y pendiente
    if (!trabajador.encuestaAsignada || trabajador.encuestaCompletada) {
      throw new Error('No tiene encuestas pendientes por completar');
    }

    // Generar la contraseña esperada
    const expectedPassword = this.generatePasswordHash(cedula, trabajador.fechaIngreso);

    // Verificar contraseña
    if (password !== expectedPassword) {
      this.recordFailedAttempt(cedula);
      const attempts = this.failedAttempts.get(cedula);
      const remainingAttempts = AUTH_CONFIG.MAX_ATTEMPTS - attempts.count;
      throw new Error(`Contraseña incorrecta. Intentos restantes: ${remainingAttempts}`);
    }

    // Autenticación exitosa
    this.clearFailedAttempts(cedula);
    
    // Generar token
    const token = this.generateToken(trabajador);
    
    // Guardar token en localStorage
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, token);
    
    // Registrar el acceso
    this.logAccess(trabajador);

    return {
      token,
      trabajador: {
        cedula: trabajador.cedula,
        nombre: trabajador.nombre,
        cargo: trabajador.cargo,
        area: trabajador.area,
        clienteId: trabajador.clienteId,
        encuestaId: trabajador.encuestaId
      }
    };
  }

  /**
   * Obtiene el usuario autenticado actual
   */
  getCurrentUser() {
    const token = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    return this.validateToken(token);
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Cierra la sesión
   */
  logout() {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
    // Limpiar otros datos de sesión si es necesario
    sessionStorage.clear();
  }

  /**
   * Registra el acceso del trabajador
   */
  logAccess(trabajador) {
    const accessLog = {
      cedula: trabajador.cedula,
      nombre: trabajador.nombre,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    // Guardar en localStorage para tracking (en producción usar base de datos)
    const logs = JSON.parse(localStorage.getItem('access_logs') || '[]');
    logs.push(accessLog);
    
    // Mantener solo los últimos 100 registros
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('access_logs', JSON.stringify(logs));
  }

  /**
   * Obtiene la IP del cliente (simulada)
   */
  getClientIP() {
    // En un entorno real, esto se obtendría del servidor
    return 'xxx.xxx.xxx.xxx';
  }

  /**
   * Genera una nueva contraseña para un trabajador
   */
  generateWorkerPassword(cedula, fechaIngreso) {
    return this.generatePasswordHash(cedula, fechaIngreso);
  }

  /**
   * Valida la fortaleza de una contraseña personalizada (si se permite)
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    return {
      isValid: score >= 3,
      score,
      feedback: {
        length: password.length >= minLength,
        upperCase: hasUpperCase,
        lowerCase: hasLowerCase,
        numbers: hasNumbers,
        specialChar: hasSpecialChar
      }
    };
  }

  /**
   * Obtiene estadísticas de acceso para el dashboard
   */
  getAccessStats() {
    const logs = JSON.parse(localStorage.getItem('access_logs') || '[]');
    const today = new Date().toDateString();
    
    return {
      totalAccesos: logs.length,
      accesosHoy: logs.filter(log => new Date(log.timestamp).toDateString() === today).length,
      ultimoAcceso: logs.length > 0 ? logs[logs.length - 1] : null,
      usuariosUnicos: [...new Set(logs.map(log => log.cedula))].length
    };
  }

  /**
   * Limpia logs antiguos (mantenimiento)
   */
  cleanOldLogs(daysToKeep = 30) {
    const logs = JSON.parse(localStorage.getItem('access_logs') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
    localStorage.setItem('access_logs', JSON.stringify(filteredLogs));
    
    return logs.length - filteredLogs.length; // Cantidad de logs eliminados
  }
}

// Instancia singleton
const authService = new AuthService();

export default authService;

// Utilidades adicionales para componentes
export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (cedula, password, trabajadoresData) => {
    const result = await authService.authenticateWorker(cedula, password, trabajadoresData);
    setUser(result.trabajador);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
};

// Componente HOC para proteger rutas
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/encuesta/login" replace />;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};
