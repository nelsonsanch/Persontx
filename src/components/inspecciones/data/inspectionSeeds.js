// Semillas para Plantillas e Ítems de Inspección - Equipos de Alturas
// ID generados estáticamente para consistencia

// 0) Ítems Universales (Se agregan a todas las plantillas al momento de usarlas o aquí explícitamente)
// Nota: En esta implementación los repetiremos en cada lista para asegurar independencia, 
// o se podrían inyectar dinámicamente. Para simplicidad de este archivo, los definimos como constantes
// y los desconcentramos en el array gigante.

const ITEMS_UNIVERSALES = (tplId, startOrder) => [
    {
        id: `univ-${tplId}-01`,
        plantillaId: tplId,
        seccion: 'Identificación y condición general',
        orden: startOrder,
        pregunta: '¿Equipo identificado, etiqueta legible (marca/modelo/serial) y sin modificaciones no autorizadas?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: true,
        ayuda: 'Verifique serial, lote y ausencia de reparaciones caseras.'
    },
    {
        id: `univ-${tplId}-02`,
        plantillaId: tplId,
        seccion: 'Identificación y condición general',
        orden: startOrder + 1,
        pregunta: '¿Ausencia de daños visibles severos (grietas, deformación, cortes) que comprometan seguridad?',
        tipoRespuesta: 'SI_NO',
        esCritico: true,
        requiereFoto: false
    },
    {
        id: `univ-${tplId}-03`,
        plantillaId: tplId,
        seccion: 'Identificación y condición general',
        orden: startOrder + 2,
        pregunta: '¿Limpieza y condición permiten inspección (sin grasa/químicos que oculten fallas)?',
        tipoRespuesta: 'SI_NO',
        esCritico: false,
        requiereFoto: false
    },
    {
        id: `univ-${tplId}-04`,
        plantillaId: tplId,
        seccion: 'Identificación y condición general',
        orden: startOrder + 3,
        pregunta: 'Evidencia fotográfica general del equipo.',
        tipoRespuesta: 'FOTO_SOLO', // O manejo especial si el sistema soporta "Solo Foto"
        esCritico: false,
        requiereFoto: true
    }
];

export const PLANTILLAS = [
    {
        id: 'tpl-acceso-plat',
        nombre: 'Inspección Acceso y plataformas de trabajo',
        familia: 'Acceso y plataformas de trabajo',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-arnes',
        nombre: 'Inspección Arnés y soporte corporal',
        familia: 'Arnés y soporte corporal',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-conexion-abs',
        nombre: 'Inspección Conexión y absorción de energía',
        familia: 'Conexión y absorción de energía',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-conectores',
        nombre: 'Inspección Conectores',
        familia: 'Conectores',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-anticaidas',
        nombre: 'Inspección Dispositivos anticaídas',
        familia: 'Dispositivos anticaídas',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-lineas-anclaje',
        nombre: 'Inspección Líneas de vida y anclajes',
        familia: 'Líneas de vida y anclajes',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-ascenso-cuerdas',
        nombre: 'Inspección Ascenso, descenso y cuerdas',
        familia: 'Ascenso, descenso y cuerdas',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-rescate',
        nombre: 'Inspección Rescate y evacuación',
        familia: 'Rescate y evacuación',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-complementos',
        nombre: 'Inspección Complementos y EPP asociado',
        familia: 'Complementos y EPP asociado',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-almacenamiento',
        nombre: 'Inspección Almacenamiento y trazabilidad',
        familia: 'Almacenamiento y trazabilidad',
        activa: true,
        version: '2.0'
    },
    {
        id: 'tpl-sistema',
        nombre: 'Inspección Sistema',
        familia: 'Sistema',
        activa: true,
        version: '2.0'
    }
];

