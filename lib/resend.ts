import { Resend } from 'resend';
import { buildServicioAsignadoOperarioEmail } from '@/lib/email-templates/servicio-asignado-operario';
import { buildActividadAsignadaPrevencionistaEmail } from '@/lib/email-templates/actividad-asignada-prevencionista';
import {
    buildReportePeligroPendienteCierreEmail,
    type ReportePeligroPendienteCierreTemplateData,
} from '@/lib/email-templates/reporte-peligro-pendiente-cierre';
import {
    buildNoConformidadesLevantadasRolEmail,
    type NoConformidadesLevantadasRolTemplateData,
} from '@/lib/email-templates/no-conformidades-levantadas-rol';
import {
    buildHallazgosLevantadosRolEmail,
    type HallazgosLevantadosRolTemplateData,
} from '@/lib/email-templates/hallazgos-levantados-rol';
import {
    buildServicioPendienteAprobacionSupervisorEmail,
} from '@/lib/email-templates/servicio-pendiente-aprobacion-supervisor';

type ServicioAsignadoEmailParams = {
    to: string;
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

type ActividadAsignadaPrevencionistaEmailParams = {
    to: string;
    destinatarioNombre?: string | null;
    rolDestinatario: string;
    tipoActividad: string;
    descripcion?: string | null;
    fechaProgramada?: Date | null;
    fechaLimite?: Date | null;
    asignadoPorNombre?: string | null;
};

type ReportePeligroPendienteCierreEmailParams = {
    to: string;
} & ReportePeligroPendienteCierreTemplateData;

type NoConformidadesLevantadasRolEmailParams = {
    to: string;
} & NoConformidadesLevantadasRolTemplateData;

type HallazgosLevantadosRolEmailParams = {
    to: string;
} & HallazgosLevantadosRolTemplateData;

type ServicioPendienteAprobacionSupervisorEmailParams = {
    to: string;
    supervisorNombre?: string | null;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    operarioNombre?: string | null;
    coordinadorNombre?: string | null;
    fechaEnvioAprobacion?: Date | null;
};

function getResendApiKey(): string {
    const apiKey = process.env.RESEND_API_KEY?.trim() || process.env.API_RESEND?.trim();

    if (!apiKey) {
        throw new Error(
            'No se encontro RESEND_API_KEY o API_RESEND en variables de entorno. Verifica que .env este guardado y reinicia el servidor de Next.js.'
        );
    }

    return apiKey;
}

function getFromEmail(): string {
    const fromEmail =
        process.env.RESEND_FROM_EMAIL?.trim()
        || process.env.RESEND_FROM?.trim()
        || process.env.MAIL_FROM?.trim();

    if (!fromEmail) {
        throw new Error(
            'Falta RESEND_FROM_EMAIL (o RESEND_FROM/MAIL_FROM) en variables de entorno. Debe ser un remitente de dominio verificado, por ejemplo: "viasentra <notificaciones@tu-dominio.com>".'
        );
    }

    return fromEmail;
}

function getToEmail(to: string): string {
    const toEmail = to.trim();

    if (!toEmail) {
        throw new Error('El email destino del usuario esta vacio.');
    }

    return toEmail;
}

async function sendTemplateEmail(
    to: string,
    template: { subject: string; html: string; text: string }
): Promise<void> {
    const resend = new Resend(getResendApiKey());
    const fromEmail = getFromEmail();
    const toEmail = getToEmail(to);

    const { error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
    });

    if (error) {
        const message = error.message || 'No fue posible enviar el correo con Resend';

        if (message.includes('You can only send testing emails')) {
            throw new Error(
                `${message} Remitente actual: ${fromEmail}. Destinatario actual: ${toEmail}. Configura RESEND_FROM_EMAIL con un correo del dominio verificado en el mismo workspace de la API key.`
            );
        }

        throw new Error(`Error Resend con remitente ${fromEmail} y destinatario ${toEmail}: ${message}`);
    }
}

