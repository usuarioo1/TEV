import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseSantiagoDate } from '@/lib/date-chile';

export const dynamic = 'force-dynamic';

// GET - Listar caminatas según el rol del usuario
export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        let caminatas;

        // Prevencionistas ven todas las caminatas que han creado + todas las completadas
        if (session.rol === ROLES.PREVENCIONISTA) {
            caminatas = await prisma.caminataSeguridad.findMany({
                where: {
                    OR: [
                        { coordinadorId: session.id },
                        { estado: 'COMPLETADA' },
                    ],
                },
                include: {
                    empresa: {
                        select: {
                            id: true,
                            nombre: true,
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
                    coordinador: {
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
                orderBy: {
                    fechaCreacion: 'desc',
                },
            });
        }
        // Supervisores, coordinadores y jefaturas ven las caminatas asignadas a ellos O creadas por ellos
        else if (session.rol === ROLES.SUPERVISOR || session.rol === ROLES.COORDINADOR || session.rol === ROLES.JEFATURAS) {
            caminatas = await prisma.caminataSeguridad.findMany({
                where: {
                    OR: [
                        { asignadoId: session.id },      // Caminatas asignadas
                        { coordinadorId: session.id }     // Caminatas creadas por ellos
                    ]
                },
                include: {
                    empresa: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
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
                orderBy: {
                    fechaCreacion: 'desc',
                },
            });
        } else {
            return NextResponse.json({ error: 'No tienes permisos para acceder a caminatas' }, { status: 403 });
        }

        return NextResponse.json(caminatas);
    } catch (error) {
        console.error('Error al obtener caminatas:', error);
        return NextResponse.json({ error: 'Error al obtener caminatas' }, { status: 500 });
    }
}

// POST - Crear nueva caminata
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Permitir que prevencionistas, supervisores y jefaturas creen caminatas
    if (session.rol !== ROLES.PREVENCIONISTA &&
        session.rol !== ROLES.SUPERVISOR &&
        session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear caminatas' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { zona, faena, actividad, asignadoId, acompananteId, fechaProgramada, fechaLimite, empresaId } = body;

        // Validaciones básicas
        if (!zona || !faena || !actividad) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: zona, faena, actividad' },
                { status: 400 }
            );
        }

        let finalAsignadoId: number;
        let finalCoordinadorId: number;
        let finalEmpresaId: number | null = null;
        let finalFechaProgramada: Date | null = null;
        let finalFechaLimite: Date | null = null;

        if (empresaId !== undefined && empresaId !== null && empresaId !== '') {
            const empresaParsed = Number.parseInt(String(empresaId), 10);
            if (!Number.isInteger(empresaParsed) || empresaParsed <= 0) {
                return NextResponse.json({ error: 'Empresa invalida' }, { status: 400 });
            }

            const empresa = await prisma.empresa.findUnique({
                where: { id: empresaParsed },
                select: { id: true },
            });

            if (!empresa) {
                return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
            }

            finalEmpresaId = empresa.id;
        }

        // PREVENCIONISTA: único rol que puede asignar a otros (requiere asignadoId)
        if (session.rol === ROLES.PREVENCIONISTA) {
            if (!asignadoId) {
                return NextResponse.json(
                    { error: 'Prevencionistas deben especificar un asignadoId o pueden autoasignarse' },
                    { status: 400 }
                );
            }

            // Verificar que el asignado existe y es supervisor o jefatura (o el mismo prevencionista)
            const asignado = await prisma.user.findUnique({
                where: { id: asignadoId },
            });

            if (!asignado) {
                return NextResponse.json({ error: 'Usuario asignado no encontrado' }, { status: 404 });
            }

            // Prevencionista puede asignar a supervisores, coordinadores, jefaturas o autoasignarse
            if (asignado.rol !== ROLES.SUPERVISOR &&
                asignado.rol !== ROLES.COORDINADOR &&
                asignado.rol !== ROLES.JEFATURAS &&
                asignado.id !== session.id) {
                return NextResponse.json(
                    { error: 'Solo se puede asignar a supervisores, coordinadores, jefaturas o autoasignarse' },
                    { status: 400 }
                );
            }

            finalAsignadoId = asignadoId;
            finalCoordinadorId = session.id;

            if (!fechaProgramada || !fechaLimite) {
                return NextResponse.json(
                    { error: 'Prevencionistas deben definir fecha de inicio programada y fecha límite para la caminata' },
                    { status: 400 }
                );
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

            finalFechaProgramada = fechaProgramadaDate;
            finalFechaLimite = fechaLimiteDate;
        }
        // SUPERVISOR o JEFATURA: solo pueden autoasignarse caminatas
        else {
            // Ignorar asignadoId si viene, forzar autoasignación
            finalAsignadoId = session.id;
            finalCoordinadorId = session.id;

            if (fechaProgramada) {
                const fechaProgramadaDate = parseSantiagoDate(fechaProgramada);
                if (Number.isNaN(fechaProgramadaDate.getTime())) {
                    return NextResponse.json({ error: 'Fecha programada inválida' }, { status: 400 });
                }
                finalFechaProgramada = fechaProgramadaDate;
            }

            if (fechaLimite) {
                const fechaLimiteDate = parseSantiagoDate(fechaLimite);
                if (Number.isNaN(fechaLimiteDate.getTime())) {
                    return NextResponse.json({ error: 'Fecha límite inválida' }, { status: 400 });
                }
                if (finalFechaProgramada && fechaLimiteDate < finalFechaProgramada) {
                    return NextResponse.json(
                        { error: 'La fecha límite no puede ser anterior a la fecha de inicio programada' },
                        { status: 400 }
                    );
                }
                finalFechaLimite = fechaLimiteDate;
            }
        }

        // Generar código único
        const ultimaCaminata = await prisma.caminataSeguridad.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
        });
        const codigo = `CAM-${String((ultimaCaminata?.id || 0) + 1).padStart(6, '0')}`;

        // Validar acompañante si se proporciona
        if (acompananteId) {
            const acompanante = await prisma.user.findUnique({
                where: { id: acompananteId },
            });

            if (!acompanante) {
                return NextResponse.json({ error: 'Acompañante no encontrado' }, { status: 404 });
            }
        }

        // Crear la caminata
        const nuevaCaminata = await prisma.caminataSeguridad.create({
            data: {
                codigo,
                zona,
                faena,
                actividad,
                empresaId: finalEmpresaId,
                coordinadorId: finalCoordinadorId,
                asignadoId: finalAsignadoId,
                acompananteId: acompananteId || null,
                estado: 'PENDIENTE',
                fechaProgramada: finalFechaProgramada,
                fechaLimite: finalFechaLimite,
            },
            include: {
                asignado: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
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
                empresa: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
        });

        return NextResponse.json(nuevaCaminata, { status: 201 });
    } catch (error) {
        console.error('Error al crear caminata:', error);
        return NextResponse.json({ error: 'Error al crear caminata' }, { status: 500 });
    }
}
