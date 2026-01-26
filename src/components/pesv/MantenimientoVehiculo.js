import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Badge, Tab, Tabs, Alert } from 'react-bootstrap';
import { db, storage } from '../../firebase';
import {
    collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../hooks/useAuth';
import { Wrench, Trash2, CheckCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

const MantenimientoVehiculo = ({ show, onHide, vehiculo }) => {
    const { user } = useAuth();
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('historial');
    const [uploading, setUploading] = useState(false);

    // Form State
    const initialForm = {
        tipo_evento: 'Mantenimiento Preventivo',
        fecha_evento: new Date().toISOString().split('T')[0],
        kilometraje_evento: '',
        proximo_cambio_kilometraje: '',
        proximo_vencimiento_fecha: '',
        descripcion: '',
        proveedor: '',
        costo_total: '',
        responsable: '',
        evidencias: []
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (!vehiculo || !show) return;

        // Cargar Historial
        const q = query(
            collection(db, 'mantenimientos_vehiculos'),
            where('vehiculo_id', '==', vehiculo.id),
            orderBy('fecha_evento', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRegistros(docs);
        });

        return () => unsubscribe();
    }, [vehiculo, show]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `mantenimientos/${vehiculo.id}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            setFormData(prev => ({
                ...prev,
                evidencias: [...prev.evidencias, url]
            }));
        } catch (error) {
            console.error("Error subiendo evidencia:", error);
            alert("Error al subir archivo");
        }
        setUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !vehiculo) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'mantenimientos_vehiculos'), {
                ...formData,
                vehiculo_id: vehiculo.id,
                clienteId: user.uid,
                fecha_registro: new Date().toISOString(),
                creado_por: user.email,
                costo_total: Number(formData.costo_total) || 0,
                kilometraje_evento: Number(formData.kilometraje_evento) || 0,
                proximo_cambio_kilometraje: formData.proximo_cambio_kilometraje ? Number(formData.proximo_cambio_kilometraje) : null,
                proximo_vencimiento_fecha: formData.proximo_vencimiento_fecha || null
            });

            setFormData(initialForm);
            setActiveTab('historial');
            alert("Registro guardado exitosamente");
        } catch (error) {
            console.error("Error guardando mantenimiento:", error);
            alert("Error guardando el registro");
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este registro?")) {
            await deleteDoc(doc(db, 'mantenimientos_vehiculos', id));
        }
    };

    // --- LÓGICA DE UI Y MÉTRICAS ---
    const kmInicial = Number(vehiculo?.kilometraje_inicial) || 0;
    const kmActual = Number(vehiculo?.kilometraje_actual) || 0;
    const kmRecorrido = kmActual - kmInicial;
    const totalGastado = registros.reduce((acc, curr) => acc + (curr.costo_total || 0), 0);

    // Helper para determinar estado (Semaforo) de cada fila
    const getRowStatus = (reg) => {
        if (reg.proximo_vencimiento_fecha) {
            const fechaVence = new Date(reg.proximo_vencimiento_fecha);
            const hoy = new Date();
            const diffTime = fechaVence - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return { bg: 'danger', icon: <AlertTriangle size={14} />, text: `Vencido hace ${Math.abs(diffDays)} días` };
            if (diffDays <= 30) return { bg: 'warning', icon: <AlertTriangle size={14} />, text: `Vence en ${diffDays} días` };
            return { bg: 'success', icon: <CheckCircle size={14} />, text: `Vigente (${diffDays} días)` };
        }

        if (reg.proximo_cambio_kilometraje > 0) {
            const restante = reg.proximo_cambio_kilometraje - kmActual;
            if (restante <= 0) return { bg: 'danger', icon: <AlertTriangle size={14} />, text: `Vencido por ${Math.abs(restante).toLocaleString()} km` };
            if (restante <= 500) return { bg: 'warning', icon: <AlertTriangle size={14} />, text: `Faltan ${restante.toLocaleString()} km` };
            return { bg: 'success', icon: <CheckCircle size={14} />, text: `Faltan ${restante.toLocaleString()} km` };
        }

        return null;
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Wrench size={24} />
                    Hoja de Vida: {vehiculo?.marca} {vehiculo?.linea} ({vehiculo?.placa})
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>

                {/* 1. Resumen de Kilometrajes e Inversión */}
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm p-3 text-center bg-light">
                            <h3 className="text-primary">${totalGastado.toLocaleString()}</h3>
                            <small className="text-muted fw-bold">Inversión Total</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm p-3 text-center bg-light">
                            <h3 className="text-dark">{kmActual.toLocaleString()} km</h3>
                            <small className="text-muted fw-bold">Kilometraje Actual</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm p-3 text-center bg-light">
                            <h3 className="text-info">{kmRecorrido.toLocaleString()} km</h3>
                            <small className="text-muted fw-bold">Recorrido Total (En Empresa)</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm p-3 text-center bg-light">
                            <h3 className="text-secondary">{registros.length}</h3>
                            <small className="text-muted fw-bold">Eventos Registrados</small>
                        </div>
                    </div>
                </div>

                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 nav-fill">
                    <Tab eventKey="historial" title="Historial Completo">
                        <div className="table-responsive">
                            <Table hover striped bordered className="align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Descripción</th>
                                        <th>Km Evento</th>
                                        <th>Costo</th>
                                        <th>Próx. Cambio</th>
                                        <th>Estado / Alerta</th>
                                        <th>Evidencias</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registros.map((reg) => {
                                        const status = getRowStatus(reg);
                                        return (
                                            <tr key={reg.id}>
                                                <td>{reg.fecha_evento}</td>
                                                <td>
                                                    <Badge bg={
                                                        reg.tipo_evento.includes('Preventivo') ? 'success' :
                                                            reg.tipo_evento.includes('Correctivo') ? 'warning' :
                                                                reg.tipo_evento.includes('Legal') ? 'info' : 'secondary'
                                                    }>
                                                        {reg.tipo_evento}
                                                    </Badge>
                                                </td>
                                                <td>{reg.descripcion}</td>
                                                <td>{reg.kilometraje_evento?.toLocaleString()} km</td>
                                                <td>${reg.costo_total?.toLocaleString()}</td>
                                                <td>
                                                    {reg.proximo_vencimiento_fecha ? (
                                                        <small className="text-muted">
                                                            Vence: {reg.proximo_vencimiento_fecha}
                                                        </small>
                                                    ) : reg.proximo_cambio_kilometraje ? (
                                                        <small className="text-muted">
                                                            Meta: {reg.proximo_cambio_kilometraje.toLocaleString()} km
                                                        </small>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    {status ? (
                                                        <Badge bg={status.bg} className="d-flex align-items-center gap-1 w-auto justify-content-center p-2">
                                                            {status.icon} {status.text}
                                                        </Badge>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    {reg.evidencias && reg.evidencias.length > 0 ? (
                                                        <div className="d-flex gap-1">
                                                            {reg.evidencias.map((url, i) => (
                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                                    <ReceiptIcon />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(reg.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {registros.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="text-center text-muted py-4">
                                                No hay registros en la hoja de vida de este vehículo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Tab>

                    <Tab eventKey="nuevo" title="Registrar Nuevo Evento">
                        <Form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow-sm">
                            <h5 className="mb-3 text-primary border-bottom pb-2">Nuevo Registro de Mantenimiento</h5>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <Form.Label>Tipo de Evento</Form.Label>
                                    <Form.Select name="tipo_evento" value={formData.tipo_evento} onChange={handleInputChange} required>
                                        <option>Mantenimiento Preventivo</option>
                                        <option>Cambio de Aceite</option>
                                        <option>Cambio de Llantas</option>
                                        <option>Renovación SOAT</option>
                                        <option>Renovación Tecnomecánica</option>
                                        <option>Mantenimiento Correctivo</option>
                                        <option>Documentación / Legal</option>
                                        <option>Mejora / Accesorio</option>
                                        <option>Siniestro / Accidente</option>
                                        <option>Otro</option>
                                    </Form.Select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <Form.Label>Fecha del Evento</Form.Label>
                                    <Form.Control type="date" name="fecha_evento" value={formData.fecha_evento} onChange={handleInputChange} required />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <Form.Label>Kilometraje al momento (Km)</Form.Label>
                                    <Form.Control type="number" name="kilometraje_evento" value={formData.kilometraje_evento} onChange={handleInputChange} placeholder="Ej: 50000" required />
                                </div>
                            </div>

                            {/* Alerta Proactiva (Kilometraje o Fecha) */}
                            <div className="alert alert-light border-primary border-start border-4 mb-3">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <TrendingUp size={20} className="text-primary" />
                                    <strong>Programación de Próximo Cambio</strong>
                                    {formData.tipo_evento === 'Cambio de Aceite' && <Badge bg="danger" className="ms-2">Obligatorio</Badge>}
                                </div>
                                <div className="row align-items-center">
                                    <div className="col-md-6">
                                        <small className="text-muted d-block mb-1">
                                            {formData.tipo_evento.includes('SOAT') || formData.tipo_evento.includes('Tecno') || formData.tipo_evento.includes('Legal')
                                                ? "Para documentos, define la fecha de vencimiento."
                                                : "Para mantenimientos mecánicos, define el kilometraje meta."}
                                        </small>
                                    </div>
                                    <div className="col-md-6">
                                        {formData.tipo_evento.includes('SOAT') || formData.tipo_evento.includes('Tecno') || formData.tipo_evento.includes('Legal') ? (
                                            <Form.Control
                                                type="date"
                                                name="proximo_vencimiento_fecha"
                                                value={formData.proximo_vencimiento_fecha || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        ) : (
                                            <Form.Control
                                                type="number"
                                                name="proximo_cambio_kilometraje"
                                                value={formData.proximo_cambio_kilometraje || ''}
                                                onChange={handleInputChange}
                                                placeholder="Ej: Si cambia a los 50.000, prox cambio 55.000"
                                                required={formData.tipo_evento === 'Cambio de Aceite'}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <Form.Label>Proveedor / Taller</Form.Label>
                                    <Form.Control type="text" name="proveedor" value={formData.proveedor} onChange={handleInputChange} placeholder="Ej: Serviteca Los Héroes" required />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <Form.Label>Costo Total ($)</Form.Label>
                                    <Form.Control type="number" name="costo_total" value={formData.costo_total} onChange={handleInputChange} placeholder="0" required />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <Form.Label>Responsable / Autoriza</Form.Label>
                                    <Form.Control type="text" name="responsable" value={formData.responsable} onChange={handleInputChange} placeholder="Nombre..." />
                                </div>
                            </div>

                            <div className="mb-3">
                                <Form.Label>Descripción del Trabajo</Form.Label>
                                <Form.Control as="textarea" rows={3} name="descripcion" value={formData.descripcion} onChange={handleInputChange} placeholder="Detalles de lo que se hizo (Cambio de aceite, filtros, frenos...)" required />
                            </div>

                            <div className="mb-4">
                                <Form.Label>Adjuntar Evidencias (Facturas, Fotos)</Form.Label>
                                <div className="d-flex gap-2 align-items-center">
                                    <Form.Control type="file" onChange={handleFileUpload} disabled={uploading} />
                                    {uploading && <small className="text-muted">Subiendo...</small>}
                                </div>
                                <div className="mt-2 d-flex gap-2">
                                    {formData.evidencias.map((url, i) => (
                                        <Badge key={i} bg="secondary" className="d-flex align-items-center gap-1">
                                            Adjunto {i + 1} <CheckCircle size={10} />
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="text-end">
                                <Button variant="secondary" onClick={() => setActiveTab('historial')} className="me-2">Cancelar</Button>
                                <Button variant="primary" type="submit" disabled={loading || uploading}>
                                    {loading ? 'Guardando...' : 'Guardar Registro'}
                                </Button>
                            </div>
                        </Form>
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
};

const ReceiptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary cursor-pointer"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17V7" /></svg>
);

export default MantenimientoVehiculo;
