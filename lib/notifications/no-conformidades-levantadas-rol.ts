import prisma from '@/lib/prisma';
import type { NoConformidadLevantada, TipoChecklistNC } from '@/lib/no-conformidades';
import { sendNoConformidadesLevantadasRolEmail } from '@/lib/resend';

type ServicioNCNotificacion = {
    id: number;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
};

type NotifyNoConformidadesLevantadasPorRolParams = {
    checklistTipo: TipoChecklistNC;
    servicio: ServicioNCNotificacion;
    noConformidades: NoConformidadLevantada[];
    operarioNombre?: string | null;
};

function getUniqueNoConformidades(
    noConformidades: NoConformidadLevantada[]
): NoConformidadLevantada[] {
    const map = new Map<string, NoConformidadLevantada>();

    for (const nc of noConformidades) {
        const key = `${nc.responsableRol}::${nc.seccion}::${nc.itemNombre}`;
        map.set(key, nc);
    }

    return Array.from(map.values());
}

function normalizeEmail(email: string | null): string | null {
    const normalizedEmail = email?.trim().toLowerCase() ?? '';
    return normalizedEmail.length > 0 ? normalizedEmail : null;
}

export async function notifyNoConformidadesLevantadasPorRol(
    params: NotifyNoConformidadesLevantadasPorRolParams
): Promise<void> {
    const noConformidades = getUniqueNoConformidades(params.noConformidades);
    if (noConformidades.length === 0) {
        return;
    }

    try {
        const roles = Array.from(new Set(noConformidades.map((nc) => nc.responsableRol)));

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
            const ncPorRol = noConformidades.filter((nc) => nc.responsableRol === rol);
            if (ncPorRol.length === 0) {
                continue;
            }

            const destinatarios = usuariosPorRol.get(rol) || [];
            if (destinatarios.length === 0) {
                console.warn(
                    `No hay usuarios con email para el rol ${rol}. Se omite notificacion de NC del servicio ${params.servicio.codigo}.`
                );
                continue;
            }

            for (const destinatario of destinatarios) {
                try {
                    await sendNoConformidadesLevantadasRolEmail({
                        to: destinatario.email!,
                        destinatarioNombre: destinatario.name || destinatario.username,
                        rolResponsable: rol,
                        servicioCodigo: params.servicio.codigo,
                        servicioDescripcion: params.servicio.descripcion,
                        origen: params.servicio.origen,
                        destino: params.servicio.destino,
                        checklistTipo: params.checklistTipo,
                        operarioNombre: params.operarioNombre,
                        noConformidades: ncPorRol.map((nc) => ({
                            seccion: nc.seccion,
                            itemNombre: nc.itemNombre,
                            observacion: nc.observacion,
                        })),
                    });

                    console.log(
                        `Correo NC enviado a ${destinatario.email} para rol ${rol} en servicio ${params.servicio.codigo}.`
                    );
                } catch (error) {
                    console.error(
                        `No se pudo enviar correo NC a ${destinatario.email} para rol ${rol}:`,
                        error
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error al notificar no conformidades por rol:', error);
    }
}
