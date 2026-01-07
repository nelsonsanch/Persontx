export const camillasConfig = {
    id: 'camillas',
    titulo: 'Inventario de Camillas',
    coleccion: 'inventarios',
    filtroCategoria: 'camillas',
    campos: [
        { name: 'codigo', label: 'Código de Identificación', type: 'text', required: true, showInTable: true },
        {
            name: 'tipoCamilla',
            label: 'Tipo de Camilla',
            type: 'select',
            options: [
                'Rígida (Tabla Espinal Larga)',
                'Plegable / Lona',
                'De Cuchara (Scoop)',
                'Tipo Nido (Canasta)',
                'Silla de Evacuación',
                'Camilla de Vacío'
            ],
            required: true,
            showInTable: true
        },
        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true, showInTable: true },
        { name: 'fechaCompra', label: 'Fecha de Compra/Registro', type: 'date', required: true },
        { name: 'precioCompra', label: 'Precio de Compra/Adquisición ($)', type: 'number' },
        {
            name: 'componentes',
            label: 'Accesorios y Componentes',
            type: 'checklist',
            options: [
                'Correas/Arneses (Cinturones pecho, pelvis, piernas)',
                'Correa "Araña"',
                'Inmovilizador de Cabeza (Lateral)',
                'Collarín Cervical',
                'Soportes para Pies/Extremos',
                'Soportes para suero y drenajes',
                'Bolsas de almacenamiento y transporte',
                'Señalización del punto de camilla'
            ]
        },
        {
            name: 'estadoGeneral',
            label: 'Estado General',
            type: 'select',
            options: ['Operativa', 'Requiere Mantenimiento', 'Fuera de Servicio'],
            required: true,
            showInTable: true
        }
    ]
};
