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
import BaseDatosUnificada from '../components/cliente/base-datos/BaseDatosUnificada';
import InventariosMain from '../components/inventarios/InventariosMain';
import InspeccionesMain from '../components/inspecciones/InspeccionesMain';
import GestorDocumentalMain from '../components/documental/GestorDocumentalMain';
import GestionPESVMain from '../components/pesv/GestionPESVMain';
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
      case 'base-datos':
        return <BaseDatosUnificada />;
      case 'inventarios':
        return <InventariosMain />;
      case 'inspecciones':
        return <InspeccionesMain />;
      case 'documental':
        return <GestorDocumentalMain />;
      case 'pesv':
        return <GestionPESVMain />;
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
            👥 Registro de Trabajadores
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('base-datos')}
            style={{
              backgroundColor: activeTab === 'base-datos' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'base-datos' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'base-datos' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            📂 Base de Datos
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
          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('inventarios')}
            style={{
              backgroundColor: activeTab === 'inventarios' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'inventarios' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'inventarios' ? 'white' : '#495057',
              padding: '10px 20px',
              marginBottom: '-1px'
            }}
          >
            📦 Inventarios
          </button>
          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('inspecciones')}
            style={{
              backgroundColor: activeTab === 'inspecciones' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'inspecciones' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'inspecciones' ? 'white' : '#495057',
              padding: '10px 20px',
              fontWeight: '500'
            }}
          >
            <span style={{ marginRight: '8px' }}>✅</span>
            Inspecciones SST
          </button>
          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('documental')}
            style={{
              backgroundColor: activeTab === 'documental' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'documental' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'documental' ? 'white' : '#495057',
              padding: '10px 20px',
              fontWeight: '500'
            }}
          >
            <span style={{ marginRight: '8px' }}>📄</span>
            Gestor Documental
          </button>

          <button
            className="btn me-2 mb-2"
            onClick={() => setActiveTab('pesv')}
            style={{
              backgroundColor: activeTab === 'pesv' ? '#007bff' : '#f8f9fa',
              border: '1px solid #dee2e6',
              borderBottom: activeTab === 'pesv' ? '1px solid #f8f9fa' : '1px solid #dee2e6',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'pesv' ? 'white' : '#495057',
              padding: '10px 20px',
              fontWeight: '500'
            }}
          >
            <span style={{ marginRight: '8px' }}>🚗</span>
            Gestión PESV
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