export type ReportePeligroPendienteCierreTemplateData = {
    destinatarioNombre?: string | null;
    reporteId: number;
    estado: string;
    tipoPeligro?: string | null;
    zona?: string | null;
    faena?: string | null;
    actividad?: string | null;
    tarea?: string | null;
    ubicacion?: string | null;
    tipoRiesgo?: string | null;
    nivelHallazgo?: string | null;
    plazoCierre?: Date | null;
    descripcionPeligro?: string | null;
    consecuenciaPotencial?: string | null;
    medidasSugeridas?: string | null;
    reportadoPorNombre?: string | null;
    fechaReporte?: Date | null;
    caminataCodigo?: string | null;
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

function normalizeText(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function formatFecha(value?: Date | null): string | null {
    if (!value || Number.isNaN(value.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('es-CL', {
        timeZone: CHILE_TIME_ZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(value);
}

function createInfoRow(label: string, value: string): string {
    return `
        <tr>
            <td style="padding: 10px 12px; width: 220px; color: #1f2937; background: #f3f4f6; border: 1px solid #e5e7eb;"><strong>${escapeHtml(label)}</strong></td>
            <td style="padding: 10px 12px; color: #111827; background: #ffffff; border: 1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>
    `;
}

export function buildReportePeligroPendienteCierreEmail(
    data: ReportePeligroPendienteCierreTemplateData
): EmailTemplate {
    const destinatarioNombre = normalizeText(data.destinatarioNombre) || 'Usuario';
    const estado = normalizeText(data.estado) || 'PENDIENTE';
    const caminataCodigo = normalizeText(data.caminataCodigo);
    const tipoPeligro = normalizeText(data.tipoPeligro);
    const zona = normalizeText(data.zona);
    const faena = normalizeText(data.faena);
    const actividad = normalizeText(data.actividad);
    const tarea = normalizeText(data.tarea);
    const ubicacion = normalizeText(data.ubicacion);
    const tipoRiesgo = normalizeText(data.tipoRiesgo);
    const nivelHallazgo = normalizeText(data.nivelHallazgo);
    const descripcionPeligro = normalizeText(data.descripcionPeligro);
    const consecuenciaPotencial = normalizeText(data.consecuenciaPotencial);
    const medidasSugeridas = normalizeText(data.medidasSugeridas);
    const reportadoPorNombre = normalizeText(data.reportadoPorNombre);
    const fechaReporte = formatFecha(data.fechaReporte);
    const plazoCierre = formatFecha(data.plazoCierre);

    const htmlRows = [
        createInfoRow('Reporte', `#${data.reporteId}`),
        createInfoRow('Estado', estado),
        caminataCodigo ? createInfoRow('Caminata', caminataCodigo) : null,
        tipoPeligro ? createInfoRow('Tipo de peligro', tipoPeligro) : null,
        zona ? createInfoRow('Zona', zona) : null,
        faena ? createInfoRow('Faena', faena) : null,
        actividad ? createInfoRow('Actividad', actividad) : null,
        tarea ? createInfoRow('Tarea', tarea) : null,
        ubicacion ? createInfoRow('Ubicacion', ubicacion) : null,
        tipoRiesgo ? createInfoRow('Tipo de riesgo', tipoRiesgo) : null,
        nivelHallazgo ? createInfoRow('Nivel de hallazgo', nivelHallazgo) : null,
        descripcionPeligro ? createInfoRow('Descripcion del peligro', descripcionPeligro) : null,
        consecuenciaPotencial ? createInfoRow('Consecuencia potencial', consecuenciaPotencial) : null,
        medidasSugeridas ? createInfoRow('Medidas sugeridas', medidasSugeridas) : null,
        reportadoPorNombre ? createInfoRow('Reportado por', reportadoPorNombre) : null,
        fechaReporte ? createInfoRow('Fecha de reporte', fechaReporte) : null,
        plazoCierre ? createInfoRow('Plazo de cierre', plazoCierre) : null,
    ]
        .filter(Boolean)
        .join('');

    const textLines = [
        `Hola ${destinatarioNombre},`,
        'Se te asigno un reporte de peligro para gestion de cierre.',
        `- Reporte: #${data.reporteId}`,
        `- Estado: ${estado}`,
        caminataCodigo ? `- Caminata: ${caminataCodigo}` : null,
        tipoPeligro ? `- Tipo de peligro: ${tipoPeligro}` : null,
        zona ? `- Zona: ${zona}` : null,
        faena ? `- Faena: ${faena}` : null,
        actividad ? `- Actividad: ${actividad}` : null,
        tarea ? `- Tarea: ${tarea}` : null,
        ubicacion ? `- Ubicacion: ${ubicacion}` : null,
        tipoRiesgo ? `- Tipo de riesgo: ${tipoRiesgo}` : null,
        nivelHallazgo ? `- Nivel de hallazgo: ${nivelHallazgo}` : null,
        descripcionPeligro ? `- Descripcion del peligro: ${descripcionPeligro}` : null,
        consecuenciaPotencial ? `- Consecuencia potencial: ${consecuenciaPotencial}` : null,
        medidasSugeridas ? `- Medidas sugeridas: ${medidasSugeridas}` : null,
        reportadoPorNombre ? `- Reportado por: ${reportadoPorNombre}` : null,
        fechaReporte ? `- Fecha de reporte: ${fechaReporte}` : null,
        plazoCierre ? `- Plazo de cierre: ${plazoCierre}` : null,
        '',
        'El reporte se encuentra pendiente de cierre. Ingresa a la plataforma para revisarlo y gestionar las acciones correctivas.',
    ]
        .filter((line): line is string => Boolean(line))
        .join('\n');

    return {
        subject: `Reporte de peligro pendiente de cierre #${data.reporteId}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 720px; margin: 0 auto;">
                <div style="background: #c2410c; color: #ffffff; padding: 14px 18px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 20px;">Reporte de peligro asignado</h2>
                </div>
                <div style="border: 1px solid #d1d5db; border-top: 0; border-radius: 0 0 8px 8px; padding: 18px;">
                    <p style="margin: 0 0 16px;">Hola ${escapeHtml(destinatarioNombre)}, tienes un reporte de peligro pendiente de cierre.</p>
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Campo</th>
                                <th style="text-align: left; padding: 10px 12px; background: #e5e7eb; border: 1px solid #d1d5db; color: #111827;">Informacion</th>
                            </tr>
                        </thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                    <p style="margin: 18px 0 0;">Accede a la plataforma para implementar y registrar el cierre.</p>
                </div>
            </div>
        `,
        text: textLines,
    };
}