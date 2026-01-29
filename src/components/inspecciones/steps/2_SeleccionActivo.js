import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, InputGroup, Spinner, Badge, Button } from 'react-bootstrap';
import { Search, MapPin, Hash } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';

const SeleccionActivo = ({ categoria, config, onSelect, onBack }) => {
    const { user, dataScopeId } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInventario = async () => {
            if (!user || !config) return;
            setLoading(true);
            try {
                // Consultar Inventario Real
                const q = query(
                    collection(db, config.coleccion), // 'inventarios'
                    where('clienteId', '==', dataScopeId),
                    where('categoria', '==', config.filtroCategoria)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(data);
            } catch (error) {
                console.error("Error cargando activos:", error);
            }
            setLoading(false);
        };

        fetchInventario();
    }, [user, config]);

    // Filtrar
    const filteredItems = items.filter(item => {
        const term = searchTerm.toLowerCase();
        return (
            item.codigo?.toLowerCase().includes(term) ||
            item.ubicacion?.toLowerCase().includes(term) ||
            item.nombre?.toLowerCase().includes(term) ||
            item.modelo?.toLowerCase().includes(term)
        );
    });

    // Helper para badge de vencimiento
    const getVencimientoBadge = (fechaStr) => {
        if (!fechaStr) return null; // Sin fecha

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 0-based

        const [yearStr, monthStr] = fechaStr.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);

        // Comparación simple de enteros (YYYYMM)
        const currentVal = currentYear * 100 + currentMonth;
        const targetVal = year * 100 + month;

        if (targetVal < currentVal) {
            return <Badge bg="danger" className="ms-1">Vencida</Badge>;
        } else if (targetVal === currentVal) {
            return <Badge bg="warning" text="dark" className="ms-1">Vence este mes</Badge>;
        } else if (targetVal === currentVal + 1 || (currentMonth === 12 && targetVal === (currentYear + 1) * 100 + 1)) {
            return <Badge bg="info" className="ms-1">Próxima</Badge>;
        } else {
            return <Badge bg="light" text="secondary" className="border ms-1">{fechaStr}</Badge>;
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="outline-secondary" size="sm" onClick={onBack}>← Volver</Button>
                <h5 className="mb-0">Seleccione el {config.titulo} a inspeccionar</h5>
                <div style={{ width: 80 }}></div> {/* Spacer */}
            </div>

            <InputGroup className="mb-4">
                <InputGroup.Text><Search size={18} /></InputGroup.Text>
                <Form.Control
                    placeholder="Buscar por código, ubicación o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </InputGroup>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    No se encontraron elementos en este inventario.
                    <br />
                    <small>Asegúrate de haber registrado equipos en la pestaña "Inventarios".</small>
                </div>
            ) : (
                <Row>
                    {filteredItems.map(item => (
                        <Col xs={12} md={6} lg={4} key={item.id} className="mb-3">
                            <Card
                                className="h-100 shadow-sm border-0 asset-card"
                                style={{ cursor: 'pointer', overflow: 'hidden' }}
                                onClick={() => onSelect(item)}
                            >
                                <div className="d-flex">
                                    {/* Miniatura Foto */}
                                    <div
                                        style={{
                                            width: '80px',
                                            backgroundColor: '#f8f9fa',
                                            backgroundImage: item.foto ? `url(${item.foto})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {!item.foto && <span style={{ fontSize: '2rem' }}>📦</span>}
                                    </div>

                                    {/* Info */}
                                    <Card.Body className="p-2">
                                        <h6 className="mb-1 text-truncate" title={item.nombre || item.tipo || item.tipoAgente || 'Sin Nombre'}>
                                            {item.tipo_equipo ? item.tipo_equipo :
                                                item.tipoAgente ? `${item.tipoAgente} - ${item.capacidad || ''}` :
                                                    item.tipo ? item.tipo :
                                                        item.nombre || 'Ítem Sin Nombre'}
                                        </h6>

                                        <div className="small text-muted mb-1">
                                            <Hash size={12} className="me-1" />
                                            <strong>ID:</strong> {item.codigo_interno || item.codigo || item.id || 'S/C'}
                                        </div>

                                        <div className="small text-muted">
                                            <MapPin size={12} className="me-1" />
                                            {item.ubicacion || 'Sin ubicación'}
                                        </div>

                                        <div className="mt-2 d-flex flex-wrap gap-1">
                                            {item.estadoGeneral || item.estado ? (
                                                <Badge bg={
                                                    (item.estado === 'Apto' || item.estado === 'Conforme') ? 'success' :
                                                        item.estado === 'No Apto' || item.estado === 'No Conforme' ? 'danger' : 'secondary'
                                                } className="border">
                                                    {item.estadoGeneral || item.estado}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted small fst-italic">Sin estado</span>
                                            )}

                                            {/* Badge de Próxima Inspección */}
                                            {item.fecha_proxima_inspeccion && getVencimientoBadge(item.fecha_proxima_inspeccion)}
                                        </div>
                                    </Card.Body>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default SeleccionActivo;
