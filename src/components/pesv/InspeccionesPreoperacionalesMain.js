import React, { useState, useEffect } from 'react';
import { Card, Nav, Button, Row, Col, Form, Badge, Table, Alert } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

// CONFIGURACIÓN DEL CHECKLIST (Actualizado según Imagen)
const PREOP_CHECKLIST = [
    {
        category: "1. Estado de Presentación",
        items: [
            { id: "pres_aseo_interno", label: "1.1 Aseo Interno", critical: false },
            { id: "pres_aseo_externo", label: "1.2 Aseo Externo", critical: false },
            { id: "pres_latas", label: "1.3 Latas", critical: false },
            { id: "pres_pintura", label: "1.4 Pintura", critical: false },
        ]
    },
    {
        category: "2. Estado de Comodidad",
        items: [
            { id: "com_aire", label: "2.1 Aire Acondicionado", critical: false },
            { id: "com_silleteria", label: "2.2 Silletería (Anclaje, estado)", critical: false },
            { id: "com_encendedor", label: "2.3 Encendedor", critical: false },
            { id: "com_luz_interior", label: "2.4 Luz Interior o de techo", critical: false },
        ]
    },
    {
        category: "3. Niveles y pérdidas de líquidos",
        items: [
            { id: "liq_nivel_aceite", label: "3.1 Nivel de Aceite de motor", critical: true },
            { id: "liq_nivel_frenos", label: "3.2 Nivel de liquido de frenos", critical: true },
            { id: "liq_nivel_agua_rad", label: "3.3 Nivel de agua del radiador", critical: true },
            { id: "liq_nivel_agua_bat", label: "3.4 Nivel de agua de la batería", critical: false },
            { id: "liq_nivel_hidraulico", label: "3.5 Nivel de aceite hidráulico", critical: false },
            { id: "liq_fuga_acpm", label: "3.6 Fugas de Combustible", critical: true },
            { id: "liq_fuga_agua", label: "3.7 Fugas de Agua", critical: true },
            { id: "liq_fuga_transmision", label: "3.8 Fugas de Aceite de transmisión", critical: true },
            { id: "liq_fuga_caja", label: "3.9 Fuga aceite de caja", critical: true },
            { id: "liq_fuga_frenos", label: "3.10 Fugas de líquidos de frenos", critical: true },
        ]
    },
    {
        category: "4. Tablero de Control",
        items: [
            { id: "tab_instrumentos", label: "4.1 Instrumentos", critical: false },
            { id: "tab_luces_tablero", label: "4.2 Luces de Tablero", critical: false },
            { id: "tab_nivel_combustible", label: "4.3 Nivel de Combustible", critical: false },
            { id: "tab_odometro", label: "4.4 Odómetro", critical: false },
            { id: "tab_pito", label: "4.5 Pito", critical: true },
            { id: "tab_tacometro", label: "4.6 Tacómetro", critical: false },
            { id: "tab_velocimetro", label: "4.7 Velocímetro", critical: false },
            { id: "tab_ind_aceite", label: "4.8 Indicador de Aceite", critical: true },
            { id: "tab_ind_temp", label: "4.9 Indicador de Temperatura", critical: true },
        ]
    },
    {
        category: "5. Seguridad Pasiva",
        items: [
            { id: "seg_cinturones", label: "5.1 Cinturones de Seguridad", critical: true },
            { id: "seg_airbags", label: "5.2 Airbags", critical: true },
            { id: "seg_chasis", label: "5.3 Chasis y carrocería", critical: false },
            { id: "seg_cristales", label: "5.4 Cristales (Vidrios)", critical: false },
            { id: "seg_apoyacabezas", label: "5.5 Apoyacabezas", critical: false },
            { id: "seg_espejo_der", label: "5.6 Espejo Lateral Derecho", critical: true },
            { id: "seg_espejo_izq", label: "5.7 Espejo Lateral Izquierdo", critical: true },
            { id: "seg_espejo_retro", label: "5.8 Espejo Retrovisor", critical: true },
        ]
    },
    {
        category: "6. Seguridad Activa",
        items: [
            { id: "act_direccion", label: "6.1 Estado de la Dirección", critical: true },
            { id: "act_susp_del", label: "6.2 Estado Suspensión Delantera, Amortiguadores", critical: false },
            { id: "act_susp_tras", label: "6.3 Estado suspensión Trasera, Amortiguadores", critical: false },
            { id: "act_parabrisas", label: "6.4 Estado Parabrisas (Vidrio, Limpiabrisas, Lava)", critical: true },
            { id: "act_luces_control", label: "6.5 Estado de Luces (Altas, Bajas, Stop, Direccionales)", critical: true },
            { id: "act_llantas", label: "6.6 Estado Llantas (Labrado, Presión, Repuesto)", critical: true },
            { id: "act_frenos", label: "6.7 Frenos (Estado, Mano, Pastillas)", critical: true },
        ]
    },
    {
        category: "7. Otros",
        items: [
            { id: "otr_elec", label: "7.1 Instalaciones eléctricas", critical: false },
            { id: "otr_clutch", label: "7.2 Clutch", critical: true },
            { id: "otr_exosto", label: "7.3 Exosto", critical: false },
            { id: "otr_alarma_reversa", label: "7.4 Alarma Sonora de Reversa", critical: true },
            { id: "otr_salto_cambios", label: "7.5 Salto de cambios", critical: false },
            { id: "otr_cambios_suaves", label: "7.6 Cambios suaves", critical: false },
            { id: "otr_guaya_acel", label: "7.7 Guaya del acelerador", critical: true },
            { id: "otr_embrague", label: "7.8 Sistema de embrague", critical: true },
            { id: "otr_encendido", label: "7.9 Encendido", critical: false },
            { id: "otr_sincro", label: "7.10 Sincronización", critical: false },
            { id: "otr_placas", label: "7.11 Placas", critical: true },
        ]
    },
    {
        category: "8. Equipo de Carretera",
        items: [
            { id: "eq_gato", label: "8.1 Gato con capacidad elevar vehículo", critical: true },
            { id: "eq_chaleco", label: "8.2 Chaleco reflectivo", critical: false },
            { id: "eq_tacos", label: "8.3 Tacos para bloquear vehículo (2)", critical: true },
            { id: "eq_senales", label: "8.4 Señales de carretera triangulares (2)", critical: true },
            { id: "eq_guantes", label: "8.5 Guantes de trabajo", critical: false },
            { id: "eq_cruceta", label: "8.6 Cruceta", critical: true },
            { id: "eq_cables", label: "8.7 Cables de iniciar", critical: false },
            { id: "eq_extintor", label: "8.8 Extintor Vigente", critical: true },
            { id: "eq_conos", label: "8.9 Conos reflectivos (2)", critical: false },
            { id: "eq_linterna", label: "8.10 Linterna recargable", critical: false },
            { id: "eq_herramientas", label: "8.11 Caja de herramientas básica", critical: false },
        ]
    },
    {
        category: "9. Botiquín",
        items: [
            { id: "bot_suero", label: "9.1 Suero fisiológico/Solución salina (2)", critical: false },
            { id: "bot_vendajes_elas", label: "9.2 Vendajes elásticos (2)", critical: false },
            { id: "bot_guantes", label: "9.3 Guantes quirúrgicos (4 juegos)", critical: false },
            { id: "bot_vendas_alg", label: "9.4 Vendas de algodón (1 paq)", critical: false },
            { id: "bot_copitos", label: "9.5 Aplicadores/Copitos (10)", critical: false },
            { id: "bot_vendajes_tri", label: "9.6 Vendajes triangulares (3)", critical: false },
            { id: "bot_apositos", label: "9.7 Apósitos o toallas (4)", critical: false },
            { id: "bot_compresas", label: "9.8 Compresas (2)", critical: false },
            { id: "bot_mascarilla", label: "9.9 Mascarilla RCP", critical: true },
            { id: "bot_tijera", label: "9.10 Tijera de trauma", critical: false },
            { id: "bot_gasa", label: "9.11 Paquetes de gasa (4)", critical: false },
            { id: "bot_alcohol", label: "9.12 Alcohol antiséptico", critical: false },
            { id: "bot_micropore", label: "9.13 Cinta micropore/Esparadrapo", critical: false },
            { id: "bot_inmov_inf", label: "9.15 Inmovilizadores ext. inferiores (2)", critical: false },
            { id: "bot_inmov_sup", label: "9.16 Inmovilizadores ext. superiores (2)", critical: false },
            { id: "bot_curitas", label: "9.17 Curitas (10)", critical: false },
            { id: "bot_tapabocas", label: "9.18 Tapabocas (10)", critical: false },
            { id: "bot_termometro", label: "9.19 Termómetro", critical: false },
            { id: "bot_libreta", label: "9.20 Libreta y Lápiz", critical: false },
            { id: "bot_manual", label: "9.23 Manual primeros auxilios", critical: false },
            { id: "bot_inmov_cerv", label: "9.24 Inmovilizador cervical", critical: true },
        ]
    }
];

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
                    </Nav>
                </Card.Header>
                <Card.Body className="p-3 p-md-4">
                    {activeTab === 'nueva' ? (
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
                                                                        {/* GRUPO DE BOTONES VERTICAL PARA MÓVIL / HORIZONTAL ORDENADO */}
                                                                        <div className="btn-group w-100" role="group">
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'BUENO' ? 'success' : 'outline-success'}
                                                                                onClick={() => handleCheckChange(item.id, 'BUENO')}
                                                                                className={checklistResponses[item.id] === 'BUENO' ? 'text-white' : ''}
                                                                            >
                                                                                Bueno
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'REGULAR' ? 'warning' : 'outline-warning'}
                                                                                onClick={() => handleCheckChange(item.id, 'REGULAR')}
                                                                                className={checklistResponses[item.id] === 'REGULAR' ? 'text-dark' : ''}
                                                                            >
                                                                                Regular
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'MALO' ? 'danger' : 'outline-danger'}
                                                                                onClick={() => handleCheckChange(item.id, 'MALO')}
                                                                                className={checklistResponses[item.id] === 'MALO' ? 'text-white' : ''}
                                                                            >
                                                                                Malo
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={checklistResponses[item.id] === 'NA' ? 'secondary' : 'outline-secondary'}
                                                                                onClick={() => handleCheckChange(item.id, 'NA')}
                                                                                className={checklistResponses[item.id] === 'NA' ? 'text-white' : ''}
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
                    ) : (
                        <HistorialPreoperacionales vehiculos={vehiculos} user={user} />
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente simple para el historial interno
const HistorialPreoperacionales = ({ vehiculos, user }) => {
    const [registros, setRegistros] = useState([]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'inspecciones_preoperacionales'),
            where('clienteId', '==', user.uid),
            orderBy('fecha_registro', 'desc') // Requiere índice compuesto, si falla, quitar orderBy
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRegistros(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error("Error historial (posible indice faltante):", err);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="table-responsive">
            <Table hovered striped className="align-middle">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Vehículo</th>
                        <th>Inspector</th>
                        <th>Km</th>
                        <th>Resultado</th>
                        <th>Detalle</th>
                    </tr>
                </thead>
                <tbody>
                    {registros.map(reg => (
                        <tr key={reg.id}>
                            <td>{new Date(reg.fecha_registro).toLocaleString()}</td>
                            <td>{reg.vehiculo_placa}</td>
                            <td>{reg.usuario_email}</td>
                            <td>{reg.kilometraje_lectura?.toLocaleString()}</td>
                            <td>
                                <Badge bg={reg.resultado_global === 'APROBADO' ? 'success' : 'danger'}>
                                    {reg.resultado_global}
                                </Badge>
                            </td>
                            <td>
                                <small className="text-muted">{reg.observaciones || '-'}</small>
                            </td>
                        </tr>
                    ))}
                    {registros.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center p-4">No hay inspecciones registradas.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}

export default InspeccionesPreoperacionalesMain;
