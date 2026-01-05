export const botiquinConfig = {
    id: 'botiquin',
    titulo: 'Inventario de Botiquines',
    coleccion: 'inventarios',
    filtroCategoria: 'botiquin',
    campos: [
        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true },
        {
            name: 'tipoBotiquin',
            label: 'Tipo de Botiquín',
            type: 'select',
            options: ['Fijo (Pared)', 'Portátil (Tipo Canguro)', 'Maletín de Trauma', 'Vehicular'],
            required: true
        },
        { name: 'responsable', label: 'Responsable Inspección', type: 'text' },
        { name: 'fechaUltimaInspeccion', label: 'Fecha Última Inspección', type: 'date', required: true },
        {
            name: 'elementosFaltantes',
            label: 'Elementos Faltantes o Vencidos',
            type: 'textarea',
            placeholder: 'Liste los elementos que se deben reponer...'
        },
        {
            name: 'estadoGeneral',
            label: 'Estado General',
            type: 'select',
            options: ['Completo y Vigente', 'Incompleto', 'Con Elementos Vencidos'],
            required: true
        }
    ]
};
