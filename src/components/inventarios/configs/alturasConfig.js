import { ALTURAS_CATALOG } from '../data/alturasCatalog';

export const alturasConfig = {
    id: 'alturas',
    titulo: 'Inventario de Equipo de Alturas',
    coleccion: 'inventarios', // Usamos 'inventarios' temporalmente por permisos en 'altura_equipment_assets'
    filtroCategoria: 'alturas', // Para orden interno
    campos: [
        { name: 'codigo_interno', label: 'Código Interno', type: 'text', required: false, showInTable: true, placeholder: 'Opcional (QR)' },
        { name: 'foto', label: 'Fotografía', type: 'image', showInTable: true },

        // CAMPOS DEPENDIENTES (Familia -> Tipo)
        {
            name: 'familia_tipo', // Nombre compuesto lógico, en realidad usa dos campos en BD
            label: 'Clasificación del Equipo',
            type: 'dependent_select',
            catalog: ALTURAS_CATALOG,
            required: true,
            showInTable: true
        },

        { name: 'marca', label: 'Marca', type: 'text', required: true, showInTable: true },
        { name: 'modelo', label: 'Modelo', type: 'text', required: true },
        { name: 'serial_lote', label: 'Serial / Lote', type: 'text', required: true, showInTable: true },

        { name: 'fecha_fabricacion', label: 'Fecha de Fabricación', type: 'date' },
        { name: 'fecha_primer_uso', label: 'Fecha de Puesta en Servicio', type: 'date' },
        { name: 'vida_util_meses', label: 'Vida Útil (Meses)', type: 'number', placeholder: 'Ej: 60' },

        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true, showInTable: true },
        { name: 'responsable', label: 'Responsable', type: 'text', required: true },
        {
            name: 'propietario',
            label: 'Propietario',
            type: 'select',
            options: ['Empresa', 'Contratista', 'Tercero', 'Alquilado'],
            required: true
        },

        {
            name: 'estado',
            label: 'Estado Actual',
            type: 'select',
            options: ['Apto', 'Apto con Observación', 'No Apto', 'Retirado'],
            required: true,
            showInTable: true
        },

        { name: 'fecha_ultima_inspeccion', label: 'Última Inspección', type: 'date', showInTable: true },
        { name: 'fecha_proxima_inspeccion', label: 'Próxima Inspección', type: 'date', showInTable: true },

        { name: 'notas', label: 'Notas / Observaciones', type: 'textarea' }
    ]
};
