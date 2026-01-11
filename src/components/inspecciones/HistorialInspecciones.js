import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Form, Row, Col, Card } from 'react-bootstrap';
import { Eye, FileText, Calendar } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const HistorialInspecciones = () => {
    const { user } = useAuth();
    const [inspecciones, setInspecciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroCategoria, setFiltroCategoria] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Consultar todas las inspecciones de la empresa
                const ref = collection(db, 'inspecciones_sst');
                const q = query(
                    ref,
                    where('empresaId', '==', user.uid),
                    orderBy('fechaInspeccion', 'desc')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convertir Timestamp a Date
                    fecha: doc.data().fechaInspeccion?.toDate()
                }));
                setInspecciones(data);
            } catch (error) {
                console.error("Error cargando historial:", error);
            }
            setLoading(false);
        };
        fetchHistory();
    }, [user]);

    // Filtrado local
    const filteredData = inspecciones.filter(item => {
        if (filtroCategoria && item.categoria !== filtroCategoria) return false;
        return true;
    });

    const formatDate = (date) => {
        if (!date) return '-';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Historial de Auditorías</h5>
                <Form.Select
                    style={{ width: '200px' }}
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                    <option value="">Todas las Categorías</option>
                    <option value="extintores">Extintores</option>
                    <option value="gabinetes">Gabinetes</option>
                    <option value="botiquin">Botiquines</option>
                    <option value="camillas">Camillas</option>
                    <option value="activos">Herramientas</option>
                    <option value="quimicos">Químicos</option>
                    <option value="otros">Otros</option>
                </Form.Select>
            </div>

            {loading ? (
                <div className="text-center py-5">Cargando...</div>
            ) : filteredData.length === 0 ? (
                <div className="alert alert-info">No hay inspecciones registradas aún.</div>
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle bg-white shadow-sm rounded">
                        <thead className="bg-light">
                            <tr>
                                <th>Fecha</th>
                                <th>Activo / Equipo</th>
                                <th>Ubicación</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Hallazgos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(insp => (
                                <tr key={insp.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Calendar size={14} className="me-2 text-muted" />
                                            <small>{formatDate(insp.fecha)}</small>
                                        </div>
                                    </td>
                                    <td className="fw-medium">
                                        {insp.activo?.nombre || insp.activo?.tipo || 'Sin Nombre'}
                                        <div className="small text-muted">ID: {insp.activo?.codigo}</div>
                                    </td>
                                    <td><small>{insp.activo?.ubicacion}</small></td>
                                    <td>
                                        <Badge bg="secondary" className="text-uppercase" style={{ fontSize: '0.7rem' }}>
                                            {insp.categoria}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={insp.estadoGeneral === 'Conforme' ? 'success' : 'danger'}>
                                            {insp.estadoGeneral}
                                        </Badge>
                                    </td>
                                    <td>
                                        {insp.resultados?.hallazgosCount > 0 ? (
                                            <span className="text-danger fw-bold">{insp.resultados.hallazgosCount} Hallazgos</span>
                                        ) : (
                                            <span className="text-success">--</span>
                                        )}
                                    </td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" title="Ver Detalle">
                                            <Eye size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default HistorialInspecciones;
