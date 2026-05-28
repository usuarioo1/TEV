type ServicioAsignadoOperarioTemplateData = {
    operarioNombre?: string | null;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    telefonoOrigen?: string | null;
    telefonoDestino?: string | null;
    observaciones?: string | null;
    coordinadorNombre?: string | null;
    fechaAsignacion?: Date | null;
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

function formatFechaAsignacion(fechaAsignacion?: Date | null): string | null {
    if (!fechaAsignacion || Number.isNaN(fechaAsignacion.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('es-CL', {
        timeZone: CHILE_TIME_ZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(fechaAsignacion);
}

function createInfoRow(label: string, value: string): string {
    return `
        <tr>
                    <td style="padding: 10px 12px; width: 220px; color: #1f2937; background: #f3f4f6; border: 1px solid #e5e7eb;"><strong>${escapeHtml(label)}</strong></td>
                    <td style="padding: 10px 12px; color: #111827; background: #ffffff; border: 1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>
    `;
}

export function buildServicioAsignadoOperarioEmail(
    data: ServicioAsignadoOperarioTemplateData
): EmailTemplate {
    const operarioNombre = data.operarioNombre?.trim() || 'Operario';
    const fechaAsignacionFormateada = formatFechaAsignacion(data.fechaAsignacion);

    const htmlRows = [
        createInfoRow('Codigo', data.codigo),
        createInfoRow('Descripcion', data.descripcion),
        createInfoRow('Origen', data.origen),
        createInfoRow('Destino', data.destino),
        data.telefonoOrigen?.trim()
            ? createInfoRow('Telefono origen', data.telefonoOrigen.trim())
            : null,
        data.telefonoDestino?.trim()
            ? createInfoRow('Telefono destino', data.telefonoDestino.trim())
            : null,
        data.coordinadorNombre?.trim()
            ? createInfoRow('Coordinador', data.coordinadorNombre.trim())
            : null,
        fechaAsignacionFormateada
            ? createInfoRow('Fecha asignacion', fechaAsignacionFormateada)
            : null,
        data.observaciones?.trim()
            ? createInfoRow('Observaciones', data.observaciones.trim())
            : null,
    ]
        .filter(Boolean)
        .join('');

    const textLines = [
        `Hola ${operarioNombre},`,
        'Tienes un nuevo servicio asignado:',
        `- Codigo: ${data.codigo}`,
        `- Descripcion: ${data.descripcion}`,
        `- Origen: ${data.origen}`,
        `- Destino: ${data.destino}`,
        data.telefonoOrigen?.trim() ? `- Telefono origen: ${data.telefonoOrigen.trim()}` : null,
        data.telefonoDestino?.trim() ? `- Telefono destino: ${data.telefonoDestino.trim()}` : null,
        data.coordinadorNombre?.trim() ? `- Coordinador: ${data.coordinadorNombre.trim()}` : null,
        fechaAsignacionFormateada ? `- Fecha asignacion: ${fechaAsignacionFormateada}` : null,
        data.observaciones?.trim() ? `- Observaciones: ${data.observaciones.trim()}` : null,
        '',
        'Revisa la plataforma para gestionar este servicio.',
    ]
        .filter((line): line is string => Boolean(line))
        .join('\n');

    return {
        subject: `Nuevo servicio asignado: ${data.codigo}`,
        html: `
                    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 720px; margin: 0 auto;">
                        <div style="background: #0f766e; color: #ffffff; padding: 14px 18px; border-radius: 8px 8px 0 0;">
                            <h2 style="margin: 0; font-size: 20px;">Nuevo servicio asignado</h2>
                        </div>
                        <div style="border: 1px solid #d1d5db; border-top: 0; border-radius: 0 0 8px 8px; padding: 18px;">
                            <p style="margin: 0 0 16px;">Hola ${escapeHtml(operarioNombre)}, este es el resumen basico del servicio creado por coordinacion.</p>
                            <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Campo</th>
                                        <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Informacion</th>
                                    </tr>
                                </thead>
                                <tbody>${htmlRows}</tbody>
                            </table>
                            <p style="margin: 18px 0 0;">Ingresa a la plataforma para aceptarlo o rechazarlo.</p>
                        </div>
          </div>
        `,
        text: textLines,
    };
}
