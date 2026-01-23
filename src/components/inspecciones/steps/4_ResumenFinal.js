import React, { useState } from 'react';
import { Card, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { addDoc, collection, doc, updateDoc, writeBatch } from 'firebase/firestore'; // Importamos writeBatch
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';

// Importar semillas para buscar plantilla ID si es necesario (o inferir)
import { PLANTILLAS } from '../data/inspectionSeeds';

const ResumenFinal = ({ data, onBack, onReset }) => {
    const { user } = useAuth();
    const { activoSeleccionado, checklist, observaciones, categoria, fechaProximaRecarga, configRef, resultadoPreliminar } = data;
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Lógica para determinar el nombre correcto del activo
    const getNombreActivo = (item) => {
        if (!item) return 'Desconocido';
        if (item.tipoAgente) return `${item.tipoAgente} - ${item.capacidad || ''}`;
        if (item.tipoCamilla) return item.tipoCamilla;
        if (item.claseBotiquin) return `${item.claseBotiquin} - ${item.tipo || ''}`;
        if (item.tipo) return item.tipo;
        return item.nombre || 'Ítem Sin Nombre';
    };

    const nombreActivo = getNombreActivo(activoSeleccionado);

    // Contar hallazgos (Legacy)
    const hallazgos = Object.entries(checklist).filter(([k, v]) => {
        if (typeof v === 'object') return v.valor === 'NO'; // Nuevo Modelo
        return v === 'Malo'; // Legacy
    });

    // Estado General visual
    const estadoGeneralVisual = resultadoPreliminar || (hallazgos.length > 0 ? 'No Conforme' : 'Conforme');

    const handleSave = async () => {
        setSaving(true);
        try {
            if (categoria === 'alturas') {
                // --- NUEVA ARQUITECTURA (Alturas) ---

                // 1. Identificar Plantilla
                const plantilla = PLANTILLAS.find(p => p.familia === activoSeleccionado.familia);
                const plantillaId = plantilla ? plantilla.id : 'tpl-unknown';

                // 2. Crear Cabecera (Inspecciones)
                const inspeccionRef = await addDoc(collection(db, 'inspecciones'), {
                    equipoId: activoSeleccionado.id,
                    fecha: new Date(),
                    inspector: user.email,
                    inspectorId: user.uid,
                    plantillaId: plantillaId,
                    resultado: resultadoPreliminar, // Apto, No Apto, etc.
                    observacionesGenerales: observaciones,
                    created_at: new Date(),
                    updated_at: new Date()
                });

                // 3. Crear Detalles (Respuestas - Batch)
                const batch = writeBatch(db);

                Object.entries(checklist).forEach(([itemId, resp]) => {
                    const respuestaRef = doc(collection(db, 'respuestas_inspeccion'));
                    batch.set(respuestaRef, {
                        inspeccionId: inspeccionRef.id,
                        itemId: itemId,
                        valor: resp.valor,
                        observacion: resp.observacion || '',
                        fotoUrl: resp.foto || null,
                        created_at: new Date()
                    });
                });

                await batch.commit();

                // 4. Actualizar Inventario (Estado y Fecha)
                // Colección 'inventarios'
                const itemRef = doc(db, 'inventarios', activoSeleccionado.id);
                await updateDoc(itemRef, {
                    fecha_ultima_inspeccion: new Date().toISOString().split('T')[0],
                    estado: resultadoPreliminar // 'Apto', 'No Apto', etc.
                });

            } else {
                // --- LEGACY FLOW (Extintores, etc.) ---
                await addDoc(collection(db, 'inspecciones_sst'), {
                    empresaId: user.uid,
                    fechaInspeccion: new Date(),
                    categoria: categoria,
                    inspectorEmail: user.email,
                    activo: {
                        id: activoSeleccionado.id,
                        nombre: nombreActivo,
                        codigo: activoSeleccionado.codigo || 'S/C',
                        ubicacion: activoSeleccionado.ubicacion || 'Sin Ubicación',
                        foto: activoSeleccionado.foto || null
                    },
                    resultados: {
                        checklist: checklist,
                        observaciones: observaciones,
                        hallazgosCount: hallazgos.length
                    },
                    estadoGeneral: estadoGeneralVisual,
                    estado: 'Cerrada'
                });

                // Si es EXTINTOR y hay fecha de próxima recarga
                if (categoria === 'extintores' && fechaProximaRecarga && activoSeleccionado?.id) {
                    try {
                        // Asumimos que extintores están en 'extintores' o 'inventarios' según config?
                        // El código original asumía 'inventarios'. Verificamos configRef.coleccion si es posible, sino 'inventarios'.
                        const colName = configRef?.coleccion || 'inventarios';
                        const itemRef = doc(db, colName, activoSeleccionado.id);
                        await updateDoc(itemRef, {
                            fechaProximaRecarga: fechaProximaRecarga,
                            fechaUltimaRecarga: new Date().toISOString().split('T')[0]
                        });
                    } catch (updateErr) {
                        console.error("Error actualizando inventario:", updateErr);
                    }
                }
            }

            setSaved(true);
        } catch (error) {
            console.error("Error guardando inspección:", error);
            alert(`Error al guardar: ${error.message}`);
        }
        setSaving(false);
    };

    if (saved) {
        return (
            <div className="text-center py-5">
                <CheckCircle size={64} className="text-success mb-3" />
                <h3>¡Inspección Registrada!</h3>
                <p className="text-muted">La base de datos ha sido actualizada correctamente.</p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button variant="outline-secondary" onClick={() => window.location.reload()}>Ir al Inicio</Button>
                    <Button variant="primary" onClick={onReset}>Nueva Inspección</Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h4 className="mb-3">Resumen de Inspección</h4>

            <Alert variant={
                estadoGeneralVisual === 'Apto' || estadoGeneralVisual === 'Conforme' ? 'success' :
                    estadoGeneralVisual === 'No Apto' ? 'danger' : 'warning'
            }>
                <strong>Resultado General:</strong> {estadoGeneralVisual}
            </Alert>

            <Card className="mb-3">
                <Card.Header>Activo Inspeccionado</Card.Header>
                <Card.Body>
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
                        hallazgos.map(([key, val], idx) => {
                            // key podría ser ID para alturas
                            // Para mostrar nombre amigable en alturas tendríamos que buscar en Seeds, pero es costoso aquí.
                            // Por ahora mostramos ID o Pregunta si pudiéramos pasarlo.
                            // En legacy 'key' es nombre.

                            // Simplificación: Si es objeto (Alturas), mostrar ID.
                            const label = typeof val === 'object' ? `Ítem ${key}` : key;
                            const estado = typeof val === 'object' ? val.observacion || 'No Cumple' : val;

                            return (
                                <ListGroup.Item key={idx} className="text-danger d-flex align-items-center">
                                    <AlertTriangle size={16} className="me-2" />
                                    <div>
                                        <strong>{label}:</strong> <span className="ms-2">{estado}</span>
                                    </div>
                                </ListGroup.Item>
                            )
                        })
                    )}
                </ListGroup>
            </Card>

            {observaciones && (
                <Card className="mb-4">
                    <Card.Header>Observaciones Generales</Card.Header>
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
