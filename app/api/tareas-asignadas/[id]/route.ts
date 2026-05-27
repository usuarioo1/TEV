import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener una tarea por ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const tarea = await prisma.tareaAsignada.findUnique({
            where: { id: parseInt(id) },
            include: {
                asignado: { select: { id: true, name: true, username: true, rol: true } },
                creadoPor: { select: { id: true, name: true, username: true, rol: true } },
            },
        });

        if (!tarea) {
            return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
        }

        // Solo el asignado, el creador o el prevencionista pueden ver la tarea
        if (
            tarea.asignadoId !== session.id &&
            tarea.creadoPorId !== session.id &&
            session.rol !== ROLES.PREVENCIONISTA
        ) {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
        }

        return NextResponse.json(tarea);
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// PATCH - Marcar tarea como completada
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const tarea = await prisma.tareaAsignada.findUnique({
            where: { id: parseInt(id) },
        });

        if (!tarea) {
            return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
        }

        // Solo el asignado puede marcar la tarea como completada
        if (tarea.asignadoId !== session.id) {
            return NextResponse.json({ error: 'No tienes permisos para completar esta tarea' }, { status: 403 });
        }

        if (tarea.estado === 'COMPLETADA') {
            return NextResponse.json({ error: 'La tarea ya está completada' }, { status: 400 });
        }

        if (tarea.tipo === 'caminata') {
            const empresaIdParsed = Number.parseInt(String((body as { empresaId?: unknown })?.empresaId ?? ''), 10);

            if (!Number.isInteger(empresaIdParsed) || empresaIdParsed <= 0) {
                return NextResponse.json({ error: 'Debes seleccionar una empresa para iniciar la caminata' }, { status: 400 });
            }

            const empresa = await prisma.empresa.findUnique({
                where: { id: empresaIdParsed },
                select: { id: true },
            });

            if (!empresa) {
                return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
            }

            const result = await prisma.$transaction(async (tx) => {
                const ultimaCaminata = await tx.caminataSeguridad.findFirst({
                    orderBy: { id: 'desc' },
                    select: { id: true },
                });

                const codigo = `CAM-${String((ultimaCaminata?.id || 0) + 1).padStart(6, '0')}`;

                const caminata = await tx.caminataSeguridad.create({
                    data: {
                        codigo,
                        zona: 'Pendiente por definir',
                        faena: 'Pendiente por definir',
                        actividad: tarea.descripcion?.trim() || 'Actividad pendiente por definir',
                        empresaId: empresa.id,
                        coordinadorId: tarea.creadoPorId,
                        asignadoId: tarea.asignadoId,
                        estado: 'PENDIENTE',
                        fechaProgramada: tarea.fechaProgramada,
                        fechaLimite: tarea.fechaLimite,
                        observaciones: tarea.descripcion?.trim() || null,
                    },
                    select: { id: true },
                });

                const tareaActualizada = await tx.tareaAsignada.update({
                    where: { id: parseInt(id) },
                    data: { estado: 'COMPLETADA' },
                    include: {
                        asignado: { select: { id: true, name: true, username: true, rol: true } },
                        creadoPor: { select: { id: true, name: true, username: true, rol: true } },
                    },
                });

                return { tareaActualizada, caminataId: caminata.id };
            });

            return NextResponse.json(result);
        }

        const tareaActualizada = await prisma.tareaAsignada.update({
            where: { id: parseInt(id) },
            data: { estado: 'COMPLETADA' },
            include: {
                asignado: { select: { id: true, name: true, username: true, rol: true } },
                creadoPor: { select: { id: true, name: true, username: true, rol: true } },
            },
        });

        return NextResponse.json(tareaActualizada);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
