export const botiquinConfig = {
    id: 'botiquin',
    titulo: 'Inventario de Botiquines',
    coleccion: 'inventarios',
    filtroCategoria: 'botiquin',
    campos: [
        { name: 'ubicacion', label: 'Ubicación', type: 'text', required: true },
        {
            name: 'claseBotiquin', // Antes tipoBotiquin, cambiamos el name para coherencia si se puede, o solo label.
            label: 'Clase de Botiquín',
            type: 'select',
            options: ['Fijo (Pared)', 'Portátil (Tipo Canguro)', 'Maletín de Trauma', 'Vehicular'],
            required: true
        },
        {
            name: 'tipo',
            label: 'Tipo (Según Resolución)',
            type: 'select',
            options: ['Tipo A', 'Tipo B', 'Tipo C'],
            required: true
        },
        {
            name: 'elementos',
            label: 'Contenido y Existencias (Ingrese Cantidad)',
            type: 'checklist_with_quantity',
            options: [
                'GASAS LIMPIAS PAQUETE Paquete X 100',
                'GASAS ESTÉRILES PAQUETE Paquete por 3',
                'APÓSITO ó COMPRESAS NO ESTÉRILES Unidad',
                'ESPARADRAPO DE TELA ROLLO 4" Unidad',
                'BAJALENGUAS Paquete por 20',
                'VENDA ELÁSTICA 2 X 5 YARDAS Unidad',
                'VENDA ELÁSTICA 3 X 5 YARDAS Unidad',
                'VENDA ELÁSTICA 5 X 5 YARDAS Unidad',
                'VENDA DE ALGODÒN 3 X 5 YARDAS Unidad',
                'VENDA DE ALGODÒN 5 X 5 YARDAS Unidad',
                'CLORHEXIDINA O YODOPOVIDONA (JABÓN QUIRURGICO) Galón',
                'SOLUCIÓN SALINA 250 cc ó 500 cc Unidad',
                'GUANTES DE LÁTEX PARA EXAMEN Caja por 100',
                'TERMÓMETRO DE MERCURIO ó DIGITAL Unidad',
                'ALCOHOL ANTISÉPTICO FRASCO POR 275 ml Unidad',
                'TIJERAS Unidad',
                'LINTERNA Unidad',
                'PILAS DE REPUESTO Par',
                'TABLA ESPINAL LARGA Unidad',
                'COLLAR CERVICAL ADULTO Unidad',
                'COLLAR CERVICAL NIÑO Unidad',
                'INMOVILIZADORES ó FÉRULA MIEMBROS SUPERIORES (ADULTO)',
                'INMOVILIZADORES ó FÉRULA MIEMBROS INFERIORES (ADULTO)',
                'INMOVILIZADORES ó FÉRULA MIEMBROS SUPERIORES (NIÑO)',
                'INMOVILIZADORES ó FÉRULA MIEMBROS INFERIORES (NIÑO)',
                'VASOS DESECHABLES Paquete por 25',
                'TENSIÓMETRO Unidad',
                'FONENDOSCOPIO Unidad',
                'ELEMENTO DE BARRERA ó MÁSCARA PARA RCP'
            ]
        }
    ]
};
