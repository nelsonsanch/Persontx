import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { db, auth } from '../../firebase';

const ClientesList = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    activo: true,
    password: ''
  });

  // Verificar si el usuario actual es administrador
  const verificarAdmin = () => {
    const user = auth.currentUser;
    if (user && user.email === 'admin@tuapp.com') {
      setIsAdmin(true);
      return true;
    } else {
      setIsAdmin(false);
      setError('Acceso denegado. Solo los administradores pueden gestionar clientes.');
      return false;
    }
  };

  // Cargar clientes desde Firestore
  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que el usuario sea administrador
      if (!verificarAdmin()) {
        setLoading(false);
        return;
      }

      console.log('Cargando clientes como administrador...');
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const clientesData = [];
      querySnapshot.forEach((doc) => {
        clientesData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('Clientes cargados:', clientesData.length);
      setClientes(clientesData);
      
      if (clientesData.length === 0) {
        setError('No hay clientes registrados en el sistema.');
      }
      
    } catch (error) {
      console.error('Error cargando clientes:', error);
      
      // Mensajes de error más específicos
      if (error.code === 'permission-denied') {
        setError('Error de permisos: No tienes autorización para acceder a los datos de clientes. Verifica que estés autenticado como administrador.');
      } else if (error.code === 'unavailable') {
        setError('Error de conexión: No se puede conectar a la base de datos. Verifica tu conexión a internet.');
      } else {
        setError(`Error al cargar clientes: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Usuario autenticado:', user.email);
        cargarClientes();
      } else {
        console.log('Usuario no autenticado');
        setError('Debes iniciar sesión como administrador para acceder a esta sección.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Generar contraseña aleatoria
  const generarPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // NUEVA FUNCIÓN: Crear cliente usando Admin SDK simulado
  const crearClienteCompleto = async (datosCliente, password) => {
    try {
      console.log('Iniciando creación de cliente...');
      
      // PASO 1: Crear registro en Firestore PRIMERO (como admin)
      const clienteData = {
        nombre: datosCliente.nombre,
        email: datosCliente.email,
        telefono: datosCliente.telefono,
        empresa: datosCliente.empresa,
        activo: datosCliente.activo,
        fechaCreacion: new Date(),
        rol: 'cliente',
        aprobado: true,
        uid: null // Se actualizará después
      };

      console.log('Creando registro en Firestore...');
      const docRef = await addDoc(collection(db, 'clientes'), clienteData);
      console.log('Registro creado en Firestore con ID:', docRef.id);

      // PASO 2: Crear cuenta en Authentication
      console.log('Creando cuenta en Authentication...');
      
      // Guardar credenciales del admin
      const adminEmail = auth.currentUser.email;
      const adminPassword = prompt('Para crear la cuenta del cliente, ingresa tu contraseña de administrador:');
      
      if (!adminPassword) {
        throw new Error('Se requiere la contraseña del administrador para crear cuentas');
      }

      let nuevoUID = null;
      
      try {
        // Crear la cuenta del cliente
        const userCredential = await createUserWithEmailAndPassword(auth, datosCliente.email, password);
        nuevoUID = userCredential.user.uid;
        console.log('Cuenta creada con UID:', nuevoUID);

        // Cerrar sesión del cliente recién creado
        await signOut(auth);
        console.log('Sesión del cliente cerrada');

        // Reautenticar como admin
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('Admin reautenticado');

        // PASO 3: Actualizar el registro con el UID
        await updateDoc(doc(db, 'clientes', docRef.id), {
          uid: nuevoUID
        });
        console.log('UID actualizado en Firestore');

        return { success: true, uid: nuevoUID, docId: docRef.id };

      } catch (authError) {
        console.error('Error en Authentication:', authError);
        
        // Si falla la creación de la cuenta, eliminar el registro de Firestore
        try {
          await deleteDoc(doc(db, 'clientes', docRef.id));
          console.log('Registro de Firestore eliminado debido al error de Authentication');
        } catch (cleanupError) {
          console.error('Error limpiando registro:', cleanupError);
        }
        
        throw authError;
      }

    } catch (error) {
      console.error('Error en creación completa:', error);
      throw error;
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Solo los administradores pueden crear/editar clientes.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (editingCliente) {
        // Actualizar cliente existente (solo datos en Firestore)
        const { password, ...dataToUpdate } = formData;
        await updateDoc(doc(db, 'clientes', editingCliente.id), dataToUpdate);
        alert('Cliente actualizado exitosamente');
        
        setShowForm(false);
        setEditingCliente(null);
        setFormData({ nombre: '', email: '', telefono: '', empresa: '', activo: true, password: '' });
        cargarClientes();
        
      } else {
        // Crear nuevo cliente
        const password = formData.password || generarPassword();
        
        console.log('Iniciando proceso de creación de cliente...');
        
        const resultado = await crearClienteCompleto(formData, password);
        
        if (resultado.success) {
          alert(`¡Cliente creado exitosamente!\n\nCredenciales:\nEmail: ${formData.email}\nContraseña: ${password}\n\n⚠️ IMPORTANTE: Comparte estas credenciales con el cliente de forma segura.`);
          
          setShowForm(false);
          setEditingCliente(null);
          setFormData({ nombre: '', email: '', telefono: '', empresa: '', activo: true, password: '' });
          
          // Recargar clientes
          setTimeout(() => {
            cargarClientes();
          }, 1000);
        }
      }
      
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      
      // Mensajes de error más específicos
      if (error.code === 'auth/email-already-in-use') {
        setError('Error: Ya existe una cuenta con este email. Use un email diferente.');
      } else if (error.code === 'auth/weak-password') {
        setError('Error: La contraseña es muy débil. Use al menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Error: El formato del email no es válido.');
      } else if (error.code === 'permission-denied') {
        setError('Error de permisos: No tienes autorización para crear clientes. Verifica que estés autenticado como administrador.');
      } else if (error.message.includes('contraseña del administrador')) {
        setError('Error: Se requiere la contraseña del administrador para crear cuentas de cliente.');
      } else {
        setError(`Error al crear cliente: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Activar/Desactivar cliente
  const toggleClienteActivo = async (cliente) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden cambiar el estado de los clientes.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'clientes', cliente.id), {
        activo: !cliente.activo
      });
      cargarClientes();
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'permission-denied') {
        alert('Error de permisos: No tienes autorización para modificar este cliente.');
      } else {
        alert(`Error al cambiar estado del cliente: ${error.message}`);
      }
    }
  };

  // Resetear contraseña
  const resetearPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Email de recuperación enviado a ${email}`);
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'auth/user-not-found') {
        alert('Error: No se encontró una cuenta con este email.');
      } else {
        alert(`Error enviando email de recuperación: ${error.message}`);
      }
    }
  };

  // Eliminar cliente
  const eliminarCliente = async (id) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar clientes.');
      return;
    }
    
    if (window.confirm('¿Estás seguro de eliminar este cliente? Esta acción eliminará el registro de Firestore.')) {
      try {
        await deleteDoc(doc(db, 'clientes', id));
        cargarClientes();
        alert('Cliente eliminado exitosamente');
        // Nota: La cuenta de Authentication debe eliminarse por separado si es necesario
      } catch (error) {
        console.error('Error:', error);
        if (error.code === 'permission-denied') {
          alert('Error de permisos: No tienes autorización para eliminar este cliente.');
        } else {
          alert(`Error al eliminar cliente: ${error.message}`);
        }
      }
    }
  };

  // Mostrar estado de carga
  if (loading && clientes.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Cargando clientes...</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Verificando permisos de administrador...
        </div>
      </div>
    );
  }

  // Mostrar error si no es administrador o hay problemas de permisos
  if (error && !isAdmin) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          marginBottom: '20px'
        }}>
          <h3>❌ Acceso Denegado</h3>
          <p>{error}</p>
          <p><strong>Solución:</strong> Asegúrate de estar autenticado con la cuenta de administrador (admin@tuapp.com).</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Gestión de Clientes</h2>
        <div>
          <span style={{ 
            marginRight: '15px', 
            fontSize: '14px', 
            color: isAdmin ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {isAdmin ? '✅ Administrador' : '❌ Sin permisos'}
          </span>
          <button 
            onClick={() => setShowForm(true)}
            disabled={!isAdmin}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isAdmin ? '#007bff' : '#ccc', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: isAdmin ? 'pointer' : 'not-allowed'
            }}
          >
            Agregar Cliente
          </button>
        </div>
      </div>

      {/* Mostrar errores */}
      {error && isAdmin && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Información de estado */}
      <div style={{ 
        backgroundColor: '#d1ecf1', 
        color: '#0c5460', 
        padding: '10px', 
        borderRadius: '4px',
        border: '1px solid #bee5eb',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <strong>Estado:</strong> {clientes.length} clientes cargados | 
        Usuario actual: {auth.currentUser?.email || 'No autenticado'} | 
        Permisos: {isAdmin ? 'Administrador' : 'Limitados'}
      </div>

      {/* Formulario */}
      {showForm && isAdmin && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          marginBottom: '20px',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <h3>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          {!editingCliente && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              color: '#856404',
              padding: '10px', 
              marginBottom: '15px',
              borderRadius: '4px',
              border: '1px solid #ffeaa7'
            }}>
              <strong>⚠️ Importante:</strong> Para crear la cuenta del cliente, necesitarás ingresar tu contraseña de administrador por seguridad.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={editingCliente} // No permitir cambiar email en edición
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginBottom: '10px',
                  backgroundColor: editingCliente ? '#f8f9fa' : 'white'
                }}
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
              <input
                type="text"
                placeholder="Empresa"
                value={formData.empresa}
                onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
              
              {!editingCliente && (
                <div>
                  <input
                    type="text"
                    placeholder="Contraseña (opcional - se generará automáticamente si se deja vacío)"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, password: generarPassword()})}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '12px',
                      marginBottom: '10px'
                    }}
                  >
                    Generar Contraseña
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  marginRight: '10px', 
                  padding: '8px 16px',
                  backgroundColor: loading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Procesando...' : (editingCliente ? 'Actualizar' : 'Crear Cliente y Cuenta')}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingCliente(null);
                  setFormData({ nombre: '', email: '', telefono: '', empresa: '', activo: true, password: '' });
                  setError(null);
                }}
                style={{ padding: '8px 16px' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de clientes */}
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Nombre</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Empresa</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Cuenta</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cliente.nombre}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cliente.email}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cliente.empresa}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    color: cliente.activo ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    color: cliente.uid ? 'green' : 'orange',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {cliente.uid ? '✅ Con cuenta' : '⚠️ Solo registro'}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => {
                      setEditingCliente(cliente);
                      setFormData({...cliente, password: ''});
                      setShowForm(true);
                      setError(null);
                    }}
                    disabled={!isAdmin}
                    style={{ 
                      marginRight: '5px', 
                      padding: '4px 8px', 
                      fontSize: '12px',
                      backgroundColor: isAdmin ? 'white' : '#f8f9fa',
                      cursor: isAdmin ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => toggleClienteActivo(cliente)}
                    disabled={!isAdmin}
                    style={{ 
                      marginRight: '5px', 
                      padding: '4px 8px', 
                      fontSize: '12px',
                      backgroundColor: isAdmin ? (cliente.activo ? '#dc3545' : '#28a745') : '#f8f9fa',
                      color: isAdmin ? 'white' : '#666',
                      border: 'none',
                      cursor: isAdmin ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {cliente.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button 
                    onClick={() => resetearPassword(cliente.email)}
                    style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px' }}
                  >
                    Reset Password
                  </button>
                  <button 
                    onClick={() => eliminarCliente(cliente.id)}
                    disabled={!isAdmin}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '12px',
                      backgroundColor: isAdmin ? '#dc3545' : '#f8f9fa',
                      color: isAdmin ? 'white' : '#666',
                      border: 'none',
                      cursor: isAdmin ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {clientes.length === 0 && !loading && !error && (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            No hay clientes registrados
          </p>
        )}
      </div>
    </div>
  );
};

export default ClientesList;