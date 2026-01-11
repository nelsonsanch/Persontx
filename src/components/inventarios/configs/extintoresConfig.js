export const extintoresConfig = {
    id: 'extintores',
    titulo: 'Inventario de Extintores',
    coleccion: 'inventarios',
    filtroCategoria: 'extintores', // Campo 'categoria' en Firebase
    campos: [
        { name: 'codigo', label: 'Código/ID', type: 'text', required: true, showInTable: true },
        { name: 'foto', label: 'Fotografía', type: 'image', showInTable: true },
        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true, showInTable: true },
        {
            name: 'tipoAgente',
            label: 'Tipo Agente',
            type: 'select',
            options: ['ABC (Polvo Químico)', 'CO2 (Dióxido Carbono)', 'Solkaflam', 'Agua', 'Espuma', 'Tipo K (Acetato de Aluminio)'],
            required: true,
            showInTable: true
        },
        {
            name: 'capacidad',
            label: 'Capacidad',
            type: 'select',
            options: ['2.5 Lbs', '5 Lbs', '10 Lbs', '20 Lbs', '30 Lbs', '40 Lbs', '150 Lbs (Satélite)'],
            required: true,
            showInTable: true
        },
        { name: 'fechaCompra', label: 'Fecha de Compra', type: 'date', required: true, showInTable: true },
        { name: 'valor', label: 'Valor Comercial ($)', type: 'number', required: true },
        {
            name: 'componentes',
            label: 'Componentes y Accesorios Incluidos',
            type: 'checklist',
            options: [
                'Cilindro',
                'Anilla de seguridad',
                'Manómetro',
                'Válvula',
                'Agente extintor',
                'Gas propelente',
                'Tubo sifón',
                'Manguera',
                'Boquilla',
                'Llantas (Ruedas)',
                'Manguera de largo alcance (Satélite)',
                'Boquilla de control (Pistola)',
                'Chasis o Carretilla',
                'Guantes de carnaza'
            ]
        }
    ]
};
