const OpenAI = require('openai');

exports.handler = async (event, context) => {
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
        const { consulta, trabajadores, novedades, emos, encuestas, type, promptContext } = JSON.parse(event.body);

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
            // Default: Analista de HR
            if (!consulta) {
                return { statusCode: 400, body: JSON.stringify({ error: 'La consulta es requerida.' }) };
            }

            systemPrompt = `
              Eres el "Analista Senior de Datos de Recursos Humanos (HR)" de la empresa.
              Tu misión es ayudar al gerente a tomar decisiones estratégicas basadas en la salud y el comportamiento de los empleados.
        
              OBJETIVOS DE TUS RESPUESTAS:
              1.  **Analítica Profunda**: No solo cuentes datos, busca patrones (ej. "Hay un aumento de incapacidades en el área X").
              2.  **Contexto Legal**: Si ves enfermedades graves, recuerda sutilmente la normativa de salud laboral en Colombia (SG-SST) sin ser abogado.
              3.  **Accionable**: Cada respuesta debe sugerir al menos una acción preventiva o correctiva.
        
              FORMATO DE SALIDA (IMPORTANTE):
              Responde SIEMPRE usando Markdown enriquecido:
              - Usa TABLAS para listas de empleados o costos.
              - Usa \`Negritas\` para resaltar cifras clave.
              - Usa Listas para enumerar hallazgos.
              
              Los datos que recibirás son JSON crudo de la base de datos:
              - Trabajadores: Info personal y contractual.
              - Novedades: Incapacidades, permisos, vacaciones.
              - EMOs: Exámenes médicos ocupacionales y diagnósticos.
              
              IMPORTANTE:
              - Si te piden "Costos", suma el valor de los EMOs o estima costos de incapacidad (salario / 30 * dias).
              - Si te piden "Diagnóstico", cruza las enfermedades reportadas en encuestas/EMOs con las incapacidades.
              - **ENCUESTAS DE SALUD**: Tienes acceso a las respuestas de las encuestas de salud (Sintomatología, hábitos, demografía). Úsalas para identificar riesgos psicosociales o biomecánicos antes de que se conviertan en ausentismo.
              - Si no hay datos suficientes, dilo claramente.
            `;

            userPrompt = `
              PREGUNTA DEL USUARIO: "${consulta}"
        
              DATOS DISPONIBLES (JSON):
              - Trabajadores (${trabajadores?.length || 0} registros): ${JSON.stringify(trabajadores)}
              - Novedades (${novedades?.length || 0} registros): ${JSON.stringify(novedades)}
              - Novedades (${novedades?.length || 0} registros): ${JSON.stringify(novedades)}
              - EMOs (${emos?.length || 0} registros): ${JSON.stringify(emos)}
              - Encuestas de Salud (${encuestas?.length || 0} registros): ${JSON.stringify(encuestas)}
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
