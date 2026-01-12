import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Form, Row, Col, Card } from 'react-bootstrap';
import { Eye, FileText, Calendar, Trash2 } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import DetalleInspeccion from './DetalleInspeccion';

const HistorialInspecciones = () => {
    const { user } = useAuth();
    const [inspecciones, setInspecciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroCategoria, setFiltroCategoria] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState(null);

    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
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
                fecha: doc.data().fechaInspeccion?.toDate()
            }));
            setInspecciones(data);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
            try {
                await deleteDoc(doc(db, 'inspecciones_sst', id));
                setInspecciones(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                console.error("Error al eliminar", error);
                alert("No se pudo eliminar el registro. Verifica permisos en Firebase.");
            }
        }
    };

    const handleView = (inspection) => {
        setSelectedInspection(inspection);
        setShowModal(true);
    };

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
                                        {insp.activo?.nombre}
                                        {/* Fallback visual si el nombre se guardó mal antes */}
                                        {insp.activo?.nombre === 'Sin Nombre' || !insp.activo?.nombre ? (
                                            <span className="text-muted fst-italic ms-1">(Verifica Detalle)</span>
                                        ) : null}
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
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            title="Ver Detalle / PDF"
                                            onClick={() => handleView(insp)}
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            title="Eliminar Registro"
                                            onClick={() => handleDelete(insp.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            <DetalleInspeccion
                show={showModal}
                handleClose={() => setShowModal(false)}
                inspeccion={selectedInspection}
            />
        </div>
    );
};

export default HistorialInspecciones;
