export type NoConformidadLevantadaEmailItem = {
    seccion: string;
    itemNombre: string;
    observacion?: string | null;
};

export type NoConformidadesLevantadasRolTemplateData = {
    destinatarioNombre?: string | null;
    rolResponsable: string;
    servicioCodigo: string;
    servicioDescripcion?: string | null;
    origen?: string | null;
    destino?: string | null;
    checklistTipo: 'TRACTO_CAMION' | 'SEMIREMOLQUE';
    operarioNombre?: string | null;
    noConformidades: NoConformidadLevantadaEmailItem[];
};

type EmailTemplate = {
    subject: string;
    html: string;
    text: string;
};

const ROL_LABELS: Record<string, string> = {
    taller: 'Taller',
    coordinador: 'Coordinacion',
    prevencionista: 'Prevencion de Riesgos',
    jefaturas: 'Jefaturas',
};

const CHECKLIST_LABELS: Record<'TRACTO_CAMION' | 'SEMIREMOLQUE', string> = {
    TRACTO_CAMION: 'Checklist Tracto Camion',
    SEMIREMOLQUE: 'Checklist Semirremolque',
};

const SECCION_LABELS: Record<string, string> = {
    DOCUMENTACION: 'Documentacion',
    EPP: 'EPP',
    LUCES_Y_MICAS: 'Luces y Micas',
    CONDICIONES_GENERALES: 'Condiciones Generales',
    MECANICA_Y_MOTOR: 'Mecanica y Motor',
    CONEXIONES: 'Conexiones',
    'NEUMÁTICOS': 'Neumaticos',
    GENERAL: 'General',
    ESTRUCTURA: 'Estructura',
    'FIJACIÓN': 'Fijacion',
};

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

function getRolLabel(rol: string): string {
    return ROL_LABELS[rol] || rol;
}

function getSeccionLabel(seccion: string): string {
    return SECCION_LABELS[seccion] || seccion;
}

export function buildNoConformidadesLevantadasRolEmail(
    data: NoConformidadesLevantadasRolTemplateData
): EmailTemplate {
    const destinatarioNombre = normalizeText(data.destinatarioNombre) || 'Usuario';
    const rolLabel = getRolLabel(data.rolResponsable);
    const checklistLabel = CHECKLIST_LABELS[data.checklistTipo];
    const servicioDescripcion = normalizeText(data.servicioDescripcion);
    const origen = normalizeText(data.origen);
    const destino = normalizeText(data.destino);
    const operarioNombre = normalizeText(data.operarioNombre);

    const htmlRows = data.noConformidades
        .map((nc) => {
            const observacion = normalizeText(nc.observacion) || 'Sin observacion';
            return `
                <tr>
                    <td style="padding: 10px 12px; color: #111827; background: #ffffff; border: 1px solid #e5e7eb;">${escapeHtml(getSeccionLabel(nc.seccion))}</td>
                    <td style="padding: 10px 12px; color: #111827; background: #ffffff; border: 1px solid #e5e7eb;">${escapeHtml(nc.itemNombre)}</td>
                    <td style="padding: 10px 12px; color: #111827; background: #ffffff; border: 1px solid #e5e7eb;">${escapeHtml(observacion)}</td>
                </tr>
            `;
        })
        .join('');

    const textLines = [
        `Hola ${destinatarioNombre},`,
        `Se detectaron ${data.noConformidades.length} no conformidades asignadas a tu area (${rolLabel}).`,
        `- Servicio: ${data.servicioCodigo}`,
        `- Checklist: ${checklistLabel}`,
        servicioDescripcion ? `- Descripcion: ${servicioDescripcion}` : null,
        origen ? `- Origen: ${origen}` : null,
        destino ? `- Destino: ${destino}` : null,
        operarioNombre ? `- Operario: ${operarioNombre}` : null,
        '',
        'Items detectados:',
        ...data.noConformidades.map((nc, index) => {
            const observacion = normalizeText(nc.observacion);
            const base = `${index + 1}. [${getSeccionLabel(nc.seccion)}] ${nc.itemNombre}`;
            return observacion ? `${base} - Obs: ${observacion}` : base;
        }),
        '',
        'Ingresa a la plataforma para gestionar el cierre manual de estas no conformidades.',
    ]
        .filter((line): line is string => Boolean(line))
        .join('\n');

    return {
        subject: `NC levantadas para ${rolLabel} - Servicio ${data.servicioCodigo}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 760px; margin: 0 auto;">
                <div style="background: #b91c1c; color: #ffffff; padding: 14px 18px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 20px;">No conformidades levantadas</h2>
                </div>
                <div style="border: 1px solid #d1d5db; border-top: 0; border-radius: 0 0 8px 8px; padding: 18px;">
                    <p style="margin: 0 0 12px;">Hola ${escapeHtml(destinatarioNombre)}, se detectaron <strong>${data.noConformidades.length}</strong> no conformidades para el area de <strong>${escapeHtml(rolLabel)}</strong>.</p>
                    <p style="margin: 0 0 14px; color: #374151;">Servicio <strong>${escapeHtml(data.servicioCodigo)}</strong> - ${escapeHtml(checklistLabel)}</p>
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 10px 12px; background: #fee2e2; border: 1px solid #fecaca; color: #7f1d1d;">Seccion</th>
                                <th style="text-align: left; padding: 10px 12px; background: #fee2e2; border: 1px solid #fecaca; color: #7f1d1d;">Item</th>
                                <th style="text-align: left; padding: 10px 12px; background: #fee2e2; border: 1px solid #fecaca; color: #7f1d1d;">Observacion</th>
                            </tr>
                        </thead>
                        <tbody>${htmlRows}</tbody>
                    </table>
                    <p style="margin: 16px 0 0;">Gestiona el cierre manual en el modulo de no conformidades.</p>
                </div>
            </div>
        `,
        text: textLines,
    };
}
