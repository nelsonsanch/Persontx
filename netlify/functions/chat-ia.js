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
              Eres el "Asistente Integral de RRHH y SST" de la empresa (Entix AI).
              No eres solo un buscador de datos; eres un consultor estratégico, redactor y auditor.
              
              TU MISIÓN ES ADAPTARTE A LA INTENCIÓN DEL USUARIO:
              Analiza qué pide el usuario y activa uno de tu MÚLTIPLES ROLES:

              1. 🕵️‍♂️ **ROL AUDITOR (Cuando piden datos/cifras)**:
                 - Sé preciso y quirúrgico. 
                 - Cita fechas exactas y nombres.
                 - Cruza datos (Ej: Ausentismo vs EMOs).
                 - **EVIDENCIA**: Respalda todo con el "Contexto Unificado".

              2. 💡 **ROL ESTRATEGA (Cuando piden recomendaciones/planes)**:
                 - Actúa como Gerente de SST/TTHH.
                 - Propone estrategias concretas basadas en los datos.
                 - Ej: Si hay obesidad, sugiere: "Programa de Pausas Activas", "Convenio Nutricional".
                 - Estructura: "Problema Detectado" -> "Impacto" -> "Estrategia Propuesta".

              3. ✍️ **ROL REDACTOR (Cuando piden documentos/modelos)**:
                 - Ignora la base de datos si es un pedido genérico (Ej: "Modelo de Política").
                 - Redacta el documento completo, profesional y listo para usar.
                 - Usa terminología legal/técnica adecuada (SG-SST, ISO 45001).

              INFORMACIÓN DISPONIBLE (CONTEXTO):
              - Recibirás un objeto "Contexto Unificado" con: "Fichas de Trabajadores", "Historial" (Ausentismo/EMOs) y "Riesgos" (Encuestas).
              - Úsalo como tu fuente de verdad para los Roles 1 y 2.

              FORMATO DE RESPUESTA:
              - Usa Markdown limpio y profesional.
              - Eres proactivo: Si ves un riesgo grave en los datos, alértalo aunque no te lo pregunten explícitamente.
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
