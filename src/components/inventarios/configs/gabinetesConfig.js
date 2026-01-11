export const gabinetesConfig = {
    id: 'gabinetes',
    titulo: 'Inventario de Gabinetes Contra Incendios',
    coleccion: 'inventarios',
    filtroCategoria: 'gabinetes',
    campos: [
        { name: 'codigo', label: 'Código/ID', type: 'text', required: true, showInTable: true },
        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true, showInTable: true },
        { name: 'foto', label: 'Fotografía', type: 'image', showInTable: true },
        {
            name: 'tipo',
            label: 'Tipo de Gabinete',
            type: 'select',
            options: ['Clase I (2 1/2")', 'Clase II (1 1/2")', 'Clase III (Mixto)'],
            required: true,
            showInTable: true
        },
        {
            name: 'estadoGeneral',
            label: 'Estado General',
            type: 'select',
            options: ['Operativo', 'Requiere Mantenimiento', 'Fuera de Servicio'],
            required: true,
            showInTable: true
        },
        { name: 'fechaUltimaInspeccion', label: 'Fecha de Registro', type: 'date', required: true },
        {
            name: 'componentes',
            label: 'Lista de Chequeo de Componentes (Marcar si cumple/presente)',
            type: 'checklist',
            options: [
                'Soporte para Manguera',
                'Manguera',
                'Llave Spanner',
                'Hacha',
                'Boquilla Chorro Niebla',
                'Conexión de Agua',
                'Válvula de Salida',
                'Señalización',
                'Acceso y Visibilidad',
                'Cerraduras',
                'Vidrio',
                'Puerta',
                'Pintura',
                'Limpieza'
            ]
        }
    ]
};
