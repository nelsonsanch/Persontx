import React, { useState, useEffect } from 'react';
import { Table, Badge, Form, Card } from 'react-bootstrap';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const ProgramacionInspecciones = () => {
    const { user } = useAuth();
    const [futureMonth, setFutureMonth] = useState(new Date().getMonth());
    const [futureYear, setFutureYear] = useState(new Date().getFullYear());
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterCode, setFilterCode] = useState('');

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

    // Filtrado de Programación
    const filteredProgram = inventario.filter(item => {
        if (!item.fecha_proxima_inspeccion) return false;

        // Code Filter
        if (filterCode) {
            const term = filterCode.toLowerCase();
            const code = item.codigo?.toLowerCase() || '';
            const internal = item.codigo_interno?.toLowerCase() || '';
            const id = item.id?.toLowerCase() || '';

            if (!code.includes(term) && !internal.includes(term) && !id.includes(term)) {
                return false;
            }
        }

        const [yearStr, monthStr] = item.fecha_proxima_inspeccion.split('-');
        const itemYear = parseInt(yearStr);
        const itemMonth = parseInt(monthStr) - 1; // 0-based

        if (itemYear !== futureYear) return false;
        if (futureMonth !== -1 && itemMonth !== futureMonth) return false;

        return true;
    });

    return (
        <div className="fade-in">
            <Card className="shadow-sm border-0 border-top border-5 border-info">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 text-info fw-bold">📅 Programación Futura</h5>

                        <div className="d-flex gap-2 flex-wrap">
                            <Form.Control
                                type="text"
                                placeholder="Buscar Código..."
                                value={filterCode}
                                onChange={(e) => setFilterCode(e.target.value)}
                                style={{ width: '150px' }}
                                className="fw-bold"
                            />

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
                            <p className="mb-0">No hay inspecciones programadas para este periodo.</p>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProgram.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold">
                                                {item.nombre || item.tipo_equipo}
                                                <div className="small text-muted font-monospace">{item.codigo_interno || item.codigo || item.id || 'S/C'}</div>
                                            </td>
                                            <td> {item.familia || item.categoria} </td>
                                            <td className="small text-muted">{item.ubicacion || 'S/U'}</td>
                                            <td>
                                                <Badge bg="warning" text="dark" className="fs-6">
                                                    {item.fecha_proxima_inspeccion}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="secondary" className="border">
                                                    PENDIENTE
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProgramacionInspecciones;
