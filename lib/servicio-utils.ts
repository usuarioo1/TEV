// Estados del servicio
export const ESTADOS_SERVICIO = {
    PENDIENTE: 'PENDIENTE',
    ASIGNADO: 'ASIGNADO',
    ACEPTADO: 'ACEPTADO',
    RECHAZADO: 'RECHAZADO',
    EN_CHECKLIST: 'EN_CHECKLIST',
    PENDIENTE_APROBACION: 'PENDIENTE_APROBACION',
    APROBADO: 'APROBADO',
    EN_EJECUCION: 'EN_EJECUCION',
    COMPLETADO: 'COMPLETADO',
    CANCELADO: 'CANCELADO',
} as const;

export type EstadoServicio = typeof ESTADOS_SERVICIO[keyof typeof ESTADOS_SERVICIO];
export const ESTADO_VISUAL_VOLVER_A_ENVIAR = 'VOLVER_A_ENVIAR' as const;
export type EstadoServicioVisual = EstadoServicio | typeof ESTADO_VISUAL_VOLVER_A_ENVIAR;

// Etiquetas de estado para UI
export const ESTADO_LABELS: Record<EstadoServicioVisual, string> = {
    PENDIENTE: 'Pendiente',
    ASIGNADO: 'Asignado',
    ACEPTADO: 'Aceptado',
    RECHAZADO: 'Rechazado',
    EN_CHECKLIST: 'Completando Checklists',
    VOLVER_A_ENVIAR: 'Volver a Enviar',
    PENDIENTE_APROBACION: 'Pendiente de Aprobación',
    APROBADO: 'Aprobado',
    EN_EJECUCION: 'En Ejecución',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
};

// Colores para los badges de estado
export const ESTADO_COLORS: Record<EstadoServicioVisual, string> = {
    PENDIENTE: 'bg-gray-100 text-gray-800',
    ASIGNADO: 'bg-blue-100 text-blue-800',
    ACEPTADO: 'bg-green-100 text-green-800',
    RECHAZADO: 'bg-red-100 text-red-800',
    EN_CHECKLIST: 'bg-yellow-100 text-yellow-800',
    VOLVER_A_ENVIAR: 'bg-red-100 text-red-800',
    PENDIENTE_APROBACION: 'bg-orange-100 text-orange-800',
    APROBADO: 'bg-emerald-100 text-emerald-800',
    EN_EJECUCION: 'bg-indigo-100 text-indigo-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
};

// Niveles de riesgo
export const NIVELES_RIESGO = {
    BAJO: 'BAJO',
    MEDIO: 'MEDIO',
    ALTO: 'ALTO',
    CRITICO: 'CRITICO',
} as const;

export type NivelRiesgo = typeof NIVELES_RIESGO[keyof typeof NIVELES_RIESGO];

export const RIESGO_COLORS: Record<NivelRiesgo, string> = {
    BAJO: 'bg-green-100 text-green-800',
    MEDIO: 'bg-yellow-100 text-yellow-800',
    ALTO: 'bg-orange-100 text-orange-800',
    CRITICO: 'bg-red-100 text-red-800',
};

// Transiciones de estado permitidas
export const TRANSICIONES_PERMITIDAS: Record<EstadoServicio, EstadoServicio[]> = {
    PENDIENTE: [ESTADOS_SERVICIO.ASIGNADO, ESTADOS_SERVICIO.CANCELADO],
    ASIGNADO: [ESTADOS_SERVICIO.ACEPTADO, ESTADOS_SERVICIO.RECHAZADO],
    ACEPTADO: [ESTADOS_SERVICIO.EN_CHECKLIST],
    RECHAZADO: [ESTADOS_SERVICIO.ASIGNADO, ESTADOS_SERVICIO.CANCELADO],
    EN_CHECKLIST: [ESTADOS_SERVICIO.PENDIENTE_APROBACION, ESTADOS_SERVICIO.RECHAZADO],
    PENDIENTE_APROBACION: [ESTADOS_SERVICIO.APROBADO, ESTADOS_SERVICIO.RECHAZADO],
    APROBADO: [ESTADOS_SERVICIO.EN_EJECUCION],
    EN_EJECUCION: [ESTADOS_SERVICIO.COMPLETADO, ESTADOS_SERVICIO.CANCELADO],
    COMPLETADO: [],
    CANCELADO: [],
};

/**
 * Verifica si una transición de estado es válida
 */
export function esTransicionValida(
    estadoActual: EstadoServicio,
    nuevoEstado: EstadoServicio
): boolean {
    return TRANSICIONES_PERMITIDAS[estadoActual]?.includes(nuevoEstado) || false;
}

/**
 * Obtiene el siguiente estado lógico según el flujo
 */
export function obtenerSiguienteEstado(estadoActual: EstadoServicio): EstadoServicio | null {
    const transiciones = TRANSICIONES_PERMITIDAS[estadoActual];
    return transiciones && transiciones.length > 0 ? transiciones[0] : null;
}

/**
 * Verifica si un servicio puede ser editado en su estado actual
 */
export function puedeEditar(estado: EstadoServicio): boolean {
    const estadosNoEditables: EstadoServicio[] = [
        ESTADOS_SERVICIO.COMPLETADO,
        ESTADOS_SERVICIO.CANCELADO,
        ESTADOS_SERVICIO.APROBADO,
    ];
    return !estadosNoEditables.includes(estado);
}

/**
 * Verifica si un servicio requiere acción del operario
 */
export function requiereAccionOperario(estado: EstadoServicio): boolean {
    const estadosConAccion: EstadoServicio[] = [
        ESTADOS_SERVICIO.ASIGNADO,
        ESTADOS_SERVICIO.ACEPTADO,
        ESTADOS_SERVICIO.EN_CHECKLIST,
        ESTADOS_SERVICIO.APROBADO,
        ESTADOS_SERVICIO.EN_EJECUCION,
    ];
    return estadosConAccion.includes(estado);
}

/**
 * Verifica si un servicio requiere acción del supervisor
 */
export function requiereAccionSupervisor(estado: EstadoServicio): boolean {
    return estado === ESTADOS_SERVICIO.PENDIENTE_APROBACION;
}
