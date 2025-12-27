import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import DashboardSalud from './DashboardSalud';

const EncuestasSaludCliente = () => {
  // Estados principales
  const [activeView, setActiveView] = useState('gestion');
  const [encuestas, setEncuestas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);

  // Estados para crear encuesta
  const [newEncuesta, setNewEncuesta] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    trabajadoresSeleccionados: []
  });

  // Estados para filtros y búsqueda
  const [filtros, setFiltros] = useState({
    busqueda: '',
    cargo: '',
    area: ''
  });

  // Obtener ID del cliente actual
  const getCurrentClientId = () => {
    return auth.currentUser?.uid;
  };

  // Función para obtener el número de identificación del trabajador
  const obtenerNumeroIdentificacion = (trabajador) => {
    return trabajador.numeroDocumento || trabajador.numero || trabajador.cedula || 'Sin número';
  };

  // Función para obtener el nombre completo del trabajador
  const obtenerNombreCompleto = (trabajador) => {
    const nombres = trabajador.nombres || '';
    const apellidos = trabajador.apellidos || '';
    return `${nombres} ${apellidos}`.trim() || 'Sin nombre';
  };

  // Cargar trabajadores del cliente
  useEffect(() => {
    const loadTrabajadores = async () => {
      try {
        const clienteId = getCurrentClientId();
        if (!clienteId) {
          setError('Usuario no autenticado');
          return;
        }

        console.log('🔍 Cargando trabajadores para cliente:', clienteId);

        const trabajadoresQuery = query(
          collection(db, 'trabajadores'),
          where('clienteId', '==', clienteId)
        );

        const snapshot = await getDocs(trabajadoresQuery);
        const trabajadoresData = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('👤 Trabajador cargado:', {
            id: data.id,
            nombre: obtenerNombreCompleto(data),
            identificacion: obtenerNumeroIdentificacion(data),
            cargo: data.cargo,
            area: data.area
          });
          return data;
        });

        setTrabajadores(trabajadoresData);
        console.log(`✅ ${trabajadoresData.length} trabajadores cargados`);
      } catch (error) {
        console.error('❌ Error cargando trabajadores:', error);
        setError('Error al cargar trabajadores: ' + error.message);
      }
    };

    loadTrabajadores();
  }, []);

  // Cargar encuestas con índice
  useEffect(() => {
    const clienteId = getCurrentClientId();
    if (!clienteId) {
      setLoading(false);
      return;
    }

    const encuestasQuery = query(
      collection(db, 'encuestas_salud'),
      where('clienteId', '==', clienteId),
      orderBy('fechaCreacion', 'desc')
    );

    const unsubscribe = onSnapshot(encuestasQuery, (snapshot) => {
      const encuestasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEncuestas(encuestasData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error cargando encuestas:', error);
      setError('Error al cargar encuestas: ' + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cargar respuestas para calcular progreso
  useEffect(() => {
    const loadRespuestas = async () => {
      try {
        const clienteId = getCurrentClientId();
        if (!clienteId) return;

        const respuestasQuery = query(
          collection(db, 'respuestas_encuestas'),
          where('clienteId', '==', clienteId)
        );

        const snapshot = await getDocs(respuestasQuery);
        const respuestasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('📊 Respuestas cargadas:', respuestasData.length);
        console.log('📊 Datos de respuestas:', respuestasData);
        setRespuestas(respuestasData);
      } catch (error) {
        console.error('❌ Error cargando respuestas:', error);
      }
    };

    loadRespuestas();
  }, [encuestas]);

  // Filtrar trabajadores según criterios de búsqueda
  const trabajadoresFiltrados = trabajadores.filter(trabajador => {
    const nombreCompleto = obtenerNombreCompleto(trabajador).toLowerCase();
    const numeroId = obtenerNumeroIdentificacion(trabajador).toLowerCase();
    const cargo = (trabajador.cargo || '').toLowerCase();
    const area = (trabajador.area || '').toLowerCase();
    const busqueda = filtros.busqueda.toLowerCase();

    const coincideBusqueda = !busqueda ||
      nombreCompleto.includes(busqueda) ||
      numeroId.includes(busqueda) ||
      cargo.includes(busqueda) ||
      area.includes(busqueda);

    const coincideCargo = !filtros.cargo || cargo.includes(filtros.cargo.toLowerCase());
    const coincideArea = !filtros.area || area.includes(filtros.area.toLowerCase());

    return coincideBusqueda && coincideCargo && coincideArea;
  });

  // Obtener listas únicas para filtros
  const cargosUnicos = [...new Set(trabajadores.map(t => t.cargo).filter(Boolean))];
  const areasUnicas = [...new Set(trabajadores.map(t => t.area).filter(Boolean))];

  // Calcular progreso de encuesta
  const calcularProgreso = (encuestaId, totalTrabajadores) => {
    const respuestasEncuesta = respuestas.filter(r => r.encuestaId === encuestaId);
    const completadas = respuestasEncuesta.filter(r => r.estado === 'completada').length;
    return totalTrabajadores > 0 ? Math.round((completadas / totalTrabajadores) * 100) : 0;
  };

  // Crear nueva encuesta
  const handleCreateEncuesta = async () => {
    try {
      const clienteId = getCurrentClientId();
      if (!clienteId) {
        setError('Usuario no autenticado');
        return;
      }

      if (!newEncuesta.titulo || !newEncuesta.fechaInicio || !newEncuesta.fechaFin) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }

      if (newEncuesta.trabajadoresSeleccionados.length === 0) {
        setError('Debes seleccionar al menos un trabajador');
        return;
      }

      const encuestaData = {
        titulo: newEncuesta.titulo,
        descripcion: newEncuesta.descripcion || '',
        fechaInicio: newEncuesta.fechaInicio,
        fechaFin: newEncuesta.fechaFin,
        trabajadoresSeleccionados: newEncuesta.trabajadoresSeleccionados,
        clienteId: clienteId,
        fechaCreacion: new Date(),
        estado: 'activa',
        configuracion: {
          preguntasIncluidas: Array.from({ length: 90 }, (_, i) => i + 1),
          requiereAprobacion: false
        },
        estadisticas: {
          totalTrabajadores: newEncuesta.trabajadoresSeleccionados.length,
          respuestasCompletadas: 0,
          porcentajeCompletado: 0
        }
      };

      await addDoc(collection(db, 'encuestas_salud'), encuestaData);

      // Resetear formulario
      setNewEncuesta({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        trabajadoresSeleccionados: []
      });

      setError(null);
      setActiveView('gestion');

      console.log('✅ Encuesta creada exitosamente');

    } catch (error) {
      console.error('❌ Error creando encuesta:', error);
      setError('Error al crear la encuesta: ' + error.message);
    }
  };

  // NUEVA FUNCIÓN: Cambiar estado de encuesta (activar/desactivar)
  const handleToggleEstadoEncuesta = async (encuestaId, estadoActual) => {
    const nuevoEstado = estadoActual === 'activa' ? 'inactiva' : 'activa';
    const accion = nuevoEstado === 'activa' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que deseas ${accion} esta encuesta?`)) {
      return;
    }

    try {
      const clienteId = getCurrentClientId();
      if (!clienteId) {
        setError('Usuario no autenticado');
        return;
      }

      // Verificar que la encuesta pertenece al cliente
      const encuesta = encuestas.find(e => e.id === encuestaId);
      if (!encuesta || encuesta.clienteId !== clienteId) {
        setError('No tienes permisos para modificar esta encuesta');
        return;
      }

      await updateDoc(doc(db, 'encuestas_salud', encuestaId), {
        estado: nuevoEstado,
        fechaModificacion: new Date()
      });

      setError(null);
      console.log(`✅ Encuesta ${accion}da exitosamente`);

    } catch (error) {
      console.error(`❌ Error ${accion}ndo encuesta:`, error);
      setError(`Error al ${accion} la encuesta: ` + error.message);
    }
  };

  // Eliminar encuesta
  const handleDeleteEncuesta = async (encuestaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta encuesta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const clienteId = getCurrentClientId();
      if (!clienteId) {
        setError('Usuario no autenticado');
        return;
      }

      // Verificar que la encuesta pertenece al cliente
      const encuesta = encuestas.find(e => e.id === encuestaId);
      if (!encuesta || encuesta.clienteId !== clienteId) {
        setError('No tienes permisos para eliminar esta encuesta');
        return;
      }

      await deleteDoc(doc(db, 'encuestas_salud', encuestaId));

      // También eliminar respuestas asociadas
      const respuestasQuery = query(
        collection(db, 'respuestas_encuestas'),
        where('encuestaId', '==', encuestaId),
        where('clienteId', '==', clienteId)
      );
      const respuestasSnapshot = await getDocs(respuestasQuery);

      const deletePromises = respuestasSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      setError(null);
      console.log('✅ Encuesta eliminada exitosamente');

    } catch (error) {
      console.error('❌ Error eliminando encuesta:', error);
      setError('Error al eliminar la encuesta: ' + error.message);
    }
  };

  // Ver resultados de encuesta
  const handleVerResultados = (encuesta) => {
    setSelectedEncuesta(encuesta);
    setActiveView('resultados');
  };

  // Descargar Excel de resultados con todas las preguntas
  const handleDescargarPDF = async (encuesta) => {
    try {
      // Obtener respuestas de la encuesta
      const respuestasEncuesta = respuestas.filter(r => r.encuestaId === encuesta.id);

      // Definir todas las preguntas de la encuesta de salud ocupacional (38 preguntas específicas)
      const preguntasEncuesta = [
        // I. ¿EL MÉDICO LE HA DIAGNOSTICADO ALGUNA DE LAS SIGUIENTES ENFERMEDADES O CONDICIONES?
        '1. Enfermedades del corazón?',
        '2. Enfermedades de los pulmones como asma, enfisema, bronquitis?',
        '3. Diabetes (azúcar alta en la sangre)?',
        '4. Enfermedades cerebrales como derrames, trombosis, epilepsia?',
        '5. Enfermedades de los huesos o articulaciones como artritis, gota, lupus, reumatismo, osteoporosis?',
        '6. Enfermedades de la columna vertebral como hernia de disco, compresión de raíces nerviosas, ciática, escoliosis o fractura?',
        '7. Enfermedades digestivas (colon, gastritis, otros)?',
        '8. Enfermedades de la piel?',
        '9. Alergias en vías respiratorias?',
        '10. Alteraciones auditivas?',
        '11. Alteraciones visuales?',
        '12. Hipertensión arterial o tensión alta?',
        '13. Colesterol o Triglicéridos elevados?',

        // ¿HA SENTIDO O TENIDO EN ALGÚN MOMENTO EN LOS ÚLTIMOS 6 MESES?
        '14. Dolor en el pecho o palpitaciones',
        '15. Ahogo o asfixia al caminar',
        '16. Tos persistente por más de 1 mes',
        '17. Pérdida de la conciencia, desmayos o alteración del equilibrio',

        // ¿TIENE ALGUNO DE LOS SIGUIENTES HÁBITOS O COSTUMBRES?
        '18. Fuma? (No importa la cantidad ni la frecuencia)',
        '19. Toma bebidas alcohólicas semanal o quincenalmente (no importa la cantidad)',
        '20. ¿Practica deportes de choque o de mano tipo baloncesto, voleibol, fútbol, tenis, squash, ping-pong, otros, mínimo 2 veces al mes?',
        '21. Realiza actividad física o deporte al menos 3 veces por semana?',

        // ¿EL MÉDICO LE HA DIAGNOSTICADO EN LOS ÚLTIMOS 6 MESES ALGUNA DE LAS SIGUIENTES ENFERMEDADES EN MIEMBROS SUPERIORES (BRAZOS) O INFERIORES (PIERNAS)?
        '22. Alteraciones de los músculos, tendones y ligamentos como desgarros, tendinitis, bursitis, esguinces, espasmos musculares?',
        '23. Enfermedades de los nervios (atrapamiento o inflamación de nervios periféricos)',
        '24. Fracturas',
        '25. ¿Hernias (inguinal, abdominal)?',
        '26. Várices en las piernas',

        // ¿HA SENTIDO EN LOS ÚLTIMOS 6 MESES EN MANOS, BRAZOS, PIES O PIERNAS?
        '27. Adormecimiento u hormigueo?',
        '28. Disminución de la fuerza?',
        '29. Dolor o inflamación?',

        // REFIERE ALGUNA DE LAS SIGUIENTES MOLESTIAS
        '30. Dolor o molestia en el cuello',
        '31. Dolor o molestia en los hombros',
        '32. Dolor o molestia en los codos, muñecas o manos',
        '33. Dolor o molestia en la espalda',
        '34. Dolor o molestia en la cintura',
        '35. Dolor o molestia en las rodillas, tobillos o pies',
        '36. El dolor aumenta con la actividad',
        '37. El dolor aumenta con el reposo',
        '38. El dolor es permanente'
      ];

      // Generar datos para Excel con todas las preguntas
      const trabajadoresData = encuesta.trabajadoresSeleccionados.map(trabajadorId => {
        const trabajador = trabajadores.find(t => t.id === trabajadorId);
        const respuesta = respuestasEncuesta.find(r => r.trabajadorId === trabajadorId);

        // Datos básicos del trabajador
        const datosBasicos = {
          'Identificación': trabajador ? obtenerNumeroIdentificacion(trabajador) : 'N/A',
          'Nombres': trabajador?.nombres || 'N/A',
          'Apellidos': trabajador?.apellidos || 'N/A',
          'Cargo': trabajador?.cargo || 'N/A',
          'Área': trabajador?.area || 'N/A',
          'Estado Encuesta': respuesta?.estado || 'sin_respuesta',
          'Fecha Respuesta': respuesta?.fechaRespuesta?.toDate?.()?.toLocaleDateString() || 'N/A',
          'Progreso': respuesta?.estado === 'completada' ? '100%' :
            respuesta?.estado === 'en_progreso' ? '50%' : '0%'
        };

        // Agregar respuestas a cada pregunta usando el texto completo como clave
        const respuestasPreguntas = {};
        preguntasEncuesta.forEach((pregunta, index) => {
          const numeroPregunta = index + 1;
          // Ajuste clave: Las respuestas se guardan como 'salud_1', 'salud_2', etc.
          const key = `salud_${numeroPregunta}`;
          const respuestaPregunta = respuesta?.respuestas?.[key] || respuesta?.respuestas?.[numeroPregunta] || 'No reportado';
          respuestasPreguntas[pregunta] = respuestaPregunta;
        });

        return { ...datosBasicos, ...respuestasPreguntas };
      });

      // Crear archivo Excel usando SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Información general
      const infoData = [
        ['REPORTE DE ENCUESTA DE SALUD OCUPACIONAL'],
        [''],
        ['Título', encuesta.titulo],
        ['Descripción', encuesta.descripcion || 'Sin descripción'],
        ['Período', `${encuesta.fechaInicio} - ${encuesta.fechaFin}`],
        ['Estado', encuesta.estado],
        ['Fecha de generación', new Date().toLocaleDateString()],
        [''],
        ['ESTADÍSTICAS GENERALES'],
        ['Total trabajadores asignados', encuesta.trabajadoresSeleccionados?.length || 0],
        ['Respuestas completadas', respuestasEncuesta.filter(r => r.estado === 'completada').length],
        ['Respuestas en progreso', respuestasEncuesta.filter(r => r.estado === 'en_progreso').length],
        ['Progreso total', `${calcularProgreso(encuesta.id, encuesta.trabajadoresSeleccionados?.length || 0)}%`]
      ];

      const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Información General');

      // Hoja 2: Respuestas detalladas
      const respuestasSheet = XLSX.utils.json_to_sheet(trabajadoresData);
      XLSX.utils.book_append_sheet(workbook, respuestasSheet, 'Respuestas Detalladas');

      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Crear y descargar archivo
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encuesta_${encuesta.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ Reporte Excel descargado exitosamente');

    } catch (error) {
      console.error('❌ Error descargando reporte:', error);

      // Fallback: generar CSV mejorado si falla Excel
      try {
        const respuestasEncuesta = respuestas.filter(r => r.encuestaId === encuesta.id);

        // Crear CSV con estructura mejorada
        const headers = [
          'Identificación', 'Nombres', 'Apellidos', 'Cargo', 'Área',
          'Estado Encuesta', 'Fecha Respuesta', 'Progreso'
        ];

        // Agregar columnas para cada pregunta con texto completo (38 preguntas específicas)
        const preguntasCompletas = [
          // I. ¿EL MÉDICO LE HA DIAGNOSTICADO ALGUNA DE LAS SIGUIENTES ENFERMEDADES O CONDICIONES?
          '1. Enfermedades del corazón?',
          '2. Enfermedades de los pulmones como asma, enfisema, bronquitis?',
          '3. Diabetes (azúcar alta en la sangre)?',
          '4. Enfermedades cerebrales como derrames, trombosis, epilepsia?',
          '5. Enfermedades de los huesos o articulaciones como artritis, gota, lupus, reumatismo, osteoporosis?',
          '6. Enfermedades de la columna vertebral como hernia de disco, compresión de raíces nerviosas, ciática, escoliosis o fractura?',
          '7. Enfermedades digestivas (colon, gastritis, otros)?',
          '8. Enfermedades de la piel?',
          '9. Alergias en vías respiratorias?',
          '10. Alteraciones auditivas?',
          '11. Alteraciones visuales?',
          '12. Hipertensión arterial o tensión alta?',
          '13. Colesterol o Triglicéridos elevados?',

          // ¿HA SENTIDO O TENIDO EN ALGÚN MOMENTO EN LOS ÚLTIMOS 6 MESES?
          '14. Dolor en el pecho o palpitaciones',
          '15. Ahogo o asfixia al caminar',
          '16. Tos persistente por más de 1 mes',
          '17. Pérdida de la conciencia, desmayos o alteración del equilibrio',

          // ¿TIENE ALGUNO DE LOS SIGUIENTES HÁBITOS O COSTUMBRES?
          '18. Fuma? (No importa la cantidad ni la frecuencia)',
          '19. Toma bebidas alcohólicas semanal o quincenalmente (no importa la cantidad)',
          '20. ¿Practica deportes de choque o de mano tipo baloncesto, voleibol, fútbol, tenis, squash, ping-pong, otros, mínimo 2 veces al mes?',
          '21. Realiza actividad física o deporte al menos 3 veces por semana?',

          // ¿EL MÉDICO LE HA DIAGNOSTICADO EN LOS ÚLTIMOS 6 MESES ALGUNA DE LAS SIGUIENTES ENFERMEDADES EN MIEMBROS SUPERIORES (BRAZOS) O INFERIORES (PIERNAS)?
          '22. Alteraciones de los músculos, tendones y ligamentos como desgarros, tendinitis, bursitis, esguinces, espasmos musculares?',
          '23. Enfermedades de los nervios (atrapamiento o inflamación de nervios periféricos)',
          '24. Fracturas',
          '25. ¿Hernias (inguinal, abdominal)?',
          '26. Várices en las piernas',

          // ¿HA SENTIDO EN LOS ÚLTIMOS 6 MESES EN MANOS, BRAZOS, PIES O PIERNAS?
          '27. Adormecimiento u hormigueo?',
          '28. Disminución de la fuerza?',
          '29. Dolor o inflamación?',

          // REFIERE ALGUNA DE LAS SIGUIENTES MOLESTIAS
          '30. Dolor o molestia en el cuello',
          '31. Dolor o molestia en los hombros',
          '32. Dolor o molestia en los codos, muñecas o manos',
          '33. Dolor o molestia en la espalda',
          '34. Dolor o molestia en la cintura',
          '35. Dolor o molestia en las rodillas, tobillos o pies',
          '36. El dolor aumenta con la actividad',
          '37. El dolor aumenta con el reposo',
          '38. El dolor es permanente'
        ];

        preguntasCompletas.forEach(pregunta => {
          headers.push(pregunta);
        });

        const csvData = encuesta.trabajadoresSeleccionados.map(trabajadorId => {
          const trabajador = trabajadores.find(t => t.id === trabajadorId);
          const respuesta = respuestasEncuesta.find(r => r.trabajadorId === trabajadorId);

          const row = [
            trabajador ? obtenerNumeroIdentificacion(trabajador) : 'N/A',
            trabajador?.nombres || 'N/A',
            trabajador?.apellidos || 'N/A',
            trabajador?.cargo || 'N/A',
            trabajador?.area || 'N/A',
            respuesta?.estado || 'sin_respuesta',
            respuesta?.fechaRespuesta?.toDate?.()?.toLocaleDateString() || 'N/A',
            respuesta?.estado === 'completada' ? '100%' :
              respuesta?.estado === 'en_progreso' ? '50%' : '0%'
          ];

          // Agregar respuestas a cada pregunta
          preguntasCompletas.forEach((pregunta, index) => {
            const numeroPregunta = index + 1;
            const key = `salud_${numeroPregunta}`;
            const val = respuesta?.respuestas?.[key] || respuesta?.respuestas?.[numeroPregunta] || 'Sin respuesta';
            row.push(val);
          });

          return row;
        });

        const csvContent = [headers, ...csvData]
          .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], {
          type: 'text/csv;charset=utf-8'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encuesta_${encuesta.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('✅ Reporte CSV descargado como fallback');

      } catch (fallbackError) {
        console.error('❌ Error en fallback CSV:', fallbackError);
        setError('Error al generar el reporte: ' + error.message);
      }
    }
  };

  // NUEVA FUNCIÓN: Generar enlace para compartir encuesta
  const handleGenerarEnlace = (encuesta) => {
    const clienteId = getCurrentClientId();
    const baseUrl = window.location.origin;
    const enlace = `${baseUrl}/portal-trabajadores?encuesta=${encuesta.id}&cliente=${clienteId}`;

    // Crear contenido del modal de forma más simple
    const modalContent = `
      📋 Encuesta: ${encuesta.titulo}
      📅 Período: ${encuesta.fechaInicio} - ${encuesta.fechaFin}
      👥 Trabajadores: ${encuesta.trabajadoresSeleccionados?.length || 0}
      
      🔗 Enlace para compartir:
      ${enlace}
      
      ⚠️ Instrucciones:
      • Comparte este enlace directamente con los trabajadores
      • Los trabajadores podrán acceder sin necesidad de login
      • El enlace es válido mientras la encuesta esté activa
      • Cada trabajador verá solo su formulario personalizado
    `;

    // Mostrar prompt con el enlace
    const userAction = prompt(
      `🔗 ENLACE DE LA ENCUESTA\n\n${modalContent}\n\n¿Deseas copiar el enlace al portapapeles?`,
      enlace
    );

    if (userAction !== null) {
      // Intentar copiar al portapapeles
      if (navigator.clipboard) {
        navigator.clipboard.writeText(enlace).then(() => {
          alert('✅ Enlace copiado al portapapeles');
        }).catch(() => {
          alert('❌ No se pudo copiar automáticamente. Enlace: ' + enlace);
        });
      } else {
        // Fallback: mostrar el enlace para copia manual
        alert('📋 Copia este enlace manualmente:\n\n' + enlace);
      }
    }

    console.log('🔗 Enlace generado:', enlace);
  };

  // Seleccionar/deseleccionar todos los trabajadores
  const handleSelectAllTrabajadores = (selectAll) => {
    if (selectAll) {
      setNewEncuesta(prev => ({
        ...prev,
        trabajadoresSeleccionados: trabajadoresFiltrados.map(t => t.id)
      }));
    } else {
      setNewEncuesta(prev => ({
        ...prev,
        trabajadoresSeleccionados: []
      }));
    }
  };

  // Toggle selección de trabajador individual
  const handleToggleTrabajador = (trabajadorId) => {
    setNewEncuesta(prev => ({
      ...prev,
      trabajadoresSeleccionados: prev.trabajadoresSeleccionados.includes(trabajadorId)
        ? prev.trabajadoresSeleccionados.filter(id => id !== trabajadorId)
        : [...prev.trabajadoresSeleccionados, trabajadorId]
    }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      cargo: '',
      area: ''
    });
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
      {/* Header con navegación */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            📋 Encuestas de Condiciones de Salud
          </h2>

          {/* Botones de navegación */}
          <div className="btn-group mb-3" role="group">
            <button
              type="button"
              className={`btn ${activeView === 'gestion' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveView('gestion')}
            >
              📊 Gestión de Encuestas
            </button>
            <button
              type="button"
              className={`btn ${activeView === 'nueva' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setActiveView('nueva')}
            >
              ➕ Nueva Encuesta
            </button>
            <button
              type="button"
              className={`btn ${activeView === 'dashboard' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setActiveView('dashboard')}
            >
              📈 Dashboard de Salud (IA)
            </button>
            {selectedEncuesta && (
              <button
                type="button"
                className={`btn ${activeView === 'resultados' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setActiveView('resultados')}
              >
                📋 Resultados: {selectedEncuesta.titulo}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mostrar errores */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Vista de Gestión de Encuestas */}
      {activeView === 'gestion' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📋 Encuestas Creadas ({encuestas.length})</h5>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setActiveView('nueva')}
                >
                  ➕ Crear Nueva Encuesta
                </button>
              </div>
              <div className="card-body">
                {encuestas.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="fas fa-clipboard-list fa-3x text-muted"></i>
                    </div>
                    <h5 className="text-muted">No hay encuestas creadas</h5>
                    <p className="text-muted">Crea tu primera encuesta de condiciones de salud</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveView('nueva')}
                    >
                      ➕ Crear Primera Encuesta
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Título</th>
                          <th>Descripción</th>
                          <th>Período</th>
                          <th>Trabajadores</th>
                          <th>Progreso</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {encuestas.map(encuesta => {
                          const progreso = calcularProgreso(encuesta.id, encuesta.trabajadoresSeleccionados?.length || 0);
                          return (
                            <tr key={encuesta.id}>
                              <td>
                                <strong>{encuesta.titulo}</strong>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {encuesta.descripcion || 'Sin descripción'}
                                </small>
                              </td>
                              <td>
                                <small>
                                  {encuesta.fechaInicio} - {encuesta.fechaFin}
                                </small>
                              </td>
                              <td>
                                <span className="badge bg-info">
                                  {encuesta.trabajadoresSeleccionados?.length || 0} trabajadores
                                </span>
                              </td>
                              <td>
                                <div className="progress" style={{ height: '20px', minWidth: '100px' }}>
                                  <div
                                    className={`progress-bar ${progreso === 100 ? 'bg-success' : progreso > 50 ? 'bg-warning' : 'bg-info'}`}
                                    style={{ width: `${progreso}%` }}
                                  >
                                    {progreso}%
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${encuesta.estado === 'activa' ? 'bg-success' :
                                  encuesta.estado === 'inactiva' ? 'bg-warning' :
                                    encuesta.estado === 'cerrada' ? 'bg-secondary' : 'bg-info'
                                  }`}>
                                  {encuesta.estado === 'activa' ? 'Activa' :
                                    encuesta.estado === 'inactiva' ? 'Inactiva' :
                                      encuesta.estado === 'cerrada' ? 'Cerrada' : encuesta.estado}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleVerResultados(encuesta)}
                                    title="Ver resultados"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleDescargarPDF(encuesta)}
                                    title="Descargar reporte"
                                  >
                                    📄
                                  </button>
                                  {/* BOTÓN: Generar enlace para compartir */}
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() => handleGenerarEnlace(encuesta)}
                                    title="Generar enlace para compartir"
                                  >
                                    🔗
                                  </button>
                                  {/* BOTÓN: Activar/Desactivar */}
                                  <button
                                    className={`btn ${encuesta.estado === 'activa' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                    onClick={() => handleToggleEstadoEncuesta(encuesta.id, encuesta.estado)}
                                    title={encuesta.estado === 'activa' ? 'Desactivar encuesta' : 'Activar encuesta'}
                                  >
                                    {encuesta.estado === 'activa' ? '⏸️' : '▶️'}
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteEncuesta(encuesta.id)}
                                    title="Eliminar encuesta"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Nueva Encuesta */}
      {activeView === 'nueva' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">➕ Crear Nueva Encuesta de Condiciones de Salud</h5>
              </div>
              <div className="card-body">
                <form onSubmit={(e) => { e.preventDefault(); handleCreateEncuesta(); }}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Título de la Encuesta *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newEncuesta.titulo}
                          onChange={(e) => setNewEncuesta(prev => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Ej: Encuesta Condiciones de Salud 2024"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Descripción</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newEncuesta.descripcion}
                          onChange={(e) => setNewEncuesta(prev => ({ ...prev, descripcion: e.target.value }))}
                          placeholder="Descripción opcional de la encuesta"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fecha de Inicio *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newEncuesta.fechaInicio}
                          onChange={(e) => setNewEncuesta(prev => ({ ...prev, fechaInicio: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fecha de Finalización *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newEncuesta.fechaFin}
                          onChange={(e) => setNewEncuesta(prev => ({ ...prev, fechaFin: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtros para trabajadores */}
                  <div className="mb-3">
                    <h6>🔍 Filtros de Búsqueda</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Buscar por nombre, cédula, cargo..."
                          value={filtros.busqueda}
                          onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select form-select-sm"
                          value={filtros.cargo}
                          onChange={(e) => setFiltros(prev => ({ ...prev, cargo: e.target.value }))}
                        >
                          <option value="">Todos los cargos</option>
                          {cargosUnicos.map(cargo => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select form-select-sm"
                          value={filtros.area}
                          onChange={(e) => setFiltros(prev => ({ ...prev, area: e.target.value }))}
                        >
                          <option value="">Todas las áreas</option>
                          {areasUnicas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm w-100"
                          onClick={limpiarFiltros}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Trabajadores */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label">
                        👥 Trabajadores que participarán ({newEncuesta.trabajadoresSeleccionados.length}/{trabajadoresFiltrados.length})
                        {filtros.busqueda || filtros.cargo || filtros.area ? (
                          <small className="text-muted"> - Filtrado de {trabajadores.length} total</small>
                        ) : null}
                      </label>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleSelectAllTrabajadores(true)}
                          disabled={trabajadoresFiltrados.length === 0}
                        >
                          Seleccionar Todos
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleSelectAllTrabajadores(false)}
                        >
                          Deseleccionar Todos
                        </button>
                      </div>
                    </div>

                    {trabajadores.length === 0 ? (
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        No hay trabajadores registrados. Primero debes registrar trabajadores en la sección correspondiente.
                      </div>
                    ) : trabajadoresFiltrados.length === 0 ? (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        No hay trabajadores que coincidan con los filtros aplicados.
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 ms-2"
                          onClick={limpiarFiltros}
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th width="50">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={trabajadoresFiltrados.length > 0 && trabajadoresFiltrados.every(t => newEncuesta.trabajadoresSeleccionados.includes(t.id))}
                                  onChange={(e) => handleSelectAllTrabajadores(e.target.checked)}
                                />
                              </th>
                              <th>Identificación</th>
                              <th>Nombres</th>
                              <th>Apellidos</th>
                              <th>Cargo</th>
                              <th>Área</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trabajadoresFiltrados.map(trabajador => (
                              <tr key={trabajador.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={newEncuesta.trabajadoresSeleccionados.includes(trabajador.id)}
                                    onChange={() => handleToggleTrabajador(trabajador.id)}
                                  />
                                </td>
                                <td>
                                  <strong>{obtenerNumeroIdentificacion(trabajador)}</strong>
                                </td>
                                <td>{trabajador.nombres || 'Sin nombres'}</td>
                                <td>{trabajador.apellidos || 'Sin apellidos'}</td>
                                <td>
                                  <small className="text-muted">{trabajador.cargo || 'Sin cargo'}</small>
                                </td>
                                <td>
                                  <small className="text-muted">{trabajador.area || 'Sin área'}</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveView('gestion')}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={trabajadores.length === 0 || newEncuesta.trabajadoresSeleccionados.length === 0}
                    >
                      ✅ Crear Encuesta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Resultados */}
      {activeView === 'resultados' && selectedEncuesta && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📊 Resultados: {selectedEncuesta.titulo}</h5>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => handleDescargarPDF(selectedEncuesta)}
                >
                  📄 Descargar Reporte
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <h3>{selectedEncuesta.trabajadoresSeleccionados?.length || 0}</h3>
                        <p className="mb-0">Trabajadores Asignados</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h3>{respuestas.filter(r => r.encuestaId === selectedEncuesta.id && r.estado === 'completada').length}</h3>
                        <p className="mb-0">Respuestas Completadas</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-warning text-white">
                      <div className="card-body text-center">
                        <h3>{respuestas.filter(r => r.encuestaId === selectedEncuesta.id && r.estado === 'en_progreso').length}</h3>
                        <p className="mb-0">En Progreso</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-info text-white">
                      <div className="card-body text-center">
                        <h3>{calcularProgreso(selectedEncuesta.id, selectedEncuesta.trabajadoresSeleccionados?.length || 0)}%</h3>
                        <p className="mb-0">Progreso Total</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <h6>📝 Información de la Encuesta</h6>
                  <p><strong>Descripción:</strong> {selectedEncuesta.descripcion || 'Sin descripción'}</p>
                  <p><strong>Período:</strong> {selectedEncuesta.fechaInicio} - {selectedEncuesta.fechaFin}</p>
                  <p><strong>Estado:</strong> <span className={`badge ${selectedEncuesta.estado === 'activa' ? 'bg-success' :
                    selectedEncuesta.estado === 'inactiva' ? 'bg-warning' : 'bg-secondary'
                    }`}>
                    {selectedEncuesta.estado === 'activa' ? 'Activa' :
                      selectedEncuesta.estado === 'inactiva' ? 'Inactiva' : selectedEncuesta.estado}
                  </span></p>
                </div>

                {/* Lista detallada de trabajadores y sus respuestas */}
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Identificación</th>
                        <th>Trabajador</th>
                        <th>Cargo</th>
                        <th>Estado</th>
                        <th>Fecha Respuesta</th>
                        <th>Progreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEncuesta.trabajadoresSeleccionados?.map(trabajadorId => {
                        const trabajador = trabajadores.find(t => t.id === trabajadorId);
                        const respuesta = respuestas.find(r => r.encuestaId === selectedEncuesta.id && r.trabajadorId === trabajadorId);

                        return (
                          <tr key={trabajadorId}>
                            <td>
                              <strong>{trabajador ? obtenerNumeroIdentificacion(trabajador) : 'N/A'}</strong>
                            </td>
                            <td>
                              {trabajador ? obtenerNombreCompleto(trabajador) : 'Trabajador no encontrado'}
                            </td>
                            <td>
                              <small className="text-muted">{trabajador?.cargo || 'N/A'}</small>
                            </td>
                            <td>
                              <span className={`badge ${respuesta?.estado === 'completada' ? 'bg-success' :
                                respuesta?.estado === 'en_progreso' ? 'bg-warning' : 'bg-secondary'
                                }`}>
                                {respuesta?.estado || 'sin_respuesta'}
                              </span>
                            </td>
                            <td>
                              {respuesta?.fechaRespuesta?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </td>
                            <td>
                              <div className="progress" style={{ height: '20px', minWidth: '80px' }}>
                                <div
                                  className={`progress-bar ${respuesta?.estado === 'completada' ? 'bg-success' :
                                    respuesta?.estado === 'en_progreso' ? 'bg-warning' : 'bg-secondary'
                                    }`}
                                  style={{
                                    width: respuesta?.estado === 'completada' ? '100%' :
                                      respuesta?.estado === 'en_progreso' ? '50%' : '0%'
                                  }}
                                >
                                  {respuesta?.estado === 'completada' ? '100%' :
                                    respuesta?.estado === 'en_progreso' ? '50%' : '0%'}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }) || []}
                    </tbody>
                  </table>
                </div>

                {(!selectedEncuesta.trabajadoresSeleccionados || selectedEncuesta.trabajadoresSeleccionados.length === 0) && (
                  <div className="text-center py-4">
                    <h5 className="text-muted">No hay trabajadores asignados</h5>
                    <p className="text-muted">Esta encuesta no tiene trabajadores asignados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Dashboard */}
      {activeView === 'dashboard' && (
        <DashboardSalud respuestas={respuestas} trabajadores={trabajadores} />
      )}
    </div>
  );
};

export default EncuestasSaludCliente;