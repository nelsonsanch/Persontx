
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Form, Row, Col, Spinner, InputGroup, Modal } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../../hooks/useAuth';
import { Download, Eye, Search, Upload, FileText, Image as ImageIcon, ExternalLink, Trash2, FileSpreadsheet, FileBarChart } from 'lucide-react';

const RepositorioDocumental = () => {
    const { user } = useAuth();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [metadata, setMetadata] = useState({
        nombre: '',
        fecha: '',
        codigo: '',
        proceso: 'SST' // Default
    });

    const procesos = [
        "Gestión Humana",
        "SST (Seguridad y Salud)",
        "Operativo / Producción",
        "Administrativo / Legal",
        "Calidad",
        "Comercial",
        "Otro"
    ];

    // Cargar documentos
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'repositorio_documentos'),
            where('empresaId', '==', user.uid),
            orderBy('fechaCreacion', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate() // Convertir timestamp
            }));
            setDocs(docsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Paso 1: Seleccionar Archivo
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tamaño (max 10MB para office/pdf)
        if (file.size > 10 * 1024 * 1024) {
            alert("El archivo es demasiado grande (Máx 10MB).");
            return;
        }

        setFileToUpload(file);
        // Pre-llenar datos
        setMetadata({
            nombre: file.name.split('.').slice(0, -1).join('.'), // Nombre sin extensión
            fecha: new Date().toISOString().split('T')[0], // Hoy YYYY-MM-DD
            codigo: '',
            proceso: 'SST'
        });
        setShowModal(true);
        e.target.value = ''; // Limpiar input
    };

    // Paso 2: Subir con Metadata y Versionamiento
    const handleUploadConfirm = async () => {
        if (!fileToUpload) return;
        if (!metadata.nombre || !metadata.fecha || !metadata.proceso) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        setUploading(true);
        try {
            // Lógica de Versionamiento (Nombre único)
            let finalName = metadata.nombre;
            const extension = fileToUpload.name.split('.').pop();
            const fullDuplicateCheck = `${finalName}.${extension}`;

            // Verificar duplicados en la lista actual
            const existingDocs = docs.filter(d => d.nombreArchivo === fullDuplicateCheck);

            if (existingDocs.length > 0) {
                // Ya existe, buscar el siguiente número
                // Simplificación: Agregar timestamp corto o contar duplicados + 1. 
                // El usuario pidió orden ascendente: "Nombre (1)", "Nombre (2)"

                let counter = 1;
                let newName = `${metadata.nombre} (${counter})`;
                while (docs.some(d => d.nombreArchivo === `${newName}.${extension}`)) {
                    counter++;
                    newName = `${metadata.nombre} (${counter})`;
                }
                finalName = newName;
            }

            const finalFileName = `${finalName}.${extension}`;

            // 1. Subir a Storage
            const dateStr = metadata.fecha.replace(/-/g, ''); // YYYYMMDD
            const sanitizedStorageName = `${dateStr}_${finalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const storagePath = `evidencias/${user.uid}/${sanitizedStorageName}`;

            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, fileToUpload);
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Guardar en Firestore con Metadata Completa
            await addDoc(collection(db, 'repositorio_documentos'), {
                empresaId: user.uid,
                tipoDocumento: metadata.proceso, // Usamos el proceso como "Categoría" principal
                subTipo: 'Evidencia Externa',
                nombreArchivo: finalFileName,
                codigo: metadata.codigo || 'S/C',
                procesoAsociado: metadata.proceso,
                urlPdf: downloadUrl,
                tipoArchivo: fileToUpload.type,
                fechaCreacion: new Date(metadata.fecha), // Fecha seleccionada por usuario
                fechaSubida: new Date(), // Auditoría
                estado: 'cargado',
                rutaStorage: storagePath
            });

            alert("✅ Documento subido y clasificado correctamente.");
            setShowModal(false);
            setFileToUpload(null);

        } catch (error) {
            console.error("Error subiendo:", error);
            alert("Error al subir el archivo.");
        }
        setUploading(false);
    };

    const handleDelete = async (docData) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${docData.nombreArchivo}"?`)) return;

        try {
            if (docData.rutaStorage) {
                const fileRef = ref(storage, docData.rutaStorage);
                await deleteObject(fileRef).catch(err => console.warn("Archivo storage no encontrado", err));
            }
            await deleteDoc(firestoreDoc(db, 'repositorio_documentos', docData.id));
        } catch (error) {
            console.error("Error eliminando:", error);
            alert("Error al eliminar el documento.");
        }
    };

    // Filtrado
    const filteredDocs = docs.filter(doc =>
        doc.nombreArchivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tipoDocumento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (doc) => {
        const type = doc.tipoArchivo || '';
        if (type.includes('image')) return <ImageIcon size={20} className="text-info" />;
        if (type.includes('excel') || type.includes('spreadsheet') || doc.nombreArchivo?.endsWith('.xlsx')) return <FileSpreadsheet size={20} className="text-success" />;
        if (type.includes('word') || doc.nombreArchivo?.endsWith('.docx')) return <FileText size={20} className="text-primary" />;
        if (type.includes('presentation') || doc.nombreArchivo?.endsWith('.pptx')) return <FileBarChart size={20} className="text-warning" />;
        return <FileText size={20} className="text-secondary" />;
    };

    const getBadge = (status) => {
        switch (status) {
            case 'firmado': return <Badge bg="success">Firmado</Badge>;
            case 'cargado': return <Badge bg="primary">Disponible</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-3">
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <h5 className="mb-0">📁 Bóveda Digital</h5>
                    <small className="text-muted">Gestión Documental Centralizada (ISO 9001 Compliant)</small>
                </Col>
                <Col md={6} className="text-end">
                    <input
                        type="file"
                        id="evidence-upload"
                        style={{ display: 'none' }}
                        // Aceptar Word, Excel, PPT, PDF, Imagenes
                        accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    <label htmlFor="evidence-upload">
                        <Button variant="outline-primary" as="span" disabled={uploading}>
                            {uploading ? <Spinner size="sm" animation="border" /> : <Upload size={18} className="me-2" />}
                            Subir Documento (Word/Excel/PDF/Etc)
                        </Button>
                    </label>
                </Col>
            </Row>

            <InputGroup className="mb-3">
                <InputGroup.Text><Search size={18} /></InputGroup.Text>
                <Form.Control
                    placeholder="Buscar por nombre, proceso o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>Tipo</th>
                                <th>Documento / Código</th>
                                <th>Proceso</th>
                                <th>Fecha Documento</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map(doc => (
                                <tr key={doc.id}>
                                    <td>{getIcon(doc)}</td>
                                    <td>
                                        <div className="fw-bold text-truncate" style={{ maxWidth: '250px' }} title={doc.nombreArchivo}>
                                            {doc.nombreArchivo}
                                        </div>
                                        <small className="text-muted d-block">{doc.codigo || 'S/C'}</small>
                                    </td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border">
                                            {doc.procesoAsociado || doc.tipoDocumento}
                                        </Badge>
                                    </td>
                                    <td>{doc.fechaCreacion ? new Date(doc.fechaCreacion).toLocaleDateString() : '-'}</td>
                                    <td>{getBadge(doc.estado)}</td>
                                    <td className="text-end">
                                        <Button variant="light" size="sm" className="me-1" href={doc.urlPdf} target="_blank" title="Ver">
                                            <Eye size={16} className="text-primary" />
                                        </Button>
                                        <Button variant="light" size="sm" className="me-1" href={doc.urlPdf} download target="_blank" title="Descargar">
                                            <Download size={16} className="text-success" />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(doc)} title="Eliminar">
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDocs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-muted">
                                        No se encontraron documentos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            )}

            {/* MODAL DE CLASIFICACIÓN DE DOCUMENTOS */}
            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Clasificar Documento 🗂️</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Documento <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={metadata.nombre}
                                onChange={(e) => setMetadata({ ...metadata, nombre: e.target.value })}
                                autoFocus
                            />
                            <Form.Text className="text-muted">
                                Si ya existe, se agregará un número automáticamente.
                            </Form.Text>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Proceso / Categoría <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        value={metadata.proceso}
                                        onChange={(e) => setMetadata({ ...metadata, proceso: e.target.value })}
                                    >
                                        {procesos.map(p => <option key={p} value={p}>{p}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Código (Opcional)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ej: SST-FOR-01"
                                        value={metadata.codigo}
                                        onChange={(e) => setMetadata({ ...metadata, codigo: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Fecha de Creación del Documento <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="date"
                                value={metadata.fecha}
                                onChange={(e) => setMetadata({ ...metadata, fecha: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleUploadConfirm} disabled={uploading}>
                        {uploading ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                {' '}Subiendo...
                            </>
                        ) : (
                            'Confirmar y Subir'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RepositorioDocumental;
