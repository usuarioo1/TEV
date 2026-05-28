import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseSantiagoDate } from '@/lib/date-chile';
import { notifyActividadAsignadaPorPrevencionista } from '@/lib/notifications/actividad-asignada-prevencionista';

export const dynamic = 'force-dynamic';

const ROLES_ASIGNABLES = new Set<string>([
    ROLES.SUPERVISOR,
    ROLES.COORDINADOR,
    ROLES.JEFATURAS,
    ROLES.PREVENCIONISTA,
]);

// GET - Listar tareas pendientes asignadas al usuario actual
export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        let tareas;

        if (session.rol === ROLES.PREVENCIONISTA) {
            // Prevencionistas ven las tareas pendientes asignadas a ellos (incluye autoasignadas)
            tareas = await prisma.tareaAsignada.findMany({
                where: {
                    asignadoId: session.id,
                    estado: 'PENDIENTE',
                    tipo: { not: 'caminata' },
                },
                include: {
                    asignado: { select: { id: true, name: true, username: true, rol: true } },
                    creadoPor: { select: { id: true, name: true, username: true, rol: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        } else if (session.rol === ROLES.SUPERVISOR || session.rol === ROLES.COORDINADOR || session.rol === ROLES.JEFATURAS) {
            // Supervisores, coordinadores y jefaturas ven las tareas asignadas a ellos
            tareas = await prisma.tareaAsignada.findMany({
                where: {
                    asignadoId: session.id,
                    estado: 'PENDIENTE',
                    tipo: { not: 'caminata' },
                },
                include: {
                    asignado: { select: { id: true, name: true, username: true, rol: true } },
                    creadoPor: { select: { id: true, name: true, username: true, rol: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
        }

        return NextResponse.json(tareas);
    } catch (error) {
        console.error('Error al obtener tareas asignadas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// POST - Crear nueva tarea asignada (solo prevencionista)
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.rol !== ROLES.PREVENCIONISTA) {
        return NextResponse.json({ error: 'Solo los prevencionistas pueden asignar tareas' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { tipo, asignadoId, fechaProgramada, fechaLimite, descripcion } = body;

        if (!tipo || !asignadoId || !fechaProgramada || !fechaLimite) {
            return NextResponse.json({ error: 'tipo, asignadoId, fechaProgramada y fechaLimite son requeridos' }, { status: 400 });
        }

        const fechaProgramadaDate = parseSantiagoDate(fechaProgramada);
        if (Number.isNaN(fechaProgramadaDate.getTime())) {
            return NextResponse.json({ error: 'Fecha programada inválida' }, { status: 400 });
        }

        const fechaLimiteDate = parseSantiagoDate(fechaLimite);
        if (Number.isNaN(fechaLimiteDate.getTime())) {
            return NextResponse.json({ error: 'Fecha límite inválida' }, { status: 400 });
        }
        if (fechaLimiteDate < fechaProgramadaDate) {
            return NextResponse.json(
                { error: 'La fecha límite no puede ser anterior a la fecha de inicio programada' },
                { status: 400 }
            );
        }

        const tiposValidos = ['caminata', 'reporte_peligro', 'tarjeta_stop', 'control_art'];
        if (!tiposValidos.includes(tipo)) {
            return NextResponse.json({ error: 'Tipo de tarea inválido' }, { status: 400 });
        }

        const parsedAsignadoId = parseInt(asignadoId);
        if (Number.isNaN(parsedAsignadoId)) {
            return NextResponse.json({ error: 'asignadoId inválido' }, { status: 400 });
        }

        // Verificar que el usuario asignado existe y tiene un rol asignable
        const usuarioAsignado = await prisma.user.findUnique({
            where: { id: parsedAsignadoId },
        });

        if (!usuarioAsignado) {
            return NextResponse.json({ error: 'Usuario asignado no encontrado' }, { status: 404 });
        }

        if (!ROLES_ASIGNABLES.has(usuarioAsignado.rol)) {
            return NextResponse.json(
                { error: 'Solo se pueden asignar tareas a supervisores, coordinadores, jefaturas o prevencionistas' },
                { status: 400 }
            );
        }

        // Para caminatas, crear la caminata inmediatamente y no generar tarea intermedia.
        if (tipo === 'caminata') {
            const caminata = await prisma.$transaction(async (tx) => {
                const ultimaCaminata = await tx.caminataSeguridad.findFirst({
                    orderBy: { id: 'desc' },
                    select: { id: true },
                });

                const codigo = `CAM-${String((ultimaCaminata?.id || 0) + 1).padStart(6, '0')}`;

                return tx.caminataSeguridad.create({
                    data: {
                        codigo,
                        zona: 'Pendiente por definir',
                        faena: 'Pendiente por definir',
                        actividad: 'Actividad pendiente por definir',
                        coordinadorId: session.id,
                        asignadoId: parsedAsignadoId,
                        estado: 'PENDIENTE',
                        fechaProgramada: fechaProgramadaDate,
                        fechaLimite: fechaLimiteDate,
                        observaciones: descripcion?.trim() || null,
                    },
                    include: {
                        asignado: { select: { id: true, name: true, username: true, rol: true, email: true } },
                        coordinador: { select: { id: true, name: true, username: true, rol: true } },
                    },
                });
            });

            await notifyActividadAsignadaPorPrevencionista({
                tipo,
                descripcion: caminata.observaciones,
                fechaProgramada: caminata.fechaProgramada,
                fechaLimite: caminata.fechaLimite,
                asignado: caminata.asignado,
                asignadoPorNombre: session.name || session.username,
            });

            return NextResponse.json({
                tipo: 'caminata',
                caminata,
                message: 'Caminata creada y asignada correctamente',
            }, { status: 201 });
        }

        const tarea = await prisma.tareaAsignada.create({
            data: {
                tipo,
                descripcion: descripcion || null,
                asignadoId: parsedAsignadoId,
                creadoPorId: session.id,
                fechaProgramada: fechaProgramadaDate,
                fechaLimite: fechaLimiteDate,
            },
            include: {
                asignado: { select: { id: true, name: true, username: true, rol: true, email: true } },
                creadoPor: { select: { id: true, name: true, username: true, rol: true } },
            },
        });

        await notifyActividadAsignadaPorPrevencionista({
            tipo: tarea.tipo,
            descripcion: tarea.descripcion,
            fechaProgramada: tarea.fechaProgramada,
            fechaLimite: tarea.fechaLimite,
            asignado: tarea.asignado,
            asignadoPorNombre: session.name || session.username,
        });

        return NextResponse.json(tarea, { status: 201 });
    } catch (error) {
        console.error('Error al crear tarea asignada:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
