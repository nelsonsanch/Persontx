import React from 'react';

/**
 * Componentes por Categoría de Encuesta de Salud Ocupacional
 * 
 * Este archivo contiene los componentes específicos para cada categoría
 * de la encuesta, permitiendo una renderización modular y personalizada.
 */

// Configuración de categorías
export const CATEGORIAS_CONFIG = {
  datos_personales: {
    id: 'datos_personales',
    titulo: 'Datos Personales',
    descripcion: 'Información básica del trabajador',
    icono: '👤',
    color: '#007bff',
    preguntas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
  },
  informacion_laboral: {
    id: 'informacion_laboral',
    titulo: 'Información Laboral',
    descripcion: 'Datos relacionados con el trabajo actual',
    icono: '💼',
    color: '#28a745',
    preguntas: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
  },
  perfil_sociodemografico: {
    id: 'perfil_sociodemografico',
    titulo: 'Perfil Sociodemográfico',
    descripcion: 'Características sociales y demográficas',
    icono: '🏠',
    color: '#17a2b8',
    preguntas: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41]
  },
  antecedentes_medicos: {
    id: 'antecedentes_medicos',
    titulo: 'Antecedentes Médicos',
    descripcion: 'Historial médico y condiciones de salud',
    icono: '🏥',
    color: '#dc3545',
    preguntas: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]
  },
  habitos_vida: {
    id: 'habitos_vida',
    titulo: 'Hábitos de Vida',
    descripcion: 'Estilo de vida y hábitos personales',
    icono: '🌱',
    color: '#ffc107',
    preguntas: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69]
  },
  condiciones_musculoesqueleticas: {
    id: 'condiciones_musculoesqueleticas',
    titulo: 'Condiciones Musculoesqueléticas',
    descripcion: 'Problemas relacionados con músculos y huesos',
    icono: '🦴',
    color: '#fd7e14',
    preguntas: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85]
  },
  historial_medico: {
    id: 'historial_medico',
    titulo: 'Historial Médico Adicional',
    descripcion: 'Información médica complementaria',
    icono: '📋',
    color: '#6f42c1',
    preguntas: [86, 87, 88, 89, 90]
  }
};

