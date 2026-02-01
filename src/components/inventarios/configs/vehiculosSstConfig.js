export const vehiculosSstConfig = {
    id: 'vehiculos_sst',
    titulo: 'Inspección de Dotación Vehículos (Kit Carretera y Documentos)',
    coleccion: 'inventarios',
    filtroCategoria: 'vehiculos', // Debe coincidir con 'categoria' en la colección inventarios
    campos: [
        // 1. Documentación (Legal y Vigencia)
        {
            name: 'documentacion',
            label: 'Documentos Obligatorios (VIGENTES)',
            type: 'tri_state_checklist',
            options: [
                'Licencia de Tránsito (Tarjeta de Propiedad)',
                'SOAT Vigente (Físico o Digital)',
                'Revisión Técnico Mecánica Vigente',
                'Póliza de Responsabilidad Civil (Si aplica)',
                'Licencia de Conducción del Operador'
            ],
            columnLabels: ['Porta/Vigente', 'No Porta/Vencido', 'No Aplica']
        },

        // 2. Equipo de Carretera (Art. 30 CNT) y Dotación
        {
            name: 'kit_carretera',
            label: 'Equipo de Carretera y Dotación',
            type: 'tri_state_checklist',
            options: [
                'Extintor (Cargado y Vigente)',
                'Botiquín de Primeros Auxilios (Completo)',
                'Gato con capacidad para elevar el vehículo',
                'Cruceta / Llave de Pernos',
                'Dos señales de carretera (triángulos o conos)',
                'Dos tacos para bloquear el vehículo',
                'Caja de herramienta básica',
                'Llanta de repuesto (en buen estado)',
                'Linterna con Pilas',
                'Chaleco Reflectivo'
            ],
            columnLabels: ['Tiene', 'No Tiene', 'No Aplica']
        },

        // 3. Estado General y Seguridad (Visual)
        {
            name: 'seguridad_general',
            label: 'Estado General (Inspección Visual Rápida)',
            type: 'tri_state_checklist',
            options: [
                'Cinturones de seguridad funcionales',
                'Apoyacabezas en todos los puestos',
                'Espejos retrovisores (Estado)',
                'Pito / Bocina',
                'Limpiabrisas (Plumillas y Agua)',
                'Estado de Llantas (Visual)',
                'Luces Delanteras y Traseras'
            ],
            columnLabels: ['Bueno', 'Malo', 'N/A']
        },

        // 4. Registro Fotográfico de Evidencia
        {
            name: 'foto_checklist',
            label: 'Foto Kit Carretera Desplegado',
            type: 'image',
            required: true
        },
        {
            name: 'foto_extintor_fecha',
            label: 'Foto Fecha Vencimiento Extintor',
            type: 'image',
            required: true
        }
    ]
};
