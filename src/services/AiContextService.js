/**
 * AiContextService.js
 * Servicio para unificar, limpiar y estructurar los datos de RRHH antes de enviarlos a la IA.
 * Objetivo: Reducir tokens y aumentar la precisión del contexto.
 */

export const AiContextService = {

    /**
     * Genera el Paylaod optimizado para la IA
     */
    prepararDatosParaIA: (trabajadores, novedades, emos, encuestas) => {
        // 1. Crear Mapa de Trabajadores (Key: Firestore ID) y Índice por Cédula
        const mapaTrabajadores = {};
        const indiceCedula = {}; // Para buscar rápido por número de documento

        trabajadores.forEach(t => {
            // Asegurar que tenemos ID y Documento
            const firestoreId = t.id;
            const cedula = t.numeroDocumento;

            if (firestoreId) {
                mapaTrabajadores[firestoreId] = {
                    basico: {
                        nombre: `${t.nombres} ${t.apellidos}`,
                        cargo: t.cargo,
                        area: t.area,
                        cedula: cedula, // Importante para referencia
                        fechaIngreso: t.fechaIngreso,
                        salario: t.salario
                    },
                    historial: [], // Línea de tiempo unificada
                    riesgos: []    // Alertas detectadas
                };
            }

            if (cedula && firestoreId) {
                indiceCedula[cedula] = firestoreId;
            }
        });

        // 2. Procesar Novedades (Ausentismo) - Usan Cédula
        novedades.forEach(nov => {
            const cedula = nov.numeroDocumento || nov.doc_empleado;
            const workerId = indiceCedula[cedula]; // Buscar ID real usando la Cédula

            if (workerId && mapaTrabajadores[workerId]) {
                // Mapeo corregido de campos
                const diagnostico = nov.diagnosticoEnfermedad || nov.diagnostico || 'Sin diagnóstico';
                const costo = nov.valorTotal || nov.costo || 0;

                mapaTrabajadores[workerId].historial.push({
                    tipo: 'AUSENTISMO',
                    fecha: nov.fechaInicio,
                    detalle: `${nov.tipoNovedad} - ${diagnostico} (${nov.dias} días)`,
                    costo: costo
                });
            }
        });

        // 3. Procesar EMOs (Exámenes Médicos) - Usan Cédula
        emos.forEach(emo => {
            const cedula = emo.numeroDocumento || emo.doc_empleado;
            const workerId = indiceCedula[cedula];

            if (workerId && mapaTrabajadores[workerId]) {
                mapaTrabajadores[workerId].historial.push({
                    tipo: 'SALUD_EMO',
                    fecha: emo.fechaExamen,
                    detalle: `${emo.tipoExamen}: ${emo.conceptoAptitud} - ${emo.recomendaciones || 'Sin recomendaciones'}`,
                    enfasis: emo.enfasis
                });

                if (emo.conceptoAptitud !== 'Apto') {
                    mapaTrabajadores[workerId].riesgos.push(`Restricción Médica: ${emo.conceptoAptitud}`);
                }
            }
        });

        // 4. Procesar Encuestas (Sintomatología) - Usan Firestore ID
        encuestas.forEach(enc => {
            const workerId = enc.trabajadorId; // ID directo de Firestore

            if (workerId && mapaTrabajadores[workerId]) {
                mapaTrabajadores[workerId].historial.push({
                    tipo: 'ENCUESTA_SALUD',
                    fecha: enc.fechaRespuesta ? new Date(enc.fechaRespuesta.seconds * 1000).toISOString().split('T')[0] : 'N/A',
                    detalle: 'Respondió encuesta de condiciones de salud'
                });

                // Analizar respuestas de riesgo
                const respuestas = enc.respuestas || {};
                Object.entries(respuestas).forEach(([key, val]) => {
                    // Detectar respuestas relevantes
                    if (val && typeof val === 'string' && val !== 'No' && val !== 'No sé' && val !== 'N/A' && val !== 'No reportado' && val.length > 2) {
                        mapaTrabajadores[workerId].riesgos.push(`SÍNTOMA (${key}): ${val}`);
                    }
                });
            }
        });

        // Retornar solo fichas activas (con historial o riesgos) para ahorrar tokens
        // O retornar todas si se pide análisis global
        return {
            resumenGlobal: AiContextService.generarResumenEjecutivo(trabajadores, novedades, emos, encuestas),
            fichasTrabajadores: mapaTrabajadores
        };
    },

    /**
     * Crea un resumen estadístico y narrativo para no enviar JSON crudo
     */
    generarResumenEjecutivo: (trabajadores, novedades, emos, encuestas) => {
        // Totales
        const totalTrabajadores = trabajadores.length;
        const totalIncapacidades = novedades.filter(n => n.tipoNovedad?.toLowerCase().includes('incapacidad')).length;

        // Cruce de Encuestas (Dolor vs Ausentismo)
        const reportesDolor = encuestas.filter(e => {
            const r = e.respuestas || {};
            // Buscar claves que indiquen dolor (salud_14 a salud_38 aprox)
            return Object.keys(r).some(k => k.includes('salud_') &&
                (r[k] === 'Sí' || (typeof r[k] === 'string' && r[k].length > 4 && r[k] !== 'No sé')));
        }).length;

        return `
      Resumen Ejecutivo de Datos:
      - Total Empleados: ${totalTrabajadores}
      - Total Eventos de Ausentismo: ${totalIncapacidades}
      - Empleados reportando síntomas en encuestas: ${reportesDolor}
    `.trim();
    }
};
