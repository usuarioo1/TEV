import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';

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

    // Solo jefaturas y prevencionista pueden acceder
    if (session.rol !== ROLES.JEFATURAS && session.rol !== ROLES.PREVENCIONISTA) {
        return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get('categoria');
        const item = searchParams.get('item');
        const tipo = searchParams.get('tipo') as 'equipo' | 'tracto';
        const fechaInicioParam = searchParams.get('fechaInicio');
        const fechaFinParam = searchParams.get('fechaFin');

        if (!categoria || !item || !tipo) {
            return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 });
        }

        const fechaInicioDate = fechaInicioParam ? parseSantiagoDate(fechaInicioParam) : null;
        const fechaFinDate = fechaFinParam ? parseSantiagoDate(fechaFinParam, true) : null;
        const hasDateFilter = !!(fechaInicioDate || fechaFinDate);
        const checklistDateWhere = {
            ...(fechaInicioDate && { gte: fechaInicioDate }),
            ...(fechaFinDate && { lte: fechaFinDate }),
        };

        const checklistTipo = tipo === 'equipo' ? 'SEMIREMOLQUE' : 'TRACTO_CAMION';

        const noConformidades = await prisma.noConformidad.findMany({
            where: {
                estado: 'ABIERTA',
                checklistTipo,
                seccion: categoria,
                itemNombre: item,
                ...(hasDateFilter && { servicio: { fechaAsignacion: checklistDateWhere } }),
            },
            select: {
                id: true,
                servicioId: true,
                checklistTipo: true,
                itemNombre: true,
                observacion: true,
                createdAt: true,
                servicio: {
                    select: {
                        codigo: true,
                        checklistEquipo: {
                            select: {
                                patente: true,
                                conductor: true,
                                fecha: true,
                            },
                        },
                        checklistTractoCamion: {
                            select: {
                                patente: true,
                                nombreConductor: true,
                                fecha: true,
                            },
                        },
                    },
                },
            },
        });

        const noConformidadesCriticas = noConformidades.filter((nc) =>
            isChecklistItemCritico(nc.checklistTipo as 'TRACTO_CAMION' | 'SEMIREMOLQUE', nc.itemNombre)
        );

        const equiposConNC = noConformidadesCriticas.map((nc) => {
            const checklist = tipo === 'equipo' ? nc.servicio.checklistEquipo : nc.servicio.checklistTractoCamion;

            return {
                id: nc.id,
                patente: checklist?.patente || 'Sin patente',
                servicioId: nc.servicioId,
                servicioCodigo: nc.servicio.codigo || undefined,
                fecha: checklist?.fecha || nc.createdAt,
                conductor: tipo === 'equipo'
                    ? (nc.servicio.checklistEquipo?.conductor || 'Sin conductor')
                    : (nc.servicio.checklistTractoCamion?.nombreConductor || 'Sin conductor'),
                observacion: nc.observacion || undefined,
            };
        });

        // Ordenar por fecha descendente
        equiposConNC.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        return NextResponse.json({
            categoria,
            item,
            tipo,
            totalEquipos: equiposConNC.length,
            equipos: equiposConNC,
        });

    } catch (error) {
        console.error('Error al obtener equipos con NC:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
