/**
 * Servicio para validar compatibilidad química basándose en NFPA 704 y GHS/UN Classes.
 */

export const getChemicalClass = (item) => {
    const nfpa = item.romboSeguridad || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '' };
    // ghs ahora es un ARRAY de strings, ej: ['Clase 3', 'Clase 8']
    const ghsList = Array.isArray(item.clasificacionPeligro) ? item.clasificacionPeligro : [item.clasificacionPeligro || ''];

    const classes = new Set();

    // === ANÁLISIS POR GHS (CLASES UN) ===
    ghsList.forEach(ghs => {
        if (!ghs) return;

        if (ghs.includes('Clase 1')) classes.add('EXPLOSIVO');
        if (ghs.includes('Clase 2.1')) classes.add('GAS_INFLAMABLE');
        if (ghs.includes('Clase 2.3')) classes.add('GAS_TOXICO');
        if (ghs.includes('Clase 3')) classes.add('INFLAMABLE');
        if (ghs.includes('Clase 4.1')) classes.add('SOLIDO_INFLAMABLE');
        if (ghs.includes('Clase 4.2')) classes.add('ESPONTANEO'); // Pirofórico
        if (ghs.includes('Clase 4.3')) classes.add('REACTIVO_AGUA');
        if (ghs.includes('Clase 5.1')) classes.add('OXIDANTE');
        if (ghs.includes('Clase 5.2')) classes.add('PEROXIDO');
        if (ghs.includes('Clase 6.1')) classes.add('TOXICO');
        if (ghs.includes('Clase 8')) classes.add('CORROSIVO');
    });

    // === ANÁLISIS POR NFPA (RESPALDO O ESPECIFICIDAD) ===

    // Inflamabilidad alta
    if (parseInt(nfpa.inflamabilidad) >= 2) classes.add('INFLAMABLE');

    // Oxidantes
    if (nfpa.especial === 'OX') classes.add('OXIDANTE');

    // Reactividad con Agua
    if (nfpa.especial === 'W' || nfpa.especial === '<s>W</s>') classes.add('REACTIVO_AGUA');

    // Ácidos / Bases (Refinamiento de Corrosivos)
    if (nfpa.especial === 'ACID') classes.add('ACIDO');
    if (nfpa.especial === 'ALC' || nfpa.especial === 'ALK') classes.add('BASE');

    return Array.from(classes);
};

export const checkCompatibility = (itemA, itemB) => {
    const classesA = getChemicalClass(itemA);
    const classesB = getChemicalClass(itemB);

    if (itemA.id === itemB.id) return { status: 'SAME', color: '#e9ecef', icon: '—', msg: 'Misma Sustancia' };
    if (itemA.nombreProducto === itemB.nombreProducto) return { status: 'SAME', color: '#e9ecef', icon: '—', msg: 'Misma Sustancia' };

    // --- REGLAS DE SEGREGACIÓN (INCOMPATIBILIDADES) ---

    // 1. EXPLOSIVOS (Clase 1) - Incompatible con TODO excepto otros explosivos compatibles
    if (classesA.includes('EXPLOSIVO') || classesB.includes('EXPLOSIVO')) {
        return { status: 'DANGER', color: '#dc3545', icon: '💥', msg: 'EXPLOSIVOS: Segregar aisladamente de todo.' };
    }

    // 2. INFLAMABLES vs OXIDANTES (La reacción más común y peligrosa)
    const flammables = ['INFLAMABLE', 'GAS_INFLAMABLE', 'SOLIDO_INFLAMABLE', 'ESPONTANEO'];
    const isFlammableA = flammables.some(c => classesA.includes(c));
    const isFlammableB = flammables.some(c => classesB.includes(c));

    if ((isFlammableA && classesB.includes('OXIDANTE')) || (isFlammableB && classesA.includes('OXIDANTE'))) {
        return { status: 'DANGER', color: '#dc3545', icon: '🔥', msg: 'PELIGRO: Inflamable + Oxidante = Riesgo de Incendio Vigoroso.' };
    }

    // 2.1 INFLAMABLES vs PERÓXIDOS (Extremo cuidado)
    if ((isFlammableA && classesB.includes('PEROXIDO')) || (isFlammableB && classesA.includes('PEROXIDO'))) {
        return { status: 'DANGER', color: '#dc3545', icon: '💣', msg: 'PELIGRO CRÍTICO: Peróxidos son muy inestables con combustibles.' };
    }

    // 3. ÁCIDOS vs BASES
    if ((classesA.includes('ACIDO') && classesB.includes('BASE')) || (classesB.includes('ACIDO') && classesA.includes('BASE'))) {
        return { status: 'DANGER', color: '#fd7e14', icon: '⚠️', msg: 'Reacción Exotérmica Violenta (Ácido + Base).' };
    }

    // 3.1 CORROSIVOS vs INFLAMABLES (Muchos ácidos reaccionan liberando H2 con metales o calor con orgánicos)
    if ((classesA.includes('CORROSIVO') && isFlammableB) || (classesB.includes('CORROSIVO') && isFlammableA)) {
        return { status: 'CAUTION', color: '#ffc107', icon: '⚠️', msg: 'Precaución: Corrosivos pueden dañar contenedores inflamables.' };
    }

    // 4. REACTIVOS CON AGUA (Clase 4.3)
    if (classesA.includes('REACTIVO_AGUA') || classesB.includes('REACTIVO_AGUA')) {
        // Si el otro es líquido acuoso (difícil saber, asumimos cualquier líquido corrosivo o solución)
        // Por seguridad, advertir general
        return { status: 'CAUTION', color: '#ffc107', icon: '💧', msg: 'Sustancia reacciona con agua/humedad. Almacenar SECO.' };
    }

    // 5. GASES COMPRIMIDOS
    if ((classesA.includes('GAS_INFLAMABLE') && classesB.includes('GAS_TOXICO')) || (classesB.includes('GAS_INFLAMABLE') && classesA.includes('GAS_TOXICO'))) {
        return { status: 'CAUTION', color: '#ffc107', icon: '💨', msg: 'Segregar Gases Inflamables de Gases Tóxicos.' };
    }

    // 6. TOXICOS
    if ((classesA.includes('TOXICO') && !classesB.includes('TOXICO')) || (classesB.includes('TOXICO') && !classesA.includes('TOXICO'))) {
        // Generalmente se recomienda separar tóxicos para evitar contaminación cruzada en derrames
        // No es "Explosivo" pero es mala práctica almacenarlos juntos si uno es alimento/inocuo (no sabemos si el otro es inocuo)
        // Lo dejamos en OK/Verde a menos que sea muy específico, pero devolvemos aviso.
        return { status: 'OK', color: '#198754', icon: '✅', msg: 'Compatible (Mantener orden).' };
    }

    // Default
    return { status: 'OK', color: '#198754', icon: '✅', msg: 'Compatible' };
};
