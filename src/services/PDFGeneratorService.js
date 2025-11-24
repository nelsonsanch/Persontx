import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { PREGUNTAS_ENCUESTA, CATEGORIAS_ENCUESTA, TITULOS_CATEGORIAS } from './PreguntasEncuesta';

// Configurar fuentes para pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

class PDFGeneratorService {
  constructor() {
    this.logoBase64 = null;
    this.initializeDefaults();
  }

  /**
   * Inicializa configuraciones por defecto
   */
  initializeDefaults() {
    // Configuración de estilos para pdfMake
    this.defaultStyles = {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20],
        color: '#2c3e50'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10],
        color: '#34495e'
      },
      categoryHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 15, 0, 8],
        color: '#3498db',
        background: '#ecf0f1'
      },
      question: {
        fontSize: 10,
        bold: true,
        margin: [0, 8, 0, 4],
        color: '#2c3e50'
      },
      answer: {
        fontSize: 10,
        margin: [20, 0, 0, 8],
        color: '#34495e'
      },
      footer: {
        fontSize: 8,
        alignment: 'center',
        margin: [0, 20, 0, 0],
        color: '#7f8c8d'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: '#3498db',
        color: 'white',
        alignment: 'center'
      },
      tableCell: {
        fontSize: 9,
        margin: [2, 2, 2, 2]
      }
    };
  }

  /**
   * Genera PDF completo de la encuesta
   */
  async generateEncuestaPDF(encuestaData, trabajadorData, respuestas) {
    try {
      const docDefinition = await this.createDocumentDefinition(
        encuestaData, 
        trabajadorData, 
        respuestas
      );

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      return new Promise((resolve, reject) => {
        pdfDoc.getBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error generando PDF'));
          }
        });
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  /**
   * Crea la definición del documento PDF
   */
  async createDocumentDefinition(encuestaData, trabajadorData, respuestas) {
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      pageSize: 'A4',
      pageMargins: [40, 80, 40, 60],
      
      header: (currentPage, pageCount) => {
        return {
          columns: [
            {
              image: this.logoBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              width: 60,
              height: 40,
              margin: [40, 20, 0, 0]
            },
            {
              text: [
                { text: 'ENCUESTA DE CONDICIONES DE SALUD OCUPACIONAL\n', style: 'header', fontSize: 14 },
                { text: `Página ${currentPage} de ${pageCount}`, style: 'footer', fontSize: 8 }
              ],
              alignment: 'right',
              margin: [0, 25, 40, 0]
            }
          ]
        };
      },

      footer: (currentPage, pageCount) => {
        return {
          columns: [
            {
              text: `Generado el: ${fechaActual}`,
              style: 'footer',
              alignment: 'left',
              margin: [40, 0, 0, 0]
            },
            {
              text: 'Sistema de Encuestas de Salud Ocupacional v2.0',
              style: 'footer',
              alignment: 'right',
              margin: [0, 0, 40, 0]
            }
          ]
        };
      },

      content: [
        // Título principal
        {
          text: '📋 ENCUESTA DE CONDICIONES DE SALUD OCUPACIONAL',
          style: 'header',
          margin: [0, 0, 0, 30]
        },

        // Información del trabajador
        await this.createWorkerInfoSection(trabajadorData),

        // Información de la encuesta
        await this.createSurveyInfoSection(encuestaData),

        // Respuestas por categoría
        ...await this.createAnswersSections(respuestas),

        // Resumen estadístico
        await this.createStatisticsSection(respuestas),

        // Firmas y validaciones
        await this.createSignatureSection(),

        // Información legal
        await this.createLegalSection()
      ],

      styles: this.defaultStyles
    };
  }

  /**
   * Crea la sección de información del trabajador
   */
  async createWorkerInfoSection(trabajadorData) {
    return {
      text: 'INFORMACIÓN DEL TRABAJADOR',
      style: 'subheader',
      pageBreak: 'before',
      margin: [0, 0, 0, 15],
      content: [
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Nombre Completo', style: 'tableHeader' },
                { text: 'Cédula', style: 'tableHeader' },
                { text: 'Cargo', style: 'tableHeader' },
                { text: 'Área', style: 'tableHeader' }
              ],
              [
                { text: trabajadorData.nombre || 'N/A', style: 'tableCell' },
                { text: trabajadorData.cedula || 'N/A', style: 'tableCell' },
                { text: trabajadorData.cargo || 'N/A', style: 'tableCell' },
                { text: trabajadorData.area || 'N/A', style: 'tableCell' }
              ]
            ]
          },
          layout: {
            fillColor: (rowIndex) => rowIndex === 0 ? '#3498db' : null,
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#bdc3c7',
            vLineColor: () => '#bdc3c7'
          }
        }
      ]
    };
  }

  /**
   * Crea la sección de información de la encuesta
   */
  async createSurveyInfoSection(encuestaData) {
    const fechaCompletado = new Date(encuestaData.fechaCompletado).toLocaleDateString('es-CO');
    
    return {
      text: 'INFORMACIÓN DE LA ENCUESTA',
      style: 'subheader',
      margin: [0, 20, 0, 15],
      content: [
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'ID Encuesta', style: 'tableHeader' },
                { text: 'Fecha Completado', style: 'tableHeader' },
                { text: 'Versión', style: 'tableHeader' },
                { text: 'Estado', style: 'tableHeader' }
              ],
              [
                { text: encuestaData.encuestaId || 'N/A', style: 'tableCell' },
                { text: fechaCompletado, style: 'tableCell' },
                { text: encuestaData.version || '2.0', style: 'tableCell' },
                { text: 'Completada', style: 'tableCell', color: '#27ae60' }
              ]
            ]
          },
          layout: {
            fillColor: (rowIndex) => rowIndex === 0 ? '#3498db' : null,
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#bdc3c7',
            vLineColor: () => '#bdc3c7'
          }
        }
      ]
    };
  }

  /**
   * Crea las secciones de respuestas por categoría
   */
  async createAnswersSections(respuestas) {
    const sections = [];
    const categorias = Object.values(CATEGORIAS_ENCUESTA);

    for (const categoria of categorias) {
      const preguntasCategoria = PREGUNTAS_ENCUESTA.filter(p => p.categoria === categoria);
      const respuestasCategoria = preguntasCategoria.map(pregunta => ({
        pregunta,
        respuesta: respuestas[pregunta.id] || 'No respondida'
      }));

      sections.push({
        text: TITULOS_CATEGORIAS[categoria] || categoria.toUpperCase(),
        style: 'categoryHeader',
        margin: [0, 20, 0, 10],
        pageBreak: categoria === CATEGORIAS_ENCUESTA.DATOS_PERSONALES ? 'before' : undefined
      });

      // Crear tabla de preguntas y respuestas
      const tableBody = [
        [
          { text: 'Pregunta', style: 'tableHeader', width: '60%' },
          { text: 'Respuesta', style: 'tableHeader', width: '40%' }
        ]
      ];

      respuestasCategoria.forEach(({ pregunta, respuesta }) => {
        tableBody.push([
          { 
            text: `${pregunta.id}. ${pregunta.pregunta}`, 
            style: 'tableCell',
            margin: [5, 5, 5, 5]
          },
          { 
            text: this.formatAnswer(respuesta, pregunta.tipo), 
            style: 'tableCell',
            margin: [5, 5, 5, 5]
          }
        ]);
      });

      sections.push({
        table: {
          widths: ['60%', '40%'],
          body: tableBody
        },
        layout: {
          fillColor: (rowIndex) => rowIndex === 0 ? '#3498db' : (rowIndex % 2 === 0 ? '#f8f9fa' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#dee2e6',
          vLineColor: () => '#dee2e6'
        },
        margin: [0, 0, 0, 15]
      });
    }

    return sections;
  }

  /**
   * Formatea la respuesta según el tipo de pregunta
   */
  formatAnswer(respuesta, tipoPregunta) {
    if (!respuesta || respuesta === 'No respondida') {
      return { text: 'No respondida', color: '#e74c3c', italics: true };
    }

    switch (tipoPregunta) {
      case 'radio':
        return { text: respuesta, color: '#27ae60', bold: true };
      case 'select':
        return { text: respuesta, color: '#2980b9' };
      case 'date':
        try {
          const fecha = new Date(respuesta);
          return { text: fecha.toLocaleDateString('es-CO'), color: '#8e44ad' };
        } catch {
          return respuesta;
        }
      case 'textarea':
        return { text: respuesta.substring(0, 200) + (respuesta.length > 200 ? '...' : ''), fontSize: 9 };
      default:
        return respuesta;
    }
  }

  /**
   * Crea la sección de estadísticas
   */
  async createStatisticsSection(respuestas) {
    const totalPreguntas = PREGUNTAS_ENCUESTA.length;
    const preguntasRespondidas = Object.keys(respuestas).length;
    const porcentajeCompletado = Math.round((preguntasRespondidas / totalPreguntas) * 100);

    // Estadísticas por categoría
    const estadisticasPorCategoria = Object.values(CATEGORIAS_ENCUESTA).map(categoria => {
      const preguntasCategoria = PREGUNTAS_ENCUESTA.filter(p => p.categoria === categoria);
      const respuestasCategoria = preguntasCategoria.filter(p => respuestas[p.id]);
      
      return {
        categoria: TITULOS_CATEGORIAS[categoria] || categoria,
        total: preguntasCategoria.length,
        respondidas: respuestasCategoria.length,
        porcentaje: Math.round((respuestasCategoria.length / preguntasCategoria.length) * 100)
      };
    });

    return [
      {
        text: 'RESUMEN ESTADÍSTICO',
        style: 'subheader',
        margin: [0, 30, 0, 15]
      },
      {
        columns: [
          {
            width: '50%',
            content: [
              {
                text: 'Estadísticas Generales',
                style: 'categoryHeader',
                margin: [0, 0, 0, 10]
              },
              {
                table: {
                  widths: ['70%', '30%'],
                  body: [
                    ['Total de preguntas', totalPreguntas.toString()],
                    ['Preguntas respondidas', preguntasRespondidas.toString()],
                    ['Porcentaje completado', `${porcentajeCompletado}%`],
                    ['Estado', porcentajeCompletado === 100 ? 'Completa' : 'Incompleta']
                  ]
                },
                layout: 'lightHorizontalLines'
              }
            ]
          },
          {
            width: '50%',
            content: [
              {
                text: 'Completado por Categoría',
                style: 'categoryHeader',
                margin: [0, 0, 0, 10]
              },
              {
                table: {
                  widths: ['60%', '20%', '20%'],
                  body: [
                    [
                      { text: 'Categoría', style: 'tableHeader' },
                      { text: 'Resp.', style: 'tableHeader' },
                      { text: '%', style: 'tableHeader' }
                    ],
                    ...estadisticasPorCategoria.map(stat => [
                      { text: stat.categoria, fontSize: 8 },
                      { text: `${stat.respondidas}/${stat.total}`, fontSize: 8, alignment: 'center' },
                      { text: `${stat.porcentaje}%`, fontSize: 8, alignment: 'center', 
                        color: stat.porcentaje === 100 ? '#27ae60' : '#e74c3c' }
                    ])
                  ]
                },
                layout: {
                  fillColor: (rowIndex) => rowIndex === 0 ? '#3498db' : null,
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Crea la sección de firmas
   */
  async createSignatureSection() {
    return {
      text: 'VALIDACIONES Y FIRMAS',
      style: 'subheader',
      margin: [0, 30, 0, 15],
      pageBreak: 'before',
      content: [
        {
          columns: [
            {
              width: '50%',
              content: [
                { text: 'TRABAJADOR', style: 'categoryHeader', alignment: 'center' },
                { text: '\n\n\n', fontSize: 12 },
                { text: '_'.repeat(30), alignment: 'center' },
                { text: 'Firma del Trabajador', fontSize: 10, alignment: 'center', margin: [0, 5, 0, 0] },
                { text: 'Fecha: _______________', fontSize: 10, alignment: 'center', margin: [0, 10, 0, 0] }
              ]
            },
            {
              width: '50%',
              content: [
                { text: 'MÉDICO OCUPACIONAL', style: 'categoryHeader', alignment: 'center' },
                { text: '\n\n\n', fontSize: 12 },
                { text: '_'.repeat(30), alignment: 'center' },
                { text: 'Firma del Médico', fontSize: 10, alignment: 'center', margin: [0, 5, 0, 0] },
                { text: 'Fecha: _______________', fontSize: 10, alignment: 'center', margin: [0, 10, 0, 0] }
              ]
            }
          ]
        },
        {
          text: '\nOBSERVACIONES MÉDICAS:',
          style: 'categoryHeader',
          margin: [0, 30, 0, 10]
        },
        {
          table: {
            widths: ['100%'],
            body: [
              [{ text: '\n\n\n\n\n', border: [true, true, true, true] }]
            ]
          }
        }
      ]
    };
  }

  /**
   * Crea la sección legal
   */
  async createLegalSection() {
    return {
      text: 'INFORMACIÓN LEGAL Y CONFIDENCIALIDAD',
      style: 'subheader',
      margin: [0, 30, 0, 15],
      content: [
        {
          text: [
            { text: 'Protección de Datos Personales: ', bold: true },
            'La información contenida en este documento está protegida bajo la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. '
          ],
          fontSize: 9,
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            { text: 'Confidencialidad Médica: ', bold: true },
            'Este documento contiene información médica confidencial y está sujeto al secreto profesional médico según la Ley 23 de 1981. '
          ],
          fontSize: 9,
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            { text: 'Uso de la Información: ', bold: true },
            'Los datos recopilados serán utilizados exclusivamente para fines de salud ocupacional y prevención de riesgos laborales. '
          ],
          fontSize: 9,
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            { text: 'Validez del Documento: ', bold: true },
            'Este documento ha sido generado automáticamente por el Sistema de Encuestas de Salud Ocupacional v2.0 y tiene validez legal para efectos de seguimiento médico ocupacional.'
          ],
          fontSize: 9,
          margin: [0, 0, 0, 10]
        }
      ]
    };
  }

  /**
   * Genera PDF desde HTML (método alternativo)
   */
  async generatePDFFromHTML(htmlElement, filename = 'encuesta-salud.pdf') {
    try {
      const canvas = await html2canvas(htmlElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generando PDF desde HTML:', error);
      throw error;
    }
  }

  /**
   * Descarga el PDF generado
   */
  downloadPDF(blob, filename = 'encuesta-salud-ocupacional.pdf') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Envía PDF por email (simulado)
   */
  async sendPDFByEmail(blob, email, trabajadorData) {
    // En producción, esto se integraría con un servicio de email
    console.log('Enviando PDF por email a:', email);
    
    // Simular envío
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `PDF enviado exitosamente a ${email}`,
          timestamp: new Date().toISOString()
        });
      }, 2000);
    });
  }

  /**
   * Guarda PDF en el servidor (simulado)
   */
  async savePDFToServer(blob, trabajadorData) {
    // En producción, esto subiría el archivo a Firebase Storage o similar
    const filename = `encuesta_${trabajadorData.cedula}_${Date.now()}.pdf`;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          filename,
          url: `https://storage.example.com/encuestas/${filename}`,
          size: blob.size
        });
      }, 1500);
    });
  }

  /**
   * Establece el logo de la empresa
   */
  setLogo(logoBase64) {
    this.logoBase64 = logoBase64;
  }

  /**
   * Obtiene estadísticas del PDF generado
   */
  getPDFStats(blob) {
    return {
      size: blob.size,
      sizeFormatted: this.formatFileSize(blob.size),
      type: blob.type,
      pages: 'Múltiples', // Se calcularía dinámicamente
      generated: new Date().toISOString()
    };
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Instancia singleton
const pdfGeneratorService = new PDFGeneratorService();

export default pdfGeneratorService;

// Hook de React para usar el servicio
export const usePDFGenerator = () => {
  const [generating, setGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const generatePDF = async (encuestaData, trabajadorData, respuestas) => {
    setGenerating(true);
    setProgress(0);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const blob = await pdfGeneratorService.generateEncuestaPDF(
        encuestaData,
        trabajadorData,
        respuestas
      );

      clearInterval(progressInterval);
      setProgress(100);

      return blob;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
      }, 1000);
    }
  };

  return {
    generatePDF,
    generating,
    progress,
    downloadPDF: pdfGeneratorService.downloadPDF.bind(pdfGeneratorService),
    sendPDFByEmail: pdfGeneratorService.sendPDFByEmail.bind(pdfGeneratorService)
  };
};
