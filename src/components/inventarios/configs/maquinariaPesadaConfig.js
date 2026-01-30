export const maquinariaPesadaConfig = {
    id: 'maquinaria_pesada',
    titulo: 'Inventario de Maquinaria Pesada (Amarilla)',
    coleccion: 'inventarios',
    filtroCategoria: 'maquinaria_pesada', // Identificador único en BD
    campos: [
        // 1. Identificación Principal (Izquierda)
        {
            name: 'tipo_maquinaria',
            label: 'Tipo de Maquinaria',
            type: 'select',
            options: [
                'Retroexcavadora', 'Excavadora', 'Bulldozer', 'Motoniveladora',
                'Cargador Frontal', 'Minicargador', 'Compactador', 'Grúa Telescópica',
                'Grúa Torre', 'Montacargas', 'Manipulador Telescópico', 'Pavimentadora',
                'Fresadora', 'Volqueta Articulada', 'Tractor Agrícola', 'Otro'
            ],
            required: true,
            showInTable: true
        },
        {
            name: 'marca',
            label: 'Marca',
            type: 'text',
            placeholder: 'Ej: Caterpillar, Komatsu, JCB...',
            required: true,
            showInTable: true
        },
        { name: 'modelo', label: 'Modelo', type: 'text', required: true, showInTable: true },
        { name: 'serie_chasis', label: 'Nº Serie / Chasis (VIN)', type: 'text', required: true },
        { name: 'serie_motor', label: 'Nº Serie Motor', type: 'text' },
        { name: 'anio_fabricacion', label: 'Año de Fabricación', type: 'number', required: true },

        // 2. Datos Operativos (Centro)
        { name: 'placa_interna', label: 'ID Interno / Placa (Si aplica)', type: 'text', showInTable: true },
        { name: 'ubicacion', label: 'Ubicación / Proyecto', type: 'text', required: true, showInTable: true }, // Nuevo
        {
            name: 'estado',
            label: 'Estado Operativo',
            type: 'select',
            options: ['Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'Disponible'],
            required: true,
            showInTable: true
        }, // Nuevo
        { name: 'color', label: 'Color', type: 'text', required: true },
        {
            name: 'combustible',
            label: 'Combustible',
            type: 'select',
            options: ['Diesel', 'Gasolina', 'Gas', 'Eléctrico', 'Híbrido'],
            required: true
        },
        { name: 'horometro_actual', label: 'Horómetro Actual (Horas)', type: 'number', required: true, showInTable: true },
        { name: 'capacidad_carga', label: 'Capacidad de Carga/Levante', type: 'text', placeholder: 'Ej: 20 Ton, 3 m³' },
        { name: 'peso_operativo', label: 'Peso Operativo (kg)', type: 'number' },

        // 3. Registro Fotográfico (4 Ángulos - Requerido)
        { name: 'foto_frente', label: 'Foto Frontal', type: 'image', required: true },
        { name: 'foto_trasera', label: 'Foto Trasera', type: 'image', required: true },
        { name: 'foto_lateral_izq', label: 'Foto Lateral Izquierdo', type: 'image', required: true },
        { name: 'foto_lateral_der', label: 'Foto Lateral Derecho', type: 'image', required: true },

        // 4. Documentación y Legal
        { name: 'propietario', label: 'Propietario', type: 'text', required: true },
        { name: 'registro_ministerio', label: 'Registro RUNT / MinTransporte', type: 'text' },
        { name: 'fecha_vencimiento_soat', label: 'Vencimiento SOAT (Si aplica)', type: 'date' },
        { name: 'fecha_vencimiento_seguro', label: 'Vencimiento Seguro Todo Riesgo', type: 'date' },
        { name: 'fecha_ultima_certificacion', label: 'Última Certificación ONAC', type: 'date' },

        // 5. Fotos Documentos
        { name: 'foto_tarjeta_propiedad', label: 'Foto Tarjeta Propiedad / Manifiesto', type: 'image' },
        { name: 'foto_soat', label: 'Foto SOAT', type: 'image' },
        { name: 'foto_certificacion', label: 'Foto Certificación Vigente', type: 'image' },

        // 6. Dotación y Seguridad (Checklist)
        {
            name: 'elementos_seguridad',
            label: 'Elementos de Seguridad y Dotación',
            type: 'tri_state_checklist',
            options: [
                // MOTOR Y FLUIDOS
                'Nivel aceite motor y fugas visibles',
                'Nivel refrigerante y estado radiador',
                'Filtro de aire (indicador de restricción)',
                'Correas de ventilador y alternador',
                'Separador de agua / Filtro combustible',

                // SISTEMA HIDRÁULICO
                'Nivel aceite hidráulico (mirilla)',
                'Cilindros cargador (fugas, rayaduras)',
                'Cilindros retro (boom, dipper, bucket)',
                'Mangueras de alta presión (desgaste/fugas)',
                'Válvulas de control y mandos',

                // TREN DE POTENCIA Y RODAMIENTO
                'Nivel aceite transmisión',
                'Estado de Llantas (presión y cortes)',
                'Pernos de ruedas (torque visual)',
                'Frenos de servicio y parqueo',
                'Ejes y diferenciales (fugas)',

                // ESTRUCTURA Y HERRAMIENTAS
                'Balde frontal (cuchilla y pernos)',
                'Balde trasero (dientes y pasadores)',
                'Estabilizadores (zapatas y cilindros)',
                'Puntos de engrase (presencia de grasa)',
                'Chasis y articulación central (fisuras)',

                // SEGURIDAD Y CABINA
                'Luces de trabajo y emergencia',
                'Alarma de reversa y bocina',
                'Cinturón de seguridad y asiento',
                'Espejos y vidrios (limpieza/estado)',
                'Extintor y kit de derrames'
            ],
            columnLabels: ['Tiene', 'No Tiene', 'No Aplica']
        },

        // 7. Extintor Asignado
        {
            name: 'extintor_id',
            label: 'Extintor Asignado',
            type: 'firestore_select',
            collection: 'inventarios',
            filters: { categoria: 'extintores' },
            displayField: 'codigo + tipo_equipo',
            valueField: 'id',
            required: false // No siempre tienen uno fijo asignado en sistema, a veces es del operador
        }
    ]
};
