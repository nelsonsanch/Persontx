import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Table, Button, Form } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, XCircle, Activity, Eye, Truck } from 'lucide-react';
import DetalleInspeccionModal from './DetalleInspeccionModal';

const IndicadoresPreoperacionales = ({ user, inventario = [] }) => {
    const [allData, setAllData] = useState([]); // Store all raw data
    const [filteredData, setFilteredData] = useState([]);

    // Core State (Restored)
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        rejected: 0,
        rate: 0,
        totalDistance: 0
    });
    const [chartData, setChartData] = useState([]);
    const [criticalVehicles, setCriticalVehicles] = useState([]);
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Filter States
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    // Derived Lists for Selects
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);

    useEffect(() => {
        if (!user) return;

        // Fetch all inspections
        const q = query(
            collection(db, 'inspecciones_preoperacionales'),
            where('clienteId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => d.data());

            // 1. Initial Data Load & Extraction
            setAllData(data);

            // Extract Unique Vehicles from Inspections (Format: PLACA)
            // We need to map these back to full names if possible, or just show PLACA if not in inventory
            const inspectionPlates = new Set(data.map(d => d.vehiculo_placa).filter(Boolean));

            // Create a Combined List of Objects { value: 'PLACA', label: '[VEH] PLACA - Marca Modelo' }
            const combinedOptions = [];

            // 1. Add Inventory Items (Preferred Source)
            inventario.forEach(a => {
                const placa = a.placa || a.placa_interna || a.serie_chasis || a.id_interno || 'S/N';
                const label = `[${a.tipo_activo === 'maquinaria' ? 'MAQ' : 'VEH'}] ${placa} - ${a.marca} ${a.linea || a.modelo || ''}`;
                combinedOptions.push({ value: placa, label });
            });

            // 2. Add Historical Items not in Inventory (Fallback)
            inspectionPlates.forEach(placa => {
                // Check if already added (by value/placa)
                if (!combinedOptions.find(o => o.value === placa)) {
                    combinedOptions.push({ value: placa, label: `[HISTÓRICO] ${placa}` });
                }
            });

            // Sort by Label
            combinedOptions.sort((a, b) => a.label.localeCompare(b.label));
            setAvailableVehicles(combinedOptions);

            // Extract Unique Years
            const years = [...new Set(data.map(d => new Date(d.fecha_registro).getFullYear()))].sort((a, b) => b - a);
            setAvailableYears(years);

            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, inventario]);

    // Apply Filters when dependencies change
    useEffect(() => {
        let res = [...allData];

        if (filterVehicle) {
            res = res.filter(d => d.vehiculo_placa === filterVehicle);
        }

        if (filterYear) {
            res = res.filter(d => new Date(d.fecha_registro).getFullYear().toString() === filterYear);
        }

        if (filterMonth) {
            res = res.filter(d => (new Date(d.fecha_registro).getMonth() + 1).toString() === filterMonth);
        }

        setFilteredData(res);
        processData(res);
    }, [allData, filterVehicle, filterYear, filterMonth]);

    const processData = (data) => {
        // 1. Basic Stats
        const total = data.length;
        const approved = data.filter(d => d.resultado_global === 'APROBADO').length;
        const rejected = total - approved;
        const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;

        // Sumar distancia recorrida (asegurando que sea número)
        // ESTRICTO: Solo suma lo recorrido en LAS INSPECCIONES FILTRADAS
        const totalDistance = data.reduce((acc, curr) => acc + (Number(curr.distancia_recorrida) || 0), 0);

        setStats({ total, approved, rejected, rate, totalDistance });

        // 2. Failures by Category/Item
        const failures = {};
        data.forEach(insp => {
            if (insp.checklist) {
                Object.entries(insp.checklist).forEach(([key, val]) => {
                    if (val === 'MALO' || val === 'FALLO') {
                        failures[key] = (failures[key] || 0) + 1;
                    }
                });
            }
        });

        // Format for Recharts
        const chart = Object.entries(failures)
            .map(([name, count]) => ({
                name: name.replace('pres_', '').replace('com_', '').replace('liq_', '').replace('tab_', '').replace('seg_', '').replace('act_', '').replace('otr_', '').replace('eq_', '').replace('bot_', ''),
                count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        setChartData(chart);

        // 3. Active Critical Alerts (Vehicles where LAST inspection was REJECTED)
        // Note: For critical alerts, we might still want to see everything? 
        // Or strictly filtered? User asked for filters on indicators. 
        // Let's keep critical alerts based on filtered view or global?
        // Usually "Active Alerts" implies current state of fleet. 
        // But if filtering by "Last Year", showing current alerts might be confusing.
        // Let's calculate alerts based on the filtered dataset to be consistent.

        const vehicleLastState = {};
        data.forEach(insp => {
            if (!insp.vehiculo_id) return;
            const current = vehicleLastState[insp.vehiculo_id];
            const inspDate = new Date(insp.fecha_registro);

            if (!current || inspDate > new Date(current.fecha_registro)) {
                vehicleLastState[insp.vehiculo_id] = insp;
            }
        });

        // Filter REJECTED and sort by date
        const critical = Object.values(vehicleLastState)
            .filter(v => v.resultado_global === 'RECHAZADO')
            .sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));

        setCriticalVehicles(critical);
    };

    const handleViewDetail = (inspection) => {
        setSelectedInspection(inspection);
        setShowModal(true);
    };

    if (loading) return <div className="p-4 text-center">Cargando indicadores...</div>;

    return (
        <div className="fade-in">
            {/* Filters Row */}
            <Card className="border-0 shadow-sm mb-4 p-3">
                <Row className="g-3 align-items-end">
                    <Col xs={12} md={4}>
                        <Form.Label className="fw-bold text-muted small">Filtrar por Vehículo</Form.Label>
                        <Form.Select
                            value={filterVehicle}
                            onChange={(e) => setFilterVehicle(e.target.value)}
                            className="bg-light border-0 fw-bold"
                        >
                            <option value="">-- Todos los Vehículos --</option>
                            {availableVehicles.map(v => (
                                <option key={v.label} value={v.value}>{v.label}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs={6} md={3}>
                        <Form.Label className="fw-bold text-muted small">Año</Form.Label>
                        <Form.Select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-light border-0 fw-bold"
                        >
                            <option value="">-- Todos --</option>
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs={6} md={3}>
                        <Form.Label className="fw-bold text-muted small">Mes</Form.Label>
                        <Form.Select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="bg-light border-0 fw-bold"
                        >
                            <option value="">-- Todos --</option>
                            {[
                                { val: '1', label: 'Enero' }, { val: '2', label: 'Febrero' }, { val: '3', label: 'Marzo' },
                                { val: '4', label: 'Abril' }, { val: '5', label: 'Mayo' }, { val: '6', label: 'Junio' },
                                { val: '7', label: 'Julio' }, { val: '8', label: 'Agosto' }, { val: '9', label: 'Septiembre' },
                                { val: '10', label: 'Octubre' }, { val: '11', label: 'Noviembre' }, { val: '12', label: 'Diciembre' }
                            ].map(m => (
                                <option key={m.val} value={m.val}>{m.label}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs={12} md={2}>
                        {/* Reset Button if filters are active */}
                        {(filterVehicle || filterYear || filterMonth) && (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="w-100"
                                onClick={() => {
                                    setFilterVehicle('');
                                    setFilterYear('');
                                    setFilterMonth('');
                                }}
                            >
                                Limpiar Filtros
                            </Button>
                        )}
                    </Col>
                </Row>
            </Card>
            {/* KPI Cards */}
            <Row className="g-3 mb-4">
                <Col xs={12} md={3}>
                    <Card className="h-100 border-0 shadow-sm bg-primary text-white">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="opacity-75">Total Inspecciones</h6>
                                    <h2 className="fw-bold mb-0">{stats.total}</h2>
                                </div>
                                <Activity size={32} className="opacity-50" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={3}>
                    <Card className="h-100 border-0 shadow-sm bg-info text-white">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="opacity-75">Km Recorridos (Mes)</h6>
                                    <h2 className="fw-bold mb-0">{(stats.totalDistance || 0).toLocaleString()} km</h2>
                                </div>
                                <Truck size={32} className="opacity-50" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={3}>
                    <Card className="h-100 border-0 shadow-sm bg-success text-white">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="opacity-75">Aprobadas</h6>
                                    <h2 className="fw-bold mb-0">{stats.approved}</h2>
                                </div>
                                <CheckCircle size={32} className="opacity-50" />
                            </div>
                            <div className="mt-2 text-white-50 small">
                                Tasa de Éxito: {stats.rate}%
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={3}>
                    <Card className="h-100 border-0 shadow-sm bg-danger text-white">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="opacity-75">Rechazadas</h6>
                                    <h2 className="fw-bold mb-0">{stats.rejected}</h2>
                                </div>
                                <XCircle size={32} className="opacity-50" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={3}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted small">Vehículos Críticos (Activos)</h6>
                            <h2 className="fw-bold text-danger mb-0 text-center">{criticalVehicles.length}</h2>
                            <div className="text-center small text-muted">Fuera de Servicio</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Chart Section */}
                <Col xs={12} lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0 fw-bold text-primary">📊 Top 10 Hallazgos (Items con más fallos)</h6>
                        </Card.Header>
                        <Card.Body style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#dc3545" radius={[0, 4, 4, 0]} name="Fallos" barSize={20}>
                                        {
                                            chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index < 3 ? '#dc3545' : '#fd7e14'} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Critical List Section */}
                <Col xs={12} lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold text-danger">🚨 Alertas Activas</h6>
                            <Badge bg="danger" pill>{criticalVehicles.length}</Badge>
                        </Card.Header>
                        <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '350px' }}>
                            {criticalVehicles.length > 0 ? (
                                <Table striped hover size="sm" className="mb-0 align-middle">
                                    <tbody>
                                        {criticalVehicles.map((v, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-3 py-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <AlertTriangle size={18} className="text-danger" />
                                                        <div>
                                                            <div className="fw-bold">{v.vehiculo_placa}</div>
                                                            <small className="text-muted">{new Date(v.fecha_registro).toLocaleDateString()}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="pe-3 text-end">
                                                    <Button
                                                        variant="link"
                                                        className="text-danger p-0"
                                                        onClick={() => handleViewDetail(v)}
                                                        title="Ver Razones de Rechazo"
                                                    >
                                                        <Eye size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="p-4 text-center text-muted">
                                    <CheckCircle size={32} className="text-success mb-2" />
                                    <p className="mb-0 small">No hay vehículos detenidos actualmente.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <DetalleInspeccionModal
                show={showModal}
                onHide={() => setShowModal(false)}
                inspection={selectedInspection}
            />
        </div>
    );
};

export default IndicadoresPreoperacionales;
