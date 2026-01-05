import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { Trash2, Edit, Plus, FileText } from 'lucide-react';

const GestorInventario = ({ config }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);

    // Cargar datos en tiempo real
    useEffect(() => {
        if (!user || !config) return;

        setLoading(true);
        const q = query(
            collection(db, config.coleccion),
            where('clienteId', '==', user.uid),
            where('categoria', '==', config.filtroCategoria)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, config]);

    // Manejar cambios en inputs
    const handleInputChange = (e, fieldName) => {
        setFormData({ ...formData, [fieldName]: e.target.value });
    };

    // Abrir modal (Crear o Editar)
    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData(item);
        } else {
            setFormData({}); // Limpiar form
        }
        setShowModal(true);
    };

    // Guardar (Crear o Actualizar)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;

        try {
            const dataToSave = {
                ...formData,
                clienteId: user.uid,
                categoria: config.filtroCategoria, // Asegurar que se guarde con la categoría correcta
                fechaActualizacion: new Date().toISOString()
            };

            if (editingItem) {
                await updateDoc(doc(db, config.coleccion, editingItem.id), dataToSave);
            } else {
                await addDoc(collection(db, config.coleccion), dataToSave);
            }

            setShowModal(false);
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar el ítem");
        }
    };

    // Eliminar
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este elemento?')) {
            await deleteDoc(doc(db, config.coleccion, id));
        }
    };

    // Renderizar Input Dinámico
    const renderInput = (field) => {
        switch (field.type) {
            case 'select':
                return (
                    <Form.Select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        required={field.required}
                    >
                        <option value="">Seleccione...</option>
                        {field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </Form.Select>
                );
            case 'textarea':
                return (
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        placeholder={field.placeholder}
                    />
                );
            default: // text, date, number
                return (
                    <Form.Control
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        required={field.required}
                        placeholder={field.placeholder}
                    />
                );
        }
    };

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0 text-primary">{config.titulo}</h4>
                <Button onClick={() => openModal()} variant="success">
                    <Plus size={18} className="me-2" />
                    Agregar Nuevo
                </Button>
            </div>

            {loading ? (
                <p>Cargando inventario...</p>
            ) : items.length === 0 ? (
                <Alert variant="info">No hay elementos registrados en este inventario.</Alert>
            ) : (
                <div className="table-responsive shadow-sm rounded">
                    <Table hover striped bordered>
                        <thead className="bg-light">
                            <tr>
                                {/* Renderizar headers dinámicamente (solo los primeros 4 campos para no saturar) */}
                                {config.campos.slice(0, 4).map((field, idx) => (
                                    <th key={idx}>{field.label}</th>
                                ))}
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    {config.campos.slice(0, 4).map((field, idx) => (
                                        <td key={idx}>{item[field.name]}</td>
                                    ))}
                                    <td className="text-center">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => openModal(item)}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Modal Dinámico */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? 'Editar Elemento' : 'Nuevo Elemento'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <div className="row">
                            {config.campos.map((field, idx) => (
                                <div key={idx} className="col-md-6 mb-3">
                                    <Form.Group>
                                        <Form.Label>{field.label}</Form.Label>
                                        {renderInput(field)}
                                    </Form.Group>
                                </div>
                            ))}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default GestorInventario;
