export const activosConfig = {
    id: 'activos',
    titulo: 'Inventario de Activos (Herramientas, Equipos y Maquinaria)',
    coleccion: 'inventarios',
    filtroCategoria: 'activos',
    campos: [
        { name: 'codigo', label: 'Código Interno', type: 'text', required: true, showInTable: true },
        {
            name: 'tipoActivo',
            label: 'Tipo de Activo',
            type: 'select_with_description',
            options: [
                { value: 'Herramienta Manual', desc: 'Equipos accionados exclusivamente por fuerza humana.' },
                { value: 'Herramienta Motorizada', desc: 'Equipos accionados por energía eléctrica, neumática, hidráulica o combustible.' },
                { value: 'Equipo', desc: 'Dispositivos auxiliares (escaleras, andamios, gatos hidráulicos).' },
                { value: 'Maquinaria', desc: 'Conjunto de piezas móviles para procesos industriales o trabajo pesado.' },
                { value: 'Equipo Móvil', desc: 'Vehículos, montacargas o equipos de transporte.' },
                { value: 'Accesorio Crítico', desc: 'Aditamentos de izaje (eslingas, grilletes) o seguridad.' }
            ],
            required: true,
            showInTable: true
        },
        {
            name: 'funcion',
            label: 'Función Principal',
            type: 'select',
            options: ['Cortar', 'Perforar', 'Izar/Levantar', 'Medir', 'Limpiar', 'Transportar', 'Excavar', 'Soldar', 'Esmerilar', 'Ajustar/Apretar', 'Golpear', 'Otro'],
            required: true
        },
        {
            name: 'subtipo',
            label: 'Nombre Específico (Catálogo Global)',
            type: 'global_catalog_select', // Campo especial conectado a la BD Global
            placeholder: 'Ej: Taladro Percutor, Destornillador Estrella...',
            required: true,
            showInTable: true
        },
        { name: 'descripcion', label: 'Descripción Corta', type: 'textarea' },
        { name: 'marca', label: 'Marca', type: 'text' },
        { name: 'modelo', label: 'Modelo', type: 'text' },
        { name: 'serial', label: 'Serial / No. Serie', type: 'text' },
        { name: 'cantidad', label: 'Cantidad', type: 'number', required: true, showInTable: true },
        { name: 'ubicacion', label: 'Ubicación Física', type: 'text', required: true },
        { name: 'responsable', label: 'Responsable (Cargo/Usuario)', type: 'text' },
        {
            name: 'estado',
            label: 'Estado Operativo',
            type: 'select',
            options: ['Operativo', 'Mantenimiento Preventivo', 'Fuera de Servicio', 'Baja / Desecho'],
            required: true,
            showInTable: true
        },
        { name: 'tareasAsociadas', label: 'Tareas Asociadas (IDs)', type: 'text', placeholder: 'Separar por comas si aplica' }
    ]
};
