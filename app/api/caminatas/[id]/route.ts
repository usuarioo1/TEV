import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener una caminata específica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const caminataId = parseInt(id);

        const caminata = await prisma.caminataSeguridad.findUnique({
            where: { id: caminataId },
            include: {
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                asignado: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                acompanante: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                reportesPeligro: {
                    include: {
                        creadoPor: {
                            select: { id: true, name: true, username: true, rol: true },
                        },
                        responsableCierre: {
                            select: { id: true, name: true, username: true },
                        },
                        responsableVerificacion: {
                            select: { id: true, name: true, username: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                tarjetasStop: {
                    include: {
                        creadoPor: {
                            select: { id: true, name: true, username: true, rol: true },
                        },
                        responsableCierre: {
                            select: { id: true, name: true, username: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                controlesCalidadART: {
                    include: {
                        creadoPor: {
                            select: { id: true, name: true, username: true, rol: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!caminata) {
            return NextResponse.json({ error: 'Caminata no encontrada' }, { status: 404 });
        }

        // Prevencionistas pueden ver todas las caminatas
        // El resto solo puede ver las que coordinó o les fueron asignadas
        if (session.rol !== ROLES.PREVENCIONISTA &&
            caminata.coordinadorId !== session.id &&
            caminata.asignadoId !== session.id) {
            return NextResponse.json({ error: 'No tienes permisos para ver esta caminata' }, { status: 403 });
        }

        return NextResponse.json(caminata);
    } catch (error) {
        console.error('Error al obtener caminata:', error);
        return NextResponse.json({ error: 'Error al obtener caminata' }, { status: 500 });
    }
}

// PUT - Actualizar caminata
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const caminataId = parseInt(id);
        const body = await request.json();

        const caminata = await prisma.caminataSeguridad.findUnique({
            where: { id: caminataId },
        });

        if (!caminata) {
            return NextResponse.json({ error: 'Caminata no encontrada' }, { status: 404 });
        }

        // Solo el asignado puede actualizar observaciones, fotos y documentos
        // Solo el coordinador puede actualizar datos básicos
        let updateData: any = {};

        if (caminata.asignadoId === session.id) {
            // El asignado puede actualizar avance y completar información operativa
            const { observaciones, tieneFotografias, tieneDocumentos, estado, zona, faena, actividad, acompananteId } = body;

            if (observaciones !== undefined) updateData.observaciones = observaciones;
            if (tieneFotografias !== undefined) updateData.tieneFotografias = tieneFotografias;
            if (tieneDocumentos !== undefined) updateData.tieneDocumentos = tieneDocumentos;
            if (estado !== undefined) updateData.estado = estado;
            if (zona !== undefined) updateData.zona = zona;
            if (faena !== undefined) updateData.faena = faena;
            if (actividad !== undefined) updateData.actividad = actividad;

            if (acompananteId !== undefined) {
                if (acompananteId === null || acompananteId === '') {
                    updateData.acompananteId = null;
                } else {
                    const acompananteParsed = parseInt(acompananteId);
                    if (Number.isNaN(acompananteParsed)) {
                        return NextResponse.json({ error: 'Acompañante inválido' }, { status: 400 });
                    }

                    const acompanante = await prisma.user.findUnique({
                        where: { id: acompananteParsed },
                    });

                    if (!acompanante) {
                        return NextResponse.json({ error: 'Acompañante no encontrado' }, { status: 404 });
                    }

                    updateData.acompananteId = acompananteParsed;
                }
            }
        } else if (caminata.coordinadorId === session.id) {
            // El coordinador puede actualizar datos básicos
            const { zona, faena, actividad, asignadoId, acompananteId, estado } = body;

            if (zona !== undefined) updateData.zona = zona;
            if (faena !== undefined) updateData.faena = faena;
            if (actividad !== undefined) updateData.actividad = actividad;
            if (asignadoId !== undefined) updateData.asignadoId = asignadoId;
            if (acompananteId !== undefined) updateData.acompananteId = acompananteId || null;
            if (estado !== undefined) updateData.estado = estado;
        } else {
            return NextResponse.json({ error: 'No tienes permisos para actualizar esta caminata' }, { status: 403 });
        }

        // Si se está completando, agregar fecha
        if (updateData.estado === 'COMPLETADA' && !caminata.fechaCompletacion) {
            updateData.fechaCompletacion = new Date();
        }

        const caminataActualizada = await prisma.caminataSeguridad.update({
            where: { id: caminataId },
            data: updateData,
            include: {
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                asignado: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                acompanante: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                _count: {
                    select: {
                        reportesPeligro: true,
                        tarjetasStop: true,
                    },
                },
            },
        });

        return NextResponse.json(caminataActualizada);
    } catch (error) {
        console.error('Error al actualizar caminata:', error);
        return NextResponse.json({ error: 'Error al actualizar caminata' }, { status: 500 });
    }
}

// DELETE - Eliminar caminata (solo coordinador)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const caminataId = parseInt(id);

        const caminata = await prisma.caminataSeguridad.findUnique({
            where: { id: caminataId },
        });

        if (!caminata) {
            return NextResponse.json({ error: 'Caminata no encontrada' }, { status: 404 });
        }

        // Solo el coordinador que la creó puede eliminarla
        if (caminata.coordinadorId !== session.id) {
            return NextResponse.json({ error: 'Solo el coordinador puede eliminar esta caminata' }, { status: 403 });
        }

        await prisma.caminataSeguridad.delete({
            where: { id: caminataId },
        });

        return NextResponse.json({ message: 'Caminata eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar caminata:', error);
        return NextResponse.json({ error: 'Error al eliminar caminata' }, { status: 500 });
    }
}
