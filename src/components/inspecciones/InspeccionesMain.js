import React, { useState } from 'react';
import { Card, Nav, Tab } from 'react-bootstrap';
import InspectorWizard from './InspectorWizard';
import HistorialInspecciones from './HistorialInspecciones';
import ProgramacionInspecciones from './ProgramacionInspecciones';
import DashboardInspecciones from './DashboardInspecciones';

const InspeccionesMain = () => {
    const [activeTab, setActiveTab] = useState('programadas'); // Default per user context

    return (
        <div className="container-fluid fade-in">
            <h3 className="mb-4 text-secondary border-bottom pb-2">✅ Inspecciones y Auditorías SST</h3>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="dashboard" className="fw-bold text-primary">
                                📊 Dashboard
                            </Nav.Link>
                        </Nav.Item>
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
                        <Nav.Item>
                            <Nav.Link eventKey="programadas" className="fw-bold text-info">
                                📅 Programadas
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body>
                    <Tab.Content>
                        {activeTab === 'dashboard' && (
                            <div className="p-2">
                                <DashboardInspecciones />
                            </div>
                        )}
                        {activeTab === 'nueva' && (
                            <div className="p-2">
                                <InspectorWizard />
                            </div>
                        )}
                        {activeTab === 'historial' && (
                            <div className="p-2">
                                <HistorialInspecciones />
                            </div>
                        )}
                        {activeTab === 'programadas' && (
                            <div className="p-2">
                                <ProgramacionInspecciones />
                            </div>
                        )}
                    </Tab.Content>
                </Card.Body>
            </Card>
        </div>
    );
};

export default InspeccionesMain;
