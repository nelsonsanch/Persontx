/**
 * Servicio para validar compatibilidad química basándose en NFPA 704 y GHS.
 */

export const getChemicalClass = (item) => {
    const nfpa = item.romboSeguridad || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '' };
    const ghs = item.clasificacionPeligro || '';

    const classes = [];

    // 1. INFLAMABLES (Rojo >= 2 o GHS Inflamable)
    if (parseInt(nfpa.inflamabilidad) >= 2 || ghs === 'Inflamable' || ghs === 'Explosivo') {
        classes.push('INFLAMABLE');
    }

    // 2. OXIDANTES (Especial 'OX')
    if (nfpa.especial === 'OX') {
        classes.push('OXIDANTE');
    }

    // 3. ÁCIDOS (Especial 'ACID' o GHS Corrosivo y contexto... asumiendo 'ACID')
    if (nfpa.especial === 'ACID') {
        classes.push('ACIDO');
    }

    // 4. BASES / ALCALINOS (Especial 'ALC' o 'ALK')
    if (nfpa.especial === 'ALC' || nfpa.especial === 'ALK') {
        classes.push('BASE');
    }

    // 5. REACTIVOS CON AGUA (Especial 'W')
    if (nfpa.especial === 'W' || nfpa.especial === '<s>W</s>') {
        classes.push('REACTIVO_AGUA');
    }

    // 6. TÓXICOS (Azul >= 3 o GHS Tóxico)
    if (parseInt(nfpa.salud) >= 3 || ghs === 'Tóxico') {
        classes.push('TOXICO');
    }

    return classes;
};

export const checkCompatibility = (itemA, itemB) => {
    const classesA = getChemicalClass(itemA);
    const classesB = getChemicalClass(itemB);

    // Mismo ítem siempre es compatible consigo mismo (aunque redundante en matriz)
    if (itemA.id === itemB.id) return { status: 'SAME', color: 'gray', icon: '—' };
    if (itemA.nombreProducto === itemB.nombreProducto) return { status: 'SAME', color: 'gray', icon: '—' };

    // Reglas de Incompatibilidad (ROJO - DANGER)
    // Inflamable + Oxidante
    if (
        (classesA.includes('INFLAMABLE') && classesB.includes('OXIDANTE')) ||
        (classesB.includes('INFLAMABLE') && classesA.includes('OXIDANTE'))
    ) {
        return { status: 'DANGER', color: '#dc3545', icon: '⛔', msg: 'Riesgo de Incendio/Explosión (Inflamable + Oxidante)' };
    }

    // Ácido + Base
    if (
        (classesA.includes('ACIDO') && classesB.includes('BASE')) ||
        (classesB.includes('ACIDO') && classesA.includes('BASE'))
    ) {
        return { status: 'DANGER', color: '#dc3545', icon: '⛔', msg: 'Reacción Violenta (Ácido + Base)' };
    }

    // Ácido + Inflamable
    if (
        (classesA.includes('ACIDO') && classesB.includes('INFLAMABLE')) ||
        (classesB.includes('ACIDO') && classesA.includes('INFLAMABLE'))
    ) {
        return { status: 'DANGER', color: '#dc3545', icon: '⛔', msg: 'Posible liberación de gases/calor (Ácido + Inflamable)' };
    }

    // Reglas de Precaución (AMARILLO - CAUTION)
    // Tóxicos deben segregarse
    if (
        (classesA.includes('TOXICO') && !classesB.includes('TOXICO')) ||
        (classesB.includes('TOXICO') && !classesA.includes('TOXICO'))
    ) {
        return { status: 'CAUTION', color: '#ffc107', icon: '⚠️', msg: 'Segregar Tóxicos' };
    }

    // Por defecto: Compatible (VERDE)
    return { status: 'OK', color: '#198754', icon: '✅', msg: 'Compatible' };
};
