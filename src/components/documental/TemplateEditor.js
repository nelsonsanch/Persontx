import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Card, Button, Form, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Save, Edit, FileText, DownloadCloud } from 'lucide-react';

const STANDARD_TEMPLATES = [
    {
        titulo: 'Acta de Reunión General',
        codigoBase: 'ACT-GEN',
        contenido: `<h2 style="text-align: center;">ACTA DE REUNIÓN</h2>
<p><strong>Fecha:</strong> {{FECHA_ACTUAL}}</p>
<p><strong>Hora:</strong> {{HORA_ACTUAL}}</p>
<p><strong>Lugar:</strong> {{LUGAR}}</p>

<h3>1. OBJETIVO</h3>
<p>{{OBJETIVO}}</p>

<h3>2. ASISTENTES</h3>
<p>{{ASISTENTES}}</p>

<h3>3. TEMAS TRATADOS</h3>
<p>{{DESARROLLO}}</p>

<h3>4. COMPROMISOS</h3>
<p>{{COMPROMISOS}}</p>

<br><br>
<p>__________________________</p>
<p>Firma Responsable</p>`
    },
    {
        titulo: 'Constancia Laboral',
        codigoBase: 'RRHH-CT',
        contenido: `<h2 style="text-align: center;">CONSTANCIA LABORAL</h2>
<p style="text-align: right;">{{CIUDAD}}, {{FECHA_ACTUAL}}</p>
<br>
<p><strong>A QUIEN INTERESE:</strong></p>
<br>
<p>Por medio de la presente se certifica que el señor(a) <strong>{{NOMBRE_TRABAJADOR}}</strong>, identificado con cédula de ciudadanía número <strong>{{CEDULA}}</strong>, labora en nuestra empresa <strong>{{EMPRESA}}</strong>.</p>
<br>
<p><strong>Cargo:</strong> {{CARGO}}</p>
<p><strong>Tipo de Contrato:</strong> {{TIPO_CONTRATO}}</p>
<p><strong>Fecha de Ingreso:</strong> {{FECHA_INGRESO}}</p>
<p><strong>Salario Mensual:</strong> {{SALARIO}}</p>
<br>
<p>Se expide a solicitud del interesado.</p>
<br><br>
<p>Atentamente,</p>
<br>
<p>__________________________</p>
<p><strong>Gerencia de Talento Humano</strong></p>`
    },
    {
        titulo: 'Memorando Interno',
        codigoBase: 'MEMO',
        contenido: `<h2 style="text-align: center;">MEMORANDO INTERNO</h2>
<p><strong>Fecha:</strong> {{FECHA_ACTUAL}}</p>
<p><strong>Para:</strong> {{DESTINATARIO}}</p>
<p><strong>De:</strong> {{REMITENTE}}</p>
<p><strong>Asunto:</strong> {{ASUNTO}}</p>
<hr>
<br>
<p>{{CUERPO_DEL_MENSAJE}}</p>
<br>
<p>Cordialmente,</p>
<br>
<p>__________________________</p>
<p>{{REMITENTE}}</p>`
    }
];

