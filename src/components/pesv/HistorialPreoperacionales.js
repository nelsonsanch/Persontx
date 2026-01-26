import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Eye, Search, Filter, Download } from 'lucide-react';
import DetalleInspeccionModal from './DetalleInspeccionModal';

const HistorialPreoperacionales = ({ vehiculos, user }) => {
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
                <Table hovered striped className="align-middle mb-0">
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
        </div>
    );
};

export default HistorialPreoperacionales;
