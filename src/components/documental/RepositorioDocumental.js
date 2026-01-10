import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Form, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../hooks/useAuth';
import { Download, Eye, Search, Upload, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

const RepositorioDocumental = () => {
    const { user } = useAuth();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);

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

    // Subir Evidencia Externa
    const handleUploadEvidence = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("El archivo es demasiado grande (Máx 5MB).");
            return;
        }

        setUploading(true);
        try {
            const dateStr = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `evidencias/${user.uid}/${dateStr}_${sanitizedName}`;
            const storageRef = ref(storage, storagePath);

            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            // Guardar en Firestore
            await addDoc(collection(db, 'repositorio_documentos'), {
                empresaId: user.uid,
                tipoDocumento: 'Evidencia Externa',
                nombreArchivo: file.name,
                codigo: 'EXT-EVID',
                urlPdf: downloadUrl, // Usamos el mismo campo para URL
                tipoArchivo: file.type, // 'application/pdf' o 'image/jpeg'
                fechaCreacion: new Date(),
                estado: 'cargado',
                rutaStorage: storagePath
            });

            alert("Evidencia subida correctamente.");
        } catch (error) {
            console.error("Error subiendo evidencia:", error);
            alert("Error al subir el archivo.");
        }
        setUploading(false);
    };

    // Filtrado
    const filteredDocs = docs.filter(doc =>
        doc.nombreArchivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tipoDocumento?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (doc) => {
        if (doc.tipoArchivo?.startsWith('image/')) return <ImageIcon size={20} className="text-info" />;
        if (doc.tipoDocumento === 'Evidencia Externa') return <Upload size={20} className="text-warning" />;
        return <FileText size={20} className="text-primary" />;
    };

    return (
        <div className="p-3">
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <h5 className="mb-0">📁 Bóveda Digital</h5>
                    <small className="text-muted">Gestiona tus documentos generados y evidencias externas.</small>
                </Col>
                <Col md={6} className="text-end">
                    {/* Botón de Carga */}
                    <input
                        type="file"
                        id="evidence-upload"
                        style={{ display: 'none' }}
                        accept="application/pdf,image/*"
                        onChange={handleUploadEvidence}
                        disabled={uploading}
                    />
                    <label htmlFor="evidence-upload">
                        <Button variant="outline-primary" as="span" disabled={uploading}>
                            {uploading ? <Spinner size="sm" animation="border" /> : <Upload size={18} className="me-2" />}
                            Subir Evidencia (PDF/Foto)
                        </Button>
                    </label>
                </Col>
            </Row>

            <InputGroup className="mb-3">
                <InputGroup.Text><Search size={18} /></InputGroup.Text>
                <Form.Control
                    placeholder="Buscar por nombre o tipo..."
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
                                <th>Nombre del Archivo</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map(doc => (
                                <tr key={doc.id}>
                                    <td>{getIcon(doc)}</td>
                                    <td>
                                        <div className="fw-bold">{doc.nombreArchivo || doc.tipoDocumento}</div>
                                        <small className="text-muted">{doc.codigo}</small>
                                    </td>
                                    <td>{doc.fechaCreacion?.toLocaleDateString()}</td>
                                    <td>
                                        <Badge bg={doc.estado === 'firmado' ? 'success' : 'secondary'}>
                                            {doc.estado || 'Archivo'}
                                        </Badge>
                                    </td>
                                    <td className="text-end">
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="me-1"
                                            href={doc.urlPdf}
                                            target="_blank"
                                            title="Ver/Descargar"
                                        >
                                            <ExternalLink size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDocs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">
                                        No se encontraron documentos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

export default RepositorioDocumental;
