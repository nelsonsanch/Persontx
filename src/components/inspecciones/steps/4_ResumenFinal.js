import React, { useState } from 'react';
import { Card, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';

const ResumenFinal = ({ data, onBack, onReset }) => {
    const { user } = useAuth();
    const { activoSeleccionado, checklist, observaciones, categoria, fechaProximaRecarga } = data;
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Lógica para determinar el nombre correcto del activo (Igual que en paso 2)
    const getNombreActivo = (item) => {
        if (!item) return 'Desconocido';
        if (item.tipoAgente) return `${item.tipoAgente} - ${item.capacidad || ''}`;
        if (item.tipoCamilla) return item.tipoCamilla;
        if (item.claseBotiquin) return `${item.claseBotiquin} - ${item.tipo || ''}`;
        if (item.tipo) return item.tipo;
        return item.nombre || 'Ítem Sin Nombre';
    };

    const nombreActivo = getNombreActivo(activoSeleccionado);

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
                    nombre: nombreActivo, // Guardamos el nombre calculado
                    codigo: activoSeleccionado.codigo || 'S/C',
                    ubicacion: activoSeleccionado.ubicacion || 'Sin Ubicación',
                    foto: activoSeleccionado.foto || null
                },
                resultados: {
                    checklist: checklist,
                    observaciones: observaciones,
                    hallazgosCount: hallazgos.length
                },
                estadoGeneral: estadoGeneral,
                estado: 'Cerrada'
            });

            // Si es EXTINTOR y hay fecha de próxima recarga, ACTUALIZAR EL ACTIVO EN INVENTARIO
            if (categoria === 'extintores' && fechaProximaRecarga && activoSeleccionado?.id) {
                try {
                    const itemRef = doc(db, 'inventarios', activoSeleccionado.id);
                    await updateDoc(itemRef, {
                        fechaProximaRecarga: fechaProximaRecarga,
                        fechaUltimaRecarga: new Date().toISOString().split('T')[0] // Asumimos recarga hoy o reciente
                    });
                    console.log("Inventario actualizado con nueva fecha de recarga");
                } catch (updateErr) {
                    console.error("Error actualizando inventario:", updateErr);
                }
            }

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
                    {/* Usamos el nombre calculado también para mostrarlo aquí */}
                    <h5 className="mb-1">{nombreActivo}</h5>
                    <div>ID: {activoSeleccionado.codigo}</div>
                    <div className="text-muted">Ubicación: {activoSeleccionado.ubicacion}</div>
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
