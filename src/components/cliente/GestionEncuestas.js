import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const GestionEncuestas = ({ cambiarVista }) => {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [accesos, setAccesos] = useState([]);

  useEffect(() => {
    cargarEncuestas();
  }, []);

  const cargarEncuestas = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error('Usuario no autenticado');
        setLoading(false);
        return;
      }

      const encuestasQuery = query(
        collection(db, 'encuestas_salud'),
        where('clienteId', '==', user.uid)
      );
      const encuestasSnapshot = await getDocs(encuestasQuery);
      const encuestasData = [];
      
      encuestasSnapshot.forEach((doc) => {
        encuestasData.push({ id: doc.id, ...doc.data() });
      });

      // Ordenar por fecha de creación (más recientes primero)
      encuestasData.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      
      setEncuestas(encuestasData);
    } catch (error) {
      console.error('Error al cargar encuestas:', error);
      toast.error('Error al cargar las encuestas');
    } finally {
      setLoading(false);
    }
  };

  const cargarAccesos = async (encuestaId) => {
    try {
      const accesosQuery = query(
        collection(db, 'accesos_encuesta'),
        where('encuestaId', '==', encuestaId)
      );
      const accesosSnapshot = await getDocs(accesosQuery);
      const accesosData = [];
      
      accesosSnapshot.forEach((doc) => {
        accesosData.push({ id: doc.id, ...doc.data() });
      });

      setAccesos(accesosData);
    } catch (error) {
      console.error('Error al cargar accesos:', error);
      toast.error('Error al cargar los accesos');
    }
  };

  const verDetalles = async (encuesta) => {
    setEncuestaSeleccionada(encuesta);
    await cargarAccesos(encuesta.id);
    setMostrarDetalles(true);
  };

  const cambiarEstadoEncuesta = async (encuestaId, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'encuestas_salud', encuestaId), {
        estado: nuevoEstado,
        fechaActualizacion: new Date().toISOString()
      });
      
      toast.success(`Encuesta ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} exitosamente`);
      cargarEncuestas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar el estado de la encuesta');
    }
  };

  const eliminarEncuesta = async (encuestaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta encuesta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Eliminar accesos relacionados
      const accesosQuery = query(
        collection(db, 'accesos_encuesta'),
        where('encuestaId', '==', encuestaId)
      );
      const accesosSnapshot = await getDocs(accesosQuery);
      
      const promesasEliminacion = [];
      accesosSnapshot.forEach((doc) => {
        promesasEliminacion.push(deleteDoc(doc.ref));
      });
      
      // Eliminar encuesta
      promesasEliminacion.push(deleteDoc(doc(db, 'encuestas_salud', encuestaId)));
      
      await Promise.all(promesasEliminacion);
      
      toast.success('Encuesta eliminada exitosamente');
      cargarEncuestas();
    } catch (error) {
      console.error('Error al eliminar encuesta:', error);
      toast.error('Error al eliminar la encuesta');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'activa': 'bg-success',
      'inactiva': 'bg-secondary',
      'finalizada': 'bg-primary'
    };
    return badges[estado] || 'bg-secondary';
  };

  const calcularProgreso = (encuesta) => {
    if (encuesta.totalTrabajadores === 0) return 0;
    return Math.round((encuesta.respuestasCompletadas / encuesta.totalTrabajadores) * 100);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando encuestas...</span>
          </div>
          <p className="mt-2">Cargando encuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">📊 Gestión de Encuestas de Salud</h6>
          <button 
            className="btn btn-success btn-sm"
            onClick={() => cambiarVista('crear')}
          >
            ➕ Nueva Encuesta
          </button>
        </div>
        <div className="card-body">
          {encuestas.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-clipboard-list fa-4x text-muted"></i>
              </div>
              <h5>No hay encuestas creadas</h5>
              <p className="text-muted">Cree su primera encuesta de condiciones de salud para comenzar.</p>
              <button 
                className="btn btn-success"
                onClick={() => cambiarVista('crear')}
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
                    <th>Período</th>
                    <th>Trabajadores</th>
                    <th>Progreso</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {encuestas.map((encuesta) => (
                    <tr key={encuesta.id}>
                      <td>
                        <strong>{encuesta.titulo}</strong>
                        {encuesta.descripcion && (
                          <small className="d-block text-muted">{encuesta.descripcion}</small>
                        )}
                      </td>
                      <td>
                        <small>
                          {formatearFecha(encuesta.fechaInicio)}<br />
                          al {formatearFecha(encuesta.fechaFin)}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {encuesta.totalTrabajadores} trabajadores
                        </span>
                      </td>
                      <td>
                        <div className="progress" style={{ height: '20px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ width: `${calcularProgreso(encuesta)}%` }}
                          >
                            {calcularProgreso(encuesta)}%
                          </div>
                        </div>
                        <small className="text-muted">
                          {encuesta.respuestasCompletadas}/{encuesta.totalTrabajadores} completadas
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${getEstadoBadge(encuesta.estado)}`}>
                          {encuesta.estado}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => verDetalles(encuesta)}
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button
                            className={`btn ${encuesta.estado === 'activa' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => cambiarEstadoEncuesta(
                              encuesta.id, 
                              encuesta.estado === 'activa' ? 'inactiva' : 'activa'
                            )}
                            title={encuesta.estado === 'activa' ? 'Desactivar' : 'Activar'}
                          >
                            {encuesta.estado === 'activa' ? '⏸️' : '▶️'}
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => eliminarEncuesta(encuesta.id)}
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
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {mostrarDetalles && encuestaSeleccionada && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📋 Detalles de la Encuesta</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setMostrarDetalles(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Información General</h6>
                    <p><strong>Título:</strong> {encuestaSeleccionada.titulo}</p>
                    <p><strong>Descripción:</strong> {encuestaSeleccionada.descripcion || 'Sin descripción'}</p>
                    <p><strong>Período:</strong> {formatearFecha(encuestaSeleccionada.fechaInicio)} al {formatearFecha(encuestaSeleccionada.fechaFin)}</p>
                    <p><strong>Estado:</strong> <span className={`badge ${getEstadoBadge(encuestaSeleccionada.estado)}`}>{encuestaSeleccionada.estado}</span></p>
                  </div>
                  <div className="col-md-6">
                    <h6>Estadísticas</h6>
                    <p><strong>Total Trabajadores:</strong> {encuestaSeleccionada.totalTrabajadores}</p>
                    <p><strong>Respuestas Completadas:</strong> {encuestaSeleccionada.respuestasCompletadas}</p>
                    <p><strong>Progreso:</strong> {calcularProgreso(encuestaSeleccionada)}%</p>
                    <p><strong>Creada:</strong> {formatearFecha(encuestaSeleccionada.fechaCreacion)}</p>
                  </div>
                </div>

                <h6>👥 Trabajadores y Claves de Acceso</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Cédula</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Clave de Acceso</th>
                        <th>Estado</th>
                        <th>Último Acceso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accesos.map((acceso) => (
                        <tr key={acceso.id}>
                          <td>{acceso.numeroDocumento}</td>
                          <td>{acceso.nombres}</td>
                          <td>{acceso.apellidos}</td>
                          <td>
                            <code className="bg-light p-1 rounded">{acceso.claveAcceso}</code>
                          </td>
                          <td>
                            <span className={`badge ${acceso.completada ? 'bg-success' : 'bg-warning'}`}>
                              {acceso.completada ? 'Completada' : 'Pendiente'}
                            </span>
                          </td>
                          <td>
                            {acceso.ultimoAcceso ? formatearFecha(acceso.ultimoAcceso) : 'Sin acceso'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setMostrarDetalles(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GestionEncuestas;
