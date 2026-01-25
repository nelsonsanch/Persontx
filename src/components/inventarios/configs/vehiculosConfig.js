export const vehiculosConfig = {
    id: 'vehiculos',
    titulo: 'Inventario de Vehículos (PESV)',
    coleccion: 'inventarios',
    filtroCategoria: 'vehiculos', // Identificador en la BD
    campos: [
        // Datos del Vehículo (Izquierda en la imagen)
        {
            name: 'tipo_vehiculo',
            label: 'Tipo de Vehículo',
            type: 'select',
            options: ['Automóvil', 'Camioneta', 'Camión', 'Bus', 'Buseta', 'Microbus', 'Motocicleta', 'Otro'],
            required: true,
            showInTable: true
        },
        {
            name: 'tipo_carroceria',
            label: 'Tipo de Carrocería',
            type: 'select',
            options: [
                'Estacas', 'Furgón', 'Tanque', 'Volco', 'Tolva', 'Planchón', 'Cerrada', 'Sedán',
                'Estibas', 'Remolque', 'Pick Up', 'Platón', 'Hormigonera', 'Reparto', 'Grúa',
                'Mixta', 'Nevera', 'Coupé', 'Convertible', 'Cabinado', 'Carpado', 'Station Wagon',
                'Panel', 'Doble Cabina', 'Bombero', 'Cuatrimoto', 'Compactador', 'Barredora',
                'Trailer', 'Turismo', 'Escolar', 'Cabezote', 'Plataforma', 'Botellero', 'Basurero',
                'Mezcladora', 'Autobomba', 'Recolector', 'Granelero', 'Frigorífico', 'Termoking',
                'Vanette', 'Abierta', 'Tractomula', 'Escalera', 'Articulado', 'Ambulancia',
                'Cama Baja', 'Contenedor', 'Cisterna', 'Volqueta', 'Otro'
            ],
            required: true
        },
        { name: 'linea', label: 'Línea', type: 'text', placeholder: 'Ej: Trafic, Duster...', required: true },
        { name: 'cilindraje', label: 'Cilindraje', type: 'number', placeholder: 'Ej: 1598' },
        { name: 'capacidad', label: 'Capacidad (Pasajeros/Ton)', type: 'text', required: true, showInTable: true },
        {
            name: 'tipo_carga',
            label: 'Tipo de Carga',
            type: 'select',
            options: ['Pasajeros', 'Carga Normal', 'Carga Peligrosa', 'Desechos Peligrosos'],
            required: true
        },

        // Datos Centrales
        { name: 'placa', label: 'Placa', type: 'text', required: true, showInTable: true }, // Key field
        { name: 'color', label: 'Color', type: 'text', required: true },
        { name: 'no_serie', label: 'Nº Serie / Chasis', type: 'text', required: true },
        { name: 'fecha_matricula', label: 'Fecha de Matrícula', type: 'date', required: true },

        // Fotos del Vehículo (4 Ángulos)
        { name: 'foto_frente', label: 'Foto Frente', type: 'image', showInTable: true },
        { name: 'foto_trasera', label: 'Foto Trasera', type: 'image' },
        { name: 'foto_izquierda', label: 'Foto Izquierda', type: 'image' },
        { name: 'foto_derecha', label: 'Foto Derecha', type: 'image' },

        // Datos Derecha
        { name: 'modelo', label: 'Modelo (Año)', type: 'number', required: true },
        { name: 'marca', label: 'Marca', type: 'text', required: true, showInTable: true },
        { name: 'no_motor', label: 'Nº Motor', type: 'text', required: true },
        {
            name: 'combustible',
            label: 'Combustible',
            type: 'select',
            options: ['Gasolina', 'Diesel', 'Gas', 'Híbrido', 'Eléctrico'],
            required: true
        },
        { name: 'kilometraje_actual', label: 'Kilometraje Actual (Km)', type: 'number', placeholder: 'Ej: 45000', required: true },

        // Propietario
        { name: 'propietario', label: 'Propietario', type: 'text', required: true },
        { name: 'identificacion_propietario', label: 'Identificación Propietario', type: 'text' },
        { name: 'telefono_propietario', label: 'Teléfono Propietario', type: 'text' },

        // SOAT y Tecno (Fechas)
        { name: 'fecha_vencimiento_soat', label: 'Vencimiento SOAT', type: 'date' },
        { name: 'fecha_vencimiento_tecno', label: 'Vencimiento Tecnomecánica', type: 'date' },

        // Documentación Digital (Fotos)
        { name: 'foto_tarjeta_propiedad', label: 'Foto Tarjeta de Propiedad', type: 'image' },
        { name: 'foto_soat', label: 'Foto SOAT', type: 'image' },
        { name: 'foto_tecnomecanica', label: 'Foto Rev. Tecnomecánica', type: 'image' },
        { name: 'foto_poliza', label: 'Foto Póliza Contractual (Opcional)', type: 'image' },

        // Dotación y Componentes
        { name: 'numero_ejes', label: 'Número de Ejes', type: 'number', placeholder: 'Ej: 2' },

        // Extintor Detallado
        // Extintor Asociado (Dinámico desde Inventario de Extintores)
        {
            name: 'extintor_id',
            label: 'Extintor Asignado',
            type: 'firestore_select',
            collection: 'inventarios',
            filters: { categoria: 'extintores' }, // Solo mostrar extintores
            displayField: 'codigo + tipo_equipo', // Muestra "EXT-001 - ABC" (Concatenado)
            valueField: 'id', // Guarda el ID del documento
            required: true
        },

        // Checklist de Componentes (Si/No/NA)
        {
            name: 'componentes_vehiculo',
            label: 'Lista de Chequeo - Dotación',
            type: 'tri_state_checklist',
            options: [
                'Llanta de Repuesto',
                'Botiquín',
                'Tacos / Cuñas',
                'Conos / Señalización',
                'Gato Hidráulico/Mecánico',
                'Cruceta / Herramienta',
                'Extintor (Cargado)',
                'Espejos Laterales/Retrovisor',
                'Silletería en Buen Estado',
                'Cinturones de Seguridad',
                'Radio / Pasacintas',
                'Sistema de Comunicación (Radio Teléfono)',
                'GPS / Satelital',
                'Chaleco Reflectivo',
                'Linterna'
            ]
        }
    ]
};
