import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Configuración del servicio de notificaciones
const NOTIFICATION_CONFIG = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    CRITICAL: 'critical'
  },
  PRIORITIES: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  },
  AUTO_DISMISS_DELAY: {
    success: 5000,
    info: 7000,
    warning: 10000,
    error: 15000,
    critical: 0 // No auto-dismiss
  },
  MAX_NOTIFICATIONS: 5,
  STORAGE_KEY: 'health_survey_notifications'
};

// Estados de encuestas
const SURVEY_STATES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  EXPIRING_SOON: 'expiring_soon', // < 60 días
  EXPIRED: 'expired',
  REQUIRES_FOLLOW_UP: 'requires_follow_up'
};

// Tipos de notificaciones del sistema
const NOTIFICATION_TEMPLATES = {
  SURVEY_ASSIGNED: {
    type: NOTIFICATION_CONFIG.TYPES.INFO,
    priority: NOTIFICATION_CONFIG.PRIORITIES.MEDIUM,
    title: '📋 Nueva Encuesta Asignada',
    template: 'Se ha asignado una nueva encuesta de salud ocupacional para {trabajador}.'
  },
  SURVEY_EXPIRING: {
    type: NOTIFICATION_CONFIG.TYPES.WARNING,
    priority: NOTIFICATION_CONFIG.PRIORITIES.HIGH,
    title: '⏰ Encuesta Próxima a Vencer',
    template: 'La encuesta de {trabajador} vence en {dias} días. Fecha límite: {fechaLimite}.'
  },
  SURVEY_EXPIRED: {
    type: NOTIFICATION_CONFIG.TYPES.ERROR,
    priority: NOTIFICATION_CONFIG.PRIORITIES.CRITICAL,
    title: '🚨 Encuesta Vencida',
    template: 'La encuesta de {trabajador} ha vencido. Vencimiento: {fechaVencimiento}.'
  },
  SURVEY_COMPLETED: {
    type: NOTIFICATION_CONFIG.TYPES.SUCCESS,
    priority: NOTIFICATION_CONFIG.PRIORITIES.MEDIUM,
    title: '✅ Encuesta Completada',
    template: '{trabajador} ha completado su encuesta de salud ocupacional.'
  },
  HIGH_RISK_DETECTED: {
    type: NOTIFICATION_CONFIG.TYPES.CRITICAL,
    priority: NOTIFICATION_CONFIG.PRIORITIES.CRITICAL,
    title: '🚨 Alto Riesgo Detectado',
    template: 'Se detectó alto riesgo en la encuesta de {trabajador}. Requiere atención médica inmediata.'
  },
  FOLLOW_UP_REQUIRED: {
    type: NOTIFICATION_CONFIG.TYPES.WARNING,
    priority: NOTIFICATION_CONFIG.PRIORITIES.HIGH,
    title: '👨‍⚕️ Seguimiento Médico Requerido',
    template: '{trabajador} requiere seguimiento médico basado en los resultados de su encuesta.'
  },
  SYSTEM_MAINTENANCE: {
    type: NOTIFICATION_CONFIG.TYPES.INFO,
    priority: NOTIFICATION_CONFIG.PRIORITIES.LOW,
    title: '🔧 Mantenimiento del Sistema',
    template: 'El sistema estará en mantenimiento el {fecha} de {horaInicio} a {horaFin}.'
  },
  BULK_REMINDER: {
    type: NOTIFICATION_CONFIG.TYPES.INFO,
    priority: NOTIFICATION_CONFIG.PRIORITIES.MEDIUM,
    title: '📢 Recordatorio Masivo',
    template: '{cantidad} trabajadores tienen encuestas pendientes por completar.'
  }
};

