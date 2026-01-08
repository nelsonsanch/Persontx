import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    limit
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { Trash2, Edit, Plus, FileText, Eye } from 'lucide-react';

const GestorInventario = ({ config }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [catalogSuggestions, setCatalogSuggestions] = useState([]); // Sugerencias del catálogo global
    const [catalogQuery, setCatalogQuery] = useState(''); // Lo que escribe el usuario para buscar
    const [uploading, setUploading] = useState(false); // Estado de carga de imagen

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

    // Abrir modal de visualización
    const openViewModal = (item) => {
        setViewingItem(item);
        setViewModalOpen(true);
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

    // Manejar cambios en inputs Checkbox (Array)
    const handleChecklistChange = (fieldName, option) => {
        const currentValues = formData[fieldName] || [];
        if (currentValues.includes(option)) {
            setFormData({ ...formData, [fieldName]: currentValues.filter(v => v !== option) });
        } else {
            setFormData({ ...formData, [fieldName]: [...currentValues, option] });
        }
    };

    // Manejar cambios en inputs de Cantidad (Checklist con Valor)
    const handleQuantityChange = (fieldName, item, value) => {
        const currentData = formData[fieldName] || {};
        // Si el valor está vacío, lo eliminamos del objeto para no guardar basura
        if (value === '' || value === '0') {
            const newData = { ...currentData };
            delete newData[item];
            setFormData({ ...formData, [fieldName]: newData });
        } else {
            setFormData({ ...formData, [fieldName]: { ...currentData, [item]: value } });
        }
    };

    // Buscar en Catálogo Global
    const handleCatalogSearch = async (text) => {
        setCatalogQuery(text);
        if (text.length < 3) {
            setCatalogSuggestions([]);
            return;
        }

        try {
            // Busqueda simple por prefijo (case-sensitive en Firestore por defecto, idealmente normalizar)
            const q = query(
                collection(db, 'catalogo_global_activos'),
                where('nombre', '>=', text),
                where('nombre', '<=', text + '\uf8ff'),
                limit(5)
            );
            const snapshot = await getDocs(q);
            setCatalogSuggestions(snapshot.docs.map(d => d.data().nombre));
        } catch (error) {
            console.error("Error buscando en catálogo:", error);
        }
    };

    // Agregar al Catálogo Global
    const addToGlobalCatalog = async (fieldName) => {
        if (!catalogQuery) return;
        const nombre = catalogQuery.trim(); // Guardar como está escrito (respetando mayúsculas del usuario)

        try {
            // Verificar si ya existe (para no duplicar exactos)
            const q = query(collection(db, 'catalogo_global_activos'), where('nombre', '==', nombre));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                alert("Este ítem ya existe en el catálogo global.");
            } else {
                await addDoc(collection(db, 'catalogo_global_activos'), {
                    nombre,
                    creadoPor: user.email,
                    fechaCreacion: new Date().toISOString()
                });
                alert("¡Agregado al Catálogo Global! Ahora todos pueden verlo.");
            }
            // Seleccionar el ítem
            setFormData({ ...formData, [fieldName]: nombre });
            setCatalogSuggestions([]);
        } catch (error) {
            console.error("Error creando catálogo:", error);
            alert("Error al conectar con el catálogo global.");
        }
    };

    // Seleccionar sugerencia
    const selectCatalogItem = (fieldName, val) => {
        setFormData({ ...formData, [fieldName]: val });
        setCatalogQuery(val);
        setCatalogSuggestions([]);
    };

    // Manejar subida de imagenes
    const handleImageUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `inventarios/${config.filtroCategoria}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setFormData({ ...formData, [fieldName]: url });
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert("Error al subir la imagen");
        }
        setUploading(false);
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
            case 'select_with_description':
                // Buscar la descripción de la opción seleccionada
                const selectedOpt = field.options.find(o => o.value === formData[field.name]);
                return (
                    <div>
                        <Form.Select
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(e, field.name)}
                            required={field.required}
                        >
                            <option value="">Seleccione...</option>
                            {field.options.map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.value}</option>
                            ))}
                        </Form.Select>
                        {selectedOpt && (
                            <Form.Text className="text-muted d-block mt-1">
                                <i className="bi bi-info-circle me-1"></i>
                                {selectedOpt.desc}
                            </Form.Text>
                        )}
                    </div>
                );
            case 'global_catalog_select':
                return (
                    <div>
                        <div className="input-group mb-1">
                            <Form.Control
                                type="text"
                                placeholder={field.placeholder || "Buscar en catálogo global..."}
                                value={formData[field.name] || catalogQuery}
                                onChange={(e) => {
                                    handleInputChange(e, field.name);
                                    handleCatalogSearch(e.target.value);
                                }}
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => addToGlobalCatalog(field.name)}
                                title="Crear en Catálogo Global si no existe"
                            >
                                <Plus size={18} /> Crear Nuevo
                            </Button>
                        </div>
                        {/* Lista de Sugerencias */}
                        {catalogSuggestions.length > 0 && (
                            <ul className="list-group position-absolute shadow w-50" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                {catalogSuggestions.map((sug, idx) => (
                                    <li
                                        key={idx}
                                        className="list-group-item list-group-item-action cursor-pointer"
                                        onClick={() => selectCatalogItem(field.name, sug)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {sug}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Form.Text className="text-muted">
                            Si no aparece en la lista, escríbalo completo y haga clic en "Crear Nuevo" para compartirlo con la comunidad.
                        </Form.Text>
                    </div>
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
            case 'image':
                return (
                    <div className="border p-2 rounded">
                        {formData[field.name] ? (
                            <div className="mb-2 text-center position-relative">
                                <img
                                    src={formData[field.name]}
                                    alt="Vista previa"
                                    style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '4px' }}
                                />
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="position-absolute top-0 end-0 m-1"
                                    onClick={() => setFormData({ ...formData, [field.name]: '' })}
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        ) : (
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, field.name)}
                                disabled={uploading}
                            />
                        )}
                        {uploading && <small className="text-primary">Subiendo imagen...</small>}
                    </div>
                );
            case 'checklist':
                return (
                    <div className="border p-2 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {field.options.map((opt, idx) => (
                            <Form.Check
                                key={idx}
                                type="checkbox"
                                label={opt}
                                checked={(formData[field.name] || []).includes(opt)}
                                onChange={() => handleChecklistChange(field.name, opt)}
                            />
                        ))}
                    </div>
                );
            case 'checklist_with_quantity':
                return (
                    <div className="border p-2 rounded bg-light" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <small className="text-muted d-block mb-2">Ingrese la cantidad para los elementos disponibles:</small>
                        {field.options.map((opt, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                                <label className="small mb-0 flex-grow-1" style={{ lineHeight: '1.2' }}>{opt}</label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    style={{ width: '70px' }}
                                    placeholder="Cant."
                                    value={(formData[field.name] || {})[opt] || ''}
                                    onChange={(e) => handleQuantityChange(field.name, opt, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                );
            case 'nfpa_diamond':
                // Inicializar objeto si no existe
                const diamond = formData[field.name] || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '' };

                const handleDiamondChange = (subField, value) => {
                    setFormData({ ...formData, [field.name]: { ...diamond, [subField]: value } });
                };

                return (
                    <div className="d-flex justify-content-center p-3 border rounded bg-light">
                        <div style={{ width: '200px', position: 'relative', height: '200px' }}>
                            {/* Azul - Salud (Izquierda) */}
                            <div style={{ position: 'absolute', left: '0', top: '50px', width: '100px', height: '100px', backgroundColor: '#007bff', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.salud}
                                    onChange={(e) => handleDiamondChange('salud', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                >
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </Form.Control>
                            </div>

                            {/* Rojo - Inflamabilidad (Arriba) */}
                            <div style={{ position: 'absolute', left: '50px', top: '0', width: '100px', height: '100px', backgroundColor: '#dc3545', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.inflamabilidad}
                                    onChange={(e) => handleDiamondChange('inflamabilidad', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                >
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </Form.Control>
                            </div>

                            {/* Amarillo - Reactividad (Derecha) */}
                            <div style={{ position: 'absolute', left: '100px', top: '50px', width: '100px', height: '100px', backgroundColor: '#ffc107', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.reactividad}
                                    onChange={(e) => handleDiamondChange('reactividad', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                >
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </Form.Control>
                            </div>

                            {/* Blanco - Especial (Abajo) */}
                            <div style={{ position: 'absolute', left: '50px', top: '100px', width: '100px', height: '100px', backgroundColor: 'white', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ccc' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.especial}
                                    onChange={(e) => handleDiamondChange('especial', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '70px', textAlign: 'center', fontSize: '11px' }}
                                >
                                    <option value="">-</option>
                                    <option value="OX">OX (Oxidante)</option>
                                    <option value="W"><s>W</s> (No Agua)</option>
                                    <option value="ACID">ACID</option>
                                    <option value="ALC">ALC</option>
                                    <option value="BIO">BIO</option>
                                    <option value="RAD">RAD</option>
                                    <option value="COR">COR</option>
                                </Form.Control>
                            </div>
                        </div>
                    </div>
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

    // Renderizar Celda Personalizada (Tabla)
    const renderCell = (item, field) => {
        const value = item[field.name];

        if (field.type === 'nfpa_diamond') {
            const diamond = value || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '-' };
            return (
                <div style={{ position: 'relative', width: '40px', height: '40px', margin: '0 auto' }}>
                    {/* Mini Rombo Visual */}
                    <div style={{ position: 'absolute', top: '0', left: '10px', width: '20px', height: '20px', background: '#dc3545', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                        <span style={{ transform: 'rotate(-45deg)' }}>{diamond.inflamabilidad}</span>
                    </div>
                    <div style={{ position: 'absolute', top: '10px', left: '0', width: '20px', height: '20px', background: '#007bff', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                        <span style={{ transform: 'rotate(-45deg)' }}>{diamond.salud}</span>
                    </div>
                    <div style={{ position: 'absolute', top: '10px', left: '20px', width: '20px', height: '20px', background: '#ffc107', color: 'black', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                        <span style={{ transform: 'rotate(-45deg)' }}>{diamond.reactividad}</span>
                    </div>
                    <div style={{ position: 'absolute', top: '20px', left: '10px', width: '20px', height: '20px', background: 'white', border: '1px solid #ccc', color: 'black', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                        <span style={{ transform: 'rotate(-45deg)', marginTop: '2px' }}>{diamond.especial || '-'}</span>
                    </div>
                </div>
            );
        }

        if (field.type === 'checklist') {
            return (value || []).length + ' ítems';
        }

        if (field.type === 'checklist_with_quantity') {
            const count = Object.keys(value || {}).length;
            return <Badge bg={count > 0 ? "success" : "secondary"}>{count} elementos</Badge>;
        }

        if (field.type === 'image') {
            return value ? (
                <img
                    src={value}
                    alt="Img"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => { setViewingItem(item); setViewModalOpen(true); }}
                />
            ) : <span className="text-muted small">Sin foto</span>;
        }

        return value;
    };

    // Campos a mostrar en la tabla (filtrados por showInTable o los primeros 5 por defecto)
    const tableFields = config.campos.filter(f => f.showInTable);
    const fieldsToRender = tableFields.length > 0 ? tableFields : config.campos.slice(0, 5);

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
                    <Table hover striped bordered className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                {fieldsToRender.map((field, idx) => (
                                    <th key={idx} className="text-center">{field.label}</th>
                                ))}
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    {fieldsToRender.map((field, idx) => (
                                        <td key={idx} className="text-center">
                                            {renderCell(item, field)}
                                        </td>
                                    ))}
                                    <td className="text-center">
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            className="me-2"
                                            title="Ver Detalle"
                                            onClick={() => openViewModal(item)}
                                        >
                                            <Eye size={16} />
                                        </Button>
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

            {/* Modal de Creación/Edición */}
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

            {/* Modal de Visualización (Solo Lectura) */}
            <Modal show={viewModalOpen} onHide={() => setViewModalOpen(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Detalle del Elemento</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {viewingItem && (
                        <div className="row">
                            {config.campos.map((field, idx) => {
                                const val = viewingItem[field.name];
                                return (
                                    <div key={idx} className="col-md-6 mb-4">
                                        <h6 className="text-muted small text-uppercase mb-1">{field.label}</h6>

                                        {field.type === 'nfpa_diamond' ? (
                                            // Renderizar Rombo ReadOnly
                                            renderCell(viewingItem, field)
                                        ) : field.type === 'checklist_with_quantity' ? (
                                            // Renderizar Lista de Cantidades
                                            <div className="border rounded p-2 bg-light">
                                                {val && Object.keys(val).length > 0 ? (
                                                    <ul className="list-unstyled mb-0 small">
                                                        {Object.entries(val).map(([k, v], i) => (
                                                            <li key={i} className="d-flex justify-content-between border-bottom py-1">
                                                                <span>{k}</span>
                                                                <Badge bg="primary" pill>{v}</Badge>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <span className="text-muted fst-italic">Sin elementos registrados</span>}
                                            </div>
                                        ) : field.type === 'checklist' ? (
                                            // Renderizar Lista Simple
                                            <ul className="list-unstyled mb-0 small border rounded p-2 bg-light">
                                                {val && val.length > 0 ? val.map((opt, i) => (
                                                    <li key={i}>✓ {opt}</li>
                                                )) : <span className="text-muted">Ninguno</span>}
                                            </ul>
                                        ) : field.type !== 'image' && (
                                            // Texto plano (NO mostrar si es imagen, ya que la imagen se muestra abajo)
                                            <p className="fw-bold mb-0">{val || '-'}</p>
                                        )}

                                        {/* Caso Especial: Si es Imagen renderizar abajo */}
                                        {field.type === 'image' && val && (
                                            <div className="mt-2 text-center">
                                                <img src={val} alt="Detalle" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '300px' }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setViewModalOpen(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GestorInventario;
