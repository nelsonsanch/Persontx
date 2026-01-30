import React, { useState, useEffect } from 'react';
import { Table, Badge, Form, Card } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import DetalleInspeccion from './DetalleInspeccion';

const ProgramacionInspecciones = ({ onInspect }) => {
    const { user } = useAuth();
    const [futureMonth, setFutureMonth] = useState(new Date().getMonth());
    const [futureYear, setFutureYear] = useState(new Date().getFullYear());
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterCode, setFilterCode] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Modal Details
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const months = [
        { val: -1, label: 'Todo el Año' },
        { val: 0, label: 'Enero' }, { val: 1, label: 'Febrero' }, { val: 2, label: 'Marzo' },
        { val: 3, label: 'Abril' }, { val: 4, label: 'Mayo' }, { val: 5, label: 'Junio' },
        { val: 6, label: 'Julio' }, { val: 7, label: 'Agosto' }, { val: 8, label: 'Septiembre' },
        { val: 9, label: 'Octubre' }, { val: 10, label: 'Noviembre' }, { val: 11, label: 'Diciembre' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        const fetchInventory = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const ref = collection(db, 'inventarios');
                const q = query(ref, where('clienteId', '==', user.uid));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInventario(data);
            } catch (error) {
                console.error("Error cargando inventario:", error);
            }
            setLoading(false);
        };
        fetchInventory();
    }, [user]);

    // Helper: Calcular Semáforo
    const calculateStatus = (dateStr) => {
        if (!dateStr) return { label: 'NUNCA INSPECCIONADO', color: 'danger', days: -9999 };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const parts = dateStr.split('-');
        let targetDate = new Date();
        if (parts.length >= 2) {
            targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parts.length === 3 ? parseInt(parts[2]) : 1);
        }

        const diffTime = targetDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'VENCIDA', color: 'danger', days: diffDays };
        if (diffDays <= 30) return { label: 'PRÓXIMA A VENCER', color: 'warning', text: 'dark', days: diffDays };
        return { label: 'VIGENTE', color: 'success', days: diffDays };
    };

    const handleViewLastInspection = async (asset) => {
        try {
            // Find audits for this asset
            const ref = collection(db, 'inspecciones_sst');
            // Note: simple where avoids calling for index on complex sorts. We sort in memory.
            const q = query(
                ref,
                where('activo.id', '==', asset.id),
                where('clienteId', '==', user.uid) // Requerido por reglas de seguridad
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("No se encontró historial de inspecciones para este activo.");
                return;
            }

            const docs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                fecha: d.data().fechaInspeccion?.toDate()
            }));

            // Sort desc by date
            docs.sort((a, b) => b.fecha - a.fecha);
            const latest = docs[0];

            setSelectedInspection(latest);
            setShowDetail(true);

        } catch (error) {
            console.error("Error fetching detail:", error);
            alert("Error consultando el historial.");
        }
    };

    // Filtrado de Programación
    const filteredProgram = inventario.filter(item => {
        // EXCLUDE CHEMICALS (Requested by user)
        if (item.categoria === 'quimicos') return false;

        // Category Filter
        if (filterCategory && item.categoria !== filterCategory) return false;

        // 1. Filtro Texto (Código / Nombre / ID)
        if (filterCode) {
            const term = filterCode.toLowerCase();
            const code = item.codigo?.toLowerCase() || '';
            const internal = item.codigo_interno?.toLowerCase() || '';
            const id = item.id?.toLowerCase() || '';
            const name = item.nombre?.toLowerCase() || '';

            if (!code.includes(term) && !internal.includes(term) && !id.includes(term) && !name.includes(term)) {
                return false;
            }
        }

        // 2. Lógica de Fechas
        const status = calculateStatus(item.fecha_proxima_inspeccion);

        // REGLA CRÍTICA: SIEMPRE mostrar lo que está en ROJO (Vencido o Nunca Inspeccionado) para alertar al usuario
        if (status.color === 'danger') return true;

        // Si no tiene fecha y no retornó arriba, return true (safety)
        if (!item.fecha_proxima_inspeccion) return true;

        // 3. Filtro de Mes/Año (Solo aplica para lo VIGENTE o PROGRAMADO)
        const [yearStr, monthStr] = item.fecha_proxima_inspeccion.split('-');
        const itemYear = parseInt(yearStr);
        const itemMonth = parseInt(monthStr) - 1; // 0-based

        if (itemYear !== futureYear) return false;
        if (futureMonth !== -1 && itemMonth !== futureMonth) return false;

        return true;
    });

    // Ordenamiento: Primero lo Crítico (Rojo), luego lo Próximo (Amarillo), luego lo Vigente (Verde)
    filteredProgram.sort((a, b) => {
        const statA = calculateStatus(a.fecha_proxima_inspeccion);
        const statB = calculateStatus(b.fecha_proxima_inspeccion);

        const getWeight = (s) => s.color === 'danger' ? 0 : s.color === 'warning' ? 1 : 2;

        if (getWeight(statA) !== getWeight(statB)) {
            return getWeight(statA) - getWeight(statB);
        }
        return (statA.days || 0) - (statB.days || 0);
    });

    return (
        <div className="fade-in">
            <Card className="shadow-sm border-0 border-top border-5 border-info">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 text-info fw-bold">📅 Programación y Semáforo</h5>

                        <div className="d-flex gap-2 flex-wrap">
                            <Form.Control
                                type="text"
                                placeholder="Buscar..."
                                value={filterCode}
                                onChange={(e) => setFilterCode(e.target.value)}
                                style={{ width: '150px' }}
                                className="fw-bold"
                            />

                            <Form.Select
                                style={{ width: '160px' }}
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="fw-bold text-secondary"
                            >
                                <option value="">Todas</option>
                                <option value="extintores">Extintores</option>
                                <option value="gabinetes">Gabinetes</option>
                                <option value="botiquin">Botiquines</option>
                                <option value="camillas">Camillas</option>
                                <option value="activos">Herramientas</option>
                                <option value="alturas">Alturas</option>
                                <option value="otros">Otros</option>
                            </Form.Select>

                            <Form.Select
                                style={{ width: '140px' }}
                                value={futureMonth}
                                onChange={(e) => setFutureMonth(parseInt(e.target.value))}
                                className="fw-bold border-info text-info"
                            >
                                {months.map(m => (
                                    <option key={m.val} value={m.val}>{m.label}</option>
                                ))}
                            </Form.Select>

                            <Form.Select
                                style={{ width: '100px' }}
                                value={futureYear}
                                onChange={(e) => setFutureYear(parseInt(e.target.value))}
                                className="fw-bold border-info text-info"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </Form.Select>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-info" role="status"></div>
                        </div>
                    ) : filteredProgram.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="mb-0">Todo al día. No hay inspecciones pendientes para este criterio.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                                <thead className="bg-light text-secondary small text-uppercase">
                                    <tr>
                                        <th>Activo / Equipo</th>
                                        <th>Familia / Tipo</th>
                                        <th>Ubicación</th>
                                        <th>Vencimiento</th>
                                        <th>Estado</th>
                                        <th className="text-end">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProgram.map((item, idx) => {
                                        const status = calculateStatus(item.fecha_proxima_inspeccion);
                                        return (
                                            <tr key={idx} className={status.color === 'danger' ? 'bg-danger bg-opacity-10' : ''}>
                                                <td className="fw-bold">
                                                    {item.nombre || item.tipo_equipo}
                                                    <div className="small text-muted font-monospace">{item.codigo_interno || item.codigo || item.id || 'S/C'}</div>
                                                </td>
                                                <td> {item.familia || item.categoria} </td>
                                                <td className="small text-muted">{item.ubicacion || 'S/U'}</td>
                                                <td>
                                                    <Badge bg={status.color} text={status.text || 'white'} className="fs-6">
                                                        {item.fecha_proxima_inspeccion || '---'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg="light"
                                                        text={status.color}
                                                        className={`border border-${status.color} ${status.label !== 'NUNCA INSPECCIONADO' ? 'text-decoration-underline' : ''}`}
                                                        style={{ cursor: status.label !== 'NUNCA INSPECCIONADO' ? 'pointer' : 'default' }}
                                                        onClick={() => {
                                                            if (status.label !== 'NUNCA INSPECCIONADO') {
                                                                handleViewLastInspection(item);
                                                            }
                                                        }}
                                                        title={status.label !== 'NUNCA INSPECCIONADO' ? "Ver Última Inspección" : ""}
                                                    >
                                                        {status.label} {status.label !== 'NUNCA INSPECCIONADO' && '👁️'}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className={`btn btn-sm btn-${status.color === 'danger' ? 'danger' : 'primary'} rounded-pill px-3 fw-bold`}
                                                        onClick={() => onInspect && onInspect(item)}
                                                    >
                                                        ▶ Iniciar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Detail */}
            <DetalleInspeccion
                show={showDetail}
                handleClose={() => setShowDetail(false)}
                inspeccion={selectedInspection}
            />
        </div>
    );
};

export default ProgramacionInspecciones;