// Reducer para gestionar el estado de notificaciones
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false,
        dismissed: false,
        ...action.payload
      };
      
      // Limitar número máximo de notificaciones
      const updatedNotifications = [newNotification, ...state.notifications]
        .slice(0, NOTIFICATION_CONFIG.MAX_NOTIFICATIONS);
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: state.unreadCount + 1
      };

    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, dismissed: true }
            : notification
        )
      };

    case 'REMOVE_NOTIFICATION':
      const notification = state.notifications.find(n => n.id === action.payload.id);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id),
        unreadCount: notification && !notification.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };

    case 'LOAD_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications || [],
        unreadCount: (action.payload.notifications || []).filter(n => !n.read).length
      };

    default:
      return state;
  }
};

// Estado inicial
const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    enablePushNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    quietHours: { start: '22:00', end: '07:00' },
    notificationFrequency: 'immediate' // immediate, hourly, daily
  }
};

// Contexto de notificaciones
const NotificationContext = createContext();

// Proveedor de notificaciones
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Cargar notificaciones del localStorage al inicializar
  useEffect(() => {
    const savedNotifications = localStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEY);
    if (savedNotifications) {
      try {
        const notifications = JSON.parse(savedNotifications);
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: { notifications } });
      } catch (error) {
        console.error('Error cargando notificaciones guardadas:', error);
      }
    }
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(
      NOTIFICATION_CONFIG.STORAGE_KEY,
      JSON.stringify(state.notifications)
    );
  }, [state.notifications]);

  const value = {
    ...state,
    dispatch
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook para usar notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};

// Clase principal del servicio de notificaciones
class NotificationService {
  constructor() {
    this.dispatch = null;
    this.autoCheckInterval = null;
    this.encuestasData = [];
  }

  /**
   * Inicializa el servicio con el dispatch del contexto
   */
  initialize(dispatch) {
    this.dispatch = dispatch;
    this.startAutoCheck();
  }

  /**
   * Inicia verificación automática de estados
   */
  startAutoCheck() {
    // Verificar cada 5 minutos
    this.autoCheckInterval = setInterval(() => {
      this.checkSurveyStates();
    }, 5 * 60 * 1000);

    // Verificación inicial
    this.checkSurveyStates();
  }

