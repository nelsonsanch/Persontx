export const extintoresConfig = {
    id: 'extintores',
    titulo: 'Inventario de Extintores',
    coleccion: 'inventarios',
    filtroCategoria: 'extintores', // Campo 'categoria' en Firebase
    campos: [
        { name: 'codigo', label: 'Código/ID', type: 'text', required: true },
        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true },
        {
            name: 'tipoAgente',
            label: 'Tipo Agente',
            type: 'select',
            options: ['ABC (Polvo Químico)', 'CO2 (Dióxido Carbono)', 'Solkaflam', 'Agua', 'Espuma'],
            required: true
        },
        {
            name: 'capacidad',
            label: 'Capacidad (Lbs/Kg)',
            type: 'select',
            options: ['2.5 Lbs', '5 Lbs', '10 Lbs', '20 Lbs', '150 Lbs (Satélite)'],
            required: true
        },
        { name: 'fechaUltimaRecarga', label: 'Última Recarga', type: 'date', required: true },
        { name: 'fechaVencimiento', label: 'Próximo Vencimiento', type: 'date', required: true },
        {
            name: 'estadoFisico',
            label: 'Estado Físico',
            type: 'select',
            options: ['Bueno', 'Regular', 'Malo - Requiere Mantenimiento', 'Baja Presión'],
            required: true
        }
    ]
};
