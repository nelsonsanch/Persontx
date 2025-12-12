import jsPDF from 'jspdf';

/**
 * Genera un PDF detallado con la encuesta de salud y la firma.
 * @param {Object} data - Datos completos { trabajador, respuestas, firma, fecha }
 */
export const generateSurveyPDF = (data) => {
    const { trabajador, respuestas, firma, fecha } = data;
    const doc = new jsPDF();
    let yPos = 20; // Posición vertical inicial
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;

    // --- Encabezado ---
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Encuesta de Condiciones de Salud", pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 10;

    // --- Datos del Trabajador ---
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 35, 'F');
    yPos += 7;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text("Información del Trabajador", margin + 5, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nombre: ${trabajador.nombres} ${trabajador.apellidos}`, margin + 5, yPos);
    doc.text(`Documento: ${trabajador.numeroDocumento}`, pageWidth / 2, yPos);
    yPos += 7;
    doc.text(`Cargo: ${trabajador.cargo || 'N/A'}`, margin + 5, yPos);
    doc.text(`Área: ${trabajador.area || 'N/A'}`, pageWidth / 2, yPos);
    yPos += 15; // Salir de la caja

    // --- Datos de Emergencia ---
    if (respuestas.nombreEmergencia) {
        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text("Contacto de Emergencia", margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(`${respuestas.nombreEmergencia} (${respuestas.parentescoEmergencia}) - Tel: ${respuestas.telefonoEmergencia}`, margin, yPos);
        yPos += 10;
    }

    // --- Respuestas de la Encuesta ---
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Respuestas del Cuestionario", margin, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    const preguntas = Object.entries(respuestas).filter(([key]) => key.startsWith('salud_'));

    preguntas.forEach(([key, value], index) => {
        // Manejo de paginación simple
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        // Limpiar texto de la clave si es necesario (ej: salud_1 -> Pregunta 1)
        // Pero mejor asumimos que tenemos el texto o mostramos el ID técnico si no hay mapa
        // Para simplificar, mostraremos "Pregunta X: Respuesta". 
        // Idealmente traer el texto completo de las preguntas.
        doc.text(`${index + 1}. ${value === 'Sí' ? 'SÍ' : value === 'No' ? 'NO' : value}`, margin + 5, yPos);
        yPos += lineHeight;
    });

    // --- Firma ---
    if (yPos > 240) {
        doc.addPage();
        yPos = 40;
    } else {
        yPos += 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Firma del Trabajador:", margin, yPos);
    yPos += 10;

    if (firma) {
        try {
            doc.addImage(firma, 'PNG', margin, yPos, 60, 30);
            yPos += 35;
        } catch (e) {
            doc.text("(Error cargando imagen de firma)", margin, yPos);
            yPos += 10;
        }
    } else {
        doc.text("(Sin firma digital)", margin, yPos);
        yPos += 10;
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento generado automáticamente por el Sistema de Gestión HSE.", margin, 280);

    // Descargar
    doc.save(`Encuesta_Salud_${trabajador.numeroDocumento}.pdf`);
};
