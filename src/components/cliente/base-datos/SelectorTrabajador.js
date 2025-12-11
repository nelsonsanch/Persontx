import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const SelectorTrabajador = ({ onSelectTrabajador }) => {
    const [trabajadores, setTrabajadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

    useEffect(() => {
        const cargarTrabajadores = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;

                // Consulta simple para obtener todos y filtrar en cliente (Firestore no soporta includes/contains nativo facilmente con strings)
                const q = query(
                    collection(db, 'trabajadores'),
                    where('clienteId', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const listaData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Ordenar por nombre
                listaData.sort((a, b) => (a.nombres || '').localeCompare(b.nombres || ''));

                setTrabajadores(listaData);
            } catch (error) {
                console.error("Error cargando trabajadores:", error);
            } finally {
                setLoading(false);
            }
        };

        cargarTrabajadores();
    }, []);

    // Filtro cliente
    const trabajadoresFiltrados = trabajadores.filter(t => {
        const termino = busqueda.toLowerCase();
        const nombreCompleto = `${t.nombres} ${t.apellidos}`.toLowerCase();
        const cedula = (t.numeroDocumento || '').toString();

        return nombreCompleto.includes(termino) || cedula.includes(termino);
    });

    const handleSelect = (trabajador) => {
        setTrabajadorSeleccionado(trabajador);
        onSelectTrabajador(trabajador);
        setBusqueda(''); // Opcional: limpiar búsqueda al seleccionar
    };

    if (loading) return <div className="spinner-border text-primary spinner-border-sm"></div>;

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <h5 className="card-title text-primary mb-3">🔍 Buscar Trabajador</h5>

                <div className="position-relative">
                    <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Escribe el nombre o cédula..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button
                            className="btn btn-sm btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-2"
                            onClick={() => setBusqueda('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Lista de sugerencias (solo si hay búsqueda y no hemos seleccionado uno fijo) */}
                {busqueda && trabajadoresFiltrados.length > 0 && !trabajadorSeleccionado && (
                    <div className="list-group position-absolute w-100 shadow mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                        {trabajadoresFiltrados.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                onClick={() => handleSelect(t)}
                            >
                                <div>
                                    <strong>{t.nombres} {t.apellidos}</strong>
                                    <br />
                                    <small className="text-muted">CC: {t.numeroDocumento} | Cargo: {t.cargo}</small>
                                </div>
                                <span className="badge bg-primary rounded-pill">Seleccionar</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Visualización del trabajador seleccionado actual */}
                {trabajadorSeleccionado && !busqueda && (
                    <div className="alert alert-success d-flex justify-content-between align-items-center mt-3 mb-0">
                        <div>
                            <i className="fas fa-user-check me-2"></i>
                            Seleccionado: <strong>{trabajadorSeleccionado.nombres} {trabajadorSeleccionado.apellidos}</strong>
                            <span className="text-muted ms-2">({trabajadorSeleccionado.cargo})</span>
                        </div>
                        <button className="btn btn-sm btn-outline-success" onClick={() => setBusqueda('')}>Cambiar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectorTrabajador;
