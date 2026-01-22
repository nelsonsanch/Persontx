import React, { useState } from 'react';
import { Tab, Nav, Card, Button } from 'react-bootstrap';
// Se eliminan los iconos de Lucide para evitar errores de versión
// import { FireExtinguisher, FlaskConical, Stethoscope } from 'lucide-react';

// Importar Configuraciones
import { extintoresConfig } from './configs/extintoresConfig';
import { sustanciasQuimicasConfig } from './configs/sustanciasQuimicasConfig';
import { botiquinConfig } from './configs/botiquinConfig';
import { camillasConfig } from './configs/camillasConfig';
import { activosConfig } from './configs/activosConfig';
import { gabinetesConfig } from './configs/gabinetesConfig';
import { alturasConfig } from './configs/alturasConfig';
import { otrosConfig } from './configs/otrosConfig';

// Importar Motor
import GestorInventario from './GestorInventario';
import MatrizCompatibilidad from './MatrizCompatibilidad';

const InventariosMain = () => {
    const [activeTab, setActiveTab] = useState('extintores');
    const [showMatrix, setShowMatrix] = useState(false);

    // Mapa de íconos (Emojis para cero errores)
    const icons = {
        extintores: <span className="me-2">🧯</span>,
        quimicos: <span className="me-2">🧪</span>,
        botiquin: <span className="me-2">🩺</span>,
        camillas: <span className="me-2">🛏️</span>,
        activos: <span className="me-2">🛠️</span>,
        gabinetes: <span className="me-2">🚒</span>,
        alturas: <span className="me-2">🧗</span>,
        otros: <span className="me-2">📦</span>
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
                                        <Nav.Link eventKey="gabinetes" className="d-flex align-items-center mb-1">
                                            {icons.gabinetes} Gabinetes Contra Incendio
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
                                    <Nav.Item>
                                        <Nav.Link eventKey="camillas" className="d-flex align-items-center mb-1">
                                            {icons.camillas} Camillas
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="activos" className="d-flex align-items-center mb-1">
                                            {icons.activos} Herramientas y Equipos
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="alturas" className="d-flex align-items-center mb-1">
                                            {icons.alturas} Equipos de Alturas
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="otros" className="d-flex align-items-center mb-1">
                                            {icons.otros} Otros Equipos
                                        </Nav.Link>
                                    </Nav.Item>
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
                                    <Tab.Pane eventKey="gabinetes">
                                        <GestorInventario config={gabinetesConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="quimicos">
                                        <div className="d-flex justify-content-end mb-2">
                                            <Button
                                                variant="outline-warning"
                                                size="sm"
                                                onClick={() => setShowMatrix(true)}
                                                className="fw-bold"
                                            >
                                                ⚛️ Ver Matriz de Compatibilidad
                                            </Button>
                                        </div>
                                        <GestorInventario config={sustanciasQuimicasConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="botiquin">
                                        <GestorInventario config={botiquinConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="camillas">
                                        <GestorInventario config={camillasConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="activos">
                                        <GestorInventario config={activosConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="alturas">
                                        <GestorInventario config={alturasConfig} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="otros">
                                        <GestorInventario config={otrosConfig} />
                                    </Tab.Pane>
                                </Tab.Content>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </Tab.Container>


            {/* Modal de Matriz */}
            <MatrizCompatibilidad show={showMatrix} onHide={() => setShowMatrix(false)} />
        </div>
    );
};

export default InventariosMain;
