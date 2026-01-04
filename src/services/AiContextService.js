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
        encuestas.forEach(enc => {
            // Intentar vincular por ID de trabajador guardado en la encuesta
            // Si no existe, intentar buscar por otro método o ignorar si no hay vínculo claro
            // Asumimos que enc.trabajadorId mapea al ID del documento de trabajador en Firebase

            // Nota: trabajadores es un array de objetos data(), puede que no tenga el ID de documento 'id'.
            // En InformesIA se mapeaba: trabajadores.find(t => t.id === enc.trabajadorId)
            // Necesitamos asegurar que los objetos trabajador tengan su ID de Firestore.
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
