import React, { useRef } from 'react';
import { Modal, Button, Table, Badge, Card, Row, Col } from 'react-bootstrap';
import { Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ITEMS_PLANTILLA } from './data/inspectionSeeds';

const DetalleInspeccion = ({ show, handleClose, inspeccion }) => {
    const reportRef = useRef();

    if (!inspeccion) return null;

    const { activo, resultados, fecha, inspectorEmail, categoria, estadoGeneral, id } = inspeccion;

    // Helper para buscar texto de pregunta
    const getQuestionText = (key) => {
        // En legacy, la key es la pregunta misma
        // En nueva arquitectura (Alturas), la key es un ID (ej: item-tpl-arnes-01)
        const found = ITEMS_PLANTILLA.find(i => i.id === key);
        return found ? found.pregunta : key;
    };

    const downloadPDF = async () => {
        const input = reportRef.current;
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Inspeccion_${categoria}_${activo.codigo}_${id.slice(0, 5)}.pdf`);
        } catch (error) {
            console.error("Error generando PDF", error);
            alert("Hubo un error al generar el PDF");
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Detalle de Auditoría</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light">
                <div ref={reportRef} className="p-4 bg-white border shadow-sm">
                    {/* Encabezado del Reporte */}
                    <div className="d-flex justify-content-between border-bottom pb-3 mb-3">
                        <div>
                            <h4>Reporte de Inspección SST</h4>
                            <small className="text-muted">ID Auditoría: {id}</small>
                        </div>
                        <div className="text-end">
                            <Badge bg={estadoGeneral === 'Conforme' || estadoGeneral === 'Apto' ? 'success' : 'danger'} style={{ fontSize: '1rem' }}>
                                {estadoGeneral}
                            </Badge>
                            <div className="mt-1 text-muted small">{fecha ? fecha.toLocaleString() : ''}</div>
                        </div>
                    </div>

                    {/* Información del Activo */}
                    <Card className="mb-4 text-start">
                        <Card.Header className="fw-bold bg-light">Información del Equipo</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col xs={8}>
                                    <p className="mb-1"><strong>Nombre/Tipo:</strong> {activo?.nombre}</p>
                                    <p className="mb-1"><strong>Código ID:</strong> {activo?.codigo}</p>
                                    <p className="mb-1"><strong>Ubicación:</strong> {activo?.ubicacion}</p>
                                    <p className="mb-0"><strong>Categoría:</strong> {categoria}</p>
                                    {(activo?.familia || activo?.tipo) && (
                                        <div className="mt-2 text-muted small">
                                            {activo.familia && <span>Fam: {activo.familia} | </span>}
                                            {activo.tipo && <span>Tipo: {activo.tipo}</span>}
                                        </div>
                                    )}
                                </Col>
                                <Col xs={4} className="text-center">
                                    {activo?.foto ? (
                                        <img src={activo.foto} alt="Activo" style={{ maxHeight: '80px', borderRadius: '4px' }} />
                                    ) : (
                                        <div className="text-muted p-3 border rounded bg-light">Sin Foto</div>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Resultados del Checklist */}
                    <h5 className="mb-3 border-bottom pb-2">Resultados de Verificación</h5>
                    <Table striped bordered size="sm">
                        <thead className="table-dark">
                            <tr>
                                <th>Item Inspeccionado</th>
                                <th style={{ width: '120px' }} className="text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultados?.checklist && Object.entries(resultados.checklist).map(([key, value]) => {
                                const isObject = typeof value === 'object';
                                const estado = isObject ? value.valor : value;
                                const questionText = getQuestionText(key);
                                const observacion = isObject ? value.observacion : null;

                                return (
                                    <tr key={key}>
                                        <td>
                                            <div>{questionText}</div>
                                            {observacion && <small className="text-muted d-block mt-1">Obs: {observacion}</small>}
                                        </td>
                                        <td className="text-center align-middle">
                                            {(estado === 'Bueno' || estado === 'SI') && <Badge bg="success">CUMPLE</Badge>}
                                            {(estado === 'Malo' || estado === 'NO') && <Badge bg="danger">NO CUMPLE</Badge>}
                                            {(estado === 'N/A' || estado === 'NA') && <Badge bg="secondary">N/A</Badge>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {/* Observaciones */}
                    {resultados?.observaciones && (
                        <div className="mt-4 p-3 bg-light border rounded text-start">
                            <strong>Observaciones / Hallazgos:</strong>
                            <p className="mb-0 mt-1 fst-italic">{resultados.observaciones}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-5 border-top pt-3 d-flex justify-content-between align-items-end">
                        <div className="text-center">
                            <div style={{ height: '40px' }} className="border-bottom mb-1"></div>
                            <small>Firma Inspector</small>
                            <br />
                            <small className="fw-bold">{inspectorEmail}</small>
                        </div>
                        <div className="text-muted small">
                            Generado por App Gestión SST
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                <Button variant="danger" onClick={downloadPDF}>
                    <Download size={18} className="me-2" />
                    Descargar PDF
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DetalleInspeccion;
