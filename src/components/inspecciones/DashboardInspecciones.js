import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Form, Badge } from 'react-bootstrap';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Activity, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

const DashboardInspecciones = () => {
    const { user } = useAuth();
    const [inspecciones, setInspecciones] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch History
                const refHist = collection(db, 'inspecciones_sst');
                const qHist = query(refHist, where('empresaId', '==', user.uid));
                const snapHist = await getDocs(qHist);
                const dataHist = snapHist.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    fecha: doc.data().fechaInspeccion?.toDate()
                }));
                // Sort client-side
                dataHist.sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
                setInspecciones(dataHist);

                // Fetch Inventory for Schedule
                const refInv = collection(db, 'inventarios');
                const qInv = query(refInv, where('clienteId', '==', user.uid));
                const snapInv = await getDocs(qInv);
                const dataInv = snapInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInventario(dataInv);

            } catch (error) {
                console.error("Error fetching data for dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Computed Data: History
    const filteredData = useMemo(() => {
        return inspecciones.filter(item => {
            if (!item.fecha) return false;

            // Date Filter
            if (startDate) {
                const start = new Date(startDate);
                if (item.fecha < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                const endDay = new Date(end);
                endDay.setHours(23, 59, 59, 999);
                if (item.fecha > endDay) return false;
            }

            // Category Filter
            if (filterCategory && item.categoria !== filterCategory) return false;

            return true;
        });
    }, [inspecciones, startDate, endDate, filterCategory]);

    // Computed Data: Programming
    const programmingData = useMemo(() => {
        let vencidas = 0;
        let programadas = 0;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-based

        inventario.forEach(item => {
            // Apply Filters if relevant? Usually Schedule is global, but let's apply Category filter if set
            if (filterCategory) {
                const cat = item.categoria || item.familia || '';
                // Simple text match or exact? The select values are specific.
                if (cat !== filterCategory) return;
            }

            if (!item.fecha_proxima_inspeccion) return;

            const [yStr, mStr] = item.fecha_proxima_inspeccion.split('-');
            const year = parseInt(yStr);
            const month = parseInt(mStr) - 1;

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                vencidas++;
            } else {
                programadas++;
            }
        });

        return [
            { name: 'Vencidas', value: vencidas, fill: '#ef4444' },
            { name: 'Programadas', value: programadas, fill: '#10b981' }
        ];
    }, [inventario, filterCategory]);

    // Metrics Calculation
    const kpi = useMemo(() => {
        const total = filteredData.length;
        const conforme = filteredData.filter(i => i.estadoGeneral === 'Conforme').length;
        const noConforme = filteredData.filter(i => i.estadoGeneral === 'No Conforme').length;
        const hallazgos = filteredData.reduce((acc, curr) => acc + (curr.resultados?.hallazgosCount || 0), 0);
        const complianceRate = total > 0 ? ((conforme / total) * 100).toFixed(1) : 0;

        return { total, conforme, noConforme, hallazgos, complianceRate };
    }, [filteredData]);

    // Charts Data
    const complianceData = [
        { name: 'Conforme', value: kpi.conforme },
        { name: 'No Conforme', value: kpi.noConforme },
    ];

    const categoryData = useMemo(() => {
        const counts = {};
        filteredData.forEach(item => {
            const cat = item.categoria || 'Otros';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key.toUpperCase(), value: counts[key] }));
    }, [filteredData]);

    const trendData = useMemo(() => {
        const groups = {};
        filteredData.forEach(item => {
            const date = item.fecha;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            groups[key] = (groups[key] || 0) + 1;
        });

        return Object.keys(groups).sort().map(key => ({
            name: key, // Label for Axis
            inspecciones: groups[key]
        }));
    }, [filteredData]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="fade-in pb-5">
            {/* Filters */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Body className="py-3">
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-bold text-muted">Fecha Inicio (Historial)</Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold text-muted">Fecha Fin (Historial)</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-bold text-muted">Tipo de Inventario</Form.Label>
                            <Form.Select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                            >
                                <option value="">Todos los Tipos</option>
                                <option value="extintores">Extintores</option>
                                <option value="gabinetes">Gabinetes</option>
                                <option value="botiquin">Botiquines</option>
                                <option value="camillas">Camillas</option>
                                <option value="activos">Herramientas</option>
                                <option value="equipos de alturas">Equipos de Alturas</option>
                                <option value="quimicos">Químicos</option>
                                <option value="otros">Otros</option>
                            </Form.Select>
                        </Col>
                        <Col md={2} className="text-end">
                            <Badge bg="light" text="dark" className="border p-2">
                                {filteredData.length} Histórico
                            </Badge>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* KPI Cards */}
            <Row className="mb-4 g-3">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100 bg-primary text-white">
                        <Card.Body className="d-flex align-items-center">
                            <div className="p-3 bg-white bg-opacity-25 rounded-circle me-3">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="small opacity-75">Total Inspecciones</div>
                                <h3 className="mb-0 fw-bold">{kpi.total}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100 bg-success text-white">
                        <Card.Body className="d-flex align-items-center">
                            <div className="p-3 bg-white bg-opacity-25 rounded-circle me-3">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div className="small opacity-75">Tasa Cumplimiento</div>
                                <h3 className="mb-0 fw-bold">{kpi.complianceRate}%</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100 bg-danger text-white">
                        <Card.Body className="d-flex align-items-center">
                            <div className="p-3 bg-white bg-opacity-25 rounded-circle me-3">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <div className="small opacity-75">Hallazgos Detectados</div>
                                <h3 className="mb-0 fw-bold">{kpi.hallazgos}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100 bg-info text-dark">
                        <Card.Body className="d-flex align-items-center">
                            <div className="p-3 bg-white bg-opacity-50 rounded-circle me-3">
                                <Activity size={24} />
                            </div>
                            <div>
                                <div className="small opacity-75">Activos Inspeccionados</div>
                                <h3 className="mb-0 fw-bold">{filteredData.length}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 1 */}
            <Row className="mb-4 g-3">
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold">Cumplimiento (Histórico)</Card.Header>
                        <Card.Body style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={complianceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {complianceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- NEW CHART: Program vs Realized --- */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold text-info">Estado de Programación</Card.Header>
                        <Card.Body style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={programmingData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} interval={0} textAnchor="middle" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Cantidad">
                                        {programmingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold">Por Tipo de Inventario</Card.Header>
                        <Card.Body style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Inspecciones" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 2 */}
            <Row>
                <Col md={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white fw-bold">Tendencia de Inspecciones (Mes a Mes)</Card.Header>
                        <Card.Body style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="inspecciones" stroke="#10b981" fillOpacity={1} fill="url(#colorIns)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardInspecciones;
