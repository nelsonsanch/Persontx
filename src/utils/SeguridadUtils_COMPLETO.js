import CryptoJS from 'crypto-js';

// Configuración de seguridad avanzada
const SECURITY_CONFIG = {
  ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'encuestas-salud-2024-encryption-key',
  HASH_SALT: process.env.REACT_APP_HASH_SALT || 'salud-ocupacional-salt-2024',
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  MAX_IDLE_TIME: 15 * 60 * 1000, // 15 minutos
  CSRF_TOKEN_LENGTH: 32,
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 1000 // 1 minuto
  }
};

class SeguridadUtils {
  constructor() {
    this.requestCounts = new Map();
    this.lastActivity = Date.now();
    this.csrfToken = this.generateCSRFToken();
    
    // Inicializar monitoreo de actividad
    this.initActivityMonitoring();
  }

  /**
   * Genera un hash seguro con salt
   */
  generateSecureHash(data, salt = SECURITY_CONFIG.HASH_SALT) {
    return CryptoJS.PBKDF2(data, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
  }

  /**
   * Encripta datos con AES-256
   */
  encryptData(data, key = SECURITY_CONFIG.ENCRYPTION_KEY) {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  }

  /**
   * Desencripta datos
   */
  decryptData(encryptedData, key = SECURITY_CONFIG.ENCRYPTION_KEY) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Error al desencriptar:', error);
      return null;
    }
  }

  /**
   * Genera un token CSRF
   */
  generateCSRFToken() {
    return CryptoJS.lib.WordArray.random(SECURITY_CONFIG.CSRF_TOKEN_LENGTH).toString();
  }

  /**
   * Valida token CSRF
   */
  validateCSRFToken(token) {
    return token === this.csrfToken;
  }

  /**
   * Sanitiza entrada de usuario
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+\s*=/gi, '') // Remover event handlers
      .replace(/[<>'"]/g, (match) => { // Escapar caracteres peligrosos
        const escapeMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[match];
      });
  }

  /**
   * Valida formato de cédula colombiana
   */
  validateCedula(cedula) {
    if (!cedula || typeof cedula !== 'string') return false;
    
    // Remover espacios y caracteres no numéricos
    const cleanCedula = cedula.replace(/\D/g, '');
    
    // Validar longitud (6-12 dígitos)
    if (cleanCedula.length < 6 || cleanCedula.length > 12) return false;
    
    // Validar que no sean todos números iguales
    if (/^(\d)\1+$/.test(cleanCedula)) return false;
    
    return true;
  }

  /**
   * Valida fortaleza de contraseña
   */
  validatePasswordStrength(password) {
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: !this.hasCommonPatterns(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      isValid: score >= 4,
      score,
      checks,
      strength: this.getPasswordStrengthLevel(score)
    };
  }

  /**
   * Detecta patrones comunes en contraseñas
   */
  hasCommonPatterns(password) {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Obtiene el nivel de fortaleza de la contraseña
   */
  getPasswordStrengthLevel(score) {
    if (score <= 2) return 'Muy débil';
    if (score <= 3) return 'Débil';
    if (score <= 4) return 'Regular';
    if (score <= 5) return 'Fuerte';
    return 'Muy fuerte';
  }

  /**
   * Implementa rate limiting
   */
  checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS;
    
    // Obtener o crear contador para el identificador
    let requests = this.requestCounts.get(identifier) || [];
    
    // Filtrar requests dentro de la ventana de tiempo
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Verificar si excede el límite
    if (requests.length >= SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: requests[0] + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS
      };
    }

    // Agregar request actual
    requests.push(now);
    this.requestCounts.set(identifier, requests);

    return {
      allowed: true,
      remainingRequests: SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS - requests.length,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS
    };
  }

  /**
   * Inicializa monitoreo de actividad del usuario
   */
  initActivityMonitoring() {
    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.lastActivity = Date.now();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Verificar inactividad cada minuto
    setInterval(() => {
      this.checkInactivity();
    }, 60000);
  }

  /**
   * Verifica inactividad del usuario
   */
  checkInactivity() {
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    
    if (timeSinceLastActivity > SECURITY_CONFIG.MAX_IDLE_TIME) {
      this.handleInactivity();
    }
  }

  /**
   * Maneja la inactividad del usuario
   */
  handleInactivity() {
    // Mostrar advertencia de inactividad
    const shouldContinue = window.confirm(
      '⚠️ Su sesión ha estado inactiva por un tiempo prolongado.\n\n' +
      '¿Desea continuar trabajando en la encuesta?\n\n' +
      'Si no responde, su sesión se cerrará automáticamente por seguridad.'
    );

    if (shouldContinue) {
      this.lastActivity = Date.now();
    } else {
      this.forceLogout('Sesión cerrada por inactividad');
    }
  }

  /**
   * Fuerza el cierre de sesión
   */
  forceLogout(reason = 'Sesión expirada') {
    // Limpiar datos de sesión
    localStorage.clear();
    sessionStorage.clear();
    
    // Mostrar mensaje y redirigir
    alert(`🔒 ${reason}\n\nPor su seguridad, debe iniciar sesión nuevamente.`);
    window.location.href = '/portal-encuestas/login';
  }

  /**
   * Genera un fingerprint del dispositivo
   */
  generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 100), // Truncar para privacidad
      canvas: canvas.toDataURL().substring(0, 50), // Truncar para privacidad
      timestamp: Date.now()
    };

    return CryptoJS.SHA256(JSON.stringify(fingerprint)).toString();
  }

  /**
   * Valida la integridad de los datos del formulario
   */
  validateFormIntegrity(formData, expectedChecksum) {
    const dataString = JSON.stringify(formData, Object.keys(formData).sort());
    const checksum = CryptoJS.SHA256(dataString).toString();
    return checksum === expectedChecksum;
  }

  /**
   * Genera checksum para datos del formulario
   */
  generateFormChecksum(formData) {
    const dataString = JSON.stringify(formData, Object.keys(formData).sort());
    return CryptoJS.SHA256(dataString).toString();
  }

  /**
   * Detecta intentos de manipulación del DOM
   */
  initDOMProtection() {
    // Proteger contra modificación de elementos críticos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Detectar scripts inyectados
          mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT') {
              console.warn('⚠️ Script inyectado detectado');
              node.remove();
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Valida headers de seguridad
   */
  validateSecurityHeaders(response) {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection'
    ];

    const missingHeaders = requiredHeaders.filter(header => 
      !response.headers.get(header)
    );

    if (missingHeaders.length > 0) {
      console.warn('⚠️ Headers de seguridad faltantes:', missingHeaders);
    }

    return missingHeaders.length === 0;
  }

  /**
   * Limpia datos sensibles de la memoria
   */
  clearSensitiveData() {
    // Limpiar variables que puedan contener datos sensibles
    if (window.formData) {
      window.formData = null;
    }
    
    // Forzar garbage collection si está disponible
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Obtiene información de seguridad del sistema
   */
  getSecurityInfo() {
    return {
      csrfToken: this.csrfToken,
      deviceFingerprint: this.generateDeviceFingerprint(),
      sessionTimeout: SECURITY_CONFIG.SESSION_TIMEOUT,
      lastActivity: this.lastActivity,
      securityLevel: 'Alto',
      encryptionEnabled: true,
      rateLimitEnabled: true
    };
  }
}

