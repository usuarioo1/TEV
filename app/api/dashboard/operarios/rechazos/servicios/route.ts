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

        const servicios = await prisma.servicio.findMany({
            where: {
                estado: 'RECHAZADO',
                motivoRechazo: { not: null },
                ...(hasDateFilter && { createdAt: servicioDateWhere }),
            },
            select: {
                id: true,
                codigo: true,
                descripcion: true,
                origen: true,
                destino: true,
                estado: true,
                motivoRechazo: true,
                fechaAsignacion: true,
                fechaRechazo: true,
                createdAt: true,
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            total: servicios.length,
            servicios: servicios.map((servicio) => ({
                servicioId: servicio.id,
                servicioCodigo: servicio.codigo,
                descripcion: servicio.descripcion,
                origen: servicio.origen,
                destino: servicio.destino,
                estadoServicio: servicio.estado,
                motivoRechazo: servicio.motivoRechazo,
                fechaAsignacion: servicio.fechaAsignacion,
                fechaRechazo: servicio.fechaRechazo,
                fechaRegistro: servicio.createdAt,
                operario: servicio.operario?.name || servicio.operario?.username || 'Sin operario',
                coordinador: servicio.coordinador?.name || servicio.coordinador?.username || 'Sin coordinador',
            })),
        });
    } catch (error) {
        console.error('Error al obtener servicios rechazados por operario:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
