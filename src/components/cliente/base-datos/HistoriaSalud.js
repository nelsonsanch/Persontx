import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const HistoriaSalud = ({ trabajador }) => {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);

    const preguntasLabel = [
        '1. Enfermedades del corazón?',
        '2. Enfermedades de los pulmones como asma, enfisema, bronquitis?',
        '3. Diabetes (azúcar alta en la sangre)?',
        '4. Enfermedades cerebrales como derrames, trombosis, epilepsia?',
        '5. Enfermedades de los huesos o articulaciones como artritis, gota, lupus, reumatismo, osteoporosis?',
        '6. Enfermedades de la columna vertebral como hernia de disco, compresión de raíces nerviosas, ciática, escoliosis o fractura?',
        '7. Enfermedades digestivas (colon, gastritis, otros)?',
        '8. Enfermedades de la piel?',
        '9. Alergias en vías respiratorias?',
        '10. Alteraciones auditivas?',
        '11. Alteraciones visuales?',
        '12. Hipertensión arterial o tensión alta?',
        '13. Colesterol o Triglicéridos elevados?',
        '14. Dolor en el pecho o palpitaciones',
        '15. Ahogo o asfixia al caminar',
        '16. Tos persistente por más de 1 mes',
        '17. Pérdida de la conciencia, desmayos o alteración del equilibrio',
        '18. Fuma? (No importa la cantidad ni la frecuencia)',
        '19. Toma bebidas alcohólicas semanal o quincenalmente',
        '20. ¿Practica deportes de choque o de mano?',
        '21. Realiza actividad física o deporte al menos 3 veces por semana?',
        '22. Alteraciones de los músculos, tendones y ligamentos?',
        '23. Enfermedades de los nervios (periféricos)',
        '24. Fracturas',
        '25. ¿Hernias (inguinal, abdominal)?',
        '26. Várices en las piernas',
        '27. Adormecimiento u hormigueo?',
        '28. Disminución de la fuerza?',
        '29. Dolor o inflamación?',
        '30. Dolor o molestia en el cuello',
        '31. Dolor o molestia en los hombros',
        '32. Dolor o molestia en los codos, muñecas o manos',
        '33. Dolor o molestia en la espalda',
        '34. Dolor o molestia en la cintura',
        '35. Dolor o molestia en las rodillas, tobillos o pies',
        '36. El dolor aumenta con la actividad',
        '37. El dolor aumenta con el reposo',
        '38. El dolor es permanente'
    ];

    useEffect(() => {
        const fetchHistory = async () => {
            if (!trabajador?.id) return;

            try {
                const user = auth.currentUser;
                if (!user) return;

                // Remove orderBy to avoid index requirement AND add clienteId for permissions
                const q = query(
                    collection(db, 'respuestas_encuestas'),
                    where('trabajadorId', '==', trabajador.id),
                    where('clienteId', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    fechaFormateada: doc.data().fechaRespuesta ? new Date(doc.data().fechaRespuesta.seconds * 1000).toLocaleDateString() : 'Fecha desconocida'
                }));

                // Sort client-side
                data.sort((a, b) => {
                    const fechaA = a.fechaRespuesta?.seconds || 0;
                    const fechaB = b.fechaRespuesta?.seconds || 0;
                    return fechaB - fechaA;
                });

                setHistorial(data);
            } catch (error) {
                console.error("Error cargando historia salud:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [trabajador]);

    const getRespuesta = (survey, index) => {
        if (!survey || !survey.respuestas) return '-';
        return survey.respuestas[`salud_${index + 1}`] || '-';
    };

    const descargarExcel = () => {
        if (historial.length === 0) return;

        // Estructura: Pregunta en col A, Fechas en col B, C, D...
        const excelData = preguntasLabel.map((pregunta, index) => {
            const row = { Pregunta: pregunta };
            historial.forEach((survey, i) => {
                row[`Encuesta ${survey.fechaFormateada}`] = getRespuesta(survey, index);
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Historia Salud");
        XLSX.writeFile(wb, `Historia_Salud_${trabajador.numeroDocumento}.xlsx`);
    };

    if (loading) return <div className="spinner-border text-primary"></div>;

    if (historial.length === 0) return (
        <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i> No hay registros históricos de encuestas de salud para este trabajador.
        </div>
    );

    return (
        <div className="card border-0">
            <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                    <h5 className="card-title text-primary"><i className="fas fa-notes-medical me-2"></i>Historial de Respuestas de Salud</h5>
                    <button className="btn btn-success btn-sm" onClick={descargarExcel}>
                        📥 Descargar Histórico
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-bordered table-striped table-hover table-sm">
                        <thead className="table-light text-center">
                            <tr>
                                <th style={{ minWidth: '300px', textAlign: 'left' }}>Pregunta / Condición</th>
                                {historial.map((survey, i) => (
                                    <th key={survey.id} style={{ minWidth: '100px' }}>
                                        {survey.fechaFormateada}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {preguntasLabel.map((pregunta, index) => (
                                <tr key={index}>
                                    <td>{pregunta}</td>
                                    {historial.map((survey) => {
                                        const resp = getRespuesta(survey, index);
                                        return (
                                            <td key={survey.id} className="text-center">
                                                {resp === 'Sí' ? <span className="badge bg-danger">SÍ</span> :
                                                    resp === 'No' ? <span className="text-muted">No</span> :
                                                        resp}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoriaSalud;
