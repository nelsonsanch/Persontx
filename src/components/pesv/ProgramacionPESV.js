import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, ProgressBar, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Calendar, AlertTriangle, CheckCircle, Clock, Truck, Search, ArrowRight } from 'lucide-react';

const ProgramacionPESV = ({ user, inventario = [] }) => {
    const [maintenanceEvents, setMaintenanceEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processedSchedule, setProcessedSchedule] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, expired, warning, ok

    // Load Maintenance History
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'mantenimientos_vehiculos'),
            where('clienteId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMaintenanceEvents(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Process Data: Match Assets with their Latest Scheduled Event
    useEffect(() => {
        if (loading || inventario.length === 0) return;

        const scheduleMap = [];

        inventario.forEach(asset => {
            // Find events for this asset that have a FUTURE TARGET (either date or mileage/hours)
            const assetEvents = maintenanceEvents.filter(e =>
                e.vehiculo_id === asset.id &&
                (e.proximo_cambio_kilometraje > 0 || e.proximo_vencimiento_fecha)
            );

            // Sort by creation date (assuming newest created is the latest plan)
            // Or sort by the target value? Usually the latest entry represents the current valid plan.
            // Let's use fecha_registro descending.
            assetEvents.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));

            const latestEvent = assetEvents[0];

            if (latestEvent) {
                const isMachinery = asset.tipo_activo === 'maquinaria';
                const currentUsage = isMachinery ? (Number(asset.horometro_actual) || 0) : (Number(asset.kilometraje_actual) || 0);
                const unit = isMachinery ? 'Horas' : 'km';

                let status = { state: 'ok', label: 'Vigente', color: 'success', remaining: 0, progress: 0 };
                let targetDisplay = '';
                let type = '';

                // A. Date Based (Documents)
                if (latestEvent.proximo_vencimiento_fecha) {
                    type = 'Vencimiento';
                    const today = new Date();
                    const targetDate = new Date(latestEvent.proximo_vencimiento_fecha);
                    const diffTime = targetDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    targetDisplay = targetDate.toLocaleDateString();
                    status.remaining = diffDays;
                    status.remainingLabel = `${diffDays} días`;

                    if (diffDays < 0) {
                        status = { state: 'expired', label: 'Vencido', color: 'danger', remaining: diffDays, progress: 100 };
                    } else if (diffDays <= 30) {
                        status = { state: 'warning', label: 'Próximo', color: 'warning', remaining: diffDays, progress: 100 };
                    }
                }
                // B. Usage Based (Mechanical)
                else if (latestEvent.proximo_cambio_kilometraje) {
                    type = 'Mantenimiento';
                    const target = latestEvent.proximo_cambio_kilometraje;
                    const remaining = target - currentUsage;

                    targetDisplay = `${target.toLocaleString()} ${unit}`;
                    status.remaining = remaining;
                    status.remainingLabel = `${remaining.toLocaleString()} ${unit}`;

                    // Thresholds: 500km for vehicles, 50h for machinery
                    const warningThreshold = isMachinery ? 50 : 500;

                    if (remaining <= 0) {
                        status = { state: 'expired', label: 'Vencido', color: 'danger', progress: 100 };
                    } else if (remaining <= warningThreshold) {
                        status = { state: 'warning', label: 'Próximo', color: 'warning', progress: 90 };
                    } else {
                        // Calculate simplified progress bar
                        // Assume a cycle of 5000km or 250h for context, or just show standard Bar
                        status.progress = 50;
                    }
                }

                scheduleMap.push({
                    asset,
                    event: latestEvent,
                    status,
                    currentUsage,
                    unit,
                    targetDisplay,
                    type
                });
            }
        });

        // Add assets WITHOUT any schedule? Optional. For now let's focus on "Programadas"
        setProcessedSchedule(scheduleMap);

    }, [maintenanceEvents, inventario, loading]);

    // Filtering
    const filteredItems = processedSchedule.filter(item => {
        const matchesText =
            item.asset.placa?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.asset.marca?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.event.tipo_evento?.toLowerCase().includes(filterText.toLowerCase());

        const matchesStatus = filterStatus === 'all' || item.status.state === filterStatus;

        return matchesText && matchesStatus;
    });

    if (loading) return <div className="text-center p-5 text-muted">Cargando programación...</div>;

    return (
        <div className="fade-in">
            {/* Summary Cards */}
            <Row className="g-3 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-white p-3 rounded-circle me-3 shadow-sm text-primary">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-0">Total Programados</h6>
                                <h3 className="fw-bold mb-0">{processedSchedule.length}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3 text-danger">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-0">Vencidos</h6>
                                <h3 className="fw-bold mb-0 text-danger">
                                    {processedSchedule.filter(i => i.status.state === 'expired').length}
                                </h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 text-warning">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-0">Próximos (Mes)</h6>
                                <h3 className="fw-bold mb-0 text-warning">
                                    {processedSchedule.filter(i => i.status.state === 'warning').length}
                                </h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-2">
                    <Row className="g-2 align-items-center">
                        <Col xs={12} md={6}>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0">
                                    <Search size={18} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Buscar placa, marca o tipo de evento..."
                                    className="border-start-0 ps-0"
                                    value={filterText}
                                    onChange={e => setFilterText(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={6} className="d-flex gap-2 justify-content-md-end">
                            <Button variant={filterStatus === 'all' ? 'primary' : 'light'} onClick={() => setFilterStatus('all')} size="sm" className="rounded-pill px-3">
                                Todos
                            </Button>
                            <Button variant={filterStatus === 'expired' ? 'danger' : 'light'} onClick={() => setFilterStatus('expired')} size="sm" className="rounded-pill px-3">
                                Vencidos
                            </Button>
                            <Button variant={filterStatus === 'warning' ? 'warning' : 'light'} onClick={() => setFilterStatus('warning')} size="sm" className="rounded-pill px-3">
                                Próximos
                            </Button>
                            <Button variant={filterStatus === 'ok' ? 'success' : 'light'} onClick={() => setFilterStatus('ok')} size="sm" className="rounded-pill px-3">
                                Vigentes
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Table */}
            <div className="table-responsive bg-white rounded shadow-sm">
                <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="py-3 ps-3">Activo</th>
                            <th>Último Evento Programado</th>
                            <th>Meta / Vencimiento</th>
                            <th>Uso Actual</th>
                            <th>Estado (Restante)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(({ asset, event, status, currentUsage, unit, targetDisplay, type }) => (
                            <tr key={`${asset.id}-${event.id}`}>
                                <td className="ps-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`p-2 rounded bg-light text-${status.color}`}>
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <div className="fw-bold">{asset.placa || asset.placa_interna || asset.id_interno}</div>
                                            <small className="text-muted">{asset.marca} {asset.modelo}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="fw-bold text-dark">{event.tipo_evento}</div>
                                    <small className="text-muted d-flex align-items-center gap-1">
                                        <Clock size={12} /> Realizado: {event.fecha_evento}
                                    </small>
                                </td>
                                <td>
                                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-normal fs-6">
                                        {targetDisplay}
                                    </Badge>
                                </td>
                                <td>
                                    <div>{currentUsage.toLocaleString()} {unit}</div>
                                </td>
                                <td style={{ minWidth: '150px' }}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className={`badge bg-${status.color} bg-opacity-10 text-${status.color} border border-${status.color}`}>
                                            {status.label}
                                        </span>
                                        <small className={`fw-bold text-${status.color}`}>
                                            {status.remaining > 0 ? 'Faltan ' : 'Vencido por '}
                                            {Math.abs(status.remaining).toLocaleString()} {unit === 'Horas' && type === 'Vencimiento' ? 'días' : unit}
                                        </small>
                                    </div>
                                    <ProgressBar
                                        now={status.progress}
                                        variant={status.color}
                                        style={{ height: '6px' }}
                                        className="bg-light"
                                    />
                                </td>
                                <td className="text-end pe-3">
                                    <Button variant="link" size="sm" className="text-muted">
                                        <ArrowRight size={18} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                {filteredItems.length === 0 && (
                    <div className="text-center p-5">
                        <Calendar size={48} className="text-muted opacity-25 mb-3" />
                        <h5 className="text-muted">No hay programaciones encontradas</h5>
                        <p className="text-muted small">Intente ajustar los filtros o registre nuevos mantenimientos con fechas meta.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgramacionPESV;