// Componente para mostrar el header de una categoría
export const CategoriaHeader = ({ categoria, preguntaActual, totalPreguntas }) => {
  const config = CATEGORIAS_CONFIG[categoria];
  
  if (!config) return null;

  const progreso = Math.round((preguntaActual / totalPreguntas) * 100);

  return (
    <div className="categoria-header mb-4">
      <div className="card border-0 shadow-sm" style={{ borderLeft: `4px solid ${config.color}` }}>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2 me-3">{config.icono}</span>
                <div>
                  <h4 className="mb-1" style={{ color: config.color }}>
                    {config.titulo}
                  </h4>
                  <p className="text-muted mb-0">{config.descripcion}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="mb-2">
                <small className="text-muted">
                  Pregunta {preguntaActual} de {totalPreguntas}
                </small>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${progreso}%`,
                    backgroundColor: config.color
                  }}
                  role="progressbar"
                  aria-valuenow={progreso}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                </div>
              </div>
              <small className="text-muted">{progreso}% completado</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para navegación entre categorías
export const CategoriaNavegacion = ({ 
  categoriaActual, 
  onCambiarCategoria, 
  categoriasCompletadas = [],
  categoriasBloqueadas = []
}) => {
  return (
    <div className="categoria-navegacion mb-4">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">📋 Navegación por Categorías</h6>
        </div>
        <div className="card-body p-2">
          <div className="row g-2">
            {Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => {
              const esActual = categoriaActual === key;
              const estaCompletada = categoriasCompletadas.includes(key);
              const estaBloqueada = categoriasBloqueadas.includes(key);
              
              let claseBoton = 'btn btn-outline-secondary btn-sm';
              let icono = config.icono;
              
              if (esActual) {
                claseBoton = `btn btn-sm text-white`;
                claseBoton += ` bg-primary border-primary`;
              } else if (estaCompletada) {
                claseBoton = 'btn btn-outline-success btn-sm';
                icono = '✅';
              } else if (estaBloqueada) {
                claseBoton = 'btn btn-outline-secondary btn-sm';
                icono = '🔒';
              }

              return (
                <div key={key} className="col-md-4 col-lg-3">
                  <button
                    type="button"
                    className={`${claseBoton} w-100 text-start`}
                    onClick={() => !estaBloqueada && onCambiarCategoria(key)}
                    disabled={estaBloqueada}
                    title={config.descripcion}
                  >
                    <span className="me-2">{icono}</span>
                    <small>{config.titulo}</small>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar el resumen de una categoría
export const CategoriaResumen = ({ categoria, respuestas = {} }) => {
  const config = CATEGORIAS_CONFIG[categoria];
  
  if (!config) return null;

  const preguntasCategoria = config.preguntas;
  const respuestasCategoria = preguntasCategoria.filter(p => respuestas[p]);
  const porcentajeCompletado = Math.round((respuestasCategoria.length / preguntasCategoria.length) * 100);

  return (
    <div className="categoria-resumen">
      <div className="card border-0" style={{ borderLeft: `4px solid ${config.color}` }}>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-8">
              <div className="d-flex align-items-center">
                <span className="fs-4 me-3">{config.icono}</span>
                <div>
                  <h6 className="mb-1">{config.titulo}</h6>
                  <small className="text-muted">
                    {respuestasCategoria.length} de {preguntasCategoria.length} preguntas
                  </small>
                </div>
              </div>
            </div>
            <div className="col-4 text-end">
              <div className="progress mb-1" style={{ height: '6px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${porcentajeCompletado}%`,
                    backgroundColor: config.color
                  }}
                ></div>
              </div>
              <small className="text-muted">{porcentajeCompletado}%</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar estadísticas de categorías
