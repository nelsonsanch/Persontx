import React, { useState } from 'react';
import { Card, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';

const ResumenFinal = ({ data, onBack, onReset }) => {
    const { user } = useAuth();
    const { activoSeleccionado, checklist, observaciones, categoria } = data;
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Contar hallazgos
    const hallazgos = Object.entries(checklist).filter(([k, v]) => v === 'Malo');
    const estadoGeneral = hallazgos.length > 0 ? 'No Conforme' : 'Conforme';

    const handleSave = async () => {
        setSaving(true);
        try {
            await addDoc(collection(db, 'inspecciones_sst'), {
                empresaId: user.uid,
                fechaInspeccion: new Date(),
                categoria: categoria,
                inspectorEmail: user.email,
                activo: {
                    id: activoSeleccionado.id,
                    nombre: activoSeleccionado.nombre || activoSeleccionado.tipo,
                    codigo: activoSeleccionado.codigo || 'S/C',
                    ubicacion: activoSeleccionado.ubicacion,
                    foto: activoSeleccionado.foto || null
                },
                resultados: {
                    checklist: checklist,
                    observaciones: observaciones,
                    hallazgosCount: hallazgos.length
                },
                estadoGeneral: estadoGeneral,
                estado: 'Cerrada' // 'Abierta' si tuviera seguimiento
            });
            setSaved(true);
        } catch (error) {
            console.error("Error guardando inspección:", error);
            alert("Error al guardar la inspección.");
        }
        setSaving(false);
    };

    if (saved) {
        return (
            <div className="text-center py-5">
                <CheckCircle size={64} className="text-success mb-3" />
                <h3>¡Inspección Guardada!</h3>
                <p className="text-muted">Se ha registrado correctamente en el historial.</p>
                <Button variant="primary" onClick={onReset}>Realizar Nueva Inspección</Button>
            </div>
        );
    }

    return (
        <div>
            <h4 className="mb-3">Resumen de Inspección</h4>

            <Alert variant={estadoGeneral === 'Conforme' ? 'success' : 'warning'}>
                <strong>Resultado General:</strong> {estadoGeneral}
            </Alert>

            <Card className="mb-3">
                <Card.Header>Activo Inspeccionado</Card.Header>
                <Card.Body>
                    <strong>{activoSeleccionado.nombre || activoSeleccionado.tipo}</strong>
                    <br />
                    ID: {activoSeleccionado.codigo}
                    <br />
                    Ubicación: {activoSeleccionado.ubicacion}
                </Card.Body>
            </Card>

            <Card className="mb-3">
                <Card.Header>Hallazgos ({hallazgos.length})</Card.Header>
                <ListGroup variant="flush">
                    {hallazgos.length === 0 ? (
                        <ListGroup.Item className="text-success">
                            <CheckCircle size={16} className="me-2" /> Todo en orden.
                        </ListGroup.Item>
                    ) : (
                        hallazgos.map(([item, estado], idx) => (
                            <ListGroup.Item key={idx} className="text-danger d-flex align-items-center">
                                <AlertTriangle size={16} className="me-2" />
                                <strong>{item}:</strong> <span className="ms-2">{estado}</span>
                            </ListGroup.Item>
                        ))
                    )}
                </ListGroup>
            </Card>

            {observaciones && (
                <Card className="mb-4">
                    <Card.Header>Observaciones</Card.Header>
                    <Card.Body className="fst-italic">
                        "{observaciones}"
                    </Card.Body>
                </Card>
            )}

            <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={onBack} disabled={saving}>Corregir</Button>
                <Button variant="success" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner size="sm" animation="border" /> : 'Finalizar y Guardar'}
                </Button>
            </div>
        </div>
    );
};

export default ResumenFinal;
