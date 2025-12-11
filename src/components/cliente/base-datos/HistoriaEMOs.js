import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const HistoriaEMOs = ({ trabajador }) => {
    const [emos, setEmos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVerEmo, setShowVerEmo] = useState(false);
    const [emoSeleccionado, setEmoSeleccionado] = useState(null);

    useEffect(() => {
        const fetchEMOs = async () => {
            if (!trabajador?.numeroDocumento) return;

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Consultar EMOs por número de documento y clienteId
                const q = query(
                    collection(db, 'emos'),
                    where('numeroDocumento', '==', trabajador.numeroDocumento),
                    where('clienteId', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Ordenar por fechaExamen descendente (cliente)
                data.sort((a, b) => new Date(b.fechaExamen) - new Date(a.fechaExamen));

                setEmos(data);
            } catch (error) {
                console.error("Error cargando EMOs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEMOs();
    }, [trabajador]);

    const descargarExcel = () => {
        if (emos.length === 0) return;

        const excelData = emos.map(emo => ({
            'Fecha Examen': emo.fechaExamen,
            'Tipo Examen': emo.tipoExamen,
            'Concepto': emo.conceptoAptitud,
            'Fecha Vencimiento': emo.fechaVencimiento,
            'Centro Médico': emo.centroMedico,
            'Restricciones': emo.restricciones || 'Ninguna',
            'Recomendaciones': emo.recomendaciones || 'Ninguna'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "EMOs");
        XLSX.writeFile(wb, `Historia_EMOs_${trabajador.numeroDocumento}.xlsx`);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'No registrada';
        return new Date(fecha).toLocaleDateString();
    };

    const formatearMoneda = (valor, moneda = 'COP') => {
        if (!valor) return '$ 0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 0
        }).format(valor);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Vigente': return 'success';
            case 'Por Vencer': return 'warning';
            case 'Vencido': return 'danger';
            default: return 'secondary';
        }
    };

    const getEstadoLabel = (estado) => estado || 'Desconocido';

    const verEmo = (emo) => {
        setEmoSeleccionado(emo);
        // Aseguramos que tenga campos nombre para la vista si faltan
        if (!emo.trabajadorNombre) {
            emo.trabajadorNombre = `${trabajador.nombres} ${trabajador.apellidos}`;
        }
        setShowVerEmo(true);
    };

    const contarObservaciones = (emo) => {
        // Simple contador si existe el campo observaciones
        return emo.observaciones ? 1 : 0;
    };


    if (loading) return <div className="spinner-border text-primary"></div>;

    if (emos.length === 0) return (
        <div className="alert alert-info">
            <i className="fas fa-stethoscope me-2"></i> No se han registrado Exámenes Médicos Ocupacionales (EMO) para este trabajador.
        </div>
    );

    return (
        <div className="card border-0">
            <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                    <h5 className="card-title text-primary"><i className="fas fa-user-md me-2"></i>Historial de Exámenes Médicos</h5>
                    <button className="btn btn-success btn-sm" onClick={descargarExcel}>
                        📥 Descargar Histórico
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo de Examen</th>
                                <th>Concepto Aptitud</th>
                                <th>Vencimiento</th>
                                <th>Centro Médico</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emos.map(emo => (
                                <tr key={emo.id}>
                                    <td className="fw-bold">{formatearFecha(emo.fechaExamen)}</td>
                                    <td>{emo.tipoExamen}</td>
                                    <td>
                                        <span className={`badge ${emo.conceptoAptitud?.includes('Apto sin restricciones') ? 'bg-success' :
                                            emo.conceptoAptitud?.includes('No apto') ? 'bg-danger' : 'bg-warning text-dark'
                                            }`}>
                                            {emo.conceptoAptitud}
                                        </span>
                                    </td>
                                    <td>
                                        {formatearFecha(emo.fechaVencimiento)}
                                        {new Date(emo.fechaVencimiento) < new Date() && <span className="ms-2 badge bg-danger">Vencido</span>}
                                    </td>
                                    <td>{emo.centroMedico}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => verEmo(emo)}
                                        >
                                            👁️ Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Ver EMO Completo (Replicado de EMOSList para consistencia visual) */}
            {showVerEmo && emoSeleccionado && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">👁️ Ver Examen Médico Ocupacional Completo</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowVerEmo(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    {/* Información del Trabajador */}
                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header bg-primary text-white">
                                                <h6 className="mb-0">👤 Información del Trabajador</h6>
                                            </div>
                                            <div className="card-body">
                                                <p><strong>Número de Documento:</strong> {emoSeleccionado.numeroDocumento}</p>
                                                <p><strong>Nombre:</strong> {emoSeleccionado.trabajadorNombre}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información del Examen */}
                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header bg-info text-white">
                                                <h6 className="mb-0">🏥 Información del Examen</h6>
                                            </div>
                                            <div className="card-body">
                                                <p><strong>Tipo de Examen:</strong> <span className="badge bg-info">{emoSeleccionado.tipoExamen}</span></p>
                                                <p><strong>Fecha del Examen:</strong> {formatearFecha(emoSeleccionado.fechaExamen)}</p>
                                                <p><strong>Fecha de Vencimiento:</strong> {formatearFecha(emoSeleccionado.fechaVencimiento)}</p>
                                                <p><strong>Estado:</strong>
                                                    <span className={`badge bg-${getEstadoColor(emoSeleccionado.estado)} ms-2`}>
                                                        {getEstadoLabel(emoSeleccionado.estado)}
                                                    </span>
                                                </p>
                                                <p><strong>Valor del Examen:</strong>
                                                    <span className="text-success fw-bold ms-2">
                                                        {formatearMoneda(emoSeleccionado.valorExamen, emoSeleccionado.monedaExamen)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información del Centro Médico */}
                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header bg-success text-white">
                                                <h6 className="mb-0">🏢 Centro Médico</h6>
                                            </div>
                                            <div className="card-body">
                                                <p><strong>Centro Médico:</strong> {emoSeleccionado.centroMedico || 'No especificado'}</p>
                                                <p><strong>Médico Examinador:</strong> {emoSeleccionado.medicoExaminador || 'No especificado'}</p>
                                                <p><strong>Licencia Médica:</strong> {emoSeleccionado.numeroLicenciaMedica || 'No especificado'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resultado del Examen */}
                                    <div className="col-md-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header bg-warning text-dark">
                                                <h6 className="mb-0">📋 Resultado del Examen</h6>
                                            </div>
                                            <div className="card-body">
                                                <p><strong>Concepto de Aptitud:</strong>
                                                    <span className={`badge ms-2 ${emoSeleccionado.conceptoAptitud?.includes('Apto') ? 'bg-success' : 'bg-warning'}`}>
                                                        {emoSeleccionado.conceptoAptitud}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pruebas Complementarias */}
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header bg-secondary text-white">
                                                <h6 className="mb-0">🔬 Pruebas Complementarias</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <p><strong>Pruebas realizadas:</strong></p>
                                                        {emoSeleccionado.pruebasComplementarias && emoSeleccionado.pruebasComplementarias.length > 0 ? (
                                                            <ul className="list-unstyled">
                                                                {emoSeleccionado.pruebasComplementarias.map((prueba, index) => (
                                                                    <li key={index}>
                                                                        <span className="badge bg-light text-dark me-2">✓</span>
                                                                        {prueba}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-muted">No se especificaron pruebas complementarias</p>
                                                        )}
                                                    </div>
                                                    <div className="col-md-4">
                                                        <p><strong>Otras pruebas:</strong></p>
                                                        <p className="text-muted">{emoSeleccionado.otrasPruebas || 'No especificado'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Restricciones, Recomendaciones y Observaciones */}
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header bg-dark text-white">
                                                <h6 className="mb-0">📝 Restricciones, Recomendaciones y Observaciones</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-4">
                                                        <h6 className="text-danger">⚠️ Restricciones:</h6>
                                                        <p className="text-muted">{emoSeleccionado.restricciones || 'No hay restricciones especificadas'}</p>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <h6 className="text-info">💡 Recomendaciones:</h6>
                                                        <p className="text-muted">{emoSeleccionado.recomendaciones || 'No hay recomendaciones especificadas'}</p>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <h6 className="text-secondary">📄 Observaciones:</h6>
                                                        <p className="text-muted">{emoSeleccionado.observaciones || 'No hay observaciones especificadas'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowVerEmo(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoriaEMOs;
