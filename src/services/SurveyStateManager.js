import React, { createContext, useContext, useReducer, useEffect } from 'react';
import notificationService, { SURVEY_STATES } from './NotificationService';

// Configuración del gestor de estados
const STATE_MANAGER_CONFIG = {
  CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos
  EXPIRY_DAYS: 90, // Días para completar encuesta
  WARNING_DAYS: 60, // Días antes del vencimiento para advertir
  BATCH_SIZE: 50, // Tamaño de lote para procesamiento
  AUTO_ACTIONS: {
    SEND_REMINDERS: true,
    ESCALATE_EXPIRED: true,
    GENERATE_REPORTS: true,
    UPDATE_DASHBOARD: true
  }
};

// Acciones del reducer
const STATE_ACTIONS = {
  SET_ENCUESTAS: 'SET_ENCUESTAS',
  UPDATE_ENCUESTA_STATE: 'UPDATE_ENCUESTA_STATE',
  BATCH_UPDATE_STATES: 'BATCH_UPDATE_STATES',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_STATS: 'SET_STATS',
  ADD_STATE_CHANGE_LOG: 'ADD_STATE_CHANGE_LOG',
  SET_AUTO_ACTIONS: 'SET_AUTO_ACTIONS'
};

// Reducer para gestión de estados
const stateManagerReducer = (state, action) => {
  switch (action.type) {
    case STATE_ACTIONS.SET_ENCUESTAS:
      return {
        ...state,
        encuestas: action.payload,
        lastUpdate: new Date().toISOString()
      };

    case STATE_ACTIONS.UPDATE_ENCUESTA_STATE:
      return {
        ...state,
        encuestas: state.encuestas.map(encuesta =>
          encuesta.encuestaId === action.payload.encuestaId
            ? { ...encuesta, ...action.payload.updates }
            : encuesta
        ),
        lastUpdate: new Date().toISOString()
      };

    case STATE_ACTIONS.BATCH_UPDATE_STATES:
      const updatedEncuestas = state.encuestas.map(encuesta => {
        const update = action.payload.find(u => u.encuestaId === encuesta.encuestaId);
        return update ? { ...encuesta, ...update.updates } : encuesta;
      });
      
      return {
        ...state,
        encuestas: updatedEncuestas,
        lastUpdate: new Date().toISOString()
      };

    case STATE_ACTIONS.SET_PROCESSING:
      return {
        ...state,
        isProcessing: action.payload
      };

    case STATE_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload,
        lastStatsUpdate: new Date().toISOString()
      };

    case STATE_ACTIONS.ADD_STATE_CHANGE_LOG:
      return {
        ...state,
        stateChangeLogs: [
          ...state.stateChangeLogs.slice(-99), // Mantener últimos 100 logs
          {
            ...action.payload,
            timestamp: new Date().toISOString()
          }
        ]
      };

    case STATE_ACTIONS.SET_AUTO_ACTIONS:
      return {
        ...state,
        autoActions: { ...state.autoActions, ...action.payload }
      };

    default:
      return state;
  }
};

// Estado inicial
const initialState = {
  encuestas: [],
  isProcessing: false,
  stats: {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    expiringSoon: 0,
    expired: 0,
    requiresFollowUp: 0
  },
  stateChangeLogs: [],
  autoActions: { ...STATE_MANAGER_CONFIG.AUTO_ACTIONS },
  lastUpdate: null,
  lastStatsUpdate: null
};

// Contexto del gestor de estados
const SurveyStateContext = createContext();

// Proveedor del contexto
export const SurveyStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(stateManagerReducer, initialState);

  const value = {
    ...state,
    dispatch
  };

  return (
    <SurveyStateContext.Provider value={value}>
      {children}
    </SurveyStateContext.Provider>
  );
};

// Hook para usar el contexto
export const useSurveyState = () => {
  const context = useContext(SurveyStateContext);
  if (!context) {
    throw new Error('useSurveyState debe usarse dentro de SurveyStateProvider');
  }
  return context;
};

