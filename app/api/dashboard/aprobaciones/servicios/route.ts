import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getSantiagoOffsetMs(at: Date): number {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(at).map(p => [p.type, p.value]));
    const localAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return at.getTime() - localAsUtc;
}

function parseSantiagoDate(dateStr: string, endOfDay = false): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    const noonRef = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const offsetMs = getSantiagoOffsetMs(noonRef);
    const baseMs = endOfDay
        ? Date.UTC(y, m - 1, d, 23, 59, 59, 999)
        : Date.UTC(y, m - 1, d, 0, 0, 0, 0);
    return new Date(baseMs + offsetMs);
}

export async function GET(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.rol !== ROLES.JEFATURAS && session.rol !== ROLES.PREVENCIONISTA) {
        return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const fechaInicioParam = searchParams.get('fechaInicio');
        const fechaFinParam = searchParams.get('fechaFin');

        const fechaInicioDate = fechaInicioParam ? parseSantiagoDate(fechaInicioParam) : null;
        const fechaFinDate = fechaFinParam ? parseSantiagoDate(fechaFinParam, true) : null;
        const hasDateFilter = !!(fechaInicioDate || fechaFinDate);
        const servicioDateWhere = {
            ...(fechaInicioDate && { gte: fechaInicioDate }),
            ...(fechaFinDate && { lte: fechaFinDate }),
        };

        const checklists = await prisma.checklistFatiga.findMany({
            where: {
                completado: true,
                servicio: {
                    is: {
                        aprobacion: {
                            isNot: null,
                        },
                        ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    },
                },
            },
            select: {
                id: true,
                fecha: true,
                createdAt: true,
                servicio: {
                    select: {
                        id: true,
                        codigo: true,
                        descripcion: true,
                        origen: true,
                        destino: true,
                        estado: true,
                        fechaRechazo: true,
                        motivoRechazo: true,
                        fechaAsignacion: true,
                        operario: {
                            select: {
                                name: true,
                                username: true,
                            },
                        },
                        coordinador: {
                            select: {
                                name: true,
                                username: true,
                            },
                        },
                        aprobacion: {
                            select: {
                                id: true,
                                aprobado: true,
                                motivoRechazo: true,
                                fechaAprobacion: true,
                                createdAt: true,
                                supervisor: {
                                    select: {
                                        name: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                fecha: 'desc',
            },
        });

        const servicios = checklists.map((checklist) => {
            const aprobacion = checklist.servicio.aprobacion;
            const aprobado = aprobacion?.aprobado === true;
            const tipoResultado: 'APROBADO_SUPERVISOR' | 'RECHAZADO_SUPERVISOR' = aprobado
                ? 'APROBADO_SUPERVISOR'
                : 'RECHAZADO_SUPERVISOR';
            const supervisor = aprobacion?.supervisor.name || aprobacion?.supervisor.username || 'Sin revision';
            const motivoRechazo = aprobado ? null : (aprobacion?.motivoRechazo || null);
            const fechaDecision = aprobacion?.fechaAprobacion || aprobacion?.createdAt || checklist.createdAt;

            return {
                checklistId: checklist.id,
                aprobacionId: aprobacion?.id || null,
                tipoResultado,
                aprobado,
                fechaDecision,
                fechaRegistro: checklist.fecha,
                motivoRechazo,
                supervisor,
                servicioId: checklist.servicio.id,
                servicioCodigo: checklist.servicio.codigo,
                descripcion: checklist.servicio.descripcion,
                origen: checklist.servicio.origen,
                destino: checklist.servicio.destino,
                estadoServicio: checklist.servicio.estado,
                fechaAsignacion: checklist.servicio.fechaAsignacion,
                operario: checklist.servicio.operario?.name || checklist.servicio.operario?.username || 'Sin operario',
                coordinador: checklist.servicio.coordinador?.name || checklist.servicio.coordinador?.username || 'Sin coordinador',
            };
        });

        return NextResponse.json({
            total: servicios.length,
            aprobadas: servicios.filter(s => s.aprobado).length,
            rechazadas: servicios.filter(s => !s.aprobado).length,
            servicios,
        });
    } catch (error) {
        console.error('Error al obtener servicios de aprobación:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