const TemplateEditor = () => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estado del formulario
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [baseCode, setBaseCode] = useState('');

    // Cargar plantillas
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'plantillas_documentos'),
            where('empresaId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Limpiar formulario para nueva plantilla
    const handleNew = () => {
        setSelectedTemplate(null);
        setTitle('');
        setBaseCode('');
        setContent('<h1>Título del Documento</h1><p>Ciudad, {{FECHA_ACTUAL}}</p><p><br></p><p><strong>ASUNTO: </strong>{{ASUNTO}}</p><p><br></p><p>Cordial saludo,</p><p><br></p><p>{{CONTENIDO}}</p><p><br></p><p>Atentamente,</p><p><strong>{{NOMBRE_USUARIO}}</strong></p><p>{{CARGO_USUARIO}}</p>');
    };

    // Cargar plantilla existente para edición
    const handleSelect = (tmpl) => {
        setSelectedTemplate(tmpl);
        setTitle(tmpl.titulo);
        setBaseCode(tmpl.codigoBase);
        setContent(tmpl.contenido);
    };

    // Guardar (Crear o Actualizar)
    const handleSave = async () => {
        if (!title || !baseCode || !content) {
            alert("Por favor complete todos los campos");
            return;
        }

        setSaving(true);
        try {
            const data = {
                empresaId: user.uid,
                titulo,
                codigoBase,
                contenido,
                version: selectedTemplate ? (selectedTemplate.version || 1) + 1 : 1,
                updatedAt: new Date()
            };

            if (selectedTemplate) {
                await updateDoc(doc(db, 'plantillas_documentos', selectedTemplate.id), data);
            } else {
                await addDoc(collection(db, 'plantillas_documentos'), {
                    ...data,
                    createdAt: new Date(),
                    version: 1
                });
            }
            handleNew(); // Resetear form
            alert("Plantilla guardada correctamente");
        } catch (error) {
            console.error("Error guardando plantilla:", error);
            alert("Error al guardar");
        }
        setSaving(false);
    };

    // Cargar Plantillas Estándar
    const handleLoadDefaults = async () => {
        if (!window.confirm("¿Deseas cargar 3 plantillas profesionales (Acta, Constancia, Memo) a tu lista?")) return;

        setSaving(true);
        try {
            const batchPromises = STANDARD_TEMPLATES.map(tmpl => {
                return addDoc(collection(db, 'plantillas_documentos'), {
                    ...tmpl,
                    empresaId: user.uid,
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            });
            await Promise.all(batchPromises);
            alert("¡Plantillas cargadas! Ahora ve a 'Generar Documento' para usarlas.");
        } catch (error) {
            console.error(error);
            alert("Error cargando plantillas.");
        }
        setSaving(false);
    };

    // Configuración de la barra de herramientas de Quill
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
        ],
    };

    return (
        <div className="row h-100">
            {/* Lista Lateral */}
            <div className="col-md-4 border-end">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Mis Plantillas</h5>
                    <Button variant="outline-primary" size="sm" onClick={handleNew}>
                        <Plus size={16} /> Nueva
                    </Button>
                </div>

                {/* Botón Mágico de Carga */}
                {templates.length === 0 && !loading && (
                    <div className="p-3 mb-3 bg-light rounded text-center">
                        <small className="d-block mb-2 text-muted">¿No quieres empezar desde cero?</small>
                        <Button variant="success" size="sm" className="w-100" onClick={handleLoadDefaults} disabled={saving}>
                            <DownloadCloud size={16} className="me-2" />
                            {saving ? 'Cargando...' : 'Cargar Modelos Pro'}
                        </Button>
                    </div>
                )}

                {loading ? <Spinner animation="border" size="sm" /> : (
                    <ListGroup variant="flush">
                        {templates.map(tmpl => (
                            <ListGroup.Item
                                key={tmpl.id}
                                action
                                active={selectedTemplate?.id === tmpl.id}
                                onClick={() => handleSelect(tmpl)}
                            >
                                <div className="d-flex justify-content-between">
                                    <strong>{tmpl.titulo}</strong>
                                    <Badge bg="secondary">v{tmpl.version}</Badge>
                                </div>
                                <small className="text-muted">{tmpl.codigoBase}</small>
                            </ListGroup.Item>
                        ))}
                        {templates.length === 0 && (
                            <p className="text-muted small text-center mt-3">No hay plantillas creadas.</p>
                        )}
                    </ListGroup>
                )}
            </div>

            {/* Editor Central */}
            <div className="col-md-8">
                <Card className="border-0">
                    <Card.Body>
                        <Alert variant="info" className="py-2 small">
                            <strong>💡 Tips:</strong> Use variables como <code>{`{{FECHA}}`}</code>, <code>{`{{NOMBRE}}`}</code>, <code>{`{{CARGO}}`}</code> para que la IA las rellene automáticamente.
                        </Alert>

                        <Form.Group className="mb-3">
                            <Form.Label>Título del Formato</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej: Acta de Reunión Gerencial"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Código Base (Para consecutivos)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej: ACT-GER"
                                value={baseCode}
                                onChange={e => setBaseCode(e.target.value.toUpperCase())}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Diseño del Documento</Form.Label>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={modules}
                                style={{ height: '300px', marginBottom: '50px' }}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2 mt-5">
                            {selectedTemplate && (
                                <Button variant="outline-secondary" onClick={handleNew}>
                                    Cancelar Edición
                                </Button>
                            )}
                            <Button variant="primary" onClick={handleSave} disabled={saving}>
                                <Save size={18} className="me-2" />
                                {saving ? 'Guardando...' : 'Guardar Plantilla'}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default TemplateEditor;
