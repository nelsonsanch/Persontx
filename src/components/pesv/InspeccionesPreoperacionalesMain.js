import React, { useState, useEffect } from 'react';
import { Card, Nav, Button, Row, Col, Form, Badge, Table, Alert } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

// CONFIGURACIÓN DEL CHECKLIST (Actualizado según Imagen)
import { PREOP_CHECKLIST } from './inspeccionesConfig';
import DetalleInspeccionModal from './DetalleInspeccionModal';
import HistorialPreoperacionales from './HistorialPreoperacionales';
import IndicadoresPreoperacionales from './IndicadoresPreoperacionales';
import { Eye, BarChart2 } from 'lucide-react';

const InspeccionesPreoperacionalesMain = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('nueva');
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estado del Formulario
    const [formData, setFormData] = useState({
        kilometraje_lectura: '',
        observaciones: ''
    });
    const [checklistResponses, setChecklistResponses] = useState({});

    // Cargar Vehículos
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'inventarios'),
            where('categoria', '==', 'vehiculos'),
            where('clienteId', '==', user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setVehiculos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    // Estado para items automáticos
    const [maintenanceStatus, setMaintenanceStatus] = useState({});

    // Cargar Estado de Mantenimientos (Auto-Checks)
    useEffect(() => {
        if (!selectedVehicle) {
            setMaintenanceStatus({});
            return;
        }

        const fetchMaintenanceStatus = async () => {
            // NOTE: Removed orderBy temporarily to avoid "Missing Index" silence if composite index is missing.
            // Sorting client-side is safe for this volume of data.
            const q = query(
                collection(db, 'mantenimientos_vehiculos'),
                where('vehiculo_id', '==', selectedVehicle.id)
            );

            const unsubscribe = onSnapshot(q, (docs) => {
                const registrosRaw = docs.docs.map(d => d.data());
                // Sort client-side by date desc
                const registros = registrosRaw.sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

                const status = {};
                const currentKm = Number(selectedVehicle.kilometraje_actual) || 0;

                // 1. SOAT
                const soatReg = registros.find(r => r.tipo_evento && r.tipo_evento.includes('SOAT'));
                if (soatReg && soatReg.proximo_vencimiento_fecha) {
                    const days = Math.ceil((new Date(soatReg.proximo_vencimiento_fecha) - new Date()) / (1000 * 60 * 60 * 24));
                    status.doc_soat = {
                        val: days > 0 ? 'OK' : 'FALLO',
                        info: days > 0 ? `Vence en ${days} días` : `Vencido hace ${Math.abs(days)} días`,
                        critical: days <= 0
                    };
                } else {
                    status.doc_soat = { val: 'FALLO', info: 'No hay registro de SOAT', critical: true };
                }

                // 2. Tecnomecánica
                const tecnoReg = registros.find(r => r.tipo_evento && r.tipo_evento.includes('Tecno'));
                if (tecnoReg && tecnoReg.proximo_vencimiento_fecha) {
                    const days = Math.ceil((new Date(tecnoReg.proximo_vencimiento_fecha) - new Date()) / (1000 * 60 * 60 * 24));
                    status.doc_tecno = {
                        val: days > 0 ? 'OK' : 'FALLO',
                        info: days > 0 ? `Vence en ${days} días` : `Vencido hace ${Math.abs(days)} días`,
                        critical: days <= 0
                    };
                } else {
                    status.doc_tecno = { val: 'FALLO', info: 'No hay registro de Tecno', critical: true };
                }

                // 3. Aceite (Case insensitive "aceite")
                const aceiteReg = registros.find(r => r.tipo_evento && r.tipo_evento.toLowerCase().includes('aceite'));

                if (!aceiteReg) {
                    status.nivel_aceite = { val: 'FALLO', info: 'No hay registro de Aceite', critical: true };
                } else if (!aceiteReg.proximo_cambio_kilometraje) {
                    status.nivel_aceite = { val: 'FALLO', info: 'Registro de Aceite sin Kilometraje Meta', critical: true };
                } else {
                    const target = Number(aceiteReg.proximo_cambio_kilometraje);
                    const remaining = target - currentKm;
                    status.nivel_aceite = {
                        val: remaining > 0 ? 'OK' : 'FALLO',
                        info: remaining > 0 ? `Faltan ${remaining.toLocaleString()} km` : `Pasado por ${Math.abs(remaining).toLocaleString()} km`,
                        critical: remaining <= -500 // Crítico solo si se pasa por 500km (Vencido)
                    };
                }

                setMaintenanceStatus(status);

                // Auto-fill checklist responses
                setChecklistResponses(prev => ({
                    ...prev,
                    doc_soat: status.doc_soat?.val || 'FALLO',
                    doc_tecno: status.doc_tecno?.val || 'FALLO',
                    nivel_aceite: status.nivel_aceite?.val || 'FALLO'
                }));
            });

            return () => unsubscribe(); // Unsubscribe logic if inside useEffect return
        };

        fetchMaintenanceStatus();
    }, [selectedVehicle]);

    // Manejadores
    const handleCheckChange = (itemId, value) => {
        setChecklistResponses(prev => ({ ...prev, [itemId]: value }));
    };

    const calculateResult = () => {
        let criticalFail = false;
        let totalPass = 0;
        let totalItems = 0;

        // Verificar críticos automáticos primero
        if (maintenanceStatus.doc_soat?.critical) criticalFail = true;
        if (maintenanceStatus.doc_tecno?.critical) criticalFail = true;
        if (maintenanceStatus.nivel_aceite?.critical) criticalFail = true;

        PREOP_CHECKLIST.forEach(cat => {
            cat.items.forEach(item => {
                const response = checklistResponses[item.id];

                // Si es "No Aplica", no cuenta para el promedio ni para fallos críticos
                if (response === 'NA') return;

                totalItems++;
                // Score metric: Bueno=1, Regular=0.5, Malo=0
                if (response === 'BUENO') totalPass += 1;
                if (response === 'REGULAR') totalPass += 0.5;

                // Logic Comparison: Is 'Malo' a critical failure?
                if (item.critical && response === 'MALO') {
                    criticalFail = true;
                }
            });
        });

        const maxScore = totalItems > 0 ? totalItems : 1; // Evitar división por cero
        return { criticalFail, score: (totalPass / maxScore) * 100 };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) return toast.error("Seleccione un vehículo");

        const { criticalFail, score } = calculateResult();
        const resultadoGlobal = criticalFail ? "RECHAZADO" : "APROBADO";

        if (criticalFail) {
            if (!window.confirm("⚠️ ATENCIÓN: Esta inspección tiene fallos en ítems CRÍTICOS (o vencimientos administrativos). El vehículo NO DEBE SALIR. ¿Desea registrar el RECHAZO?")) {
                return;
            }
        }

        setLoading(true);
        try {
            // 1. Guardar Inspección
            await addDoc(collection(db, 'inspecciones_preoperacionales'), {
                fecha_registro: new Date().toISOString(),
                clienteId: user.uid,
                usuario_id: user.uid,
                usuario_email: user.email,
                vehiculo_id: selectedVehicle.id,
                vehiculo_placa: selectedVehicle.placa,
                vehiculo_marca: selectedVehicle.marca,
                kilometraje_lectura: Number(formData.kilometraje_lectura),
                checklist: checklistResponses,
                maintenance_status_snapshot: maintenanceStatus, // Guardar snapshot del estado automático
                resultado_global: resultadoGlobal,
                score: Math.round(score),
                observaciones: formData.observaciones,
                items_criticos_fallidos: criticalFail
            });

            // 2. Actualizar Kilometraje del Vehículo
            const currentKm = Number(selectedVehicle.kilometraje_actual) || 0;
            const newKm = Number(formData.kilometraje_lectura);

            if (newKm > currentKm) {
                await updateDoc(doc(db, 'inventarios', selectedVehicle.id), {
                    kilometraje_actual: newKm, // Esto disparará la actualización de alertas en el Dashboard principal si se usa
                    fecha_ultima_lectura: new Date().toISOString()
                });
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
        setSelectedVehicle(null);
        setFormData({ kilometraje_lectura: '', observaciones: '' });
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
                        <Nav.Item>
                            <Nav.Link eventKey="historial" className="fw-bold">Historial Completo</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="indicadores" className="fw-bold text-success">
                                <BarChart2 size={16} className="me-1 mb-1" />
                                Indicadores
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body className="p-3 p-md-4">
                    {activeTab === 'nueva' && (
                        <Form onSubmit={handleSubmit}>
                            {/* 1. Selección de Vehículo */}
                            <Row className="mb-4">
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-bold">Seleccionar Vehículo</Form.Label>
                                        <Form.Select
                                            value={selectedVehicle?.id || ''}
                                            onChange={(e) => {
                                                const v = vehiculos.find(v => v.id === e.target.value);
                                                setSelectedVehicle(v);
                                                setFormData(prev => ({ ...prev, kilometraje_lectura: v?.kilometraje_actual || '' }));
                                            }}
                                            required
                                        >
                                            <option value="">-- Seleccione --</option>
                                            {vehiculos.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.placa} - {v.marca} {v.linea}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-bold">Kilometraje Actual</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.kilometraje_lectura}
                                            onChange={e => setFormData({ ...formData, kilometraje_lectura: e.target.value })}
                                            required
                                            min={selectedVehicle?.kilometraje_actual || 0}
                                        />
                                        {selectedVehicle && (
                                            <Form.Text className="text-muted">
                                                Último: {Number(selectedVehicle.kilometraje_actual || 0).toLocaleString()} km
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* 2. TABLERO DE CONTROL (CRÍTICOS VENCIMIENTOS) */}
                            {selectedVehicle && (
                                <div className="mb-4">
                                    <h5 className="mb-3 text-secondary border-bottom pb-2">🚦 Estado Documental y Mantenimiento</h5>
                                    <Row className="g-3">
                                        {[
                                            { id: 'doc_soat', title: 'SOAT', icon: <ClipboardCheck size={20} /> },
                                            { id: 'doc_tecno', title: 'Tecnomecánica', icon: <ClipboardCheck size={20} /> },
                                            { id: 'nivel_aceite', title: 'Cambio de Aceite', icon: <Truck size={20} /> }
                                        ].map((stat) => {
                                            const status = maintenanceStatus[stat.id];
                                            const isOk = status?.val === 'OK';

                                            return (
                                                <Col xs={12} md={4} key={stat.id}>
                                                    <Card className={`h-100 border-${isOk ? 'success' : 'danger'} shadow-sm text-center position-relative overflow-hidden`}>
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
                            {selectedVehicle && (
                                <>
                                    <Alert variant="secondary" className="mb-4">
                                        <Truck size={18} className="me-2" />
                                        Inspeccionando: <strong>{selectedVehicle.placa}</strong> - Califique cada ítem.
                                    </Alert>

                                    {PREOP_CHECKLIST.map((cat, idx) => (
                                        <div key={idx} className="mb-4 border rounded p-3 bg-light">
                                            <h5 className="text-primary border-bottom pb-2 mb-3">{cat.category}</h5>
                                            <Row>
                                                {cat.items.map(item => {
                                                    // OMITIR ITEMS AUTOMÁTICOS YA MOSTRADOS ARRIBA
                                                    if (item.auto) return null;

                                                    // ITEM MANUAL NORMAL
                                                    return (
                                                        <Col xs={12} md={6} lg={4} key={item.id} className="mb-3">
                                                            <Card className={`h-100 border-${item.critical ? 'warning' : 'light'} shadow-sm`}>
                                                                <Card.Body className="p-2">
                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                        <span className="fw-bold small" style={{ lineHeight: '1.2' }}>
                                                                            {item.label}
                                                                            {item.critical && <Badge bg="danger" className="ms-1" style={{ fontSize: '0.6em' }}>CRÍTICO</Badge>}
                                                                        </span>
                                                                    </div>
                                                                    <div className="d-flex flex-column gap-2">
                                                                        <div className="d-flex flex-wrap gap-2 w-100">
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'BUENO' ? 'success' : 'outline-success'}
                                                                                onClick={() => handleCheckChange(item.id, 'BUENO')}
                                                                                className={`flex-grow-1 ${checklistResponses[item.id] === 'BUENO' ? 'text-white' : ''}`}
                                                                                style={{ minWidth: '70px' }}
                                                                            >
                                                                                Bueno
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'REGULAR' ? 'warning' : 'outline-warning'}
                                                                                onClick={() => handleCheckChange(item.id, 'REGULAR')}
                                                                                className={`flex-grow-1 ${checklistResponses[item.id] === 'REGULAR' ? 'text-dark' : ''}`}
                                                                                style={{ minWidth: '70px' }}
                                                                            >
                                                                                Regular
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'MALO' ? 'danger' : 'outline-danger'}
                                                                                onClick={() => handleCheckChange(item.id, 'MALO')}
                                                                                className={`flex-grow-1 ${checklistResponses[item.id] === 'MALO' ? 'text-white' : ''}`}
                                                                                style={{ minWidth: '70px' }}
                                                                            >
                                                                                Malo
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'NA' ? 'secondary' : 'outline-secondary'}
                                                                                onClick={() => handleCheckChange(item.id, 'NA')}
                                                                                className={`flex-grow-1 ${checklistResponses[item.id] === 'NA' ? 'text-white' : ''}`}
                                                                                style={{ minWidth: '50px' }}
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
                    {activeTab === 'historial' && (
                        <HistorialPreoperacionales vehiculos={vehiculos} user={user} />
                    )}

                    {activeTab === 'indicadores' && (
                        <IndicadoresPreoperacionales user={user} />
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};



export default InspeccionesPreoperacionalesMain;
