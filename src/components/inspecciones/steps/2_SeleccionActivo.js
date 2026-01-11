import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, InputGroup, Spinner, Badge, Button } from 'react-bootstrap';
import { Search, MapPin, Hash } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';

const SeleccionActivo = ({ categoria, config, onSelect, onBack }) => {
    const { user } = useAuth();
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
                    where('clienteId', '==', user.uid),
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
                                            {item.tipoAgente ? `${item.tipoAgente} - ${item.capacidad || ''}` :
                                                item.tipo ? item.tipo :
                                                    item.nombre || 'Ítem Sin Nombre'}
                                        </h6>

                                        <div className="small text-muted mb-1">
                                            <Hash size={12} className="me-1" />
                                            <strong>ID:</strong> {item.codigo || 'S/C'}
                                        </div>

                                        <div className="small text-muted">
                                            <MapPin size={12} className="me-1" />
                                            {item.ubicacion || 'Sin ubicación'}
                                        </div>

                                        <div className="mt-2">
                                            {item.estadoGeneral || item.estado ? (
                                                <Badge bg="light" text="dark" className="border">
                                                    {item.estadoGeneral || item.estado}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted small fst-italic">Sin estado registrado</span>
                                            )}
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
