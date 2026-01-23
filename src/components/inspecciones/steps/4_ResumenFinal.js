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
    const { activoSeleccionado, checklist, observaciones, categoria, fechaProximaRecarga, configRef, resultadoPreliminar, fechaProxima } = data;
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Lógica para determinar el nombre correcto del activo
    const getNombreActivo = (item) => {
        if (!item) return 'Desconocido';
        // Prioridad: 1. Tipo de Equipo (Alturas), 2. Tipo Agente, 3. Tipo, 4. Nombre
        if (item.tipo_equipo) return item.tipo_equipo;
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
            // Unificada la lógica de guardado en 'inspecciones_sst' para evitar problemas de permisos
            // y mantener consistencia con los reportes existentes.

            // 1. Identificar Plantilla (Solo para Alturas)
            let plantillaId = null;
            if (categoria === 'alturas') {
                const plantilla = PLANTILLAS.find(p => p.familia === activoSeleccionado.familia);
                plantillaId = plantilla ? plantilla.id : 'tpl-unknown';
            }

            // 2. Guardar Inspección Centralizada
            const inspeccionData = {
                empresaId: user.uid,
                fechaInspeccion: new Date(),
                categoria: categoria,
                inspectorEmail: user.email,
                inspectorId: user.uid,
                activo: {
                    id: activoSeleccionado.id,
                    nombre: nombreActivo,
                    codigo: activoSeleccionado.codigo || 'S/C',
                    ubicacion: activoSeleccionado.ubicacion || 'Sin Ubicación',
                    foto: activoSeleccionado.foto || null,
                    familia: activoSeleccionado.familia || null,
                    tipo: activoSeleccionado.tipo_equipo || activoSeleccionado.tipo || null
                },
                resultados: {
                    checklist: checklist, // Se guarda el objeto completo con obs/fotos
                    observaciones: observaciones,
                    hallazgosCount: hallazgos.length,
                    plantillaId: plantillaId, // Info extra para Alturas
                    resultadoPreliminar: resultadoPreliminar // Apto/No Apto
                },
                fechaProximaInspeccion: fechaProxima || null, // Nuevo Campo
                estadoGeneral: estadoGeneralVisual,
                estado: 'Cerrada',
                created_at: new Date() // Timestamp
            };

            await addDoc(collection(db, 'inspecciones_sst'), inspeccionData);

            // 3. Actualizar Inventario (Estado y Fechas)
            try {
                // Determinar colección destino (generalmente 'inventarios')
                // Si heights usa 'inventarios', está bien.
                const colName = configRef?.coleccion || 'inventarios';
                const itemRef = doc(db, colName, activoSeleccionado.id);

                let updateData = {};

                if (categoria === 'alturas') {
                    updateData = {
                        fecha_ultima_inspeccion: new Date().toISOString().split('T')[0],
                        estado: resultadoPreliminar,
                        fecha_proxima_inspeccion: fechaProxima || null // Guardar para alertas
                    };
                } else if (categoria === 'extintores') {
                    if (fechaProximaRecarga) {
                        updateData = {
                            fechaProximaRecarga: fechaProximaRecarga,
                            fechaUltimaRecarga: new Date().toISOString().split('T')[0]
                        };
                    }
                }

                // Generico: Si hay fechaProxima y no es alturas (por redundancia o futuro uso en otros)
                if (fechaProxima && categoria !== 'alturas') {
                    updateData.fecha_proxima_inspeccion = fechaProxima;
                }

                if (Object.keys(updateData).length > 0) {
                    await updateDoc(itemRef, updateData);
                }

            } catch (updateErr) {
                console.error("Error actualizando inventario (puede ser permisos):", updateErr);
                // No bloqueamos el flujo si falla el update del asset, pero lo logueamos
            }

            setSaved(true);
        } catch (error) {
            console.error("Error guardando inspección:", error);
            alert(`Error al guardar: ${error.message} (Verifique permisos)`);
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
