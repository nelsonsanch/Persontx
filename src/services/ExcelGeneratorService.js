import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Importar las preguntas de la encuesta
const PREGUNTAS_ENCUESTA = [
  // INFORMACIÓN PERSONAL
  { id: 1, categoria: 'Información Personal', pregunta: 'Nombres completos', tipo: 'texto' },
  { id: 2, categoria: 'Información Personal', pregunta: 'Apellidos completos', tipo: 'texto' },
  { id: 3, categoria: 'Información Personal', pregunta: 'Número de cédula', tipo: 'texto' },
  { id: 4, categoria: 'Información Personal', pregunta: 'Fecha de nacimiento', tipo: 'fecha' },
  { id: 5, categoria: 'Información Personal', pregunta: 'Edad', tipo: 'numero' },
  { id: 6, categoria: 'Información Personal', pregunta: 'Sexo', tipo: 'seleccion', opciones: ['Masculino', 'Femenino'] },
  { id: 7, categoria: 'Información Personal', pregunta: 'Estado civil', tipo: 'seleccion', opciones: ['Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a', 'Viudo/a'] },
  { id: 8, categoria: 'Información Personal', pregunta: 'Nivel de escolaridad', tipo: 'seleccion', opciones: ['Primaria', 'Secundaria', 'Técnico', 'Tecnológico', 'Universitario', 'Posgrado'] },
  { id: 9, categoria: 'Información Personal', pregunta: 'Dirección de residencia', tipo: 'texto' },
  { id: 10, categoria: 'Información Personal', pregunta: 'Teléfono de contacto', tipo: 'texto' },
  { id: 11, categoria: 'Información Personal', pregunta: 'Email', tipo: 'email' },
  { id: 12, categoria: 'Información Personal', pregunta: 'Persona de contacto en caso de emergencia', tipo: 'texto' },
  { id: 13, categoria: 'Información Personal', pregunta: 'Teléfono de contacto de emergencia', tipo: 'texto' },

  // INFORMACIÓN LABORAL
  { id: 14, categoria: 'Información Laboral', pregunta: 'Cargo actual', tipo: 'texto' },
  { id: 15, categoria: 'Información Laboral', pregunta: 'Área o departamento', tipo: 'texto' },
  { id: 16, categoria: 'Información Laboral', pregunta: 'Fecha de ingreso a la empresa', tipo: 'fecha' },
  { id: 17, categoria: 'Información Laboral', pregunta: 'Tiempo de experiencia en el cargo actual', tipo: 'texto' },
  { id: 18, categoria: 'Información Laboral', pregunta: 'Tipo de contrato', tipo: 'seleccion', opciones: ['Indefinido', 'Fijo', 'Prestación de servicios', 'Temporal'] },
  { id: 19, categoria: 'Información Laboral', pregunta: 'Jornada laboral', tipo: 'seleccion', opciones: ['Diurna', 'Nocturna', 'Mixta', 'Rotativa'] },
  { id: 20, categoria: 'Información Laboral', pregunta: 'Horas de trabajo por día', tipo: 'numero' },
  { id: 21, categoria: 'Información Laboral', pregunta: 'Días de trabajo por semana', tipo: 'numero' },

  // ANTECEDENTES MÉDICOS
  { id: 22, categoria: 'Antecedentes Médicos', pregunta: '¿Tiene alguna enfermedad crónica?', tipo: 'sino' },
  { id: 23, categoria: 'Antecedentes Médicos', pregunta: 'Si respondió sí, especifique cuál(es)', tipo: 'texto' },
  { id: 24, categoria: 'Antecedentes Médicos', pregunta: '¿Toma algún medicamento regularmente?', tipo: 'sino' },
  { id: 25, categoria: 'Antecedentes Médicos', pregunta: 'Si respondió sí, especifique cuál(es)', tipo: 'texto' },
  { id: 26, categoria: 'Antecedentes Médicos', pregunta: '¿Ha sido hospitalizado en los últimos 5 años?', tipo: 'sino' },
  { id: 27, categoria: 'Antecedentes Médicos', pregunta: 'Si respondió sí, especifique la causa', tipo: 'texto' },
  { id: 28, categoria: 'Antecedentes Médicos', pregunta: '¿Ha tenido cirugías?', tipo: 'sino' },
  { id: 29, categoria: 'Antecedentes Médicos', pregunta: 'Si respondió sí, especifique cuál(es) y cuándo', tipo: 'texto' },
  { id: 30, categoria: 'Antecedentes Médicos', pregunta: '¿Tiene alergias conocidas?', tipo: 'sino' },
  { id: 31, categoria: 'Antecedentes Médicos', pregunta: 'Si respondió sí, especifique a qué', tipo: 'texto' },
  { id: 32, categoria: 'Antecedentes Médicos', pregunta: '¿Usa lentes o tiene problemas de visión?', tipo: 'sino' },
  { id: 33, categoria: 'Antecedentes Médicos', pregunta: '¿Tiene problemas de audición?', tipo: 'sino' },

  // HÁBITOS DE VIDA
  { id: 34, categoria: 'Hábitos de Vida', pregunta: '¿Fuma?', tipo: 'seleccion', opciones: ['No', 'Ocasionalmente', 'Diariamente'] },
  { id: 35, categoria: 'Hábitos de Vida', pregunta: 'Si fuma, ¿cuántos cigarrillos por día?', tipo: 'numero' },
  { id: 36, categoria: 'Hábitos de Vida', pregunta: '¿Consume bebidas alcohólicas?', tipo: 'seleccion', opciones: ['No', 'Ocasionalmente', 'Semanalmente', 'Diariamente'] },
  { id: 37, categoria: 'Hábitos de Vida', pregunta: '¿Realiza actividad física regularmente?', tipo: 'sino' },
  { id: 38, categoria: 'Hábitos de Vida', pregunta: 'Si respondió sí, ¿qué tipo de actividad y con qué frecuencia?', tipo: 'texto' },
  { id: 39, categoria: 'Hábitos de Vida', pregunta: '¿Cuántas horas duerme por noche?', tipo: 'numero' },
  { id: 40, categoria: 'Hábitos de Vida', pregunta: '¿Considera que su alimentación es balanceada?', tipo: 'seleccion', opciones: ['Muy buena', 'Buena', 'Regular', 'Mala'] },
  { id: 41, categoria: 'Hábitos de Vida', pregunta: '¿Cuántas comidas hace al día?', tipo: 'numero' },
  { id: 42, categoria: 'Hábitos de Vida', pregunta: '¿Consume agua suficiente durante el día?', tipo: 'sino' },

  // CONDICIONES DE TRABAJO
  { id: 43, categoria: 'Condiciones de Trabajo', pregunta: '¿Su trabajo requiere esfuerzo físico?', tipo: 'seleccion', opciones: ['Ninguno', 'Leve', 'Moderado', 'Intenso'] },
  { id: 44, categoria: 'Condiciones de Trabajo', pregunta: '¿Permanece mucho tiempo en la misma posición?', tipo: 'sino' },
  { id: 45, categoria: 'Condiciones de Trabajo', pregunta: 'Si respondió sí, ¿en qué posición?', tipo: 'seleccion', opciones: ['Sentado', 'De pie', 'Caminando', 'Agachado'] },
  { id: 46, categoria: 'Condiciones de Trabajo', pregunta: '¿Levanta objetos pesados frecuentemente?', tipo: 'sino' },
  { id: 47, categoria: 'Condiciones de Trabajo', pregunta: '¿Está expuesto a ruido excesivo?', tipo: 'sino' },
  { id: 48, categoria: 'Condiciones de Trabajo', pregunta: '¿Está expuesto a sustancias químicas?', tipo: 'sino' },
  { id: 49, categoria: 'Condiciones de Trabajo', pregunta: 'Si respondió sí, especifique cuáles', tipo: 'texto' },
  { id: 50, categoria: 'Condiciones de Trabajo', pregunta: '¿Trabaja en espacios cerrados o con poca ventilación?', tipo: 'sino' },
  { id: 51, categoria: 'Condiciones de Trabajo', pregunta: '¿Está expuesto a temperaturas extremas?', tipo: 'sino' },
  { id: 52, categoria: 'Condiciones de Trabajo', pregunta: '¿Usa elementos de protección personal?', tipo: 'sino' },
  { id: 53, categoria: 'Condiciones de Trabajo', pregunta: 'Si respondió sí, especifique cuáles', tipo: 'texto' },
  { id: 54, categoria: 'Condiciones de Trabajo', pregunta: '¿Ha recibido capacitación en seguridad y salud en el trabajo?', tipo: 'sino' },

  // SÍNTOMAS Y MOLESTIAS
  { id: 55, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado dolor de cabeza frecuente?', tipo: 'sino' },
  { id: 56, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado dolor de espalda?', tipo: 'sino' },
  { id: 57, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado dolor de cuello?', tipo: 'sino' },
  { id: 58, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado dolor en brazos o manos?', tipo: 'sino' },
  { id: 59, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado dolor en piernas o pies?', tipo: 'sino' },
  { id: 60, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado fatiga o cansancio excesivo?', tipo: 'sino' },
  { id: 61, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado problemas para dormir?', tipo: 'sino' },
  { id: 62, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado estrés o ansiedad?', tipo: 'sino' },
  { id: 63, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado irritación en los ojos?', tipo: 'sino' },
  { id: 64, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado problemas respiratorios?', tipo: 'sino' },
  { id: 65, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado problemas digestivos?', tipo: 'sino' },
  { id: 66, categoria: 'Síntomas y Molestias', pregunta: '¿Ha presentado mareos o vértigo?', tipo: 'sino' },

  // ACCIDENTES Y ENFERMEDADES LABORALES
  { id: 67, categoria: 'Accidentes y Enfermedades Laborales', pregunta: '¿Ha sufrido algún accidente de trabajo?', tipo: 'sino' },
  { id: 68, categoria: 'Accidentes y Enfermedades Laborales', pregunta: 'Si respondió sí, describa el accidente', tipo: 'texto' },
  { id: 69, categoria: 'Accidentes y Enfermedades Laborales', pregunta: '¿Cuándo ocurrió el accidente?', tipo: 'fecha' },
  { id: 70, categoria: 'Accidentes y Enfermedades Laborales', pregunta: '¿Ha sido diagnosticado con alguna enfermedad laboral?', tipo: 'sino' },
  { id: 71, categoria: 'Accidentes y Enfermedades Laborales', pregunta: 'Si respondió sí, especifique cuál', tipo: 'texto' },
  { id: 72, categoria: 'Accidentes y Enfermedades Laborales', pregunta: '¿Ha tenido incapacidades laborales en el último año?', tipo: 'sino' },
  { id: 73, categoria: 'Accidentes y Enfermedades Laborales', pregunta: 'Si respondió sí, ¿por cuántos días?', tipo: 'numero' },
  { id: 74, categoria: 'Accidentes y Enfermedades Laborales', pregunta: '¿Cuál fue la causa de la incapacidad?', tipo: 'texto' },

  // BIENESTAR Y SATISFACCIÓN LABORAL
  { id: 75, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Se siente satisfecho con su trabajo actual?', tipo: 'seleccion', opciones: ['Muy satisfecho', 'Satisfecho', 'Poco satisfecho', 'Insatisfecho'] },
  { id: 76, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Considera que su carga de trabajo es adecuada?', tipo: 'seleccion', opciones: ['Muy adecuada', 'Adecuada', 'Excesiva', 'Insuficiente'] },
  { id: 77, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Se siente estresado en su trabajo?', tipo: 'seleccion', opciones: ['Nunca', 'Ocasionalmente', 'Frecuentemente', 'Siempre'] },
  { id: 78, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Tiene buena relación con sus compañeros de trabajo?', tipo: 'seleccion', opciones: ['Excelente', 'Buena', 'Regular', 'Mala'] },
  { id: 79, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Tiene buena relación con su jefe inmediato?', tipo: 'seleccion', opciones: ['Excelente', 'Buena', 'Regular', 'Mala'] },
  { id: 80, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Considera que tiene oportunidades de crecimiento profesional?', tipo: 'sino' },
  { id: 81, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Recibe reconocimiento por su trabajo?', tipo: 'seleccion', opciones: ['Siempre', 'Frecuentemente', 'Ocasionalmente', 'Nunca'] },
  { id: 82, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Considera que su salario es justo?', tipo: 'sino' },
  { id: 83, categoria: 'Bienestar y Satisfacción Laboral', pregunta: '¿Tiene equilibrio entre su vida laboral y personal?', tipo: 'seleccion', opciones: ['Excelente', 'Bueno', 'Regular', 'Malo'] },

  // SUGERENCIAS Y COMENTARIOS
  { id: 84, categoria: 'Sugerencias y Comentarios', pregunta: '¿Qué sugiere para mejorar las condiciones de salud en su trabajo?', tipo: 'texto_largo' },
  { id: 85, categoria: 'Sugerencias y Comentarios', pregunta: '¿Qué programas de bienestar le gustaría que implementara la empresa?', tipo: 'texto_largo' },
  { id: 86, categoria: 'Sugerencias y Comentarios', pregunta: '¿Tiene algún comentario adicional sobre su salud ocupacional?', tipo: 'texto_largo' },
  { id: 87, categoria: 'Sugerencias y Comentarios', pregunta: '¿Considera importante participar en programas de promoción de la salud?', tipo: 'sino' },
  { id: 88, categoria: 'Sugerencias y Comentarios', pregunta: '¿Estaría dispuesto a participar en actividades de bienestar laboral?', tipo: 'sino' },
  { id: 89, categoria: 'Sugerencias y Comentarios', pregunta: '¿Qué temas de capacitación en salud ocupacional le interesan?', tipo: 'texto_largo' },
  { id: 90, categoria: 'Sugerencias y Comentarios', pregunta: 'Califique del 1 al 10 su estado de salud general', tipo: 'numero' }
];

class ExcelGeneratorService {
  
  // Generar Excel con todas las respuestas de una encuesta
  static async generarExcelEncuesta(encuesta, respuestas, trabajadores) {
    try {
      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Hoja 1: Información de la encuesta
      const infoEncuesta = [
        ['REPORTE DE ENCUESTA DE CONDICIONES DE SALUD'],
        [''],
        ['Título:', encuesta.titulo],
        ['Descripción:', encuesta.descripcion || 'Sin descripción'],
        ['Fecha de inicio:', encuesta.fechaInicio],
        ['Fecha de finalización:', encuesta.fechaFin],
        ['Estado:', encuesta.estado],
        ['Total trabajadores asignados:', encuesta.trabajadoresSeleccionados?.length || 0],
        ['Total respuestas completadas:', respuestas.filter(r => r.estado === 'completada').length],
        ['Fecha de generación:', new Date().toLocaleDateString()],
        ['']
      ];
      
      const wsInfo = XLSX.utils.aoa_to_sheet(infoEncuesta);
      XLSX.utils.book_append_sheet(workbook, wsInfo, 'Información');

      // Hoja 2: Respuestas detalladas
      const headers = [
        'ID Respuesta',
        'Trabajador ID',
        'Cédula',
        'Nombres',
        'Apellidos',
        'Cargo',
        'Área',
        'Estado Respuesta',
        'Fecha Respuesta',
        ...PREGUNTAS_ENCUESTA.map(p => `P${p.id}: ${p.pregunta}`)
      ];

      const data = [headers];

      // Agregar datos de cada respuesta
      respuestas.forEach(respuesta => {
        const trabajador = trabajadores.find(t => t.id === respuesta.trabajadorId) || {};
        
        const fila = [
          respuesta.id,
          respuesta.trabajadorId,
          trabajador.cedula || 'N/A',
          trabajador.nombres || 'N/A',
          trabajador.apellidos || 'N/A',
          trabajador.cargo || 'N/A',
          trabajador.area || 'N/A',
          respuesta.estado,
          respuesta.fechaRespuesta?.toDate?.()?.toLocaleDateString() || 'N/A'
        ];

        // Agregar respuestas a cada pregunta
        PREGUNTAS_ENCUESTA.forEach(pregunta => {
          const respuestaPregunta = respuesta.respuestas?.[`pregunta_${pregunta.id}`] || 'Sin respuesta';
          fila.push(respuestaPregunta);
        });

        data.push(fila);
      });

      const wsRespuestas = XLSX.utils.aoa_to_sheet(data);
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // ID Respuesta
        { wch: 15 }, // Trabajador ID
        { wch: 12 }, // Cédula
        { wch: 20 }, // Nombres
        { wch: 20 }, // Apellidos
        { wch: 15 }, // Cargo
        { wch: 15 }, // Área
        { wch: 12 }, // Estado
        { wch: 12 }, // Fecha
        ...PREGUNTAS_ENCUESTA.map(() => ({ wch: 30 })) // Preguntas
      ];
      
      wsRespuestas['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(workbook, wsRespuestas, 'Respuestas Detalladas');

      // Hoja 3: Resumen por categorías
      const categorias = [...new Set(PREGUNTAS_ENCUESTA.map(p => p.categoria))];
      const resumenCategorias = [
        ['RESUMEN POR CATEGORÍAS'],
        [''],
        ['Categoría', 'Total Preguntas', 'Respuestas Completadas', '% Completado']
      ];

      categorias.forEach(categoria => {
        const preguntasCategoria = PREGUNTAS_ENCUESTA.filter(p => p.categoria === categoria);
        const totalPreguntas = preguntasCategoria.length;
        const respuestasCompletadas = respuestas.filter(r => r.estado === 'completada').length;
        const porcentaje = respuestas.length > 0 ? Math.round((respuestasCompletadas / respuestas.length) * 100) : 0;
        
        resumenCategorias.push([
          categoria,
          totalPreguntas,
          respuestasCompletadas,
          `${porcentaje}%`
        ]);
      });

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenCategorias);
      wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen por Categorías');

      // Hoja 4: Estadísticas generales
      const estadisticas = [
        ['ESTADÍSTICAS GENERALES'],
        [''],
        ['Métrica', 'Valor'],
        ['Total trabajadores asignados', encuesta.trabajadoresSeleccionados?.length || 0],
        ['Total respuestas iniciadas', respuestas.length],
        ['Total respuestas completadas', respuestas.filter(r => r.estado === 'completada').length],
        ['Total respuestas en progreso', respuestas.filter(r => r.estado === 'en_progreso').length],
        ['Porcentaje de participación', `${respuestas.length > 0 ? Math.round((respuestas.length / (encuesta.trabajadoresSeleccionados?.length || 1)) * 100) : 0}%`],
        ['Porcentaje de completado', `${respuestas.length > 0 ? Math.round((respuestas.filter(r => r.estado === 'completada').length / respuestas.length) * 100) : 0}%`],
        [''],
        ['DISTRIBUCIÓN POR ESTADO'],
        ['Estado', 'Cantidad', 'Porcentaje'],
        ['Completada', respuestas.filter(r => r.estado === 'completada').length, `${respuestas.length > 0 ? Math.round((respuestas.filter(r => r.estado === 'completada').length / respuestas.length) * 100) : 0}%`],
        ['En progreso', respuestas.filter(r => r.estado === 'en_progreso').length, `${respuestas.length > 0 ? Math.round((respuestas.filter(r => r.estado === 'en_progreso').length / respuestas.length) * 100) : 0}%`],
        ['Sin iniciar', (encuesta.trabajadoresSeleccionados?.length || 0) - respuestas.length, `${(encuesta.trabajadoresSeleccionados?.length || 0) > 0 ? Math.round(((encuesta.trabajadoresSeleccionados?.length || 0) - respuestas.length) / (encuesta.trabajadoresSeleccionados?.length || 1) * 100) : 0}%`]
      ];

      const wsEstadisticas = XLSX.utils.aoa_to_sheet(estadisticas);
      wsEstadisticas['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsEstadisticas, 'Estadísticas');

      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Descargar archivo
      const fileName = `Encuesta_${encuesta.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      return {
        success: true,
        message: 'Excel generado exitosamente',
        fileName
      };

    } catch (error) {
      console.error('Error generando Excel:', error);
      return {
        success: false,
        message: 'Error al generar el Excel: ' + error.message
      };
    }
  }

  // Generar plantilla Excel para importar trabajadores
  static generarPlantillaTrabajadores() {
    try {
      const headers = [
        'Cédula',
        'Nombres',
        'Apellidos',
        'Email',
        'Cargo',
        'Área',
        'Teléfono',
        'Fecha Ingreso'
      ];

      const ejemplos = [
        ['12345678', 'Juan Carlos', 'Pérez García', 'juan.perez@empresa.com', 'Analista', 'Sistemas', '3001234567', '2024-01-15'],
        ['87654321', 'María Elena', 'González López', 'maria.gonzalez@empresa.com', 'Coordinadora', 'RRHH', '3007654321', '2023-06-10']
      ];

      const data = [
        ['PLANTILLA PARA IMPORTAR TRABAJADORES'],
        ['Instrucciones: Complete los datos de cada trabajador en las filas siguientes'],
        [''],
        headers,
        ...ejemplos
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      worksheet['!cols'] = [
        { wch: 12 }, // Cédula
        { wch: 20 }, // Nombres
        { wch: 20 }, // Apellidos
        { wch: 25 }, // Email
        { wch: 15 }, // Cargo
        { wch: 15 }, // Área
        { wch: 12 }, // Teléfono
        { wch: 12 }  // Fecha
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabajadores');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, 'Plantilla_Trabajadores.xlsx');

      return {
        success: true,
        message: 'Plantilla generada exitosamente'
      };

    } catch (error) {
      console.error('Error generando plantilla:', error);
      return {
        success: false,
        message: 'Error al generar la plantilla: ' + error.message
      };
    }
  }
}

export default ExcelGeneratorService;