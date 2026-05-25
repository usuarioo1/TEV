import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Listar controles de calidad ART independientes (sin caminata)
export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        let controles;
        const includeCaminata = request.nextUrl.searchParams.get('includeCaminata') === '1';
        const whereBase = includeCaminata ? {} : { caminataId: null };

        // Prevencionistas y coordinadores ven todos los controles permitidos por el filtro.
        if (session.rol === ROLES.PREVENCIONISTA || session.rol === ROLES.COORDINADOR) {
            controles = await prisma.controlCalidadART.findMany({
                where: whereBase,
                include: {
                    creadoPor: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            rol: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }
        // Supervisores y Jefaturas ven solo los suyos
        else if (session.rol === ROLES.SUPERVISOR || session.rol === ROLES.JEFATURAS) {
            controles = await prisma.controlCalidadART.findMany({
                where: {
                    ...whereBase,
                    creadoPorId: session.id,
                },
                include: {
                    creadoPor: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            rol: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        } else {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
        }

        return NextResponse.json(controles);
    } catch (error) {
        console.error('Error al obtener controles de calidad ART:', error);
        return NextResponse.json({ error: 'Error al obtener controles' }, { status: 500 });
    }
}

// POST - Crear un control de calidad ART independiente
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo prevencionistas, coordinadores, supervisores y jefaturas pueden crear controles
    if (session.rol !== ROLES.PREVENCIONISTA &&
        session.rol !== ROLES.COORDINADOR &&
        session.rol !== ROLES.SUPERVISOR &&
        session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear controles de calidad ART' }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Si viene de una tarea asignada, el creador oficial es el prevencionista que asignó la tarea
        const { _tareaId, ...datosControl } = body;
        let creadoPorId = session.id;
        if (_tareaId) {
            const tarea = await prisma.tareaAsignada.findUnique({
                where: { id: parseInt(_tareaId) },
                include: { creadoPor: { select: { id: true, name: true, username: true } } },
            });
            if (tarea) {
                creadoPorId = tarea.creadoPorId;
                datosControl._completadoPorId = session.id;
                datosControl._completadoPorNombre = session.name || session.username;
            }
        }

        // Crear el control independiente (sin caminataId)
        const nuevoControl = await prisma.controlCalidadART.create({
            data: {
                creadoPorId,
                datos: datosControl, // Todo el formulario va en datos
            },
            include: {
                creadoPor: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
            },
        });

        return NextResponse.json(nuevoControl, { status: 201 });
    } catch (error) {
        console.error('Error al crear control de calidad ART:', error);
        return NextResponse.json({ error: 'Error al crear el control' }, { status: 500 });
    }
}
