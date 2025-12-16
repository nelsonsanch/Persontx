import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore';

const PerfilesCargo = () => {
  const { user } = useAuth();
  const [perfiles, setPerfiles] = useState([]);
  const [perfilesFiltrados, setPerfilesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);

  const [filtros, setFiltros] = useState({
    nombre: '',
    area: '',
    modalidad: '',
    codigo: ''
  });

  const [formData, setFormData] = useState({
    nombrePuesto: '',
    areaDepartamento: '',
    reportaA: '',
    personalACargo: '',
    ubicacionModalidad: '',
    jornadaLaboral: '',
    misionObjetivo: '',
    contribucionEstrategica: '',
    funcionesPrincipales: '',
    funcionesPeriodicas: '',
    indicadoresKPI: '',
    formacionAcademica: '',
    experienciaLaboral: '',
    habilidadesTecnicas: '',
    competenciasConductuales: '',
    ambienteCondiciones: '',
    riesgosLaborales: [],
    equiposEPP: [],
    examenesMedicos: []
  });

  const modalidadesWork = ['Presencial', 'Remoto', 'Híbrido', 'Rotativo', 'Por turnos'];
  const jornadasLaborales = ['Lunes a viernes', 'Lunes a sábado', 'Turnos rotativos', 'Nocturno', 'Fin de semana', 'Por horas', 'Horario flexible'];
  const riesgosDisponibles = [{ categoria: 'Biológico', opciones: ['Virus', 'Bacterias', 'Hongos', 'Parásitos', 'Picaduras', 'Mordeduras', 'Fluidos corporales'] }, { categoria: 'Físico', opciones: ['Ruido', 'Iluminación', 'Vibración', 'Temperaturas extremas', 'Radiación ionizante', 'Radiación no ionizante ', 'Presión atmosférica'] }, { categoria: 'Químico', opciones: ['Polvos', 'Vapores', 'Líquidos', 'Gases', 'Humos', 'Material particulado'] }, { categoria: 'Psicosocial', opciones: ['Estrés', 'Carga mental', 'Contenido de la tarea', 'Demandas emocionales', 'Sistemas de control', 'Relaciones humanas', 'Liderazgo'] }, { categoria: 'Biomecánico', opciones: ['Postura', 'Esfuerzo', 'Movimiento repetitivo', 'Manipulación manual de cargas'] }, { categoria: 'Condiciones de Seguridad', opciones: ['Mecánico', 'Eléctrico', 'Locativo', 'Tecnológico', 'Accidentes de tránsito', 'Público', 'Trabajo en alturas', 'Espacios confinados'] }, { categoria: 'Fenómenos Naturales', opciones: ['Sismo', 'Erupcion volcanica', 'Terremoto', 'Vendaval', 'Inundación', 'Derrumbe', 'Precipitaciones'] }];
  const eppDisponibles = [{ zona: 'Protección de Cabeza', opciones: ['Casco de seguridad', 'Gorra', 'Capucha', 'Casco con barbuquejo'] }, { zona: 'Protección Ocular y Facial', opciones: ['Gafas de seguridad', 'Monogafas', 'Careta facial', 'Pantalla facial'] }, { zona: 'Protección Respiratoria', opciones: ['Mascarilla desechable', 'Respirador con filtros', 'Mascarilla N95', 'Equipos de aire suministrado'] }, { zona: 'Protección Auditiva', opciones: ['Tapones auditivos', 'Copa auditiva', 'Tapones moldeables', 'Protección dual'] }, { zona: 'Protección de Manos', opciones: ['Guantes de cuero', 'Guantes de caucho', 'Guantes dieléctricos', 'Guantes químicos', 'Guantes térmicos', 'Guantes desechables'] }, { zona: 'Protección Corporal', opciones: ['Overol', 'Delantal', 'Chaleco reflectivo', 'Ropa impermeable', 'Ropa térmica', 'Uniforme antiestático'] }, { zona: 'Protección de Pies', opciones: ['Botas de seguridad', 'Botas dieléctricas', 'Botas químicas', 'Zapatos antideslizantes', 'Botas impermeables'] }];
  const examenesMedicosDisponibles = ['Examen médico general', 'Audiometría', 'Visiometría', 'Espirometría', 'Electrocardiograma', 'Radiografía de tórax', 'Hemograma completo', 'Glicemia', 'Creatinina', 'Parcial de orina', 'Pruebas de función hepática', 'Examen osteomuscular', 'Examen neurológico', 'Examen dermatológico', 'Valoración psicológica', 'Test de coordinación', 'Examen de agudeza visual', 'Campimetría visual', 'Examen de fondo de ojo'];

  // Función para generar sugerencias con OpenAI
  const generarSugerenciasConIA = async (nombrePuesto, areaDepartamento = '') => {
    try {
      setLoadingIA(true);

      const prompt = `
Actúa como un experto en recursos humanos y gestión de talento. Necesito que generes un perfil de cargo completo y profesional para el puesto de "${nombrePuesto}"${areaDepartamento ? ` en el área de ${areaDepartamento}` : ''}.

Por favor, proporciona información específica y realista para cada uno de los siguientes campos. La información debe ser práctica, aplicable y estar alineada con las mejores prácticas de RRHH:

1. MISIÓN/OBJETIVO PRINCIPAL: (2-3 líneas describiendo el propósito principal del puesto)

2. CONTRIBUCIÓN ESTRATÉGICA: (2-3 líneas explicando cómo este puesto contribuye a los objetivos organizacionales)

3. FUNCIONES PRINCIPALES: (Lista de 5-7 actividades diarias/semanales específicas)

4. FUNCIONES PERIÓDICAS: (Lista de 3-5 actividades mensuales/trimestrales)

5. INDICADORES KPI: (Lista de 4-6 métricas específicas para medir el desempeño)

6. FORMACIÓN ACADÉMICA: (Nivel educativo mínimo, carreras relevantes, certificaciones)

7. EXPERIENCIA LABORAL: (Años de experiencia requeridos y en qué áreas específicas)

8. HABILIDADES TÉCNICAS: (Lista específica de software, herramientas, conocimientos técnicos)

9. COMPETENCIAS CONDUCTUALES: (Lista de soft skills relevantes para este puesto)

Formato de respuesta: Proporciona cada sección claramente separada y con contenido específico para el puesto solicitado. Evita generalidades y sé específico según el tipo de trabajo.
`;

      // LLamada al Backend (Netlify Function) en lugar de API directa
      const response = await fetch('/.netlify/functions/chat-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'profile_generation',
          consulta: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de OpenAI: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const contenidoGenerado = data.resultado;

      // Parsear la respuesta para extraer cada sección
      const sugerencias = parsearRespuestaIA(contenidoGenerado);

      return sugerencias;

    } catch (error) {
      console.error('Error al generar sugerencias con IA:', error);
      throw error;
    } finally {
      setLoadingIA(false);
    }
  };

  // Función para parsear la respuesta de la IA y extraer cada campo
  const parsearRespuestaIA = (contenido) => {
    const sugerencias = {
      misionObjetivo: '',
      contribucionEstrategica: '',
      funcionesPrincipales: '',
      funcionesPeriodicas: '',
      indicadoresKPI: '',
      formacionAcademica: '',
      experienciaLaboral: '',
      habilidadesTecnicas: '',
      competenciasConductuales: ''
    };

    try {
      // Patrones para extraer cada sección
      const patrones = {
        misionObjetivo: /(?:1\.\s*MISIÓN\/OBJETIVO PRINCIPAL|MISIÓN\/OBJETIVO)[:\s]*(.*?)(?=\n\s*2\.|$)/is,
        contribucionEstrategica: /(?:2\.\s*CONTRIBUCIÓN ESTRATÉGICA|CONTRIBUCIÓN ESTRATÉGICA)[:\s]*(.*?)(?=\n\s*3\.|$)/is,
        funcionesPrincipales: /(?:3\.\s*FUNCIONES PRINCIPALES|FUNCIONES PRINCIPALES)[:\s]*(.*?)(?=\n\s*4\.|$)/is,
        funcionesPeriodicas: /(?:4\.\s*FUNCIONES PERIÓDICAS|FUNCIONES PERIÓDICAS)[:\s]*(.*?)(?=\n\s*5\.|$)/is,
        indicadoresKPI: /(?:5\.\s*INDICADORES KPI|INDICADORES KPI)[:\s]*(.*?)(?=\n\s*6\.|$)/is,
        formacionAcademica: /(?:6\.\s*FORMACIÓN ACADÉMICA|FORMACIÓN ACADÉMICA)[:\s]*(.*?)(?=\n\s*7\.|$)/is,
        experienciaLaboral: /(?:7\.\s*EXPERIENCIA LABORAL|EXPERIENCIA LABORAL)[:\s]*(.*?)(?=\n\s*8\.|$)/is,
        habilidadesTecnicas: /(?:8\.\s*HABILIDADES TÉCNICAS|HABILIDADES TÉCNICAS)[:\s]*(.*?)(?=\n\s*9\.|$)/is,
        competenciasConductuales: /(?:9\.\s*COMPETENCIAS CONDUCTUALES|COMPETENCIAS CONDUCTUALES)[:\s]*(.*?)$/is
      };

      // Extraer cada campo usando los patrones
      Object.keys(patrones).forEach(campo => {
        const match = contenido.match(patrones[campo]);
        if (match && match[1]) {
          sugerencias[campo] = match[1].trim().replace(/^\n+|\n+$/g, '');
        }
      });

      // Si no se pudieron extraer con patrones, intentar división simple
      if (!sugerencias.misionObjetivo) {
        const lineas = contenido.split('\n').filter(linea => linea.trim());
        let seccionActual = '';

        lineas.forEach(linea => {
          const lineaLimpia = linea.trim();

          if (lineaLimpia.includes('MISIÓN') || lineaLimpia.includes('OBJETIVO PRINCIPAL')) {
            seccionActual = 'misionObjetivo';
          } else if (lineaLimpia.includes('CONTRIBUCIÓN ESTRATÉGICA')) {
            seccionActual = 'contribucionEstrategica';
          } else if (lineaLimpia.includes('FUNCIONES PRINCIPALES')) {
            seccionActual = 'funcionesPrincipales';
          } else if (lineaLimpia.includes('FUNCIONES PERIÓDICAS')) {
            seccionActual = 'funcionesPeriodicas';
          } else if (lineaLimpia.includes('INDICADORES') || lineaLimpia.includes('KPI')) {
            seccionActual = 'indicadoresKPI';
          } else if (lineaLimpia.includes('FORMACIÓN ACADÉMICA')) {
            seccionActual = 'formacionAcademica';
          } else if (lineaLimpia.includes('EXPERIENCIA LABORAL')) {
            seccionActual = 'experienciaLaboral';
          } else if (lineaLimpia.includes('HABILIDADES TÉCNICAS')) {
            seccionActual = 'habilidadesTecnicas';
          } else if (lineaLimpia.includes('COMPETENCIAS CONDUCTUALES')) {
            seccionActual = 'competenciasConductuales';
          } else if (seccionActual && lineaLimpia && !lineaLimpia.match(/^\d+\./)) {
            if (sugerencias[seccionActual]) {
              sugerencias[seccionActual] += '\n' + lineaLimpia;
            } else {
              sugerencias[seccionActual] = lineaLimpia;
            }
          }
        });
      }

    } catch (error) {
      console.error('Error al parsear respuesta de IA:', error);
    }

    return sugerencias;
  };

  // Función para aplicar las sugerencias de IA al formulario
  const aplicarSugerenciasIA = async () => {
    if (!formData.nombrePuesto.trim()) {
      alert('Por favor ingresa el nombre del puesto antes de generar sugerencias con IA');
      return;
    }

    try {
      const sugerencias = await generarSugerenciasConIA(formData.nombrePuesto, formData.areaDepartamento);

      // Aplicar las sugerencias al formulario
      setFormData(prev => ({
        ...prev,
        misionObjetivo: sugerencias.misionObjetivo || prev.misionObjetivo,
        contribucionEstrategica: sugerencias.contribucionEstrategica || prev.contribucionEstrategica,
        funcionesPrincipales: sugerencias.funcionesPrincipales || prev.funcionesPrincipales,
        funcionesPeriodicas: sugerencias.funcionesPeriodicas || prev.funcionesPeriodicas,
        indicadoresKPI: sugerencias.indicadoresKPI || prev.indicadoresKPI,
        formacionAcademica: sugerencias.formacionAcademica || prev.formacionAcademica,
        experienciaLaboral: sugerencias.experienciaLaboral || prev.experienciaLaboral,
        habilidadesTecnicas: sugerencias.habilidadesTecnicas || prev.habilidadesTecnicas,
        competenciasConductuales: sugerencias.competenciasConductuales || prev.competenciasConductuales
      }));

      alert('¡Sugerencias generadas exitosamente! Puedes revisar y modificar el contenido según tus necesidades.');

    } catch (error) {
      console.error('Error al generar sugerencias:', error);
      alert(`Error al generar sugerencias con IA: ${error.message}`);
    }
  };

  const cargarPerfiles = useCallback(async () => {
    try {
      if (!user) {
        setPerfiles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const q = query(
        collection(db, 'perfiles_cargo'),
        where('clienteId', '==', user.uid),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const perfilesData = [];
      querySnapshot.forEach((doc) => {
        perfilesData.push({ id: doc.id, ...doc.data() });
      });
      setPerfiles(perfilesData);
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
      alert('Error al cargar los perfiles. Revisa la consola (F12) para ver si necesitas crear un índice en Firebase.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      cargarPerfiles();
    } else {
      setLoading(false);
    }
  }, [user, cargarPerfiles]);

  useEffect(() => {
    aplicarFiltros();
  }, [perfiles, filtros]);

  const aplicarFiltros = () => {
    let perfilesFiltrados = [...perfiles];
    if (filtros.nombre) {
      perfilesFiltrados = perfilesFiltrados.filter(perfil => perfil.nombrePuesto?.toLowerCase().includes(filtros.nombre.toLowerCase()));
    }
    if (filtros.area) {
      perfilesFiltrados = perfilesFiltrados.filter(perfil => perfil.areaDepartamento?.toLowerCase().includes(filtros.area.toLowerCase()));
    }
    if (filtros.modalidad) {
      perfilesFiltrados = perfilesFiltrados.filter(perfil => perfil.ubicacionModalidad?.includes(filtros.modalidad));
    }
    if (filtros.codigo) {
      perfilesFiltrados = perfilesFiltrados.filter(perfil => perfil.codigo?.includes(filtros.codigo));
    }
    setPerfilesFiltrados(perfilesFiltrados);
  };

  const generarCodigoConsecutivo = () => {
    const year = new Date().getFullYear();
    const existingCodes = perfiles.map(p => p.codigo).filter(c => c && c.startsWith(`PC-${year}`));
    const numbers = existingCodes.map(c => {
      const match = c.match(/PC-\\d{4}-(\\d{4})/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNumber = Math.max(0, ...numbers) + 1;
    return `PC-${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const limpiarFormulario = () => {
    setFormData({
      nombrePuesto: '', areaDepartamento: '', reportaA: '', personalACargo: '', ubicacionModalidad: '', jornadaLaboral: '', misionObjetivo: '', contribucionEstrategica: '', funcionesPrincipales: '', funcionesPeriodicas: '', indicadoresKPI: '', formacionAcademica: '', experienciaLaboral: '', habilidadesTecnicas: '', competenciasConductuales: '', ambienteCondiciones: '', riesgosLaborales: [], equiposEPP: [], examenesMedicos: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Error: Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      return;
    }
    try {
      if (!formData.nombrePuesto || !formData.areaDepartamento) {
        alert('Por favor complete los campos obligatorios: Nombre del Puesto y Área/Departamento');
        return;
      }
      const perfilData = {
        ...formData,
        clienteId: user.uid,
        fechaCreacion: editingId ? perfiles.find(p => p.id === editingId)?.fechaCreacion : new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        codigo: editingId ? perfiles.find(p => p.id === editingId)?.codigo : generarCodigoConsecutivo()
      };
      if (editingId) {
        await updateDoc(doc(db, 'perfiles_cargo', editingId), perfilData);
        alert('Perfil de cargo actualizado exitosamente');
      } else {
        await addDoc(collection(db, 'perfiles_cargo'), perfilData);
        alert('Perfil de cargo creado exitosamente');
      }
      await cargarPerfiles();
      setShowForm(false);
      setEditingId(null);
      limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert('Error al guardar el perfil de cargo');
    }
  };

  const editarPerfil = (perfil) => {
    setFormData({
      nombrePuesto: perfil.nombrePuesto || '', areaDepartamento: perfil.areaDepartamento || '', reportaA: perfil.reportaA || '', personalACargo: perfil.personalACargo || '', ubicacionModalidad: perfil.ubicacionModalidad || '', jornadaLaboral: perfil.jornadaLaboral || '', misionObjetivo: perfil.misionObjetivo || '', contribucionEstrategica: perfil.contribucionEstrategica || '', funcionesPrincipales: perfil.funcionesPrincipales || '', funcionesPeriodicas: perfil.funcionesPeriodicas || '', indicadoresKPI: perfil.indicadoresKPI || '', formacionAcademica: perfil.formacionAcademica || '', experienciaLaboral: perfil.experienciaLaboral || '', habilidadesTecnicas: perfil.habilidadesTecnicas || '', competenciasConductuales: perfil.competenciasConductuales || '', ambienteCondiciones: perfil.ambienteCondiciones || '', riesgosLaborales: perfil.riesgosLaborales || [], equiposEPP: perfil.equiposEPP || [], examenesMedicos: perfil.examenesMedicos || []
    });
    setEditingId(perfil.id);
    setShowForm(true);
  };

  const eliminarPerfil = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este perfil de cargo?')) {
      try {
        await deleteDoc(doc(db, 'perfiles_cargo', id));
        alert('Perfil de cargo eliminado exitosamente');
        await cargarPerfiles();
      } catch (error) {
        console.error('Error al eliminar perfil:', error);
        alert('Error al eliminar el perfil de cargo');
      }
    }
  };

  const verPerfil = (perfil) => {
    setPerfilSeleccionado(perfil);
    setShowView(true);
  };

  const limpiarFiltros = () => {
    setFiltros({ nombre: '', area: '', modalidad: '', codigo: '' });
  };

  const exportarExcel = () => {
    const datosExport = perfilesFiltrados.map(perfil => ({
      'Código': perfil.codigo, 'Nombre del Puesto': perfil.nombrePuesto, 'Área/Departamento': perfil.areaDepartamento, 'Reporta a': perfil.reportaA, 'Personal a Cargo': perfil.personalACargo, 'Ubicación y Modalidad': perfil.ubicacionModalidad, 'Jornada Laboral': perfil.jornadaLaboral, 'Misión/Objetivo': perfil.misionObjetivo, 'Contribución Estratégica': perfil.contribucionEstrategica, 'Funciones Principales': perfil.funcionesPrincipales, 'Funciones Periódicas': perfil.funcionesPeriodicas, 'KPIs': perfil.indicadoresKPI, 'Formación Académica': perfil.formacionAcademica, 'Experiencia Laboral': perfil.experienciaLaboral, 'Habilidades Técnicas': perfil.habilidadesTecnicas, 'Competencias Conductuales': perfil.competenciasConductuales, 'Ambiente y Condiciones': perfil.ambienteCondiciones, 'Riesgos Laborales': perfil.riesgosLaborales?.join(', ') || '', 'Equipos EPP': perfil.equiposEPP?.join(', ') || '', 'Exámenes Médicos': perfil.examenesMedicos?.join(', ') || '', 'Fecha Creación': perfil.fechaCreacion ? new Date(perfil.fechaCreacion).toLocaleDateString() : '', 'Fecha Actualización': perfil.fechaActualizacion ? new Date(perfil.fechaActualizacion).toLocaleDateString() : ''
    }));
    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Perfiles de Cargo');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `perfiles_cargo_${fecha}.xlsx`);
  };

  // Función para generar PDF directamente sin abrir modal
  const generarPDFDirecto = (perfil) => {
    // Crear un elemento temporal invisible con el contenido del perfil
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-perfil-pdf';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    // Generar el HTML del perfil
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
        <div style="text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin-bottom: 10px;">PERFIL DE CARGO</h1>
          <h2 style="color: #333; margin-bottom: 15px;">${perfil.nombrePuesto || 'N/A'}</h2>
          <p><strong>Código:</strong> ${perfil.codigo || 'N/A'}</p>
          <p><strong>Fecha de creación:</strong> ${perfil.fechaCreacion ? new Date(perfil.fechaCreacion).toLocaleDateString() : 'N/A'}</p>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
          <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px;">1️⃣ Identificación del Cargo</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Nombre del Puesto:</strong> ${perfil.nombrePuesto || 'N/A'}</div>
            <div><strong>Área/Departamento:</strong> ${perfil.areaDepartamento || 'N/A'}</div>
            <div><strong>Reporta a:</strong> ${perfil.reportaA || 'N/A'}</div>
            <div><strong>Personal a Cargo:</strong> ${perfil.personalACargo || 'N/A'}</div>
            <div><strong>Modalidad:</strong> <span style="background: #0dcaf0; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${perfil.ubicacionModalidad || 'N/A'}</span></div>
            <div><strong>Jornada Laboral:</strong> ${perfil.jornadaLaboral || 'N/A'}</div>
          </div>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
          <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px;">2️⃣ Propósito y Contribución</h3>
          <div style="margin-bottom: 15px;">
            <strong>Misión/Objetivo:</strong>
            <p style="margin: 5px 0; line-height: 1.5;">${perfil.misionObjetivo || 'N/A'}</p>
          </div>
          <div>
            <strong>Contribución Estratégica:</strong>
            <p style="margin: 5px 0; line-height: 1.5;">${perfil.contribucionEstrategica || 'N/A'}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
          <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px;">3️⃣ Funciones y Responsabilidades</h3>
          <div style="margin-bottom: 15px;">
            <strong>Funciones Principales:</strong>
            <p style="margin: 5px 0; line-height: 1.5;">${perfil.funcionesPrincipales || 'N/A'}</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Funciones Periódicas:</strong>
            <p style="margin: 5px 0; line-height: 1.5;">${perfil.funcionesPeriodicas || 'N/A'}</p>
          </div>
          <div>
            <strong>KPIs:</strong>
            <p style="margin: 5px 0; line-height: 1.5;">${perfil.indicadoresKPI || 'N/A'}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
          <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px;">4️⃣ Perfil Requerido</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <strong>Formación Académica:</strong>
              <p style="margin: 5px 0; line-height: 1.5;">${perfil.formacionAcademica || 'N/A'}</p>
            </div>
            <div>
              <strong>Experiencia Laboral:</strong>
              <p style="margin: 5px 0; line-height: 1.5;">${perfil.experienciaLaboral || 'N/A'}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Habilidades Técnicas:</strong>
              <p style="margin: 5px 0; line-height: 1.5;">${perfil.habilidadesTecnicas || 'N/A'}</p>
            </div>
            <div>
              <strong>Competencias Conductuales:</strong>
              <p style="margin: 5px 0; line-height: 1.5;">${perfil.competenciasConductuales || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
          <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px;">5️⃣ Condiciones de Trabajo y Riesgos</h3>
          <div style="margin-bottom: 15px;">
            <strong>Ambiente y Condiciones:</strong>
            <p style="margin: 5px 0; line-height: 1.5;">${perfil.ambienteCondiciones || 'N/A'}</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Riesgos Laborales:</strong>
              <div style="margin-top: 8px;">
                ${perfil.riesgosLaborales?.length > 0 ?
        perfil.riesgosLaborales.map(riesgo =>
          `<span style="background: #ffc107; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${riesgo}</span>`
        ).join('') : 'N/A'
      }
              </div>
            </div>
            <div>
              <strong>EPP Requeridos:</strong>
              <div style="margin-top: 8px;">
                ${perfil.equiposEPP?.length > 0 ?
        perfil.equiposEPP.map(epp =>
          `<span style="background: #198754; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${epp}</span>`
        ).join('') : 'N/A'
      }
              </div>
            </div>
          </div>
        </div>

        ${perfil.examenesMedicos?.length > 0 ? `
          <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
            <h3 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px;">6️⃣ Exámenes Médicos Sugeridos</h3>
            <div>
              ${perfil.examenesMedicos.map(examen =>
        `<span style="background: #0dcaf0; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${examen}</span>`
      ).join('')}
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 20px;">
          <p>Documento generado automáticamente el ${new Date().toLocaleDateString()}</p>
          <p>Sistema de Gestión de Perfiles de Cargo</p>
        </div>
      </div>
    `;

    // Agregar el elemento temporal al DOM
    document.body.appendChild(tempDiv);

    // Generar el PDF
    html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      // Remover el elemento temporal
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      // Calcular dimensiones manteniendo la proporción
      const width = pdfWidth - 20; // Margen de 10mm a cada lado
      const height = width / ratio;

      let position = 0;
      let heightLeft = height;

      // Agregar la primera página
      pdf.addImage(imgData, 'PNG', 10, 10, width, height);
      heightLeft -= (pdfHeight - 20);

      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - height;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, width, height);
        heightLeft -= (pdfHeight - 20);
      }

      // Descargar el PDF
      pdf.save(`perfil_cargo_${perfil.nombrePuesto.replace(/ /g, '_')}.pdf`);
    }).catch(error => {
      // Remover el elemento temporal en caso de error
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    });
  };

  const generarPDF = () => {
    const input = document.getElementById('perfil-a-pdf');
    if (!input) {
      console.error("El elemento 'perfil-a-pdf' no fue encontrado.");
      alert("Error: No se pudo encontrar el contenido para generar el PDF.");
      return;
    }

    // Guardar el estado original del modal
    const modalBody = input.closest('.modal-body');
    const originalOverflow = modalBody ? modalBody.style.overflow : '';
    const originalMaxHeight = modalBody ? modalBody.style.maxHeight : '';
    const originalHeight = modalBody ? modalBody.style.height : '';

    // Temporalmente remover las restricciones de scroll para capturar todo el contenido
    if (modalBody) {
      modalBody.style.overflow = 'visible';
      modalBody.style.maxHeight = 'none';
      modalBody.style.height = 'auto';
    }

    // Esperar un momento para que se apliquen los cambios de estilo
    setTimeout(() => {
      html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: input.scrollHeight, // Capturar toda la altura del contenido
        width: input.scrollWidth,   // Capturar todo el ancho del contenido
        scrollX: 0,
        scrollY: 0
      }).then(canvas => {
        // Restaurar el estado original del modal
        if (modalBody) {
          modalBody.style.overflow = originalOverflow;
          modalBody.style.maxHeight = originalMaxHeight;
          modalBody.style.height = originalHeight;
        }

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        // Calcular dimensiones manteniendo la proporción
        const width = pdfWidth - 20; // Margen de 10mm a cada lado
        const height = width / ratio;

        let position = 0;
        let heightLeft = height;

        // Agregar la primera página
        pdf.addImage(imgData, 'PNG', 10, 10, width, height);
        heightLeft -= (pdfHeight - 20);

        // Agregar páginas adicionales si es necesario
        while (heightLeft > 0) {
          position = heightLeft - height;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, width, height);
          heightLeft -= (pdfHeight - 20);
        }

        // Descargar el PDF
        pdf.save(`perfil_cargo_${perfilSeleccionado.nombrePuesto.replace(/ /g, '_')}.pdf`);
      }).catch(error => {
        // Restaurar el estado original en caso de error
        if (modalBody) {
          modalBody.style.overflow = originalOverflow;
          modalBody.style.maxHeight = originalMaxHeight;
          modalBody.style.height = originalHeight;
        }
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
      });
    }, 100); // Pequeña pausa para permitir que se apliquen los cambios de CSS
  };

  const handleCheckboxChange = (value, field) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(item => item !== value) : [...prev[field], value] }));
  };

  const generarSugerenciasExamenes = () => {
    let sugerencias = ['Examen médico general'];
    if (formData.riesgosLaborales.includes('Ruido')) { sugerencias.push('Audiometría'); }
    if (formData.riesgosLaborales.includes('Iluminación') || formData.riesgosLaborales.includes('Radiación')) { sugerencias.push('Visiometría', 'Examen de fondo de ojo'); }
    if (formData.riesgosLaborales.includes('Polvos') || formData.riesgosLaborales.includes('Vapores') || formData.riesgosLaborales.includes('Gases')) { sugerencias.push('Espirometría', 'Radiografía de tórax'); }
    if (formData.riesgosLaborales.includes('Estrés') || formData.riesgosLaborales.includes('Carga mental')) { sugerencias.push('Valoración psicológica', 'Electrocardiograma'); }
    if (formData.riesgosLaborales.includes('Postura') || formData.riesgosLaborales.includes('Movimiento repetitivo')) { sugerencias.push('Examen osteomuscular'); }
    if (formData.riesgosLaborales.includes('Químico')) { sugerencias.push('Hemograma completo', 'Pruebas de función hepática'); }
    sugerencias = [...new Set(sugerencias)];
    setFormData(prev => ({ ...prev, examenesMedicos: sugerencias }));
    alert(`Se generaron ${sugerencias.length} sugerencias de exámenes médicos.`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style jsx>{`
        .modal-scroll-fix .modal-dialog { max-width: 95%; width: 1200px; margin: 1rem auto; }
        .modal-scroll-fix .modal-content { max-height: 90vh; display: flex; flex-direction: column; }
        .modal-scroll-fix .modal-header { flex-shrink: 0; border-bottom: 1px solid #dee2e6; padding: 1rem 1.5rem; }
        .modal-scroll-fix .modal-body { flex: 1 1 auto; overflow-y: auto; padding: 1.5rem; max-height: calc(90vh - 120px); }
        .modal-scroll-fix .modal-footer { flex-shrink: 0; border-top: 1px solid #dee2e6; padding: 1rem 1.5rem; }
        .modal-scroll-fix .modal-body::-webkit-scrollbar { width: 8px; }
        .modal-scroll-fix .modal-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .modal-scroll-fix .modal-body::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .modal-scroll-fix .modal-body::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .form-section { margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa; }
        .form-section h4 { color: #007bff; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #007bff; }
        .checkbox-group { max-height: 200px; overflow-y: auto; border: 1px solid #ced4da; border-radius: 4px; padding: 0.5rem; background-color: white; }
        .checkbox-category { font-weight: bold; color: #495057; margin: 0.5rem 0 0.25rem 0; padding: 0.25rem 0; border-bottom: 1px solid #dee2e6; }
        .ai-button { background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); border: none; color: white; }
        .ai-button:hover { background: linear-gradient(45deg, #5a6fd8 0%, #6a4190 100%); color: white; }
        .ai-loading { opacity: 0.7; pointer-events: none; }
        @media (max-width: 768px) {
          .modal-scroll-fix .modal-dialog { max-width: 98%; margin: 0.5rem auto; }
          .modal-scroll-fix .modal-content { max-height: 95vh; }
          .modal-scroll-fix .modal-body { max-height: calc(95vh - 120px); padding: 1rem; }
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">📋 Gestión de Perfiles de Cargo</h2>
        <div>
          <button
            className="btn btn-success me-2"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              limpiarFormulario();
            }}
          >
            ➕ Nuevo Perfil
          </button>
          <button
            className="btn btn-outline-success"
            onClick={exportarExcel}
            disabled={perfilesFiltrados.length === 0}
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🔍 Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Nombre del Puesto</label>
              <input
                type="text"
                className="form-control"
                value={filtros.nombre}
                onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
                placeholder="Buscar por nombre..."
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Área/Departamento</label>
              <input
                type="text"
                className="form-control"
                value={filtros.area}
                onChange={(e) => setFiltros({ ...filtros, area: e.target.value })}
                placeholder="Buscar por área..."
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Modalidad</label>
              <select
                className="form-select"
                value={filtros.modalidad}
                onChange={(e) => setFiltros({ ...filtros, modalidad: e.target.value })}
              >
                <option value="">Todas las modalidades</option>
                {modalidadesWork.map(modalidad => (
                  <option key={modalidad} value={modalidad}>{modalidad}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Código</label>
              <input
                type="text"
                className="form-control"
                value={filtros.codigo}
                onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
                placeholder="Buscar por código..."
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12">
              <button
                className="btn btn-outline-secondary"
                onClick={limpiarFiltros}
              >
                🗑️ Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">📋 Lista de Perfiles ({perfilesFiltrados.length} registros)</h5>
        </div>
        <div className="card-body">
          {perfilesFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No se encontraron perfiles de cargo.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Código</th>
                    <th>Nombre del Puesto</th>
                    <th>Área/Departamento</th>
                    <th>Modalidad</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {perfilesFiltrados.map(perfil => (
                    <tr key={perfil.id}>
                      <td>
                        <span className="badge bg-primary">{perfil.codigo}</span>
                      </td>
                      <td>
                        <strong>{perfil.nombrePuesto}</strong>
                      </td>
                      <td>{perfil.areaDepartamento}</td>
                      <td>
                        <span className="badge bg-info">{perfil.ubicacionModalidad}</span>
                      </td>
                      <td>
                        {perfil.fechaCreacion ? new Date(perfil.fechaCreacion).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => verPerfil(perfil)}
                            title="Ver perfil"
                          >
                            👁️
                          </button>
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => editarPerfil(perfil)}
                            title="Editar perfil"
                          >
                            ✏️
                          </button>

                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => generarPDFDirecto(perfil)}
                            title="Generar PDF"
                          >
                            📄
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarPerfil(perfil.id)}
                            title="Eliminar perfil"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal fade show modal-scroll-fix" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? '✏️ Editar Perfil de Cargo' : '➕ Nuevo Perfil de Cargo'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    limpiarFormulario();
                  }}
                ></button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h4>1️⃣ Identificación del Cargo</h4>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">1.1. Nombre del Puesto *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nombrePuesto}
                          onChange={(e) => setFormData({ ...formData, nombrePuesto: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">1.2. Área / Departamento *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.areaDepartamento}
                          onChange={(e) => setFormData({ ...formData, areaDepartamento: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <label className="form-label">1.3. Reporta a (Jefe Inmediato)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.reportaA}
                          onChange={(e) => setFormData({ ...formData, reportaA: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">1.4. Personal a Cargo</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.personalACargo}
                          onChange={(e) => setFormData({ ...formData, personalACargo: e.target.value })}
                          placeholder="Ej: 5 personas, Ninguno, etc."
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <label className="form-label">1.5. Ubicación y Modalidad</label>
                        <select
                          className="form-select"
                          value={formData.ubicacionModalidad}
                          onChange={(e) => setFormData({ ...formData, ubicacionModalidad: e.target.value })}
                        >
                          <option value="">Seleccionar modalidad...</option>
                          {modalidadesWork.map(modalidad => (
                            <option key={modalidad} value={modalidad}>{modalidad}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">1.6. Jornada Laboral</label>
                        <select
                          className="form-select"
                          value={formData.jornadaLaboral}
                          onChange={(e) => setFormData({ ...formData, jornadaLaboral: e.target.value })}
                        >
                          <option value="">Seleccionar jornada...</option>
                          {jornadasLaborales.map(jornada => (
                            <option key={jornada} value={jornada}>{jornada}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Botón de IA para generar sugerencias */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="alert alert-info">
                          <h6 className="alert-heading">🤖 Asistente de IA</h6>
                          <p className="mb-2">
                            ¿Necesitas ayuda para redactar el perfil de cargo? Nuestro asistente de IA puede generar
                            sugerencias profesionales para todos los campos basándose en el nombre del puesto.
                          </p>
                          <button
                            type="button"
                            className={`btn ai-button ${loadingIA ? 'ai-loading' : ''}`}
                            onClick={aplicarSugerenciasIA}
                            disabled={loadingIA || !formData.nombrePuesto.trim()}
                          >
                            {loadingIA ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Generando sugerencias...
                              </>
                            ) : (
                              <>
                                🤖 Generar Sugerencias con IA
                              </>
                            )}
                          </button>
                          <small className="d-block mt-2 text-muted">
                            💡 Primero ingresa el nombre del puesto y opcionalmente el área/departamento,
                            luego haz clic para generar sugerencias que podrás revisar y modificar.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>2️⃣ Propósito y Contribución</h4>
                    <div className="mb-3">
                      <label className="form-label">2.1. Misión u Objetivo Principal del Puesto</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.misionObjetivo}
                        onChange={(e) => setFormData({ ...formData, misionObjetivo: e.target.value })}
                        placeholder="Describe el propósito principal del puesto..."
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">2.2. Contribución Estratégica</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.contribucionEstrategica}
                        onChange={(e) => setFormData({ ...formData, contribucionEstrategica: e.target.value })}
                        placeholder="¿Cómo contribuye este puesto a los objetivos organizacionales?"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>3️⃣ Funciones y Responsabilidades</h4>
                    <div className="mb-3">
                      <label className="form-label">3.1. Funciones Principales (Diarias/Semanales)</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={formData.funcionesPrincipales}
                        onChange={(e) => setFormData({ ...formData, funcionesPrincipales: e.target.value })}
                        placeholder="Lista las actividades principales que realiza diaria o semanalmente..."
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">3.2. Funciones Periódicas (Mensuales/Trimestrales)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.funcionesPeriodicas}
                        onChange={(e) => setFormData({ ...formData, funcionesPeriodicas: e.target.value })}
                        placeholder="Actividades que se realizan mensual, trimestral o anualmente..."
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">3.3. Indicadores Clave de Desempeño (KPIs)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.indicadoresKPI}
                        onChange={(e) => setFormData({ ...formData, indicadoresKPI: e.target.value })}
                        placeholder="¿Cómo se mide el desempeño en este puesto?"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>4️⃣ Perfil Requerido</h4>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">4.1. Formación Académica</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.formacionAcademica}
                          onChange={(e) => setFormData({ ...formData, formacionAcademica: e.target.value })}
                          placeholder="Nivel educativo mínimo, carreras, especializaciones..."
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">4.2. Experiencia Laboral</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.experienciaLaboral}
                          onChange={(e) => setFormData({ ...formData, experienciaLaboral: e.target.value })}
                          placeholder="Años de experiencia, áreas específicas..."
                        ></textarea>
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-6">
                        <label className="form-label">4.3. Habilidades Técnicas (Hard Skills)</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={formData.habilidadesTecnicas}
                          onChange={(e) => setFormData({ ...formData, habilidadesTecnicas: e.target.value })}
                          placeholder="Software, herramientas, certificaciones, idiomas..."
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">4.4. Competencias Conductuales (Soft Skills)</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={formData.competenciasConductuales}
                          onChange={(e) => setFormData({ ...formData, competenciasConductuales: e.target.value })}
                          placeholder="Liderazgo, comunicación, trabajo en equipo, adaptabilidad..."
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>5️⃣ Condiciones de Trabajo y Riesgos</h4>
                    <div className="mb-3">
                      <label className="form-label">5.1. Ambiente y Condiciones de Trabajo</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.ambienteCondiciones}
                        onChange={(e) => setFormData({ ...formData, ambienteCondiciones: e.target.value })}
                        placeholder="Describe el ambiente físico de trabajo, condiciones especiales..."
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">5.2. Riesgos Laborales (GTC 45)</label>
                        <div className="checkbox-group">
                          {riesgosDisponibles.map((categoria) => (
                            <div key={categoria.categoria}>
                              <div className="checkbox-category">{categoria.categoria}</div>
                              {categoria.opciones.map((riesgo) => (
                                <div className="form-check" key={riesgo}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={formData.riesgosLaborales.includes(riesgo)}
                                    onChange={() => handleCheckboxChange(riesgo, 'riesgosLaborales')}
                                  />
                                  <label className="form-check-label">{riesgo}</label>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">5.3. Equipos de Protección Personal (EPP)</label>
                        <div className="checkbox-group">
                          {eppDisponibles.map((zona) => (
                            <div key={zona.zona}>
                              <div className="checkbox-category">{zona.zona}</div>
                              {zona.opciones.map((epp) => (
                                <div className="form-check" key={epp}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={formData.equiposEPP.includes(epp)}
                                    onChange={() => handleCheckboxChange(epp, 'equiposEPP')}
                                  />
                                  <label className="form-check-label">{epp}</label>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>6️⃣ Exámenes Médicos Sugeridos por IA</h4>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label">6.1. Exámenes Médicos Ocupacionales</label>
                        <button
                          type="button"
                          className="btn btn-info btn-sm"
                          onClick={generarSugerenciasExamenes}
                        >
                          🤖 Generar Sugerencias con IA
                        </button>
                      </div>
                      <div className="checkbox-group">
                        {examenesMedicosDisponibles.map((examen) => (
                          <div className="form-check" key={examen}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={formData.examenesMedicos.includes(examen)}
                              onChange={() => handleCheckboxChange(examen, 'examenesMedicos')}
                            />
                            <label className="form-check-label">{examen}</label>
                          </div>
                        ))}
                      </div>
                      <small className="form-text text-muted">
                        💡 Selecciona primero los riesgos laborales y haz clic en "Generar Sugerencias con IA"
                        para obtener recomendaciones automáticas de exámenes médicos.
                      </small>
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    limpiarFormulario();
                  }}
                >
                  ❌ Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  {editingId ? '💾 Actualizar' : '💾 Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showView && perfilSeleccionado && (
        <div className="modal fade show modal-scroll-fix" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  👁️ Ver Perfil de Cargo - {perfilSeleccionado.nombrePuesto}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowView(false);
                    setPerfilSeleccionado(null);
                  }}
                ></button>
              </div>

              <div className="modal-body" id="perfil-a-pdf">
                <div className="form-section">
                  <h4>1️⃣ Identificación del Cargo</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Código:</strong> <span className="badge bg-primary">{perfilSeleccionado.codigo}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Fecha de creación:</strong> {new Date(perfilSeleccionado.fechaCreacion).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <strong>Nombre del Puesto:</strong> {perfilSeleccionado.nombrePuesto || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Área/Departamento:</strong> {perfilSeleccionado.areaDepartamento || 'N/A'}
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-6">
                      <strong>Reporta a:</strong> {perfilSeleccionado.reportaA || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Personal a Cargo:</strong> {perfilSeleccionado.personalACargo || 'N/A'}
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-6">
                      <strong>Modalidad:</strong> <span className="badge bg-info">{perfilSeleccionado.ubicacionModalidad || 'N/A'}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Jornada Laboral:</strong> {perfilSeleccionado.jornadaLaboral || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>2️⃣ Propósito y Contribución</h4>
                  <div className="mb-3">
                    <strong>Misión/Objetivo:</strong>
                    <p>{perfilSeleccionado.misionObjetivo || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Contribución Estratégica:</strong>
                    <p>{perfilSeleccionado.contribucionEstrategica || 'N/A'}</p>
                  </div>
                </div>

                <div className="form-section">
                  <h4>3️⃣ Funciones y Responsabilidades</h4>
                  <div className="mb-3">
                    <strong>Funciones Principales:</strong>
                    <p>{perfilSeleccionado.funcionesPrincipales || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>Funciones Periódicas:</strong>
                    <p>{perfilSeleccionado.funcionesPeriodicas || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <strong>KPIs:</strong>
                    <p>{perfilSeleccionado.indicadoresKPI || 'N/A'}</p>
                  </div>
                </div>

                <div className="form-section">
                  <h4>4️⃣ Perfil Requerido</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Formación Académica:</strong>
                      <p>{perfilSeleccionado.formacionAcademica || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <strong>Experiencia Laboral:</strong>
                      <p>{perfilSeleccionado.experienciaLaboral || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Habilidades Técnicas:</strong>
                      <p>{perfilSeleccionado.habilidadesTecnicas || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <strong>Competencias Conductuales:</strong>
                      <p>{perfilSeleccionado.competenciasConductuales || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>5️⃣ Condiciones de Trabajo y Riesgos</h4>
                  <div className="mb-3">
                    <strong>Ambiente y Condiciones:</strong>
                    <p>{perfilSeleccionado.ambienteCondiciones || 'N/A'}</p>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Riesgos Laborales:</strong>
                      <div className="mt-2">
                        {perfilSeleccionado.riesgosLaborales?.length > 0 ?
                          perfilSeleccionado.riesgosLaborales.map(riesgo => (
                            <span key={riesgo} className="badge bg-warning me-1 mb-1">{riesgo}</span>
                          )) : 'N/A'
                        }
                      </div>
                    </div>
                    <div className="col-md-6">
                      <strong>EPP Requeridos:</strong>
                      <div className="mt-2">
                        {perfilSeleccionado.equiposEPP?.length > 0 ?
                          perfilSeleccionado.equiposEPP.map(epp => (
                            <span key={epp} className="badge bg-success me-1 mb-1">{epp}</span>
                          )) : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {perfilSeleccionado.examenesMedicos?.length > 0 && (
                  <div className="form-section">
                    <h4>6️⃣ Exámenes Médicos Sugeridos</h4>
                    <div className="mt-2">
                      {perfilSeleccionado.examenesMedicos.map(examen => (
                        <span key={examen} className="badge bg-info me-1 mb-1">{examen}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowView(false);
                    setPerfilSeleccionado(null);
                  }}
                >
                  ❌ Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    setShowView(false);
                    editarPerfil(perfilSeleccionado);
                  }}
                >
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={generarPDF}
                >
                  📄 Generar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showForm || showView) && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default PerfilesCargo;