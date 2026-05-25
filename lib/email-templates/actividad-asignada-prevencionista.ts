type ActividadAsignadaPrevencionistaTemplateData = {
    destinatarioNombre?: string | null;
    rolDestinatario: string;
    tipoActividad: string;
    descripcion?: string | null;
    fechaProgramada?: Date | null;
    fechaLimite?: Date | null;
    asignadoPorNombre?: string | null;
};

type EmailTemplate = {
    subject: string;
    html: string;
    text: string;
};

const CHILE_TIME_ZONE = 'America/Santiago';

const ROL_LABELS: Record<string, string> = {
    jefaturas: 'Jefatura',
    supervisor: 'Supervisor',
    prevencionista: 'Prevencionista',
};

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatFecha(fecha?: Date | null): string | null {
    if (!fecha || Number.isNaN(fecha.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('es-CL', {
        timeZone: CHILE_TIME_ZONE,
        dateStyle: 'medium',
    }).format(fecha);
}

function createInfoRow(label: string, value: string): string {
    return `
        <tr>
            <td style="padding: 10px 12px; width: 220px; color: #1f2937; background: #f3f4f6; border: 1px solid #e5e7eb;"><strong>${escapeHtml(label)}</strong></td>
            <td style="padding: 10px 12px; color: #111827; background: #ffffff; border: 1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>
    `;
}

export function buildActividadAsignadaPrevencionistaEmail(
    data: ActividadAsignadaPrevencionistaTemplateData
): EmailTemplate {
    const destinatarioNombre = data.destinatarioNombre?.trim() || 'Usuario';
    const rolDestinatarioLabel = ROL_LABELS[data.rolDestinatario] || data.rolDestinatario;
    const fechaProgramada = formatFecha(data.fechaProgramada);
    const fechaLimite = formatFecha(data.fechaLimite);

    const htmlRows = [
        createInfoRow('Actividad', data.tipoActividad),
        createInfoRow('Rol asignado', rolDestinatarioLabel),
        data.asignadoPorNombre?.trim()
            ? createInfoRow('Asignado por', data.asignadoPorNombre.trim())
            : null,
        fechaProgramada
            ? createInfoRow('Inicio programado', fechaProgramada)
            : null,
        fechaLimite
            ? createInfoRow('Fecha limite', fechaLimite)
            : null,
        data.descripcion?.trim()
            ? createInfoRow('Instrucciones', data.descripcion.trim())
            : null,
    ]
        .filter(Boolean)
        .join('');

    const textLines = [
        `Hola ${destinatarioNombre},`,
        'Tienes una nueva actividad asignada desde Prevencion de Riesgos.',
        `- Actividad: ${data.tipoActividad}`,
        `- Rol asignado: ${rolDestinatarioLabel}`,
        data.asignadoPorNombre?.trim() ? `- Asignado por: ${data.asignadoPorNombre.trim()}` : null,
        fechaProgramada ? `- Inicio programado: ${fechaProgramada}` : null,
        fechaLimite ? `- Fecha limite: ${fechaLimite}` : null,
        data.descripcion?.trim() ? `- Instrucciones: ${data.descripcion.trim()}` : null,
        '',
        'Ingresa a la plataforma para revisar y gestionar la actividad.',
    ]
        .filter((line): line is string => Boolean(line))
        .join('\n');

    return {
        subject: `Nueva actividad asignada: ${data.tipoActividad}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 720px; margin: 0 auto;">
                <div style="background: #6d28d9; color: #ffffff; padding: 14px 18px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 20px;">Actividad asignada por Prevencionista</h2>
                </div>
                <div style="border: 1px solid #d1d5db; border-top: 0; border-radius: 0 0 8px 8px; padding: 18px;">
                    <p style="margin: 0 0 16px;">Hola ${escapeHtml(destinatarioNombre)}, tienes una nueva actividad pendiente.</p>
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Campo</th>
                                <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Informacion</th>
                            </tr>
                        </thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                    <p style="margin: 18px 0 0;">Revisa la plataforma para completar la actividad dentro de plazo.</p>
                </div>
            </div>
        `,
        text: textLines,
    };
}