import React, { useState } from 'react';
import { Card, Nav } from 'react-bootstrap';
import GestorInventario from '../inventarios/GestorInventario';
import { vehiculosConfig } from '../inventarios/configs/vehiculosConfig';
import { Car, ClipboardCheck, BarChart2 } from 'lucide-react';

const GestionPESVMain = () => {
    const [activeTab, setActiveTab] = useState('vehiculos');

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-0 text-primary fw-bold">🚗 Gestión PESV</h2>
                    <p className="text-muted">Plan Estratégico de Seguridad Vial</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white pt-3 pb-0">
                    <Nav variant="tabs" className="border-bottom-0" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="vehiculos" className={activeTab === 'vehiculos' ? 'text-primary fw-bold border-bottom-0 bg-light' : 'text-muted border-0'}>
                                <Car size={18} className="me-2" />
                                Hojas de Vida (Vehículos)
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="seguimiento" className={activeTab === 'seguimiento' ? 'text-primary fw-bold border-bottom-0 bg-light' : 'text-muted border-0'}>
                                <ClipboardCheck size={18} className="me-2" />
                                Seguimiento y Diseños
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="indicadores" className={activeTab === 'indicadores' ? 'text-primary fw-bold border-bottom-0 bg-light' : 'text-muted border-0'}>
                                <BarChart2 size={18} className="me-2" />
                                Indicadores PESV
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body className="p-0 border-top">
                    {activeTab === 'vehiculos' && (
                        <div className="p-3">
                            <GestorInventario config={vehiculosConfig} />
                        </div>
                    )}
                    {activeTab === 'seguimiento' && (
                        <div className="p-5 text-center text-muted">
                            <h4>🚧 Módulo en Construcción</h4>
                            <p>Aquí se cargarán la información de seguimiento y diseño del PESV.</p>
                        </div>
                    )}
                    {activeTab === 'indicadores' && (
                        <div className="p-5 text-center text-muted">
                            <h4>🚧 Módulo en Construcción</h4>
                            <p>Aquí se visualizarán los indicadores de gestión del PESV.</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default GestionPESVMain;
