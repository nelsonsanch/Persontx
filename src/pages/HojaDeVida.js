// Contenido COMPLETO Y FINAL para: src/pages/HojaDeVida.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const HojaDeVida = () => {
  const { trabajadorId } = useParams();
  const { user, dataScopeId } = useAuth();

  const [trabajador, setTrabajador] = useState(null);
  const [novedades, setNovedades] = useState([]);
  const [emos, setEmos] = useState([]);
  const [perfilCargo, setPerfilCargo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false); // Estado para el PDF

  useEffect(() => {
    const fetchAllData = async () => {
      // ... (La lógica de carga de datos que ya funciona se mantiene igual)
      if (!trabajadorId || !user) return;
      setLoading(true);
      try {
        const trabajadorDocRef = doc(db, 'trabajadores', trabajadorId);
        const trabajadorSnap = await getDoc(trabajadorDocRef);
        if (trabajadorSnap.exists()) {
          const trabajadorData = trabajadorSnap.data();
          setTrabajador({ id: trabajadorSnap.id, ...trabajadorData });
          const cedulaTrabajador = trabajadorData.numeroDocumento;
          const cargoTrabajador = trabajadorData.cargo;

          const novedadesQuery = query(collection(db, 'novedades'), where('clienteId', '==', dataScopeId), where('numeroDocumento', '==', cedulaTrabajador), orderBy('fechaInicio', 'desc'));
          const emosQuery = query(collection(db, 'emos'), where('clienteId', '==', dataScopeId), where('numeroDocumento', '==', cedulaTrabajador), orderBy('fechaExamen', 'desc'));
          const perfilQuery = query(collection(db, 'perfiles_cargo'), where('clienteId', '==', dataScopeId), where('nombrePuesto', '==', cargoTrabajador), limit(1));

          const [novedadesSnap, emosSnap, perfilSnap] = await Promise.all([getDocs(novedadesQuery), getDocs(emosQuery), getDocs(perfilQuery)]);
          setNovedades(novedadesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setEmos(emosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          if (!perfilSnap.empty) { const perfilDoc = perfilSnap.docs[0]; setPerfilCargo({ id: perfilDoc.id, ...perfilDoc.data() }); }
        } else { console.error("No se encontró el trabajador:", trabajadorId); }
      } catch (error) { console.error("Error al cargar la información:", error); }
      finally { setLoading(false); }
    };
    fetchAllData();
  }, [trabajadorId, user]);

  const generarPDF = () => {
    const input = document.getElementById('hoja-de-vida-content');
    if (!input) {
      console.error("No se encontró el elemento para generar el PDF.");
      return;
    }

    setIsDownloadingPdf(true); // Muestra el indicador de carga

    html2canvas(input, {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      windowHeight: input.scrollHeight
    }).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 15;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas, 'PNG', margin, margin, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position -= usableHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', margin, position + margin, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(`Hoja_de_Vida_${trabajador.nombres}_${trabajador.apellidos}.pdf`);
      setIsDownloadingPdf(false); // Oculta el indicador de carga
    });
  };

  if (loading) { return (<div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>); }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">
          📄 Hoja de Vida de: {trabajador ? `${trabajador.nombres} ${trabajador.apellidos}` : 'Trabajador'}
        </h2>
        <div>
          <button className="btn btn-success me-2" onClick={generarPDF} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                &nbsp;Generando...
              </>
            ) : (
              '📥 Descargar PDF'
            )}
          </button>
          <Link to="/cliente" className="btn btn-outline-secondary">
            Volver al Panel
          </Link>
        </div>
      </div>

      {/* Añadimos un div contenedor con un ID para que la función de PDF sepa qué capturar */}
      <div id="hoja-de-vida-content">
        {trabajador ? (
          <div>
            {/* Sección de Información Personal */}
            <div className="card mb-4"><div className="card-header"><h5>👤 Información Personal</h5></div><div className="card-body row"><div className="col-md-4"><p><strong>Nombre Completo:</strong> {trabajador.nombres} {trabajador.apellidos}</p></div><div className="col-md-4"><p><strong>Cédula:</strong> {trabajador.tipoCedula} {trabajador.numeroDocumento}</p></div><div className="col-md-4"><p><strong>Cargo:</strong> {trabajador.cargo}</p></div><div className="col-md-4"><p><strong>Teléfono:</strong> {trabajador.telefono}</p></div><div className="col-md-4"><p><strong>EPS:</strong> {trabajador.eps}</p></div><div className="col-md-4"><p><strong>AFP:</strong> {trabajador.afp}</p></div></div></div>
            {/* Sección de Perfil de Cargo */}
            <div className="card mb-4"><div className="card-header"><h5>👔 Perfil del Cargo: {perfilCargo ? perfilCargo.nombrePuesto : ''}</h5></div><div className="card-body">{perfilCargo ? (<div><h6 className="text-primary">1. Identificación del Cargo</h6><div className="row mb-3"><div className="col-md-4"><p><strong>Reporta a:</strong> {perfilCargo.reportaA || 'N/A'}</p></div><div className="col-md-4"><p><strong>Personal a Cargo:</strong> {perfilCargo.personalACargo || 'N/A'}</p></div><div className="col-md-4"><p><strong>Jornada Laboral:</strong> {perfilCargo.jornadaLaboral || 'N/A'}</p></div></div><hr /><h6 className="text-primary mt-4">2. Propósito y Contribución</h6><p><strong>Misión/Objetivo:</strong><br />{perfilCargo.misionObjetivo || 'N/A'}</p><p><strong>Contribución Estratégica:</strong><br />{perfilCargo.contribucionEstrategica || 'N/A'}</p><hr /><h6 className="text-primary mt-4">3. Funciones y Responsabilidades</h6><p><strong>Funciones Principales:</strong><br />{perfilCargo.funcionesPrincipales || 'N/A'}</p><p><strong>Funciones Periódicas:</strong><br />{perfilCargo.funcionesPeriodicas || 'N/A'}</p><p><strong>KPIs:</strong><br />{perfilCargo.indicadoresKPI || 'N/A'}</p><hr /><h6 className="text-primary mt-4">4. Perfil Requerido</h6><div className="row mb-3"><div className="col-md-6"><p><strong>Formación Académica:</strong><br />{perfilCargo.formacionAcademica || 'N/A'}</p></div><div className="col-md-6"><p><strong>Experiencia Laboral:</strong><br />{perfilCargo.experienciaLaboral || 'N/A'}</p></div><div className="col-md-6"><p><strong>Habilidades Técnicas:</strong><br />{perfilCargo.habilidadesTecnicas || 'N/A'}</p></div><div className="col-md-6"><p><strong>Competencias Conductuales:</strong><br />{perfilCargo.competenciasConductuales || 'N/A'}</p></div></div><hr /><h6 className="text-primary mt-4">5. Condiciones de Trabajo y Riesgos</h6><p><strong>Ambiente y Condiciones:</strong><br />{perfilCargo.ambienteCondiciones || 'N/A'}</p><div className="row"><div className="col-md-6"><strong>Riesgos Laborales:</strong><div className="mt-2">{perfilCargo.riesgosLaborales?.length > 0 ? perfilCargo.riesgosLaborales.map(item => (<span key={item} className="badge bg-warning text-dark me-1 mb-1">{item}</span>)) : 'N/A'}</div></div><div className="col-md-6"><strong>EPP Requeridos:</strong><div className="mt-2">{perfilCargo.equiposEPP?.length > 0 ? perfilCargo.equiposEPP.map(item => (<span key={item} className="badge bg-success me-1 mb-1">{item}</span>)) : 'N/A'}</div></div></div><hr />{perfilCargo.examenesMedicos?.length > 0 && (<> <h6 className="text-primary mt-4">6. Exámenes Médicos Sugeridos</h6><div className="mt-2">{perfilCargo.examenesMedicos.map(item => (<span key={item} className="badge bg-info text-dark me-1 mb-1">{item}</span>))}</div></>)}</div>) : (<p className="text-muted">No se encontró un perfil de cargo asociado para este trabajador.</p>)}</div></div>
            {/* Sección de Novedades */}
            <div className="card mb-4"><div className="card-header"><h5>📋 Historial de Novedades</h5></div><div className="card-body">{novedades.length > 0 ? (<div className="table-responsive"><table className="table table-striped table-hover"><thead className="table-dark"><tr><th>Tipo</th><th>Fechas</th><th>Tiempo</th><th>Valor Total</th><th>Pagado</th><th>Pendiente</th><th>Estado</th><th>Investigación</th></tr></thead><tbody>{novedades.map(novedad => (<tr key={novedad.id}><td><span className="badge bg-info text-dark">{novedad.tipoNovedad}</span></td><td>{novedad.fechaInicio} - {novedad.fechaFin}</td><td><span className="badge bg-secondary">{novedad.dias}d</span></td><td>${new Intl.NumberFormat('es-CO').format(novedad.valorTotal || 0)}</td><td><span className="badge bg-success">${new Intl.NumberFormat('es-CO').format(novedad.valorPagado || 0)}</span></td><td><span className="badge bg-danger">${new Intl.NumberFormat('es-CO').format(novedad.valorPendiente || 0)}</span></td><td><span className="badge bg-success">{novedad.estado}</span></td><td><span className="badge bg-dark">{novedad.investigacion}</span></td></tr>))}</tbody></table></div>) : (<p className="text-muted">No hay novedades registradas para este trabajador.</p>)}</div></div>
            {/* Sección de EMOS */}
            <div className="card mb-4"><div className="card-header"><h5>🩺 Historial de Exámenes Médicos (EMOS)</h5></div><div className="card-body">{emos.length > 0 ? (emos.map(emo => (<div key={emo.id} className="mb-4 p-3 border rounded bg-light"><div className="row mb-3"><div className="col-md-3"><strong>Tipo de Examen:</strong><br /><span className="badge bg-primary">{emo.tipoExamen}</span></div><div className="col-md-3"><strong>Fecha del Examen:</strong><br />{emo.fechaExamen}</div><div className="col-md-3"><strong>Estado:</strong><br /><span className={`badge ${emo.estado === 'Vigente' ? 'bg-success' : 'bg-danger'}`}>{emo.estado}</span></div><div className="col-md-3"><strong>Concepto de Aptitud:</strong><br /><span className={`badge ${emo.conceptoAptitud === 'Apto sin restricciones' ? 'bg-success' : 'bg-warning text-dark'}`}>{emo.conceptoAptitud}</span></div></div><div className="row mb-3"><div className="col-md-3"><strong>Centro Médico:</strong><br />{emo.centroMedico || 'N/A'}</div><div className="col-md-3"><strong>Médico Examinador:</strong><br />{emo.medicoExaminador || 'N/A'}</div><div className="col-md-3"><strong>Licencia Médica:</strong><br />{emo.numeroLicenciaMedica || 'N/A'}</div><div className="col-md-3"><strong>Valor del Examen:</strong><br />${new Intl.NumberFormat('es-CO').format(emo.valorExamen || 0)}</div></div><hr /><h6 className="mt-3">Pruebas Complementarias</h6><div className="row mb-3"><div className="col-md-6"><strong>Pruebas realizadas:</strong><p className="text-muted">{emo.pruebasRealizadas || 'No se especificaron'}</p></div><div className="col-md-6"><strong>Otras pruebas:</strong><p className="text-muted">{emo.otrasPruebas || 'N/A'}</p></div></div><h6>Restricciones, Recomendaciones y Observaciones</h6><div className="row"><div className="col-md-4"><strong>Restricciones:</strong><p className="text-danger">{emo.restricciones || 'Ninguna'}</p></div><div className="col-md-4"><strong>Recomendaciones:</strong><p className="text-primary">{emo.recomendaciones || 'N/A'}</p></div><div className="col-md-4"><strong>Observaciones:</strong><p className="text-dark">{emo.observaciones || 'N/A'}</p></div></div></div>))) : (<p className="text-muted">No hay exámenes médicos registrados para este trabajador.</p>)}</div></div>
          </div>
        ) : (
          <div className="alert alert-danger">No se pudo cargar la información del trabajador. Es posible que el enlace sea incorrecto o el trabajador haya sido eliminado.</div>
        )}
      </div>
    </div>
  );
};

export default HojaDeVida;