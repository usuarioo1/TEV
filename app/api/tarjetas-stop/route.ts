import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Listar tarjetas alto/stop independientes (sin caminata)
export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        let tarjetas;
        const includeCaminata = request.nextUrl.searchParams.get('includeCaminata') === '1';
        const whereBase = includeCaminata ? {} : { caminataId: null };

        // Prevencionistas y coordinadores ven todas las tarjetas permitidas por el filtro.
        if (session.rol === ROLES.PREVENCIONISTA || session.rol === ROLES.COORDINADOR) {
            tarjetas = await prisma.tarjetaStop.findMany({
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
                    responsableCierre: {
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
        // Supervisores y Jefaturas ven solo tarjetas donde están involucrados
        else if (session.rol === ROLES.SUPERVISOR || session.rol === ROLES.JEFATURAS) {
            tarjetas = await prisma.tarjetaStop.findMany({
                where: {
                    ...whereBase,
                    OR: [
                        { creadoPorId: session.id },         // Tarjetas que crearon
                        { responsableCierreId: session.id }  // Tarjetas asignadas para cierre
                    ]
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
                    responsableCierre: {
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

        return NextResponse.json(tarjetas);
    } catch (error) {
        console.error('Error al obtener tarjetas:', error);
        return NextResponse.json({ error: 'Error al obtener tarjetas' }, { status: 500 });
    }
}

// POST - Crear una tarjeta alto/stop independiente
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo prevencionistas, supervisores y jefaturas pueden crear tarjetas independientes
    if (session.rol !== ROLES.PREVENCIONISTA &&
        session.rol !== ROLES.COORDINADOR &&
        session.rol !== ROLES.SUPERVISOR &&
        session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear tarjetas' }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Extraer el responsableCierre y tareaId del body
        const { responsableCierre, empresaId, _tareaId, ...datosTarjeta } = body;

        const empresaIdParsed = Number.parseInt(String(empresaId ?? ''), 10);
        if (!Number.isInteger(empresaIdParsed) || empresaIdParsed <= 0) {
            return NextResponse.json({ error: 'Empresa invalida' }, { status: 400 });
        }

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaIdParsed },
            select: { id: true, nombre: true },
        });

        if (!empresa) {
            return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
        }

        // Si viene de una tarea asignada, el creador oficial es el prevencionista que asignó la tarea
        let creadoPorId = session.id;
        if (_tareaId) {
            const tarea = await prisma.tareaAsignada.findUnique({
                where: { id: parseInt(_tareaId) },
                include: { creadoPor: { select: { id: true, name: true, username: true } } },
            });
            if (tarea) {
                creadoPorId = tarea.creadoPorId;
                // Guardar quién completó el formulario
                datosTarjeta._completadoPorId = session.id;
                datosTarjeta._completadoPorNombre = session.name || session.username;
            }
        }

        const datosTarjetaConEmpresa = {
            ...datosTarjeta,
            empresaId: empresa.id,
            empresaNombre: empresa.nombre,
        };
        console.log('🔍 Creando tarjeta:', {
            creadoPorId,
            responsableCierre: responsableCierre,
            responsableCierreId: responsableCierre ? parseInt(responsableCierre) : null,
            estado: 'PENDIENTE'
        });

        // Crear la tarjeta independiente (sin caminataId)
        const nuevaTarjeta = await prisma.tarjetaStop.create({
            data: {
                creadoPorId,
                datos: datosTarjetaConEmpresa, // Todo el formulario va en datos (sin responsableCierre)
                estado: 'PENDIENTE',
                responsableCierreId: responsableCierre ? parseInt(responsableCierre) : null,
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
                responsableCierre: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
            },
        });

        console.log('✅ Tarjeta creada:', {
            id: nuevaTarjeta.id,
            responsableCierreId: nuevaTarjeta.responsableCierreId,
            estado: nuevaTarjeta.estado,
            creadoPorId: nuevaTarjeta.creadoPorId
        });

        return NextResponse.json(nuevaTarjeta, { status: 201 });
    } catch (error) {
        console.error('Error al crear tarjeta:', error);
        return NextResponse.json({ error: 'Error al crear tarjeta' }, { status: 500 });
    }
}
