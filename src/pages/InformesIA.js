import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const InformesIA = () => {
  const { user } = useAuth();
  const [consulta, setConsulta] = useState('');
  const [informe, setInforme] = useState('');
  const [estaCargando, setEstaCargando] = useState(false);

  const generarInforme = async () => {
    if (!user) {
      alert("Error: No se pudo verificar tu usuario.");
      return;
    }

    setEstaCargando(true);
    setInforme('');

    try {
      // 1. Recopilar datos de Firestore (Igual que antes)
      const colecciones = ['trabajadores', 'novedades', 'emos'];
      const promesas = colecciones.map(col => getDocs(query(collection(db, col), where('clienteId', '==', user.uid))));
      const [trabajadoresSnap, novedadesSnap, emosSnap] = await Promise.all(promesas);

      const trabajadores = trabajadoresSnap.docs.map(doc => doc.data());
      const novedades = novedadesSnap.docs.map(doc => doc.data());
      const emos = emosSnap.docs.map(doc => doc.data());

      if (trabajadores.length === 0) {
        setInforme("⚠️ No encontré trabajadores registrados. Registra algunos trabajadores primero para poder analizarlos.");
        setEstaCargando(false);
        return;
      }

      // 2. Preparar los datos para el servidor
      const payload = {
        consulta,
        trabajadores: trabajadores.map(t => ({
          nombre: `${t.nombres} ${t.apellidos}`,
          doc: t.numeroDocumento,
          cargo: t.cargo,
          salario: t.salario,
          area: t.area
        })),
        novedades: novedades.map(n => ({
          tipo: n.tipoNovedad,
          dias: n.dias,
          doc_empleado: n.numeroDocumento
        })),
        emos: emos.map(e => ({
          tipo: e.tipoExamen,
          concepto: e.conceptoAptitud,
          costo: e.valorExamen,
          doc_empleado: e.numeroDocumento
        }))
      };

      // 3. Lógica Híbrida: Backend Seguro (Prod) vs Directo (Local)
      // Nota: Eliminamos fallback local inseguro para evitar exponer keys en build

      let resultadoFinal = "";

      try {
        // Intentar llamar al Backend (Netlify Function)
        const response = await fetch('/.netlify/functions/chat-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Detectar si devolvió HTML (error 404 de React Router porque no existe el proxy)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("text/html") !== -1) {
          throw new Error("HTML_RESPONSE");
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        resultadoFinal = data.resultado;

      } catch (backendError) {
        console.error("Fallo el backend IA:", backendError);
        throw backendError;
      }

      setInforme(resultadoFinal);

    } catch (error) {
      console.error("Error al generar informe:", error);
      let msg = error.message;
      if (msg === "HTML_RESPONSE") msg = "La función de backend no está disponible. Si estás en local, verifica que .env tenga REACT_APP_OPENAI_API_KEY y reinicia.";
      setInforme(`❌ Error: ${msg}`);
    } finally {
      setEstaCargando(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center mb-4">
        <h2 className="text-primary mb-0 me-3">🧠 Analista de HR Inteligente</h2>
        <span className="badge bg-success">Potenciado por AI</span>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">💬 Consulta a tu Asistente Virtual</h5>
        </div>
        <div className="card-body">
          <p className="card-text text-muted">
            Soy tu experto en datos. Pregúntame sobre ausentismo, costos de salud, perfiles de cargo o patrones de riesgo.
            <br /><i>Ejemplo: "Analiza el ausentismo del último mes y estima los costos asociados."</i>
          </p>
          <div className="input-group">
            <textarea
              className="form-control"
              rows="2"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Escribe tu pregunta estratégica aquí..."
              style={{ resize: 'none' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generarInforme(); } }}
            />
            <button
              className="btn btn-primary px-4"
              onClick={generarInforme}
              disabled={estaCargando || !consulta}
            >
              {estaCargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Analizando...
                </>
              ) : (
                <>✨ Analizar</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0 text-dark">📊 Informe de Resultados</h5>
        </div>
        <div className="card-body bg-light" style={{ minHeight: '300px' }}>
          {estaCargando ? (
            <div className="text-center py-5">
              <div className="spinner-grow text-primary" role="status"></div>
              <p className="mt-3 text-muted">Consultando al cerebro artificial...</p>
              <small>Esto puede tomar unos segundos.</small>
            </div>
          ) : (
            informe ? (
              <div className="p-3 bg-white rounded border markdown-content">
                <ReactMarkdown>{informe}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-5 text-muted opacity-50">
                <i className="bi bi-robot fs-1"></i>
                <p className="mt-2">Los resultados del análisis aparecerán aquí.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InformesIA;
