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
        { name: 'foto_frente', label: 'Foto Frontal', type: 'image', required: true, showInTable: true },
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
                'Placa/Sticker de identificación del fabricante (marca, modelo, N° serie)',
                'N° de serie del equipo',
                'N° de serie del motor',
                'N° de serie de transmisión/convertidor (si aplica)',
                'Certificado/Condiciones de garantía',
                'Manual del operador',
                'Manual de mantenimiento/servicio',
                'Catálogo de repuestos (parts book)',
                'Plan de mantenimiento preventivo',
                'Ficha técnica del equipo',
                'Listado de lubricantes y capacidades',
                'Certificados ROPS/FOPS (si aplica)',
                'Licencia de tránsito / tarjeta de propiedad',
                'SOAT vigente',
                'Revisión técnico-mecánica y de emisiones',
                'Cinturón de seguridad del operador',
                'Bocina/claxon',
                'Alarma de reversa',
                'Luces de trabajo (delanteras/traseras)',
                'Baliza/estroboscópica (si aplica)',
                'Espejos y/o cámara de reversa (si aplica)',
                'Barandas/pasamanos y puntos de apoyo',
                'Calcomanías/avisos de seguridad del fabricante',
                'Interruptor de corte de batería (si aplica)',
                'Triángulo/reflectivos perimetrales (si aplica)',
                'Extintor (tipo ABC recomendado) con soporte',
                'Botiquín de primeros auxilios',
                'Dos señales triangulares reflectivas o lámparas intermitentes',
                'Dos tacos para bloquear el vehículo',
                'Linterna',
                'Caja de herramienta básica',
                'Gato y cruceta (si el equipo tiene llantas y aplica)',
                'Llanta de repuesto (si aplica)',
                'Juego de llaves de encendido (mín. 2)',
                'Llave de tapa de combustible/tapas con seguro (si aplica)',
                'Controles remotos/códigos/llaves especiales (si aplica)',
                'Implemento principal (p. ej., cucharón estándar) incluido',
                'Implementos adicionales (p. ej., martillo, horquillas, ripper) (si aplica)',
                'Mangueras, acoples y pasadores de implementos (si aplica)',
                'Kit de filtros inicial (si aplica)',
                'Pasadores/chavetas/juego de dientes o cuchillas (si aplica)',
                'Módulo de telemetría / GPS / SIM',
                'Acceso a plataforma (usuario, permisos)'
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
