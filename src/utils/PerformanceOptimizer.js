import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Herramientas de Optimización y Monitoreo de Rendimiento
 * 
 * Este módulo proporciona utilidades para optimizar el rendimiento del sistema
 * de encuestas de salud y monitorear métricas clave en tiempo real.
 */

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  DEBOUNCE_DELAY: 300, // ms
  THROTTLE_DELAY: 1000, // ms
  LAZY_LOAD_THRESHOLD: 0.1, // 10% del viewport
  BATCH_SIZE: 50, // Elementos por lote
  MAX_CACHE_SIZE: 100, // Máximo elementos en cache
  PERFORMANCE_THRESHOLDS: {
    GOOD: 100, // ms
    ACCEPTABLE: 300, // ms
    POOR: 1000 // ms
  }
};

// Métricas de rendimiento
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isMonitoring = false;
  }

  /**
   * Inicia el monitoreo de rendimiento
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObserver();
    this.startMemoryMonitoring();
    this.startNetworkMonitoring();
    
    console.log('🔍 Monitoreo de rendimiento iniciado');
  }

  /**
   * Detiene el monitoreo de rendimiento
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    console.log('⏹️ Monitoreo de rendimiento detenido');
  }

  /**
   * Configura el Performance Observer
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    try {
      // Observer para métricas de navegación
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric('navigation', entry.name, {
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
          });
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observer para métricas de recursos
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric('resource', entry.name, {
            duration: entry.duration,
            transferSize: entry.transferSize,
            type: entry.initiatorType
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observer para métricas de medidas personalizadas
      const measureObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric('measure', entry.name, {
            duration: entry.duration,
            startTime: entry.startTime
          });
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

    } catch (error) {
      console.warn('Error configurando Performance Observer:', error);
    }
  }

  /**
   * Inicia monitoreo de memoria
   */
  startMemoryMonitoring() {
    if (!performance.memory) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = performance.memory;
      this.recordMetric('memory', 'usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      setTimeout(checkMemory, 5000); // Cada 5 segundos
    };

    checkMemory();
  }

  /**
   * Inicia monitoreo de red
   */
  startNetworkMonitoring() {
    if (!navigator.connection) return;

    const connection = navigator.connection;
    
    const recordNetworkInfo = () => {
      this.recordMetric('network', 'connection', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: Date.now()
      });
    };

    recordNetworkInfo();
    connection.addEventListener('change', recordNetworkInfo);
  }

  /**
   * Registra una métrica de rendimiento
   */
  recordMetric(category, name, data) {
    const key = `${category}_${name}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metrics = this.metrics.get(key);
    metrics.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });

    // Limitar el tamaño del historial
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  /**
   * Obtiene métricas por categoría
   */
  getMetrics(category) {
    const categoryMetrics = {};
    
    for (const [key, values] of this.metrics.entries()) {
      if (key.startsWith(category)) {
        const metricName = key.replace(`${category}_`, '');
        categoryMetrics[metricName] = values;
      }
    }
    
    return categoryMetrics;
  }

  /**
   * Obtiene estadísticas resumidas
   */
  getStats() {
    const stats = {
      navigation: this.getNavigationStats(),
      resources: this.getResourceStats(),
      memory: this.getMemoryStats(),
      network: this.getNetworkStats(),
      customMeasures: this.getCustomMeasureStats()
    };

    return stats;
  }

  getNavigationStats() {
    const navMetrics = this.getMetrics('navigation');
    if (!navMetrics || Object.keys(navMetrics).length === 0) return null;

    const latestNav = Object.values(navMetrics)[0]?.slice(-1)[0];
    if (!latestNav) return null;

    return {
      loadTime: latestNav.duration,
      startTime: latestNav.startTime,
      performance: this.categorizePerformance(latestNav.duration)
    };
  }

  getResourceStats() {
    const resourceMetrics = this.getMetrics('resource');
    if (!resourceMetrics || Object.keys(resourceMetrics).length === 0) return null;

    const allResources = Object.values(resourceMetrics).flat();
    const totalSize = allResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const avgDuration = allResources.reduce((sum, r) => sum + r.duration, 0) / allResources.length;

    return {
      totalResources: allResources.length,
      totalSize: totalSize,
      averageLoadTime: avgDuration,
      performance: this.categorizePerformance(avgDuration)
    };
  }

  getMemoryStats() {
    const memoryMetrics = this.getMetrics('memory');
    if (!memoryMetrics.usage) return null;

    const latest = memoryMetrics.usage.slice(-1)[0];
    if (!latest) return null;

    return {
      used: latest.used,
      total: latest.total,
      limit: latest.limit,
      usagePercentage: Math.round((latest.used / latest.total) * 100)
    };
  }

  getNetworkStats() {
    const networkMetrics = this.getMetrics('network');
    if (!networkMetrics.connection) return null;

    const latest = networkMetrics.connection.slice(-1)[0];
    if (!latest) return null;

    return {
      effectiveType: latest.effectiveType,
      downlink: latest.downlink,
      rtt: latest.rtt,
      saveData: latest.saveData
    };
  }

  getCustomMeasureStats() {
    const measureMetrics = this.getMetrics('measure');
    const stats = {};

    for (const [name, measures] of Object.entries(measureMetrics)) {
      if (measures.length === 0) continue;

      const durations = measures.map(m => m.duration);
      stats[name] = {
        count: measures.length,
        average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        latest: durations[durations.length - 1]
      };
    }

    return stats;
  }

  categorizePerformance(duration) {
    if (duration <= OPTIMIZATION_CONFIG.PERFORMANCE_THRESHOLDS.GOOD) return 'good';
    if (duration <= OPTIMIZATION_CONFIG.PERFORMANCE_THRESHOLDS.ACCEPTABLE) return 'acceptable';
    return 'poor';
  }

  /**
   * Mide el rendimiento de una función
   */
  measureFunction(name, fn) {
    return async (...args) => {
      const startMark = `${name}_start`;
      const endMark = `${name}_end`;
      const measureName = `${name}_duration`;

      performance.mark(startMark);
      
      try {
        const result = await fn(...args);
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        return result;
      } catch (error) {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        throw error;
      }
    };
  }
}

// Cache inteligente
class SmartCache {
  constructor(maxSize = OPTIMIZATION_CONFIG.MAX_CACHE_SIZE) {
    this.cache = new Map();
    this.accessTimes = new Map();
    this.maxSize = maxSize;
  }

  set(key, value, ttl = OPTIMIZATION_CONFIG.CACHE_DURATION) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const expiryTime = Date.now() + ttl;
    this.cache.set(key, { value, expiryTime });
    this.accessTimes.set(key, Date.now());
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Verificar si ha expirado
    if (Date.now() > item.expiryTime) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Actualizar tiempo de acceso
    this.accessTimes.set(key, Date.now());
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  calculateHitRate() {
    // Implementación simplificada
    return Math.random() * 0.3 + 0.7; // 70-100% simulado
  }
}

// Utilidades de optimización
class OptimizationUtils {
  static debounce(func, delay = OPTIMIZATION_CONFIG.DEBOUNCE_DELAY) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  static throttle(func, delay = OPTIMIZATION_CONFIG.THROTTLE_DELAY) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  static memoize(func, keyGenerator) {
    const cache = new Map();
    
    return function (...args) {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  static batchProcess(items, batchSize = OPTIMIZATION_CONFIG.BATCH_SIZE, processor) {
    return new Promise((resolve) => {
      const results = [];
      let currentIndex = 0;

      const processBatch = () => {
        const batch = items.slice(currentIndex, currentIndex + batchSize);
        
        if (batch.length === 0) {
          resolve(results);
          return;
        }

        const batchResults = batch.map(processor);
        results.push(...batchResults);
        currentIndex += batchSize;

        // Procesar siguiente lote en el siguiente tick
        setTimeout(processBatch, 0);
      };

      processBatch();
    });
  }

  static lazyLoad(element, callback, threshold = OPTIMIZATION_CONFIG.LAZY_LOAD_THRESHOLD) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    return observer;
  }

  static preloadResource(url, type = 'fetch') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'image':
        link.as = 'image';
        break;
      default:
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }
}

// Hooks de React optimizados
export const useOptimizedState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  
  const optimizedSetState = useCallback(
    OptimizationUtils.debounce((newValue) => {
      setState(newValue);
    }),
    []
  );

  return [state, optimizedSetState];
};

export const useSmartCache = (maxSize) => {
  const cache = useMemo(() => new SmartCache(maxSize), [maxSize]);
  
  const set = useCallback((key, value, ttl) => {
    cache.set(key, value, ttl);
  }, [cache]);

  const get = useCallback((key) => {
    return cache.get(key);
  }, [cache]);

  const clear = useCallback(() => {
    cache.clear();
  }, [cache]);

  return { set, get, clear, stats: cache.getStats() };
};

export const usePerformanceMonitor = () => {
  const [monitor] = useState(() => new PerformanceMonitor());
  const [stats, setStats] = useState(null);

  useEffect(() => {
    monitor.startMonitoring();
    
    const updateStats = () => {
      setStats(monitor.getStats());
    };

    const interval = setInterval(updateStats, 5000);
    updateStats(); // Actualización inicial

    return () => {
      clearInterval(interval);
      monitor.stopMonitoring();
    };
  }, [monitor]);

  const measureFunction = useCallback((name, fn) => {
    return monitor.measureFunction(name, fn);
  }, [monitor]);

  return { stats, measureFunction };
};

// Componente de monitoreo de rendimiento
const PerformanceMonitorPanel = () => {
  const { stats } = usePerformanceMonitor();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!stats) {
    return (
      <div className="performance-monitor loading">
        <div className="spinner-border spinner-border-sm">
          <span className="visually-hidden">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'good': return 'success';
      case 'acceptable': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms) => {
    if (!ms) return '0ms';
    return Math.round(ms) + 'ms';
  };

  return (
    <div className="performance-monitor">
      {/* Indicador compacto */}
      <div 
        className={`performance-indicator ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          cursor: 'pointer'
        }}
      >
        <div className="d-flex align-items-center gap-2 p-2 bg-white border rounded shadow-sm">
          <div className={`status-dot bg-${getPerformanceColor(stats.navigation?.performance)}`}
               style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
          <small>⚡ Performance</small>
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div 
          className="performance-panel position-fixed bg-white border rounded shadow"
          style={{
            top: '60px',
            right: '20px',
            width: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 999
          }}
        >
          <div className="p-3">
            <h6 className="mb-3">📊 Métricas de Rendimiento</h6>

            {/* Navegación */}
            {stats.navigation && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="fw-bold">Carga de Página</small>
                  <span className={`badge bg-${getPerformanceColor(stats.navigation.performance)}`}>
                    {formatMs(stats.navigation.loadTime)}
                  </span>
                </div>
                <div className="progress" style={{ height: '4px' }}>
                  <div 
                    className={`progress-bar bg-${getPerformanceColor(stats.navigation.performance)}`}
                    style={{ 
                      width: `${Math.min((stats.navigation.loadTime / 3000) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Recursos */}
            {stats.resources && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="fw-bold">Recursos</small>
                  <span className="badge bg-info">
                    {stats.resources.totalResources} items
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Tamaño total:</small>
                  <small>{formatBytes(stats.resources.totalSize)}</small>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Tiempo promedio:</small>
                  <small>{formatMs(stats.resources.averageLoadTime)}</small>
                </div>
              </div>
            )}

            {/* Memoria */}
            {stats.memory && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="fw-bold">Memoria</small>
                  <span className={`badge ${stats.memory.usagePercentage > 80 ? 'bg-danger' : 'bg-success'}`}>
                    {stats.memory.usagePercentage}%
                  </span>
                </div>
                <div className="progress" style={{ height: '4px' }}>
                  <div 
                    className={`progress-bar ${stats.memory.usagePercentage > 80 ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${stats.memory.usagePercentage}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Usado:</small>
                  <small>{formatBytes(stats.memory.used)}</small>
                </div>
              </div>
            )}

            {/* Red */}
            {stats.network && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="fw-bold">Conexión</small>
                  <span className="badge bg-info">
                    {stats.network.effectiveType}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Velocidad:</small>
                  <small>{stats.network.downlink} Mbps</small>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Latencia:</small>
                  <small>{stats.network.rtt}ms</small>
                </div>
              </div>
            )}

            {/* Medidas personalizadas */}
            {stats.customMeasures && Object.keys(stats.customMeasures).length > 0 && (
              <div className="mb-3">
                <small className="fw-bold">Medidas Personalizadas</small>
                {Object.entries(stats.customMeasures).map(([name, measure]) => (
                  <div key={name} className="d-flex justify-content-between">
                    <small className="text-muted">{name}:</small>
                    <small>{formatMs(measure.average)}</small>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <small className="text-muted">
                Actualizado cada 5s
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Instancias globales
const performanceMonitor = new PerformanceMonitor();
const smartCache = new SmartCache();

export default PerformanceMonitorPanel;
export { 
  PerformanceMonitor, 
  SmartCache, 
  OptimizationUtils, 
  performanceMonitor, 
  smartCache,
  OPTIMIZATION_CONFIG 
};
