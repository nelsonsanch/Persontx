export const sustanciasQuimicasConfig = {
    id: 'quimicos',
    titulo: 'Inventario de Sustancias Químicas',
    coleccion: 'inventarios',
    filtroCategoria: 'quimicos',
    campos: [
        { name: 'nombreProducto', label: 'Nombre del Producto', type: 'text', required: true, showInTable: true },
        { name: 'foto', label: 'Fotografía', type: 'image', showInTable: true },
        { name: 'fabricante', label: 'Fabricante', type: 'text' },
        { name: 'areaUso', label: 'Área de Uso', type: 'text', required: true, showInTable: true },
        {
            name: 'clasificacionPeligro',
            label: 'Clase de Riesgo (UN/SGA)',
            type: 'ghs_pictograms',
            options: [
                'Clase 1 - Explosivos',
                'Clase 2.1 - Gas Inflamable',
                'Clase 2.2 - Gas No Inflamable / No Tóxico',
                'Clase 2.3 - Gas Tóxico',
                'Clase 3 - Líquidos Inflamables',
                'Clase 4.1 - Sólido Inflamable',
                'Clase 4.2 - Combustión Espontánea',
                'Clase 4.3 - Peligroso con Agua',
                'Clase 5.1 - Comburente (Oxidante)',
                'Clase 5.2 - Peróxido Orgánico',
                'Clase 6.1 - Sustancia Tóxica',
                'Clase 6.2 - Sustancia Infecciosa',
                'Clase 7 - Material Radiactivo',
                'Clase 8 - Corrosivos',
                'Clase 9 - Misceláneos / Peligros Diversos'
            ],
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
