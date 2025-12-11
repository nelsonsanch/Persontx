import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import NovedadesList from '../components/cliente/NovedadesList';
import TrabajadoresList from '../components/cliente/TrabajadoresList';
import IndicadoresDashboard from '../components/cliente/IndicadoresDashboard';
import EMOSList from '../components/cliente/EMOSList';
import EncuestasSaludCliente from '../components/cliente/EncuestasSaludCliente';
import PerfilesCargo from '../components/cliente/PerfilesCargo';

// --- INICIO DE CÓDIGO NUEVO ---
// 1. Importamos el nuevo componente de Informes
import InformesIA from './InformesIA';
import RecargosList from '../components/cliente/RecargosList';
// --- FIN DE CÓDIGO NUEVO ---


const ClienteDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('trabajadores');

  const handleLogout = () => {
    logout();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trabajadores':
        return <TrabajadoresList />;
      case 'novedades':
        return <NovedadesList />;
      case 'indicadores':
        return <IndicadoresDashboard />;
      case 'emos':
        return <EMOSList />;
      case 'perfiles':
        return <PerfilesCargo />;
      case 'encuestas-salud':
        return <EncuestasSaludCliente />;

      // --- INICIO DE CÓDIGO NUEVO ---
      // 2. Añadimos el caso para la nueva pestaña
      case 'informes':
        return <InformesIA />;
      case 'recargos':
        return <RecargosList />;
      // --- FIN DE CÓDIGO NUEVO ---

      default:
        return null;
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header con línea azul */}
      <div style={{ backgroundColor: 'white', borderBottom: '3px solid #007bff', padding: '15px 0' }}>
        <div className="container-fluid" style={{ paddingLeft: '30px', paddingRight: '30px' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h1 style={{ color: '#007bff', margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
              Panel de Cliente
            </h1>
            <div className="d-flex align-items-center">
              <span className="me-3" style={{ color: '#6c757d' }}>
                Bienvenido, {user?.email || 'juan.perez@empresa.com'}
              </span>
              <button
                className="btn btn-danger"
                onClick={handleLogout}
                style={{
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545',
                  fontWeight: '500'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas con estilo original y margen */}
      <div className="container-fluid" style={{ padding: '20px 30px' }}>
        <div className="d-flex flex-wrap" style={{ borderBottom: '1px solid #dee2e6', marginBottom: '20px' }}>
          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('trabajadores')}
            style={{
              backgroundColor: activeTab === 'trabajadores' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'trabajadores' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'trabajadores' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            👥 Base de Datos
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('novedades')}
            style={{
              backgroundColor: activeTab === 'novedades' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'novedades' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'novedades' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            📝 Registro de Novedades
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('indicadores')}
            style={{
              backgroundColor: activeTab === 'indicadores' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'indicadores' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'indicadores' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            📊 Indicadores
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('emos')}
            style={{
              backgroundColor: activeTab === 'emos' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'emos' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'emos' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            🏥 EMOS
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('perfiles')}
            style={{
              backgroundColor: activeTab === 'perfiles' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'perfiles' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'perfiles' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            📋 Perfiles de Cargo
          </button>

          {/* --- INICIO DE CÓDIGO NUEVO --- */}
          {/* 3. Añadimos el nuevo botón de la pestaña */}
          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('informes')}
            style={{
              backgroundColor: activeTab === 'informes' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'informes' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'informes' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            ❓Consultas
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('recargos')}
            style={{
              backgroundColor: activeTab === 'recargos' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'recargos' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'recargos' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            ⏱️ Recargos
          </button>
          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('encuestas-salud')}
            style={{
              backgroundColor: activeTab === 'encuestas-salud' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'encuestas-salud' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'encuestas-salud' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            📋 Encuestas de Salud
          </button>
          {/* --- FIN DE CÓDIGO NUEVO --- */}

        </div>

        {/* Contenido de las pestañas */}
        <div style={{ backgroundColor: 'white', padding: '20px', minHeight: '400px' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ClienteDashboard;