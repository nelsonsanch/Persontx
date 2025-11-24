import React, { useState, useEffect } from 'react';
import { useSurveyStateManager, SURVEY_STATES } from './SurveyStateManager';
import { useNotificationManager } from './NotificationService';

const StateMonitoringPanel = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos

  const {
    encuestas,
    stats,
    stateChangeLogs,
    isProcessing,
    autoActions,
    updateEncuestas,
    forceProcess,
    setAutoActions,
    getProcessingStats
  } = useSurveyStateManager();

  const { generateBulkReminder } = useNotificationManager();

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      forceProcess();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, forceProcess]);

  const getStateColor = (state) => {
    const colors = {
      [SURVEY_STATES.PENDING]: 'secondary',
      [SURVEY_STATES.IN_PROGRESS]: 'info',
      [SURVEY_STATES.COMPLETED]: 'success',
      [SURVEY_STATES.EXPIRING_SOON]: 'warning',
      [SURVEY_STATES.EXPIRED]: 'danger',
      [SURVEY_STATES.REQUIRES_FOLLOW_UP]: 'primary'
    };
    return colors[state] || 'secondary';
  };

  const getStateIcon = (state) => {
    const icons = {
      [SURVEY_STATES.PENDING]: '⏳',
      [SURVEY_STATES.IN_PROGRESS]: '🔄',
      [SURVEY_STATES.COMPLETED]: '✅',
      [SURVEY_STATES.EXPIRING_SOON]: '⚠️',
      [SURVEY_STATES.EXPIRED]: '🚨',
      [SURVEY_STATES.REQUIRES_FOLLOW_UP]: '👨‍⚕️'
    };
    return icons[state] || '❓';
  };

  const getStateName = (state) => {
    const names = {
      [SURVEY_STATES.PENDING]: 'Pendientes',
      [SURVEY_STATES.IN_PROGRESS]: 'En Progreso',
      [SURVEY_STATES.COMPLETED]: 'Completadas',
      [SURVEY_STATES.EXPIRING_SOON]: 'Por Vencer',
      [SURVEY_STATES.EXPIRED]: 'Vencidas',
      [SURVEY_STATES.REQUIRES_FOLLOW_UP]: 'Requieren Seguimiento'
    };
    return names[state] || 'Desconocido';
  };

  const handleAutoActionToggle = (actionKey) => {
    setAutoActions({
      [actionKey]: !autoActions[actionKey]
    });
  };

  const handleBulkReminder = () => {
    const pendingEncuestas = encuestas.filter(e => 
      e.currentState === SURVEY_STATES.PENDING || 
      e.currentState === SURVEY_STATES.EXPIRING_SOON
    );
    
    if (pendingEncuestas.length > 0) {
      generateBulkReminder(pendingEncuestas);
    }
  };

  const getFilteredLogs = () => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedTimeRange) {
      case '1h':
        cutoffDate.setHours(cutoffDate.getHours() - 1);
        break;
      case '24h':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case '7d':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      default:
        cutoffDate = new Date(0); // Todos los logs
    }

    return stateChangeLogs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const renderOverviewTab = () => (
    <div className="row">
      {/* Métricas principales */}
      <div className="col-12 mb-4">
        <div className="row">
          {Object.entries(stats).map(([key, value]) => {
            if (key === 'total') return null;
            
            const state = Object.values(SURVEY_STATES).find(s => 
              s.toLowerCase().replace('_', '') === key.toLowerCase().replace('_', '')
            );
            
            if (!state) return null;

            return (
              <div key={key} className="col-md-2 mb-3">
                <div className={`card border-${getStateColor(state)} h-100`}>
                  <div className="card-body text-center">
                    <div className="display-6 mb-2">{getStateIcon(state)}</div>
                    <h3 className={`text-${getStateColor(state)} mb-1`}>{value}</h3>
                    <small className="text-muted">{getStateName(state)}</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen total */}
      <div className="col-md-4 mb-4">
        <div className="card bg-primary text-white">
          <div className="card-body text-center">
            <h2 className="mb-0">{stats.total}</h2>
            <p className="mb-0">Total de Encuestas</p>
          </div>
        </div>
      </div>

      {/* Acciones críticas */}
      <div className="col-md-8 mb-4">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">🚨 Acciones Requeridas</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4 text-danger">{stats.expired}</div>
                  <small>Vencidas</small>
                  <div className="mt-2">
                    <button className="btn btn-sm btn-danger">
                      Escalar
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4 text-warning">{stats.expiringSoon}</div>
                  <small>Por Vencer</small>
                  <div className="mt-2">
                    <button 
                      className="btn btn-sm btn-warning"
                      onClick={handleBulkReminder}
                    >
                      Recordar
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4 text-primary">{stats.requiresFollowUp}</div>
                  <small>Seguimiento</small>
                  <div className="mt-2">
                    <button className="btn btn-sm btn-primary">
                      Programar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">⚙️ Estado del Sistema</h6>
          </div>
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-3">
                <div className="d-flex align-items-center">
                  <div className={`spinner-border spinner-border-sm me-2 ${isProcessing ? '' : 'd-none'}`}>
                    <span className="visually-hidden">Procesando...</span>
                  </div>
                  <span className={`badge ${isProcessing ? 'bg-warning' : 'bg-success'}`}>
                    {isProcessing ? 'Procesando...' : 'Activo'}
                  </span>
                </div>
              </div>
              <div className="col-md-3">
                <small className="text-muted">Auto-refresh:</small>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <small className="text-muted">Intervalo (seg):</small>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  min="10"
                  max="300"
                />
              </div>
              <div className="col-md-3">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={forceProcess}
                  disabled={isProcessing}
                >
                  🔄 Actualizar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfigTab = () => (
    <div className="row">
      {/* Configuración de acciones automáticas */}
      <div className="col-md-6 mb-4">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">🤖 Acciones Automáticas</h6>
          </div>
          <div className="card-body">
            <div className="list-group list-group-flush">
              <div className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>Enviar Recordatorios</strong>
                  <br />
                  <small className="text-muted">Recordatorios automáticos para encuestas por vencer</small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={autoActions.SEND_REMINDERS}
                    onChange={() => handleAutoActionToggle('SEND_REMINDERS')}
                  />
                </div>
              </div>
              
              <div className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>Escalar Vencidas</strong>
                  <br />
                  <small className="text-muted">Escalación automática de encuestas vencidas</small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={autoActions.ESCALATE_EXPIRED}
                    onChange={() => handleAutoActionToggle('ESCALATE_EXPIRED')}
                  />
                </div>
              </div>
              
              <div className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>Generar Reportes</strong>
                  <br />
                  <small className="text-muted">Generación automática de reportes</small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={autoActions.GENERATE_REPORTS}
                    onChange={() => handleAutoActionToggle('GENERATE_REPORTS')}
                  />
                </div>
              </div>
              
              <div className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>Actualizar Dashboard</strong>
                  <br />
                  <small className="text-muted">Actualización automática del dashboard</small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={autoActions.UPDATE_DASHBOARD}
                    onChange={() => handleAutoActionToggle('UPDATE_DASHBOARD')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas del procesamiento */}
      <div className="col-md-6 mb-4">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">📊 Estadísticas de Procesamiento</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-6 mb-3">
                <div className="text-center">
                  <div className="h5 text-info">{stateChangeLogs.length}</div>
                  <small className="text-muted">Cambios de Estado</small>
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-center">
                  <div className="h5 text-success">
                    {Math.round((stats.completed / stats.total) * 100) || 0}%
                  </div>
                  <small className="text-muted">Tasa de Completado</small>
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-center">
                  <div className="h5 text-warning">
                    {Math.round(((stats.expiringSoon + stats.expired) / stats.total) * 100) || 0}%
                  </div>
                  <small className="text-muted">Tasa de Riesgo</small>
                </div>
              </div>
              <div className="col-6 mb-3">
                <div className="text-center">
                  <div className="h5 text-primary">
                    {Math.round((stats.requiresFollowUp / stats.total) * 100) || 0}%
                  </div>
                  <small className="text-muted">Requieren Seguimiento</small>
                </div>
              </div>
            </div>
            
            <hr />
            
            <div className="text-center">
              <button 
                className="btn btn-sm btn-outline-danger me-2"
                onClick={() => {
                  if (window.confirm('¿Está seguro de limpiar los logs antiguos?')) {
                    // cleanOldLogs(30);
                    console.log('Limpiando logs antiguos...');
                  }
                }}
              >
                🗑️ Limpiar Logs
              </button>
              <button 
                className="btn btn-sm btn-outline-info"
                onClick={() => {
                  const stats = getProcessingStats();
                  alert(JSON.stringify(stats, null, 2));
                }}
              >
                📈 Ver Estadísticas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogsTab = () => {
    const filteredLogs = getFilteredLogs();
    
    return (
      <div className="row">
        {/* Controles de filtro */}
        <div className="col-12 mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6>📋 Historial de Cambios de Estado</h6>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="1h">Última hora</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de logs */}
        <div className="col-12">
          <div className="card">
            <div className="card-body p-0">
              {filteredLogs.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <div className="mb-2">📝</div>
                  <p className="mb-0">No hay cambios de estado en el período seleccionado</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Trabajador</th>
                        <th>Cambio de Estado</th>
                        <th>Razón</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, index) => (
                        <tr key={index}>
                          <td>
                            <small>
                              {new Date(log.timestamp).toLocaleString('es-CO')}
                            </small>
                          </td>
                          <td>
                            <strong>{log.trabajadorNombre}</strong>
                            <br />
                            <small className="text-muted">{log.trabajadorId}</small>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge bg-${getStateColor(log.fromState)}`}>
                                {getStateIcon(log.fromState)} {getStateName(log.fromState)}
                              </span>
                              <span>→</span>
                              <span className={`badge bg-${getStateColor(log.toState)}`}>
                                {getStateIcon(log.toState)} {getStateName(log.toState)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">{log.reason}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`state-monitoring-panel ${className}`}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">⚙️ Panel de Monitoreo de Estados</h4>
          <p className="text-muted mb-0">Gestión automática y monitoreo de encuestas</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isProcessing && (
            <div className="spinner-border spinner-border-sm text-primary">
              <span className="visually-hidden">Procesando...</span>
            </div>
          )}
          <span className={`badge ${isProcessing ? 'bg-warning' : 'bg-success'}`}>
            {isProcessing ? 'Procesando' : 'Activo'}
          </span>
        </div>
      </div>

      {/* Tabs de navegación */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Resumen
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            ⚙️ Configuración
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Historial
          </button>
        </li>
      </ul>

      {/* Contenido de tabs */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'config' && renderConfigTab()}
      {activeTab === 'logs' && renderLogsTab()}
    </div>
  );
};

export default StateMonitoringPanel;
