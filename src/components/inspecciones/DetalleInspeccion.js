import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Card, Row, Col, ListGroup } from 'react-bootstrap';
import { Download, X, Calendar, Clock, History } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ITEMS_PLANTILLA } from './data/inspectionSeeds';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const DetalleInspeccion = ({ show, handleClose, inspeccion }) => {
    const { user } = useAuth();
    const reportRef = useRef();
    const [historyList, setHistoryList] = useState([]);
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Initial load
    useEffect(() => {
        if (inspeccion) {
            setSelectedInspection(inspeccion);
            fetchAssetHistory(inspeccion);
        }
    }, [inspeccion]);

    const fetchAssetHistory = async (baseInspection) => {
        if (!baseInspection?.activo?.id) return;

        setLoadingHistory(true);
        try {
            const ref = collection(db, 'inspecciones_sst');
            // Query by active ID only (Client-side sort to avoid Index requirements)
            const q = query(
                ref,
                where('activo.id', '==', baseInspection.activo.id),
                where('clienteId', '==', user.uid) // Requerido por reglas de seguridad
            );

            const snapshot = await getDocs(q);
            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fechaInspeccion?.toDate()
            }))
                .sort((a, b) => (b.fecha || 0) - (a.fecha || 0)); // Descending Sort

            setHistoryList(history);
        } catch (error) {
            console.error("Error loading asset history:", error);
        }
        setLoadingHistory(false);
    };

    if (!selectedInspection) return null;

    // Destructure from currently selected inspection (not the prop)
    const { activo, resultados, fecha, inspectorEmail, categoria, estadoGeneral, id } = selectedInspection;

    // Helper para buscar texto de pregunta
    const getQuestionText = (key) => {
        const found = ITEMS_PLANTILLA.find(i => i.id === key);
        return found ? found.pregunta : key;
    };

    // Helper para obtener el identificador del inspector (Nombre o Rol)
    // Separado para facilitar futura integración con sistema de permisos granular
    const getInspectorIdentifier = (inspection) => {
        // 1. Si existe un nombre explícito (Futura implementación de usuarios)
        if (inspection.inspectorNombre) {
            return inspection.inspectorNombre;
        }

        // 2. Fallback: Perfil Principal
        return "Administrador";
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
            pdf.save(`Inspeccion_${categoria}_${activo.codigo || activo.id}_${fecha ? fecha.toISOString().split('T')[0] : 'fecha'}.pdf`);
        } catch (error) {
            console.error("Error generando PDF", error);
            alert("Hubo un error al generar el PDF");
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title><History size={20} className="me-2" />Kardex del Equipo</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-light p-0">
                <Row className="g-0 h-100">
                    {/* LEFT SIDEBAR: History List */}
                    <Col md={3} className="border-end bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="p-3 bg-light border-bottom">
                            <h6 className="mb-0 fw-bold">Historial de Inspecciones</h6>
                            <small className="text-muted">{historyList.length} registros encontrados</small>
                        </div>
                        {loadingHistory ? (
                            <div className="text-center p-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                        ) : (
                            <ListGroup variant="flush">
                                {historyList.map((item) => (
                                    <ListGroup.Item
                                        key={item.id}
                                        action
                                        active={item.id === id}
                                        onClick={() => setSelectedInspection(item)}
                                        className="border-bottom"
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Badge bg={item.estadoGeneral === 'Conforme' || item.estadoGeneral === 'Apto' ? 'success' : 'danger'} pill>
                                                {item.estadoGeneral}
                                            </Badge>
                                            <small className="opacity-75" style={{ fontSize: '0.7rem' }}>
                                                {item.fecha && item.fecha.toLocaleDateString()}
                                            </small>
                                        </div>
                                        <div className="small fw-bold text-truncate">
                                            {item.inspectorEmail}
                                        </div>
                                        {item.id === id && <small className="text-primary fw-bold">➡ Visualizando</small>}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Col>

                    {/* RIGHT CONTENT: Report View */}
                    <Col md={9} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <div ref={reportRef} className="p-5 bg-white shadow-sm m-4">
                            {/* Encabezado del Reporte */}
                            <div className="d-flex justify-content-between border-bottom pb-3 mb-3">
                                <div>
                                    <h4>Reporte de Inspección SST</h4>
                                    <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>
                                        ID de Inspección: <span className="text-dark">{getInspectorIdentifier(selectedInspection)}</span>
                                    </small>
                                </div>
                                <div className="text-end">
                                    <Badge bg={estadoGeneral === 'Conforme' || estadoGeneral === 'Apto' ? 'success' : 'danger'} style={{ fontSize: '1rem' }}>
                                        {estadoGeneral}
                                    </Badge>
                                    <div className="mt-1 text-muted small">{fecha ? formatDate(fecha) : ''}</div>
                                </div>
                            </div>

                            {/* Información del Activo */}
                            <Card className="mb-4 text-start">
                                <Card.Header className="fw-bold bg-light">Información del Equipo</Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col xs={8}>
                                            <p className="mb-1"><strong>Nombre/Tipo:</strong> {activo?.nombre}</p>
                                            <p className="mb-1"><strong>Código ID:</strong> {activo?.codigo_interno || activo?.codigo || 'S/C'}</p>
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
                                        const foto = isObject ? value.foto : null;

                                        return (
                                            <tr key={key}>
                                                <td>
                                                    <div className="fw-medium">{questionText}</div>
                                                    {observacion && (
                                                        <div className="mt-1 p-2 bg-warning bg-opacity-10 border border-warning rounded small text-dark">
                                                            <strong>Obs:</strong> {observacion}
                                                        </div>
                                                    )}
                                                    {foto && (
                                                        <div className="mt-1">
                                                            <a href={foto} target="_blank" rel="noopener noreferrer" className="badge bg-info text-decoration-none">Ver Evidencia 📷</a>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-center align-middle">
                                                    {(estado === 'Bueno' || estado === 'SI' || estado === 'CUMPLE') && <Badge bg="success">CUMPLE</Badge>}
                                                    {(estado === 'Malo' || estado === 'NO' || estado === 'NO CUMPLE') && <Badge bg="danger">NO CUMPLE</Badge>}
                                                    {(estado === 'N/A' || estado === 'NA') && <Badge bg="secondary">N/A</Badge>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>

                            {/* Observaciones Generales */}
                            {resultados?.observaciones && (
                                <div className="mt-4 p-3 bg-light border rounded text-start">
                                    <strong>Observaciones / Hallazgos Generales:</strong>
                                    <p className="mb-0 mt-1 fst-italic">{resultados.observaciones}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-5 border-top pt-3 d-flex justify-content-between align-items-end">
                                <div className="text-center">
                                    <div style={{ height: '40px' }} className="border-bottom mb-1">
                                        {/* Aquí podría ir la firma digital si se guardara como imagen */}
                                    </div>
                                    <small>Firma Inspector</small>
                                    <br />
                                    <small className="fw-bold">{inspectorEmail}</small>
                                </div>
                                <div className="text-muted small">
                                    Generado por App Gestión SST
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                <Button variant="danger" onClick={downloadPDF}>
                    <Download size={18} className="me-2" />
                    Descargar PDF de esta Inspección
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DetalleInspeccion;
