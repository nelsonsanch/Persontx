import React from 'react';
import { Modal, Button, Row, Col, Badge, Card, Alert } from 'react-bootstrap';
import { PREOP_CHECKLIST, HEAVY_MACHINERY_CHECKLIST } from './inspeccionesConfig';
import { CheckCircle, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';

const DetalleInspeccionModal = ({ show, onHide, inspection }) => {
    if (!inspection) return null;

    const { checklist, maintenance_status_snapshot, resultado_global, score, observations, item_details, tipo_activo } = inspection;

    // Determine active checklist
    const activeChecklist = tipo_activo === 'maquinaria' ? HEAVY_MACHINERY_CHECKLIST : PREOP_CHECKLIST;
    const usageLabel = tipo_activo === 'maquinaria' ? 'Horas Motor' : 'Kilometraje';
    const usageUnit = tipo_activo === 'maquinaria' ? ' Horas' : ' km';

    // Helper to get status color and icon
    const getStatusInfo = (status) => {
        switch (status) {
            case 'BUENO': return { bg: 'success', icon: <CheckCircle size={16} /> };
            case 'REGULAR': return { bg: 'warning', icon: <AlertTriangle size={16} />, text: 'text-dark' };
            case 'MALO': return { bg: 'danger', icon: <XCircle size={16} /> };
            case 'NA': return { bg: 'secondary', icon: <MinusCircle size={16} /> };
            case 'OK': return { bg: 'success', icon: <CheckCircle size={16} /> };
            case 'FALLO': return { bg: 'danger', icon: <XCircle size={16} /> };
            default: return { bg: 'light', icon: null, text: 'text-dark' };
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className={resultado_global === 'RECHAZADO' ? 'bg-danger-subtle' : 'bg-success-subtle'}>
                <Modal.Title>
                    <span className="fw-bold">Detalle de Inspección</span>
                    <Badge bg={resultado_global === 'APROBADO' ? 'success' : 'danger'} className="ms-3">
                        {resultado_global}
                    </Badge>
                    <Badge bg="info" className="ms-2">Score: {score}%</Badge>
                    <Badge bg="secondary" className="ms-2 small">{tipo_activo === 'maquinaria' ? 'Maquinaria' : 'Vehículo'}</Badge>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {/* Header Info */}
                <Row className="mb-4">
                    <Col md={4}>
                        <strong>Equipo:</strong> {inspection.vehiculo_placa} <br />
                        <small className="text-muted">{inspection.vehiculo_marca}</small>
                    </Col>
                    <Col md={4}>
                        <strong>Fecha:</strong> {new Date(inspection.fecha_registro).toLocaleString()} <br />
                        <strong>Inspector:</strong> {inspection.operador_nombre || inspection.usuario_email} <br />
                        {inspection.operador_cedula && <small className="text-muted">ID: {inspection.operador_cedula}</small>}
                    </Col>
                    <Col md={4}>
                        <strong>{usageLabel}:</strong> {inspection.lectura_uso?.toLocaleString() || inspection.kilometraje_lectura?.toLocaleString()}{usageUnit}
                    </Col>
                </Row>

                {/* Condiciones del Operador (NUEVO) */}
                {(inspection.estado_salud || inspection.horas_sueno) && (
                    <Alert variant={inspection.horas_sueno <= 6 ? 'danger' : 'light'} className="mb-4 border">
                        <h6 className="fw-bold border-bottom pb-2">⚕️ Reporte de Operador</h6>
                        <Row>
                            <Col xs={6} md={3}>
                                <strong>Salud:</strong> {inspection.estado_salud}
                            </Col>
                            <Col xs={6} md={3}>
                                <strong>Sueño:</strong> {inspection.horas_sueno} horas
                            </Col>
                            <Col xs={12} md={6}>
                                <strong>Medicamentos:</strong> {inspection.toma_medicamentos === 'Si' ? `SÍ (${inspection.nombre_medicamento})` : 'NO'}
                            </Col>
                        </Row>
                        {inspection.horas_sueno <= 6 && (
                            <div className="mt-2 fw-bold text-danger">⚠️ ALERTA: Fatiga reportada (≤ 6 horas).</div>
                        )}
                    </Alert>
                )}

                {/* Observaciones */}
                {inspection.observaciones && (
                    <Alert variant="info" className="mb-4">
                        <strong>Observaciones:</strong> {inspection.observaciones}
                    </Alert>
                )}

                {/* Mantenimiento Automático Snapshot */}
                {maintenance_status_snapshot && (
                    <div className="mb-4">
                        <h6 className="border-bottom pb-2 mb-3 text-secondary">Estado Documental y Mantenimiento (Snapshot)</h6>
                        <Row className="g-3">
                            {Object.entries(maintenance_status_snapshot).map(([key, value]) => (
                                <Col xs={12} md={4} key={key}>
                                    <div className={`p-2 border rounded d-flex align-items-center justify-content-between ${value.val === 'FALLO' ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success'}`}>
                                        <span className="fw-bold text-uppercase small">{key.replace('doc_', '').replace('nivel_', '')}</span>
                                        <div className="text-end">
                                            <div className="fw-bold">{value.val}</div>
                                            <small style={{ fontSize: '0.75rem' }}>{value.info}</small>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* Checklist Breakdown */}
                <h6 className="border-bottom pb-2 mb-3 text-secondary">Checklist Detallado ({tipo_activo === 'maquinaria' ? 'Maquinaria' : 'Vehículo'})</h6>
                <Row className="g-3">
                    {activeChecklist.map((cat, idx) => (
                        <Col xs={12} lg={6} key={idx}>
                            <Card className="h-100 shadow-sm">
                                <Card.Header className="py-2 bg-light fw-bold text-primary small">
                                    {cat.category}
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="list-group list-group-flush">
                                        {cat.items.map(item => {
                                            const response = checklist[item.id] || 'NA';
                                            const info = getStatusInfo(response);
                                            const isCriticalFail = item.critical && response === 'MALO';

                                            return (
                                                <div key={item.id} className={`list-group-item d-flex justify-content-between align-items-center ${isCriticalFail ? 'bg-danger-subtle' : ''}`}>
                                                    <div className="d-flex flex-column" style={{ width: '70%' }}>
                                                        <span className="small fw-medium">
                                                            {item.label}
                                                            {item.critical && <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.6em' }}>CRÍTICO</Badge>}
                                                        </span>
                                                    </div>
                                                    <Badge bg={info.bg} className={`d-flex align-items-center gap-1 ${info.text || ''}`}>
                                                        {info.icon} {response}
                                                    </Badge>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DetalleInspeccionModal;
