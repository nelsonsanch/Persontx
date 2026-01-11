export const otrosConfig = {
    id: 'otros',
    titulo: 'Inventario de Otros Equipos',
    coleccion: 'inventarios',
    filtroCategoria: 'otros',
    campos: [
        { name: 'nombre', label: 'Nombre del Equipo', type: 'text', required: true, showInTable: true },
        { name: 'codigo', label: 'Código/ID', type: 'text', required: true, showInTable: true },
        { name: 'foto', label: 'Fotografía', type: 'image', showInTable: true },
        { name: 'ubicacion', label: 'Ubicación / Lugar', type: 'text', required: true, showInTable: true },
        { name: 'funcion', label: 'Función', type: 'text' },
        { name: 'descripcion', label: 'Descripción', type: 'textarea' },
        { name: 'marca', label: 'Marca', type: 'text', showInTable: true },
        { name: 'componentes', label: 'Componentes (Describir)', type: 'textarea', placeholder: 'Liste los componentes principales...' },
        { name: 'fechaCompra', label: 'Fecha de Adquisición / Compra', type: 'date', required: true },
        {
            name: 'estado',
            label: 'Estado Operativo',
            type: 'select',
            options: ['Operativo', 'En Revisión', 'Fuera de Servicio', 'Desecho'],
            required: true,
            showInTable: true
        }
    ]
};
