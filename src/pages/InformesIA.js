// Contenido COMPLETO Y FINAL para: src/pages/InformesIA.js (Versión ChatGPT)

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';

const InformesIA = () => {
  const OPENAI_API_KEY = ''; // API Key removida por seguridad
  
  const { user } = useAuth();
  const [consulta, setConsulta] = useState('');
  const [informe, setInforme] = useState('');
  const [estaCargando, setEstaCargando] = useState(false);

  // Configuración del cliente de OpenAI
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // Necesario para usar la librería en el navegador.
  });

  const generarInforme = async () => {
    if (!user) {
      alert("Error: No se pudo verificar tu usuario.");
      return;
    }
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('AQUÍ_PEGA_TU_API_KEY')) {
        alert('Error: La API Key de OpenAI no está configurada.');
        return;
    }

    setEstaCargando(true);
    setInforme('');

    try {
      // 1. Recopilar datos de Firestore (esto no cambia)
      const colecciones = ['trabajadores', 'novedades', 'emos'];
      const promesas = colecciones.map(col => getDocs(query(collection(db, col), where('clienteId', '==', user.uid))));
      const [trabajadoresSnap, novedadesSnap, emosSnap] = await Promise.all(promesas);

      const trabajadores = trabajadoresSnap.docs.map(doc => doc.data());
      const novedades = novedadesSnap.docs.map(doc => doc.data());
      const emos = emosSnap.docs.map(doc => doc.data());

      if (trabajadores.length === 0) {
        setInforme("No se encontraron trabajadores registrados para analizar. Por favor, añade trabajadores antes de generar informes.");
        setEstaCargando(false);
        return;
      }
      
      // 2. Preparar el prompt mejorado para un modelo superior
      const systemPrompt = `Eres un asistente experto en análisis de datos de Recursos Humanos. Tu tarea es analizar los datos que te proporciono y responder a la pregunta del usuario con la máxima precisión. Las 'novedades' y 'emos' se relacionan con los 'trabajadores' a través del campo 'numeroDocumento'.`;
      
      const userPrompt = `
        PREGUNTA DEL USUARIO: "${consulta}"

        DATOS DE LA EMPRESA EN FORMATO JSON:
        
        // Lista de trabajadores
        "trabajadores": ${JSON.stringify(trabajadores.map(t => ({ nombre: t.nombres + ' ' + t.apellidos, numeroDocumento: t.numeroDocumento, cargo: t.cargo })))}

        // Lista de novedades (incapacidades, vacaciones, etc.)
        "novedades": ${JSON.stringify(novedades.map(n => ({ tipo: n.tipoNovedad, dias: n.dias, numeroDocumento: n.numeroDocumento })))}

        // Lista de exámenes médicos
        "emos": ${JSON.stringify(emos.map(e => ({ tipo: e.tipoExamen, conceptoAptitud: e.conceptoAptitud, costo: e.valorExamen, numeroDocumento: e.numeroDocumento })))}
        
        INSTRUCCIONES PARA LA RESPUESTA:
        1. Basa tu respuesta ÚNICAMENTE en los datos JSON proporcionados. No inventes ni supongas información.
        2. Realiza los cálculos necesarios con precisión (contar, sumar, promediar).
        3. Si la pregunta requiere una lista o un ranking, presenta el resultado en una tabla con formato Markdown.
        4. Sé claro, conciso y profesional en tu respuesta.
      `;

      // 3. Llamar a la API de ChatGPT con el modelo GPT-4o
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o", // <-- ¡MODELO MEJORADO!
        messages: [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": userPrompt },
        ],
      });

      const respuesta = chatCompletion.choices[0].message.content;
      setInforme(respuesta);

    } catch (error) {
      console.error("Error al generar el informe con OpenAI:", error);
      if (error.response && error.response.status === 401) {
        setInforme("Error de autenticación. Parece que tu API Key de OpenAI no es válida o ha expirado. Por favor, verifícala.");
      } else {
        setInforme("Hubo un error al procesar tu solicitud con la API de ChatGPT. Por favor, revisa la consola (F12) para más detalles.");
      }
    } finally {
      setEstaCargando(false);
    }
  };
  return (
    <div className="container-fluid">
      <h2 className="text-primary mb-4">❓ Consultas con IA</h2>
      
      <div className="card mb-4">
        <div className="card-header">
          <h5>Realiza una consulta a la Inteligencia Artificial</h5>
        </div>
        <div className="card-body">
          <p className="card-text text-muted">
            Escribe en lenguaje natural lo que necesitas analizar. Por ejemplo: "¿Cuáles son los 5 trabajadores con más novedades de tipo 'Incapacidad'?" o "Genera un resumen de los costos de exámenes médicos por mes".
          </p>
          <textarea
            className="form-control"
            rows="3"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Escribe tu pregunta aquí..."
          />
          <button 
            className="btn btn-primary mt-3" 
            onClick={generarInforme} 
            disabled={estaCargando || !consulta}
          >
            {estaCargando ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                &nbsp;Analizando datos...
              </>
            ) : (
              'Generar Informe'
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>Resultado del Análisis</h5>
        </div>
        <div className="card-body" style={{ minHeight: '200px' }}>
          {estaCargando ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            informe ? (
              <ReactMarkdown>{informe}</ReactMarkdown>
            ) : (
              <p className="text-muted">El informe generado por la IA aparecerá aquí.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InformesIA;