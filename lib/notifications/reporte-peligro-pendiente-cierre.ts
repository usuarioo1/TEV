import { sendReportePeligroPendienteCierreEmail } from '@/lib/resend';

type ResponsableCierreNotificacion = {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
};

type ReportePeligroPendienteCierreNotificacionParams = {
    reporteId: number;
    estado: string;
    datos: unknown;
    responsableCierre: ResponsableCierreNotificacion | null;
    creadoPorNombre?: string | null;
    caminataCodigo?: string | null;
};

function getStringValue(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return null;
}

function getDateValue(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDataField(datos: Record<string, unknown>, key: string): string | null {
    return getStringValue(datos[key]);
}

function toRecord(datos: unknown): Record<string, unknown> {
    if (typeof datos === 'object' && datos !== null) {
        return datos as Record<string, unknown>;
    }

    return {};
}

export async function notifyReportePeligroPendienteCierre(
    params: ReportePeligroPendienteCierreNotificacionParams
): Promise<void> {
    if (!params.responsableCierre) {
        return;
    }

    if (!params.responsableCierre.email?.trim()) {
        console.warn(`Usuario ${params.responsableCierre.id} no tiene email. Se omite notificacion de reporte.`);
        return;
    }

    const datos = toRecord(params.datos);

    try {
        await sendReportePeligroPendienteCierreEmail({
            to: params.responsableCierre.email,
            destinatarioNombre: params.responsableCierre.name || params.responsableCierre.username,
            reporteId: params.reporteId,
            estado: params.estado,
            tipoPeligro: getDataField(datos, 'tipoPeligro'),
            zona: getDataField(datos, 'zonas'),
            faena: getDataField(datos, 'faena'),
            actividad: getDataField(datos, 'actividad'),
            tarea: getDataField(datos, 'tarea'),
            ubicacion: getDataField(datos, 'ubicacion'),
            tipoRiesgo: getDataField(datos, 'tipoRiesgo'),
            nivelHallazgo: getDataField(datos, 'nivelHallazgo'),
            plazoCierre: getDateValue(datos.plazoCierre),
            descripcionPeligro: getDataField(datos, 'descripcionPeligro'),
            consecuenciaPotencial: getDataField(datos, 'consecuenciaPotencial'),
            medidasSugeridas: getDataField(datos, 'medidasSugeridas'),
            reportadoPorNombre: params.creadoPorNombre,
            fechaReporte: getDateValue(datos.fechaReporte),
            caminataCodigo: params.caminataCodigo,
        });

        console.log('Correo de reporte pendiente de cierre enviado a:', params.responsableCierre.email);
    } catch (error) {
        console.error('No se pudo enviar correo de reporte pendiente de cierre:', error);
    }
}
