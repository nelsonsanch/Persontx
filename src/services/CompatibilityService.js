/**
 * Servicio para validar compatibilidad química basándose en NFPA 704 y GHS/UN Classes (SGA).
 * 
 * REFERENCIA SIMPLIFICADA DE SEGREGACIÓN:
 * - Clase 1 (Explosivos): Segregar de TODO.
 * - Clase 2.1, 3, 4.1, 4.2 (Inflamables): Segregar de Oxidantes (5.1) y Peróxidos (5.2) y Tóxicos (6.1) y Ácidos/Basess (8).
 * - Clase 5.1 (Oxidantes): Segregar de Inflamables y Combustibles.
 * - Clase 8 (Corrosivos): Segregar de Inflamables y separar Ácidos de Bases.
 */

export const getChemicalClass = (item) => {
    const nfpa = item.romboSeguridad || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '' };
    // ghs ahora es un ARRAY de strings, ej: ['Clase 3', 'Clase 8']
    // Normalizamos para manejar posibles strings sueltos o arrays vacíos
    let ghsList = [];
    if (Array.isArray(item.clasificacionPeligro)) {
        ghsList = item.clasificacionPeligro;
    } else if (item.clasificacionPeligro) {
        ghsList = [item.clasificacionPeligro];
    }

    const classes = new Set();

    // === ANÁLISIS POR GHS (CLASES UN) ===
    ghsList.forEach(ghs => {
        if (!ghs) return;

        if (ghs.includes('Clase 1')) classes.add('EXPLOSIVO');

        // Gases
        if (ghs.includes('Clase 2.1')) classes.add('GAS_INFLAMABLE');
        if (ghs.includes('Clase 2.2')) classes.add('GAS_NO_INFLAMABLE');
        if (ghs.includes('Clase 2.3')) classes.add('GAS_TOXICO');

        // Líquidos
        if (ghs.includes('Clase 3')) classes.add('LIQ_INFLAMABLE');

        // Sólidos
        if (ghs.includes('Clase 4.1')) classes.add('SOLIDO_INFLAMABLE');
        if (ghs.includes('Clase 4.2')) classes.add('ESPONTANEO'); // Pirofórico / Calentamiento espontáneo
        if (ghs.includes('Clase 4.3')) classes.add('REACTIVO_AGUA');

        // Oxidantes / Peróxidos
        if (ghs.includes('Clase 5.1')) classes.add('OXIDANTE');
        if (ghs.includes('Clase 5.2')) classes.add('PEROXIDO');

        // Tóxicos / Infecciosos
        if (ghs.includes('Clase 6.1')) classes.add('TOXICO');
        if (ghs.includes('Clase 6.2')) classes.add('INFECCIOSO');

        // Radioactivos
        if (ghs.includes('Clase 7')) classes.add('RADIOACTIVO');

        // Corrosivos
        if (ghs.includes('Clase 8')) classes.add('CORROSIVO');

        // Misceláneos
        if (ghs.includes('Clase 9')) classes.add('MISCELANEO');
    });

    // === ANÁLISIS POR NFPA (RESPALDO O ESPECIFICIDAD ADICIONAL) ===
    // Si no hay GHS, o para complementar (ej: ácidos vs bases)

    // Inflamabilidad alta (Si no se detectó por GHS pero tiene NFPA alto)
    if (parseInt(nfpa.inflamabilidad) >= 2) {
        if (!classes.has('LIQ_INFLAMABLE') && !classes.has('GAS_INFLAMABLE') && !classes.has('SOLIDO_INFLAMABLE')) {
            classes.add('LIQ_INFLAMABLE'); // Asumimos líquido por defecto si no se sabe
        }
    }

    // Oxidantes
    if (nfpa.especial === 'OX') classes.add('OXIDANTE');

    // Reactividad con Agua
    if (nfpa.especial === 'W' || nfpa.especial === '<s>W</s>') classes.add('REACTIVO_AGUA');

    // Ácidos / Bases (Refinamiento de Corrosivos)
    // El GHS Clase 8 solo dice "Corrosivo", no distingue Ácido de Base, vital para compatibilidad.
    // Usamos NFPA 'ACID'/'ALK' o palabras clave en el nombre si fuera necesario (aquí solo NFPA).
    if (nfpa.especial === 'ACID') classes.add('ACIDO');
    if (nfpa.especial === 'ALC' || nfpa.especial === 'ALK') classes.add('BASE');

    // Si es clase 8 pero no tenemos especificidad, lo marcamos genérico, pero si podemos inferir...
    // (Por ahora nos basamos en que el usuario defina en NFPA si es ácido o base para mayor precisión)

    return Array.from(classes);
};

