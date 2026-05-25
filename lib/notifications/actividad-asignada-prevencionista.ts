import { ROLES } from '@/lib/auth';
import { sendActividadAsignadaPrevencionistaEmail } from '@/lib/resend';

type UsuarioAsignadoNotificacion = {
    id: number;
    username: string;
    name: string | null;
    rol: string;
    email: string | null;
};

type ActividadAsignadaNotificacionParams = {
    tipo: string;
    descripcion?: string | null;
    fechaProgramada?: Date | null;
    fechaLimite?: Date | null;
    asignado: UsuarioAsignadoNotificacion;
    asignadoPorNombre?: string | null;
};

const TIPO_ACTIVIDAD_LABELS: Record<string, string> = {
    caminata: 'Caminata de Seguridad',
    reporte_peligro: 'Reporte de Peligro',
    tarjeta_stop: 'Tarjeta Alto/Stop',
    control_art: 'Control de Calidad ART',
};

const ROLES_NOTIFICABLES = new Set<string>([
    ROLES.SUPERVISOR,
    ROLES.COORDINADOR,
    ROLES.JEFATURAS,
    ROLES.PREVENCIONISTA,
]);

function getTipoActividadLabel(tipo: string): string {
    return TIPO_ACTIVIDAD_LABELS[tipo] || tipo;
}

export async function notifyActividadAsignadaPorPrevencionista(
    params: ActividadAsignadaNotificacionParams
): Promise<void> {
    if (!ROLES_NOTIFICABLES.has(params.asignado.rol)) {
        return;
    }

    if (!params.asignado.email?.trim()) {
        console.warn(`Usuario ${params.asignado.id} no tiene email. Se omite notificación de actividad.`);
        return;
    }

    try {
        await sendActividadAsignadaPrevencionistaEmail({
            to: params.asignado.email,
            destinatarioNombre: params.asignado.name || params.asignado.username,
            rolDestinatario: params.asignado.rol,
            tipoActividad: getTipoActividadLabel(params.tipo),
            descripcion: params.descripcion,
            fechaProgramada: params.fechaProgramada,
            fechaLimite: params.fechaLimite,
            asignadoPorNombre: params.asignadoPorNombre,
        });

        console.log('Correo de actividad asignada enviado a:', params.asignado.email);
    } catch (error) {
        console.error('No se pudo enviar correo de actividad asignada:', error);
    }
}