// Clase principal del gestor de estados
class SurveyStateManager {
  constructor() {
    this.dispatch = null;
    this.checkInterval = null;
    this.isInitialized = false;
    this.processingQueue = [];
    this.lastProcessTime = null;
  }

  /**
   * Inicializa el gestor con el dispatch del contexto
   */
  initialize(dispatch) {
    this.dispatch = dispatch;
    this.isInitialized = true;
    this.startAutoCheck();
    console.log('SurveyStateManager inicializado');
  }

  /**
   * Inicia la verificación automática de estados
   */
  startAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.processAllStates();
    }, STATE_MANAGER_CONFIG.CHECK_INTERVAL);

    // Procesamiento inicial
    setTimeout(() => this.processAllStates(), 1000);
  }

  /**
   * Detiene la verificación automática
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Actualiza las encuestas en el estado
   */
  updateEncuestas(encuestas) {
    if (!this.dispatch) return;

    this.dispatch({
      type: STATE_ACTIONS.SET_ENCUESTAS,
      payload: encuestas
    });

    // Procesar estados después de actualizar
    setTimeout(() => this.processAllStates(), 500);
  }

  /**
   * Procesa todos los estados de encuestas
   */
  async processAllStates() {
    if (!this.dispatch || !this.isInitialized) return;

    try {
      this.dispatch({ type: STATE_ACTIONS.SET_PROCESSING, payload: true });
      this.lastProcessTime = new Date();

      // Obtener encuestas actuales del estado (esto requeriría acceso al estado actual)
      // Por simplicidad, simularemos con datos de ejemplo
      const encuestas = this.getEncuestasFromState();
      
      if (!encuestas || encuestas.length === 0) {
        this.dispatch({ type: STATE_ACTIONS.SET_PROCESSING, payload: false });
        return;
      }

      // Procesar en lotes
      const batches = this.createBatches(encuestas, STATE_MANAGER_CONFIG.BATCH_SIZE);
      const allUpdates = [];

      for (const batch of batches) {
        const batchUpdates = await this.processBatch(batch);
        allUpdates.push(...batchUpdates);
      }

      // Aplicar todas las actualizaciones
      if (allUpdates.length > 0) {
        this.dispatch({
          type: STATE_ACTIONS.BATCH_UPDATE_STATES,
          payload: allUpdates
        });
      }

      // Actualizar estadísticas
      this.updateStats(encuestas);

      // Ejecutar acciones automáticas
      await this.executeAutoActions(allUpdates);

    } catch (error) {
      console.error('Error procesando estados de encuestas:', error);
    } finally {
      this.dispatch({ type: STATE_ACTIONS.SET_PROCESSING, payload: false });
    }
  }

  /**
   * Obtiene encuestas del estado (simulado)
   */
  getEncuestasFromState() {
    // En una implementación real, esto obtendría las encuestas del estado actual
    // Por ahora, retornamos datos simulados
    return [
      {
        encuestaId: 'enc_001',
        trabajador: { cedula: '12345678', nombre: 'Juan Pérez García' },
        fechaAsignacion: '2024-07-15T10:00:00Z',
        fechaCompletado: null,
        currentState: SURVEY_STATES.PENDING,
        riskScore: null,
        requiresFollowUp: false
      },
      {
        encuestaId: 'enc_002',
        trabajador: { cedula: '87654321', nombre: 'María González López' },
        fechaAsignacion: '2024-08-01T10:00:00Z',
        fechaCompletado: '2024-10-02T14:15:00Z',
        currentState: SURVEY_STATES.COMPLETED,
        riskScore: 2,
        requiresFollowUp: false
      },
      {
        encuestaId: 'enc_003',
        trabajador: { cedula: '11111111', nombre: 'Carlos Rodríguez Martín' },
        fechaAsignacion: '2024-06-01T10:00:00Z',
        fechaCompletado: null,
        currentState: SURVEY_STATES.EXPIRED,
        riskScore: null,
        requiresFollowUp: false
      }
    ];
  }

  /**
   * Crea lotes de encuestas para procesamiento
   */
  createBatches(encuestas, batchSize) {
    const batches = [];
    for (let i = 0; i < encuestas.length; i += batchSize) {
      batches.push(encuestas.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Procesa un lote de encuestas
   */
  async processBatch(batch) {
    const updates = [];
    const currentDate = new Date();

    for (const encuesta of batch) {
      const newState = this.calculateNewState(encuesta, currentDate);
      const stateChanged = newState !== encuesta.currentState;

      if (stateChanged) {
        updates.push({
          encuestaId: encuesta.encuestaId,
          updates: {
            currentState: newState,
            lastStateChange: currentDate.toISOString(),
            stateHistory: [
              ...(encuesta.stateHistory || []),
              {
                from: encuesta.currentState,
                to: newState,
                timestamp: currentDate.toISOString(),
                reason: this.getStateChangeReason(encuesta, newState)
              }
            ]
          }
        });

        // Registrar cambio de estado
        this.logStateChange(encuesta, encuesta.currentState, newState);

        // Generar notificación si es necesario
        this.handleStateChangeNotification(encuesta, newState);
      }
    }

    return updates;
  }

  /**
   * Calcula el nuevo estado de una encuesta
   */
  calculateNewState(encuesta, currentDate) {
    const fechaAsignacion = new Date(encuesta.fechaAsignacion);
    const fechaLimite = new Date(fechaAsignacion);
    fechaLimite.setDate(fechaLimite.getDate() + STATE_MANAGER_CONFIG.EXPIRY_DAYS);

    const diasRestantes = Math.ceil((fechaLimite - currentDate) / (1000 * 60 * 60 * 24));

    // Encuesta completada
    if (encuesta.fechaCompletado) {
      // Verificar si requiere seguimiento
      if (encuesta.riskScore >= 6 || encuesta.requiresFollowUp) {
        return SURVEY_STATES.REQUIRES_FOLLOW_UP;
      }
      return SURVEY_STATES.COMPLETED;
    }

    // Encuesta vencida
    if (diasRestantes < 0) {
      return SURVEY_STATES.EXPIRED;
    }

    // Encuesta próxima a vencer
    if (diasRestantes <= STATE_MANAGER_CONFIG.WARNING_DAYS) {
      return SURVEY_STATES.EXPIRING_SOON;
    }

    // Encuesta en progreso (si tiene fecha de inicio)
    if (encuesta.fechaInicio && !encuesta.fechaCompletado) {
      return SURVEY_STATES.IN_PROGRESS;
    }

    // Encuesta pendiente
    return SURVEY_STATES.PENDING;
  }

  /**
   * Obtiene la razón del cambio de estado
   */
  getStateChangeReason(encuesta, newState) {
    switch (newState) {
      case SURVEY_STATES.EXPIRING_SOON:
        return `Encuesta próxima a vencer (${this.getDaysUntilExpiry(encuesta)} días restantes)`;
      case SURVEY_STATES.EXPIRED:
        return 'Encuesta vencida por tiempo límite';
      case SURVEY_STATES.COMPLETED:
        return 'Encuesta completada por el trabajador';
      case SURVEY_STATES.REQUIRES_FOLLOW_UP:
        return 'Requiere seguimiento médico por alto riesgo';
      case SURVEY_STATES.IN_PROGRESS:
        return 'Trabajador inició la encuesta';
      default:
        return 'Cambio de estado automático';
    }
  }

  /**
   * Registra cambio de estado en los logs
   */
  logStateChange(encuesta, fromState, toState) {
    if (!this.dispatch) return;

    this.dispatch({
      type: STATE_ACTIONS.ADD_STATE_CHANGE_LOG,
      payload: {
        encuestaId: encuesta.encuestaId,
        trabajadorId: encuesta.trabajador.cedula,
        trabajadorNombre: encuesta.trabajador.nombre,
        fromState,
        toState,
        reason: this.getStateChangeReason(encuesta, toState)
      }
    });
  }

  /**
   * Maneja notificaciones por cambio de estado
   */
  handleStateChangeNotification(encuesta, newState) {
    // Delegar al servicio de notificaciones
    notificationService.handleStateChange(encuesta, newState);
  }

  /**
   * Actualiza las estadísticas
   */
  updateStats(encuestas) {
    if (!this.dispatch) return;

    const stats = {
      total: encuestas.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      expiringSoon: 0,
      expired: 0,
      requiresFollowUp: 0
    };

    encuestas.forEach(encuesta => {
      switch (encuesta.currentState) {
        case SURVEY_STATES.PENDING:
          stats.pending++;
          break;
        case SURVEY_STATES.IN_PROGRESS:
          stats.inProgress++;
          break;
        case SURVEY_STATES.COMPLETED:
          stats.completed++;
          break;
        case SURVEY_STATES.EXPIRING_SOON:
          stats.expiringSoon++;
          break;
        case SURVEY_STATES.EXPIRED:
          stats.expired++;
          break;
        case SURVEY_STATES.REQUIRES_FOLLOW_UP:
          stats.requiresFollowUp++;
          break;
      }
    });

    this.dispatch({
      type: STATE_ACTIONS.SET_STATS,
      payload: stats
    });
  }

  /**
   * Ejecuta acciones automáticas basadas en cambios de estado
   */
  async executeAutoActions(updates) {
    if (!updates.length) return;

    const autoActions = this.getAutoActionsFromState();

    // Enviar recordatorios
    if (autoActions.SEND_REMINDERS) {
      await this.sendAutomaticReminders(updates);
    }

    // Escalar encuestas vencidas
    if (autoActions.ESCALATE_EXPIRED) {
      await this.escalateExpiredSurveys(updates);
    }

    // Generar reportes automáticos
    if (autoActions.GENERATE_REPORTS) {
      await this.generateAutomaticReports(updates);
    }

    // Actualizar dashboard
    if (autoActions.UPDATE_DASHBOARD) {
      await this.updateDashboard(updates);
    }
  }

  /**
   * Obtiene configuración de acciones automáticas del estado
   */
  getAutoActionsFromState() {
    // En implementación real, obtendría del estado actual
    return STATE_MANAGER_CONFIG.AUTO_ACTIONS;
  }

  /**
   * Envía recordatorios automáticos
   */
  async sendAutomaticReminders(updates) {
    const expiringSoonUpdates = updates.filter(u => 
      u.updates.currentState === SURVEY_STATES.EXPIRING_SOON
    );

    for (const update of expiringSoonUpdates) {
      // Simular envío de recordatorio
      console.log(`Enviando recordatorio automático para encuesta ${update.encuestaId}`);
      
      // En implementación real, aquí se enviaría email/SMS
      await this.simulateReminderSend(update.encuestaId);
    }
  }

  /**
   * Escala encuestas vencidas
   */
  async escalateExpiredSurveys(updates) {
    const expiredUpdates = updates.filter(u => 
      u.updates.currentState === SURVEY_STATES.EXPIRED
    );

    for (const update of expiredUpdates) {
      console.log(`Escalando encuesta vencida ${update.encuestaId}`);
      
      // En implementación real, notificaría a supervisores
      await this.simulateEscalation(update.encuestaId);
    }
  }

  /**
   * Genera reportes automáticos
   */
  async generateAutomaticReports(updates) {
    const significantUpdates = updates.filter(u => 
      u.updates.currentState === SURVEY_STATES.COMPLETED ||
      u.updates.currentState === SURVEY_STATES.REQUIRES_FOLLOW_UP
    );

    if (significantUpdates.length > 0) {
      console.log(`Generando reporte automático para ${significantUpdates.length} encuestas`);
      
      // En implementación real, generaría reportes
      await this.simulateReportGeneration(significantUpdates);
    }
  }

  /**
   * Actualiza dashboard
   */
  async updateDashboard(updates) {
    console.log(`Actualizando dashboard con ${updates.length} cambios de estado`);
    
    // En implementación real, actualizaría métricas del dashboard
    await this.simulateDashboardUpdate(updates);
  }

  /**
   * Simula envío de recordatorio
   */
  async simulateReminderSend(encuestaId) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`✅ Recordatorio enviado para encuesta ${encuestaId}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Simula escalación
   */
  async simulateEscalation(encuestaId) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`🚨 Encuesta ${encuestaId} escalada a supervisión`);
        resolve();
      }, 100);
    });
  }

  /**
   * Simula generación de reporte
   */
  async simulateReportGeneration(updates) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`📊 Reporte automático generado para ${updates.length} encuestas`);
        resolve();
      }, 200);
    });
  }

  /**
   * Simula actualización de dashboard
   */
  async simulateDashboardUpdate(updates) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`📈 Dashboard actualizado con ${updates.length} cambios`);
        resolve();
      }, 50);
    });
  }

  /**
   * Obtiene días hasta vencimiento
   */
  getDaysUntilExpiry(encuesta) {
    const fechaAsignacion = new Date(encuesta.fechaAsignacion);
    const fechaLimite = new Date(fechaAsignacion);
    fechaLimite.setDate(fechaLimite.getDate() + STATE_MANAGER_CONFIG.EXPIRY_DAYS);
    
    const now = new Date();
    return Math.ceil((fechaLimite - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Configura acciones automáticas
   */
  setAutoActions(actions) {
    if (!this.dispatch) return;

    this.dispatch({
      type: STATE_ACTIONS.SET_AUTO_ACTIONS,
      payload: actions
    });
  }

  /**
   * Obtiene estadísticas del procesamiento
   */
  getProcessingStats() {
    return {
      lastProcessTime: this.lastProcessTime,
      isProcessing: this.processingQueue.length > 0,
      queueSize: this.processingQueue.length,
      checkInterval: STATE_MANAGER_CONFIG.CHECK_INTERVAL,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Fuerza procesamiento manual
   */
  forceProcess() {
    console.log('Forzando procesamiento manual de estados...');
    this.processAllStates();
  }

  /**
   * Limpia logs antiguos
   */
  cleanOldLogs(daysToKeep = 30) {
    if (!this.dispatch) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // En implementación real, filtrarían los logs por fecha
    console.log(`Limpiando logs anteriores a ${cutoffDate.toLocaleDateString()}`);
  }
}

// Instancia singleton
const surveyStateManager = new SurveyStateManager();

export default surveyStateManager;

// Hook personalizado para gestión completa de estados
export const useSurveyStateManager = () => {
  const { encuestas, stats, stateChangeLogs, isProcessing, autoActions, dispatch } = useSurveyState();

  useEffect(() => {
    // Inicializar el gestor con el dispatch
    surveyStateManager.initialize(dispatch);

    return () => {
      surveyStateManager.stopAutoCheck();
    };
  }, [dispatch]);

  return {
    // Estado
    encuestas,
    stats,
    stateChangeLogs,
    isProcessing,
    autoActions,
    
    // Métodos
    updateEncuestas: surveyStateManager.updateEncuestas.bind(surveyStateManager),
    forceProcess: surveyStateManager.forceProcess.bind(surveyStateManager),
    setAutoActions: surveyStateManager.setAutoActions.bind(surveyStateManager),
    getProcessingStats: surveyStateManager.getProcessingStats.bind(surveyStateManager),
    cleanOldLogs: surveyStateManager.cleanOldLogs.bind(surveyStateManager)
  };
};

// Exportar constantes
export { SURVEY_STATES, STATE_MANAGER_CONFIG };
