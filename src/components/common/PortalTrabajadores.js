import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  limit
} from 'firebase/firestore';
import FormularioEncuesta_COMPLETO from '../encuestas/FormularioEncuesta_COMPLETO';

const PortalTrabajadores = () => {
  // Estados principales
  const [step, setStep] = useState('login'); // login, encuesta, completada
  const [trabajador, setTrabajador] = useState(null);
  const [encuestaActiva, setEncuestaActiva] = useState(null);
  const [respuestaExistente, setRespuestaExistente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados del formulario de login
  const [loginData, setLoginData] = useState({
    cedula: '',
    codigo: ''
  });

  // Función para autenticar trabajador
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { cedula, codigo } = loginData;

      if (!cedula || !codigo) {
        setError('Por favor ingrese su cédula y código de acceso');
        setLoading(false);
        return;
      }

      console.log('🔍 Buscando trabajador con cédula:', cedula);

      // CORRECCIÓN: Usar query directo con LIMIT 1 para cumplir reglas de seguridad
      const trabajadoresQuery = query(
        collection(db, 'trabajadores'),
        where('numeroDocumento', '==', cedula),
        limit(1) // IMPORTANTE: Requerido por la regla de seguridad
      );

      const trabajadoresSnapshot = await getDocs(trabajadoresQuery);

      if (trabajadoresSnapshot.empty) {
        setError('No se encontró un trabajador con esa cédula');
        setLoading(false);
        return;
      }

      const trabajadorData = {
        id: trabajadoresSnapshot.docs[0].id,
        ...trabajadoresSnapshot.docs[0].data()
      };

      console.log('✅ Trabajador encontrado:', trabajadorData);

      // Validar código de acceso (por ahora, mismo que la cédula)
      if (codigo !== cedula) {
        setError('Código de acceso incorrecto');
        setLoading(false);
        return;
      }

      // Buscar encuestas activas para este trabajador
      const encuestasQuery = query(
        collection(db, 'encuestas_salud'),
        where('clienteId', '==', trabajadorData.clienteId),
        where('estado', '==', 'activa'),
        limit(20) // Requerido por reglas de seguridad
      );

      const encuestasSnapshot = await getDocs(encuestasQuery);
      let encuestaParaTrabajador = null;

      console.log('🔍 Buscando encuestas activas para clienteId:', trabajadorData.clienteId);
      console.log('📊 Encuestas encontradas:', encuestasSnapshot.docs.length);

      // Buscar encuesta que incluya a este trabajador
      for (const encuestaDoc of encuestasSnapshot.docs) {
        const encuestaData = encuestaDoc.data();
        console.log('🔍 Revisando encuesta:', encuestaData.titulo, 'Trabajadores:', encuestaData.trabajadoresSeleccionados);

        if (encuestaData.trabajadoresSeleccionados?.includes(trabajadorData.id)) {
          encuestaParaTrabajador = {
            id: encuestaDoc.id,
            ...encuestaData
          };
          console.log('✅ Encuesta encontrada para el trabajador:', encuestaParaTrabajador.titulo);
          break;
        }
      }

      if (!encuestaParaTrabajador) {
        setError('No tiene encuestas asignadas en este momento');
        setLoading(false);
        return;
      }

      // Verificar si ya tiene una respuesta para esta encuesta
      const respuestasQuery = query(
        collection(db, 'respuestas_encuestas'),
        where('encuestaId', '==', encuestaParaTrabajador.id),
        where('trabajadorId', '==', trabajadorData.id)
      );

      const respuestasSnapshot = await getDocs(respuestasQuery);
      let respuestaExistente = null;

      if (!respuestasSnapshot.empty) {
        respuestaExistente = {
          id: respuestasSnapshot.docs[0].id,
          ...respuestasSnapshot.docs[0].data()
        };
        console.log('📝 Respuesta existente encontrada:', respuestaExistente.estado);
      }

      // Establecer estados
      setTrabajador(trabajadorData);
      setEncuestaActiva(encuestaParaTrabajador);
      setRespuestaExistente(respuestaExistente);

      // Determinar siguiente paso
      if (respuestaExistente && respuestaExistente.estado === 'completada') {
        setStep('completada');
      } else {
        setStep('encuesta');
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      setError('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar respuesta de encuesta
  const handleGuardarRespuesta = async (respuestas, estado = 'en_progreso') => {
    try {
      const respuestaData = {
        encuestaId: encuestaActiva.id,
        trabajadorId: trabajador.id,
        clienteId: trabajador.clienteId,
        respuestas: respuestas,
        estado: estado,
        fechaRespuesta: new Date(),
        fechaUltimaModificacion: new Date()
      };

      if (respuestaExistente) {
        // Actualizar respuesta existente
        await updateDoc(doc(db, 'respuestas_encuestas', respuestaExistente.id), {
          ...respuestaData,
          fechaUltimaModificacion: new Date()
        });
      } else {
        // Crear nueva respuesta
        const docRef = await addDoc(collection(db, 'respuestas_encuestas'), respuestaData);
        setRespuestaExistente({ id: docRef.id, ...respuestaData });
      }

      if (estado === 'completada') {
        setStep('completada');
      }

      return { success: true };

    } catch (error) {
      console.error('Error guardando respuesta:', error);
      return { success: false, error: error.message };
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setStep('login');
    setTrabajador(null);
    setEncuestaActiva(null);
    setRespuestaExistente(null);
    setLoginData({ cedula: '', codigo: '' });
    setError('');
  };

  // Renderizar vista de login
  const renderLogin = () => (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="h4 text-primary">
                    📋 Portal de Encuestas
                  </h2>
                  <p className="text-muted">Encuesta de Condiciones de Salud</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="cedula" className="form-label">
                      Número de Cédula
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="cedula"
                      value={loginData.cedula}
                      onChange={(e) => setLoginData(prev => ({
                        ...prev,
                        cedula: e.target.value.replace(/\D/g, '') // Solo números
                      }))}
                      placeholder="Ingrese su número de cédula"
                      required
                      maxLength="15"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="codigo" className="form-label">
                      Código de Acceso
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="codigo"
                      value={loginData.codigo}
                      onChange={(e) => setLoginData(prev => ({
                        ...prev,
                        codigo: e.target.value
                      }))}
                      placeholder="Ingrese su código de acceso"
                      required
                    />
                    <div className="form-text">
                      Su código de acceso es el mismo número de su cédula
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Verificando...
                      </>
                    ) : (
                      'Ingresar'
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <small className="text-muted">
                    <strong>Instrucciones:</strong><br />
                    1. Ingrese su número de cédula<br />
                    2. Use su cédula como código de acceso<br />
                    3. Complete la encuesta de condiciones de salud
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar vista de encuesta
  const renderEncuesta = () => (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header con información del trabajador */}
          <div className="bg-primary text-white p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1">📋 {encuestaActiva?.titulo}</h4>
                <p className="mb-0">
                  <strong>Trabajador:</strong> {trabajador?.nombres} {trabajador?.apellidos} |
                  <strong> Cédula:</strong> {trabajador?.numero} | {/* CORRECCIÓN: usar 'numero' */}
                  <strong> Cargo:</strong> {trabajador?.cargo}
                </p>
              </div>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Información de la encuesta */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-info">
                <h6>📝 Información de la Encuesta</h6>
                <p className="mb-1"><strong>Descripción:</strong> {encuestaActiva?.descripcion || 'Encuesta de condiciones de salud ocupacional'}</p>
                <p className="mb-1"><strong>Período:</strong> {encuestaActiva?.fechaInicio} - {encuestaActiva?.fechaFin}</p>
                <p className="mb-0">
                  <strong>Estado:</strong>
                  {respuestaExistente ? (
                    <span className={`badge ms-2 ${respuestaExistente.estado === 'completada' ? 'bg-success' : 'bg-warning'
                      }`}>
                      {respuestaExistente.estado === 'completada' ? 'Completada' : 'En Progreso'}
                    </span>
                  ) : (
                    <span className="badge bg-secondary ms-2">No Iniciada</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de encuesta */}
          <FormularioEncuesta_COMPLETO
            trabajadorData={trabajador}
            onSubmit={async (respuestas) => {
              const resultado = await handleGuardarRespuesta(respuestas, 'completada');
              if (resultado.success) {
                // La encuesta se guardó correctamente, el estado cambiará a 'completada'
                return resultado;
              }
              throw new Error(resultado.error || 'Error al guardar la encuesta');
            }}
            onCancel={handleLogout}
          />
        </div>
      </div>
    </div>
  );

  // Renderizar vista de encuesta completada
  const renderCompletada = () => (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <div className="text-success mb-3">
                    <i className="fas fa-check-circle fa-4x"></i>
                  </div>
                  <h2 className="text-success">¡Encuesta Completada!</h2>
                  <p className="text-muted">
                    Gracias por completar la encuesta de condiciones de salud
                  </p>
                </div>

                <div className="bg-light p-4 rounded mb-4">
                  <h6 className="mb-3">📊 Resumen de su participación</h6>
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="border-end">
                        <h5 className="text-primary mb-1">✅</h5>
                        <small className="text-muted">Completada</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border-end">
                        <h5 className="text-primary mb-1">90</h5>
                        <small className="text-muted">Preguntas</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <h5 className="text-primary mb-1">100%</h5>
                      <small className="text-muted">Progreso</small>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info text-start">
                  <h6>📋 Información importante:</h6>
                  <ul className="mb-0">
                    <li>Sus respuestas han sido guardadas exitosamente</li>
                    <li>El área de Salud Ocupacional revisará la información</li>
                    <li>Si es necesario, se contactarán con usted</li>
                    <li>Puede cerrar esta ventana con seguridad</li>
                  </ul>
                </div>

                <div className="d-flex gap-2 justify-content-center">
                  <button
                    className="btn btn-primary"
                    onClick={handleLogout}
                  >
                    Finalizar Sesión
                  </button>
                </div>

                <div className="mt-4">
                  <small className="text-muted">
                    <strong>Trabajador:</strong> {trabajador?.nombres} {trabajador?.apellidos}<br />
                    <strong>Cédula:</strong> {trabajador?.numero}<br /> {/* CORRECCIÓN: usar 'numero' */}
                    <strong>Fecha de completado:</strong> {respuestaExistente?.fechaRespuesta?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()}<br />
                    <strong>Encuesta:</strong> {encuestaActiva?.titulo}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar componente principal
  switch (step) {
    case 'login':
      return renderLogin();
    case 'encuesta':
      return renderEncuesta();
    case 'completada':
      return renderCompletada();
    default:
      return renderLogin();
  }
};

export default PortalTrabajadores;