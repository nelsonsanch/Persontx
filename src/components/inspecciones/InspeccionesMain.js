import React, { useState } from 'react';
import { Card, Nav, Tab } from 'react-bootstrap';
import InspectorWizard from './InspectorWizard';
// import HistorialInspecciones from './HistorialInspecciones'; // Lo crearemos luego

const InspeccionesMain = () => {
    const [activeTab, setActiveTab] = useState('nueva');

    return (
        <div className="container-fluid fade-in">
            <h3 className="mb-4 text-secondary border-bottom pb-2">✅ Inspecciones y Auditorías SST</h3>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="nueva" className="fw-bold">
                                ➕ Nueva Inspección
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="historial" className="fw-bold">
                                📜 Historial
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body>
                    <Tab.Content>
                        {activeTab === 'nueva' && (
                            <div className="p-2">
                                <InspectorWizard />
                            </div>
                        )}
                        {activeTab === 'historial' && (
                            <div className="text-center py-5 text-muted">
                                🚧 Módulo de Historial en Construcción
                            </div>
                        )}
                    </Tab.Content>
                </Card.Body>
            </Card>
        </div>
    );
};

export default InspeccionesMain;
