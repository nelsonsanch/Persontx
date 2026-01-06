export const sustanciasQuimicasConfig = {
    id: 'quimicos',
    titulo: 'Inventario de Sustancias Químicas',
    coleccion: 'inventarios',
    filtroCategoria: 'quimicos',
    campos: [
        { name: 'nombreProducto', label: 'Nombre del Producto', type: 'text', required: true, showInTable: true },
        { name: 'fabricante', label: 'Fabricante', type: 'text' },
        { name: 'areaUso', label: 'Área de Uso', type: 'text', required: true, showInTable: true },
        {
            name: 'clasificacionPeligro',
            label: 'Clasificación (SGA/GHS)',
            type: 'select',
            options: ['Inflamable', 'Corrosivo', 'Tóxico', 'Irritante', 'Peligro Ambiental', 'Explosivo', 'Inocuo'],
            required: true,
            showInTable: true
        },
        {
            name: 'hojaSeguridad',
            label: '¿Tiene Ficha de Seguridad (FDS)?',
            type: 'select',
            options: ['Sí - Vigente', 'Sí - Desactualizada', 'No - Pendiente'],
            required: true
        },
        { name: 'cantidadAlmacenada', label: 'Cantidad (Kg/L)', type: 'number', showInTable: true },
        {
            name: 'romboSeguridad',
            label: 'Rombo NFPA',
            type: 'nfpa_diamond',
            required: true,
            showInTable: true
        }
    ]
};
