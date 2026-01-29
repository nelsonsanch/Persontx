import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const NovedadesList = () => {
  const { dataScopeId } = useAuth();
  const [novedades, setNovedades] = useState([]);
  const [novedadesFiltradas, setNovedadesFiltradas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConsulta, setShowConsulta] = useState(false);
  const [showObservaciones, setShowObservaciones] = useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState('');

  // Estados para filtros - AGREGADO: cargo
  const [filtros, setFiltros] = useState({
    cedula: '',
    estado: '',
    tipoNovedad: '',
    fechaDesde: '',
    fechaHasta: '',
    cargo: '' // NUEVO FILTRO
  });

  // NUEVO: Estados para indicadores de totales
  const [totalesFiltrados, setTotalesFiltrados] = useState({
    cantidad: 0,
    tiempo: 0,
    valorTotal: 0,
    valorPagado: 0,
    valorPendiente: 0
  });

  // NUEVO: Lista de cargos únicos para el filtro
  const [listaCargos, setListaCargos] = useState([]);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const novedadesPorPagina = 10;

  // Estados para consulta
  const [cedulaConsulta, setCedulaConsulta] = useState('');
  const [novedadesConsulta, setNovedadesConsulta] = useState([]);

  // Estados para valores calculados
  const [valoresCalculados, setValoresCalculados] = useState({
    dias: 0,
    horas: 0,
    valorDiario: 0,
    valorPorHora: 0,
    valorTotal: 0,
    valorPagado: 0,
    valorPendiente: 0,
    responsable: ''
  });

  const [formData, setFormData] = useState({
    numeroDocumento: '',
    empleadoNombre: '',
    tipoNovedad: '',
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    salarioCotizacion: '',
    responsablePago: '',
    descripcion: '',
    estado: 'pendiente_por_radicar_sin_informacion',
    valorPagado: '',
    diagnosticoEnfermedad: '',
    tipoLesion: '',
    segmentoCorporal: '',
    mecanismoAccidente: '',
    estadoInvestigacion: ''
  });

  const tiposNovedad = [
    'Incapacidad Médica',
    'Incapacidad por Accidente de Trabajo',
    'Incapacidad por Enfermedad Profesional',
    'Accidente de Trabajo',
    'Incidentes',
    'Licencia de Maternidad',
    'Licencia de Paternidad',
    'Licencia No Remunerada',
    'Permiso Personal',
    'Permiso por Calamidad Doméstica',
    'Permiso por Cita Médica',
    'Vacaciones',
    'Suspensión',
    'Otros'
  ];

  // Tipos de novedad que se calculan por horas
  const tiposNovedadPorHoras = [
    'Permiso Personal',
    'Permiso por Calamidad Doméstica',
    'Permiso por Cita Médica'
  ];

  const estadosNovedad = [
    { value: 'pendiente_por_radicar_sin_informacion', label: 'Pendiente por radicar (Sin información)', color: 'warning' },
    { value: 'pendiente_por_radicar_con_informacion', label: 'Pendiente por radicar (Con información)', color: 'info' },
    { value: 'radicada_en_tramite', label: 'Radicada en trámite', color: 'primary' },
    { value: 'aprobada_pendiente_pago', label: 'Aprobada pendiente de pago', color: 'success' },
    { value: 'pagada', label: 'Pagada', color: 'success' },
    { value: 'negada', label: 'Negada', color: 'danger' },
    { value: 'devuelta_por_informacion', label: 'Devuelta por información', color: 'warning' },
    { value: 'en_investigacion', label: 'En investigación', color: 'info' },
    { value: 'cerrada', label: 'Cerrada', color: 'secondary' }
  ];

  const estadosInvestigacion = [
    { value: 'investigado_en_seguimiento', label: 'Investigado en seguimiento', color: 'info' },
    { value: 'investigado_cerrado', label: 'Investigado cerrado', color: 'success' },
    { value: 'pendiente_por_investigar', label: 'Pendiente por investigar', color: 'danger' },
    { value: 'en_investigacion', label: 'En investigación', color: 'warning' },
    { value: 'calificada_con_pcl', label: 'Calificada con PCL', color: 'primary' }
  ];

  const responsablesPago = [
    'Empleador (Empresa)',
    'EPS',
    'ARL',
    'AFP',
    'Caja de Compensación',
    'ICBF',
    'Sin Responsable de Pago'
  ];

  // Opciones para Tipo de Lesión
  const tiposLesion = [
    'Contusión',
    'Fractura',
    'Herida',
    'Luxación',
    'Esguince',
    'Quemadura',
    'Intoxicación',
    'Asfixia',
    'Shock eléctrico',
    'Lesión múltiple',
    'Otros'
  ];

  // Opciones para Segmento Corporal
  const segmentosCorporales = [
    'Cabeza',
    'Cuello',
    'Tronco',
    'Espalda',
    'Brazo derecho',
    'Brazo izquierdo',
    'Mano derecha',
    'Mano izquierda',
    'Pierna derecha',
    'Pierna izquierda',
    'Pie derecho',
    'Pie izquierdo',
    'Múltiples segmentos',
    'Otros'
  ];

  // Opciones para Mecanismo de Accidente
  const mecanismosAccidente = [
    'Caída de personas',
    'Caída de objetos',
    'Pisadas sobre objetos',
    'Choque contra objetos',
    'Atrapamiento',
    'Sobreesfuerzo',
    'Contacto con electricidad',
    'Contacto con sustancias químicas',
    'Contacto con temperaturas extremas',
    'Explosión',
    'Incendio',
    'Agresión por animales',
    'Otros'
  ];

  // Función para verificar si un tipo de novedad se calcula por horas
  const esTipoNovedadPorHoras = (tipoNovedad) => {
    return tiposNovedadPorHoras.includes(tipoNovedad);
  };

  // Función para calcular horas entre dos tiempos
  const calcularHorasEntreTiempos = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return 0;

    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFin2, minFin] = horaFin.split(':').map(Number);

    let minutosInicio = horaIni * 60 + minIni;
    let minutosFin = horaFin2 * 60 + minFin;

    let diferenciaMinutos = minutosFin - minutosInicio;

    // Si la hora de fin es menor que la de inicio, asumimos que cruza medianoche
    if (diferenciaMinutos < 0) {
      diferenciaMinutos += 24 * 60; // Agregar 24 horas en minutos
    }

    return diferenciaMinutos / 60; // Convertir a horas
  };

  // FUNCIÓN CORREGIDA: Formatear fecha sin problemas de zona horaria
  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';

    // Si la fecha ya está en formato YYYY-MM-DD, la usamos directamente
    if (fechaString.includes('-') && fechaString.length === 10) {
      const [year, month, day] = fechaString.split('-');
      return `${day}/${month}/${year}`;
    }

    // Si es un timestamp o fecha de JavaScript
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return fechaString;

    // Usar toLocaleDateString para evitar problemas de zona horaria
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para formatear fecha para input
  const formatearFechaParaInput = (fechaString) => {
    if (!fechaString) return '';

    // Si ya está en formato YYYY-MM-DD, devolverla tal como está
    if (fechaString.includes('-') && fechaString.length === 10) {
      return fechaString;
    }

    // Si es un timestamp o fecha de JavaScript
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return '';

    // Convertir a formato YYYY-MM-DD
    return fecha.toISOString().split('T')[0];
  };

  // NUEVA FUNCIÓN: Obtener cargo de un trabajador por su cédula
  const obtenerCargoPorCedula = (numeroDocumento) => {
    const trabajador = trabajadores.find(t => t.numeroDocumento === numeroDocumento);
    return trabajador ? trabajador.cargo : 'Sin cargo';
  };

  // NUEVA FUNCIÓN: Generar lista de cargos únicos
  const generarListaCargos = () => {
    const cargosUnicos = [...new Set(trabajadores.map(t => t.cargo))].filter(Boolean);
    setListaCargos(cargosUnicos.sort());
  };

  // NUEVA FUNCIÓN: Calcular totales de novedades filtradas
  const calcularTotalesFiltrados = (novedadesFiltradas) => {
    const totales = {
      cantidad: novedadesFiltradas.length,
      tiempo: 0,
      valorTotal: 0,
      valorPagado: 0,
      valorPendiente: 0
    };

    novedadesFiltradas.forEach(novedad => {
      // Sumar días (tiempo)
      totales.tiempo += parseInt(novedad.dias) || 0;

      // Sumar valores monetarios
      totales.valorTotal += parseFloat(novedad.valorTotal) || 0;
      totales.valorPagado += parseFloat(novedad.valorPagado) || 0;
      totales.valorPendiente += parseFloat(novedad.valorPendiente) || 0;
    });

    setTotalesFiltrados(totales);
  };

  // Funciones auxiliares para estados
  const getEstadoLabel = (estado) => {
    const estadoObj = estadosNovedad.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  const getEstadoColor = (estado) => {
    const estadoObj = estadosNovedad.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : 'secondary';
  };

  const getEstadoInvestigacionLabel = (estado) => {
    const estadoObj = estadosInvestigacion.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  const getEstadoInvestigacionColor = (estado) => {
    const estadoObj = estadosInvestigacion.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : 'secondary';
  };

  const requiereEstadoInvestigacion = (tipoNovedad) => {
    return ['Accidente de Trabajo', 'Incapacidad por Accidente de Trabajo', 'Incidentes', 'Incapacidad por Enfermedad Profesional'].includes(tipoNovedad);
  };

  // Función para mostrar días/horas en la tabla
  const mostrarDiasHoras = (novedad) => {
    if (esTipoNovedadPorHoras(novedad.tipoNovedad)) {
      return `${(novedad.horas || 0).toFixed(1)}h`;
    } else {
      return `${novedad.dias || 0}d`;
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros cuando cambien las novedades o los filtros
  useEffect(() => {
    aplicarFiltros();
  }, [novedades, filtros]);

  // Generar lista de cargos cuando cambien los trabajadores
  useEffect(() => {
    generarListaCargos();
  }, [trabajadores]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.error('Usuario no autenticado');
        setLoading(false);
        return;
      }

      // Cargar trabajadores
      const trabajadoresQuery = query(
        collection(db, 'trabajadores'),
        where('clienteId', '==', dataScopeId)
      );
      const trabajadoresSnapshot = await getDocs(trabajadoresQuery);
      const trabajadoresData = [];
      trabajadoresSnapshot.forEach((doc) => {
        trabajadoresData.push({ id: doc.id, ...doc.data() });
      });
      setTrabajadores(trabajadoresData);

      // Cargar novedades
      const novedadesQuery = query(
        collection(db, 'novedades'),
        where('clienteId', '==', dataScopeId)
      );
      const novedadesSnapshot = await getDocs(novedadesQuery);
      const novedadesData = [];
      novedadesSnapshot.forEach((doc) => {
        novedadesData.push({ id: doc.id, ...doc.data() });
      });

      setNovedades(novedadesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN MODIFICADA: Aplicar filtros incluyendo cargo
  const aplicarFiltros = () => {
    let novedadesFiltradas = [...novedades];

    if (filtros.cedula) {
      novedadesFiltradas = novedadesFiltradas.filter(novedad =>
        novedad.numeroDocumento?.includes(filtros.cedula)
      );
    }

    if (filtros.estado) {
      novedadesFiltradas = novedadesFiltradas.filter(novedad =>
        novedad.estado === filtros.estado
      );
    }

    if (filtros.tipoNovedad) {
      novedadesFiltradas = novedadesFiltradas.filter(novedad =>
        novedad.tipoNovedad === filtros.tipoNovedad
      );
    }

    if (filtros.fechaDesde) {
      novedadesFiltradas = novedadesFiltradas.filter(novedad =>
        new Date(novedad.fechaInicio) >= new Date(filtros.fechaDesde)
      );
    }

    if (filtros.fechaHasta) {
      novedadesFiltradas = novedadesFiltradas.filter(novedad =>
        new Date(novedad.fechaInicio) <= new Date(filtros.fechaHasta)
      );
    }

    // NUEVO: Filtro por cargo
    if (filtros.cargo) {
      // Obtener trabajadores que tienen el cargo seleccionado
      const trabajadoresConCargo = trabajadores.filter(t => t.cargo === filtros.cargo);
      const cedulasConCargo = trabajadoresConCargo.map(t => t.numeroDocumento);

      novedadesFiltradas = novedadesFiltradas.filter(novedad =>
        cedulasConCargo.includes(novedad.numeroDocumento)
      );
    }

    setNovedadesFiltradas(novedadesFiltradas);
    setPaginaActual(1);

    // NUEVO: Calcular totales de las novedades filtradas
    calcularTotalesFiltrados(novedadesFiltradas);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      cedula: '',
      estado: '',
      tipoNovedad: '',
      fechaDesde: '',
      fechaHasta: '',
      cargo: '' // NUEVO
    });
  };

  const buscarEmpleado = async () => {
    if (!formData.numeroDocumento) {
      toast.error('Por favor ingrese un número de documento');
      return;
    }

    const trabajadorEncontrado = trabajadores.find(
      trabajador => trabajador.numeroDocumento === formData.numeroDocumento
    );

    if (trabajadorEncontrado) {
      setFormData({
        ...formData,
        empleadoNombre: `${trabajadorEncontrado.nombres} ${trabajadorEncontrado.apellidos}`,
        salarioCotizacion: trabajadorEncontrado.salario || ''
      });
      toast.success('Empleado encontrado correctamente');
    } else {
      toast.error('Empleado no encontrado. Verifique el número de documento.');
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      numeroDocumento: '',
      empleadoNombre: '',
      tipoNovedad: '',
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: '',
      salarioCotizacion: '',
      responsablePago: '',
      descripcion: '',
      estado: 'pendiente_por_radicar_sin_informacion',
      valorPagado: '',
      diagnosticoEnfermedad: '',
      tipoLesion: '',
      segmentoCorporal: '',
      mecanismoAccidente: '',
      estadoInvestigacion: ''
    });
    setValoresCalculados({
      dias: 0,
      horas: 0,
      valorDiario: 0,
      valorPorHora: 0,
      valorTotal: 0,
      valorPagado: 0,
      valorPendiente: 0,
      responsable: ''
    });
  };

  // Función para descargar Excel con datos filtrados incluyendo cargo
  const descargarExcelFiltrado = () => {
    if (novedadesFiltradas.length === 0) {
      toast.error('No hay datos para descargar');
      return;
    }

    // Preparar datos para Excel incluyendo cargo
    const datosExcel = novedadesFiltradas.map(novedad => ({
      'Número de Documento': novedad.numeroDocumento || '',
      'Empleado': novedad.empleadoNombre || '',
      'Cargo': obtenerCargoPorCedula(novedad.numeroDocumento), // NUEVO
      'Tipo de Novedad': novedad.tipoNovedad || '',
      'Fecha Inicio': formatearFecha(novedad.fechaInicio),
      'Fecha Fin': formatearFecha(novedad.fechaFin),
      'Días': novedad.dias || 0,
      'Horas': novedad.horas || 0,
      'Valor Total': novedad.valorTotal || 0,
      'Valor Pagado': novedad.valorPagado || 0,
      'Valor Pendiente': novedad.valorPendiente || 0,
      'Estado': getEstadoLabel(novedad.estado),
      'Responsable de Pago': novedad.responsablePago || '',
      'Diagnóstico/Enfermedad': novedad.diagnosticoEnfermedad || '',
      'Tipo de Lesión': novedad.tipoLesion || '',
      'Segmento Corporal': novedad.segmentoCorporal || '',
      'Mecanismo de Accidente': novedad.mecanismoAccidente || '',
      'Estado Investigación': getEstadoInvestigacionLabel(novedad.estadoInvestigacion) || '',
      'Descripción': novedad.descripcion || ''
    }));

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Novedades Filtradas');

    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `novedades_filtradas_${fecha}.xlsx`);
    toast.success('Archivo Excel descargado exitosamente');
  };

  // Resto de funciones del componente original (handleSubmit, editarNovedad, etc.)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      // Validaciones específicas
      if (requiereEstadoInvestigacion(formData.tipoNovedad) && !formData.estadoInvestigacion) {
        toast.error('El estado de investigación es obligatorio para este tipo de novedad');
        return;
      }

      // Validación para tipos de novedad por horas
      if (esTipoNovedadPorHoras(formData.tipoNovedad)) {
        if (!formData.horaInicio || !formData.horaFin) {
          toast.error('Las horas de inicio y fin son obligatorias para este tipo de novedad');
          return;
        }
      }

      // Validaciones específicas para Incapacidad Médica
      if (formData.tipoNovedad === 'Incapacidad Médica' && !formData.diagnosticoEnfermedad) {
        toast.error('El diagnóstico de la enfermedad es obligatorio para Incapacidad Médica');
        return;
      }

      // Validaciones específicas para Accidente de Trabajo
      if ((formData.tipoNovedad === 'Accidente de Trabajo' || formData.tipoNovedad === 'Incapacidad por Accidente de Trabajo') &&
        (!formData.tipoLesion || !formData.segmentoCorporal || !formData.mecanismoAccidente)) {
        toast.error('Tipo de lesión, segmento corporal y mecanismo de accidente son obligatorios para Accidentes de Trabajo');
        return;
      }

      // Validar que el valor pagado no sea mayor al valor total
      if (valoresCalculados.valorPagado > valoresCalculados.valorTotal && valoresCalculados.valorTotal > 0) {
        toast.error('El valor pagado no puede ser mayor al valor total');
        return;
      }

      const novedadData = {
        ...formData,
        clienteId: dataScopeId,
        fechaCreacion: new Date().toISOString(),
        dias: valoresCalculados.dias,
        horas: valoresCalculados.horas,
        valorDiario: valoresCalculados.valorDiario,
        valorPorHora: valoresCalculados.valorPorHora,
        valorTotal: valoresCalculados.valorTotal,
        valorPagado: valoresCalculados.valorPagado,
        valorPendiente: valoresCalculados.valorPendiente,
        responsablePago: valoresCalculados.responsable,
        observaciones: editingId ? (novedades.find(n => n.id === editingId)?.observaciones || []) : []
      };

      if (editingId) {
        await updateDoc(doc(db, 'novedades', editingId), novedadData);
        toast.success('Novedad actualizada exitosamente');
      } else {
        await addDoc(collection(db, 'novedades'), novedadData);
        toast.success('Novedad registrada exitosamente');
      }

      setShowForm(false);
      setEditingId(null);
      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar novedad:', error);
      toast.error('Error al guardar la novedad');
    }
  };

  // Calcular valores automáticamente cuando cambien los campos relevantes
  const calcularValores = useCallback(() => {
    let dias = 0;
    let horas = 0;
    let valorDiario = 0;
    let valorPorHora = 0;
    let valorTotal = 0;
    let valorPagado = parseFloat(formData.valorPagado) || 0;
    let valorPendiente = 0;
    let responsable = '';

    const salario = parseFloat(formData.salarioCotizacion) || 0;

    if (salario > 0) {
      valorDiario = salario / 30;
      valorPorHora = valorDiario / 8;
    }

    // Calcular días o horas según el tipo de novedad
    if (esTipoNovedadPorHoras(formData.tipoNovedad)) {
      // Calcular por horas
      if (formData.horaInicio && formData.horaFin) {
        horas = calcularHorasEntreTiempos(formData.horaInicio, formData.horaFin);
        dias = horas / 8; // Convertir horas a días equivalentes
        valorTotal = horas * valorPorHora;
      }
    } else {
      // Calcular por días
      if (formData.fechaInicio && formData.fechaFin) {
        const fechaInicio = new Date(formData.fechaInicio);
        const fechaFin = new Date(formData.fechaFin);
        const diferenciaTiempo = fechaFin.getTime() - fechaInicio.getTime();
        dias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
        valorTotal = dias * valorDiario;
      }
    }

    // Determinar responsable de pago
    switch (formData.tipoNovedad) {
      case 'Incapacidad Médica':
        if (dias <= 2) {
          responsable = 'Empleador (Empresa)';
        } else {
          responsable = 'EPS';
        }
        break;
      case 'Incapacidad por Accidente de Trabajo':
      case 'Accidente de Trabajo':
      case 'Incapacidad por Enfermedad Profesional':
        responsable = 'ARL';
        break;
      case 'Licencia de Maternidad':
      case 'Licencia de Paternidad':
        responsable = 'EPS';
        break;
      case 'Vacaciones':
      case 'Permiso Personal':
      case 'Permiso por Calamidad Doméstica':
      case 'Permiso por Cita Médica':
      case 'Licencia No Remunerada':
        responsable = 'Empleador (Empresa)';
        break;
      case 'Incidentes':
        responsable = 'Sin Responsable de Pago';
        break;
      default:
        responsable = 'Por definir';
        break;
    }

    valorPendiente = Math.max(0, valorTotal - valorPagado);

    setValoresCalculados({
      dias,
      horas,
      valorDiario,
      valorPorHora,
      valorTotal,
      valorPagado,
      valorPendiente,
      responsable
    });
  }, [formData.fechaInicio, formData.fechaFin, formData.horaInicio, formData.horaFin, formData.salarioCotizacion, formData.tipoNovedad, formData.valorPagado, esTipoNovedadPorHoras]);

  useEffect(() => {
    calcularValores();
  }, [calcularValores]);

  const consultarPorCedula = () => {
    if (!cedulaConsulta.trim()) {
      toast.error('Por favor ingrese un número de cédula');
      return;
    }

    const novedadesEncontradas = novedades.filter(
      novedad => novedad.numeroDocumento === cedulaConsulta.trim()
    );

    setNovedadesConsulta(novedadesEncontradas);

    if (novedadesEncontradas.length === 0) {
      toast.info('No se encontraron novedades para esta cédula');
    } else {
      toast.success(`Se encontraron ${novedadesEncontradas.length} novedad(es)`);
    }
  };

  const editarNovedad = (novedad) => {
    setFormData({
      numeroDocumento: novedad.numeroDocumento || '',
      empleadoNombre: novedad.empleadoNombre || '',
      tipoNovedad: novedad.tipoNovedad || '',
      fechaInicio: formatearFechaParaInput(novedad.fechaInicio) || '',
      fechaFin: formatearFechaParaInput(novedad.fechaFin) || '',
      horaInicio: novedad.horaInicio || '',
      horaFin: novedad.horaFin || '',
      salarioCotizacion: novedad.salarioCotizacion || '',
      responsablePago: novedad.responsablePago || '',
      descripcion: novedad.descripcion || '',
      estado: novedad.estado || 'pendiente_por_radicar_sin_informacion',
      valorPagado: novedad.valorPagado || '',
      diagnosticoEnfermedad: novedad.diagnosticoEnfermedad || '',
      tipoLesion: novedad.tipoLesion || '',
      segmentoCorporal: novedad.segmentoCorporal || '',
      mecanismoAccidente: novedad.mecanismoAccidente || '',
      estadoInvestigacion: novedad.estadoInvestigacion || ''
    });

    setValoresCalculados({
      dias: novedad.dias || 0,
      horas: novedad.horas || 0,
      valorDiario: novedad.valorDiario || 0,
      valorPorHora: novedad.valorPorHora || 0,
      valorTotal: novedad.valorTotal || 0,
      valorPagado: novedad.valorPagado || 0,
      valorPendiente: novedad.valorPendiente || 0,
      responsable: novedad.responsablePago || ''
    });

    setEditingId(novedad.id);
    setShowForm(true);
  };

  const eliminarNovedad = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta novedad?')) {
      try {
        await deleteDoc(doc(db, 'novedades', id));
        toast.success('Novedad eliminada exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar novedad:', error);
        toast.error('Error al eliminar la novedad');
      }
    }
  };

  const agregarObservacion = async () => {
    if (!nuevaObservacion.trim()) {
      toast.error('Por favor escriba una observación');
      return;
    }

    try {
      const observacionesActuales = novedadSeleccionada.observaciones || [];
      const nuevasObservaciones = [
        ...observacionesActuales,
        {
          texto: nuevaObservacion,
          fecha: new Date().toISOString(),
          usuario: auth.currentUser?.email || 'Usuario'
        }
      ];

      await updateDoc(doc(db, 'novedades', novedadSeleccionada.id), {
        observaciones: nuevasObservaciones
      });

      // Actualizar el estado local
      setNovedadSeleccionada({
        ...novedadSeleccionada,
        observaciones: nuevasObservaciones
      });

      setNuevaObservacion('');
      toast.success('Observación agregada exitosamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al agregar observación:', error);
      toast.error('Error al agregar la observación');
    }
  };

  // Paginación
  const indiceUltimoItem = paginaActual * novedadesPorPagina;
  const indicePrimerItem = indiceUltimoItem - novedadesPorPagina;
  const novedadesActuales = novedadesFiltradas.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(novedadesFiltradas.length / novedadesPorPagina);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Gestión de Novedades</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-info"
            onClick={() => setShowConsulta(true)}
          >
            🔍 Consultar por Cédula
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              limpiarFormulario();
              setShowForm(true);
            }}
          >
            ➕ Nueva Novedad
          </button>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Indicadores de Totales */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <h6 className="alert-heading mb-3">📊 Totales de Novedades Filtradas</h6>
            <div className="row">
              <div className="col-lg-2 col-md-4 col-sm-6 mb-2">
                <div className="card text-center bg-light border-primary">
                  <div className="card-body py-2">
                    <h5 className="text-primary mb-1">{totalesFiltrados.cantidad}</h5>
                    <small className="text-muted">Cantidad</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-2">
                <div className="card text-center bg-light border-warning">
                  <div className="card-body py-2">
                    <h5 className="text-warning mb-1">{totalesFiltrados.tiempo}</h5>
                    <small className="text-muted">Total Días</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-2">
                <div className="card text-center bg-light border-info">
                  <div className="card-body py-2">
                    <h5 className="text-info mb-1">${totalesFiltrados.valorTotal.toLocaleString()}</h5>
                    <small className="text-muted">Valor Total</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-2">
                <div className="card text-center bg-light border-success">
                  <div className="card-body py-2">
                    <h5 className="text-success mb-1">${totalesFiltrados.valorPagado.toLocaleString()}</h5>
                    <small className="text-muted">Valor Pagado</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-2">
                <div className="card text-center bg-light border-danger">
                  <div className="card-body py-2">
                    <h5 className="text-danger mb-1">${totalesFiltrados.valorPendiente.toLocaleString()}</h5>
                    <small className="text-muted">Valor Pendiente</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🔍 Filtros y Consultas</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
              <label className="form-label">Número de Cédula</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: 12345678"
                value={filtros.cedula}
                onChange={(e) => setFiltros({ ...filtros, cedula: e.target.value })}
              />
            </div>

            <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos</option>
                {estadosNovedad.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
              <label className="form-label">Tipo de Novedad</label>
              <select
                className="form-select"
                value={filtros.tipoNovedad}
                onChange={(e) => setFiltros({ ...filtros, tipoNovedad: e.target.value })}
              >
                <option value="">Todos</option>
                {tiposNovedad.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
              <label className="form-label">Fecha Desde</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
              />
            </div>

            <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
              <label className="form-label">Fecha Hasta</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
              />
            </div>

            {/* NUEVO: Filtro por cargo */}
            <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
              <label className="form-label">Cargo</label>
              <select
                className="form-select"
                value={filtros.cargo}
                onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })}
              >
                <option value="">Todos los cargos</option>
                {listaCargos.map(cargo => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
              <small className="text-muted">
                💡 Los cargos provienen del listado de trabajadores
              </small>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-secondary"
                  onClick={limpiarFiltros}
                >
                  🗑️ Limpiar Filtros
                </button>
                <button
                  className="btn btn-success"
                  onClick={descargarExcelFiltrado}
                  disabled={novedadesFiltradas.length === 0}
                >
                  📊 Descargar Excel
                </button>
              </div>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="row mt-3">
            <div className="col-12">
              <div className="alert alert-info mb-0">
                <strong>Resultados:</strong> Se encontraron {novedadesFiltradas.length} novedad(es)
                de un total de {novedades.length} registradas.
                {(filtros.cedula || filtros.estado || filtros.tipoNovedad ||
                  filtros.fechaDesde || filtros.fechaHasta || filtros.cargo) && (
                    <span className="ms-2">
                      <strong>Filtros activos:</strong>
                      {filtros.cedula && <span className="badge bg-primary ms-1">Cédula: {filtros.cedula}</span>}
                      {filtros.estado && <span className="badge bg-primary ms-1">Estado: {estadosNovedad.find(e => e.value === filtros.estado)?.label}</span>}
                      {filtros.tipoNovedad && <span className="badge bg-primary ms-1">Tipo: {filtros.tipoNovedad}</span>}
                      {filtros.fechaDesde && <span className="badge bg-primary ms-1">Desde: {filtros.fechaDesde}</span>}
                      {filtros.fechaHasta && <span className="badge bg-primary ms-1">Hasta: {filtros.fechaHasta}</span>}
                      {filtros.cargo && <span className="badge bg-success ms-1">Cargo: {filtros.cargo}</span>}
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de novedades - MODIFICADO: Agregada columna Cargo */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Lista de Novedades ({novedadesFiltradas.length} registros)</h5>
        </div>
        <div className="card-body">
          {novedadesFiltradas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No se encontraron novedades con los filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Cédula</th>
                      <th>Empleado</th>
                      <th>Cargo</th> {/* NUEVA COLUMNA */}
                      <th>Tipo</th>
                      <th>Fechas</th>
                      <th>Tiempo</th>
                      <th>Valor Total</th>
                      <th>Valor Pagado</th>
                      <th>Pendiente</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novedadesActuales.map((novedad) => (
                      <tr key={novedad.id}>
                        <td>{novedad.numeroDocumento}</td>
                        <td>{novedad.empleadoNombre}</td>
                        <td>
                          <span className="badge bg-info">
                            {obtenerCargoPorCedula(novedad.numeroDocumento)}
                          </span>
                        </td> {/* NUEVA COLUMNA */}
                        <td>
                          <span className={`badge ${novedad.tipoNovedad === 'Incapacidad Médica' ? 'bg-info' :
                              novedad.tipoNovedad === 'Accidente de Trabajo' ? 'bg-danger' :
                                novedad.tipoNovedad === 'Incapacidad por Accidente de Trabajo' ? 'bg-danger' :
                                  novedad.tipoNovedad === 'Incapacidad por Enfermedad Profesional' ? 'bg-warning' :
                                    esTipoNovedadPorHoras(novedad.tipoNovedad) ? 'bg-warning text-dark' :
                                      'bg-secondary'
                            }`}>
                            {novedad.tipoNovedad}
                            {esTipoNovedadPorHoras(novedad.tipoNovedad) && ' ⏰'}
                          </span>
                        </td>
                        <td>
                          <small>
                            {formatearFecha(novedad.fechaInicio)} - {formatearFecha(novedad.fechaFin)}
                            {esTipoNovedadPorHoras(novedad.tipoNovedad) && novedad.horaInicio && novedad.horaFin && (
                              <><br />{novedad.horaInicio} - {novedad.horaFin}</>
                            )}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${esTipoNovedadPorHoras(novedad.tipoNovedad) ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                            {mostrarDiasHoras(novedad)}
                          </span>
                        </td>
                        <td>${(novedad.valorTotal || 0).toLocaleString()}</td>
                        <td>
                          <span className="text-success">
                            ${(novedad.valorPagado || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className="text-danger">
                            ${(novedad.valorPendiente || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${getEstadoColor(novedad.estado)}`}>
                            {getEstadoLabel(novedad.estado)}
                          </span>
                          {requiereEstadoInvestigacion(novedad.tipoNovedad) && (
                            <>
                              <br />
                              <small>
                                {novedad.estadoInvestigacion ? (
                                  <span className={`badge bg-${getEstadoInvestigacionColor(novedad.estadoInvestigacion)}`}>
                                    {getEstadoInvestigacionLabel(novedad.estadoInvestigacion)}
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">Sin definir</span>
                                )}
                              </small>
                            </>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => editarNovedad(novedad)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => {
                                setNovedadSeleccionada(novedad);
                                setShowObservaciones(true);
                              }}
                              title="Ver observaciones"
                            >
                              💬
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => eliminarNovedad(novedad.id)}
                              title="Eliminar"
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

              {/* Paginación */}
              {totalPaginas > 1 && (
                <nav aria-label="Paginación de novedades">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPaginaActual(paginaActual - 1)}
                        disabled={paginaActual === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {[...Array(totalPaginas)].map((_, index) => (
                      <li key={index + 1} className={`page-item ${paginaActual === index + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPaginaActual(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPaginaActual(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para Nueva/Editar Novedad */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? '✏️ Editar Novedad' : '➕ Nueva Novedad'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  {/* Información del Empleado */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Número de Documento *</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={formData.numeroDocumento}
                          onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={buscarEmpleado}
                        >
                          🔍 Buscar
                        </button>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Nombre del Empleado *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre completo del empleado"
                        value={formData.empleadoNombre}
                        readOnly
                        required
                      />
                    </div>
                  </div>

                  {/* Información de la Novedad */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Tipo de Novedad *</label>
                      <select
                        className="form-select"
                        value={formData.tipoNovedad}
                        onChange={(e) => setFormData({ ...formData, tipoNovedad: e.target.value })}
                        required
                      >
                        <option value="">Seleccione un tipo</option>
                        {tiposNovedad.map(tipo => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                            {esTipoNovedadPorHoras(tipo) && ' ⏰ (Por horas)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Estado *</label>
                      <select
                        className="form-select"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        required
                      >
                        {estadosNovedad.map(estado => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {requiereEstadoInvestigacion(formData.tipoNovedad) && (
                      <div className="col-md-4">
                        <label className="form-label">Estado de Investigación *</label>
                        <select
                          className="form-select"
                          value={formData.estadoInvestigacion}
                          onChange={(e) => setFormData({ ...formData, estadoInvestigacion: e.target.value })}
                          required
                        >
                          <option value="">Seleccione estado</option>
                          {estadosInvestigacion.map(estado => (
                            <option key={estado.value} value={estado.value}>
                              {estado.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Fechas y Horas */}
                  {formData.tipoNovedad === 'Incidentes' ? (
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Fecha del Incidente *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({
                            ...formData,
                            fechaInicio: e.target.value,
                            fechaFin: e.target.value // Para incidentes, fecha inicio = fecha fin
                          })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Salario de Cotización *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Ej: 1300000"
                          value={formData.salarioCotizacion}
                          onChange={(e) => setFormData({ ...formData, salarioCotizacion: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  ) : esTipoNovedadPorHoras(formData.tipoNovedad) ? (
                    // CAMPOS ESPECIALES PARA PERMISOS POR HORAS
                    <>
                      <div className="alert alert-warning">
                        <h6>⏰ Permiso por Horas</h6>
                        <p className="mb-0">Este tipo de novedad se calcula por horas. Ingrese la fecha y las horas de salida y llegada.</p>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label className="form-label">Fecha del Permiso *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.fechaInicio}
                            onChange={(e) => setFormData({
                              ...formData,
                              fechaInicio: e.target.value,
                              fechaFin: e.target.value // Para permisos por horas, fecha inicio = fecha fin
                            })}
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Hora de Salida *</label>
                          <input
                            type="time"
                            className="form-control"
                            value={formData.horaInicio}
                            onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                            required
                          />
                          <small className="text-muted">Hora en que sale del trabajo</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Hora de Llegada *</label>
                          <input
                            type="time"
                            className="form-control"
                            value={formData.horaFin}
                            onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                            required
                          />
                          <small className="text-muted">Hora en que regresa al trabajo</small>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <label className="form-label">Salario de Cotización *</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Ej: 1300000"
                            value={formData.salarioCotizacion}
                            onChange={(e) => setFormData({ ...formData, salarioCotizacion: e.target.value })}
                            required
                          />
                          <small className="text-muted">Se calculará el valor por hora: Salario ÷ (30 días × 8 horas)</small>
                        </div>
                      </div>
                    </>
                  ) : (
                    // CAMPOS NORMALES PARA OTROS TIPOS DE NOVEDAD
                    <div className="row mb-3">
                      <div className="col-md-3">
                        <label className="form-label">Fecha de Inicio *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Fecha de Fin *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Salario de Cotización *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Ej: 1300000"
                          value={formData.salarioCotizacion}
                          onChange={(e) => setFormData({ ...formData, salarioCotizacion: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Información de Pagos - Solo si NO es incidente */}
                  {formData.tipoNovedad !== 'Incidentes' && (
                    <div className="alert alert-info">
                      <h6>💰 Información de Pagos</h6>
                      <p className="mb-2">Registre el valor que ya ha sido pagado por el responsable correspondiente.</p>
                      <div className="row">
                        <div className="col-md-6">
                          <label className="form-label">Valor Pagado</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Ej: 500000"
                            value={formData.valorPagado}
                            onChange={(e) => setFormData({ ...formData, valorPagado: e.target.value })}
                          />
                          <small className="text-muted">Ingrese el valor que ya ha sido pagado (opcional)</small>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Responsable de Pago</label>
                          <select
                            className="form-select"
                            value={formData.responsablePago}
                            onChange={(e) => setFormData({ ...formData, responsablePago: e.target.value })}
                          >
                            <option value="">Asignar automáticamente</option>
                            {responsablesPago.map(responsable => (
                              <option key={responsable} value={responsable}>{responsable}</option>
                            ))}
                          </select>
                          <small className="text-muted">Se asignará automáticamente según el tipo de novedad</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información Específica para Incapacidad Médica */}
                  {formData.tipoNovedad === 'Incapacidad Médica' && (
                    <div className="alert alert-warning">
                      <h6>🏥 Información Específica para Incapacidad Médica</h6>
                      <div className="row">
                        <div className="col-md-12">
                          <label className="form-label">Diagnóstico de la Enfermedad *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej: Gripe, Gastroenteritis, Lumbalgia, etc."
                            value={formData.diagnosticoEnfermedad}
                            onChange={(e) => setFormData({ ...formData, diagnosticoEnfermedad: e.target.value })}
                            required
                          />
                          <small className="text-muted">Especifique el diagnóstico médico de la incapacidad</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información Específica para Accidente de Trabajo */}
                  {(formData.tipoNovedad === 'Accidente de Trabajo' || formData.tipoNovedad === 'Incapacidad por Accidente de Trabajo') && (
                    <div className="alert alert-warning">
                      <h6>🏭 Información Específica para Accidente de Trabajo</h6>
                      <div className="row">
                        <div className="col-md-4">
                          <label className="form-label">Tipo de Lesión *</label>
                          <select
                            className="form-select"
                            value={formData.tipoLesion}
                            onChange={(e) => setFormData({ ...formData, tipoLesion: e.target.value })}
                            required
                          >
                            <option value="">Seleccione el tipo de lesión</option>
                            {tiposLesion.map(tipo => (
                              <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                          </select>
                          <small className="text-muted">Seleccione el tipo de lesión sufrida</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Segmento Corporal Afectado *</label>
                          <select
                            className="form-select"
                            value={formData.segmentoCorporal}
                            onChange={(e) => setFormData({ ...formData, segmentoCorporal: e.target.value })}
                            required
                          >
                            <option value="">Seleccione el segmento</option>
                            {segmentosCorporales.map(segmento => (
                              <option key={segmento} value={segmento}>{segmento}</option>
                            ))}
                          </select>
                          <small className="text-muted">Seleccione la parte del cuerpo afectada</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Mecanismo de Accidente *</label>
                          <select
                            className="form-select"
                            value={formData.mecanismoAccidente}
                            onChange={(e) => setFormData({ ...formData, mecanismoAccidente: e.target.value })}
                            required
                          >
                            <option value="">Seleccione el mecanismo</option>
                            {mecanismosAccidente.map(mecanismo => (
                              <option key={mecanismo} value={mecanismo}>{mecanismo}</option>
                            ))}
                          </select>
                          <small className="text-muted">Seleccione cómo ocurrió el accidente</small>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Descripción adicional de la novedad..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>

                  {/* Vista previa de cálculos - Solo si NO es incidente */}
                  {formData.tipoNovedad !== 'Incidentes' && (
                    <div className="alert alert-info">
                      <h6>📊 Vista previa de cálculos:</h6>
                      {esTipoNovedadPorHoras(formData.tipoNovedad) ? (
                        <div className="row">
                          <div className="col-md-2">
                            <strong>Horas:</strong> {valoresCalculados.horas.toFixed(1)}
                          </div>
                          <div className="col-md-2">
                            <strong>Días equiv.:</strong> {valoresCalculados.dias.toFixed(2)}
                          </div>
                          <div className="col-md-2">
                            <strong>Valor/hora:</strong> ${valoresCalculados.valorPorHora.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Valor Total:</strong> ${valoresCalculados.valorTotal.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Valor Pagado:</strong> ${valoresCalculados.valorPagado.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Pendiente:</strong> ${valoresCalculados.valorPendiente.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="row">
                          <div className="col-md-2">
                            <strong>Días:</strong> {valoresCalculados.dias}
                          </div>
                          <div className="col-md-2">
                            <strong>Valor/día:</strong> ${valoresCalculados.valorDiario.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Valor Total:</strong> ${valoresCalculados.valorTotal.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Valor Pagado:</strong> ${valoresCalculados.valorPagado.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Pendiente:</strong> ${valoresCalculados.valorPendiente.toLocaleString()}
                          </div>
                          <div className="col-md-2">
                            <strong>Responsable:</strong> {valoresCalculados.responsable}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  {editingId ? 'Actualizar' : 'Crear'} Novedad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Consulta por Cédula */}
      {showConsulta && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🔍 Consultar Novedades por Cédula</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConsulta(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingrese número de cédula"
                      value={cedulaConsulta}
                      onChange={(e) => setCedulaConsulta(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-primary w-100"
                      onClick={consultarPorCedula}
                    >
                      🔍 Buscar
                    </button>
                  </div>
                </div>

                {novedadesConsulta.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Fechas</th>
                          <th>Tiempo</th>
                          <th>Valor Total</th>
                          <th>Valor Pagado</th>
                          <th>Pendiente</th>
                          <th>Estado</th>
                          <th>Est. Investigación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {novedadesConsulta.map((novedad) => (
                          <tr key={novedad.id}>
                            <td>
                              <span className={`badge ${esTipoNovedadPorHoras(novedad.tipoNovedad) ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                                {novedad.tipoNovedad}
                                {esTipoNovedadPorHoras(novedad.tipoNovedad) && ' ⏰'}
                              </span>
                            </td>
                            <td>
                              <small>
                                {formatearFecha(novedad.fechaInicio)} - {formatearFecha(novedad.fechaFin)}
                                {esTipoNovedadPorHoras(novedad.tipoNovedad) && novedad.horaInicio && novedad.horaFin && (
                                  <><br />{novedad.horaInicio} - {novedad.horaFin}</>
                                )}
                              </small>
                            </td>
                            <td>
                              <span className={`badge ${esTipoNovedadPorHoras(novedad.tipoNovedad) ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                {mostrarDiasHoras(novedad)}
                              </span>
                            </td>
                            <td>${(novedad.valorTotal || 0).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${(novedad.valorPagado || 0) > 0 ? 'bg-success' : 'bg-secondary'}`}>
                                ${(novedad.valorPagado || 0).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${((novedad.valorTotal || 0) - (novedad.valorPagado || 0)) > 0 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                ${((novedad.valorTotal || 0) - (novedad.valorPagado || 0)).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${getEstadoColor(novedad.estado)}`}>
                                {getEstadoLabel(novedad.estado)}
                              </span>
                            </td>
                            <td>
                              {novedad.estadoInvestigacion ? (
                                <span className={`badge bg-${getEstadoInvestigacionColor(novedad.estadoInvestigacion)}`}>
                                  {getEstadoInvestigacionLabel(novedad.estadoInvestigacion)}
                                </span>
                              ) : (
                                requiereEstadoInvestigacion(novedad.tipoNovedad) ? (
                                  <span className="badge bg-secondary">Sin definir</span>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {novedadesConsulta.length === 0 && cedulaConsulta && (
                  <div className="alert alert-info">
                    <p className="mb-0">No se encontraron novedades para la cédula: <strong>{cedulaConsulta}</strong></p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConsulta(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Observaciones */}
      {showObservaciones && novedadSeleccionada && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">💬 Observaciones - {novedadSeleccionada.empleadoNombre}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowObservaciones(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Tipo:</strong> {novedadSeleccionada.tipoNovedad}<br />
                  <strong>Fechas:</strong> {formatearFecha(novedadSeleccionada.fechaInicio)} - {formatearFecha(novedadSeleccionada.fechaFin)}
                  {esTipoNovedadPorHoras(novedadSeleccionada.tipoNovedad) && novedadSeleccionada.horaInicio && novedadSeleccionada.horaFin && (
                    <><br /><strong>Horas:</strong> {novedadSeleccionada.horaInicio} - {novedadSeleccionada.horaFin}</>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Nueva Observación</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={nuevaObservacion}
                    onChange={(e) => setNuevaObservacion(e.target.value)}
                    placeholder="Escriba su observación aquí..."
                  />
                  <button
                    className="btn btn-primary mt-2"
                    onClick={agregarObservacion}
                    disabled={!nuevaObservacion.trim()}
                  >
                    Agregar Observación
                  </button>
                </div>

                <div>
                  <h6>Historial de Observaciones</h6>
                  {novedadSeleccionada.observaciones && novedadSeleccionada.observaciones.length > 0 ? (
                    <div className="list-group">
                      {novedadSeleccionada.observaciones.map((obs, index) => (
                        <div key={index} className="list-group-item">
                          <div className="d-flex w-100 justify-content-between">
                            <small className="text-muted">{obs.usuario}</small>
                            <small className="text-muted">{new Date(obs.fecha).toLocaleString()}</small>
                          </div>
                          <p className="mb-1">{obs.texto}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No hay observaciones registradas</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowObservaciones(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NovedadesList;