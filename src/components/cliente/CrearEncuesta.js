import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const CrearEncuesta = ({ cambiarVista }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    activa: true
  });
  
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(true);

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  const cargarTrabajadores = async () => {
    try {
      setCargandoTrabajadores(true);
      const user = auth.currentUser;
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      // Cargar trabajadores activos del cliente
      const trabajadoresQuery = query(
        collection(db, 'trabajadores'),
        where('clienteId', '==', user.uid),
        where('estado', '==', 'activo')
      );
      
      const trabajadoresSnapshot = await getDocs(trabajadoresQuery);
      const trabajadoresData = [];
      
      trabajadoresSnapshot.forEach((doc) => {
        const data = doc.data();
        trabajadoresData.push({
          id: doc.id,
          numeroDocumento: data.numeroDocumento,
          nombres: data.nombres,
          apellidos: data.apellidos,
          cargo: data.cargo,
          area: data.area,
          email: data.email,
          telefono: data.telefono
        });
      });

      setTrabajadores(trabajadoresData);
      // Seleccionar todos los trabajadores por defecto
      setTrabajadoresSeleccionados(trabajadoresData.map(t => t.id));
      
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
      toast.error('Error al cargar los trabajadores');
    } finally {
      setCargandoTrabajadores(false);
    }
  };

  const generarClaveAcceso = () => {
    // Generar clave de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (trabajadoresSeleccionados.length === 0) {
      toast.error('Debe seleccionar al menos un trabajador');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      
      // Crear la encuesta principal
      const encuestaData = {
        ...formData,
        clienteId: user.uid,
        fechaCreacion: new Date().toISOString(),
        totalTrabajadores: trabajadoresSeleccionados.length,
        respuestasCompletadas: 0,
        estado: 'activa'
      };

      const encuestaRef = await addDoc(collection(db, 'encuestas_salud'), encuestaData);
      
      // Crear registros individuales para cada trabajador con clave de acceso
      const promesasAcceso = trabajadoresSeleccionados.map(async (trabajadorId) => {
        const trabajador = trabajadores.find(t => t.id === trabajadorId);
        const claveAcceso = generarClaveAcceso();
        
        return addDoc(collection(db, 'accesos_encuesta'), {
          encuestaId: encuestaRef.id,
          trabajadorId: trabajadorId,
          numeroDocumento: trabajador.numeroDocumento,
          nombres: trabajador.nombres,
          apellidos: trabajador.apellidos,
          claveAcceso: claveAcceso,
          activo: true,
          completada: false,
          fechaCreacion: new Date().toISOString(),
          intentosLogin: 0,
          ultimoAcceso: null
        });
      });

      await Promise.all(promesasAcceso);
      
      toast.success(`Encuesta creada exitosamente para ${trabajadoresSeleccionados.length} trabajadores`);
      cambiarVista('gestion');
      
    } catch (error) {
      console.error('Error al crear encuesta:', error);
      toast.error('Error al crear la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleTrabajadorToggle = (trabajadorId) => {
    setTrabajadoresSeleccionados(prev => 
      prev.includes(trabajadorId) 
        ? prev.filter(id => id !== trabajadorId)
        : [...prev, trabajadorId]
    );
  };

  const seleccionarTodos = () => {
    setTrabajadoresSeleccionados(trabajadores.map(t => t.id));
  };

  const deseleccionarTodos = () => {
    setTrabajadoresSeleccionados([]);
  };

  if (cargandoTrabajadores) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando trabajadores...</span>
          </div>
          <p className="mt-2">Cargando trabajadores activos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-success text-white">
        <h6 className="mb-0">➕ Crear Nueva Encuesta de Condiciones de Salud</h6>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Título de la Encuesta *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ej: Encuesta de Condiciones de Salud - Enero 2024"
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
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
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
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
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
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Selección de Trabajadores */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>👥 Trabajadores que participarán ({trabajadoresSeleccionados.length}/{trabajadores.length})</h6>
              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={seleccionarTodos}
                >
                  Seleccionar Todos
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={deseleccionarTodos}
                >
                  Deseleccionar Todos
                </button>
              </div>
            </div>

            {trabajadores.length === 0 ? (
              <div className="alert alert-warning">
                <strong>⚠️ No hay trabajadores activos</strong><br />
                No se encontraron trabajadores en estado activo para esta empresa.
                Verifique que tenga trabajadores registrados y en estado activo.
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-sm table-hover">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th width="50">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={trabajadoresSeleccionados.length === trabajadores.length}
                          onChange={() => 
                            trabajadoresSeleccionados.length === trabajadores.length 
                              ? deseleccionarTodos() 
                              : seleccionarTodos()
                          }
                        />
                      </th>
                      <th>Cédula</th>
                      <th>Nombres</th>
                      <th>Apellidos</th>
                      <th>Cargo</th>
                      <th>Área</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trabajadores.map((trabajador) => (
                      <tr key={trabajador.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={trabajadoresSeleccionados.includes(trabajador.id)}
                            onChange={() => handleTrabajadorToggle(trabajador.id)}
                          />
                        </td>
                        <td>{trabajador.numeroDocumento}</td>
                        <td>{trabajador.nombres}</td>
                        <td>{trabajador.apellidos}</td>
                        <td>{trabajador.cargo}</td>
                        <td>{trabajador.area}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Información importante */}
          <div className="alert alert-info">
            <h6>📋 Información Importante:</h6>
            <ul className="mb-0">
              <li>Se generará una <strong>clave de acceso única</strong> para cada trabajador seleccionado</li>
              <li>Los trabajadores podrán acceder con su <strong>número de cédula + clave asignada</strong></li>
              <li>La encuesta contiene <strong>90 preguntas</strong> sobre condiciones de salud ocupacional</li>
              <li>Al completar la encuesta, se generará automáticamente un <strong>PDF</strong> para el trabajador</li>
              <li>Podrá ver los resultados y análisis en el <strong>Dashboard de Salud</strong></li>
            </ul>
          </div>

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => cambiarVista('gestion')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading || trabajadoresSeleccionados.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creando Encuesta...
                </>
              ) : (
                `✅ Crear Encuesta para ${trabajadoresSeleccionados.length} Trabajadores`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearEncuesta;