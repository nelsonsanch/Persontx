import React, { useState } from 'react';
import SelectorTrabajador from './SelectorTrabajador';
import DatosDemograficos from './DatosDemograficos';
import HistoriaSalud from './HistoriaSalud';
import HistoriaNovedades from './HistoriaNovedades';
import HistoriaEMOs from './HistoriaEMOs';
import PerfilCargoView from './PerfilCargoView';

const BaseDatosUnificada = () => {
    const [trabajador, setTrabajador] = useState(null);
    const [activeTab, setActiveTab] = useState('demograficos');

    const renderTabContent = () => {
        if (!trabajador) return <div className="alert alert-info text-center p-5">👆 Por favor selecciona un trabajador para ver su información.</div>;

        switch (activeTab) {
            case 'demograficos':
                return <DatosDemograficos trabajador={trabajador} />;
            case 'salud':
                return <HistoriaSalud trabajador={trabajador} />;
            case 'novedades':
                return <HistoriaNovedades trabajador={trabajador} />;
            case 'emos':
                return <HistoriaEMOs trabajador={trabajador} />;
            case 'perfil':
                return <PerfilCargoView trabajador={trabajador} />;
            default:
                return null;
        }
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="text-primary mb-4">📂 Base de Datos Unificada</h2>

            {/* Componente Modular de Selección */}
            <SelectorTrabajador onSelectTrabajador={setTrabajador} />

            {/* Navegación Modular */}
            {trabajador && (
                <div className="card shadow-sm mt-4">
                    <div className="card-header bg-white p-0">
                        <ul className="nav nav-tabs nav-justified">
                            <li className="nav-item">
                                <button
                                    className={`nav-link py-3 ${activeTab === 'demograficos' ? 'active fw-bold' : ''}`}
                                    onClick={() => setActiveTab('demograficos')}
                                >
                                    👤 Datos Demográficos
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link py-3 ${activeTab === 'salud' ? 'active fw-bold' : ''}`}
                                    onClick={() => setActiveTab('salud')}
                                >
                                    🏥 Condiciones de Salud
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link py-3 ${activeTab === 'novedades' ? 'active fw-bold' : ''}`}
                                    onClick={() => setActiveTab('novedades')}
                                >
                                    🚨 Novedades
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link py-3 ${activeTab === 'emos' ? 'active fw-bold' : ''}`}
                                    onClick={() => setActiveTab('emos')}
                                >
                                    🩺 Historia EMOs
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link py-3 ${activeTab === 'perfil' ? 'active fw-bold' : ''}`}
                                    onClick={() => setActiveTab('perfil')}
                                >
                                    👔 Perfil Cargo
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="card-body p-4 bg-light">
                        {renderTabContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BaseDatosUnificada;