export async function sendServicioAsignadoEmail(params: ServicioAsignadoEmailParams): Promise<void> {
    const template = buildServicioAsignadoOperarioEmail({
        operarioNombre: params.operarioNombre,
        codigo: params.codigo,
        descripcion: params.descripcion,
        origen: params.origen,
        destino: params.destino,
        telefonoOrigen: params.telefonoOrigen,
        telefonoDestino: params.telefonoDestino,
        observaciones: params.observaciones,
        coordinadorNombre: params.coordinadorNombre,
        fechaAsignacion: params.fechaAsignacion,
    });

    await sendTemplateEmail(params.to, template);
}

export async function sendActividadAsignadaPrevencionistaEmail(
    params: ActividadAsignadaPrevencionistaEmailParams
): Promise<void> {
    const template = buildActividadAsignadaPrevencionistaEmail({
        destinatarioNombre: params.destinatarioNombre,
        rolDestinatario: params.rolDestinatario,
        tipoActividad: params.tipoActividad,
        descripcion: params.descripcion,
        fechaProgramada: params.fechaProgramada,
        fechaLimite: params.fechaLimite,
        asignadoPorNombre: params.asignadoPorNombre,
    });

    await sendTemplateEmail(params.to, template);
}

export async function sendReportePeligroPendienteCierreEmail(
    params: ReportePeligroPendienteCierreEmailParams
): Promise<void> {
    const template = buildReportePeligroPendienteCierreEmail({
        destinatarioNombre: params.destinatarioNombre,
        reporteId: params.reporteId,
        estado: params.estado,
        tipoPeligro: params.tipoPeligro,
        zona: params.zona,
        faena: params.faena,
        actividad: params.actividad,
        tarea: params.tarea,
        ubicacion: params.ubicacion,
        tipoRiesgo: params.tipoRiesgo,
        nivelHallazgo: params.nivelHallazgo,
        plazoCierre: params.plazoCierre,
        descripcionPeligro: params.descripcionPeligro,
        consecuenciaPotencial: params.consecuenciaPotencial,
        medidasSugeridas: params.medidasSugeridas,
        reportadoPorNombre: params.reportadoPorNombre,
        fechaReporte: params.fechaReporte,
        caminataCodigo: params.caminataCodigo,
    });

    await sendTemplateEmail(params.to, template);
}

export async function sendNoConformidadesLevantadasRolEmail(
    params: NoConformidadesLevantadasRolEmailParams
): Promise<void> {
    const template = buildNoConformidadesLevantadasRolEmail({
        destinatarioNombre: params.destinatarioNombre,
        rolResponsable: params.rolResponsable,
        servicioCodigo: params.servicioCodigo,
        servicioDescripcion: params.servicioDescripcion,
        origen: params.origen,
        destino: params.destino,
        checklistTipo: params.checklistTipo,
        operarioNombre: params.operarioNombre,
        noConformidades: params.noConformidades,
    });

    await sendTemplateEmail(params.to, template);
}

export async function sendHallazgosLevantadosRolEmail(
    params: HallazgosLevantadosRolEmailParams
): Promise<void> {
    const template = buildHallazgosLevantadosRolEmail({
        destinatarioNombre: params.destinatarioNombre,
        rolResponsable: params.rolResponsable,
        servicioCodigo: params.servicioCodigo,
        servicioDescripcion: params.servicioDescripcion,
        origen: params.origen,
        destino: params.destino,
        checklistTipo: params.checklistTipo,
        operarioNombre: params.operarioNombre,
        hallazgos: params.hallazgos,
    });

    await sendTemplateEmail(params.to, template);
}

export async function sendServicioPendienteAprobacionSupervisorEmail(
    params: ServicioPendienteAprobacionSupervisorEmailParams
): Promise<void> {
    const template = buildServicioPendienteAprobacionSupervisorEmail({
        supervisorNombre: params.supervisorNombre,
        codigo: params.codigo,
        descripcion: params.descripcion,
        origen: params.origen,
        destino: params.destino,
        operarioNombre: params.operarioNombre,
        coordinadorNombre: params.coordinadorNombre,
        fechaEnvioAprobacion: params.fechaEnvioAprobacion,
    });

    await sendTemplateEmail(params.to, template);
}
