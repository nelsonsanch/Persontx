// Semillas para Plantillas e Ítems de Inspección - Equipos de Alturas
// ID generados estáticamente para consistencia en esta demo

export const PLANTILLAS = [
    // 1. ARNÉS
    {
        id: 'tpl-arnes-001',
        nombre: 'Inspección Arnés de Cuerpo Completo',
        familia: 'Arnés y soporte corporal',
        tiposAplicables: [
            "Arnés de Cuerpo Completo",
            "Arnés de Rescate (Con Puntos de Izaje)",
            "Arnés de Posicionamiento",
            "Arnés para Espacios Confinados"
        ],
        activa: true,
        version: '1.0'
    },
    // 2. ESLINGAS (ABSORBEDOR)
    {
        id: 'tpl-eslinga-abs-001',
        nombre: 'Inspección Eslingas y Elementos de Conexión',
        familia: 'Conexión y absorción de energía',
        tiposAplicables: [
            "Eslinga Sencilla con Absorbedor de Energía",
            "Eslinga Doble (En Y) con Absorbedor de Energía",
            "Eslinga en Y sin Absorbedor de Energía",
            "Eslinga de Posicionamiento (Regulable)",
            "Eslinga de Restricción (Sin Absorbedor)",
            "Cabo de Vida / Línea de Conexión (Lanyard)",
            "Absorbedor de Energía (Repuesto / Integrado)",
            "Cuerda de Seguridad (Conector a Línea de Vida)",
            "Eslinga de Anclaje (Tie-Off / Choker)",
            "Cinta de Anclaje (Tie-Off)",
            "Extensor de Anclaje"
        ],
        activa: true,
        version: '1.0'
    },
    // 3. CONECTORES
    {
        id: 'tpl-conector-001',
        nombre: 'Inspección Conectores (Mosquetones y Ganchos)',
        familia: 'Conectores',
        tiposAplicables: [
            "Mosquetón de Seguridad (Rosca / Automático)",
            "Gancho de Andamio (Scaffold Hook)",
            "Gancho de Rebar / Varilla",
            "Gancho de Ojo / Snap Hook",
            "Conector de Gran Apertura",
            "Maillón / Eslabón Rápido (Quick Link)"
        ],
        activa: true,
        version: '1.0'
    }
];

export const ITEMS_PLANTILLA = [
    // --- ITEMS ARNÉS (tpl-arnes-001) ---
    {
        id: 'item-arn-01',
        plantillaId: 'tpl-arnes-001',
        seccion: 'Cintas y Tejidos',
        orden: 1,
        pregunta: '¿Las correas tienen cortes, quemaduras, deshilachados o desgaste excesivo?',
        tipoRespuesta: 'SI_NO',
        esCritico: true, // Si hay cortes, es crítico
        requiereFoto: true,
        ayuda: 'Revise toda la longitud de las correas.'
    },
    {
        id: 'item-arn-02',
        plantillaId: 'tpl-arnes-001',
        seccion: 'Cintas y Tejidos',
        orden: 2,
        pregunta: '¿Las costuras están completas, sin hilos sueltos o cortados?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: false
    },
    {
        id: 'item-arn-03',
        plantillaId: 'tpl-arnes-001',
        seccion: 'Argollas y Herrajes',
        orden: 3,
        pregunta: '¿Las argollas en D están deformadas, oxidadas o con fisuras?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true
    },
    {
        id: 'item-arn-04',
        plantillaId: 'tpl-arnes-001',
        seccion: 'Hebillas y Ajustes',
        orden: 4,
        pregunta: '¿Las hebillas de ajuste funcionan correctamente y no tienen bordes filosos?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: false
    },
    {
        id: 'item-arn-05',
        plantillaId: 'tpl-arnes-001',
        seccion: 'Etiquetas',
        orden: 5,
        pregunta: '¿La etiqueta de certificación y serial es legible?',
        tipoRespuesta: 'SI_NO',
        esCritico: false, // No crítico para seguridad inmediata, pero sí normativa
        requiereFoto: true
    },
    {
        id: 'item-arn-06',
        plantillaId: 'tpl-arnes-001',
        seccion: 'Indicadores de Impacto',
        orden: 6,
        pregunta: '¿Los indicadores de impacto (testigos) están activados o rotos?',
        tipoRespuesta: 'SI_NO',
        esCritico: true, // CLAVE
        requiereFoto: true,
        ayuda: 'Si se ven hilos rojos o la etiqueta de "STOP" está visible, el equipo sufrió una caída.'
    },

    // --- ITEMS ESLINGA (tpl-eslinga-abs-001) ---
    {
        id: 'item-esl-01',
        plantillaId: 'tpl-eslinga-abs-001',
        seccion: 'Cinta / Cuerda',
        orden: 1,
        pregunta: '¿La cinta o cuerda presenta cortes, quemaduras o abrasión severa?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true
    },
    {
        id: 'item-esl-02',
        plantillaId: 'tpl-eslinga-abs-001',
        seccion: 'Ganchos y Mosquetones',
        orden: 2,
        pregunta: '¿Los ganchos abren y cierran automáticamante (doble seguro) sin trabarse?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: false
    },
    {
        id: 'item-esl-03',
        plantillaId: 'tpl-eslinga-abs-001',
        seccion: 'Absorbedor de Energía',
        orden: 3,
        pregunta: '¿El paquete absorbedor está intacto (sin roturas en la cubierta plástica/textil)?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true
    },
    {
        id: 'item-esl-04',
        plantillaId: 'tpl-eslinga-abs-001',
        seccion: 'Absorbedor de Energía',
        orden: 4,
        pregunta: '¿Se evidencia activación del absorbedor (elongación, etiqueta de alerta)?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true
    },

    // --- ITEMS CONECTORES (tpl-conector-001) ---
    {
        id: 'item-con-01',
        plantillaId: 'tpl-conector-001',
        seccion: 'Cuerpo',
        orden: 1,
        pregunta: '¿Presenta deformaciones, fisuras o golpes profundos?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true
    },
    {
        id: 'item-con-02',
        plantillaId: 'tpl-conector-001',
        seccion: 'Mecanismo de Cierre',
        orden: 2,
        pregunta: '¿El gatillo cierra y bloquea automáticamente al soltarlo?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: false
    },
    {
        id: 'item-con-03',
        plantillaId: 'tpl-conector-001',
        seccion: 'Corrosión',
        orden: 3,
        pregunta: '¿Presenta corrosión que afecte el funcionamiento o reduzca el espesor?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true
    }
];
