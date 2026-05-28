import Link from 'next/link';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

/**
 * Botón para ir a la página de crear servicios
 * Solo visible para coordinadores y jefaturas
 */
export default async function CrearServicioButton() {
    const session = await getSession();

    // Verificar que el usuario tenga permisos (supervisor o superior)
    if (!session) return null;

    const allowedRoles: typeof session.rol[] = [ROLES.COORDINADOR, ROLES.JEFATURAS];
    const tienePermiso = allowedRoles.includes(session.rol);

    if (!tienePermiso) return null;

    return (
        <Link
            href="/servicios/nuevo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg mb-6"
        >
            Crear Servicios
        </Link>
    );
}
