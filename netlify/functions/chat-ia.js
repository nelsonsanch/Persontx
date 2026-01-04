import OpenAI from 'openai';

export const handler = async (event, context) => {
    // Solo permitir solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'La API Key de OpenAI no está configurada en el servidor.' }),
        };
    }

    const openai = new OpenAI({ apiKey });

    try {
        const { consulta, contexto, type } = JSON.parse(event.body);

        let systemPrompt = '';
        let userPrompt = '';

        if (type === 'profile_generation') {
            // System prompt for Job Profile Generation
            systemPrompt = `
                 Eres un experto consultor en recursos humanos especializado en la creación de perfiles de cargo profesionales y detallados.
                 Tu objetivo es generar descripciones de puestos completas, realistas y bien estructuradas.
                 Sigue estrictamente el formato solicitado por el usuario.
             `;
            userPrompt = consulta; // In this case 'consulta' contains the detailed instructions
        } else {
            // "ANALISTA EXPERTO" (Advanced Agent)
            if (!consulta) {
                return { statusCode: 400, body: JSON.stringify({ error: 'La consulta es requerida.' }) };
            }

            systemPrompt = `
              Eres el "Analista Auditor de Datos de Recursos Humanos" de la empresa.
              Tu capacidad supera a la de un asistente simple: Tienes acceso a una base de datos unificada de trabajadores, historial médico, ausentismo y encuestas.

              TUS SUPERPODERES:
              1.  **Precisión Quirúrgica**: Si te piden una fecha, da la fecha. Si te piden un nombre, da el nombre.
              2.  **Cruce de Datos**: Tienes la capacidad de relacionar eventos. 
                  - Ej: "Juan reporta dolor (Encuesta) y tiene restricción de carga (EMO)". -> ¡Detecta esto!
              3.  **Memoria Cronológica**: Tienes el historial de eventos de cada trabajador. Úsalo para ver tendencias.

              FORMATO DE RESPUESTA:
              - Usa Markdown avanzado (Tablas, Negritas, Citas).
              - **EVIDENCIA**: Cada afirmación debe estar respaldada. Ej: "Se recomienda inspección de puesto para Juan Pérez (Fuente: Encuesta 'Dolor espalda' + EMO 'Restricción Lumbar')".
              
              INSTRUCCIONES DE ANÁLISIS:
              - Recibirás un objeto "Contexto Unificado".
              - Dentro hay "Fichas de Trabajadores" con su "Historial" y "Riesgos".
              - Si te piden "Costos", suma los costos del historial.
              - Si te piden "Diagnóstico General", lee el "Resumen Ejecutivo".
            `;

            userPrompt = `
              CONSULTA DEL GERENTE: "${consulta}"
        
              CONTEXTO UNIFICADO (BASE DE DATOS):
              ${JSON.stringify(contexto)}
            `;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.5, // Más preciso, menos creativo
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ resultado: completion.choices[0].message.content }),
        };

    } catch (error) {
        console.error('Error en chat-ia:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Hubo un error procesando tu solicitud con la IA.', detalles: error.message }),
        };
    }
};
