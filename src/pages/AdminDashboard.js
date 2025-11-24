import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import ClientesList from '../components/admin/ClientesList';

const AdminDashboard = () => {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #007bff',
        paddingBottom: '15px'
      }}>
        <h1 style={{ margin: 0, color: '#007bff' }}>Panel de Administrador</h1>
        <button 
          onClick={handleLogout} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
      
      {/* Componente de gestión de clientes */}
      <ClientesList />
    </div>
  );
};

export default AdminDashboard;
