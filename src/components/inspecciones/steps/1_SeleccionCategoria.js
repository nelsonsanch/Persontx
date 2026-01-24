import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { INSPECTION_CATEGORIES } from '../configMap';

const SeleccionCategoria = ({ onSelect }) => {

    return (
        <div>
            <h4 className="text-center mb-4">¿Qué vamos a inspeccionar hoy?</h4>
            <Row className="justify-content-center">
                {INSPECTION_CATEGORIES.map((cat) => (
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
