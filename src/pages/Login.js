import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('=== INICIO LOGIN ===');
      console.log('Email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuario autenticado:', user.email);
      
      // Obtener rol del usuario desde Firestore
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Datos del usuario en Firestore:', userData);
          
          // CORRECCIÓN: Verificar el campo 'rol' que es el que existe en Firestore
          let userRole = null;
          
          if (userData.rol) {
            userRole = userData.rol;
            console.log('Rol encontrado en campo "rol":', userRole);
          } else if (userData.role) {
            userRole = userData.role;
            console.log('Rol encontrado en campo "role":', userRole);
          } else {
            console.log('No se encontró campo de rol');
          }
          
          // Determinar redirección basada en el rol encontrado
          if (userRole === 'admin' || userRole === 'administrador') {
            console.log('✅ ADMIN DETECTADO - Redirigiendo a /admin');
            toast.success('¡Bienvenido Administrador! Acceso concedido', {
              position: "top-right",
              autoClose: 2000,
            });
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1000);
          } else {
            console.log('👤 CLIENTE DETECTADO - Redirigiendo a /cliente');
            toast.success('¡Bienvenido! Acceso concedido', {
              position: "top-right",
              autoClose: 2000,
            });
            setTimeout(() => {
              window.location.href = '/cliente';
            }, 1000);
          }
          
        } else {
          console.log('❌ Usuario no encontrado en Firestore');
          
          // Fallback: verificar por email
          if (email.toLowerCase().includes('admin')) {
            console.log('📧 Email contiene "admin", redirigiendo a /admin');
            toast.success('¡Bienvenido Administrador! Acceso concedido', {
              position: "top-right",
              autoClose: 2000,
            });
            setTimeout(() => {
              window.location.href = '/admin';
            }, 1000);
          } else {
            console.log('📧 Redirigiendo a /cliente por defecto');
            toast.success('¡Bienvenido! Acceso concedido', {
              position: "top-right",
              autoClose: 2000,
            });
            setTimeout(() => {
              window.location.href = '/cliente';
            }, 1000);
          }
        }
        
      } catch (firestoreError) {
        console.error('❌ Error al obtener datos del usuario:', firestoreError);
        toast.warning('Problema al verificar permisos, pero acceso concedido', {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Fallback en caso de error
        if (email.toLowerCase().includes('admin')) {
          console.log('🔄 Error en Firestore, pero email contiene "admin"');
          setTimeout(() => {
            window.location.href = '/admin';
          }, 1000);
        } else {
          console.log('🔄 Error en Firestore, redirigiendo a /cliente');
          setTimeout(() => {
            window.location.href = '/cliente';
          }, 1000);
        }
      }
      
      console.log('=== FIN LOGIN ===');
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      toast.error('Email o contraseña incorrectos. Verifica tus credenciales.', {
        position: "top-right",
        autoClose: 4000,
      });
      setError('Email o contraseña incorrectos');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '420px', 
        width: '100%',
        padding: '40px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        {/* Logo de Ausentix */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px' 
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px auto',
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
          }}>
            {/* Ícono de gráfico de barras con línea de tendencia */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              {/* Barras del gráfico */}
              <rect x="8" y="32" width="6" height="8" fill="white" rx="1"/>
              <rect x="18" y="24" width="6" height="16" fill="white" rx="1"/>
              <rect x="28" y="28" width="6" height="12" fill="white" rx="1"/>
              <rect x="38" y="16" width="6" height="24" fill="white" rx="1"/>
              
              {/* Línea de tendencia */}
              <path d="M6 36 L16 28 L26 32 L42 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="16" cy="28" r="2" fill="white"/>
              <circle cx="26" cy="32" r="2" fill="white"/>
              <circle cx="42" cy="16" r="2" fill="white"/>
              
              {/* Flecha de tendencia */}
              <path d="M38 16 L42 16 L42 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          
          <h1 style={{ 
            color: '#007bff', 
            marginBottom: '8px',
            fontSize: '32px',
            fontWeight: 'bold',
            letterSpacing: '-1px'
          }}>
            AUSENTIX
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '16px',
            margin: '0'
          }}>
            Sistema de Gestión de Ausencias
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#333',
              fontSize: '14px'
            }}>
              Email Corporativo
            </label>
            <input
              type="email"
              placeholder="tu.email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                fontSize: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#333',
              fontSize: '14px'
            }}>
              Contraseña
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '14px 50px 14px 16px', 
                fontSize: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: '12px',
                top: '38px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666',
                padding: '8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #f5c6cb',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: loading ? '#6c757d' : 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', 
              color: 'white', 
              border: 'none', 
              fontSize: '16px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontWeight: '600',
              marginBottom: '24px',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(0, 123, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
              }
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff40',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Información adicional */}
        <div style={{ 
          textAlign: 'center', 
          borderTop: '1px solid #e9ecef', 
          paddingTop: '24px' 
        }}>
          <p style={{ 
            margin: '0 0 16px 0', 
            color: '#666', 
            fontSize: '14px' 
          }}>
            ¿Problemas para acceder?
          </p>
          <p style={{ 
            margin: '0', 
            fontSize: '12px', 
            color: '#999',
            lineHeight: '1.5'
          }}>
            Contacta al administrador del sistema para obtener ayuda<br/>
            o solicitar credenciales de acceso.
          </p>
        </div>

        {/* Logo pequeño en esquina */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.8'
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="14" width="2" height="4" fill="white" rx="0.5"/>
            <rect x="6" y="10" width="2" height="8" fill="white" rx="0.5"/>
            <rect x="10" y="12" width="2" height="6" fill="white" rx="0.5"/>
            <rect x="14" y="6" width="2" height="12" fill="white" rx="0.5"/>
            <path d="M1 16 L7 10 L11 14 L19 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Estilos CSS para animación */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;