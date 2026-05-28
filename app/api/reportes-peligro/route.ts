import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyReportePeligroPendienteCierre } from '@/lib/notifications/reporte-peligro-pendiente-cierre';

export const dynamic = 'force-dynamic';

// GET - Listar reportes de peligro (por defecto solo independientes)
export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        let reportes;
        const includeCaminata = request.nextUrl.searchParams.get('includeCaminata') === '1';
        const whereBase = includeCaminata ? {} : { caminataId: null };

        // Prevencionistas y coordinadores ven todos los reportes permitidos por el filtro.
        if (session.rol === ROLES.PREVENCIONISTA || session.rol === ROLES.COORDINADOR) {
            reportes = await prisma.reportePeligro.findMany({
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
                    responsableVerificacion: {
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
        // Supervisores y Jefaturas ven solo reportes donde están involucrados
        else if (session.rol === ROLES.SUPERVISOR || session.rol === ROLES.JEFATURAS) {
            reportes = await prisma.reportePeligro.findMany({
                where: {
                    ...whereBase,
                    OR: [
                        { creadoPorId: session.id },              // Reportes que crearon
                        { responsableCierreId: session.id },      // Reportes asignados para cierre
                        { responsableVerificacionId: session.id } // Reportes asignados para verificación
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
                    responsableVerificacion: {
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

        return NextResponse.json(reportes);
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 });
    }
}

// POST - Crear un reporte de peligro independiente
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo prevencionistas, supervisores y jefaturas pueden crear reportes independientes
    if (session.rol !== ROLES.PREVENCIONISTA &&
        session.rol !== ROLES.COORDINADOR &&
        session.rol !== ROLES.SUPERVISOR &&
        session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear reportes' }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Extraer el responsableCierre y tareaId del body
        const { responsableCierre, empresaId, _tareaId, ...datosReporte } = body;
        let datosReporteConEmpresa = { ...datosReporte };

        if (empresaId !== undefined && empresaId !== null && String(empresaId).trim() !== '') {
            const empresaIdParsed = Number.parseInt(String(empresaId), 10);
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

            datosReporteConEmpresa = {
                ...datosReporteConEmpresa,
                empresaId: empresa.id,
                empresaNombre: empresa.nombre,
            };
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
                datosReporte._completadoPorId = session.id;
                datosReporte._completadoPorNombre = session.name || session.username;
            }
        }

        console.log('🔍 Creando reporte:', {
            creadoPorId,
            responsableCierre: responsableCierre,
            responsableCierreId: responsableCierre ? parseInt(responsableCierre) : null,
            estado: 'PENDIENTE'
        });

        // Crear el reporte independiente (sin caminataId)
        const nuevoReporte = await prisma.reportePeligro.create({
            data: {
                creadoPorId,
                datos: datosReporteConEmpresa, // Todo el formulario va en datos (sin responsableCierre)
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
                        email: true,
                    },
                },
            },
        });

        await notifyReportePeligroPendienteCierre({
            reporteId: nuevoReporte.id,
            estado: nuevoReporte.estado,
            datos: nuevoReporte.datos,
            responsableCierre: nuevoReporte.responsableCierre,
            creadoPorNombre: nuevoReporte.creadoPor.name || nuevoReporte.creadoPor.username,
        });

        console.log('✅ Reporte creado:', {
            id: nuevoReporte.id,
            responsableCierreId: nuevoReporte.responsableCierreId,
            estado: nuevoReporte.estado,
            creadoPorId: nuevoReporte.creadoPorId
        });

        return NextResponse.json(nuevoReporte, { status: 201 });
    } catch (error) {
        console.error('Error al crear reporte:', error);
        return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 });
    }
}
