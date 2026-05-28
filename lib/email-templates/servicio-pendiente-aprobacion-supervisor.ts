type ServicioPendienteAprobacionSupervisorTemplateData = {
    supervisorNombre?: string | null;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    operarioNombre?: string | null;
    coordinadorNombre?: string | null;
    fechaEnvioAprobacion?: Date | null;
};

type EmailTemplate = {
    subject: string;
    html: string;
    text: string;
};

const CHILE_TIME_ZONE = 'America/Santiago';

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
        timeStyle: 'short',
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

export function buildServicioPendienteAprobacionSupervisorEmail(
    data: ServicioPendienteAprobacionSupervisorTemplateData
): EmailTemplate {
    const supervisorNombre = data.supervisorNombre?.trim() || 'Supervisor';
    const fechaEnvioFormateada = formatFecha(data.fechaEnvioAprobacion);

    const htmlRows = [
        createInfoRow('Codigo', data.codigo),
        createInfoRow('Descripcion', data.descripcion),
        createInfoRow('Origen', data.origen),
        createInfoRow('Destino', data.destino),
        data.operarioNombre?.trim()
            ? createInfoRow('Operario', data.operarioNombre.trim())
            : null,
        data.coordinadorNombre?.trim()
            ? createInfoRow('Coordinador', data.coordinadorNombre.trim())
            : null,
        fechaEnvioFormateada
            ? createInfoRow('Fecha envio a aprobacion', fechaEnvioFormateada)
            : null,
    ]
        .filter(Boolean)
        .join('');

    const textLines = [
        `Hola ${supervisorNombre},`,
        'Un operario envio un servicio para tu revision y aprobacion.',
        `- Codigo: ${data.codigo}`,
        `- Descripcion: ${data.descripcion}`,
        `- Origen: ${data.origen}`,
        `- Destino: ${data.destino}`,
        data.operarioNombre?.trim() ? `- Operario: ${data.operarioNombre.trim()}` : null,
        data.coordinadorNombre?.trim() ? `- Coordinador: ${data.coordinadorNombre.trim()}` : null,
        fechaEnvioFormateada ? `- Fecha envio a aprobacion: ${fechaEnvioFormateada}` : null,
        '',
        'Ingresa a la plataforma para revisar los checklists y aprobar o rechazar el servicio.',
    ]
        .filter((line): line is string => Boolean(line))
        .join('\n');

    return {
        subject: `Servicio pendiente de aprobacion: ${data.codigo}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 720px; margin: 0 auto;">
                <div style="background: #1d4ed8; color: #ffffff; padding: 14px 18px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 20px;">Servicio pendiente de aprobacion</h2>
                </div>
                <div style="border: 1px solid #d1d5db; border-top: 0; border-radius: 0 0 8px 8px; padding: 18px;">
                    <p style="margin: 0 0 16px;">Hola ${escapeHtml(supervisorNombre)}, tienes un servicio asignado para revision.</p>
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Campo</th>
                                <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Informacion</th>
                            </tr>
                        </thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                    <p style="margin: 18px 0 0;">Ingresa a la plataforma para aprobar o rechazar este servicio.</p>
                </div>
            </div>
        `,
        text: textLines,
    };
}