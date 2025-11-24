import React, { useState, useEffect, useRef } from 'react';
import pdfGeneratorService, { usePDFGenerator } from './PDFGeneratorService';
import { PREGUNTAS_ENCUESTA, CATEGORIAS_ENCUESTA, TITULOS_CATEGORIAS } from './PreguntasEncuesta';

const PDFPreview = ({ encuestaData, trabajadorData, respuestas, onClose }) => {
  const [previewMode, setPreviewMode] = useState('preview'); // preview, generating, completed
  const [pdfBlob, setPdfBlob] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const previewRef = useRef(null);
  
  const { generatePDF, generating, progress, downloadPDF, sendPDFByEmail } = usePDFGenerator();

  // Generar PDF automáticamente al cargar
  useEffect(() => {
    handleGeneratePDF();
  }, []);

  const handleGeneratePDF = async () => {
    try {
      setPreviewMode('generating');
      const blob = await generatePDF(encuestaData, trabajadorData, respuestas);
      setPdfBlob(blob);
      setPreviewMode('completed');
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intente nuevamente.');
      setPreviewMode('preview');
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      const filename = `encuesta_salud_${trabajadorData.cedula}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(pdfBlob, filename);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) {
      alert('Por favor ingrese una dirección de email válida');
      return;
    }

    if (!pdfBlob) {
      alert('Primero debe generar el PDF');
      return;
    }

    setSendingEmail(true);
    try {
      const result = await sendPDFByEmail(pdfBlob, emailAddress, trabajadorData);
      alert(`✅ ${result.message}`);
      setEmailAddress('');
    } catch (error) {
      console.error('Error enviando email:', error);
      alert('Error al enviar el email. Intente nuevamente.');
    } finally {
      setSendingEmail(false);
    }
  };

  const renderPreviewContent = () => {
    const categorias = Object.values(CATEGORIAS_ENCUESTA);
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div className="pdf-preview-content" ref={previewRef}>
        {/* Header */}
        <div className="text-center mb-4 p-4 border-bottom">
          <h2 className="text-primary mb-2">📋 ENCUESTA DE CONDICIONES DE SALUD OCUPACIONAL</h2>
          <p className="text-muted mb-0">Sistema de Salud Ocupacional v2.0</p>
          <small className="text-muted">Generado el: {fechaActual}</small>
        </div>

        {/* Información del Trabajador */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">👤 INFORMACIÓN DEL TRABAJADOR</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Nombre Completo:</strong></td>
                      <td>{trabajadorData.nombre}</td>
                    </tr>
                    <tr>
                      <td><strong>Cédula:</strong></td>
                      <td>{trabajadorData.cedula}</td>
                    </tr>
                    <tr>
                      <td><strong>Cargo:</strong></td>
                      <td>{trabajadorData.cargo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Área:</strong></td>
                      <td>{trabajadorData.area}</td>
                    </tr>
                    <tr>
                      <td><strong>Fecha Completado:</strong></td>
                      <td>{new Date(encuestaData.fechaCompletado).toLocaleDateString('es-CO')}</td>
                    </tr>
                    <tr>
                      <td><strong>ID Encuesta:</strong></td>
                      <td>{encuestaData.encuestaId}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Respuestas por Categoría */}
        {categorias.map((categoria, index) => {
          const preguntasCategoria = PREGUNTAS_ENCUESTA.filter(p => p.categoria === categoria);
          const respuestasCategoria = preguntasCategoria.filter(p => respuestas[p.id]);

          return (
            <div key={categoria} className="card mb-4">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">
                  📑 {TITULOS_CATEGORIAS[categoria] || categoria.toUpperCase()}
                  <span className="badge bg-light text-dark ms-2">
                    {respuestasCategoria.length}/{preguntasCategoria.length} respondidas
                  </span>
                </h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th width="5%">#</th>
                        <th width="55%">Pregunta</th>
                        <th width="40%">Respuesta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preguntasCategoria.map(pregunta => (
                        <tr key={pregunta.id}>
                          <td>{pregunta.id}</td>
                          <td>
                            <small>{pregunta.pregunta}</small>
                            {pregunta.requerida && <span className="text-danger ms-1">*</span>}
                          </td>
                          <td>
                            {respuestas[pregunta.id] ? (
                              <span className="text-success">
                                <small>{this.formatRespuesta(respuestas[pregunta.id], pregunta.tipo)}</small>
                              </span>
                            ) : (
                              <span className="text-muted">
                                <small><em>No respondida</em></small>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {/* Estadísticas */}
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h6 className="mb-0">📊 RESUMEN ESTADÍSTICO</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Estadísticas Generales</h6>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td>Total de preguntas:</td>
                      <td><strong>{PREGUNTAS_ENCUESTA.length}</strong></td>
                    </tr>
                    <tr>
                      <td>Preguntas respondidas:</td>
                      <td><strong>{Object.keys(respuestas).length}</strong></td>
                    </tr>
                    <tr>
                      <td>Porcentaje completado:</td>
                      <td>
                        <strong className="text-success">
                          {Math.round((Object.keys(respuestas).length / PREGUNTAS_ENCUESTA.length) * 100)}%
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6>Completado por Categoría</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th>Completado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map(categoria => {
                        const preguntasCategoria = PREGUNTAS_ENCUESTA.filter(p => p.categoria === categoria);
                        const respuestasCategoria = preguntasCategoria.filter(p => respuestas[p.id]);
                        const porcentaje = Math.round((respuestasCategoria.length / preguntasCategoria.length) * 100);
                        
                        return (
                          <tr key={categoria}>
                            <td><small>{TITULOS_CATEGORIAS[categoria]}</small></td>
                            <td>
                              <small className={porcentaje === 100 ? 'text-success' : 'text-warning'}>
                                {respuestasCategoria.length}/{preguntasCategoria.length} ({porcentaje}%)
                              </small>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Firmas */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0">✍️ VALIDACIONES Y FIRMAS</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 text-center">
                <h6>TRABAJADOR</h6>
                <div style={{ height: '80px', border: '1px dashed #ccc', margin: '20px 0' }}>
                  <small className="text-muted">Espacio para firma</small>
                </div>
                <div>
                  <small>_________________________</small><br/>
                  <small>Firma del Trabajador</small><br/>
                  <small>Fecha: _______________</small>
                </div>
              </div>
              <div className="col-md-6 text-center">
                <h6>MÉDICO OCUPACIONAL</h6>
                <div style={{ height: '80px', border: '1px dashed #ccc', margin: '20px 0' }}>
                  <small className="text-muted">Espacio para firma</small>
                </div>
                <div>
                  <small>_________________________</small><br/>
                  <small>Firma del Médico</small><br/>
                  <small>Fecha: _______________</small>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h6>OBSERVACIONES MÉDICAS:</h6>
              <div style={{ height: '100px', border: '1px solid #ccc', padding: '10px' }}>
                <small className="text-muted">Espacio para observaciones del médico ocupacional</small>
              </div>
            </div>
          </div>
        </div>

        {/* Información Legal */}
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h6 className="mb-0">⚖️ INFORMACIÓN LEGAL Y CONFIDENCIALIDAD</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12">
                <small>
                  <p><strong>Protección de Datos Personales:</strong> La información contenida en este documento está protegida bajo la Ley 1581 de 2012 de Protección de Datos Personales de Colombia.</p>
                  <p><strong>Confidencialidad Médica:</strong> Este documento contiene información médica confidencial y está sujeto al secreto profesional médico según la Ley 23 de 1981.</p>
                  <p><strong>Uso de la Información:</strong> Los datos recopilados serán utilizados exclusivamente para fines de salud ocupacional y prevención de riesgos laborales.</p>
                  <p><strong>Validez del Documento:</strong> Este documento ha sido generado automáticamente por el Sistema de Encuestas de Salud Ocupacional v2.0 y tiene validez legal para efectos de seguimiento médico ocupacional.</p>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Método para formatear respuestas
  const formatRespuesta = (respuesta, tipo) => {
    if (!respuesta) return 'No respondida';
    
    switch (tipo) {
      case 'date':
        try {
          return new Date(respuesta).toLocaleDateString('es-CO');
        } catch {
          return respuesta;
        }
      case 'textarea':
        return respuesta.length > 100 ? respuesta.substring(0, 100) + '...' : respuesta;
      default:
        return respuesta;
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              📄 Vista Previa del PDF - Encuesta de Salud Ocupacional
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {previewMode === 'generating' && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Generando PDF...</span>
                </div>
                <h5>Generando PDF...</h5>
                <div className="progress mx-auto" style={{ width: '300px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
                <p className="text-muted mt-2">Esto puede tomar unos momentos...</p>
              </div>
            )}

            {previewMode === 'preview' && renderPreviewContent()}

            {previewMode === 'completed' && (
              <div>
                <div className="alert alert-success text-center mb-4">
                  <h5>✅ PDF Generado Exitosamente</h5>
                  <p className="mb-0">Su reporte de encuesta está listo para descargar o enviar por email.</p>
                </div>
                {renderPreviewContent()}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="d-flex justify-content-between w-100">
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                >
                  🚪 Cerrar
                </button>
                
                {previewMode === 'completed' && (
                  <button 
                    type="button" 
                    className="btn btn-outline-primary" 
                    onClick={handleGeneratePDF}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Regenerando...
                      </>
                    ) : (
                      '🔄 Regenerar PDF'
                    )}
                  </button>
                )}
              </div>

              <div className="d-flex gap-2">
                {/* Campo de email */}
                {previewMode === 'completed' && (
                  <div className="input-group" style={{ width: '250px' }}>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="email@ejemplo.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={handleSendEmail}
                      disabled={sendingEmail || !emailAddress.trim()}
                    >
                      {sendingEmail ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Enviando...
                        </>
                      ) : (
                        '📧 Enviar'
                      )}
                    </button>
                  </div>
                )}

                {previewMode === 'completed' && (
                  <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={handleDownload}
                  >
                    📥 Descargar PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
