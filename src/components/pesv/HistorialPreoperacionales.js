import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Eye, Search, Filter, Download, Edit } from 'lucide-react';
import DetalleInspeccionModal from './DetalleInspeccionModal';
import { updateDoc, doc, limit, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const HistorialPreoperacionales = ({ vehiculos, user, userRole }) => {
    const [registros, setRegistros] = useState([]);
    const [filteredRegistros, setFilteredRegistros] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        vehicleId: '',
        status: '', // '' | 'APROBADO' | 'RECHAZADO'
        inspector: ''
    });

    // 1. Fetch Initial Data (Load last 30 days by default could be an optimization, but loading all for now for client-side filtering)
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'inspecciones_preoperacionales'),
            where('clienteId', '==', user.uid),
            orderBy('fecha_registro', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setRegistros(data);
            setFilteredRegistros(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching history:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Apply Filters
    useEffect(() => {
        let result = registros;

        // Filter by Date Range
        if (filters.startDate) {
            result = result.filter(r => new Date(r.fecha_registro) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(r => new Date(r.fecha_registro) <= end);
        }

        // Filter by Vehicle
        if (filters.vehicleId) {
            result = result.filter(r => r.vehiculo_id === filters.vehicleId);
        }

        // Filter by Status
        if (filters.status) {
            result = result.filter(r => r.resultado_global === filters.status);
        }

        // Filter by Inspector (Email)
        if (filters.inspector) {
            result = result.filter(r => r.usuario_email && r.usuario_email.toLowerCase().includes(filters.inspector.toLowerCase()));
        }

        setFilteredRegistros(result);
    }, [filters, registros]);

    const handleViewDetail = (inspection) => {
        setSelectedInspection(inspection);
        setShowModal(true);
    };

    // Función de Corrección Administrativa (Solo Admins)
    const handleEditUsage = async (inspection) => {
        if (userRole !== 'admin' && user?.email !== 'nelsonsr.1983@gmail.com') return;

        const currentVal = inspection.kilometraje_lectura || 0;
        const newValStr = window.prompt(`✏️ CORRECCIÓN ADMINISTRATIVA:\n\nIngrese el nuevo valor de Kilometraje/Horómetro para esta inspección (Fecha: ${new Date(inspection.fecha_registro).toLocaleDateString()}).\n\nValor Actual: ${currentVal}`, currentVal);

        if (newValStr === null) return; // Cancelado
        const newVal = Number(newValStr);

        if (isNaN(newVal) || newVal < 0) {
            return toast.error("Valor inválido.");
        }

        if (newVal === currentVal) return;

        try {
            // 1. Actualizar el registro de inspección
            await updateDoc(doc(db, 'inspecciones_preoperacionales', inspection.id), {
                kilometraje_lectura: newVal,
                lectura_uso: newVal // Asegurar compatibilidad
            });

            toast.success("Registro corregido exitosamente.");

            // 2. Verificar si es la ÚLTIMA inspección de este vehículo para corregir el Activo
            // Consultamos la última inspección registrada para este vehículo
            const qLast = query(
                collection(db, 'inspecciones_preoperacionales'),
                where('vehiculo_id', '==', inspection.vehiculo_id),
                orderBy('fecha_registro', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(qLast);
            if (!snapshot.empty) {
                const lastInsp = snapshot.docs[0].data();

                // Si la inspección que acabamos de editar ES la última (o tiene la misma fecha/ID)
                if (snapshot.docs[0].id === inspection.id) {
                    // Actualizamos el inventario con el valor corregido
                    const assetRef = doc(db, 'inventarios', inspection.vehiculo_id);
                    const isMachinery = inspection.tipo_activo === 'maquinaria';

                    const updateData = isMachinery
                        ? { horometro_actual: newVal }
                        : { kilometraje_actual: newVal };

                    await updateDoc(assetRef, updateData);
                    toast.info("Estado del vehículo actualizado automáticamente (Rollback).");
                }
            }

        } catch (error) {
            console.error("Error corrigiendo uso:", error);
            toast.error("Error al corregir el registro.");
        }
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            vehicleId: '',
            status: '',
            inspector: ''
        });
    };

    return (
        <div className="fade-in">
            {/* Filter Bar */}
            <Card className="mb-4 shadow-sm border-0 bg-light">
                <Card.Body className="p-3">
                    <Row className="g-3 align-items-end">
                        <Col xs={12} md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">Desde</Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={filters.startDate}
                                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">Hasta</Form.Label>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={filters.endDate}
                                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">Estado</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={filters.status}
                                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">-- Todos --</option>
                                    <option value="APROBADO">Aprobados</option>
                                    <option value="RECHAZADO">Rechazados</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold text-secondary">Vehículo</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={filters.vehicleId}
                                    onChange={e => setFilters({ ...filters, vehicleId: e.target.value })}
                                >
                                    <option value="">-- Todos --</option>
                                    {vehiculos.map(v => (
                                        <option key={v.id} value={v.id}>{v.placa}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        {/* Second Row of Filters */}
                        <Col xs={12} md={3}>
                            <InputGroup size="sm">
                                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                                <Form.Control
                                    placeholder="Buscar inspector..."
                                    value={filters.inspector}
                                    onChange={e => setFilters({ ...filters, inspector: e.target.value })}
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={3}>
                            <Button variant="outline-secondary" size="sm" className="w-100" onClick={clearFilters}>
                                Limpiar Filtros
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Table Results */}
            <div className="table-responsive bg-white rounded shadow-sm">
                <Table hover striped className="align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="py-3 ps-3">Fecha</th>
                            <th className="py-3">Vehículo</th>
                            <th className="py-3">Inspector</th>
                            <th className="py-3">Km</th>
                            <th className="py-3">Resultado</th>
                            <th className="py-3 text-end pe-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRegistros.map(reg => (
                            <tr key={reg.id}>
                                <td className="ps-3">
                                    <div className="fw-bold">{new Date(reg.fecha_registro).toLocaleDateString()}</div>
                                    <small className="text-muted">{new Date(reg.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                </td>
                                <td>
                                    <Badge bg="light" text="dark" className="border">
                                        {reg.vehiculo_placa}
                                    </Badge>
                                </td>
                                <td><small>{reg.usuario_email}</small></td>
                                <td>{reg.kilometraje_lectura?.toLocaleString()}</td>
                                <td>
                                    <Badge bg={reg.resultado_global === 'APROBADO' ? 'success' : 'danger'}>
                                        {reg.resultado_global}
                                    </Badge>
                                    {reg.score != null && (
                                        <small className="ms-2 text-muted fw-bold">
                                            {reg.score}%
                                        </small>
                                    )}
                                </td>
                                <td className="text-end pe-3">
                                    {(userRole === 'admin' || user?.email === 'nelsonsr.1983@gmail.com') && (
                                        <Button
                                            variant="link"
                                            className="text-warning p-0 me-2"
                                            onClick={() => handleEditUsage(reg)}
                                            title="[ADMIN] Corregir Lectura"
                                        >
                                            <Edit size={16} />
                                        </Button>
                                    )}
                                    <Button
                                        variant="link"
                                        className="text-primary p-0"
                                        onClick={() => handleViewDetail(reg)}
                                        title="Ver Detalles Completo"
                                    >
                                        <Eye size={18} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredRegistros.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center p-5 text-muted">
                                    <Filter size={48} className="mb-3 opacity-25" />
                                    <p>No se encontraron inspecciones con los filtros actuales.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="mt-2 text-end text-muted small">
                Mostrando {filteredRegistros.length} registros
            </div>

            <DetalleInspeccionModal
                show={showModal}
                onHide={() => setShowModal(false)}
                inspection={selectedInspection}
            />
        </div >
    );
};

export default HistorialPreoperacionales;
