import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import RecargosIndicators from './RecargosIndicators';

const RecargosList = () => {
    const [activeTab, setActiveTab] = useState('listado'); // listado, dashboard, config
    const [recargos, setRecargos] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Configuración de Parámetros
    const [parametros, setParametros] = useState([
        { id: 'he_diurna', label: 'Hora Extra Diurna', factor: 1.25 },
        { id: 'he_nocturna', label: 'Hora Extra Nocturna', factor: 1.75 },
        { id: 'rec_nocturno', label: 'Recargo Nocturno', factor: 1.35 },
        { id: 'he_diurna_fest', label: 'H.E. Diurna Dominical/Festiva (25% + 80%)', factor: 2.05 },
        { id: 'he_nocturna_fest', label: 'H.E. Nocturna Dominical/Festiva (75% + 80%)', factor: 2.55 },
        { id: 'rec_festivo', label: 'Recargo Dominical/Festivo (80%)', factor: 1.80 },
        { id: 'rec_nocturno_fest', label: 'Recargo Nocturno Dom/Fest (35% + 80%)', factor: 2.15 },
    ]);

    // Estado para filtros de fecha
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Estado para horas laborales mensuales (Configurable)
    const [horasMensuales, setHorasMensuales] = useState(240);
    const [anioConfig, setAnioConfig] = useState(2025); // Año de vigencia

    // Estado del formulario
    const [formData, setFormData] = useState({
        trabajadorId: '',
        numeroDocumento: '',
        nombreEmpleado: '',
        salarioBase: 0,
        fecha: '',
        tipoRecargo: 'Hora Extra Diurna',
        factor: 1.25,
        cantidadHoras: '',
        valorTotal: 0,
        observaciones: ''
    });

    // Actualizar factores automáticamente según el año
    useEffect(() => {
        let recargoDominicalPct = 0.80; // 2025
        if (anioConfig === 2026) recargoDominicalPct = 0.90;
        if (anioConfig >= 2027) recargoDominicalPct = 1.00;

        const pctLabel = Math.round(recargoDominicalPct * 100) + '%';

        setParametros(prev => prev.map(p => {
            // No tocar los ordinarios
            if (['he_diurna', 'he_nocturna', 'rec_nocturno'].includes(p.id)) return p;

            // Actualizar dominicales/festivos
            let nuevoFactor = p.factor;
            let nuevaLabel = p.label;

            switch (p.id) {
                case 'he_diurna_fest': // 25% + Dom
                    nuevoFactor = 1.0 + 0.25 + recargoDominicalPct;
                    nuevaLabel = `H.E. Diurna Dominical/Festiva (25% + ${pctLabel})`;
                    break;
                case 'he_nocturna_fest': // 75% + Dom
                    nuevoFactor = 1.0 + 0.75 + recargoDominicalPct;
                    nuevaLabel = `H.E. Nocturna Dominical/Festiva (75% + ${pctLabel})`;
                    break;
                case 'rec_festivo': // 80/90/100%
                    nuevoFactor = 1.0 + recargoDominicalPct;
                    nuevaLabel = `Recargo Dominical/Festivo (${pctLabel})`;
                    break;
                case 'rec_nocturno_fest': // 35% + Dom
                    nuevoFactor = 1.0 + 0.35 + recargoDominicalPct;
                    nuevaLabel = `Recargo Nocturno Dom/Fest (35% + ${pctLabel})`;
                    break;
                default:
                    break;
            }
            // Redondear a 2 decimales para evitar problemas de punto flotante
            return { ...p, factor: parseFloat(nuevoFactor.toFixed(2)), label: nuevaLabel };
        }));

    }, [anioConfig]);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            // 1. Cargar Parametros
            // Intentar cargar configuración guardada si existiera (aquí solo simulamos por ahora)
            // Si hubiera lógica de persistencia, aquí recuperaríamos 'anioConfig' y 'horasMensuales'
            // ... logica de carga de parametros opcional, por ahora usamos defaults o podriamos guardar/leer

            // 2. Cargar Trabajadores
            const trabQuery = query(collection(db, 'trabajadores'), where('clienteId', '==', user.uid));
            const trabSnap = await getDocs(trabQuery);
            const trabList = trabSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrabajadores(trabList);

            // 3. Cargar Recargos
            await cargarRecargos(user.uid);

        } catch (error) {
            console.error("Error inicial:", error);
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    const cargarRecargos = async (uid) => {
        const recQuery = query(collection(db, 'recargos_laborales'), where('clienteId', '==', uid), orderBy('fecha', 'desc'));
        const recSnap = await getDocs(recQuery);
        const recList = recSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecargos(recList);
    };

    // Filtros y Recarga
    const filtrarPorFechas = () => {
        if (!fechaInicio || !fechaFin) {
            toast.warn("Selecciona ambas fechas");
            return;
        }
        const filtered = recargos.filter(r => r.fecha >= fechaInicio && r.fecha <= fechaFin);
        // Podriamos actualizar el estado 'recargos' o usar un estado derivado 'recargosFiltrados'.
        // Para simplificar, usaremos un estado derivado en el render o filtrado en memoria si son pocos.
        // Pero para "descargar" necesitamos el set filtrado.
        return filtered;
    };

    // Selección de Trabajador
    const handleTrabajadorChange = (e) => {
        const trabId = e.target.value;
        const trabajador = trabajadores.find(t => t.id === trabId);
        if (trabajador) {
            setFormData({
                ...formData,
                trabajadorId: trabId,
                numeroDocumento: trabajador.numeroDocumento,
                nombreEmpleado: `${trabajador.nombres} ${trabajador.apellidos}`,
                salarioBase: trabajador.salario || 0 // Cargar salario
            });
        }
    };

    // Calculo automático del valor
    useEffect(() => {
        if (formData.salarioBase && formData.cantidadHoras && formData.factor) {
            // Formula estandar Colombia: (Salario / HorasMensuales) * Factor * Horas
            // El divisor depende de la configuración (240, 230, etc.)
            const valorHoraOrdinaria = parseFloat(formData.salarioBase) / horasMensuales;
            const total = valorHoraOrdinaria * parseFloat(formData.factor) * parseFloat(formData.cantidadHoras);
            setFormData(prev => ({ ...prev, valorTotal: Math.round(total) }));
        }
    }, [formData.salarioBase, formData.cantidadHoras, formData.factor, horasMensuales]);

    const handleTipoRecargoChange = (e) => {
        const tipoLabel = e.target.value;
        const param = parametros.find(p => p.label === tipoLabel);
        setFormData({
            ...formData,
            tipoRecargo: tipoLabel,
            factor: param ? param.factor : 1.0
        });
    };

    const handleSalarioChange = async (nuevoSalario) => {
        // Actualizar en el form
        setFormData(prev => ({ ...prev, salarioBase: nuevoSalario }));

        // Opcional: Actualizar en la BD de trabajadores si el usuario quiere
        if (formData.trabajadorId && window.confirm("¿Deseas actualizar este salario en la ficha del trabajador permanentemente?")) {
            try {
                await updateDoc(doc(db, 'trabajadores', formData.trabajadorId), {
                    salario: nuevoSalario
                });
                toast.success("Salario del trabajador actualizado");
                // Actualizar lista local
                setTrabajadores(prev => prev.map(t => t.id === formData.trabajadorId ? { ...t, salario: nuevoSalario } : t));
            } catch (err) {
                toast.error("Error al actualizar salario en BD");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (!user) return;

            await addDoc(collection(db, 'recargos_laborales'), {
                ...formData,
                clienteId: user.uid,
                fechaCreacion: new Date().toISOString()
            });

            toast.success("Recargo guardado");
            setShowForm(false);
            cargarRecargos(user.uid);
            // Reset parcial
            setFormData(prev => ({ ...prev, cantidadHoras: '', valorTotal: 0, observaciones: '' }));
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        }
    };

    const handleExportExcel = () => {
        const dataToExport = (fechaInicio && fechaFin) ? filtrarPorFechas() : recargos;

        if (!dataToExport || dataToExport.length === 0) {
            toast.info("No hay datos para exportar en este rango");
            return;
        }

        const excelData = dataToExport.map(r => ({
            Fecha: r.fecha,
            Trabajador: r.nombreEmpleado,
            Documento: r.numeroDocumento,
            'Salario Base': r.salarioBase,
            'Tipo Recargo': r.tipoRecargo,
            'Factor': r.factor,
            Horas: r.cantidadHoras,
            'Valor Pagado': r.valorTotal,
            Observaciones: r.observaciones
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Recargos");
        XLSX.writeFile(wb, `Recargos_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Actualizar configuración
    const handleUpdateParam = (id, field, value) => {
        setParametros(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const eliminarRecargo = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este registro?')) {
            try {
                const user = auth.currentUser;
                await deleteDoc(doc(db, 'recargos_laborales', id));
                toast.success('Registro eliminado correctamente');
                cargarRecargos(user.uid);
            } catch (error) {
                console.error('Error eliminando recargo:', error);
                toast.error('Error al eliminar el registro');
            }
        }
    };

    return (
        <div className="container-fluid p-4">

            {/* Header de Navegación */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h2 className="text-primary m-0">⏱️ Gestión de Recargos</h2>
                <div className="btn-group">
                    <button className={`btn ${activeTab === 'listado' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('listado')}>📋 Listado</button>
                    <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('dashboard')}>📊 Indicadores</button>
                    <button className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('config')}>⚙️ Configuración</button>
                </div>
            </div>

            {/* VISTA: CONFIGURACIÓN */}
            {activeTab === 'config' && (
                <div className="card shadow-sm p-4">
                    <h4 className="mb-4">⚙️ Configuración General</h4>

                    <div className="row mb-5">
                        <div className="col-md-6">
                            <div className="card bg-light border-0 p-3">
                                <label className="form-label fw-bold">Horas Laborales Mensuales (Divisor)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={horasMensuales}
                                        onChange={(e) => setHorasMensuales(parseFloat(e.target.value))}
                                    />
                                    <span className="input-group-text">Horas</span>
                                </div>
                                <small className="text-muted mt-2 d-block">
                                    Valor para el cálculo de hora ordinaria (Ej: 240, 230, 220).
                                </small>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card bg-light border-0 p-3">
                                <label className="form-label fw-bold">Año de Vigencia (Normativa)</label>
                                <select
                                    className="form-select"
                                    value={anioConfig}
                                    onChange={(e) => setAnioConfig(parseInt(e.target.value))}
                                >
                                    <option value={2025}>2025 (Recargo Dom. 80%)</option>
                                    <option value={2026}>2026 (Recargo Dom. 90%)</option>
                                    <option value={2027}>2027+ (Recargo Dom. 100%)</option>
                                </select>
                                <small className="text-muted mt-2 d-block">
                                    Actualiza automáticamente los factores de recargo dominical y festivo.
                                </small>
                            </div>
                        </div>
                    </div>

                    <h4 className="mb-3">📊 Factores de Recargo</h4>
                    <p className="text-muted">Define los factores multiplicadores para cada tipo de recargo.</p>
                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Concepto</th>
                                    <th>Factor (Multiplicador)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parametros.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.label}</td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={p.factor}
                                                onChange={(e) => handleUpdateParam(p.id, 'factor', parseFloat(e.target.value))}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="alert alert-info">
                        <strong>Nota:</strong> Estos cambios aplicarán a los nuevos registros. Los registros históricos conservan el valor con el que fueron creados.
                    </div>
                </div>
            )}

            {/* VISTA: DASHBOARD */}
            {activeTab === 'dashboard' && (
                <RecargosIndicators recargos={filtrosFecha(recargos, fechaInicio, fechaFin)} />
            )}

            {/* VISTA: LISTADO (Principal) */}
            {activeTab === 'listado' && (
                <>
                    {/* Barra de Herramientas */}
                    <div className="row mb-4 g-3 bg-light p-3 rounded">
                        <div className="col-md-3">
                            <label className="form-label">Desde</label>
                            <input type="date" className="form-control" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Hasta</label>
                            <input type="date" className="form-control" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                        </div>
                        <div className="col-md-6 d-flex align-items-end gap-2">
                            <button className="btn btn-success text-white" onClick={handleExportExcel}>
                                📥 Descargar Excel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                                {showForm ? 'Cancelar' : '+ Nuevo Registro'}
                            </button>
                        </div>
                    </div>

                    {showForm && (
                        <div className="card mb-4 border-primary shadow">
                            <div className="card-header bg-primary text-white">Nuevo Registro de Recargo</div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Trabajador</label>
                                            <select className="form-select" required onChange={handleTrabajadorChange} value={formData.trabajadorId}>
                                                <option value="">Seleccione...</option>
                                                {trabajadores.map(t => (
                                                    <option key={t.id} value={t.id}>{t.numeroDocumento} - {t.nombres} {t.apellidos}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Salario Base</label>
                                            <div className="input-group">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.salarioBase}
                                                    onChange={e => handleSalarioChange(e.target.value)}
                                                />
                                            </div>
                                            <small className="text-muted">Editable (Actualiza ficha)</small>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Fecha Novedad</label>
                                            <input type="date" className="form-control" required value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Concepto</label>
                                            <select className="form-select" value={formData.tipoRecargo} onChange={handleTipoRecargoChange}>
                                                {parametros.map(p => (
                                                    <option key={p.id} value={p.label}>{p.label} (x{p.factor})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Horas</label>
                                            <input type="number" step="0.5" className="form-control" required value={formData.cantidadHoras} onChange={e => setFormData({ ...formData, cantidadHoras: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Valor Total (Calculado)</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-success text-white">$</span>
                                                <input type="text" className="form-control fw-bold" readOnly value={formData.valorTotal.toLocaleString('es-CO')} />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Observaciones</label>
                                            <input type="text" className="form-control" value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} />
                                        </div>
                                        <div className="col-12 text-end">
                                            <button type="submit" className="btn btn-lg btn-success">💾 Guardar Recargo</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Tabla de Resultados */}
                    <div className="card shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Trabajador</th>
                                        <th>Concepto</th>
                                        <th>Salario Base</th>
                                        <th>Factor</th>
                                        <th>Horas</th>
                                        <th>Valor Total</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(fechaInicio && fechaFin ? filtrosFecha(recargos, fechaInicio, fechaFin) : recargos).map(r => (
                                        <tr key={r.id}>
                                            <td>{r.fecha}</td>
                                            <td>
                                                <div className="fw-bold">{r.nombreEmpleado}</div>
                                                <small className="text-muted">{r.numeroDocumento}</small>
                                            </td>
                                            <td><span className="badge bg-info text-dark">{r.tipoRecargo}</span></td>
                                            <td>${parseFloat(r.salarioBase).toLocaleString()}</td>
                                            <td>x{r.factor}</td>
                                            <td>{r.cantidadHoras}</td>
                                            <td className="fw-bold text-success">${parseFloat(r.valorTotal).toLocaleString()}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Eliminar"
                                                    onClick={() => eliminarRecargo(r.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {recargos.length === 0 && (
                                        <tr><td colSpan="8" className="text-center py-4">No hay registros aún.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Helper interno para filtrar fechas
const filtrosFecha = (data, inicio, fin) => {
    if (!inicio || !fin) return data;
    return data.filter(item => item.fecha >= inicio && item.fecha <= fin);
};

export default RecargosList;
