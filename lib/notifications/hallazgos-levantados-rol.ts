import prisma from '@/lib/prisma';
import type { HallazgoLevantado, TipoChecklistHallazgo } from '@/lib/hallazgos';
import { sendHallazgosLevantadosRolEmail } from '@/lib/resend';

type ServicioHallazgoNotificacion = {
    id: number;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
};

type NotifyHallazgosLevantadosPorRolParams = {
    checklistTipo: TipoChecklistHallazgo;
    servicio: ServicioHallazgoNotificacion;
    hallazgos: HallazgoLevantado[];
    operarioNombre?: string | null;
};

function getUniqueHallazgos(hallazgos: HallazgoLevantado[]): HallazgoLevantado[] {
    const map = new Map<string, HallazgoLevantado>();

    for (const hallazgo of hallazgos) {
        const key = `${hallazgo.responsableRol}::${hallazgo.seccion}::${hallazgo.itemNombre}`;
        map.set(key, hallazgo);
    }

    return Array.from(map.values());
}

function normalizeEmail(email: string | null): string | null {
    const normalizedEmail = email?.trim().toLowerCase() ?? '';
    return normalizedEmail.length > 0 ? normalizedEmail : null;
}

export async function notifyHallazgosLevantadosPorRol(
    params: NotifyHallazgosLevantadosPorRolParams
): Promise<void> {
    const hallazgos = getUniqueHallazgos(params.hallazgos);
    if (hallazgos.length === 0) {
        return;
    }

    try {
        const roles = Array.from(new Set(hallazgos.map((hallazgo) => hallazgo.responsableRol)));

        const usuarios = await prisma.user.findMany({
            where: {
                rol: { in: roles },
                email: { not: null },
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                rol: true,
            },
        });

        const usuariosPorRol = new Map<string, typeof usuarios>();
        for (const usuario of usuarios) {
            const email = normalizeEmail(usuario.email);
            if (!email) {
                continue;
            }

            const list = usuariosPorRol.get(usuario.rol) || [];
            const alreadyAdded = list.some((item) => normalizeEmail(item.email) === email);
            if (alreadyAdded) {
                continue;
            }

            list.push({
                ...usuario,
                email,
            });
            usuariosPorRol.set(usuario.rol, list);
        }

        for (const rol of roles) {
            const hallazgosPorRol = hallazgos.filter((hallazgo) => hallazgo.responsableRol === rol);
            if (hallazgosPorRol.length === 0) {
                continue;
            }

            const destinatarios = usuariosPorRol.get(rol) || [];
            if (destinatarios.length === 0) {
                console.warn(
                    `No hay usuarios con email para el rol ${rol}. Se omite notificacion de hallazgos del servicio ${params.servicio.codigo}.`
                );
                continue;
            }

            for (const destinatario of destinatarios) {
                try {
                    await sendHallazgosLevantadosRolEmail({
                        to: destinatario.email!,
                        destinatarioNombre: destinatario.name || destinatario.username,
                        rolResponsable: rol,
                        servicioCodigo: params.servicio.codigo,
                        servicioDescripcion: params.servicio.descripcion,
                        origen: params.servicio.origen,
                        destino: params.servicio.destino,
                        checklistTipo: params.checklistTipo,
                        operarioNombre: params.operarioNombre,
                        hallazgos: hallazgosPorRol.map((hallazgo) => ({
                            seccion: hallazgo.seccion,
                            itemNombre: hallazgo.itemNombre,
                            observacion: hallazgo.observacion,
                        })),
                    });

                    console.log(
                        `Correo de hallazgos enviado a ${destinatario.email} para rol ${rol} en servicio ${params.servicio.codigo}.`
                    );
                } catch (error) {
                    console.error(
                        `No se pudo enviar correo de hallazgos a ${destinatario.email} para rol ${rol}:`,
                        error
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error al notificar hallazgos por rol:', error);
    }
}