// Generación de ítems concatenando específicos + universales
const items_raw = [
    // 1) Acceso y plataformas de trabajo
    {
        plantillaId: 'tpl-acceso-plat',
        items: [
            { pregunta: 'Elementos estructurales íntegros (largueros/marcos/plataformas sin fisuras ni deformación).', esCritico: true },
            { pregunta: 'Componentes de apoyo/estabilidad en buen estado (zapatas/bases/estabilizadores).', esCritico: true },
            { pregunta: 'Sistemas de bloqueo/seguros operativos (bisagras, pasadores, frenos de rueda si aplica).', esCritico: true },
            { pregunta: 'Superficies de trabajo firmes y antideslizantes (plataforma/peldaños completos y seguros).', esCritico: true },
            { pregunta: 'Barandas/rodapiés/cadenas presentes donde aplique.', esCritico: true },
            { pregunta: 'Acceso seguro (escalera interna/externa fija y firme, si aplica).', esCritico: true },
            { pregunta: 'Señalización de carga/capacidad visible o documentada.', esCritico: false }
        ]
    },
    // 2) Arnés y soporte corporal
    {
        plantillaId: 'tpl-arnes',
        items: [
            { pregunta: 'Cintas sin cortes, desgarros, quemaduras o abrasión severa.', esCritico: true },
            { pregunta: 'Costuras completas (sin hilos sueltos/rotos o re-cosidos).', esCritico: true },
            { pregunta: 'Hebillas/ajustadores operan y aseguran el ajuste.', esCritico: true },
            { pregunta: 'Argollas “D” (dorsal/laterales/pecho) sin deformación ni corrosión severa.', esCritico: true },
            { pregunta: 'No hay evidencia de caída/impacto (estiramientos anormales, deformación de herrajes).', esCritico: true },
            { pregunta: 'Vida útil vigente según etiqueta/fabricante.', esCritico: true },
            { pregunta: 'Foto de etiqueta y argolla dorsal.', esCritico: false, requiereFoto: true }
        ]
    },
    // 3) Conexión y absorción de energía
    {
        plantillaId: 'tpl-conexion-abs',
        items: [
            { pregunta: 'Eslinga/cabo/cuerda sin daños (cortes/abrasión/quemaduras).', esCritico: true },
            { pregunta: 'Terminales y costuras íntegras.', esCritico: true },
            { pregunta: 'Absorbedor NO activado (sin despliegue / testigos de caída activados).', esCritico: true },
            { pregunta: 'Ganchos/mosquetones cierran y bloquean correctamente.', esCritico: true },
            { pregunta: 'Sin deformación/corrosión severa en conectores.', esCritico: true },
            { pregunta: 'Etiqueta legible y vida útil vigente.', esCritico: true },
            { pregunta: 'Foto del absorbedor + etiqueta.', esCritico: false, requiereFoto: true }
        ]
    },
    // 4) Conectores
    {
        plantillaId: 'tpl-conectores',
        items: [
            { pregunta: 'Cuerpo del conector sin grietas o deformación.', esCritico: true },
            { pregunta: 'Gatillo abre/cierra completamente (sin atasco).', esCritico: true },
            { pregunta: 'Seguro (rosca/automático) bloquea correctamente.', esCritico: true },
            { pregunta: 'Sin corrosión severa ni rebabas/bordes cortantes.', esCritico: true },
            { pregunta: 'Marcación/identificación visible.', esCritico: false },
            { pregunta: 'Foto del conector (2 caras).', esCritico: false, requiereFoto: true }
        ]
    },
    // 5) Dispositivos anticaídas
    {
        plantillaId: 'tpl-anticaidas',
        items: [
            { pregunta: 'Carcasa/cuerpo sin fisuras, golpes o deformación.', esCritico: true },
            { pregunta: 'Mecanismo de bloqueo/freno funciona (prueba funcional según procedimiento).', esCritico: true },
            { pregunta: 'Cable/cinta/riel sin daños (hebras, cortes, corrosión severa).', esCritico: true },
            { pregunta: 'Retracción/deslizamiento correcto (no se atasca).', esCritico: true },
            { pregunta: 'Conectores del dispositivo operativos y bloquean.', esCritico: true },
            { pregunta: 'Etiqueta legible y mantenimiento/recertificación vigente.', esCritico: true },
            { pregunta: 'Foto etiqueta + elemento activo (cable/cinta).', esCritico: false, requiereFoto: true }
        ]
    },
    // 6) Líneas de vida y anclajes
    {
        plantillaId: 'tpl-lineas-anclaje',
        items: [
            { pregunta: 'Línea (cable/cuerda/cinta/riel) sin daño o corrosión severa.', esCritico: true },
            { pregunta: 'Terminales/tensores/absorbedores del sistema íntegros.', esCritico: true },
            { pregunta: 'Puntos de anclaje firmes (sin holgura; estructura soporte en buen estado).', esCritico: true },
            { pregunta: 'Componentes intermedios/soportes de paso firmes (si aplica).', esCritico: true },
            { pregunta: 'Tensión adecuada y sin deformación por caída previa.', esCritico: true },
            { pregunta: 'Identificación/capacidad/certificación visible o documentada.', esCritico: true },
            { pregunta: 'Foto de anclaje(s) + tramo de línea.', esCritico: false, requiereFoto: true }
        ]
    },
    // 7) Ascenso, descenso y cuerdas
    {
        plantillaId: 'tpl-ascenso-cuerdas',
        items: [
            { pregunta: 'Cuerdas/cintas sin cortes, hebras, abrasión o quemaduras.', esCritico: true },
            { pregunta: 'Descensores/ascensores/bloqueadores sin grietas ni deformación.', esCritico: true },
            { pregunta: 'Mecanismos (leva/freno/bloqueo) funcionan correctamente.', esCritico: true },
            { pregunta: 'Poleas giran libremente (sin trabas) y sin bordes cortantes.', esCritico: true },
            { pregunta: 'Compatibilidad con diámetro de cuerda confirmada.', esCritico: true },
            { pregunta: 'Etiqueta/identificación vigente.', esCritico: true },
            { pregunta: 'Foto del elemento principal inspeccionado.', esCritico: false, requiereFoto: true }
        ]
    },
    // 8) Rescate y evacuación
    {
        plantillaId: 'tpl-rescate',
        items: [
            { pregunta: 'Kit completo según lista (componentes presentes).', esCritico: true },
            { pregunta: 'Cuerdas/eslingas/conectores del kit en buen estado.', esCritico: true },
            { pregunta: 'Dispositivo de descenso/evacuación operativo (prueba funcional).', esCritico: true },
            { pregunta: 'Trípode/dávit/estructura sin deformación, pasadores y seguros completos.', esCritico: true },
            { pregunta: 'Camilla/correas/puntos de izaje íntegros (si aplica).', esCritico: true },
            { pregunta: 'Estuche/bolsa en buen estado y almacenamiento adecuado.', esCritico: false },
            { pregunta: 'Foto del kit completo.', esCritico: false, requiereFoto: true }
        ]
    },
    // 9) Complementos y EPP asociado
    {
        plantillaId: 'tpl-complementos',
        items: [
            { pregunta: 'Casco sin fisuras/golpes severos y con barboquejo funcional.', esCritico: true },
            { pregunta: 'Retención de herramientas (líneas/anchajes) sin daños y asegura correctamente.', esCritico: true },
            { pregunta: 'Elementos complementarios sin deterioro que afecte su función (bolsas, porta-equipos).', esCritico: true },
            { pregunta: 'Vida útil/fecha vigente (si aplica).', esCritico: true },
            { pregunta: 'Foto del EPP/complemento.', esCritico: false, requiereFoto: true }
        ]
    },
    // 10) Almacenamiento y trazabilidad
    {
        plantillaId: 'tpl-almacenamiento',
        items: [
            { pregunta: 'Equipos almacenados limpios, secos y protegidos de químicos/sol/calor.', esCritico: false },
            { pregunta: 'Bolsas/estuches sin roturas, protegen el equipo.', esCritico: false },
            { pregunta: 'Etiquetas/QR legibles y coinciden con inventario.', esCritico: true },
            { pregunta: 'Registro de inspección actualizado (última inspección registrada).', esCritico: true },
            { pregunta: 'Foto del sitio de almacenamiento.', esCritico: false, requiereFoto: true }
        ]
    },
    // 11) Sistema
    {
        plantillaId: 'tpl-sistema',
        items: [
            { pregunta: 'Equipo tiene responsable asignado (custodio) y ubicación definida.', esCritico: true },
            { pregunta: 'Equipo tiene evidencia documental mínima (manual/certificado o ficha).', esCritico: false },
            { pregunta: 'Inspecciones programadas (fecha próxima inspección calculada o registrada).', esCritico: true },
            { pregunta: 'Equipo “No Apto” tiene control de retiro/bloqueo de uso documentado.', esCritico: true },
            { pregunta: 'Evidencia fotográfica/registro cargado.', esCritico: false, requiereFoto: true }
        ]
    }
];

// Construir array plano final
let builtItems = [];

items_raw.forEach(group => {
    // 1. Agregar Universales al inicio
    const universales = ITEMS_UNIVERSALES(group.plantillaId, 0); // Orden 0..3
    builtItems = [...builtItems, ...universales];

    // 2. Agregar Específicos
    group.items.forEach((it, idx) => {
        builtItems.push({
            id: `item-${group.plantillaId}-${idx + 5}`, // Orden sigue a universales
            plantillaId: group.plantillaId,
            seccion: 'Condición Específica',
            orden: idx + 5,
            pregunta: it.pregunta,
            tipoRespuesta: 'SI_NO',
            esCritico: it.esCritico,
            requiereFoto: it.requiereFoto || false
        });
    });
});

export const ITEMS_PLANTILLA = builtItems;
