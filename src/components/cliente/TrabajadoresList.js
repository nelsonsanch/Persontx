import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const TrabajadoresList = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadoresFiltrados, setTrabajadoresFiltrados] = useState([]);
  const [perfilesCargo, setPerfilesCargo] = useState([]); // Nueva lista de perfiles de cargo
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    eps: '',
    afp: '',
    estado: '',
    cargo: '',
    cedula: '',
    nombre: ''
  });

  // Listas únicas para los dropdowns
  const [listaEPS, setListaEPS] = useState([]);
  const [listaAFP, setListaAFP] = useState([]);
  const [listaCargos, setListaCargos] = useState([]);

  const [formData, setFormData] = useState({
    tipoCedula: 'cedula_ciudadania',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    telefono: '',
    correo: '',
    eps: '',
    afp: '',
    discapacidades: '',
    enfermedadesDiagnosticadas: '',
    estado: 'activo'
  });

  // Opciones para tipo de cédula
  const tiposCedula = [
    { value: 'cedula_ciudadania', label: 'Cédula de Ciudadanía' },
    { value: 'cedula_extranjeria', label: 'Cédula de Extranjería' },
    { value: 'permiso_especial_trabajo', label: 'Permiso Especial de Trabajo' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'tarjeta_identidad', label: 'Tarjeta de Identidad' },
    { value: 'otros', label: 'Otros' }
  ];

  // Cargar trabajadores y perfiles de cargo al montar el componente
  useEffect(() => {
    cargarTrabajadores();
    cargarPerfilesCargo();
  }, []);

  // Aplicar filtros cuando cambien los trabajadores o los filtros
  useEffect(() => {
    aplicarFiltros();
  }, [trabajadores, filtros]);

  // Generar listas únicas cuando cambien los trabajadores
  useEffect(() => {
    generarListasUnicas();
  }, [trabajadores]);

  // Nueva función para cargar perfiles de cargo (CORREGIDA)
  const cargarPerfilesCargo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Usuario no autenticado');
        return;
      }

      // Consultar perfiles de cargo del usuario actual (SIN orderBy para evitar el error de índice)
      const q = query(
        collection(db, 'perfiles_cargo'),
        where('clienteId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const perfilesData = [];

      querySnapshot.forEach((doc) => {
        perfilesData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar en el cliente después de obtener los datos
      perfilesData.sort((a, b) => {
        const nombreA = (a.nombrePuesto || '').toLowerCase();
        const nombreB = (b.nombrePuesto || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
      });

      setPerfilesCargo(perfilesData);
      console.log('Perfiles de cargo cargados:', perfilesData.length);
    } catch (error) {
      console.error('Error al cargar perfiles de cargo:', error);
      // En caso de error, establecer un array vacío para que el componente no falle
      setPerfilesCargo([]);
    }
  };

  const cargarTrabajadores = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.error('Usuario no autenticado');
        setLoading(false);
        return;
      }

      // Consultar trabajadores del usuario actual
      const q = query(
        collection(db, 'trabajadores'),
        where('clienteId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const trabajadoresData = [];

      querySnapshot.forEach((doc) => {
        trabajadoresData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setTrabajadores(trabajadoresData);
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarListasUnicas = () => {
    // Generar lista única de EPS
    const epsUnicos = [...new Set(trabajadores
      .map(t => t.eps)
      .filter(eps => eps && eps.trim() !== '')
    )].sort();
    setListaEPS(epsUnicos);

    // Generar lista única de AFP
    const afpUnicos = [...new Set(trabajadores
      .map(t => t.afp)
      .filter(afp => afp && afp.trim() !== '')
    )].sort();
    setListaAFP(afpUnicos);

    // Generar lista única de Cargos
    const cargosUnicos = [...new Set(trabajadores
      .map(t => t.cargo)
      .filter(cargo => cargo && cargo.trim() !== '')
    )].sort();
    setListaCargos(cargosUnicos);
  };

  const aplicarFiltros = () => {
    let trabajadoresFiltrados = [...trabajadores];

    // Filtro por EPS
    if (filtros.eps) {
      trabajadoresFiltrados = trabajadoresFiltrados.filter(t =>
        t.eps && t.eps.toLowerCase().includes(filtros.eps.toLowerCase())
      );
    }

    // Filtro por AFP
    if (filtros.afp) {
      trabajadoresFiltrados = trabajadoresFiltrados.filter(t =>
        t.afp && t.afp.toLowerCase().includes(filtros.afp.toLowerCase())
      );
    }

    // Filtro por Estado
    if (filtros.estado) {
      trabajadoresFiltrados = trabajadoresFiltrados.filter(t =>
        t.estado === filtros.estado
      );
    }

    // Filtro por Cargo
    if (filtros.cargo) {
      trabajadoresFiltrados = trabajadoresFiltrados.filter(t =>
        t.cargo && t.cargo.toLowerCase().includes(filtros.cargo.toLowerCase())
      );
    }

    // Filtro por Cédula
    if (filtros.cedula) {
      trabajadoresFiltrados = trabajadoresFiltrados.filter(t =>
        t.numeroDocumento && t.numeroDocumento.includes(filtros.cedula)
      );
    }

    // Filtro por Nombre
    if (filtros.nombre) {
      trabajadoresFiltrados = trabajadoresFiltrados.filter(t => {
        const nombreCompleto = `${t.nombres || ''} ${t.apellidos || ''}`.toLowerCase();
        return nombreCompleto.includes(filtros.nombre.toLowerCase());
      });
    }

    setTrabajadoresFiltrados(trabajadoresFiltrados);
  };

  const limpiarFiltros = () => {
    setFiltros({
      eps: '',
      afp: '',
      estado: '',
      cargo: '',
      cedula: '',
      nombre: ''
    });
  };

  const descargarExcelFiltrado = () => {
    const datosParaExcel = trabajadoresFiltrados.map(trabajador => ({
      'Tipo de Documento': getTipoCedulaLabel(trabajador.tipoCedula),
      'Número de Documento': trabajador.numeroDocumento,
      'Nombres': trabajador.nombres,
      'Apellidos': trabajador.apellidos,
      'Nombre Completo': `${trabajador.nombres} ${trabajador.apellidos}`,
      'Cargo': trabajador.cargo,
      'Teléfono': trabajador.telefono,
      'Correo Electrónico': trabajador.correo,
      'EPS': trabajador.eps,
      'AFP': trabajador.afp,
      'Estado': trabajador.estado,
      'Discapacidades': trabajador.discapacidades,
      'Enfermedades Diagnosticadas': trabajador.enfermedadesDiagnosticadas,
      'Fecha de Creación': trabajador.fechaCreacion ? new Date(trabajador.fechaCreacion).toLocaleDateString() : '',
      'Fecha de Actualización': trabajador.fechaActualizacion ? new Date(trabajador.fechaActualizacion).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(datosParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores Filtrados');

    // Generar nombre del archivo con fecha y filtros aplicados
    const fecha = new Date().toISOString().split('T')[0];
    let nombreArchivo = `trabajadores_${fecha}`;

    const filtrosActivos = [];
    if (filtros.eps) filtrosActivos.push(`EPS-${filtros.eps}`);
    if (filtros.afp) filtrosActivos.push(`AFP-${filtros.afp}`);
    if (filtros.estado) filtrosActivos.push(`Estado-${filtros.estado}`);
    if (filtros.cargo) filtrosActivos.push(`Cargo-${filtros.cargo}`);
    if (filtros.cedula) filtrosActivos.push(`Cedula-${filtros.cedula}`);
    if (filtros.nombre) filtrosActivos.push(`Nombre-${filtros.nombre}`);

    if (filtrosActivos.length > 0) {
      nombreArchivo += `_filtrado_${filtrosActivos.join('_')}`;
    }

    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
  };

  // Función para actualizar novedades cuando se modifica un trabajador
  const actualizarNovedadesDelTrabajador = async (numeroDocumento, datosActualizados) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('Usuario no autenticado para actualizar novedades');
        return 0;
      }

      console.log('Actualizando novedades para trabajador:', numeroDocumento);

      // Buscar todas las novedades del trabajador por número de documento
      const novedadesQuery = query(
        collection(db, 'novedades'),
        where('clienteId', '==', user.uid),
        where('numeroDocumento', '==', numeroDocumento)
      );

      const novedadesSnapshot = await getDocs(novedadesQuery);

      if (novedadesSnapshot.empty) {
        console.log('No se encontraron novedades para actualizar');
        return 0;
      }

      // Preparar los datos actualizados para las novedades
      const nombreCompleto = `${datosActualizados.nombres} ${datosActualizados.apellidos}`;

      const datosParaActualizar = {
        empleadoNombre: nombreCompleto,
        fechaActualizacionEmpleado: new Date().toISOString()
      };

      // Actualizar cada novedad encontrada
      const promesasActualizacion = [];
      novedadesSnapshot.forEach((docNovedad) => {
        const promesa = updateDoc(doc(db, 'novedades', docNovedad.id), datosParaActualizar);
        promesasActualizacion.push(promesa);
      });

      await Promise.all(promesasActualizacion);

      console.log(`${novedadesSnapshot.size} novedades actualizadas exitosamente`);

      return novedadesSnapshot.size;
    } catch (error) {
      console.error('Error al actualizar novedades del trabajador:', error);
      // No lanzar el error, solo registrarlo
      return 0;
    }
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
      if (!formData.nombres || !formData.apellidos || !formData.numeroDocumento) {
        alert('Por favor complete todos los campos requeridos (nombres, apellidos y número de documento)');
        return;
      }

      // Preparar datos del trabajador (sin campos undefined)
      const trabajadorData = {
        tipoCedula: formData.tipoCedula || 'cedula_ciudadania',
        numeroDocumento: formData.numeroDocumento.toString(),
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        cargo: formData.cargo || '',
        telefono: formData.telefono || '',
        correo: formData.correo || '',
        eps: formData.eps || '',
        afp: formData.afp || '',
        discapacidades: formData.discapacidades || '',
        enfermedadesDiagnosticadas: formData.enfermedadesDiagnosticadas || '',
        estado: formData.estado || 'activo',
        clienteId: user.uid
      };

      if (editingId) {
        // Actualizar trabajador existente
        console.log('Actualizando trabajador con ID:', editingId);
        console.log('Datos a actualizar:', trabajadorData);

        // Agregar fecha de actualización
        trabajadorData.fechaActualizacion = new Date().toISOString();

        await updateDoc(doc(db, 'trabajadores', editingId), trabajadorData);
        console.log('Trabajador actualizado en Firebase');

        // Actualizar novedades relacionadas
        let novedadesActualizadas = 0;
        try {
          novedadesActualizadas = await actualizarNovedadesDelTrabajador(
            formData.numeroDocumento,
            formData
          );
        } catch (errorNovedades) {
          console.error('Error al actualizar novedades:', errorNovedades);
          // Continuar aunque falle la actualización de novedades
        }

        if (novedadesActualizadas > 0) {
          alert(`Trabajador actualizado exitosamente.\n${novedadesActualizadas} novedades también fueron actualizadas con los nuevos datos.`);
        } else {
          alert('Trabajador actualizado exitosamente.\nNo se encontraron novedades asociadas para actualizar.');
        }
      } else {
        // Crear nuevo trabajador
        console.log('Creando nuevo trabajador');
        trabajadorData.fechaCreacion = new Date().toISOString();

        await addDoc(collection(db, 'trabajadores'), trabajadorData);
        console.log('Nuevo trabajador creado en Firebase');
        alert('Trabajador creado exitosamente');
      }

      // Limpiar formulario y recargar datos
      setFormData({
        tipoCedula: 'cedula_ciudadania',
        numeroDocumento: '',
        nombres: '',
        apellidos: '',
        cargo: '',
        telefono: '',
        correo: '',
        eps: '',
        afp: '',
        discapacidades: '',
        enfermedadesDiagnosticadas: '',
        estado: 'activo',
        fechaIngreso: ''
      });
      setShowForm(false);
      setEditingId(null);

      // Recargar la lista de trabajadores
      await cargarTrabajadores();

    } catch (error) {
      console.error('Error detallado al guardar trabajador:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);

      let mensajeError = 'Error al guardar trabajador';

      if (error.code === 'permission-denied') {
        mensajeError = 'No tienes permisos para realizar esta operación';
      } else if (error.code === 'not-found') {
        mensajeError = 'El trabajador no fue encontrado';
      } else if (error.message) {
        mensajeError = `Error: ${error.message}`;
      }

      alert(mensajeError);
    }
  };

  const eliminarTrabajador = async (id, numeroDocumento) => {
    // Verificar si el trabajador tiene novedades asociadas
    try {
      const user = auth.currentUser;
      if (!user) return;

      const novedadesQuery = query(
        collection(db, 'novedades'),
        where('clienteId', '==', user.uid),
        where('numeroDocumento', '==', numeroDocumento)
      );

      const novedadesSnapshot = await getDocs(novedadesQuery);

      if (!novedadesSnapshot.empty) {
        const confirmacion = window.confirm(
          `Este trabajador tiene ${novedadesSnapshot.size} novedad(es) asociada(s).\n\n` +
          `¿Está seguro de eliminar el trabajador?\n\n` +
          `Nota: Las novedades NO se eliminarán, pero quedarán huérfanas (sin trabajador asociado).`
        );

        if (!confirmacion) return;
      } else {
        if (!window.confirm('¿Está seguro de eliminar este trabajador?')) return;
      }

      await deleteDoc(doc(db, 'trabajadores', id));
      alert('Trabajador eliminado exitosamente');
      cargarTrabajadores();
    } catch (error) {
      console.error('Error al eliminar trabajador:', error);
      alert('Error al eliminar trabajador');
    }
  };

  const editarTrabajador = (trabajador) => {
    console.log('Editando trabajador:', trabajador);
    setFormData({
      tipoCedula: trabajador.tipoCedula || 'cedula_ciudadania',
      numeroDocumento: trabajador.numeroDocumento || '',
      nombres: trabajador.nombres || '',
      apellidos: trabajador.apellidos || '',
      cargo: trabajador.cargo || '',
      telefono: trabajador.telefono || '',
      correo: trabajador.correo || '',
      eps: trabajador.eps || '',
      afp: trabajador.afp || '',
      discapacidades: trabajador.discapacidades || '',
      enfermedadesDiagnosticadas: trabajador.enfermedadesDiagnosticadas || '',
      enfermedadesDiagnosticadas: trabajador.enfermedadesDiagnosticadas || '',
      estado: trabajador.estado || 'activo',
      fechaIngreso: trabajador.fechaIngreso || ''
    });
    setEditingId(trabajador.id);
    setShowForm(true);
  };

  const descargarPlantilla = () => {
    const plantilla = [
      {
        tipoCedula: 'cedula_ciudadania',
        numeroDocumento: '12345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez García',
        cargo: 'Desarrollador',
        telefono: '3001234567',
        correo: 'juan.perez@email.com',
        eps: 'Sura EPS',
        afp: 'Protección AFP',
        discapacidades: 'Ninguna',
        enfermedadesDiagnosticadas: 'Ninguna',
        estado: 'activo'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(plantilla);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores');
    XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
  };

  const procesarArchivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Solo procesar Excel
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        procesarDatos(data);
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        alert('Error al procesar el archivo');
      }
    };

    reader.readAsBinaryString(file);
  };

  const procesarDatos = async (data) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      let procesados = 0;
      let actualizados = 0;

      for (const row of data) {
        if (row.numeroDocumento && row.nombres) {
          const trabajadorData = {
            tipoCedula: row.tipoCedula || 'cedula_ciudadania',
            numeroDocumento: row.numeroDocumento.toString(),
            nombres: row.nombres,
            apellidos: row.apellidos || '',
            cargo: row.cargo || '',
            telefono: row.telefono || '',
            correo: row.correo || '',
            eps: row.eps || '',
            afp: row.afp || '',
            discapacidades: row.discapacidades || '',
            enfermedadesDiagnosticadas: row.enfermedadesDiagnosticadas || '',
            estado: row.estado || 'activo',
            clienteId: user.uid
          };

          // Verificar si el trabajador ya existe
          const trabajadorExistente = trabajadores.find(t => t.numeroDocumento === trabajadorData.numeroDocumento);

          if (trabajadorExistente) {
            // Actualizar trabajador existente
            trabajadorData.fechaActualizacion = new Date().toISOString();
            await updateDoc(doc(db, 'trabajadores', trabajadorExistente.id), trabajadorData);

            // Actualizar novedades relacionadas
            await actualizarNovedadesDelTrabajador(
              trabajadorData.numeroDocumento,
              trabajadorData
            );

            actualizados++;
          } else {
            // Crear nuevo trabajador
            trabajadorData.fechaCreacion = new Date().toISOString();
            await addDoc(collection(db, 'trabajadores'), trabajadorData);
            procesados++;
          }
        }
      }

      alert(`Importación completada:\n${procesados} trabajadores nuevos creados\n${actualizados} trabajadores existentes actualizados`);
      cargarTrabajadores();
    } catch (error) {
      console.error('Error al importar trabajadores:', error);
      alert('Error al importar trabajadores');
    }
  };

  const getTipoCedulaLabel = (value) => {
    const tipo = tiposCedula.find(t => t.value === value);
    return tipo ? tipo.label : value;
  };

  const calcularAntiguedad = (fechaIngreso) => {
    if (!fechaIngreso) return 'No registrada';
    const fechaInicio = new Date(fechaIngreso);
    const fechaFin = new Date();

    let years = fechaFin.getFullYear() - fechaInicio.getFullYear();
    let months = fechaFin.getMonth() - fechaInicio.getMonth();

    if (months < 0 || (months === 0 && fechaFin.getDate() < fechaInicio.getDate())) {
      years--;
      months += 12;
    }

    if (fechaFin.getDate() < fechaInicio.getDate()) {
      months--;
    }

    if (years === 0 && months === 0) return 'Menos de 1 mes';

    let resultado = '';
    if (years > 0) resultado += `${years} año${years !== 1 ? 's' : ''} `;
    if (months > 0) resultado += `${months} mes${months !== 1 ? 'es' : ''}`;

    return resultado.trim();
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando trabajadores...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Gestión de Trabajadores</h3>
            <div>
              <button
                className="btn btn-success me-2"
                onClick={descargarPlantilla}
              >
                📥 Descargar Plantilla
              </button>
              <label className="btn btn-info me-2">
                📤 Cargar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={procesarArchivo}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancelar' : '➕ Nuevo Trabajador'}
              </button>
            </div>
          </div>

          {/* Sección de Filtros y Consultas */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">🔍 Filtros y Consultas</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Primera fila de filtros */}
                <div className="col-md-3 mb-3">
                  <label className="form-label">Filtrar por EPS</label>
                  <select
                    className="form-select"
                    value={filtros.eps}
                    onChange={(e) => setFiltros({ ...filtros, eps: e.target.value })}
                  >
                    <option value="">Todas las EPS</option>
                    {listaEPS.map(eps => (
                      <option key={eps} value={eps}>{eps}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label">Filtrar por AFP</label>
                  <select
                    className="form-select"
                    value={filtros.afp}
                    onChange={(e) => setFiltros({ ...filtros, afp: e.target.value })}
                  >
                    <option value="">Todas las AFP</option>
                    {listaAFP.map(afp => (
                      <option key={afp} value={afp}>{afp}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label">Filtrar por Estado</label>
                  <select
                    className="form-select"
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="col-md-3 mb-3">
                  <label className="form-label">Filtrar por Cargo</label>
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
                </div>
              </div>

              <div className="row">
                {/* Segunda fila - Consultas */}
                <div className="col-md-4 mb-3">
                  <label className="form-label">Consultar por Cédula</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ingrese número de cédula"
                    value={filtros.cedula}
                    onChange={(e) => setFiltros({ ...filtros, cedula: e.target.value })}
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Consultar por Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ingrese nombre o apellido"
                    value={filtros.nombre}
                    onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Acciones</label>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={limpiarFiltros}
                    >
                      🗑️ Limpiar Filtros
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={descargarExcelFiltrado}
                      disabled={trabajadoresFiltrados.length === 0}
                    >
                      📊 Descargar Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Información de resultados */}
              <div className="row">
                <div className="col-12">
                  <div className="alert alert-info mb-0">
                    <strong>Resultados:</strong> Se encontraron {trabajadoresFiltrados.length} trabajador(es)
                    de un total de {trabajadores.length} registrados.
                    {(filtros.eps || filtros.afp || filtros.estado || filtros.cargo || filtros.cedula || filtros.nombre) && (
                      <span className="ms-2">
                        <strong>Filtros activos:</strong>
                        {filtros.eps && <span className="badge bg-primary ms-1">EPS: {filtros.eps}</span>}
                        {filtros.afp && <span className="badge bg-primary ms-1">AFP: {filtros.afp}</span>}
                        {filtros.estado && <span className="badge bg-primary ms-1">Estado: {filtros.estado}</span>}
                        {filtros.cargo && <span className="badge bg-primary ms-1">Cargo: {filtros.cargo}</span>}
                        {filtros.cedula && <span className="badge bg-primary ms-1">Cédula: {filtros.cedula}</span>}
                        {filtros.nombre && <span className="badge bg-primary ms-1">Nombre: {filtros.nombre}</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta informativa sobre la actualización en cascada */}
          <div className="alert alert-info mb-4">
            <h6 className="alert-heading">🔄 Actualización Automática de Datos</h6>
            <p className="mb-0">
              <strong>Importante:</strong> Cuando edites los datos de un trabajador (nombre, apellidos, etc.),
              todas las novedades asociadas a ese trabajador se actualizarán automáticamente para mantener
              la consistencia de la información.
            </p>
          </div>

          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  {editingId ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </h5>
                {editingId && (
                  <small className="text-muted">
                    Al guardar los cambios, se actualizarán automáticamente todas las novedades asociadas a este trabajador.
                  </small>
                )}
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tipo de Documento *</label>
                      <select
                        className="form-select"
                        value={formData.tipoCedula}
                        onChange={(e) => setFormData({ ...formData, tipoCedula: e.target.value })}
                        required
                      >
                        {tiposCedula.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Número de Documento *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.numeroDocumento}
                        onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                        required
                        disabled={editingId} // No permitir cambiar el número de documento al editar
                      />
                      {editingId && (
                        <small className="text-muted">
                          El número de documento no se puede modificar al editar un trabajador.
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Apellidos *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Cargo</label>
                      <select
                        className="form-select"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      >
                        <option value="">Seleccionar cargo...</option>
                        {perfilesCargo.map(perfil => (
                          <option key={perfil.id} value={perfil.nombrePuesto}>
                            {perfil.nombrePuesto} - {perfil.areaDepartamento}
                          </option>
                        ))}
                      </select>
                      <small className="form-text text-muted">
                        💡 Los cargos provienen de los Perfiles de Cargo creados ({perfilesCargo.length} disponibles). Si no ves el cargo deseado, créalo primero en la sección de Perfiles de Cargo.
                      </small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Correo Electrónico</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">EPS</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.eps}
                        onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                        placeholder="Ej: Sura EPS, Nueva EPS, etc."
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">AFP</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.afp}
                        onChange={(e) => setFormData({ ...formData, afp: e.target.value })}
                        placeholder="Ej: Protección, Porvenir, etc."
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Fecha de Ingreso</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fechaIngreso}
                        onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Discapacidades</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.discapacidades}
                        onChange={(e) => setFormData({ ...formData, discapacidades: e.target.value })}
                        placeholder="Describir discapacidades si las hay, o escribir 'Ninguna'"
                      ></textarea>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Enfermedades Diagnosticadas</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.enfermedadesDiagnosticadas}
                        onChange={(e) => setFormData({ ...formData, enfermedadesDiagnosticadas: e.target.value })}
                        placeholder="Describir enfermedades diagnosticadas si las hay, o escribir 'Ninguna'"
                      ></textarea>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({
                          tipoCedula: 'cedula_ciudadania',
                          numeroDocumento: '',
                          nombres: '',
                          apellidos: '',
                          cargo: '',
                          telefono: '',
                          correo: '',
                          eps: '',
                          afp: '',
                          discapacidades: '',
                          enfermedadesDiagnosticadas: '',
                          estado: 'activo',
                          fechaIngreso: ''
                        });
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      {editingId ? 'Actualizar Trabajador' : 'Crear Trabajador'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de trabajadores */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Lista de Trabajadores</h5>
            </div>
            <div className="card-body">
              {trabajadoresFiltrados.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No se encontraron trabajadores.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Tipo Doc.</th>
                        <th>Número</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Cargo</th>
                        <th>Teléfono</th>
                        <th>EPS</th>
                        <th>AFP</th>
                        <th>Estado</th>
                        <th>Antigüedad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trabajadoresFiltrados.map((trabajador) => (
                        <tr key={trabajador.id}>
                          <td>{getTipoCedulaLabel(trabajador.tipoCedula)}</td>
                          <td>{trabajador.numeroDocumento}</td>
                          <td>{trabajador.nombres}</td>
                          <td>{trabajador.apellidos}</td>
                          <td>{trabajador.cargo}</td>
                          <td>{trabajador.telefono}</td>
                          <td>{trabajador.eps}</td>
                          <td>{trabajador.afp}</td>
                          <td>
                            <span className={`badge ${trabajador.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                              {trabajador.estado}
                            </span>
                          </td>
                          <td>{calcularAntiguedad(trabajador.fechaIngreso)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Link
                                to={`/cliente/trabajador/${trabajador.id}`}
                                className="btn btn-sm btn-outline-info"
                                title="Ver Hoja de Vida"
                              >
                                👁️
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => editarTrabajador(trabajador)}
                                title="Editar Trabajador"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => eliminarTrabajador(trabajador.id, trabajador.numeroDocumento)}
                                title="Eliminar Trabajador"
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
        </div>
      </div>
    </div>
  );
};

export default TrabajadoresList;