export const CategoriaEstadisticas = ({ respuestas = {} }) => {
  const estadisticas = Object.entries(CATEGORIAS_CONFIG).map(([key, config]) => {
    const preguntasCategoria = config.preguntas;
    const respuestasCategoria = preguntasCategoria.filter(p => respuestas[p]);
    const porcentaje = Math.round((respuestasCategoria.length / preguntasCategoria.length) * 100);
    
    return {
      ...config,
      key,
      respondidas: respuestasCategoria.length,
      total: preguntasCategoria.length,
      porcentaje
    };
  });

  const totalRespondidas = Object.keys(respuestas).length;
  const totalPreguntas = 90;
  const porcentajeGeneral = Math.round((totalRespondidas / totalPreguntas) * 100);

  return (
    <div className="categoria-estadisticas">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">📊 Progreso por Categorías</h6>
            <span className="badge bg-primary">
              {porcentajeGeneral}% Total
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {estadisticas.map((stat) => (
              <div key={stat.key} className="col-md-6">
                <div className="d-flex align-items-center mb-2">
                  <span className="me-2">{stat.icono}</span>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="fw-bold">{stat.titulo}</small>
                      <small className="text-muted">
                        {stat.respondidas}/{stat.total}
                      </small>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${stat.porcentaje}%`,
                          backgroundColor: stat.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para alertas específicas de categoría
export const CategoriaAlertas = ({ categoria, respuestas = {} }) => {
  const config = CATEGORIAS_CONFIG[categoria];
  const alertas = [];

  // Lógica específica de alertas por categoría
  switch (categoria) {
    case 'antecedentes_medicos':
      // Verificar respuestas críticas en antecedentes médicos
      const condicionesCriticas = [42, 44, 45]; // Corazón, diabetes, cerebro
      condicionesCriticas.forEach(pregunta => {
        if (respuestas[pregunta] === 'Sí') {
          alertas.push({
            tipo: 'warning',
            mensaje: 'Se detectó una condición médica que requiere atención especial.',
            icono: '⚠️'
          });
        }
      });
      break;

    case 'habitos_vida':
      // Verificar hábitos de riesgo
      if (respuestas[60] === 'Sí') { // Fumar
        alertas.push({
          tipo: 'danger',
          mensaje: 'El tabaquismo es un factor de riesgo importante para la salud.',
          icono: '🚭'
        });
      }
      break;

    case 'condiciones_musculoesqueleticas':
      // Verificar problemas musculoesqueléticos
      const problemasMusculo = [70, 71, 72, 73, 74];
      const tieneProblemas = problemasMusculo.some(p => respuestas[p] === 'Sí');
      if (tieneProblemas) {
        alertas.push({
          tipo: 'info',
          mensaje: 'Se recomienda evaluación ergonómica del puesto de trabajo.',
          icono: 'ℹ️'
        });
      }
      break;

    default:
      break;
  }

  if (alertas.length === 0) return null;

  return (
    <div className="categoria-alertas mb-3">
      {alertas.map((alerta, index) => (
        <div key={index} className={`alert alert-${alerta.tipo} d-flex align-items-center`}>
          <span className="me-2">{alerta.icono}</span>
          <span>{alerta.mensaje}</span>
        </div>
      ))}
    </div>
  );
};

// Función para obtener la siguiente categoría
export const obtenerSiguienteCategoria = (categoriaActual) => {
  const categorias = Object.keys(CATEGORIAS_CONFIG);
  const indiceActual = categorias.indexOf(categoriaActual);
  
  if (indiceActual === -1 || indiceActual === categorias.length - 1) {
    return null; // No hay siguiente categoría
  }
  
  return categorias[indiceActual + 1];
};

// Función para obtener la categoría anterior
export const obtenerCategoriaAnterior = (categoriaActual) => {
  const categorias = Object.keys(CATEGORIAS_CONFIG);
  const indiceActual = categorias.indexOf(categoriaActual);
  
  if (indiceActual <= 0) {
    return null; // No hay categoría anterior
  }
  
  return categorias[indiceActual - 1];
};

// Función para verificar si una categoría está completa
export const esCategoriaCompleta = (categoria, respuestas = {}) => {
  const config = CATEGORIAS_CONFIG[categoria];
  if (!config) return false;
  
  return config.preguntas.every(pregunta => respuestas[pregunta]);
};

// Función para obtener el progreso total
export const obtenerProgresoTotal = (respuestas = {}) => {
  const totalPreguntas = 90;
  const preguntasRespondidas = Object.keys(respuestas).length;
  
  return {
    respondidas: preguntasRespondidas,
    total: totalPreguntas,
    porcentaje: Math.round((preguntasRespondidas / totalPreguntas) * 100)
  };
};

// Función para obtener categorías por estado
export const obtenerCategoriasPorEstado = (respuestas = {}) => {
  const completadas = [];
  const enProgreso = [];
  const pendientes = [];
  
  Object.entries(CATEGORIAS_CONFIG).forEach(([key, config]) => {
    const preguntasRespondidas = config.preguntas.filter(p => respuestas[p]).length;
    
    if (preguntasRespondidas === config.preguntas.length) {
      completadas.push(key);
    } else if (preguntasRespondidas > 0) {
      enProgreso.push(key);
    } else {
      pendientes.push(key);
    }
  });
  
  return { completadas, enProgreso, pendientes };
};

export default {
  CATEGORIAS_CONFIG,
  CategoriaHeader,
  CategoriaNavegacion,
  CategoriaResumen,
  CategoriaEstadisticas,
  CategoriaAlertas,
  obtenerSiguienteCategoria,
  obtenerCategoriaAnterior,
  esCategoriaCompleta,
  obtenerProgresoTotal,
  obtenerCategoriasPorEstado
};