import React, { useState, useEffect } from 'react';
import { Card, Nav, Button, Row, Col, Form, Badge, Table, Alert } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

// CONFIGURACIÓN DEL CHECKLIST (Basado en la imagen)
const PREOP_CHECKLIST = [
    {
        category: "Documentos",
        items: [
            { id: "doc_licencia_transito", label: "Licencia de Tránsito (Propiedad)", critical: true },
            { id: "doc_soat", label: "SOAT Vigente", critical: true },
            { id: "doc_tecno", label: "Revisión Técnico-Mecánica", critical: true },
            { id: "doc_licencia_conduccion", label: "Licencia de Conducción", critical: true },
            { id: "doc_cedula", label: "Cédula de Ciudadanía", critical: true },
        ]
    },
    {
        category: "Luces",
        items: [
            { id: "luces_externas", label: "Luces Externas (Altas/Bajas/Stop)", critical: true },
            { id: "luces_internas", label: "Luces Internas", critical: false },
            { id: "luces_direccionales", label: "Direccionales", critical: true },
        ]
    },
    {
        category: "Llantas",
        items: [
            { id: "llantas_estado", label: "Estado General de Llantas", critical: true },
            { id: "llanta_repuesto", label: "Llanta de Repuesto", critical: true },
            { id: "presion_llantas", label: "Presión de Aire", critical: false },
        ]
    },
    {
        category: "Fluidos",
        items: [
            { id: "nivel_aceite", label: "Nivel de Aceite Motor", critical: true },
            { id: "nivel_frenos", label: "Líquido de Frenos", critical: true },
            { id: "nivel_refrigerante", label: "Líquido Refrigerante", critical: true },
            { id: "nivel_limpiabrisas", label: "Líquido Limpiabrisas", critical: false },
        ]
    },
    {
        category: "Seguridad y Equipo",
        items: [
            { id: "cinturones", label: "Cinturones de Seguridad", critical: true },
            { id: "espejos", label: "Espejos Retrovisores", critical: true },
            { id: "limpiabrisas_func", label: "Funcionamiento Limpiabrisas", critical: true },
            { id: "equipo_carretera", label: "Equipo de Carretera Completo", critical: false },
            { id: "extintor", label: "Extintor Vigente", critical: true },
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

    // Manejadores
    const handleCheckChange = (itemId, value) => {
        setChecklistResponses(prev => ({ ...prev, [itemId]: value }));
    };

    const calculateResult = () => {
        let criticalFail = false;
        let totalPass = 0;
        let totalItems = 0;

        PREOP_CHECKLIST.forEach(cat => {
            cat.items.forEach(item => {
                const response = checklistResponses[item.id];
                totalItems++;
                if (response === 'OK') totalPass++;
                if (item.critical && response === 'FALLO') {
                    criticalFail = true;
                }
            });
        });

        return { criticalFail, score: (totalPass / totalItems) * 100 };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) return toast.error("Seleccione un vehículo");

        const { criticalFail, score } = calculateResult();
        const resultadoGlobal = criticalFail ? "RECHAZADO" : "APROBADO";

        if (criticalFail) {
            if (!window.confirm("⚠️ ATENCIÓN: Esta inspección tiene fallos en ítems CRÍTICOS. El vehículo NO DEBE SALIR. ¿Desea registrar el RECHAZO?")) {
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
                resultado_global: resultadoGlobal,
                score: Math.round(score),
                observaciones: formData.observaciones,
                items_criticos_fallidos: criticalFail
            });

            // 2. Actualizar Kilometraje del Vehículo (Solo si es mayor al actual y APROBADO o RECHAZADO, bueno realmente el odometro avanza igual)
            // Se actualiza si el kilometraje ingresado es mayor al actual registrado
            const currentKm = Number(selectedVehicle.kilometraje_actual) || 0;
            const newKm = Number(formData.kilometraje_lectura);

            if (newKm > currentKm) {
                await updateDoc(doc(db, 'inventarios', selectedVehicle.id), {
                    kilometraje_actual: newKm,
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
        setActiveTab('historial'); // Opcional: ir al historial
    };

    return (
        <div className="container-fluid fade-in p-4">
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
                <Card.Body className="p-4">
                    {activeTab === 'nueva' ? (
                        <Form onSubmit={handleSubmit}>
                            {/* 1. Selección de Vehículo */}
                            <Row className="mb-4">
                                <Col md={6}>
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
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold">Kilometraje Actual (Odómetro)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.kilometraje_lectura}
                                            onChange={e => setFormData({ ...formData, kilometraje_lectura: e.target.value })}
                                            required
                                            min={selectedVehicle?.kilometraje_actual || 0}
                                        />
                                        {selectedVehicle && (
                                            <Form.Text className="text-muted">
                                                Último registrado: {Number(selectedVehicle.kilometraje_actual || 0).toLocaleString()} km
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* 2. Checklist */}
                            {selectedVehicle && (
                                <>
                                    <Alert variant="info" className="mb-4">
                                        <Truck size={18} className="me-2" />
                                        Inspeccionando: <strong>{selectedVehicle.placa}</strong> - Marque el estado de cada ítem.
                                    </Alert>

                                    {PREOP_CHECKLIST.map((cat, idx) => (
                                        <div key={idx} className="mb-4 border rounded p-3 bg-light">
                                            <h5 className="text-primary border-bottom pb-2 mb-3">{cat.category}</h5>
                                            <Row>
                                                {cat.items.map(item => (
                                                    <Col md={6} lg={4} key={item.id} className="mb-3">
                                                        <Card className={`h-100 border-${item.critical ? 'warning' : 'light'} shadow-sm`}>
                                                            <Card.Body className="p-2">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <span className="fw-bold small" style={{ lineHeight: '1.2' }}>
                                                                        {item.label}
                                                                        {item.critical && <Badge bg="danger" className="ms-1" style={{ fontSize: '0.6em' }}>CRÍTICO</Badge>}
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex gap-2 justify-content-center">
                                                                    <Button
                                                                        size="sm"
                                                                        variant={checklistResponses[item.id] === 'OK' ? 'success' : 'outline-secondary'}
                                                                        onClick={() => handleCheckChange(item.id, 'OK')}
                                                                        className="flex-grow-1"
                                                                    >
                                                                        OK
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant={checklistResponses[item.id] === 'FALLO' ? 'danger' : 'outline-secondary'}
                                                                        onClick={() => handleCheckChange(item.id, 'FALLO')}
                                                                        className="flex-grow-1"
                                                                    >
                                                                        FALLO
                                                                    </Button>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
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
