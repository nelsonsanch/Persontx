import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const RecargosList = () => {
    const [recargos, setRecargos] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        trabajadorId: '',
        numeroDocumento: '',
        nombreEmpleado: '',
        fecha: '',
        tipoRecargo: 'H.E. Diurna',
        cantidadHoras: '',
        observaciones: ''
    });

    const tiposRecargo = [
        { label: 'Hora Extra Diurna (25%)', valor: 1.25 },
        { label: 'Hora Extra Nocturna (75%)', valor: 1.75 },
        { label: 'Recargo Nocturno (35%)', valor: 0.35 },
        { label: 'Hora Extra Diurna Dominical/Festiva (100%)', valor: 2.00 },
        { label: 'Hora Extra Nocturna Dominical/Festiva (150%)', valor: 2.50 },
        { label: 'Recargo Dominical/Festivo (75%)', valor: 1.75 }
    ];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            // 1. Cargar Trabajadores para el select
            const trabQuery = query(collection(db, 'trabajadores'), where('clienteId', '==', user.uid));
            const trabSnap = await getDocs(trabQuery);
            const trabList = trabSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrabajadores(trabList);

            // 2. Cargar Recargos
            const recQuery = query(collection(db, 'recargos_laborales'), where('clienteId', '==', user.uid));
            const recSnap = await getDocs(recQuery);
            const recList = recSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecargos(recList);

        } catch (error) {
            console.error("Error cargando recargos:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const handleTrabajadorChange = (e) => {
        const trabId = e.target.value;
        const trabajador = trabajadores.find(t => t.id === trabId);
        if (trabajador) {
            setFormData({
                ...formData,
                trabajadorId: trabId,
                numeroDocumento: trabajador.numeroDocumento,
                nombreEmpleado: `${trabajador.nombres} ${trabajador.apellidos}`
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Usuario no autenticado");
                return;
            }

            await addDoc(collection(db, 'recargos_laborales'), {
                ...formData,
                clienteId: user.uid,
                fechaCreacion: new Date().toISOString()
            });

            toast.success("Recargo registrado correctamente");
            setShowForm(false);
            setFormData({
                trabajadorId: '',
                numeroDocumento: '',
                nombreEmpleado: '',
                fecha: '',
                tipoRecargo: 'H.E. Diurna',
                cantidadHoras: '',
                observaciones: ''
            });
            cargarDatos();
        } catch (error) {
            console.error("Error guardando:", error);
            toast.error("Error al guardar el recargo");
        }
    };

    const eliminarRecargo = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este registro?")) {
            try {
                await deleteDoc(doc(db, 'recargos_laborales', id));
                toast.success("Eliminado correctamente");
                cargarDatos();
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar");
            }
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>⏱️ Gestión de Recargos y Horas Extras</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Recargo'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-4 p-4 shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Trabajador</label>
                                <select
                                    className="form-select"
                                    required
                                    onChange={handleTrabajadorChange}
                                    value={formData.trabajadorId}
                                >
                                    <option value="">Seleccione un trabajador...</option>
                                    {trabajadores.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.numeroDocumento} - {t.nombres} {t.apellidos}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Fecha</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    required
                                    value={formData.fecha}
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Horas</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    required
                                    min="0.5"
                                    step="0.5"
                                    value={formData.cantidadHoras}
                                    onChange={e => setFormData({ ...formData, cantidadHoras: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Tipo de Recargo</label>
                                <select
                                    className="form-select"
                                    value={formData.tipoRecargo}
                                    onChange={e => setFormData({ ...formData, tipoRecargo: e.target.value })}
                                >
                                    {tiposRecargo.map((t, idx) => (
                                        <option key={idx} value={t.label}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Observaciones</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.observaciones}
                                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">Guardar Registro</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped border">
                        <thead className="table-dark">
                            <tr>
                                <th>Fecha</th>
                                <th>Trabajador</th>
                                <th>Tipo</th>
                                <th>Horas</th>
                                <th>Observaciones</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recargos.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No hay registros de recargos.</td></tr>
                            ) : (
                                recargos.map(r => (
                                    <tr key={r.id}>
                                        <td>{r.fecha}</td>
                                        <td>
                                            <strong>{r.nombreEmpleado}</strong><br />
                                            <small className="text-muted">{r.numeroDocumento}</small>
                                        </td>
                                        <td>{r.tipoRecargo}</td>
                                        <td>{r.cantidadHoras}</td>
                                        <td>{r.observaciones}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => eliminarRecargo(r.id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecargosList;
