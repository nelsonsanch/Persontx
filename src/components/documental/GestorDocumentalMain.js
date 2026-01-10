import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Button } from 'react-bootstrap';
import TemplateEditor from './TemplateEditor';
import DocumentGenerator from './DocumentGenerator';
import RepositorioDocumental from './RepositorioDocumental';
import { FileText, PenTool, Archive } from 'lucide-react';

const GestorDocumentalMain = () => {
    const [activeTab, setActiveTab] = useState('generar');

    return (
        <Container fluid className="p-3">
            <h3 className="mb-4 text-secondary border-bottom pb-2">
                📄 Gestor Documental Inteligente
            </h3>

            <Row>
                <Col md={3}>
                    <Card className="shadow-sm border-0 mb-3">
                        <Card.Body className="p-2">
                            <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                                <Nav.Item>
                                    <Nav.Link eventKey="generar" className="mb-1">
                                        <FileText size={18} className="me-2" />
                                        Generar Documento
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="plantillas" className="mb-1">
                                        <PenTool size={18} className="me-2" />
                                        Gestionar Plantillas
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="repositorio" className="mb-1">
                                        <Archive size={18} className="me-2" />
                                        Repositorio / Bóveda
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 bg-light">
                        <Card.Body>
                            <small className="text-muted">
                                🤖 <strong>Asistente IA:</strong> Selecciona "Generar Documento" y dime qué necesitas redactar.
                            </small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={9}>
                    <Card className="shadow-sm border-0" style={{ minHeight: '500px' }}>
                        <Card.Body>
                            {activeTab === 'generar' && <DocumentGenerator onGoToTemplates={() => setActiveTab('plantillas')} />}
                            {activeTab === 'plantillas' && <TemplateEditor />}
                            {activeTab === 'repositorio' && <RepositorioDocumental />}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default GestorDocumentalMain;
