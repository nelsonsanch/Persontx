import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Form } from 'react-bootstrap';
import { Eye, FileText, Calendar, Trash2 } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import DetalleInspeccion from './DetalleInspeccion';

const HistorialInspecciones = () => {
    const { user, dataScopeId } = useAuth();
    const [inspecciones, setInspecciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filterCode, setFilterCode] = useState('');

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
                where('empresaId', '==', dataScopeId),
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

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Filtrado local
    const filteredData = inspecciones.filter(item => {
        if (filtroCategoria && item.categoria !== filtroCategoria) return false;

        // Code Filter
        if (filterCode) {
            const term = filterCode.toLowerCase();
            const code = item.activo?.codigo?.toLowerCase() || '';
            const internal = item.activo?.codigo_interno?.toLowerCase() || '';
            const id = item.activo?.id?.toLowerCase() || '';

            // Check against codigo, codigo_interno, or id
            if (!code.includes(term) && !internal.includes(term) && !id.includes(term)) {
                return false;
            }
        }

        if (item.fecha) {
            const itemYear = item.fecha.getFullYear();
            const itemMonth = item.fecha.getMonth();

            if (itemYear !== selectedYear) return false;
            if (selectedMonth !== -1 && itemMonth !== selectedMonth) return false;
        }

        return true;
    });

    const formatDate = (date) => {
        if (!date) return '-';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const months = [
        { val: -1, label: 'Todo el Año' },
        { val: 0, label: 'Enero' }, { val: 1, label: 'Febrero' }, { val: 2, label: 'Marzo' },
        { val: 3, label: 'Abril' }, { val: 4, label: 'Mayo' }, { val: 5, label: 'Junio' },
        { val: 6, label: 'Julio' }, { val: 7, label: 'Agosto' }, { val: 8, label: 'Septiembre' },
        { val: 9, label: 'Octubre' }, { val: 10, label: 'Noviembre' }, { val: 11, label: 'Diciembre' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="mb-0 text-primary fw-bold">📜 Historial de Inspecciones</h5>

                <div className="d-flex gap-2 flex-wrap">
                    <Form.Control
                        type="text"
                        placeholder="Buscar Código..."
                        value={filterCode}
                        onChange={(e) => setFilterCode(e.target.value)}
                        style={{ width: '160px' }}
                        className="fw-bold"
                    />

                    <Form.Select
                        style={{ width: '140px' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="fw-bold"
                    >
                        {months.map(m => (
                            <option key={m.val} value={m.val}>{m.label}</option>
                        ))}
                    </Form.Select>

                    <Form.Select
                        style={{ width: '100px' }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="fw-bold"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </Form.Select>

                    <Form.Select
                        style={{ width: '180px' }}
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                    >
                        <option value="">Todas las Categorías</option>
                        <option value="extintores">Extintores</option>
                        <option value="gabinetes">Gabinetes</option>
                        <option value="botiquin">Botiquines</option>
                        <option value="camillas">Camillas</option>
                        <option value="activos">Herramientas</option>
                        <option value="alturas">Alturas</option>
                        <option value="quimicos">Químicos</option>
                        <option value="otros">Otros</option>
                    </Form.Select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="alert alert-light text-center border-0 py-4">
                    <FileText size={48} className="text-black-50 mb-3" />
                    <p className="text-muted">No se encontraron inspecciones realizadas en este periodo.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle bg-white shadow-sm rounded">
                        <thead className="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th>Fecha</th>
                                <th>Activo / Equipo</th>
                                <th>Próxima Inspección</th>
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
                                        <div className="small text-muted">ID: {insp.activo?.codigo || insp.activo?.codigo_interno || insp.activo?.id || 'S/C'}</div>
                                    </td>
                                    <td>
                                        {insp.fechaProximaInspeccion ? (
                                            <Badge bg="info" text="dark" className="fw-normal">
                                                {insp.fechaProximaInspeccion}
                                            </Badge>
                                        ) : (
                                            <small className="text-muted fst-italic">Por definir</small>
                                        )}
                                    </td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border text-uppercase" style={{ fontSize: '0.7rem' }}>
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
                                            onClick={() => handleView(insp)}
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
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
