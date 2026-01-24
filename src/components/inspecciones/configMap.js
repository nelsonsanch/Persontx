import { extintoresConfig } from '../inventarios/configs/extintoresConfig';
import { botiquinConfig } from '../inventarios/configs/botiquinConfig';
import { camillasConfig } from '../inventarios/configs/camillasConfig';
import { gabinetesConfig } from '../inventarios/configs/gabinetesConfig';
import { otrosConfig } from '../inventarios/configs/otrosConfig';
import { sustanciasQuimicasConfig } from '../inventarios/configs/sustanciasQuimicasConfig';
import { alturasConfig } from '../inventarios/configs/alturasConfig';
import { activosConfig } from '../inventarios/configs/activosConfig';

export const INSPECTION_CATEGORIES = [
    { key: 'extintores', label: 'Extintores', icon: '🧯', config: extintoresConfig, color: 'danger' },
    { key: 'gabinetes', label: 'Gabinetes Incendio', icon: '🚒', config: gabinetesConfig, color: 'danger' },
    { key: 'botiquin', label: 'Botiquines', icon: '🩺', config: botiquinConfig, color: 'primary' },
    { key: 'camillas', label: 'Camillas', icon: '🛏️', config: camillasConfig, color: 'info' },
    { key: 'alturas', label: 'Equipos de Alturas', icon: '🧗', config: alturasConfig, color: 'primary' },
    { key: 'quimicos', label: 'Sustancias Químicas', icon: '🧪', config: sustanciasQuimicasConfig, color: 'warning' },
    { key: 'activos', label: 'Herramientas', icon: '🛠️', config: activosConfig, color: 'secondary' },
    { key: 'otros', label: 'Otros Equipos', icon: '📦', config: otrosConfig, color: 'dark' },
];

export const getCategoryConfig = (key) => {
    const cat = INSPECTION_CATEGORIES.find(c => c.key === key);
    return cat ? cat.config : null;
};
