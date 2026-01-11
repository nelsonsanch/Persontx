import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const FormularioCheck = ({ data, setData, onNext, onBack }) => {
    const { activoSeleccionado, configRef } = data;
    const [checklistItems, setChecklistItems] = useState([]);
    const [respuestas, setRespuestas] = useState(data.checklist || {});
    const [observacion, setObservacion] = useState(data.observaciones || '');

    // 1. Extraer items inspeccionables de la configuración
    useEffect(() => {
        if (!configRef) return;

        let items = [];

        // Buscar campos tipo 'checklist' o 'checklist_with_quantity' en la config
        configRef.campos.forEach(campo => {
            if ((campo.type === 'checklist' || campo.type === 'checklist_with_quantity') && campo.options) {
                // Agregar cada opción como un item a inspeccionar
                items = [...items, ...campo.options];
            }
        });

        // Si no hay checklist definido en config, usar genéricos
        if (items.length === 0) {
            items = ['Estado General', 'Limpieza', 'Señalización', 'Acceso Libre', 'Funcionamiento'];
        }

        setChecklistItems(items);
    }, [configRef]);

    // Manejar respuesta (Bueno / Malo / N/A)
    const handleCheck = (item, estado) => {
        setRespuestas(prev => ({
            ...prev,
            [item]: estado
        }));
    };

    const handleContinue = () => {
        // Guardar en estado global
        setData(prev => ({
            ...prev,
            checklist: respuestas,
            observaciones: observacion
        }));
        onNext();
    };

    // Calcular progreso
    const answeredCount = Object.keys(respuestas).length;
    const totalCount = checklistItems.length;
    const progress = Math.round((answeredCount / totalCount) * 100) || 0;

    return (
        <div>
            {/* Header del Activo */}
            <Card className="bg-light border-0 mb-4">
                <Card.Body className="d-flex align-items-center">
                    <div
                        className="me-3 rounded"
                        style={{
                            width: '60px', height: '60px',
                            backgroundImage: activoSeleccionado.foto ? `url(${activoSeleccionado.foto})` : 'none',
                            backgroundColor: '#e9ecef',
                            backgroundSize: 'cover'
                        }}
                    >
                        {!activoSeleccionado.foto && <span className="d-flex h-100 justify-content-center align-items-center">📦</span>}
                    </div>
                    <div>
                        <h5 className="mb-0">{activoSeleccionado.nombre || activoSeleccionado.tipo}</h5>
                        <small className="text-muted">
                            {activoSeleccionado.codigo} | {activoSeleccionado.ubicacion}
                        </small>
                    </div>
                    <div className="ms-auto">
                        <Badge bg="info">{progress}% Completado</Badge>
                    </div>
                </Card.Body>
            </Card>

            <h5 className="mb-3">Lista de Chequeo</h5>

            <div className="checklist-container mb-4">
                {checklistItems.map((item, idx) => {
                    const estado = respuestas[item];
                    return (
                        <Card key={idx} className={`mb-2 border-${estado === 'Malo' ? 'danger' : estado === 'Bueno' ? 'success' : 'light'}`}>
                            <Card.Body className="p-2 d-flex align-items-center justify-content-between">
                                <span className="fw-medium">{item}</span>

                                <div className="btn-group" role="group">
                                    <Button
                                        variant={estado === 'Bueno' ? 'success' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => handleCheck(item, 'Bueno')}
                                        title="Cumple / Bueno"
                                    >
                                        <CheckCircle size={18} />
                                    </Button>
                                    <Button
                                        variant={estado === 'Malo' ? 'danger' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => handleCheck(item, 'Malo')}
                                        title="No Cumple / Malo"
                                    >
                                        <XCircle size={18} />
                                    </Button>
                                    <Button
                                        variant={estado === 'N/A' ? 'warning' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => handleCheck(item, 'N/A')}
                                        title="No Aplica"
                                    >
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>N/A</span>
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })}
            </div>

            <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Observaciones / Hallazgos Adicionales</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe aquí cualquier novedad, daño o hallazgo importante..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                />
            </Form.Group>

            <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={onBack}>Atrás</Button>
                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={progress < 100} // Obligar a contestar todo? Opcional
                >
                    Revisar y Guardar
                </Button>
            </div>
        </div>
    );
};

export default FormularioCheck;
