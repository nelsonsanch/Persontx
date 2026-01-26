export const PERMISSIONS = {
    // Módulos Principales
    MODULES: {
        RRHH: 'modulo_rrhh',
        PESV: 'modulo_pesv',
        INVENTARIOS: 'modulo_inventarios',
        DOCUMENTAL: 'modulo_documental',
        BASE_DATOS: 'modulo_base_datos',
        INDICADORES: 'modulo_indicadores',
        NOVEDADES: 'modulo_novedades',
        EMOS: 'modulo_emos',
        ENCUESTAS: 'modulo_encuestas',
        RECARGOS: 'modulo_recargos',
        PERFILES: 'modulo_perfiles',
        INSPECCIONES: 'modulo_inspecciones',
        PREOPERACIONALES: 'modulo_preoperacionales'
    },

    // Acciones Específicas (opcional para futuro uso granular)
    ACTIONS: {
        CREATE: 'crear',
        READ: 'leer',
        UPDATE: 'actualizar',
        DELETE: 'eliminar'
    }
};

export const DEFAULT_CLIENT_PERMISSIONS = Object.values(PERMISSIONS.MODULES); // Clientes tienen acceso a todo por defecto
