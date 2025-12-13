import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const DatosDemograficos = ({ trabajador }) => {
    const [datosEncuesta, setDatosEncuesta] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestSurveyData = async () => {
            if (!trabajador?.id) return;

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Consultar encuestas (sin orderBy para evitar error de índice, ordenamos en cliente)
                // Y agregamos filtro de clienteId para permisos
                const q = query(
                    collection(db, 'respuestas_encuestas'),
                    where('trabajadorId', '==', trabajador.id),
                    where('clienteId', '==', user.uid)
                );

                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const encuestas = snapshot.docs.map(doc => doc.data());

                    // Ordenar por fechaRespuesta descendente en cliente
                    encuestas.sort((a, b) => {
                        const fechaA = a.fechaRespuesta?.seconds || 0;
                        const fechaB = b.fechaRespuesta?.seconds || 0;
                        return fechaB - fechaA;
                    });

                    // Tomar la primera (la más reciente)
                    setDatosEncuesta(encuestas[0]);
                } else {
                    setDatosEncuesta(null);
                }
            } catch (error) {
                console.error("Error fetching demographics from survey:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestSurveyData();
    }, [trabajador]);

    // Función auxiliar para obtener valor de las respuestas (mapeo seguro)
    const getRespuesta = (key) => {
        // En FormularioEncuesta, los IDs son como 'genero', 'edad', 'estratoSocial'.
        // Las respuestas suelen guardarse en un objeto 'respuestas' o plano si así se configuró.
        // Asumiremos que se guardan en respuesta.respuestas con la clave del ID.
        if (!datosEncuesta?.respuestas) return 'No reportado';
        return datosEncuesta.respuestas[key] || 'No reportado';
    };

    return (
        <div className="card border-0">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title text-primary"><i className="fas fa-user-circle me-2"></i>Información Demográfica y Contractual</h5>
                    {datosEncuesta ?
                        <span className="badge bg-success">Actualizado: {new Date(datosEncuesta.fechaRespuesta.seconds * 1000).toLocaleDateString()}</span> :
                        <span className="badge bg-warning text-dark">Sin datos de encuesta</span>
                    }
                </div>

                {/* Sección 1: Datos Contractuales (desde TrabajadoresList - Objeto trabajador) */}
                <h6 className="text-secondary border-bottom pb-2 mb-3">Datos Contractuales</h6>
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <label className="fw-bold text-muted small d-block">Identificación</label>
                        <span>{trabajador.tipoCedula === 'cedula_ciudadania' ? 'CC' : trabajador.tipoCedula} {trabajador.numeroDocumento}</span>
                    </div>
                    <div className="col-md-4">
                        <label className="fw-bold text-muted small d-block">Cargo Actual</label>
                        <span>{trabajador.cargo || 'No definido'}</span>
                    </div>
                    <div className="col-md-4">
                        <label className="fw-bold text-muted small d-block">Área</label>
                        <span>{trabajador.area || 'No definida'}</span>
                    </div>
                    <div className="col-md-4">
                        <label className="fw-bold text-muted small d-block">Fecha Ingreso/Inicio</label>
                        <span>{trabajador.fechaCreacion ? new Date(trabajador.fechaCreacion).toLocaleDateString() : 'No registrada'}</span>
                    </div>
                    <div className="col-md-4">
                        <label className="fw-bold text-muted small d-block">Estado</label>
                        <span className={`badge ${trabajador.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>{trabajador.estado}</span>
                    </div>
                    <div className="col-md-4">
                        <label className="fw-bold text-muted small d-block">EPS / AFP</label>
                        <span>{trabajador.eps} / {trabajador.afp}</span>
                    </div>
                </div>

                {/* Sección 2: Datos Biométricos */}
                <h6 className="text-secondary border-bottom pb-2 mb-3">Datos Biométricos (Última Encuesta)</h6>
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <label className="fw-bold text-muted small d-block">Peso</label>
                        <span>{getRespuesta('peso') !== 'No reportado' ? `${getRespuesta('peso')} kg` : 'No reportado'}</span>
                    </div>
                    <div className="col-md-3">
                        <label className="fw-bold text-muted small d-block">Estatura</label>
                        <span>{getRespuesta('estatura') !== 'No reportado' ? `${getRespuesta('estatura')} cm` : 'No reportado'}</span>
                    </div>
                    <div className="col-md-3">
                        <label className="fw-bold text-muted small d-block">IMC</label>
                        <span className="fw-bold">{getRespuesta('imc')}</span>
                    </div>
                    <div className="col-md-3">
                        <label className="fw-bold text-muted small d-block">Interpretación</label>
                        <span className={`badge ${getRespuesta('imcInterpretacion') === 'Peso normal' ? 'bg-success' :
                                getRespuesta('imcInterpretacion') === 'Bajo peso' ? 'bg-info' :
                                    getRespuesta('imcInterpretacion') === 'Sobrepeso' ? 'bg-warning text-dark' :
                                        getRespuesta('imcInterpretacion') === 'Obesidad' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                            {getRespuesta('imcInterpretacion')}
                        </span>
                    </div>
                </div>

                {/* Sección 2: Datos Recientes de Encuesta (Demográficos) */}
                <h6 className="text-secondary border-bottom pb-2 mb-3">Datos Sociodemográficos (Última Encuesta)</h6>
                {loading ? (
                    <div className="spinner-border spinner-border-sm"></div>
                ) : datosEncuesta ? (
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Edad</label>
                            <span>{getRespuesta('edad')} años</span>
                        </div>
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Género</label>
                            <span>{getRespuesta('genero')}</span>
                        </div>
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Estado Civil</label>
                            <span>{getRespuesta('estadoCivil')}</span>
                        </div>
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Escolaridad</label>
                            <span>{getRespuesta('escolaridad')}</span>
                        </div>

                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Raza/Etnia</label>
                            <span>{getRespuesta('raza')}</span>
                        </div>
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Estrato Social</label>
                            <span>{getRespuesta('estratoSocial')}</span>
                        </div>
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Grupo Sanguíneo</label>
                            <span>{getRespuesta('grupoSanguineo')}</span>
                        </div>
                        <div className="col-md-3">
                            <label className="fw-bold text-muted small d-block">Peso / Talla</label>
                            <span>{getRespuesta('peso')} kg / {getRespuesta('estatura')} cm</span>
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-light text-center">
                        <small>El trabajador no ha diligenciado encuestas demográficas recientemente.</small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatosDemograficos;
