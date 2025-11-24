import React, { useState, useEffect, useRef } from 'react';
import { useNotificationManager, NOTIFICATION_CONFIG } from './NotificationService';

const NotificationCenter = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, critical
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, priority, type
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    stats,
    markAsRead,
    dismissNotification,
    removeNotification,
    clearAll,
    markAllAsRead
  } = useNotificationManager();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar y ordenar notificaciones
  const getFilteredNotifications = () => {
    let filtered = notifications.filter(n => !n.dismissed);

    // Aplicar filtros
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'critical':
        filtered = filtered.filter(n => 
          n.type === NOTIFICATION_CONFIG.TYPES.CRITICAL || 
          n.priority === NOTIFICATION_CONFIG.PRIORITIES.CRITICAL
        );
        break;
      default:
        // 'all' - no filtro adicional
        break;
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'timestamp':
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    return filtered;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      [NOTIFICATION_CONFIG.TYPES.SUCCESS]: '✅',
      [NOTIFICATION_CONFIG.TYPES.ERROR]: '❌',
      [NOTIFICATION_CONFIG.TYPES.WARNING]: '⚠️',
      [NOTIFICATION_CONFIG.TYPES.INFO]: 'ℹ️',
      [NOTIFICATION_CONFIG.TYPES.CRITICAL]: '🚨'
    };
    return icons[type] || 'ℹ️';
  };

  const getNotificationColor = (type, priority) => {
    if (priority === NOTIFICATION_CONFIG.PRIORITIES.CRITICAL) {
      return 'danger';
    }
    
    const colors = {
      [NOTIFICATION_CONFIG.TYPES.SUCCESS]: 'success',
      [NOTIFICATION_CONFIG.TYPES.ERROR]: 'danger',
      [NOTIFICATION_CONFIG.TYPES.WARNING]: 'warning',
      [NOTIFICATION_CONFIG.TYPES.INFO]: 'info',
      [NOTIFICATION_CONFIG.TYPES.CRITICAL]: 'danger'
    };
    return colors[type] || 'secondary';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      [NOTIFICATION_CONFIG.PRIORITIES.LOW]: { text: 'Baja', class: 'bg-secondary' },
      [NOTIFICATION_CONFIG.PRIORITIES.MEDIUM]: { text: 'Media', class: 'bg-primary' },
      [NOTIFICATION_CONFIG.PRIORITIES.HIGH]: { text: 'Alta', class: 'bg-warning' },
      [NOTIFICATION_CONFIG.PRIORITIES.CRITICAL]: { text: 'Crítica', class: 'bg-danger' }
    };
    return badges[priority] || badges[NOTIFICATION_CONFIG.PRIORITIES.MEDIUM];
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('es-CO');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Manejar acciones específicas basadas en metadata
    if (notification.metadata?.action) {
      handleNotificationAction(notification);
    }
  };

  const handleNotificationAction = (notification) => {
    const { action, encuestaId, trabajadorId } = notification.metadata;

    switch (action) {
      case 'remind_worker':
        // Abrir modal para enviar recordatorio
        console.log('Enviando recordatorio a trabajador:', trabajadorId);
        break;
      case 'escalate_expired':
        // Escalar encuesta vencida
        console.log('Escalando encuesta vencida:', encuestaId);
        break;
      case 'view_results':
        // Ver resultados de encuesta
        console.log('Viendo resultados de encuesta:', encuestaId);
        break;
      case 'medical_review':
        // Programar revisión médica
        console.log('Programando revisión médica para:', trabajadorId);
        break;
      case 'schedule_follow_up':
        // Programar seguimiento
        console.log('Programando seguimiento para:', trabajadorId);
        break;
      default:
        console.log('Acción no definida:', action);
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className={`notification-center ${className}`} ref={dropdownRef}>
      {/* Botón de notificaciones */}
      <button
        type="button"
        className="btn btn-outline-primary position-relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Centro de notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="visually-hidden">notificaciones no leídas</span>
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="notification-dropdown position-absolute end-0 mt-2 shadow-lg border rounded bg-white" 
             style={{ width: '400px', maxHeight: '600px', zIndex: 1050 }}>
          
          {/* Header */}
          <div className="notification-header p-3 border-bottom bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">🔔 Centro de Notificaciones</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
              ></button>
            </div>
            
            {/* Estadísticas rápidas */}
            <div className="row text-center">
              <div className="col-4">
                <small className="text-muted">Total</small>
                <div className="fw-bold">{stats.total}</div>
              </div>
              <div className="col-4">
                <small className="text-muted">No leídas</small>
                <div className="fw-bold text-primary">{stats.unread}</div>
              </div>
              <div className="col-4">
                <small className="text-muted">Recientes</small>
                <div className="fw-bold text-info">{stats.recent}</div>
              </div>
            </div>
          </div>

          {/* Controles de filtro */}
          <div className="notification-controls p-2 border-bottom">
            <div className="row g-2">
              <div className="col-6">
                <select
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="unread">No leídas</option>
                  <option value="critical">Críticas</option>
                </select>
              </div>
              <div className="col-6">
                <select
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="timestamp">Por fecha</option>
                  <option value="priority">Por prioridad</option>
                  <option value="type">Por tipo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <div className="mb-2">📭</div>
                <p className="mb-0">No hay notificaciones</p>
                <small>
                  {filter === 'all' ? 'Todas las notificaciones han sido procesadas' :
                   filter === 'unread' ? 'No hay notificaciones sin leer' :
                   'No hay notificaciones críticas'}
                </small>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item p-3 border-bottom cursor-pointer ${
                    !notification.read ? 'bg-light' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start">
                    {/* Icono y indicador de no leída */}
                    <div className="flex-shrink-0 me-2">
                      <span className="fs-5">{getNotificationIcon(notification.type)}</span>
                      {!notification.read && (
                        <div className="bg-primary rounded-circle position-absolute" 
                             style={{ width: '8px', height: '8px', marginTop: '-5px', marginLeft: '15px' }}></div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-0 text-truncate" style={{ fontSize: '0.9rem' }}>
                          {notification.title}
                        </h6>
                        <div className="d-flex gap-1 ms-2">
                          <span className={`badge ${getPriorityBadge(notification.priority).class}`} 
                                style={{ fontSize: '0.7rem' }}>
                            {getPriorityBadge(notification.priority).text}
                          </span>
                        </div>
                      </div>
                      
                      <p className="mb-1 text-muted small">{notification.message}</p>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {formatTimestamp(notification.timestamp)}
                        </small>
                        
                        {/* Acciones rápidas */}
                        <div className="d-flex gap-1">
                          {!notification.read && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              title="Marcar como leída"
                            >
                              👁️
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            title="Descartar"
                          >
                            ✖️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con acciones */}
          {filteredNotifications.length > 0 && (
            <div className="notification-footer p-2 border-top bg-light">
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={markAllAsRead}
                  disabled={stats.unread === 0}
                >
                  ✅ Marcar todas como leídas
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    if (window.confirm('¿Está seguro de eliminar todas las notificaciones?')) {
                      clearAll();
                    }
                  }}
                >
                  🗑️ Limpiar todas
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast notifications para notificaciones críticas */}
      <NotificationToasts />
    </div>
  );
};

// Componente para mostrar toasts de notificaciones críticas
const NotificationToasts = () => {
  const { notifications } = useNotificationManager();
  const [activeToasts, setActiveToasts] = useState([]);

  useEffect(() => {
    // Mostrar toasts solo para notificaciones críticas recientes
    const criticalNotifications = notifications.filter(n => 
      n.type === NOTIFICATION_CONFIG.TYPES.CRITICAL &&
      !n.dismissed &&
      new Date() - new Date(n.timestamp) < 30000 // Últimos 30 segundos
    );

    setActiveToasts(criticalNotifications);
  }, [notifications]);

  const dismissToast = (notificationId) => {
    setActiveToasts(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
      {activeToasts.map((notification) => (
        <div
          key={notification.id}
          className="toast show"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header bg-danger text-white">
            <span className="me-2">🚨</span>
            <strong className="me-auto">Alerta Crítica</strong>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => dismissToast(notification.id)}
              aria-label="Cerrar"
            ></button>
          </div>
          <div className="toast-body">
            <strong>{notification.title}</strong>
            <p className="mb-0 mt-1">{notification.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;