  /**
   * Detiene la verificación automática
   */
  stopAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
    }
  }

  /**
   * Actualiza los datos de encuestas para monitoreo
   */
  updateEncuestasData(encuestasData) {
    this.encuestasData = encuestasData;
    this.checkSurveyStates();
  }

  /**
   * Verifica estados de encuestas y genera notificaciones automáticas
   */
  checkSurveyStates() {
    if (!this.encuestasData.length) return;

    const now = new Date();
    
    this.encuestasData.forEach(encuesta => {
      const state = this.determineSurveyState(encuesta, now);
      this.handleStateChange(encuesta, state);
    });
  }

  /**
   * Determina el estado actual de una encuesta
   */
  determineSurveyState(encuesta, currentDate = new Date()) {
    const fechaAsignacion = new Date(encuesta.fechaAsignacion || encuesta.fechaCreacion);
    const fechaLimite = new Date(fechaAsignacion);
    fechaLimite.setDate(fechaLimite.getDate() + 90); // 90 días para completar

    const diasRestantes = Math.ceil((fechaLimite - currentDate) / (1000 * 60 * 60 * 24));

    // Encuesta completada
    if (encuesta.fechaCompletado) {
      // Verificar si requiere seguimiento basado en análisis de riesgo
      if (encuesta.riskScore >= 6 || encuesta.requiresFollowUp) {
        return SURVEY_STATES.REQUIRES_FOLLOW_UP;
      }
      return SURVEY_STATES.COMPLETED;
    }

    // Encuesta vencida
    if (diasRestantes < 0) {
      return SURVEY_STATES.EXPIRED;
    }

    // Encuesta próxima a vencer (menos de 60 días)
    if (diasRestantes <= 60) {
      return SURVEY_STATES.EXPIRING_SOON;
    }

    // Encuesta en progreso o pendiente
    if (encuesta.fechaInicio) {
      return SURVEY_STATES.IN_PROGRESS;
    }

    return SURVEY_STATES.PENDING;
  }

  /**
   * Maneja cambios de estado y genera notificaciones
   */
  handleStateChange(encuesta, newState) {
    const previousState = encuesta.currentState;
    
    // Solo generar notificación si el estado cambió
    if (previousState === newState) return;

    // Actualizar estado en los datos
    encuesta.currentState = newState;

    // Generar notificación según el nuevo estado
    switch (newState) {
      case SURVEY_STATES.EXPIRING_SOON:
        this.createNotification('SURVEY_EXPIRING', {
          trabajador: encuesta.trabajador.nombre,
          dias: this.getDaysUntilExpiry(encuesta),
          fechaLimite: this.getExpiryDate(encuesta).toLocaleDateString('es-CO')
        }, {
          encuestaId: encuesta.encuestaId,
          trabajadorId: encuesta.trabajador.cedula,
          action: 'remind_worker'
        });
        break;

      case SURVEY_STATES.EXPIRED:
        this.createNotification('SURVEY_EXPIRED', {
          trabajador: encuesta.trabajador.nombre,
          fechaVencimiento: this.getExpiryDate(encuesta).toLocaleDateString('es-CO')
        }, {
          encuestaId: encuesta.encuestaId,
          trabajadorId: encuesta.trabajador.cedula,
          action: 'escalate_expired'
        });
        break;

      case SURVEY_STATES.COMPLETED:
        this.createNotification('SURVEY_COMPLETED', {
          trabajador: encuesta.trabajador.nombre
        }, {
          encuestaId: encuesta.encuestaId,
          trabajadorId: encuesta.trabajador.cedula,
          action: 'view_results'
        });
        
        // Verificar si hay alto riesgo
        if (encuesta.riskScore >= 6) {
          this.createNotification('HIGH_RISK_DETECTED', {
            trabajador: encuesta.trabajador.nombre
          }, {
            encuestaId: encuesta.encuestaId,
            trabajadorId: encuesta.trabajador.cedula,
            action: 'medical_review',
            priority: NOTIFICATION_CONFIG.PRIORITIES.CRITICAL
          });
        }
        break;

      case SURVEY_STATES.REQUIRES_FOLLOW_UP:
        this.createNotification('FOLLOW_UP_REQUIRED', {
          trabajador: encuesta.trabajador.nombre
        }, {
          encuestaId: encuesta.encuestaId,
          trabajadorId: encuesta.trabajador.cedula,
          action: 'schedule_follow_up'
        });
        break;
    }
  }

  /**
   * Crea una notificación basada en plantilla
   */
  createNotification(templateKey, variables = {}, metadata = {}) {
    if (!this.dispatch) {
      console.warn('NotificationService no inicializado');
      return;
    }

    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) {
      console.error(`Plantilla de notificación no encontrada: ${templateKey}`);
      return;
    }

    // Reemplazar variables en el mensaje
    let message = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    const notification = {
      type: template.type,
      priority: metadata.priority || template.priority,
      title: template.title,
      message,
      metadata: {
        templateKey,
        variables,
        ...metadata
      }
    };

    this.dispatch({
      type: 'ADD_NOTIFICATION',
      payload: notification
    });

    // Programar auto-dismiss si aplica
    const autoDismissDelay = NOTIFICATION_CONFIG.AUTO_DISMISS_DELAY[template.type];
    if (autoDismissDelay > 0) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, autoDismissDelay);
    }
  }

  /**
   * Crea notificación personalizada
   */
  createCustomNotification(type, title, message, metadata = {}) {
    if (!this.dispatch) return;

    const notification = {
      type,
      priority: metadata.priority || NOTIFICATION_CONFIG.PRIORITIES.MEDIUM,
      title,
      message,
      metadata
    };

    this.dispatch({
      type: 'ADD_NOTIFICATION',
      payload: notification
    });
  }

  /**
   * Marca notificación como leída
   */
  markAsRead(notificationId) {
    if (!this.dispatch) return;
    
    this.dispatch({
      type: 'MARK_AS_READ',
      payload: { id: notificationId }
    });
  }

  /**
   * Descarta notificación
   */
  dismissNotification(notificationId) {
    if (!this.dispatch) return;
    
    this.dispatch({
      type: 'DISMISS_NOTIFICATION',
      payload: { id: notificationId }
    });
  }

  /**
   * Elimina notificación
   */
  removeNotification(notificationId) {
    if (!this.dispatch) return;
    
    this.dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: { id: notificationId }
    });
  }

  /**
   * Limpia todas las notificaciones
   */
  clearAll() {
    if (!this.dispatch) return;
    
    this.dispatch({ type: 'CLEAR_ALL' });
  }

  /**
   * Marca todas como leídas
   */
  markAllAsRead() {
    if (!this.dispatch) return;
    
    this.dispatch({ type: 'MARK_ALL_AS_READ' });
  }

  /**
   * Genera recordatorio masivo
   */
  generateBulkReminder(pendingEncuestas) {
    if (pendingEncuestas.length === 0) return;

    this.createNotification('BULK_REMINDER', {
      cantidad: pendingEncuestas.length
    }, {
      action: 'view_pending_surveys',
      encuestaIds: pendingEncuestas.map(e => e.encuestaId)
    });
  }

  /**
   * Programa notificación de mantenimiento
   */
  scheduleMaintenanceNotification(fecha, horaInicio, horaFin) {
    this.createNotification('SYSTEM_MAINTENANCE', {
      fecha: new Date(fecha).toLocaleDateString('es-CO'),
      horaInicio,
      horaFin
    }, {
      action: 'acknowledge_maintenance',
      scheduledDate: fecha
    });
  }

  /**
   * Obtiene días hasta vencimiento
   */
  getDaysUntilExpiry(encuesta) {
    const fechaAsignacion = new Date(encuesta.fechaAsignacion || encuesta.fechaCreacion);
    const fechaLimite = new Date(fechaAsignacion);
    fechaLimite.setDate(fechaLimite.getDate() + 90);
    
    const now = new Date();
    return Math.ceil((fechaLimite - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene fecha de vencimiento
   */
  getExpiryDate(encuesta) {
    const fechaAsignacion = new Date(encuesta.fechaAsignacion || encuesta.fechaCreacion);
    const fechaLimite = new Date(fechaAsignacion);
    fechaLimite.setDate(fechaLimite.getDate() + 90);
    return fechaLimite;
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  getNotificationStats(notifications) {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {},
      byPriority: {},
      recent: notifications.filter(n => {
        const notificationDate = new Date(n.timestamp);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return notificationDate > oneDayAgo;
      }).length
    };

    // Contar por tipo
    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
    });

    return stats;
  }
}

// Instancia singleton
const notificationService = new NotificationService();

export default notificationService;

// Hook personalizado para gestión completa de notificaciones
export const useNotificationManager = () => {
  const { notifications, unreadCount, dispatch } = useNotifications();

  useEffect(() => {
    // Inicializar el servicio con el dispatch
    notificationService.initialize(dispatch);

    return () => {
      notificationService.stopAutoCheck();
    };
  }, [dispatch]);

  return {
    notifications,
    unreadCount,
    stats: notificationService.getNotificationStats(notifications),
    
    // Métodos del servicio
    createNotification: notificationService.createCustomNotification.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    dismissNotification: notificationService.dismissNotification.bind(notificationService),
    removeNotification: notificationService.removeNotification.bind(notificationService),
    clearAll: notificationService.clearAll.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    updateEncuestasData: notificationService.updateEncuestasData.bind(notificationService),
    generateBulkReminder: notificationService.generateBulkReminder.bind(notificationService),
    scheduleMaintenanceNotification: notificationService.scheduleMaintenanceNotification.bind(notificationService)
  };
};

// Exportar constantes para uso externo
export { SURVEY_STATES, NOTIFICATION_CONFIG, NOTIFICATION_TEMPLATES };
