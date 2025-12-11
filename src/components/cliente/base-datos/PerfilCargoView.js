import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const PerfilCargoView = ({ trabajador }) => {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerfil = async () => {
            if (!trabajador?.cargo) {
                setLoading(false);
                return;
            }

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Consultar perfil por nombre del cargo y clienteId
                const q = query(
                    collection(db, 'perfiles_cargo'),
                    where('nombrePuesto', '==', trabajador.cargo),
                    where('clienteId', '==', user.uid),
                    limit(1)
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setPerfil({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
                } else {
                    setPerfil(null);
                }
            } catch (error) {
                console.error("Error cargando Perfil:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPerfil();
    }, [trabajador]);

    const descargarPDF = () => {
        alert("Funcionalidad de descarga de PDF disponible en el módulo de Perfiles de Cargo.");
    };

    if (loading) return <div className="spinner-border text-primary"></div>;

    if (!trabajador.cargo) return (
        <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i> El trabajador no tiene un cargo asignado en su ficha principal.
        </div>
    );

    if (!perfil) return (
        <div className="alert alert-info">
            <i className="fas fa-search me-2"></i> No se encontró un Perfil de Cargo definido para "<strong>{trabajador.cargo}</strong>".
            <br /><small>Asegúrate de que el nombre del cargo coincida exactamente con el creado en el módulo de Perfiles.</small>
        </div>
    );

    return (
        <div className="card border-0">
            <div className="card-body">
                <div className="d-flex justify-content-between mb-4 border-bottom pb-3">
                    <div>
                        <h5 className="card-title text-primary mb-1"><i className="fas fa-id-card-alt me-2"></i>{perfil.nombrePuesto}</h5>
                        <small className="text-muted">Área: {perfil.areaDepartamento} | Modalidad: {perfil.ubicacionModalidad}</small>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm" disabled title="Ver en módulo de gestión">
                        👁️ Ver Fuente
                    </button>
                </div>

                <div className="row g-4">
                    <div className="col-12">
                        <div className="p-3 bg-light rounded">
                            <h6 className="fw-bold text-dark">🎯 Misión / Objetivo</h6>
                            <p className="mb-0 text-secondary">{perfil.misionObjetivo}</p>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <h6 className="fw-bold text-primary">Funciones Principales</h6>
                        <p className="small" style={{ whiteSpace: 'pre-line' }}>{perfil.funcionesPrincipales}</p>
                    </div>

                    <div className="col-md-6">
                        <h6 className="fw-bold text-primary">Requisitos</h6>
                        <ul className="list-unstyled small">
                            <li className="mb-2"><strong>🎓 Formación:</strong> {perfil.formacionAcademica}</li>
                            <li className="mb-2"><strong>💼 Experiencia:</strong> {perfil.experienciaLaboral}</li>
                            <li className="mb-2"><strong>🛠️ Habilidades:</strong> {perfil.habilidadesTecnicas}</li>
                        </ul>
                    </div>

                    <div className="col-12">
                        <h6 className="fw-bold text-primary">Sistemas de Gestión (SST)</h6>
                        <div className="row small">
                            <div className="col-md-4">
                                <strong>⚠️ Riesgos:</strong>
                                <ul className="ps-3 mt-1">
                                    {(perfil.riesgosLaborales || []).map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                            <div className="col-md-4">
                                <strong>🛡️ EPPs:</strong>
                                <ul className="ps-3 mt-1">
                                    {(perfil.equiposEPP || []).map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                            <div className="col-md-4">
                                <strong>🩺 Exámenes Médicos:</strong>
                                <ul className="ps-3 mt-1">
                                    {(perfil.examenesMedicos || []).map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerfilCargoView;