// Instancia singleton
const seguridadUtils = new SeguridadUtils();

// Inicializar protecciones al cargar
document.addEventListener('DOMContentLoaded', () => {
  seguridadUtils.initDOMProtection();
});

export default seguridadUtils;

// Hooks de React para usar en componentes
export const useSecurity = () => {
  const [securityInfo, setSecurityInfo] = React.useState(null);

  React.useEffect(() => {
    setSecurityInfo(seguridadUtils.getSecurityInfo());
  }, []);

  return {
    securityInfo,
    sanitizeInput: seguridadUtils.sanitizeInput.bind(seguridadUtils),
    validateCedula: seguridadUtils.validateCedula.bind(seguridadUtils),
    checkRateLimit: seguridadUtils.checkRateLimit.bind(seguridadUtils),
    encryptData: seguridadUtils.encryptData.bind(seguridadUtils),
    decryptData: seguridadUtils.decryptData.bind(seguridadUtils)
  };
};

// Middleware para validar requests
export const securityMiddleware = (request) => {
  // Validar CSRF token
  if (!seguridadUtils.validateCSRFToken(request.headers['X-CSRF-Token'])) {
    throw new Error('Token CSRF inválido');
  }

  // Aplicar rate limiting
  const rateLimit = seguridadUtils.checkRateLimit(request.ip || 'unknown');
  if (!rateLimit.allowed) {
    throw new Error('Demasiadas solicitudes. Intente más tarde.');
  }

  // Sanitizar datos de entrada
  if (request.body) {
    request.body = seguridadUtils.sanitizeInput(request.body);
  }

  return request;
};
