import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

const EMOSList = () => {
  const [emos, setEmos] = useState([]);
  const [emosFiltrados, setEmosFiltrados] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showObservaciones, setShowObservaciones] = useState(false);
  const [showVerEmo, setShowVerEmo] = useState(false);
  const [emoSeleccionado, setEmoSeleccionado] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState('');

  // Estados para el autocompletado de trabajadores
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [trabajadoresFiltrados, setTrabajadoresFiltrados] = useState([]);
  const [inputTrabajadorFocus, setInputTrabajadorFocus] = useState(false);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    cedula: '',
    estado: '',
    tipoExamen: '',
    fechaDesde: '',
    fechaHasta: '',
    centroMedico: '',
    valorMin: '',
    valorMax: ''
  });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const emosPorPagina = 10;

  const [formData, setFormData] = useState({
    numeroDocumento: '',
    trabajadorNombre: '',
    tipoExamen: '',
    fechaExamen: '',
    fechaVencimiento: '',
    centroMedico: '',
    medicoExaminador: '',
    numeroLicenciaMedica: '',
    conceptoAptitud: '',
    pruebasComplementarias: [],
    otrasPruebas: '',
    restricciones: '',
    recomendaciones: '',
    observaciones: '',
    valorExamen: '',
    monedaExamen: 'COP',
    estado: 'vigente'
  });

  // Tipos de Examen Médico Ocupacional
  const tiposExamen = [
    'Examen Médico de Ingreso',
    'Examen Médico Periódico',
    'Examen Médico de Retiro',
    'Examen Médico de Reintegro',
    'Examen Médico por Cambio de Ocupación',
    'Examen Médico Post-Incapacidad',
    'Examen Médico de Seguimiento',
    'Otros'
  ];

  // Conceptos de Aptitud
  const conceptosAptitud = [
    'Apto sin restricciones',
    'Sin concepto aun',
    'Apto con restricciones',
    'Apto con recomendaciones',
    'No apto temporal',
    'No apto definitivo',
    'Pendiente por complementarios'
  ];

  // Pruebas Complementarias Disponibles
  const pruebasComplementariasDisponibles = [
    'Audiometría',
    'Visiometría',
    'Espirometría',
    'Laboratorios',
    'Rayos X',
    'Electrocardiograma'
  ];

  // Estados de EMO
  const estadosEMO = [
    { value: 'vigente', label: 'Vigente', color: 'success' },
    { value: 'proximo_vencer', label: 'Próximo a vencer', color: 'warning' },
    { value: 'vencido', label: 'Vencido', color: 'danger' },
    { value: 'programado', label: 'Programado', color: 'info' },
    { value: 'en_proceso', label: 'En proceso', color: 'primary' }
  ];

  // Opciones de moneda
  const opcionesMoneda = [
    { value: 'COP', label: 'COP ($)', simbolo: '$' },
    { value: 'USD', label: 'USD ($)', simbolo: 'US$' },
    { value: 'EUR', label: 'EUR (€)', simbolo: '€' }
  ];

  // Función para formatear moneda
  const formatearMoneda = (valor, moneda = 'COP') => {
    if (!valor || valor === 0) return '-';
    
    const simbolo = opcionesMoneda.find(m => m.value === moneda)?.simbolo || '$';
    const numero = parseFloat(valor);
    
    if (moneda === 'COP') {
      return `${simbolo} ${numero.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `${simbolo} ${numero.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // Función para calcular estadísticas de valores
  const calcularEstadisticasValores = () => {
    const emosConValor = emosFiltrados.filter(emo => emo.valorExamen && emo.valorExamen > 0);
    
    if (emosConValor.length === 0) {
      return { total: 0, promedio: 0, minimo: 0, maximo: 0, cantidad: 0 };
    }
    
    const valores = emosConValor.map(emo => parseFloat(emo.valorExamen));
    const total = valores.reduce((sum, val) => sum + val, 0);
    const promedio = total / valores.length;
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    
    return {
      total,
      promedio,
      minimo,
      maximo,
      cantidad: emosConValor.length
    };
  };

  // Función para calcular estadísticas de estados de exámenes
  const calcularEstadisticasEstados = () => {
    const estadisticas = {
      vigente: emosFiltrados.filter(emo => emo.estado === 'vigente').length,
      proximo_vencer: emosFiltrados.filter(emo => emo.estado === 'proximo_vencer').length,
      vencido: emosFiltrados.filter(emo => emo.estado === 'vencido').length,
      programado: emosFiltrados.filter(emo => emo.estado === 'programado').length,
      en_proceso: emosFiltrados.filter(emo => emo.estado === 'en_proceso').length
    };
    
    const total = Object.values(estadisticas).reduce((sum, val) => sum + val, 0);
    
    return {
      ...estadisticas,
      total
    };
  };

  // Función para calcular estadísticas de trabajadores
  const calcularEstadisticasTrabajadores = () => {
    // Obtener trabajadores únicos por cédula
    const trabajadoresUnicos = [...new Set(trabajadores.map(t => t.numeroDocumento))];
    const totalTrabajadores = trabajadoresUnicos.length;
    
    // Obtener trabajadores que tienen EMOS (por cédula única)
    const cedulasConEmos = [...new Set(emos.map(emo => emo.numeroDocumento))];
    const trabajadoresConEmos = cedulasConEmos.length;
    const trabajadoresSinEmos = totalTrabajadores - trabajadoresConEmos;
    
    const porcentajeConEmos = totalTrabajadores > 0 ? Math.round((trabajadoresConEmos / totalTrabajadores) * 100) : 0;
    const porcentajeSinEmos = 100 - porcentajeConEmos;
    
    return {
      totalTrabajadores,
      trabajadoresConEmos,
      trabajadoresSinEmos,
      porcentajeConEmos,
      porcentajeSinEmos
    };
  };

  // Componente para gráfico de torta simple con CSS
  const GraficoTorta = ({ datos, titulo }) => {
    const total = datos.reduce((sum, item) => sum + item.valor, 0);
    
    if (total === 0) {
      return (
        <div className="text-center">
          <div className="bg-light rounded-circle mx-auto mb-2" style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-muted">Sin datos</span>
          </div>
          <h6>{titulo}</h6>
        </div>
      );
    }
    
    let acumulado = 0;
    
    return (
      <div className="text-center">
        <div 
          className="mx-auto mb-3 position-relative rounded-circle overflow-hidden"
          style={{ 
            width: '120px', 
            height: '120px',
            background: `conic-gradient(${datos.map(item => {
              const porcentaje = (item.valor / total) * 100;
              const inicio = (acumulado / total) * 360;
              acumulado += item.valor;
              const fin = (acumulado / total) * 360;
              return `${item.color} ${inicio}deg ${fin}deg`;
            }).join(', ')})`
          }}
        >
          <div 
            className="position-absolute bg-white rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              top: '15px', 
              left: '15px', 
              width: '90px', 
              height: '90px' 
            }}
          >
            <div className="text-center">
              <div className="h5 mb-0">{total}</div>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <h6 className="mb-2">{titulo}</h6>
        <div>
          {datos.map((item, index) => (
            <div key={index} className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle me-2"
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color 
                  }}
                ></div>
                <small>{item.label}</small>
              </div>
              <small className="fw-bold">{item.valor}</small>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Función para calcular estado automáticamente basado en fecha de vencimiento
  const calcularEstadoAutomatico = (fechaVencimiento) => {
    if (!fechaVencimiento) return 'programado';
    
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    const diferenciaDias = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    
    if (diferenciaDias < 0) {
      return 'vencido';
    } else if (diferenciaDias <= 30) {
      return 'proximo_vencer';
    } else {
      return 'vigente';
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    
    if (fechaString.includes('-') && fechaString.length === 10) {
      const [year, month, day] = fechaString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return fechaString;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  // Función para formatear fecha para input
  const formatearFechaParaInput = (fechaString) => {
    if (!fechaString) return '';
    
    if (fechaString.includes('-') && fechaString.length === 10) {
      return fechaString;
    }
    
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return '';
    
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Función para calcular fecha de vencimiento automática (1 año después del examen)
  const calcularFechaVencimiento = (fechaExamen) => {
    if (!fechaExamen) return '';
    
    const fecha = new Date(fechaExamen);
    fecha.setFullYear(fecha.getFullYear() + 1);
    
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Función para filtrar trabajadores basado en el texto ingresado
  const filtrarTrabajadores = (texto) => {
    if (!texto || texto.length < 1) {
      setTrabajadoresFiltrados([]);
      setMostrarDropdown(false);
      return;
    }

    const filtrados = trabajadores.filter(trabajador => {
      const nombreCompleto = `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.toLowerCase();
      const documento = (trabajador.numeroDocumento || '').toString();
      const cargo = (trabajador.cargo || '').toLowerCase();
      
      return nombreCompleto.includes(texto.toLowerCase()) ||
             documento.includes(texto) ||
             cargo.includes(texto.toLowerCase());
    }).slice(0, 10); // Limitar a 10 resultados

    setTrabajadoresFiltrados(filtrados);
    setMostrarDropdown(filtrados.length > 0);
  };

  // Función para seleccionar un trabajador del dropdown
  const seleccionarTrabajador = (trabajador) => {
    const nombreCompleto = `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim();
    
    setFormData({
      ...formData,
      numeroDocumento: trabajador.numeroDocumento || '',
      trabajadorNombre: nombreCompleto
    });

    setMostrarDropdown(false);
    setInputTrabajadorFocus(false);
  };

  // Manejador para el cambio en el input del nombre del trabajador
  const handleTrabajadorNombreChange = (e) => {
    const valor = e.target.value;
    setFormData({
      ...formData,
      trabajadorNombre: valor,
      numeroDocumento: '' // Limpiar número de documento si se escribe manualmente
    });
    filtrarTrabajadores(valor);
  };

  // Manejador para cuando el input recibe focus
  const handleTrabajadorNombreFocus = () => {
    setInputTrabajadorFocus(true);
    if (formData.trabajadorNombre) {
      filtrarTrabajadores(formData.trabajadorNombre);
    } else {
      // Mostrar los primeros 10 trabajadores si no hay texto
      setTrabajadoresFiltrados(trabajadores.slice(0, 10));
      setMostrarDropdown(trabajadores.length > 0);
    }
  };

  // Manejador para cuando el input pierde focus
  const handleTrabajadorNombreBlur = () => {
    // Retrasar el ocultado del dropdown para permitir clicks en las opciones
    setTimeout(() => {
      setMostrarDropdown(false);
      setInputTrabajadorFocus(false);
    }, 200);
  };

  // Manejador para cambios en el valor del examen
  const handleValorExamenChange = (e) => {
    const valor = e.target.value.replace(/[^\d.,]/g, ''); // Solo números, comas y puntos
    setFormData({
      ...formData,
      valorExamen: valor
    });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [emos, filtros]);

  // Auto-calcular fecha de vencimiento cuando cambia fecha de examen
  useEffect(() => {
    if (formData.fechaExamen && !editingId) {
      const fechaVenc = calcularFechaVencimiento(formData.fechaExamen);
      setFormData(prev => ({
        ...prev,
        fechaVencimiento: fechaVenc,
        estado: calcularEstadoAutomatico(fechaVenc)
      }));
    }
  }, [formData.fechaExamen, editingId]);

  // Auto-calcular estado cuando cambia fecha de vencimiento
  useEffect(() => {
    if (formData.fechaVencimiento) {
      const nuevoEstado = calcularEstadoAutomatico(formData.fechaVencimiento);
      setFormData(prev => ({
        ...prev,
        estado: nuevoEstado
      }));
    }
  }, [formData.fechaVencimiento]);

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
        where('clienteId', '==', user.uid)
      );
      const trabajadoresSnapshot = await getDocs(trabajadoresQuery);
      const trabajadoresData = [];
      trabajadoresSnapshot.forEach((doc) => {
        trabajadoresData.push({ id: doc.id, ...doc.data() });
      });
      setTrabajadores(trabajadoresData);

      // Cargar EMOS
      const emosQuery = query(
        collection(db, 'emos'),
        where('clienteId', '==', user.uid)
      );
      const emosSnapshot = await getDocs(emosQuery);
      const emosData = [];
      emosSnapshot.forEach((doc) => {
        const emoData = { id: doc.id, ...doc.data() };
        // Recalcular estado automáticamente al cargar
        if (emoData.fechaVencimiento) {
          emoData.estado = calcularEstadoAutomatico(emoData.fechaVencimiento);
        }
        emosData.push(emoData);
      });

      setEmos(emosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let emosFiltrados = [...emos];

    if (filtros.cedula) {
      emosFiltrados = emosFiltrados.filter(emo =>
        emo.numeroDocumento?.includes(filtros.cedula)
      );
    }

    if (filtros.estado) {
      emosFiltrados = emosFiltrados.filter(emo =>
        emo.estado === filtros.estado
      );
    }

    if (filtros.tipoExamen) {
      emosFiltrados = emosFiltrados.filter(emo =>
        emo.tipoExamen === filtros.tipoExamen
      );
    }

    if (filtros.fechaDesde) {
      emosFiltrados = emosFiltrados.filter(emo =>
        new Date(emo.fechaExamen) >= new Date(filtros.fechaDesde)
      );
    }

    if (filtros.fechaHasta) {
      emosFiltrados = emosFiltrados.filter(emo =>
        new Date(emo.fechaExamen) <= new Date(filtros.fechaHasta)
      );
    }

    if (filtros.centroMedico) {
      emosFiltrados = emosFiltrados.filter(emo =>
        emo.centroMedico?.toLowerCase().includes(filtros.centroMedico.toLowerCase())
      );
    }

    if (filtros.valorMin) {
      emosFiltrados = emosFiltrados.filter(emo =>
        parseFloat(emo.valorExamen || 0) >= parseFloat(filtros.valorMin)
      );
    }

    if (filtros.valorMax) {
      emosFiltrados = emosFiltrados.filter(emo =>
        parseFloat(emo.valorExamen || 0) <= parseFloat(filtros.valorMax)
      );
    }

    setEmosFiltrados(emosFiltrados);
    setPaginaActual(1);
  };

  const buscarTrabajador = async () => {
    if (!formData.numeroDocumento) {
      alert('Por favor ingrese un número de documento');
      return;
    }

    const trabajadorEncontrado = trabajadores.find(
      trabajador => trabajador.numeroDocumento === formData.numeroDocumento
    );

    if (trabajadorEncontrado) {
      const nombreCompleto = `${trabajadorEncontrado.nombres || ''} ${trabajadorEncontrado.apellidos || ''}`.trim();
      setFormData({
        ...formData,
        trabajadorNombre: nombreCompleto
      });
    } else {
      alert('Trabajador no encontrado. Verifique el número de documento.');
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      numeroDocumento: '',
      trabajadorNombre: '',
      tipoExamen: '',
      fechaExamen: '',
      fechaVencimiento: '',
      centroMedico: '',
      medicoExaminador: '',
      numeroLicenciaMedica: '',
      conceptoAptitud: '',
      pruebasComplementarias: [],
      otrasPruebas: '',
      restricciones: '',
      recomendaciones: '',
      observaciones: '',
      valorExamen: '',
      monedaExamen: 'COP',
      estado: 'vigente'
    });
    setMostrarDropdown(false);
    setTrabajadoresFiltrados([]);
  };

  const handlePruebaComplementariaChange = (prueba) => {
    const pruebasActuales = [...formData.pruebasComplementarias];
    const index = pruebasActuales.indexOf(prueba);
    
    if (index > -1) {
      pruebasActuales.splice(index, 1);
    } else {
      pruebasActuales.push(prueba);
    }
    
    setFormData({
      ...formData,
      pruebasComplementarias: pruebasActuales
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Usuario no autenticado');
        return;
      }

      // Validar campos requeridos
      if (!formData.numeroDocumento || !formData.trabajadorNombre || !formData.tipoExamen || 
          !formData.fechaExamen || !formData.conceptoAptitud) {
        alert('Por favor complete los campos obligatorios');
        return;
      }

      const emoData = {
        ...formData,
        valorExamen: formData.valorExamen ? parseFloat(formData.valorExamen.replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
        clienteId: user.uid,
        fechaCreacion: editingId ? emos.find(e => e.id === editingId)?.fechaCreacion : new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        estado: calcularEstadoAutomatico(formData.fechaVencimiento),
        observacionesHistoricas: editingId ? (emos.find(e => e.id === editingId)?.observacionesHistoricas || []) : []
      };

      if (editingId) {
        await updateDoc(doc(db, 'emos', editingId), emoData);
        alert('EMO actualizado exitosamente');
      } else {
        await addDoc(collection(db, 'emos'), emoData);
        alert('EMO registrado exitosamente');
      }

      setShowForm(false);
      setEditingId(null);
      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar EMO:', error);
      alert('Error al guardar el EMO');
    }
  };

  const editarEmo = (emo) => {
    setFormData({
      numeroDocumento: emo.numeroDocumento || '',
      trabajadorNombre: emo.trabajadorNombre || '',
      tipoExamen: emo.tipoExamen || '',
      fechaExamen: formatearFechaParaInput(emo.fechaExamen) || '',
      fechaVencimiento: formatearFechaParaInput(emo.fechaVencimiento) || '',
      centroMedico: emo.centroMedico || '',
      medicoExaminador: emo.medicoExaminador || '',
      numeroLicenciaMedica: emo.numeroLicenciaMedica || '',
      conceptoAptitud: emo.conceptoAptitud || '',
      pruebasComplementarias: emo.pruebasComplementarias || [],
      otrasPruebas: emo.otrasPruebas || '',
      restricciones: emo.restricciones || '',
      recomendaciones: emo.recomendaciones || '',
      observaciones: emo.observaciones || '',
      valorExamen: emo.valorExamen ? emo.valorExamen.toString() : '',
      monedaExamen: emo.monedaExamen || 'COP',
      estado: emo.estado || 'vigente'
    });
    setEditingId(emo.id);
    setShowForm(true);
  };

  const eliminarEmo = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este EMO?')) {
      try {
        await deleteDoc(doc(db, 'emos', id));
        alert('EMO eliminado exitosamente');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar EMO:', error);
        alert('Error al eliminar el EMO');
      }
    }
  };

  const verEmo = (emo) => {
    setEmoSeleccionado(emo);
    setShowVerEmo(true);
  };

  const agregarObservacion = async () => {
    if (!nuevaObservacion.trim()) {
      alert('Por favor escriba una observación');
      return;
    }

    try {
      const user = auth.currentUser;
      const nuevaObs = {
        texto: nuevaObservacion,
        fecha: new Date().toISOString(),
        usuario: user.email
      };

      const observacionesActuales = emoSeleccionado.observacionesHistoricas || [];
      const observacionesActualizadas = [...observacionesActuales, nuevaObs];

      await updateDoc(doc(db, 'emos', emoSeleccionado.id), {
        observacionesHistoricas: observacionesActualizadas
      });

      setEmoSeleccionado({
        ...emoSeleccionado,
        observacionesHistoricas: observacionesActualizadas
      });

      setNuevaObservacion('');
      cargarDatos();
      alert('Observación agregada exitosamente');
    } catch (error) {
      console.error('Error al agregar observación:', error);
      alert('Error al agregar la observación');
    }
  };

  const contarObservaciones = (emo) => {
    return emo.observacionesHistoricas ? emo.observacionesHistoricas.length : 0;
  };

  const exportarExcel = () => {
    const datosExport = emosFiltrados.map(emo => ({
      'Número Documento': emo.numeroDocumento,
      'Trabajador': emo.trabajadorNombre,
      'Tipo Examen': emo.tipoExamen,
      'Fecha Examen': formatearFecha(emo.fechaExamen),
      'Fecha Vencimiento': formatearFecha(emo.fechaVencimiento),
      'Centro Médico': emo.centroMedico,
      'Médico Examinador': emo.medicoExaminador,
      'Licencia Médica': emo.numeroLicenciaMedica,
      'Concepto Aptitud': emo.conceptoAptitud,
      'Valor Examen': emo.valorExamen || 0,
      'Moneda': emo.monedaExamen || 'COP',
      'Valor Formateado': formatearMoneda(emo.valorExamen, emo.monedaExamen),
      'Pruebas Complementarias': emo.pruebasComplementarias?.join(', ') || '',
      'Otras Pruebas': emo.otrasPruebas,
      'Estado': getEstadoLabel(emo.estado),
      'Restricciones': emo.restricciones,
      'Recomendaciones': emo.recomendaciones,
      'Observaciones': emo.observaciones
    }));

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EMOS');
    
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `emos_con_indicadores_${fecha}.xlsx`);
  };

  const getEstadoLabel = (estado) => {
    const estadoObj = estadosEMO.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  const getEstadoColor = (estado) => {
    const estadoObj = estadosEMO.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : 'secondary';
  };

  // Cálculos para paginación
  const indiceInicio = (paginaActual - 1) * emosPorPagina;
  const indiceFin = indiceInicio + emosPorPagina;
  const emosPaginados = emosFiltrados.slice(indiceInicio, indiceFin);
  const totalPaginas = Math.ceil(emosFiltrados.length / emosPorPagina);

  // Calcular estadísticas
  const estadisticasValores = calcularEstadisticasValores();
  const estadisticasEstados = calcularEstadisticasEstados();
  const estadisticasTrabajadores = calcularEstadisticasTrabajadores();

  // Preparar datos para gráficos
  const datosGraficoEstados = [
    { label: 'Vigentes', valor: estadisticasEstados.vigente, color: '#198754' },
    { label: 'Próx. a vencer', valor: estadisticasEstados.proximo_vencer, color: '#ffc107' },
    { label: 'Vencidos', valor: estadisticasEstados.vencido, color: '#dc3545' },
    { label: 'Programados', valor: estadisticasEstados.programado, color: '#0dcaf0' },
    { label: 'En proceso', valor: estadisticasEstados.en_proceso, color: '#0d6efd' }
  ].filter(item => item.valor > 0);

  const datosGraficoTrabajadores = [
    { label: 'Con EMOS', valor: estadisticasTrabajadores.trabajadoresConEmos, color: '#198754' },
    { label: 'Sin EMOS', valor: estadisticasTrabajadores.trabajadoresSinEmos, color: '#6c757d' }
  ].filter(item => item.valor > 0);

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
        <h2>🏥 Gestión de Exámenes Médicos Ocupacionales (EMOS)</h2>
        <div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              limpiarFormulario();
              setShowForm(true);
            }}
          >
            ➕ Nuevo EMO
          </button>
        </div>
      </div>

      {/* Panel de Indicadores Mejorado */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">📊 Indicadores del Sistema</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Indicadores de Valores */}
            <div className="col-lg-6 mb-4">
              <h6 className="text-primary mb-3">💰 Indicadores Económicos</h6>
              <div className="row">
                <div className="col-md-6 mb-3 text-center">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-success">Total Invertido</h6>
                    <h4 className="text-success mb-1">{formatearMoneda(estadisticasValores.total, 'COP')}</h4>
                    <small className="text-muted">Inversión total en EMOS</small>
                  </div>
                </div>
                <div className="col-md-6 mb-3 text-center">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-info">Promedio por EMO</h6>
                    <h5 className="text-info mb-1">{formatearMoneda(estadisticasValores.promedio, 'COP')}</h5>
                    <small className="text-muted">Costo promedio</small>
                  </div>
                </div>
                <div className="col-md-6 mb-3 text-center">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-secondary">Valor Mínimo</h6>
                    <h6 className="text-secondary mb-1">{formatearMoneda(estadisticasValores.minimo, 'COP')}</h6>
                    <small className="text-muted">Menor costo registrado</small>
                  </div>
                </div>
                <div className="col-md-6 mb-3 text-center">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-secondary">Valor Máximo</h6>
                    <h6 className="text-secondary mb-1">{formatearMoneda(estadisticasValores.maximo, 'COP')}</h6>
                    <small className="text-muted">Mayor costo registrado</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Estados de EMOS */}
            <div className="col-lg-3 mb-4">
              <h6 className="text-primary mb-3">📈 Estados de EMOS</h6>
              <GraficoTorta 
                datos={datosGraficoEstados}
                titulo="Estados de Exámenes"
              />
            </div>

            {/* Indicador de Trabajadores */}
            <div className="col-lg-3 mb-4">
              <h6 className="text-primary mb-3">👥 Cobertura de Trabajadores</h6>
              <div className="text-center mb-3">
                <div className="border rounded p-3 mb-3">
                  <h4 className="text-primary mb-1">{estadisticasTrabajadores.totalTrabajadores}</h4>
                  <small className="text-muted">Total Trabajadores</small>
                </div>
                <div className="border rounded p-2 mb-2">
                  <strong className="text-success">{estadisticasTrabajadores.trabajadoresConEmos}</strong>
                  <small className="text-muted d-block">Con EMOS ({estadisticasTrabajadores.porcentajeConEmos}%)</small>
                </div>
                <div className="border rounded p-2">
                  <strong className="text-secondary">{estadisticasTrabajadores.trabajadoresSinEmos}</strong>
                  <small className="text-muted d-block">Sin EMOS ({estadisticasTrabajadores.porcentajeSinEmos}%)</small>
                </div>
              </div>
                         </div>
          </div>
        </div>
      </div>

           {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🔍 Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-2">
              <label className="form-label">Cédula</label>
              <input
                type="text"
                className="form-control"
                placeholder="Número de cédula"
                value={filtros.cedula}
                onChange={(e) => setFiltros({...filtros, cedula: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos</option>
                {estadosEMO.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Tipo Examen</label>
              <select
                className="form-select"
                value={filtros.tipoExamen}
                onChange={(e) => setFiltros({...filtros, tipoExamen: e.target.value})}
              >
                <option value="">Todos</option>
                {tiposExamen.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Centro Médico</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre centro"
                value={filtros.centroMedico}
                onChange={(e) => setFiltros({...filtros, centroMedico: e.target.value})}
              />
            </div>
          
            <div className="col-md-2">
              <label className="form-label"></label>
              <input
                type="number"
                className="form-control"
                placeholder="999999"
                value={filtros.valorMax}
                onChange={(e) => setFiltros({...filtros, valorMax: e.target.value})}
              />
            </div>
            <div className="col-md-8 d-flex align-items-end">
                <label className="form-label"></label>
              <button 
                className="btn btn-success me-2"
                onClick={exportarExcel}
              >
                📊 Exportar Excel
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setFiltros({
                  cedula: '',
                  estado: '',
                  tipoExamen: '',
                  fechaDesde: '',
                  fechaHasta: '',
                  centroMedico: '',
                  valorMin: '',
                  valorMax: ''
                })}
              >
                🔄 Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de EMOS */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">🏥 Lista de EMOS ({emosFiltrados.length} registros)</h5>
        </div>
        <div className="card-body">
          {emosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No hay EMOS registrados</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Cédula</th>
                      <th>Trabajador</th>
                      <th>Tipo Examen</th>
                      <th>Fecha Examen</th>
                      <th>Fecha Vencimiento</th>
                      <th>Centro Médico</th>
                      <th>Valor</th>
                      <th>Concepto Aptitud</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emosPaginados.map((emo) => (
                      <tr key={emo.id}>
                        <td>{emo.numeroDocumento}</td>
                        <td>{emo.trabajadorNombre}</td>
                        <td>
                          <span className="badge bg-info text-dark">
                            {emo.tipoExamen}
                          </span>
                        </td>
                        <td>
                          <small>{formatearFecha(emo.fechaExamen)}</small>
                        </td>
                        <td>
                          <small>{formatearFecha(emo.fechaVencimiento)}</small>
                        </td>
                        <td>
                          <small>{emo.centroMedico}</small>
                        </td>
                        <td>
                          <strong className="text-success">
                            {formatearMoneda(emo.valorExamen, emo.monedaExamen)}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${emo.conceptoAptitud?.includes('Apto') ? 'bg-success' : 'bg-warning'}`}>
                            {emo.conceptoAptitud}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${getEstadoColor(emo.estado)}`}>
                            {getEstadoLabel(emo.estado)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => verEmo(emo)}
                              title="Ver examen completo"
                            >
                              👁️
                            </button>
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => editarEmo(emo)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-outline-info position-relative"
                              onClick={() => {
                                setEmoSeleccionado(emo);
                                setShowObservaciones(true);
                              }}
                              title="Ver observaciones"
                            >
                              💬
                              {contarObservaciones(emo) > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                  {contarObservaciones(emo)}
                                  <span className="visually-hidden">observaciones</span>
                                </span>
                              )}
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => eliminarEmo(emo.id)}
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
                <nav className="mt-3">
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

      {/* Modal para Ver EMO Completo */}
      {showVerEmo && emoSeleccionado && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">👁️ Ver Examen Médico Ocupacional Completo</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowVerEmo(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Información del Trabajador */}
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">👤 Información del Trabajador</h6>
                      </div>
                      <div className="card-body">
                        <p><strong>Número de Documento:</strong> {emoSeleccionado.numeroDocumento}</p>
                        <p><strong>Nombre:</strong> {emoSeleccionado.trabajadorNombre}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información del Examen */}
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">🏥 Información del Examen</h6>
                      </div>
                      <div className="card-body">
                        <p><strong>Tipo de Examen:</strong> <span className="badge bg-info">{emoSeleccionado.tipoExamen}</span></p>
                        <p><strong>Fecha del Examen:</strong> {formatearFecha(emoSeleccionado.fechaExamen)}</p>
                        <p><strong>Fecha de Vencimiento:</strong> {formatearFecha(emoSeleccionado.fechaVencimiento)}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`badge bg-${getEstadoColor(emoSeleccionado.estado)} ms-2`}>
                            {getEstadoLabel(emoSeleccionado.estado)}
                          </span>
                        </p>
                        <p><strong>Valor del Examen:</strong> 
                          <span className="text-success fw-bold ms-2">
                            {formatearMoneda(emoSeleccionado.valorExamen, emoSeleccionado.monedaExamen)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información del Centro Médico */}
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">🏢 Centro Médico</h6>
                      </div>
                      <div className="card-body">
                        <p><strong>Centro Médico:</strong> {emoSeleccionado.centroMedico || 'No especificado'}</p>
                        <p><strong>Médico Examinador:</strong> {emoSeleccionado.medicoExaminador || 'No especificado'}</p>
                        <p><strong>Licencia Médica:</strong> {emoSeleccionado.numeroLicenciaMedica || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resultado del Examen */}
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-header bg-warning text-dark">
                        <h6 className="mb-0">📋 Resultado del Examen</h6>
                      </div>
                      <div className="card-body">
                        <p><strong>Concepto de Aptitud:</strong> 
                          <span className={`badge ms-2 ${emoSeleccionado.conceptoAptitud?.includes('Apto') ? 'bg-success' : 'bg-warning'}`}>
                            {emoSeleccionado.conceptoAptitud}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pruebas Complementarias */}
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-header bg-secondary text-white">
                        <h6 className="mb-0">🔬 Pruebas Complementarias</h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8">
                            <p><strong>Pruebas realizadas:</strong></p>
                            {emoSeleccionado.pruebasComplementarias && emoSeleccionado.pruebasComplementarias.length > 0 ? (
                              <ul className="list-unstyled">
                                {emoSeleccionado.pruebasComplementarias.map((prueba, index) => (
                                  <li key={index}>
                                    <span className="badge bg-light text-dark me-2">✓</span>
                                    {prueba}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted">No se especificaron pruebas complementarias</p>
                            )}
                          </div>
                          <div className="col-md-4">
                            <p><strong>Otras pruebas:</strong></p>
                            <p className="text-muted">{emoSeleccionado.otrasPruebas || 'No especificado'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restricciones, Recomendaciones y Observaciones */}
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-header bg-dark text-white">
                        <h6 className="mb-0">📝 Restricciones, Recomendaciones y Observaciones</h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-4">
                            <h6 className="text-danger">⚠️ Restricciones:</h6>
                            <p className="text-muted">{emoSeleccionado.restricciones || 'No hay restricciones especificadas'}</p>
                          </div>
                          <div className="col-md-4">
                            <h6 className="text-info">💡 Recomendaciones:</h6>
                            <p className="text-muted">{emoSeleccionado.recomendaciones || 'No hay recomendaciones especificadas'}</p>
                          </div>
                          <div className="col-md-4">
                            <h6 className="text-secondary">📄 Observaciones:</h6>
                            <p className="text-muted">{emoSeleccionado.observaciones || 'No hay observaciones especificadas'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información del Sistema */}
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">⚙️ Información del Sistema</h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-4">
                            <p><strong>Fecha de Creación:</strong> 
                              <small className="text-muted d-block">
                                {emoSeleccionado.fechaCreacion ? 
                                  new Date(emoSeleccionado.fechaCreacion).toLocaleString() : 
                                  'No disponible'}
                              </small>
                            </p>
                          </div>
                          <div className="col-md-4">
                            <p><strong>Última Actualización:</strong> 
                              <small className="text-muted d-block">
                                {emoSeleccionado.fechaActualizacion ? 
                                  new Date(emoSeleccionado.fechaActualizacion).toLocaleString() : 
                                  'No disponible'}
                              </small>
                            </p>
                          </div>
                          <div className="col-md-4">
                            <p><strong>Observaciones Históricas:</strong> 
                              <span className="badge bg-primary ms-2">
                                {contarObservaciones(emoSeleccionado)} registradas
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowVerEmo(false)}
                >
                  Cerrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowVerEmo(false);
                    editarEmo(emoSeleccionado);
                  }}
                >
                  ✏️ Editar EMO
                </button>
                <button 
                  type="button" 
                  className="btn btn-info"
                  onClick={() => {
                    setShowVerEmo(false);
                    setShowObservaciones(true);
                  }}
                >
                  💬 Ver Observaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nuevo/Editar EMO */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? '✏️ Editar EMO' : '➕ Nuevo EMO'}
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
                  {/* Información del Trabajador */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">👤 Información del Trabajador</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4">
                          <label className="form-label">Número de Documento *</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              value={formData.numeroDocumento}
                              onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})}
                              placeholder="Ej: 12345678"
                              required
                            />
                            <button 
                              type="button" 
                              className="btn btn-outline-primary"
                              onClick={buscarTrabajador}
                            >
                              🔍 Buscar
                            </button>
                          </div>
                          <small className="text-muted">Buscar por número de documento</small>
                        </div>
                        <div className="col-md-8">
                          <label className="form-label">Nombre del Trabajador * 
                            <small className="text-info">(Escriba para buscar)</small>
                          </label>
                          <div className="position-relative">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Escriba el nombre del trabajador..."
                              value={formData.trabajadorNombre}
                              onChange={handleTrabajadorNombreChange}
                              onFocus={handleTrabajadorNombreFocus}
                              onBlur={handleTrabajadorNombreBlur}
                              required
                              autoComplete="off"
                            />
                            
                            {/* Dropdown de trabajadores */}
                            {mostrarDropdown && trabajadoresFiltrados.length > 0 && (
                              <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '300px', overflowY: 'auto', position: 'absolute', top: '100%', zIndex: 1050 }}>
                                {trabajadoresFiltrados.map((trabajador) => {
                                  const nombreCompleto = `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim();
                                  return (
                                    <button
                                      key={trabajador.id}
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => seleccionarTrabajador(trabajador)}
                                      style={{ 
                                        cursor: 'pointer',
                                        whiteSpace: 'normal',
                                        padding: '12px 16px'
                                      }}
                                    >
                                      <div>
                                        <strong>{nombreCompleto}</strong>
                                        <br />
                                        <small className="text-muted">
                                          📄 {trabajador.numeroDocumento} • 
                                          💼 {trabajador.cargo || 'N/A'} • 
                                          🏢 {trabajador.departamento || 'N/A'}
                                        </small>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Mensaje cuando no hay resultados */}
                            {inputTrabajadorFocus && formData.trabajadorNombre && trabajadoresFiltrados.length === 0 && (
                              <div className="dropdown-menu show w-100 mt-1" style={{ position: 'absolute', top: '100%', zIndex: 1050 }}>
                                <div className="dropdown-item-text text-muted">
                                  No se encontraron trabajadores
                                </div>
                              </div>
                            )}
                          </div>
                          <small className="text-muted">
                            💡 Puede buscar por nombre, documento o cargo
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información del Examen */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">🏥 Información del Examen</h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label">Tipo de Examen *</label>
                          <select
                            className="form-select"
                            value={formData.tipoExamen}
                            onChange={(e) => setFormData({...formData, tipoExamen: e.target.value})}
                            required
                          >
                            <option value="">Seleccione un tipo</option>
                            {tiposExamen.map(tipo => (
                              <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Concepto de Aptitud *</label>
                          <select
                            className="form-select"
                            value={formData.conceptoAptitud}
                            onChange={(e) => setFormData({...formData, conceptoAptitud: e.target.value})}
                            required
                          >
                            <option value="">Seleccione concepto</option>
                            {conceptosAptitud.map(concepto => (
                              <option key={concepto} value={concepto}>{concepto}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label">Fecha del Examen *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.fechaExamen}
                            onChange={(e) => setFormData({...formData, fechaExamen: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Fecha de Vencimiento *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.fechaVencimiento}
                            onChange={(e) => setFormData({...formData, fechaVencimiento: e.target.value})}
                            required
                          />
                          <small className="text-muted">Se calcula automáticamente (1 año después del examen)</small>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label">Centro Médico</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nombre del centro médico"
                            value={formData.centroMedico}
                            onChange={(e) => setFormData({...formData, centroMedico: e.target.value})}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Médico Examinador</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nombre del médico examinador"
                            value={formData.medicoExaminador}
                            onChange={(e) => setFormData({...formData, medicoExaminador: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label">Número de Licencia Médica</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Número de licencia del médico"
                            value={formData.numeroLicenciaMedica}
                            onChange={(e) => setFormData({...formData, numeroLicenciaMedica: e.target.value})}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Estado</label>
                          <select
                            className="form-select"
                            value={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                          >
                            {estadosEMO.map(estado => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted">Se calcula automáticamente según fecha de vencimiento</small>
                        </div>
                      </div>

                      {/* Nueva sección para Valor del Examen */}
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label className="form-label">Valor del Examen 💰</label>
                          <div className="input-group">
                            <span className="input-group-text">
                              {opcionesMoneda.find(m => m.value === formData.monedaExamen)?.simbolo || '$'}
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="0"
                              value={formData.valorExamen}
                              onChange={handleValorExamenChange}
                            />
                          </div>
                          <small className="text-muted">Costo del examen médico</small>
                        </div>
                        <div className="col-md-2">
                          <label className="form-label">Moneda</label>
                          <select
                            className="form-select"
                            value={formData.monedaExamen}
                            onChange={(e) => setFormData({...formData, monedaExamen: e.target.value})}
                          >
                            {opcionesMoneda.map(moneda => (
                              <option key={moneda.value} value={moneda.value}>
                                {moneda.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Vista Previa</label>
                          <div className="form-control-plaintext">
                            <strong className="text-success h5">
                              {formData.valorExamen ? 
                                formatearMoneda(formData.valorExamen.replace(/[^\d.,]/g, '').replace(',', '.'), formData.monedaExamen) : 
                                'Sin valor asignado'
                              }
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pruebas Complementarias */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">🔬 Pruebas Complementarias Realizadas</h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        {pruebasComplementariasDisponibles.map(prueba => (
                          <div key={prueba} className="col-md-4 col-sm-6 mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`prueba-${prueba}`}
                                checked={formData.pruebasComplementarias.includes(prueba)}
                                onChange={() => handlePruebaComplementariaChange(prueba)}
                              />
                              <label className="form-check-label" htmlFor={`prueba-${prueba}`}>
                                {prueba}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="row">
                        <div className="col-12">
                          <label className="form-label">Otras pruebas complementarias</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Especifique otras pruebas realizadas"
                            value={formData.otrasPruebas}
                            onChange={(e) => setFormData({...formData, otrasPruebas: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restricciones, Recomendaciones y Observaciones */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">📝 Restricciones, Recomendaciones y Observaciones</h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label className="form-label">Restricciones</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Restricciones laborales identificadas"
                            value={formData.restricciones}
                            onChange={(e) => setFormData({...formData, restricciones: e.target.value})}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Recomendaciones</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Recomendaciones médicas"
                            value={formData.recomendaciones}
                            onChange={(e) => setFormData({...formData, recomendaciones: e.target.value})}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Observaciones</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Observaciones generales"
                            value={formData.observaciones}
                            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vista previa del estado y valor */}
                  <div className="alert alert-info">
                    <h6>📊 Vista previa:</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <strong>Estado calculado:</strong> 
                        <span className={`badge bg-${getEstadoColor(formData.estado)} ms-2`}>
                          {getEstadoLabel(formData.estado)}
                        </span>
                      </div>
                      <div className="col-md-4">
                        <strong>Vigencia:</strong> 
                        {formData.fechaVencimiento && (
                          <span className="ms-2">
                            Hasta {formatearFecha(formData.fechaVencimiento)}
                          </span>
                        )}
                      </div>
                      <div className="col-md-4">
                        <strong>Valor:</strong>
                        <span className="ms-2 text-success">
                          {formData.valorExamen ? 
                            formatearMoneda(formData.valorExamen.replace(/[^\d.,]/g, '').replace(',', '.'), formData.monedaExamen) : 
                            'Sin asignar'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-secondary me-2"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        limpiarFormulario();
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingId ? 'Actualizar EMO' : 'Registrar EMO'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Observaciones */}
      {showObservaciones && emoSeleccionado && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">💬 Observaciones - {emoSeleccionado.trabajadorNombre}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowObservaciones(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Tipo:</strong> {emoSeleccionado.tipoExamen}<br/>
                  <strong>Fecha:</strong> {formatearFecha(emoSeleccionado.fechaExamen)}<br/>
                  <strong>Valor:</strong> <span className="text-success">{formatearMoneda(emoSeleccionado.valorExamen, emoSeleccionado.monedaExamen)}</span><br/>
                  <strong>Estado:</strong> 
                  <span className={`badge bg-${getEstadoColor(emoSeleccionado.estado)} ms-2`}>
                    {getEstadoLabel(emoSeleccionado.estado)}
                  </span>
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
                  >
                    Agregar Observación
                  </button>
                </div>

                <div>
                  <h6>Historial de Observaciones</h6>
                  {emoSeleccionado.observacionesHistoricas && emoSeleccionado.observacionesHistoricas.length > 0 ? (
                    <div className="list-group">
                      {emoSeleccionado.observacionesHistoricas.map((obs, index) => (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EMOSList;
