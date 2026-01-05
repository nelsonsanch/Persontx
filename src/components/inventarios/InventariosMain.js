import React, { useState } from 'react';
import { Tab, Nav, Card } from 'react-bootstrap';
// Se eliminan los iconos de Lucide para evitar errores de versión
// import { FireExtinguisher, FlaskConical, Stethoscope } from 'lucide-react';

// Importar Configuraciones
import { extintoresConfig } from './configs/extintoresConfig';
import { sustanciasQuimicasConfig } from './configs/sustanciasQuimicasConfig';
import { botiquinConfig } from './configs/botiquinConfig';

// Importar Motor
import GestorInventario from './GestorInventario';

const InventariosMain = () => {
    const [activeTab, setActiveTab] = useState('extintores');

    // Mapa de íconos (Emojis para cero errores)
    const icons = {
        extintores: <span className="me-2">🧯</span>,
        quimicos: <span className="me-2">🧪</span>,
        botiquin: <span className="me-2">🩺</span>
    };

    return (
        <div className="container-fluid fade-in">
            <h3 className="mb-4 text-secondary border-bottom pb-2">📦 Gestión de Inventarios SST</h3>

            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <div className="row">
                    <div className="col-md-3 mb-4">
                        <Card className="shadow-sm border-0">
                            <Card.Body className="p-0">
                                <Nav variant="pills" className="flex-column p-2">
                                    <Nav.Item>
                                        <Nav.Link eventKey="extintores" className="d-flex align-items-center mb-1">
                                            {icons.extintores} Extintores
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="quimicos" className="d-flex align-items-center mb-1">
                                            {icons.quimicos} Sustancias Químicas
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="botiquin" className="d-flex align-items-center mb-1">
                                            {icons.botiquin} Botiquines y Primeros Auxilios
                                        </Nav.Link>
                                    </Nav.Item>
                                    {/* Aquí se agregarán más tabs a futuro: Maquinaria, Herramientas, etc */}
                                </Nav>
                            </Card.Body>
                        </Card>

                        <div className="alert alert-light mt-3 small text-muted border">
                            <i className="bi bi-info-circle me-1"></i>
                            Seleccione una categoría para gestionar su inventario.
                        </div>
                    </div>

                    <div className="col-md-9">
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <Tab.Content>
                                    <Tab.Pane eventKey="extintores">
                                        <GestorInventario config={extintoresConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="quimicos">
                                        <GestorInventario config={sustanciasQuimicasConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="botiquin">
                                        <GestorInventario config={botiquinConfig} />
                                    </Tab.Pane>
                                </Tab.Content>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </Tab.Container>
        </div>
    );
};

export default InventariosMain;
