import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

// Importar configuraciones para saber qué existe
import { extintoresConfig } from '../../inventarios/configs/extintoresConfig';
import { botiquinConfig } from '../../inventarios/configs/botiquinConfig';
import { camillasConfig } from '../../inventarios/configs/camillasConfig';
import { gabinetesConfig } from '../../inventarios/configs/gabinetesConfig';
import { otrosConfig } from '../../inventarios/configs/otrosConfig';
import { sustanciasQuimicasConfig } from '../../inventarios/configs/sustanciasQuimicasConfig';
import { alturasConfig } from '../../inventarios/configs/alturasConfig';
import { activosConfig } from '../../inventarios/configs/activosConfig'; // Importamos activosConfig

const SeleccionCategoria = ({ onSelect }) => {

    const categories = [
        { key: 'extintores', label: 'Extintores', icon: '🧯', config: extintoresConfig, color: 'danger' },
        { key: 'gabinetes', label: 'Gabinetes Incendio', icon: '🚒', config: gabinetesConfig, color: 'danger' },
        { key: 'botiquin', label: 'Botiquines', icon: '🩺', config: botiquinConfig, color: 'primary' },
        { key: 'camillas', label: 'Camillas', icon: '🛏️', config: camillasConfig, color: 'info' },
        { key: 'alturas', label: 'Equipos de Alturas', icon: '🧗', config: alturasConfig, color: 'primary' }, // NUEVO
        { key: 'quimicos', label: 'Sustancias Químicas', icon: '🧪', config: sustanciasQuimicasConfig, color: 'warning' },
        { key: 'activos', label: 'Herramientas', icon: '🛠️', config: activosConfig, color: 'secondary' },
        { key: 'otros', label: 'Otros Equipos', icon: '📦', config: otrosConfig, color: 'dark' },
    ];

    return (
        <div>
            <h4 className="text-center mb-4">¿Qué vamos a inspeccionar hoy?</h4>
            <Row className="justify-content-center">
                {categories.map((cat) => (
                    <Col xs={6} md={3} lg={2} key={cat.key} className="mb-4">
                        <Card
                            className={`h-100 shadow-sm border-${cat.color} text-center category-card`}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => onSelect(cat.key, cat.config)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <div style={{ fontSize: '3rem' }} className="mb-2">{cat.icon}</div>
                                <h6 className="mb-0 text-dark">{cat.label}</h6>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default SeleccionCategoria;