export const checkCompatibility = (itemA, itemB) => {
    // 0. Misma sustancia
    if (itemA.id === itemB.id) return { status: 'SAME', color: '#e9ecef', icon: '—', msg: 'Misma Sustancia' };
    if (itemA.nombreProducto === itemB.nombreProducto) return { status: 'SAME', color: '#e9ecef', icon: '—', msg: 'Misma Sustancia' };

    const classesA = getChemicalClass(itemA);
    const classesB = getChemicalClass(itemB);

    // Helper para chequear si tiene alguna de las clases
    const has = (list, type) => list.includes(type);
    const hasAny = (list, types) => types.some(t => list.includes(t));

    const FLAMMABLES = ['GAS_INFLAMABLE', 'LIQ_INFLAMABLE', 'SOLIDO_INFLAMABLE', 'ESPONTANEO', 'REACTIVO_AGUA'];

    // --- 1. EXPLOSIVOS (Clase 1) ---
    // Incompatible con TODO (Incluso otros explosivos requieren segregación por grupo, aquí simplificamos a ALERTA MAXIMA)
    if (has(classesA, 'EXPLOSIVO') || has(classesB, 'EXPLOSIVO')) {
        // Excepción: Si ambos son explosivos... (igual riesgo alto)
        return { status: 'DANGER', color: '#000000', icon: '💣', msg: 'EXPLOSIVOS: Almacenamiento exclusivo y aislado. NO mezclar.' };
    }

    // --- 2. RADIOACTIVOS (Clase 7) ---
    if (has(classesA, 'RADIOACTIVO') || has(classesB, 'RADIOACTIVO')) {
        return { status: 'DANGER', color: '#800080', icon: '☢️', msg: 'RADIOACTIVO: Requiere blindaje y aislamiento estricto.' };
    }

    // --- 3. INFECCIOSOS (Clase 6.2) ---
    if (has(classesA, 'INFECCIOSO') || has(classesB, 'INFECCIOSO')) {
        return { status: 'DANGER', color: '#dc3545', icon: '☣️', msg: 'RIESGO BIOLÓGICO: Separar de químicos convencionales.' };
    }

    // --- 4. GASES COMPRIMIDOS (Clase 2) ---
    // Gases Inflamables vs Gases Tóxicos u Oxidantes
    if (has(classesA, 'GAS_INFLAMABLE') && (has(classesB, 'GAS_TOXICO') || has(classesB, 'OXIDANTE'))) return { status: 'DANGER', color: '#dc3545', icon: '⛔', msg: 'Separar Gases Inflamables de Tóxicos/Oxidantes.' };
    if (has(classesB, 'GAS_INFLAMABLE') && (has(classesA, 'GAS_TOXICO') || has(classesA, 'OXIDANTE'))) return { status: 'DANGER', color: '#dc3545', icon: '⛔', msg: 'Separar Gases Inflamables de Tóxicos/Oxidantes.' };

    // --- 5. INFLAMABLES (Líquidos, Sólidos, Gases) vs OTROS ---
    const isFlammableA = hasAny(classesA, FLAMMABLES);
    const isFlammableB = hasAny(classesB, FLAMMABLES);

    if (isFlammableA || isFlammableB) {
        // vs OXIDANTES (5.1)
        if (has(classesA, 'OXIDANTE') || has(classesB, 'OXIDANTE')) {
            return { status: 'DANGER', color: '#dc3545', icon: '🔥', msg: 'PELIGRO: Inflamable + Oxidante = Riesgo alto de incendio/explosión.' };
        }
        // vs PERÓXIDOS (5.2)
        if (has(classesA, 'PEROXIDO') || has(classesB, 'PEROXIDO')) {
            return { status: 'DANGER', color: '#dc3545', icon: '💥', msg: 'PELIGRO CRÍTICO: Peróxidos organicos + Inflamables.' };
        }
        // vs GASES TÓXICOS (2.3) o TÓXICOS (6.1)
        if (has(classesA, 'TOXICO') || has(classesB, 'TOXICO') || has(classesA, 'GAS_TOXICO') || has(classesB, 'GAS_TOXICO')) {
            return { status: 'CAUTION', color: '#ffc107', icon: '⚠️', msg: 'Precaución: Inflamables y Tóxicos deben estar segregados (riesgo en incendio).' };
        }
    }

    // --- 6. CORROSIVOS (Clase 8) ---
    // Generalmente incompatible con inflamables (pueden atacar contenedores y liberar vapores)
    if ((has(classesA, 'CORROSIVO') && isFlammableB) || (has(classesB, 'CORROSIVO') && isFlammableA)) {
        return { status: 'CAUTION', color: '#fd7e14', icon: '⚠️', msg: 'Corrosivos + Inflamables: Segregar. Riesgo de fuga o reacción exotérmica.' };
    }

    // ÁCIDOS vs BASES (Ambos son Clase 8 ghs, pero incompatibles entre sí)
    // Usamos los tags refinados de NFPA si existen
    if ((has(classesA, 'ACIDO') && has(classesB, 'BASE')) || (has(classesB, 'ACIDO') && has(classesA, 'BASE'))) {
        return { status: 'DANGER', color: '#dc3545', icon: '☠️', msg: 'PELIGRO: Ácido + Base = Reacción Violenta.' };
    }

    // Si ambos son corrosivos pero no sabemos si son ácido/base opuestos...
    if (has(classesA, 'CORROSIVO') && has(classesB, 'CORROSIVO') && !has(classesA, 'ACIDO') && !has(classesA, 'BASE')) {
        return { status: 'CAUTION', color: '#ffc107', icon: '❓', msg: 'Ambos Corrosivos: Verificar pH. Ácidos y Bases son incompatibles.' };
    }

    // --- 7. REACTIVOS CON AGUA (4.3) ---
    // Vs cualquier liquido o base acuosa (asumimos Corrosivos, Liq Inflamables como posibles fuentes de problema aunque no sean agua pura)
    if (has(classesA, 'REACTIVO_AGUA') || has(classesB, 'REACTIVO_AGUA')) {
        // Si el otro es un líquido de cualquier tipo...
        if (has(classesA, 'LIQ_INFLAMABLE') || has(classesB, 'LIQ_INFLAMABLE') || has(classesA, 'CORROSIVO') || has(classesB, 'CORROSIVO')) {
            return { status: 'DANGER', color: '#dc3545', icon: '💧', msg: 'PELIGRO: Reacciona con agua/líquidos. Mantener SECO.' };
        }
    }

    // --- 8. COMPATIBILIDAD POR DEFECTO ---
    return { status: 'OK', color: '#198754', icon: '✅', msg: 'Compatible' };
};
