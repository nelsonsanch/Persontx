import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const HistoriaNovedades = ({ trabajador }) => {
    const [novedades, setNovedades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNovedades = async () => {
            if (!trabajador?.numeroDocumento) return;

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Consultar novedades por número de documento y clienteId
                const q = query(
                    collection(db, 'novedades'),
                    where('numeroDocumento', '==', trabajador.numeroDocumento),
                    where('clienteId', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Ordenar por fechaInicio en cliente (para evitar crear índice compuesto ahora mismo si no existe)
                data.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));

                setNovedades(data);
            } catch (error) {
                console.error("Error cargando novedades:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNovedades();
    }, [trabajador]);

    const descargarExcel = () => {
        if (novedades.length === 0) return;

        const excelData = novedades.map(n => ({
            'Tipo Novedad': n.tipoNovedad,
            'Fecha Inicio': n.fechaInicio,
            'Fecha Fin': n.fechaFin,
            'Días': n.dias,
            'Valor Pagado': n.valorPagado,
            'Estado': n.estado,
            'Diagnóstico': n.diagnosticoEnfermedad || '-',
            'Observaciones': n.descripcion || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Novedades");
        XLSX.writeFile(wb, `Historia_Novedades_${trabajador.numeroDocumento}.xlsx`);
    };

    if (loading) return <div className="spinner-border text-primary"></div>;

    if (novedades.length === 0) return (
        <div className="alert alert-info">
            <i className="fas fa-calendar-check me-2"></i> No se han registrado novedades (incapacidades, permisos, etc.) para este trabajador.
        </div>
    );

    return (
        <div className="card border-0">
            <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                    <h5 className="card-title text-primary"><i className="fas fa-calendar-alt me-2"></i>Historial de Novedades y Ausentismos</h5>
                    <button className="btn btn-success btn-sm" onClick={descargarExcel}>
                        📥 Descargar Histórico
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Fecha Inicio</th>
                                <th>Tipo</th>
                                <th>Duración</th>
                                <th>Diagnóstico / Detalle</th>
                                <th>Estado</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {novedades.map(nov => (
                                <tr key={nov.id}>
                                    <td>
                                        {nov.fechaInicio}
                                        {nov.fechaFin && <div className="text-muted small">hasta {nov.fechaFin}</div>}
                                    </td>
                                    <td>
                                        <span className="fw-bold">{nov.tipoNovedad}</span>
                                    </td>
                                    <td>
                                        {nov.dias > 0 ? `${nov.dias} días` : '0 días'}
                                    </td>
                                    <td>
                                        {nov.diagnosticoEnfermedad ? (
                                            <div>
                                                <span className="badge bg-info text-dark">Dx: {nov.diagnosticoEnfermedad}</span>
                                            </div>
                                        ) : null}
                                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '250px' }}>
                                            {nov.descripcion}
                                        </small>
                                    </td>
                                    <td>
                                        <span className={`badge ${nov.estado === 'cerrado' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                            {nov.estado}
                                        </span>
                                    </td>
                                    <td>
                                        {nov.valorPagado ? `$${parseInt(nov.valorPagado).toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoriaNovedades;
