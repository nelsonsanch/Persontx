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
        // 1. Crear Mapa de Trabajadores (Key: ID/Cedula -> Data)
        const mapaTrabajadores = {};

        trabajadores.forEach(t => {
            const id = t.numeroDocumento || t.id;
            mapaTrabajadores[id] = {
                basico: {
                    nombre: `${t.nombres} ${t.apellidos}`,
                    cargo: t.cargo,
                    area: t.area,
                    fechaIngreso: t.fechaIngreso,
                    salario: t.salario
                },
                historial: [], // Línea de tiempo unificada
                riesgos: []    // Alertas detectadas
            };
        });

        // 2. Procesar Novedades (Ausentismo)
        novedades.forEach(nov => {
            const id = nov.numeroDocumento || nov.doc_empleado;
            if (mapaTrabajadores[id]) {
                mapaTrabajadores[id].historial.push({
                    tipo: 'AUSENTISMO',
                    fecha: nov.fechaInicio,
                    detalle: `${nov.tipoNovedad} - ${nov.diagnostico || 'Sin diagnóstico'} (${nov.dias} días)`,
                    costo: nov.costo || 0
                });
            }
        });

        // 3. Procesar EMOs (Exámenes Médicos)
        emos.forEach(emo => {
            const id = emo.numeroDocumento || emo.doc_empleado;
            if (mapaTrabajadores[id]) {
                mapaTrabajadores[id].historial.push({
                    tipo: 'SALUD_EMO',
                    fecha: emo.fechaExamen,
                    detalle: `${emo.tipoExamen}: ${emo.conceptoAptitud} - ${emo.recomendaciones || 'Sin recomendaciones'}`,
                    enfasis: emo.enfasis
                });

                if (emo.conceptoAptitud !== 'Apto') {
                    mapaTrabajadores[id].riesgos.push(`Restricción Médica: ${emo.conceptoAptitud}`);
                }
            }
        });

        // 4. Procesar Encuestas (Sintomatología)
        // 4. Procesar Encuestas (Sintomatología)
        encuestas.forEach(enc => {
            // Intentar vincular por ID de trabajador guardado en la encuesta
            const id = enc.trabajadorId; // ID de Firestore

            if (mapaTrabajadores[id]) {
                mapaTrabajadores[id].historial.push({
                    tipo: 'ENCUESTA_SALUD',
                    fecha: enc.fechaRespuesta ? new Date(enc.fechaRespuesta.seconds * 1000).toISOString().split('T')[0] : 'N/A',
                    detalle: 'Respondió encuesta de condiciones de salud'
                });

                // Analizar respuestas de riesgo
                const respuestas = enc.respuestas || {};
                Object.entries(respuestas).forEach(([key, val]) => {
                    // Detectar respuestas de dolor o síntomas (Valores distintos a 'No'/'No sé'/'N/A')
                    if (val && typeof val === 'string' && val !== 'No' && val !== 'No sé' && val !== 'N/A' && val !== 'No reportado' && val.length > 2) {
                        // Es un síntoma reportado
                        mapaTrabajadores[id].riesgos.push(`SÍNTOMA (${key}): ${val}`);
                    }
                });
            }
        });

        // REVISIÓN: La función necesita recibir trabajadores con su ID de Firestore para cruzar encuestas.
        // Ajustaremos la lógica de cruce en 'generarResumenEjecutivo'.

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
