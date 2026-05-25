import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

/**
 * Verifica que el usuario tenga uno de los roles permitidos
 * Redirige a /unauthorized si no tiene acceso
 */
export async function requireRole(allowedRoles: string[]): Promise<void> {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (!allowedRoles.includes(session.rol)) {
        redirect('/unauthorized');
    }
}

/**
 * Verifica que el usuario esté autenticado
 * Redirige a /login si no lo está
 */
export async function requireAuth() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return session;
}

/**
 * Verifica permisos basados en el rol
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
}

/**
 * Verifica si el usuario es coordinador
 */
export function isCoordinador(userRole: string): boolean {
    return userRole === ROLES.COORDINADOR;
}

/**
 * Verifica si el usuario es jefaturas (único con acceso al dashboard)
 */
export function isJefaturas(userRole: string): boolean {
    return userRole === ROLES.JEFATURAS;
}

/**
 * Verifica si el usuario es supervisor
 */
export function isSupervisor(userRole: string): boolean {
    return userRole === ROLES.SUPERVISOR;
}

/**
 * Verifica si el usuario es prevencionista
 */
export function isPrevencionista(userRole: string): boolean {
    return userRole === ROLES.PREVENCIONISTA;
}

/**
 * Verifica si el usuario puede asignar tareas/caminatas a otros
 * Solo prevencionistas pueden asignar
 */
export function canAssignTasks(userRole: string): boolean {
    return userRole === ROLES.PREVENCIONISTA;
}

/**
 * Verifica si el usuario puede crear reportes de seguridad
 * (Reportes de peligro, tarjetas stop, controles ART)
 */
export function canCreateSecurityReports(userRole: string): boolean {
    return userRole === ROLES.PREVENCIONISTA ||
        userRole === ROLES.SUPERVISOR ||
        userRole === ROLES.JEFATURAS;
}

/**
 * Verifica si el usuario puede verificar cierres de alertas
 * (cuando es responsable de cierre)
 */
export function canVerifyAlertClosures(userRole: string): boolean {
    return userRole === ROLES.PREVENCIONISTA ||
        userRole === ROLES.SUPERVISOR ||
        userRole === ROLES.JEFATURAS;
}

/**
 * Verifica si el usuario puede crear servicios (coordinadores y jefaturas)
 */
export function canCreateServices(userRole: string): boolean {
    return userRole === ROLES.COORDINADOR || userRole === ROLES.JEFATURAS;
}

/**
 * Verifica si el usuario puede acceder al dashboard (jefaturas y prevencionista)
 */
export function canAccessDashboard(userRole: string): boolean {
    return userRole === ROLES.JEFATURAS ||
        userRole === ROLES.PREVENCIONISTA;
}

/**
 * Verifica si el usuario es del área de taller
 */
export function isTaller(userRole: string): boolean {
    return userRole === ROLES.TALLER;
}

/**
 * Verifica si el usuario puede ver no conformidades
 */
export function canViewNoConformidades(userRole: string): boolean {
    return userRole === ROLES.TALLER ||
        userRole === ROLES.COORDINADOR ||
        userRole === ROLES.PREVENCIONISTA ||
        userRole === ROLES.JEFATURAS;
}

/**
 * Verifica si el usuario puede ver hallazgos
 */
export function canViewHallazgos(userRole: string): boolean {
    return userRole === ROLES.TALLER ||
        userRole === ROLES.COORDINADOR ||
        userRole === ROLES.PREVENCIONISTA ||
        userRole === ROLES.JEFATURAS;
}

// ─── Mapeo sección → rol responsable ────────────────────────────────────────

/** Tractocamión: qué rol gestiona cada sección del checklist */
export const TRACTO_CAMION_SECCION_ROL: Record<string, string> = {
    DOCUMENTACION: ROLES.COORDINADOR,
    EPP: ROLES.PREVENCIONISTA,
    LUCES_Y_MICAS: ROLES.TALLER,
    CONDICIONES_GENERALES: ROLES.TALLER,
    MECANICA_Y_MOTOR: ROLES.TALLER,
};

/** Semirremolque: qué rol gestiona cada sección del checklist */
export const SEMIREMOLQUE_SECCION_ROL: Record<string, string> = {
    CONEXIONES: ROLES.TALLER,
    'NEUMÁTICOS': ROLES.TALLER,
    GENERAL: ROLES.TALLER,
    ESTRUCTURA: ROLES.TALLER,
    'FIJACIÓN': ROLES.TALLER,
    DOCUMENTACION: ROLES.COORDINADOR,
};
