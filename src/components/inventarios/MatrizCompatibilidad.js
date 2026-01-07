import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Spinner, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { checkCompatibility, getChemicalClass } from '../../services/CompatibilityService';

const MatrizCompatibilidad = ({ show, onHide }) => {
    const { user } = useAuth();
    const [chemicals, setChemicals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!show || !user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'inventarios'),
                    where('clienteId', '==', user.uid),
                    where('categoria', '==', 'quimicos')
                );
                const snapshot = await getDocs(q);
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setChemicals(docs);
            } catch (error) {
                console.error("Error cargando químicos:", error);
            }
            setLoading(false);
        };

        fetchData();
    }, [show, user]);

    // Renderizar celda de intersección
    const renderIntersection = (chemA, chemB) => {
        const result = checkCompatibility(chemA, chemB);

        return (
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{result.msg}</Tooltip>}
            >
                <div
                    style={{
                        backgroundColor: result.color,
                        color: 'white',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        cursor: 'help',
                        fontSize: '14px'
                    }}
                >
                    {result.icon}
                </div>
            </OverlayTrigger>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>🧪 Matriz de Compatibilidad Química Auto-Generada</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" role="status" />
                        <p className="mt-2">Analizando interacciones químicas...</p>
                    </div>
                ) : chemicals.length < 2 ? (
                    <div className="alert alert-warning text-center">
                        Se necesitan al menos 2 sustancias químicas registradas para generar la matriz.
                    </div>
                ) : (
                    <div>
                        <p className="text-muted small">
                            Esta matriz se genera automáticamente analizando el Rombo NFPA y la clasificación GHS de sus sustancias.
                        </p>
                        <Table bordered responsive size="sm" className="text-center align-middle table-hover">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '150px' }} className="bg-light">Sustancia</th>
                                    {chemicals.map((chem, idx) => (
                                        <th key={idx} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', minHeight: '100px', maxHeight: '150px' }} className="bg-light text-truncate">
                                            {chem.nombreProducto}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {chemicals.map((rowChem, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td className="fw-bold text-start bg-light">{rowChem.nombreProducto}</td>
                                        {chemicals.map((colChem, colIdx) => (
                                            <td key={colIdx} className="p-1">
                                                <div className="d-flex justify-content-center">
                                                    {renderIntersection(rowChem, colChem)}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <div className="d-flex gap-3 justify-content-center mt-3 border-top pt-3">
                            <div className="d-flex align-items-center"><span className="badge me-2" style={{ backgroundColor: '#198754' }}>✅</span> Compatible</div>
                            <div className="d-flex align-items-center"><span className="badge me-2" style={{ backgroundColor: '#ffc107', color: 'black' }}>⚠️</span> Precaución / Segregar</div>
                            <div className="d-flex align-items-center"><span className="badge me-2" style={{ backgroundColor: '#dc3545' }}>⛔</span> Incompatible / Peligro</div>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MatrizCompatibilidad;
