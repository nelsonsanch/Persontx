import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Badge, Collapse } from 'react-bootstrap';
import { CheckCircle, XCircle, AlertTriangle, Camera, MessageSquare, Info, Calendar } from 'lucide-react';

// Importar semillas para Alturas
import { PLANTILLAS, ITEMS_PLANTILLA } from '../data/inspectionSeeds';

const FormularioCheck = ({ data, setData, onNext, onBack }) => {
    const { categoria, activoSeleccionado, configRef } = data;
    const [checklistItems, setChecklistItems] = useState([]);

    // Estado de respuestas: Soporta simple {'Item': 'Bueno'} y complejo {'ID': { valor: 'SI', obs: '', foto: '' }}
    const [respuestas, setRespuestas] = useState(data.checklist || {});
    const [observacionGeneral, setObservacionGeneral] = useState(data.observaciones || '');

    // Estado para controlar qué acordión de item está abierto (para obs/foto)
    const [openItem, setOpenItem] = useState(null);

    // 1. Cargar Ítems (Legacy vs Dynamic)
    useEffect(() => {
        let items = [];

        if (categoria === 'alturas' && activoSeleccionado) {
            // Lógica Dinámica para Alturas
            // 1. Buscar plantilla por Familia (Requerimiento Usuario: Plantilla por Familia)
            const plantilla = PLANTILLAS.find(p => p.familia === activoSeleccionado.familia);

            if (plantilla) {
                // 2. Filtrar items por Plantilla ID
                items = ITEMS_PLANTILLA.filter(i => i.plantillaId === plantilla.id).sort((a, b) => a.orden - b.orden);
            } else {
                console.warn("No se encontró plantilla para familia:", activoSeleccionado.familia);
                // Fallback: Mostrar mensaje amigable en UI
                items = [];
            }

        } else if (configRef) {
            // Lógica Legacy extendida (Extintores, Botiquines, Maquinaria, etc.)
            configRef.campos.forEach(campo => {
                const isValidType = ['checklist', 'checklist_with_quantity', 'tri_state_checklist'].includes(campo.type);
                if (isValidType && campo.options) {
                    items = [...items, ...campo.options];
                }
            });
            if (items.length === 0) {
                items = ['Estado General', 'Limpieza', 'Señalización', 'Acceso Libre', 'Funcionamiento'];
            }
        }

        setChecklistItems(items);
    }, [categoria, activoSeleccionado, configRef]);

    // Manejador Genérico
    const handleCheck = (item, valor) => {
        const isObjectItem = typeof item === 'object';
        const key = isObjectItem ? item.id : item;

        if (isObjectItem) {
            // Modo Complejo (Alturas)
            setRespuestas(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    valor: valor // SI, NO, NA
                }
            }));
        } else {
            // Modo Legacy
            setRespuestas(prev => ({
                ...prev,
                [key]: valor // Bueno, Malo, N/A
            }));
        }
    };

    // Manejadores específicos para detalles (solo Alturas)
    const handleObservationChange = (itemId, text) => {
        setRespuestas(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], observacion: text }
        }));
    };

    const handlePhotoMock = (itemId) => {
        // Simulación de carga de foto
        const mockUrl = "https://via.placeholder.com/150";
        if (window.confirm("¿Simular carga de foto?")) {
            setRespuestas(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], foto: mockUrl }
            }));
        }
    };

    const handleContinue = () => {
        // Calcular resultado preliminar para Alturas
        let resultadoCalculado = "Apto";
        if (categoria === 'alturas') {
            const criticosFallidos = checklistItems.some(item => {
                const resp = respuestas[item.id];
                return item.esCritico && resp?.valor === 'NO';
            });

            const algunFallo = checklistItems.some(item => {
                const resp = respuestas[item.id];
                return resp?.valor === 'NO';
            });

            if (criticosFallidos) resultadoCalculado = "No Apto";
            else if (algunFallo) resultadoCalculado = "Apto con Observación";
        }

        setData(prev => ({
            ...prev,
            checklist: respuestas,
            observaciones: observacionGeneral,
            resultadoPreliminar: resultadoCalculado // Guardamos esto para el resumen
        }));
        onNext();
    };


    // Renderizado de Item
    const renderItem = (item, idx) => {
        const isObjectItem = typeof item === 'object';

        if (isObjectItem) {
            // --- RENDER ALTURAS (Complejo) ---
            const key = item.id;
            const resp = respuestas[key] || {};
            const estado = resp.valor;
            const tieneFoto = !!resp.foto;
            const tieneObs = !!resp.observacion;

            return (
                <Card key={key} className={`mb-3 border-${estado === 'NO' ? 'danger' : estado === 'SI' ? 'success' : 'light'} shadow-sm`}>
                    <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <Badge bg="secondary" className="me-2 mb-1">{item.seccion}</Badge>
                                {item.esCritico && <Badge bg="danger" className="mb-1">CRÍTICO</Badge>}
                                <p className="mb-1 fw-bold" style={{ fontSize: '1rem' }}>{item.pregunta}</p>
                                {item.ayuda && <small className="text-muted d-block mb-2"><Info size={14} className="me-1" />{item.ayuda}</small>}
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            {/* Botones SI / NO / NA */}
                            <div className="btn-group" role="group">
                                <Button
                                    variant={estado === 'SI' ? 'success' : 'outline-success'}
                                    onClick={() => handleCheck(item, 'SI')}
                                    className={estado === 'SI' ? 'fw-bold' : ''}
                                >
                                    CUMPLE
                                </Button>
                                <Button
                                    variant={estado === 'NO' ? 'danger' : 'outline-danger'}
                                    onClick={() => handleCheck(item, 'NO')}
                                    className={estado === 'NO' ? 'fw-bold' : ''}
                                >
                                    NO CUMPLE
                                </Button>
                                <Button
                                    variant={estado === 'NA' ? 'secondary' : 'outline-secondary'}
                                    onClick={() => handleCheck(item, 'NA')}
                                >
                                    N/A
                                </Button>
                            </div>

                            {/* Acciones Extra */}
                            <div className="d-flex gap-2">
                                <Button
                                    variant={tieneObs ? "warning" : "light"}
                                    size="sm"
                                    onClick={() => setOpenItem(openItem === key ? null : key)}
                                    title="Agregar Observación"
                                >
                                    <MessageSquare size={18} />
                                </Button>
                                {(item.requiereFoto || tieneFoto) && (
                                    <Button
                                        variant={tieneFoto ? "primary" : "light"}
                                        size="sm"
                                        onClick={() => handlePhotoMock(key)}
                                        title="Evidencia Fotográfica"
                                    >
                                        <Camera size={18} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Área Colapsable para Detalles */}
                        <Collapse in={openItem === key || tieneObs || (estado === 'NO')}>
                            <div className="mt-3 ps-3 border-start border-3 border-warning">
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Detalle la inconformidad o hallazgo..."
                                    value={resp.observacion || ''}
                                    onChange={(e) => handleObservationChange(key, e.target.value)}
                                    className="mb-2"
                                    style={{ fontSize: '0.9rem' }}
                                />
                                {tieneFoto && (
                                    <div className="position-relative d-inline-block">
                                        <img src={resp.foto} alt="Evidencia" className="rounded border" style={{ height: '60px' }} />
                                        <Button
                                            size="sm" variant="danger"
                                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                                            onClick={() => setRespuestas(p => ({ ...p, [key]: { ...p[key], foto: null } }))}
                                        >x</Button>
                                    </div>
                                )}
                            </div>
                        </Collapse>
                    </Card.Body>
                </Card>
            );

        } else {
            // --- RENDER LEGACY (Simple) ---
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
        }
    };

    // Calcular progreso
    const answeredCount = Object.keys(respuestas).length;
    const totalCount = checklistItems.length;
    const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

    return (
        <div>
            {/* Header del Activo */}
            <Card className="bg-light border-0 mb-4">
                <Card.Body className="d-flex align-items-center">
                    <div
                        className="me-3 rounded"
                        style={{
                            width: '60px', height: '60px',
                            backgroundImage: (activoSeleccionado.foto || activoSeleccionado.foto_frente) ? `url(${activoSeleccionado.foto || activoSeleccionado.foto_frente})` : 'none',
                            backgroundColor: '#e9ecef',
                            backgroundSize: 'cover'
                        }}
                    >
                        {!(activoSeleccionado.foto || activoSeleccionado.foto_frente) && <span className="d-flex h-100 justify-content-center align-items-center">📦</span>}
                    </div>
                    <div>
                        <h5 className="mb-0">
                            {activoSeleccionado.tipo_maquinaria ? `${activoSeleccionado.tipo_maquinaria} ${activoSeleccionado.marca || ''} ${activoSeleccionado.modelo || ''}` :
                                activoSeleccionado.nombre || activoSeleccionado.tipo}
                        </h5>
                        <small className="text-muted">
                            {activoSeleccionado.placa_interna || activoSeleccionado.serie_chasis || activoSeleccionado.codigo_interno || activoSeleccionado.codigo || activoSeleccionado.id || 'S/C'} | {activoSeleccionado.ubicacion}
                            <br />
                            <strong>Familia:</strong> {activoSeleccionado.familia || 'N/A'} | <strong>Tipo:</strong> {activoSeleccionado.tipo_maquinaria || activoSeleccionado.tipo_equipo || activoSeleccionado.tipo || 'N/A'}
                        </small>
                    </div>
                    <div className="ms-auto">
                        <Badge bg={progress === 100 ? "success" : "info"}>{progress}% Completado</Badge>
                    </div>
                </Card.Body>
            </Card>

            <h5 className="mb-3">
                {categoria === 'alturas' ? 'Inspección Detallada según Norma' :
                    categoria === 'maquinaria_pesada' ? 'Inspección Preoperacional (Diaria)' :
                        'Lista de Chequeo Rápida'}
            </h5>

            {checklistItems.length === 0 && (
                <div className="alert alert-warning">
                    No se encontró una plantilla de inspección configurada para este tipo de equipo.
                </div>
            )}

            <div className="checklist-container mb-4">
                {checklistItems.map((item, idx) => {
                    if (categoria === 'maquinaria_pesada') {
                        // --- RENDER MAQUINARIA PESADA (Preoperacional 4 opciones) ---
                        const estado = respuestas[item];
                        return (
                            <Card key={idx} className={`mb-2 border-${estado === 'Malo' ? 'danger' : estado === 'Regular' ? 'warning' : estado === 'Bueno' ? 'success' : 'light'}`}>
                                <Card.Body className="p-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <span className="fw-medium">{item}</span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            variant={estado === 'Bueno' ? 'success' : 'outline-success'}
                                            size="sm"
                                            onClick={() => handleCheck(item, 'Bueno')}
                                            title="Bueno"
                                        >
                                            Bueno
                                        </Button>
                                        <Button
                                            variant={estado === 'Regular' ? 'warning' : 'outline-warning'}
                                            size="sm"
                                            onClick={() => handleCheck(item, 'Regular')}
                                            title="Regular"
                                            className={estado === 'Regular' ? 'text-dark' : ''}
                                        >
                                            Regular
                                        </Button>
                                        <Button
                                            variant={estado === 'Malo' ? 'danger' : 'outline-danger'}
                                            size="sm"
                                            onClick={() => handleCheck(item, 'Malo')}
                                            title="Malo"
                                        >
                                            Malo
                                        </Button>
                                        <Button
                                            variant={estado === 'N/A' ? 'secondary' : 'outline-secondary'}
                                            size="sm"
                                            onClick={() => handleCheck(item, 'N/A')}
                                            title="No Aplica"
                                        >
                                            N/A
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    } else {
                        return renderItem(item, idx);
                    }
                })}
            </div>

            <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Observaciones Generales</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Comentarios globales de la inspección..."
                    value={observacionGeneral}
                    onChange={(e) => setObservacionGeneral(e.target.value)}
                />
            </Form.Group>

            {/* PROGRAMACIÓN PRÓXIMA INSPECCIÓN */}
            <Card className="mb-4 border-info">
                <Card.Header className="bg-info text-white fw-bold">
                    <Calendar size={18} className="me-2" />
                    Programación de Próxima Inspección
                </Card.Header>
                <Card.Body>
                    <Form.Group>
                        <Form.Label className="fw-bold">Próxima Fecha Sugerida (Mes/Año)</Form.Label>
                        <Form.Control
                            type="month"
                            value={data.fechaProxima || ''}
                            onChange={(e) => setData(prev => ({ ...prev, fechaProxima: e.target.value }))}
                            required
                        />
                        <Form.Text className="text-muted">
                            Esta fecha servirá para generar alertas de vencimiento en el sistema.
                        </Form.Text>
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* CAMPO DE PRÓXIMA RECARGA (SOLO EXTINTORES) */}
            {data.categoria === 'extintores' && (
                <Card className="mb-4 border-warning">
                    <Card.Header className="bg-warning text-dark fw-bold">
                        <AlertTriangle size={18} className="me-2" />
                        Vencimiento de Recarga
                    </Card.Header>
                    <Card.Body>
                        <Form.Group>
                            <Form.Label className="fw-bold">Fecha de la Próxima Recarga</Form.Label>
                            <Form.Control
                                type="date"
                                value={data.fechaProximaRecarga || ''}
                                onChange={(e) => setData(prev => ({ ...prev, fechaProximaRecarga: e.target.value }))}
                                required
                            />
                        </Form.Group>
                    </Card.Body>
                </Card>
            )}

            <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={onBack}>Atrás</Button>
                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={progress < 100}
                >
                    Revisar y Guardar
                </Button>
            </div>
        </div>
    );
};

export default FormularioCheck;
