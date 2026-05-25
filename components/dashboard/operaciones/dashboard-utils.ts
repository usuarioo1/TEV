import type { Servicio } from './types';
import { getSantiagoDateKey } from '@/lib/date-chile';

export const OPERACIONES_EXCEL_COLS = [
    { wch: 10 },
    { wch: 16 },
    { wch: 32 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 32 },
    { wch: 36 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 36 },
];

export function formatDateTime(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        hour12: false,
    });
}

export function getEstadoTexto(estado: string): string {
    const textos: Record<string, string> = {
        ASIGNADO: 'Asignado',
        ACEPTADO: 'Aceptado',
        RECHAZADO: 'Rechazado',
        PENDIENTE_APROBACION: 'Pendiente Aprobación',
        APROBADO: 'Aprobado',
        EN_EJECUCION: 'En Ejecución',
        COMPLETADO: 'Completado',
    };

    return textos[estado] || estado;
}

export function formatDateTimeOrEmpty(value: string | null | undefined): string {
    if (!value) return '';
    return formatDateTime(value);
}

export function normalizeFileNamePart(value: string): string {
    const cleaned = value
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .toLowerCase();

    return cleaned || 'todos';
}

export function buildOperacionesExportRows(servicios: Servicio[]) {
    return servicios.map((servicio) => ({
        'ID Servicio': servicio.id,
        'Código': servicio.codigo,
        'Descripción': servicio.descripcion,
        'Estado': getEstadoTexto(servicio.estado),
        'Estado (código)': servicio.estado,
        Origen: servicio.origen,
        Destino: servicio.destino,
        Operario: servicio.operario?.name || servicio.operario?.username || 'Sin operario',
        Coordinador: servicio.coordinador?.name || servicio.coordinador?.username || 'Sin coordinador',
        'Fecha asignación': formatDateTimeOrEmpty(servicio.fechaAsignacion),
        'Fecha aceptación': formatDateTimeOrEmpty(servicio.fechaAceptacion),
        'Fecha rechazo': formatDateTimeOrEmpty(servicio.fechaRechazo),
        'Fecha aprobación': formatDateTimeOrEmpty(servicio.fechaAprobacion),
        'Fecha inicio ejecución': formatDateTimeOrEmpty(servicio.fechaInicioEjecucion),
        'Fecha finalización': formatDateTimeOrEmpty(servicio.fechaFinalizacion),
        'Checklist equipo completado': servicio.checklistsCompletados.equipo ? 'SI' : 'NO',
        'Checklist fatiga completado': servicio.checklistsCompletados.fatiga ? 'SI' : 'NO',
        'Análisis de riesgo completado': servicio.checklistsCompletados.riesgos ? 'SI' : 'NO',
        'Porcentaje checklists completados': servicio.porcentajeCompletado,
        'Problemas detectados': servicio.problemas.join(' | '),
        'Hallazgos totales': servicio.hallazgos.total,
        'Hallazgos abiertos': servicio.hallazgos.abiertos,
        'Hallazgos cerrados': servicio.hallazgos.cerrados,
        'No Conformidades totales': servicio.noConformidades.total,
        'No Conformidades abiertas': servicio.noConformidades.abiertos,
        'No Conformidades cerradas': servicio.noConformidades.cerrados,
        'Observaciones servicio': servicio.observaciones || '',
        'Decisión supervisor': servicio.aprobacion
            ? (servicio.aprobacion.aprobado ? 'APROBADO' : 'RECHAZADO')
            : '',
        'Fecha decisión supervisor': formatDateTimeOrEmpty(servicio.aprobacion?.fechaDecision),
        'Supervisor decisión': servicio.aprobacion?.supervisor?.name || servicio.aprobacion?.supervisor?.username || '',
        'Observaciones decisión': servicio.aprobacion?.observaciones || '',
    }));
}

interface BuildOperacionesExcelFilenameArgs {
    fechaDesde?: string;
    fechaHasta?: string;
    estadoFiltro: string;
}

export function buildOperacionesExcelFilename({
    fechaDesde,
    fechaHasta,
    estadoFiltro,
}: BuildOperacionesExcelFilenameArgs): string {
    const hoy = getSantiagoDateKey(new Date());
    const desde = fechaDesde || 'sin-inicio';
    const hasta = fechaHasta || 'sin-fin';
    const estado = normalizeFileNamePart(estadoFiltro === 'TODOS' ? 'todos' : estadoFiltro);

    return `operaciones-${estado}-${desde}_a_${hasta}-${hoy}.xlsx`;
}
