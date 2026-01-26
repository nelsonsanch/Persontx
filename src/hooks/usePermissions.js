import { useAuth } from './useAuth';
import { PERMISSIONS } from '../config/permissions';

export const usePermissions = () => {
    const { userRole, userData } = useAuth(); // userData viene de useAuth (necesitamos actualizar useAuth)

    const can = (permissionKey) => {
        // 1. Administradores y Clientes (Dueños de cuenta) tienen acceso total
        if (userRole === 'admin' || userRole === 'cliente') {
            return true;
        }

        // 2. Trabajadores (Usuarios secundarios) dependen de su lista de permisos
        if (userRole === 'trabajador') {
            if (!userData || !userData.permisos) return false;
            return userData.permisos.includes(permissionKey);
        }

        return false;
    };

    return { can };
};
