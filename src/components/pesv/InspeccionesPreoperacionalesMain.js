import React, { useState, useEffect } from 'react';
import { Card, Nav, Button, Row, Col, Form, Badge, Table, Alert, Modal } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

// CONFIGURACIÓN DEL CHECKLIST
import { PREOP_CHECKLIST, HEAVY_MACHINERY_CHECKLIST } from './inspeccionesConfig';
import MantenimientoVehiculo from './MantenimientoVehiculo';
import DetalleInspeccionModal from './DetalleInspeccionModal';
import HistorialPreoperacionales from './HistorialPreoperacionales';
import IndicadoresPreoperacionales from './IndicadoresPreoperacionales';
import { Eye, BarChart2 } from 'lucide-react';

const InspeccionesPreoperacionalesMain = () => {
    const { user, dataScopeId, userRole } = useAuth();
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState('nueva');
    const [activos, setActivos] = useState([]); // Renamed from vehicles for generic support
    const [selectedAsset, setSelectedAsset] = useState(null); // Renamed from selectedVehicle
    const [loading, setLoading] = useState(false);

    // Estado para Modal de Mantenimiento Rápido
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceTypeToAutoSelect, setMaintenanceTypeToAutoSelect] = useState('');

    // Estado del Formulario
    const [formData, setFormData] = useState({
        kilometraje_lectura: '', // or horometro
        observaciones: '',
        // Nuevos campos de Salud y Operador
        operador_nombre: user?.displayName || '',
        operador_cedula: '',
        estado_salud: 'Me siento bien',
        horas_sueno: '',
        toma_medicamentos: 'No',
        nombre_medicamento: '',
        ruta_origen: '',
        ruta_destino: ''
    });
    const [checklistResponses, setChecklistResponses] = useState({});

    // Estado para Modal de Alerta
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningData, setWarningData] = useState(null);

    // Cargar Activos (Vehículos y Maquinaria)
    useEffect(() => {
        if (!user) return;

        let unsubVehiculos = () => { };
        let unsubMaquinaria = () => { };
        let vehiculosData = [];
        let maquinariaData = [];

        const updateActivos = () => {
            setActivos([...vehiculosData, ...maquinariaData]);
        };

        // 1. Cargar Vehículos
        const qVehiculos = query(
            collection(db, 'inventarios'),
            where('categoria', '==', 'vehiculos'),
            where('clienteId', '==', dataScopeId)
        );

        unsubVehiculos = onSnapshot(qVehiculos, (snapV) => {
            vehiculosData = snapV.docs.map(d => ({ id: d.id, ...d.data(), tipo_activo: 'vehiculo' }));
            updateActivos();
        });

        // 2. Cargar Maquinaria Pesada
        const qMaquinaria = query(
            collection(db, 'inventarios'),
            where('categoria', '==', 'maquinaria_pesada'),
            where('clienteId', '==', dataScopeId)
        );

        unsubMaquinaria = onSnapshot(qMaquinaria, (snapM) => {
            maquinariaData = snapM.docs.map(d => ({ id: d.id, ...d.data(), tipo_activo: 'maquinaria' }));
            updateActivos();
        });

        return () => {
            unsubVehiculos();
            unsubMaquinaria();
        };
    }, [user, dataScopeId]);

    // Estado para items automáticos
    const [maintenanceStatus, setMaintenanceStatus] = useState({});

    // Cargar Estado de Mantenimientos (Auto-Checks)
    useEffect(() => {
        if (!selectedAsset) {
            setMaintenanceStatus({});
            return;
        }

        const fetchMaintenanceStatus = async () => {
            const q = query(
                collection(db, 'mantenimientos_vehiculos'),
                where('clienteId', '==', dataScopeId),
                where('vehiculo_id', '==', selectedAsset.id)
            );

            const unsubscribe = onSnapshot(q, (docs) => {
                const registrosRaw = docs.docs.map(d => d.data());
                const registros = registrosRaw.sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

                const status = {};
                // Detectar si usa Kilometraje u Horómetro
                const currentUsage = Number(selectedAsset.kilometraje_actual || selectedAsset.horometro_actual) || 0;
                const usageUnit = selectedAsset.tipo_activo === 'maquinaria' ? 'Horas' : 'Km';
                // 1. SOAT/Seguro Obligatorio
                // Priorizar registro que TENGAN fecha de vencimiento definida para evitar falsos positivos con registros mal formados
                const soatReg = registros.find(r =>
                    r.tipo_evento &&
                    (r.tipo_evento.includes('SOAT') || r.tipo_evento.includes('Seguro') || r.tipo_evento.includes('Póliza')) &&
                    r.proximo_vencimiento_fecha
                );

                if (soatReg && soatReg.proximo_vencimiento_fecha) {
                    const days = Math.ceil((new Date(soatReg.proximo_vencimiento_fecha) - new Date()) / (1000 * 60 * 60 * 24));
                    status.doc_soat = {
                        val: days > 0 ? 'OK' : 'FALLO',
                        info: days > 0 ? `Vence en ${days} días` : `Vencido hace ${Math.abs(days)} días`,
                        critical: days <= 0
                    };
                } else {
                    status.doc_soat = { val: 'FALLO', info: 'No hay registro de Seguro/Póliza', critical: true };
                }

                // 2. Tecnomecánica / Certificación
                // Priorizar registro que TENGAN fecha de vencimiento definida
                const tecnoReg = registros.find(r =>
                    r.tipo_evento &&
                    (r.tipo_evento.includes('Tecno') || r.tipo_evento.includes('Certifi')) &&
                    r.proximo_vencimiento_fecha
                );

                if (tecnoReg && tecnoReg.proximo_vencimiento_fecha) {
                    const days = Math.ceil((new Date(tecnoReg.proximo_vencimiento_fecha) - new Date()) / (1000 * 60 * 60 * 24));
                    status.doc_tecno = {
                        val: days > 0 ? 'OK' : 'FALLO',
                        info: days > 0 ? `Vence en ${days} días` : `Vencido hace ${Math.abs(days)} días`,
                        critical: days <= 0
                    };
                } else {
                    status.doc_tecno = { val: 'FALLO', info: 'No hay registro de Certific./Tecno', critical: true };
                }

                // 3. Mantenimiento Preventivo (Aceite/Filtros)
                const mantReg = registros.find(r => r.tipo_evento && (r.tipo_evento.toLowerCase().includes('aceite') || r.tipo_evento.toLowerCase().includes('preventivo')));

                if (!mantReg) {
                    status.nivel_aceite = { val: 'FALLO', info: 'No hay registro de Mantenimiento', critical: true };
                } else if (!mantReg.proximo_cambio_kilometraje) {
                    status.nivel_aceite = { val: 'FALLO', info: `Registro sin ${usageUnit} Meta`, critical: true };
                } else {
                    const target = Number(mantReg.proximo_cambio_kilometraje);
                    const remaining = target - currentUsage;
                    status.nivel_aceite = {
                        val: remaining > 0 ? 'OK' : 'FALLO',
                        info: remaining > 0 ? `Faltan ${remaining.toLocaleString()} ${usageUnit}` : `Pasado por ${Math.abs(remaining).toLocaleString()} ${usageUnit}`,
                        critical: remaining <= -50 // Margen pequeño para maquinaria
                    };
                }

                setMaintenanceStatus(status);

                // Auto-fill checklist responses only if keys exist in checklist
                // (This matches ID in checklist with status key)
                const activeChecklist = selectedAsset.categoria === 'vehiculos' ? PREOP_CHECKLIST : HEAVY_MACHINERY_CHECKLIST;

                // Helper to check if item exists in current checklist
                const itemExists = (id) => activeChecklist.some(cat => cat.items.some(i => i.id === id));

                const newAutoResponses = {};
                if (itemExists('doc_soat')) newAutoResponses.doc_soat = status.doc_soat?.val || 'FALLO';
                if (itemExists('doc_tecno')) newAutoResponses.doc_tecno = status.doc_tecno?.val || 'FALLO';
                if (itemExists('nivel_aceite')) newAutoResponses.nivel_aceite = status.nivel_aceite?.val || 'FALLO';

                setChecklistResponses(prev => ({
                    ...prev,
                    ...newAutoResponses
                }));
            });

            return () => unsubscribe();
        };

        fetchMaintenanceStatus();
    }, [selectedAsset]);

    // Determinar qué checklist usar
    const getActiveChecklist = () => {
        if (!selectedAsset) return [];
        return selectedAsset.categoria === 'maquinaria_pesada' ? HEAVY_MACHINERY_CHECKLIST : PREOP_CHECKLIST;
    };

    const handleCheckChange = (itemId, value) => {
        setChecklistResponses(prev => ({ ...prev, [itemId]: value }));
    };

    const calculateResult = () => {
        let criticalFail = false;
        let totalPass = 0;
        let totalItems = 0;
        const currentChecklist = getActiveChecklist();

        // Verificar críticos automáticos primero
        if (maintenanceStatus.doc_soat?.critical) criticalFail = true;
        if (maintenanceStatus.doc_tecno?.critical) criticalFail = true;
        if (maintenanceStatus.nivel_aceite?.critical) criticalFail = true;

        currentChecklist.forEach(cat => {
            cat.items.forEach(item => {
                const response = checklistResponses[item.id];
                if (response === 'NA') return;

                totalItems++;
                if (response === 'BUENO') totalPass += 1;
                if (response === 'REGULAR') totalPass += 0.5;

                if (item.critical && response === 'MALO') {
                    criticalFail = true;
                }
            });
        });

        const maxScore = totalItems > 0 ? totalItems : 1;

        // Validación Crítica de Sueño (Nuevo Requisito)
        const horasSueno = Number(formData.horas_sueno);
        if (formData.horas_sueno !== '' && horasSueno <= 6) {
            criticalFail = true; // Sueño insuficiente es falla crítica automática
        }

        return { criticalFail, score: (totalPass / maxScore) * 100 };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAsset) return toast.error("Seleccione un equipo");

        const { criticalFail, score } = calculateResult();
        const resultadoGlobal = criticalFail ? "RECHAZADO" : "APROBADO";

        if (criticalFail) {
            if (!window.confirm("⚠️ ATENCIÓN: Esta inspección tiene fallos en ítems CRÍTICOS. El equipo NO DEBE OPERAR. ¿Desea registrar el RECHAZO?")) {
                return;
            }
        }

        // VALIDACIÓN INTELIGENTE DE KILOMETRAJE / HORAS
        const usageVal = Number(formData.kilometraje_lectura);
        const currentUsage = Number(selectedAsset.kilometraje_actual || selectedAsset.horometro_actual) || 0;
        const usageUnit = selectedAsset.tipo_activo === 'maquinaria' ? 'Horas' : 'Kilómetros';

        // Umbrales de Seguridad
        const MAX_DELTA_KM = 3000; // Máximo 3000 km de diferencia aceptable sin confirmación
        const MAX_DELTA_HOURS = 50; // Máximo 50 horas de diferencia aceptable sin confirmación

        const delta = usageVal - currentUsage;
        const threshold = selectedAsset.tipo_activo === 'maquinaria' ? MAX_DELTA_HOURS : MAX_DELTA_KM;

        // 1. Validación de valor menor al actual (Inconsistencia)
        if (usageVal < currentUsage) {
            if (!window.confirm(`⚠️ DETECTADA INCONSISTENCIA:\n\nEl valor ingresado (${usageVal}) es MENOR al actual registrado (${currentUsage}).\n\n¿Estás seguro que el dato es correcto?`)) {
                return;
            }
        }

        // 2. Validación de "Salto Lógico" (Garbage In Prevention)
        if (delta > threshold) {
            setWarningData({
                current: currentUsage,
                newVal: usageVal,
                delta: delta,
                unit: usageUnit
            });
            setShowWarningModal(true);
            return; // Detener flujo, esperar confirmación del modal
        }

        // Si pasa validaciones, guardar directo
        await executeSave();
    };

    const executeSave = async () => {
        setShowWarningModal(false); // Cerrar modal si estaba abierto
        setLoading(true);

        // Recalcular valores necesarios dentro del closure actual o usar refs/state
        // NOTA: Como executeSave se llama asíncronamente, debemos asegurar que formData y otros estados sean actuales.
        // En React funcional, esto funciona bien si executeSave se define en el render cycle.

        const { criticalFail, score } = calculateResult();
        const resultadoGlobal = criticalFail ? "RECHAZADO" : "APROBADO";
        const usageVal = Number(formData.kilometraje_lectura);

        try {
            await addDoc(collection(db, 'inspecciones_preoperacionales'), {
                fecha_registro: new Date().toISOString(),
                clienteId: dataScopeId,
                usuario_id: user.uid,
                usuario_email: user.email,
                vehiculo_id: selectedAsset.id,
                tipo_activo: selectedAsset.tipo_activo,
                vehiculo_placa: selectedAsset.placa || selectedAsset.placa_interna || selectedAsset.serie_chasis || selectedAsset.id_interno || 'S/N',
                vehiculo_marca: `${selectedAsset.marca} ${selectedAsset.modelo}`,
                lectura_uso: usageVal,
                checklist: checklistResponses,
                maintenance_status_snapshot: maintenanceStatus,
                resultado_global: resultadoGlobal,
                score: Math.round(score),
                observaciones: formData.observaciones,
                items_criticos_fallidos: criticalFail,
                operador_nombre: formData.operador_nombre,
                operador_cedula: formData.operador_cedula,
                estado_salud: formData.estado_salud,
                horas_sueno: Number(formData.horas_sueno),
                toma_medicamentos: formData.toma_medicamentos,
                nombre_medicamento: formData.nombre_medicamento,
                ruta_origen: formData.ruta_origen || '',
                ruta_destino: formData.ruta_destino || '',
                distancia_recorrida: (usageVal > (Number(selectedAsset.kilometraje_actual || selectedAsset.horometro_actual) || 0))
                    ? usageVal - (Number(selectedAsset.kilometraje_actual || selectedAsset.horometro_actual) || 0)
                    : 0
            });

            // Actualizar uso (KM u Horas)
            const currentUsage = Number(selectedAsset.kilometraje_actual || selectedAsset.horometro_actual) || 0;
            if (usageVal > currentUsage) {
                const updateData = selectedAsset.tipo_activo === 'maquinaria'
                    ? { horometro_actual: usageVal, fecha_ultima_lectura: new Date().toISOString() }
                    : { kilometraje_actual: usageVal, fecha_ultima_lectura: new Date().toISOString() };

                await updateDoc(doc(db, 'inventarios', selectedAsset.id), updateData);
            }

            toast.success(`Inspección registrada: ${resultadoGlobal}`);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar inspección");
        }
        setLoading(false);
    };

    const resetForm = () => {
        setSelectedAsset(null);
        setFormData({
            kilometraje_lectura: '',
            observaciones: '',
            operador_nombre: user?.displayName || '',
            operador_cedula: '',
            estado_salud: 'Me siento bien',
            horas_sueno: '',
            toma_medicamentos: 'No',
            nombre_medicamento: '',
            ruta_origen: '',
            ruta_destino: ''
        });
        setChecklistResponses({});
        setMaintenanceStatus({});
        setActiveTab('historial');
    };

    return (
        <div className="container-fluid fade-in p-2 p-md-4">
            <h2 className="mb-4 text-primary fw-bold">🔎 Inspecciones Preoperacionales</h2>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav.Item>
                            <Nav.Link eventKey="nueva" className="fw-bold"> Nueva Inspección</Nav.Link>
                        </Nav.Item>
                        {(userRole === 'cliente' || userRole === 'admin') && (
                            <>
                                <Nav.Item>
                                    <Nav.Link eventKey="historial" className="fw-bold">Historial Completo</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="indicadores" className="fw-bold text-success">
                                        <BarChart2 size={16} className="me-1 mb-1" />
                                        Indicadores
                                    </Nav.Link>
                                </Nav.Item>
                            </>
                        )}
                    </Nav>
                </Card.Header>
                <Card.Body className="p-3 p-md-4">
                    {activeTab === 'nueva' && (
                        <Form onSubmit={handleSubmit}>
                            {/* 1. Selección de Activo */}
                            <Row className="mb-4">
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-bold">Seleccionar Equipo / Vehículo</Form.Label>
                                        <Form.Select
                                            value={selectedAsset?.id || ''}
                                            onChange={(e) => {
                                                const v = activos.find(a => a.id === e.target.value);
                                                setSelectedAsset(v);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    kilometraje_lectura: v?.kilometraje_actual || v?.horometro_actual || ''
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">-- Seleccione --</option>
                                            {activos.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    [{a.tipo_activo === 'maquinaria' ? 'MAQ' : 'VEH'}] {a.placa || a.id_interno} - {a.marca} {a.linea || a.modelo}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-bold">
                                            {selectedAsset?.tipo_activo === 'maquinaria' ? 'Horómetro Actual' : 'Kilometraje Actual'}
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.kilometraje_lectura}
                                            onChange={e => setFormData({ ...formData, kilometraje_lectura: e.target.value })}
                                            required
                                            min={selectedAsset?.kilometraje_actual || selectedAsset?.horometro_actual || 0}
                                        />
                                        {selectedAsset && (
                                            <Form.Text className="text-muted">
                                                Último: {Number(selectedAsset.kilometraje_actual || selectedAsset.horometro_actual || 0).toLocaleString()}
                                                {selectedAsset.tipo_activo === 'maquinaria' ? ' Horas' : ' Km'}
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* 1.5. INFORMACIÓN DE RUTA (SOLO VEHÍCULOS) (NUEVO) */}
                            {selectedAsset && selectedAsset.tipo_activo === 'vehiculo' && (
                                <div className="mb-4">
                                    <h5 className="mb-3 text-secondary border-bottom pb-2">🗺️ Información de Ruta</h5>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <Form.Label className="fw-bold">Origen / Punto de Partida</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: Base Principal"
                                                value={formData.ruta_origen}
                                                onChange={e => setFormData({ ...formData, ruta_origen: e.target.value })}
                                                required
                                            />
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Form.Label className="fw-bold">Destino / Lugar de Trabajo</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: Proyecto Tunel II"
                                                value={formData.ruta_destino}
                                                onChange={e => setFormData({ ...formData, ruta_destino: e.target.value })}
                                                required
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* 1.6. FOTOS DEL ACTIVO (NUEVO) */}
                            {selectedAsset && (
                                <div className="mb-4">
                                    <h5 className="mb-3 text-secondary border-bottom pb-2">📸 Registro Fotográfico</h5>

                                    <Row className="g-3">
                                        {[
                                            {
                                                label: 'Frente',
                                                src: selectedAsset.foto_frente || selectedAsset.foto_frontal || selectedAsset.imagen_frente
                                            },
                                            {
                                                label: 'Trasera',
                                                src: selectedAsset.foto_trasera || selectedAsset.foto_atras
                                            },
                                            {
                                                label: 'Izquierda',
                                                src: selectedAsset.foto_izquierda || selectedAsset.foto_lateral_izq || selectedAsset.foto_lat_izq
                                            },
                                            {
                                                label: 'Derecha',
                                                src: selectedAsset.foto_derecha || selectedAsset.foto_lateral_der || selectedAsset.foto_lat_der
                                            }
                                        ].map((foto, idx) => (
                                            <Col xs={6} md={3} key={idx}>
                                                <Card className="h-100 shadow-sm border-0">
                                                    <div style={{ height: '150px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} className="rounded-top">
                                                        {foto.src ? (
                                                            <img
                                                                src={foto.src}
                                                                alt={foto.label}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                                onClick={() => window.open(foto.src, '_blank')}
                                                            />
                                                        ) : (
                                                            <span className="text-muted small">Sin Foto</span>
                                                        )}
                                                    </div>
                                                    <Card.Footer className="bg-white text-center py-1 small fw-bold text-muted">
                                                        {foto.label}
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {/* 1.6. CONDICIONES DE SALUD Y OPERADOR (NUEVO) */}
                            {selectedAsset && (
                                <div className="mb-4">
                                    <h5 className="mb-3 text-secondary border-bottom pb-2">⚕️ Condiciones del Operador</h5>
                                    <Card className="border-0 shadow-sm p-3">
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Label className="fw-bold">Nombre del Conductor</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.operador_nombre}
                                                    onChange={e => setFormData({ ...formData, operador_nombre: e.target.value })}
                                                    required
                                                />
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label className="fw-bold">Cédula / ID</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.operador_cedula}
                                                    onChange={e => setFormData({ ...formData, operador_cedula: e.target.value })}
                                                    required
                                                    placeholder="Ingrese identificación"
                                                />
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label className="fw-bold">Estado de Salud</Form.Label>
                                                <Form.Select
                                                    value={formData.estado_salud}
                                                    onChange={e => setFormData({ ...formData, estado_salud: e.target.value })}
                                                >
                                                    <option value="Me siento bien">🟢 Me siento bien</option>
                                                    <option value="Me siento algo enfermo">🟡 Me siento algo enfermo</option>
                                                    <option value="Me siento muy enfermo">🔴 Me siento muy enfermo</option>
                                                </Form.Select>
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label className="fw-bold">Horas de Sueño (Anoche)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0" max="24"
                                                    value={formData.horas_sueno}
                                                    onChange={e => setFormData({ ...formData, horas_sueno: e.target.value })}
                                                    required
                                                    isInvalid={formData.horas_sueno !== '' && Number(formData.horas_sueno) <= 6}
                                                />
                                                <Form.Control.Feedback type="invalid" className="fw-bold">
                                                    ⚠️ ALERTA: Menos de 7 horas. Por seguridad NO DEBE CONDUCIR.
                                                </Form.Control.Feedback>
                                                {(formData.horas_sueno !== '' && Number(formData.horas_sueno) >= 7) && (
                                                    <Form.Text className="text-success fw-bold">✅ Descanso adecuado.</Form.Text>
                                                )}
                                            </Col>
                                            <Col md={12}>
                                                <Form.Label className="fw-bold d-block">¿Está consumiendo algún medicamento?</Form.Label>
                                                <Form.Check
                                                    inline label="No" name="meds" type="radio"
                                                    checked={formData.toma_medicamentos === 'No'}
                                                    onChange={() => setFormData({ ...formData, toma_medicamentos: 'No', nombre_medicamento: '' })}
                                                />
                                                <Form.Check
                                                    inline label="Sí" name="meds" type="radio"
                                                    checked={formData.toma_medicamentos === 'Si'}
                                                    onChange={() => setFormData({ ...formData, toma_medicamentos: 'Si' })}
                                                />

                                                {formData.toma_medicamentos === 'Si' && (
                                                    <div className="mt-2">
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="¿Cuál medicamento?"
                                                            value={formData.nombre_medicamento}
                                                            onChange={e => setFormData({ ...formData, nombre_medicamento: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card>
                                </div>
                            )}

                            {/* 2. TABLERO DE CONTROL (CRÍTICOS VENCIMIENTOS) */}
                            {selectedAsset && (
                                <div className="mb-4">
                                    <h5 className="mb-3 text-secondary border-bottom pb-2">🚦 Estado Documental y Mantenimiento</h5>
                                    <Row className="g-3">
                                        {[
                                            { id: 'doc_soat', title: selectedAsset.tipo_activo === 'maquinaria' ? 'Seguro / Póliza' : 'Seguro / SOAT', icon: <ClipboardCheck size={20} />, typeForForm: selectedAsset.tipo_activo === 'maquinaria' ? 'Renovación Póliza / Seguro' : 'Renovación SOAT' },
                                            { id: 'doc_tecno', title: selectedAsset.tipo_activo === 'maquinaria' ? 'Certificación' : 'Certificación / Tecno', icon: <ClipboardCheck size={20} />, typeForForm: selectedAsset.tipo_activo === 'maquinaria' ? 'Renovación Certificación / Tecno' : 'Renovación Tecnomecánica' },
                                            { id: 'nivel_aceite', title: 'Mantenimiento Prev.', icon: <Truck size={20} />, typeForForm: 'Mantenimiento Preventivo' }
                                        ].map((stat) => {
                                            const status = maintenanceStatus[stat.id];
                                            const isOk = status?.val === 'OK';

                                            return (
                                                <Col xs={12} md={4} key={stat.id}>
                                                    <Card
                                                        className={`h-100 border-${isOk ? 'success' : 'danger'} shadow-sm text-center position-relative overflow-hidden cursor-pointer`}
                                                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                        onClick={() => {
                                                            setMaintenanceTypeToAutoSelect(stat.typeForForm);
                                                            setShowMaintenanceModal(true);
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        {status ? (
                                                            <>
                                                                <div className={`position-absolute top-0 start-0 w-100 h-100 bg-${isOk ? 'success' : 'danger'}`} style={{ opacity: 0.1 }}></div>
                                                                <Card.Body className="position-relative z-1">
                                                                    <div className={`d-flex align-items-center justify-content-center gap-2 mb-2 text-${isOk ? 'success' : 'danger'}`}>
                                                                        {stat.icon}
                                                                        <strong className="text-uppercase">{stat.title}</strong>
                                                                    </div>
                                                                    <h5 className={`fw-bold my-2 text-${isOk ? 'success' : 'danger'}`}>
                                                                        {isOk ? <CheckCircle className="me-2" /> : <AlertTriangle className="me-2" />}
                                                                        {status.info}
                                                                    </h5>
                                                                    <Badge bg={isOk ? 'success' : 'danger'} className="mt-1 shadow-sm px-3 py-2 rounded-pill">
                                                                        {isOk ? 'VIGENTE' : 'VENCIDO'}
                                                                    </Badge>
                                                                    <div className="mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
                                                                        <small>Clic para actualizar</small>
                                                                    </div>
                                                                </Card.Body>
                                                            </>
                                                        ) : (
                                                            <Card.Body><div className="spinner-border spinner-border-sm text-secondary"></div></Card.Body>
                                                        )}
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </div>
                            )}



                            {/* 3. Checklist Manual */}
                            {selectedAsset && (
                                <>
                                    <Alert variant="secondary" className="mb-4">
                                        <Truck size={18} className="me-2" />
                                        Inspeccionando: <strong>{selectedAsset.placa || selectedAsset.id_interno}</strong> - Califique cada ítem.
                                    </Alert>

                                    {getActiveChecklist().map((cat, idx) => (
                                        <div key={idx} className="mb-4 border rounded p-3 bg-light">
                                            <h5 className="text-primary border-bottom pb-2 mb-3">{cat.category}</h5>
                                            <Row>
                                                {cat.items.map(item => {
                                                    // OMITIR ITEMS AUTOMÁTICOS YA MOSTRADOS ARRIBA SI EXISTEN EN EL CHECKLIST
                                                    // (Simple check for specific IDs managed above)
                                                    if (['doc_soat', 'doc_tecno', 'nivel_aceite'].includes(item.id)) return null;

                                                    return (
                                                        <Col xs={12} md={12} lg={6} key={item.id} className="mb-3">
                                                            <Card className={`h-100 border-${item.critical ? 'warning' : 'light'} shadow-sm`}>
                                                                <Card.Body className="p-2">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <span className="fw-bold small" style={{ lineHeight: '1.2', width: '60%' }}>
                                                                            {item.label}
                                                                            {item.critical && <Badge bg="danger" className="ms-1" style={{ fontSize: '0.6em' }}>CRÍTICO</Badge>}
                                                                        </span>

                                                                        <div className="d-flex gap-1" style={{ width: '40%', justifyContent: 'flex-end' }}>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'BUENO' ? 'success' : 'outline-success'}
                                                                                onClick={() => handleCheckChange(item.id, 'BUENO')}
                                                                                className="px-2 py-1"
                                                                                title="Bueno"
                                                                            >
                                                                                B
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'REGULAR' ? 'warning' : 'outline-warning'}
                                                                                onClick={() => handleCheckChange(item.id, 'REGULAR')}
                                                                                className="px-2 py-1"
                                                                                title="Regular"
                                                                            >
                                                                                R
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'MALO' ? 'danger' : 'outline-danger'}
                                                                                onClick={() => handleCheckChange(item.id, 'MALO')}
                                                                                className="px-2 py-1"
                                                                                title="Malo"
                                                                            >
                                                                                M
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'NA' ? 'secondary' : 'outline-secondary'}
                                                                                onClick={() => handleCheckChange(item.id, 'NA')}
                                                                                className="px-2 py-1"
                                                                                title="No Aplica"
                                                                            >
                                                                                N/A
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    )
                                                })}
                                            </Row>
                                        </div>
                                    ))}
                                    <Form.Group className="mb-4">
                                        <Form.Label>Observaciones Generales</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={formData.observaciones}
                                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                        />
                                    </Form.Group>

                                    <div className="d-grid gap-2">
                                        <Button size="lg" type="submit" variant="primary" disabled={loading}>
                                            {loading ? 'Guardando...' : 'Finalizar Inspección'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}

                    {/* Modal de Mantenimiento Rápido - MOVIDO AQUÍ PARA EVITAR NESTED FORMS */}
                    {activeTab === 'nueva' && showMaintenanceModal && selectedAsset && (
                        <div className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex justify-content-center overflow-auto" style={{ zIndex: 1050, paddingTop: '20px' }}>
                            <div className="container" style={{ maxWidth: '900px' }}>
                                <MantenimientoVehiculo
                                    vehiculo={selectedAsset}
                                    initialType={maintenanceTypeToAutoSelect}
                                    onHide={() => setShowMaintenanceModal(false)}
                                    show={true}
                                />
                            </div>
                        </div>
                    )}
                    {activeTab === 'historial' && (userRole === 'cliente' || userRole === 'admin') && (
                        <HistorialPreoperacionales
                            vehiculos={activos}
                            user={{ ...user, uid: dataScopeId }}
                            userRole={userRole}
                        />
                    )}

                    {activeTab === 'indicadores' && (userRole === 'cliente' || userRole === 'admin') && (
                        <IndicadoresPreoperacionales user={{ ...user, uid: dataScopeId }} inventario={activos} />
                    )}
                </Card.Body>
            </Card>

            {/* MODAL DE ALERTA ROJA (DATOS ATÍPICOS) */}
            <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered backdrop="static" keyboard={false}>
                <Modal.Header className="bg-danger text-white">
                    <Modal.Title className="fw-bold fs-5">
                        <AlertTriangle size={28} className="me-2" />
                        AlerTA DE DATO ATÍPICO DETECTADO
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-4">
                    <div className="mb-4 text-danger opacity-75">
                        <AlertTriangle size={64} />
                    </div>
                    <h4 className="fw-bold mb-3">¿Está seguro de este valor?</h4>
                    <p className="fs-5 mb-4">
                        Está intentando registrar una diferencia de <strong className="text-danger">{warningData?.delta?.toLocaleString()} {warningData?.unit}</strong>.
                    </p>
                    <div className="bg-light p-3 rounded text-start mb-4 border border-danger border-opacity-25">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Valor Anterior:</span>
                            <span className="fw-bold">{warningData?.current?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between border-top pt-2">
                            <span className="text-danger fw-bold">Nuevo Valor:</span>
                            <span className="fw-bold text-danger fs-5">{warningData?.newVal?.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="d-grid gap-2">
                        <Button variant="danger" size="lg" onClick={executeSave}>
                            SÍ, EL DATO ES CORRECTO (Confirmar)
                        </Button>
                        <Button variant="outline-secondary" size="lg" onClick={() => setShowWarningModal(false)}>
                            CANCELAR Y CORREGIR
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default InspeccionesPreoperacionalesMain;
