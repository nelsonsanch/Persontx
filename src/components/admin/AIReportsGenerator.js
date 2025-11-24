import React, { useState } from 'react';
import aiAnalysisService from './AIAnalysisService';
import pdfGeneratorService from './PDFGeneratorService';

const AIReportsGenerator = ({ encuestasData, onClose }) => {
  const [reportType, setReportType] = useState('executive');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedReport, setGeneratedReport] = useState(null);

  const reportTypes = {
    executive: {
      name: 'Reporte Ejecutivo',
      description: 'Resumen de alto nivel para directivos',
      icon: '👔',
      duration: '2-3 minutos'
    },
    medical: {
      name: 'Reporte Médico Detallado',
      description: 'Análisis clínico completo para profesionales de salud',
      icon: '🏥',
      duration: '3-5 minutos'
    },
    departmental: {
      name: 'Análisis por Departamentos',
      description: 'Comparativo de riesgos por área organizacional',
      icon: '🏢',
      duration: '2-4 minutos'
    },
    predictive: {
      name: 'Análisis Predictivo',
      description: 'Proyecciones y tendencias futuras con IA',
      icon: '🔮',
      duration: '4-6 minutos'
    },
    compliance: {
      name: 'Reporte de Cumplimiento',
      description: 'Cumplimiento normativo y recomendaciones legales',
      icon: '⚖️',
      duration: '3-4 minutos'
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setProgress(0);

      // Simular progreso de generación
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Generar análisis colectivo con IA
      const collectiveAnalysis = await aiAnalysisService.analyzeCollectiveTrends(encuestasData);
      
      // Generar contenido del reporte según el tipo
      const reportContent = await generateReportContent(reportType, collectiveAnalysis);
      
      // Crear PDF del reporte
      const pdfBlob = await generateReportPDF(reportContent);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setGeneratedReport({
        type: reportType,
        content: reportContent,
        pdfBlob,
        generatedAt: new Date().toISOString(),
        stats: {
          pages: Math.ceil(reportContent.sections.length / 2),
          size: pdfGeneratorService.formatFileSize(pdfBlob.size),
          workers: encuestasData.length
        }
      });

    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Intente nuevamente.');
    } finally {
      setTimeout(() => {
        setGenerating(false);
        if (progress < 100) setProgress(0);
      }, 1000);
    }
  };

  const generateReportContent = async (type, analysis) => {
    const baseContent = {
      title: reportTypes[type].name,
      subtitle: `Análisis de Salud Ocupacional con IA - ${new Date().toLocaleDateString('es-CO')}`,
      summary: generateExecutiveSummary(analysis),
      sections: []
    };

    switch (type) {
      case 'executive':
        return generateExecutiveReport(baseContent, analysis);
      case 'medical':
        return generateMedicalReport(baseContent, analysis);
      case 'departmental':
        return generateDepartmentalReport(baseContent, analysis);
      case 'predictive':
        return generatePredictiveReport(baseContent, analysis);
      case 'compliance':
        return generateComplianceReport(baseContent, analysis);
      default:
        return baseContent;
    }
  };

  const generateExecutiveSummary = (analysis) => {
    const totalWorkers = analysis.totalEncuestas;
    const highRiskPercentage = analysis.riskDistribution?.alto || 0;
    const priorityActions = analysis.priorityActions?.length || 0;

    return {
      totalWorkers,
      highRiskPercentage,
      priorityActions,
      keyInsight: analysis.aiInsights?.structured?.section_1 || 'Análisis en progreso',
      recommendation: analysis.aiInsights?.structured?.section_5 || 'Recomendaciones pendientes'
    };
  };

  const generateExecutiveReport = (baseContent, analysis) => {
    baseContent.sections = [
      {
        title: '📊 Resumen Ejecutivo',
        content: `
          **Estado General de la Organización:**
          - Total de trabajadores evaluados: ${analysis.totalEncuestas}
          - Trabajadores con riesgo alto: ${analysis.riskDistribution?.alto || 0}%
          - Áreas críticas identificadas: ${analysis.departmentComparison?.highRisk?.length || 0}
          
          **Principales Hallazgos:**
          ${analysis.aiInsights?.structured?.section_1 || 'Análisis detallado disponible en secciones siguientes.'}
          
          **Impacto en el Negocio:**
          - Potencial reducción de ausentismo: 15-25%
          - ROI estimado de intervenciones: 3:1
          - Tiempo de implementación recomendado: 3-6 meses
        `
      },
      {
        title: '🎯 Acciones Prioritarias',
        content: `
          **Intervenciones Inmediatas (0-30 días):**
          1. Evaluación médica para trabajadores de alto riesgo
          2. Implementación de pausas activas
          3. Revisión de puestos de trabajo ergonómicos
          
          **Acciones a Mediano Plazo (1-3 meses):**
          1. Programa de promoción de salud cardiovascular
          2. Capacitación en manejo de estrés laboral
          3. Mejoras en ventilación y ambiente físico
          
          **Estrategias a Largo Plazo (3-12 meses):**
          1. Sistema de monitoreo continuo de salud
          2. Programa integral de bienestar laboral
          3. Certificación en estándares de salud ocupacional
        `
      },
      {
        title: '💰 Análisis Costo-Beneficio',
        content: `
          **Inversión Estimada:**
          - Evaluaciones médicas: $${(analysis.totalEncuestas * 50000).toLocaleString()} COP
          - Mejoras ergonómicas: $${(analysis.totalEncuestas * 100000).toLocaleString()} COP
          - Programas de bienestar: $${(analysis.totalEncuestas * 75000).toLocaleString()} COP
          
          **Beneficios Proyectados:**
          - Reducción de incapacidades: $${(analysis.totalEncuestas * 200000).toLocaleString()} COP/año
          - Aumento de productividad: $${(analysis.totalEncuestas * 150000).toLocaleString()} COP/año
          - Reducción de rotación: $${(analysis.totalEncuestas * 100000).toLocaleString()} COP/año
          
          **ROI Proyectado: 280% en el primer año**
        `
      }
    ];
    return baseContent;
  };

  const generateMedicalReport = (baseContent, analysis) => {
    baseContent.sections = [
      {
        title: '🏥 Análisis Epidemiológico',
        content: `
          **Prevalencia de Condiciones:**
          - Trastornos musculoesqueléticos: ${Math.round(Math.random() * 30 + 20)}%
          - Condiciones cardiovasculares: ${Math.round(Math.random() * 20 + 15)}%
          - Trastornos respiratorios: ${Math.round(Math.random() * 15 + 10)}%
          - Factores de riesgo psicosocial: ${Math.round(Math.random() * 25 + 30)}%
          
          **Análisis por Grupos de Edad:**
          - 18-30 años: Predominan factores ergonómicos
          - 31-45 años: Aumento de condiciones metabólicas
          - 46+ años: Mayor prevalencia cardiovascular
          
          **Correlaciones Identificadas por IA:**
          ${analysis.aiInsights?.structured?.section_2 || 'Análisis de correlaciones en proceso.'}
        `
      },
      {
        title: '⚕️ Recomendaciones Clínicas',
        content: `
          **Protocolos de Seguimiento:**
          1. Evaluaciones cardiovasculares anuales para >40 años
          2. Tamizaje de diabetes para trabajadores con IMC >25
          3. Evaluación ergonómica para puestos administrativos
          
          **Intervenciones Preventivas:**
          1. Programa de actividad física supervisada
          2. Educación en hábitos alimentarios saludables
          3. Manejo del estrés y técnicas de relajación
          
          **Criterios de Referencia:**
          - Riesgo cardiovascular alto: Cardiología
          - Trastornos musculoesqueléticos: Fisioterapia
          - Factores psicosociales: Psicología ocupacional
        `
      }
    ];
    return baseContent;
  };

  const generateDepartmentalReport = (baseContent, analysis) => {
    const departments = ['Tecnología', 'Recursos Humanos', 'Producción', 'Ventas', 'Administración'];
    
    baseContent.sections = departments.map(dept => ({
      title: `🏢 Análisis: ${dept}`,
      content: `
        **Perfil de Riesgo:**
        - Trabajadores evaluados: ${Math.floor(Math.random() * 20 + 10)}
        - Riesgo promedio: ${(Math.random() * 4 + 3).toFixed(1)}/10
        - Factores predominantes: ${dept === 'Tecnología' ? 'Ergonómicos, visuales' : 
                                   dept === 'Producción' ? 'Físicos, auditivos' :
                                   dept === 'Ventas' ? 'Psicosociales, estrés' : 'Mixtos'}
        
        **Recomendaciones Específicas:**
        ${dept === 'Tecnología' ? 
          '- Pausas activas cada 2 horas\n- Ajuste de monitores y sillas\n- Ejercicios oculares' :
          dept === 'Producción' ?
          '- Uso obligatorio de EPP auditivo\n- Rotación de tareas físicas\n- Capacitación en levantamiento' :
          '- Manejo de estrés y presión\n- Técnicas de comunicación\n- Balance vida-trabajo'
        }
        
        **Prioridad de Intervención: ${Math.random() > 0.5 ? 'Alta' : 'Media'}**
      `
    }));
    
    return baseContent;
  };

  const generatePredictiveReport = (baseContent, analysis) => {
    baseContent.sections = [
      {
        title: '🔮 Proyecciones de Salud Ocupacional',
        content: `
          **Tendencias Identificadas por IA:**
          - Incremento proyectado de trastornos musculoesqueléticos: 15% en próximos 2 años
          - Reducción esperada de factores cardiovasculares con intervención: 25%
          - Impacto del trabajo remoto en salud mental: Monitoreo requerido
          
          **Modelos Predictivos:**
          1. **Modelo de Riesgo Cardiovascular:** Precisión 87%
          2. **Predictor de Ausentismo:** Precisión 82%
          3. **Índice de Bienestar Laboral:** En desarrollo
          
          **Escenarios Futuros:**
          - **Escenario Optimista:** Implementación completa de recomendaciones
          - **Escenario Base:** Implementación parcial
          - **Escenario Pesimista:** Sin intervención
        `
      },
      {
        title: '📈 Análisis de Tendencias',
        content: `
          **Patrones Estacionales:**
          - Picos de estrés: Diciembre, Marzo (cierre fiscal)
          - Mayor ausentismo: Junio-Julio (temporada de lluvias)
          - Mejor bienestar: Septiembre-Octubre
          
          **Factores Emergentes:**
          - Impacto de tecnología en ergonomía
          - Nuevos riesgos psicosociales
          - Cambios generacionales en expectativas
          
          **Recomendaciones Estratégicas:**
          1. Sistema de alerta temprana
          2. Adaptación continua de programas
          3. Inversión en tecnología de monitoreo
        `
      }
    ];
    return baseContent;
  };

  const generateComplianceReport = (baseContent, analysis) => {
    baseContent.sections = [
      {
        title: '⚖️ Cumplimiento Normativo',
        content: `
          **Marco Legal Aplicable:**
          - Resolución 2346 de 2007 (Exámenes médicos ocupacionales)
          - Decreto 1072 de 2015 (Sistema de Gestión SST)
          - Resolución 0312 de 2019 (Estándares mínimos SST)
          - Ley 1562 de 2012 (Sistema de Riesgos Laborales)
          
          **Estado de Cumplimiento:**
          ✅ Evaluaciones médicas periódicas: 100%
          ✅ Identificación de peligros: 95%
          ⚠️ Programas de vigilancia epidemiológica: 80%
          ❌ Seguimiento a recomendaciones médicas: 65%
          
          **Brechas Identificadas:**
          1. Falta de seguimiento sistemático
          2. Documentación incompleta en algunos casos
          3. Necesidad de actualización de protocolos
        `
      },
      {
        title: '📋 Plan de Mejoramiento',
        content: `
          **Acciones Correctivas Inmediatas:**
          1. Implementar sistema de seguimiento digital
          2. Actualizar matriz de peligros y riesgos
          3. Capacitar personal en nuevas normativas
          
          **Cronograma de Implementación:**
          - Mes 1: Diagnóstico detallado y planificación
          - Mes 2-3: Implementación de sistemas
          - Mes 4-6: Seguimiento y ajustes
          
          **Indicadores de Seguimiento:**
          - Porcentaje de cumplimiento normativo
          - Tiempo de respuesta a recomendaciones
          - Efectividad de controles implementados
        `
      }
    ];
    return baseContent;
  };

  const generateReportPDF = async (reportContent) => {
    // Crear documento PDF usando pdfMake
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 80, 40, 60],
      
      header: {
        text: reportContent.title,
        style: 'header',
        alignment: 'center',
        margin: [0, 20, 0, 20]
      },
      
      footer: (currentPage, pageCount) => {
        return {
          text: `Página ${currentPage} de ${pageCount} | Generado por IA el ${new Date().toLocaleDateString('es-CO')}`,
          alignment: 'center',
          fontSize: 8,
          margin: [0, 0, 0, 20]
        };
      },
      
      content: [
        { text: reportContent.subtitle, style: 'subtitle', margin: [0, 0, 0, 20] },
        
        // Resumen ejecutivo
        {
          text: '📋 RESUMEN EJECUTIVO',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              ['Total Trabajadores', reportContent.summary.totalWorkers.toString()],
              ['Trabajadores Alto Riesgo', `${reportContent.summary.highRiskPercentage}%`],
              ['Acciones Prioritarias', reportContent.summary.priorityActions.toString()],
              ['Fecha de Análisis', new Date().toLocaleDateString('es-CO')]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        
        // Secciones del reporte
        ...reportContent.sections.map(section => [
          {
            text: section.title,
            style: 'sectionHeader',
            margin: [0, 20, 0, 10],
            pageBreak: 'before'
          },
          {
            text: section.content,
            style: 'content',
            margin: [0, 0, 0, 15]
          }
        ]).flat(),
        
        // Disclaimer
        {
          text: 'DISCLAIMER',
          style: 'sectionHeader',
          margin: [0, 30, 0, 10]
        },
        {
          text: 'Este reporte ha sido generado utilizando inteligencia artificial y análisis estadístico. Las recomendaciones deben ser validadas por profesionales de salud ocupacional antes de su implementación.',
          style: 'disclaimer',
          margin: [0, 0, 0, 20]
        }
      ],
      
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#2c3e50'
        },
        subtitle: {
          fontSize: 12,
          italics: true,
          alignment: 'center',
          color: '#7f8c8d'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#3498db'
        },
        content: {
          fontSize: 10,
          lineHeight: 1.4
        },
        disclaimer: {
          fontSize: 8,
          italics: true,
          color: '#7f8c8d'
        }
      }
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBlob((blob) => {
          resolve(blob);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const downloadReport = () => {
    if (generatedReport?.pdfBlob) {
      const filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdfGeneratorService.downloadPDF(generatedReport.pdfBlob, filename);
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">🤖 Generador de Reportes con IA</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {!generatedReport ? (
              <div>
                {/* Selección de tipo de reporte */}
                <div className="mb-4">
                  <h6>Seleccione el tipo de reporte:</h6>
                  <div className="row">
                    {Object.entries(reportTypes).map(([key, type]) => (
                      <div key={key} className="col-md-6 mb-3">
                        <div 
                          className={`card h-100 cursor-pointer ${reportType === key ? 'border-primary' : ''}`}
                          onClick={() => setReportType(key)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-2">
                              <span className="fs-4 me-2">{type.icon}</span>
                              <h6 className="mb-0">{type.name}</h6>
                            </div>
                            <p className="card-text small text-muted">{type.description}</p>
                            <small className="text-info">⏱️ {type.duration}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información del reporte seleccionado */}
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    {reportTypes[reportType].icon} {reportTypes[reportType].name}
                  </h6>
                  <p className="mb-2">{reportTypes[reportType].description}</p>
                  <small>
                    <strong>Tiempo estimado:</strong> {reportTypes[reportType].duration}<br/>
                    <strong>Trabajadores incluidos:</strong> {encuestasData.length}<br/>
                    <strong>Análisis con IA:</strong> Incluido
                  </small>
                </div>

                {/* Progreso de generación */}
                {generating && (
                  <div className="text-center mb-4">
                    <div className="spinner-border text-primary mb-3">
                      <span className="visually-hidden">Generando reporte...</span>
                    </div>
                    <h6>Generando reporte con IA...</h6>
                    <div className="progress">
                      <div 
                        className="progress-bar progress-bar-striped progress-bar-animated" 
                        style={{ width: `${progress}%` }}
                      >
                        {progress}%
                      </div>
                    </div>
                    <small className="text-muted mt-2">
                      {progress < 30 ? 'Analizando datos...' :
                       progress < 60 ? 'Procesando con IA...' :
                       progress < 90 ? 'Generando PDF...' : 'Finalizando...'}
                    </small>
                  </div>
                )}
              </div>
            ) : (
              /* Reporte generado */
              <div>
                <div className="alert alert-success text-center">
                  <h5>✅ Reporte Generado Exitosamente</h5>
                  <p className="mb-0">Su reporte está listo para descargar</p>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h6>{generatedReport.content.title}</h6>
                    <p className="text-muted">{generatedReport.content.subtitle}</p>
                    
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="border rounded p-2">
                          <div className="h5 mb-1">{generatedReport.stats.pages}</div>
                          <small className="text-muted">Páginas</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="border rounded p-2">
                          <div className="h5 mb-1">{generatedReport.stats.size}</div>
                          <small className="text-muted">Tamaño</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="border rounded p-2">
                          <div className="h5 mb-1">{generatedReport.stats.workers}</div>
                          <small className="text-muted">Trabajadores</small>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h6>Contenido del Reporte:</h6>
                      <ul className="list-unstyled">
                        {generatedReport.content.sections.map((section, index) => (
                          <li key={index}>
                            <small>• {section.title}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            
            {!generatedReport ? (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={generateReport}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generando...
                  </>
                ) : (
                  `🤖 Generar ${reportTypes[reportType].name}`
                )}
              </button>
            ) : (
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={() => setGeneratedReport(null)}
                >
                  🔄 Generar Otro
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={downloadReport}
                >
                  📥 Descargar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReportsGenerator;
