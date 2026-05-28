import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';

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

/**
 * GET /api/dashboard/no-conformidades-gestion
 * Returns counts of NoConformidad records grouped by estado and responsableRol.
 * Only accessible to jefaturas and prevencionista.
 */
export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || (session.rol !== 'jefaturas' && session.rol !== 'prevencionista')) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const fechaInicio = searchParams.get('fechaInicio');
        const fechaFin = searchParams.get('fechaFin');
        const empresaIdParam = searchParams.get('empresaId');

        let empresaId: number | null = null;
        if (empresaIdParam) {
            const parsedEmpresaId = Number(empresaIdParam);
            if (!Number.isInteger(parsedEmpresaId) || parsedEmpresaId <= 0) {
                return NextResponse.json({ message: 'empresaId inválido' }, { status: 400 });
            }
            empresaId = parsedEmpresaId;
        }

        const fechaAsignacionFilter: { gte?: Date; lte?: Date } = {};
        if (fechaInicio) fechaAsignacionFilter.gte = parseSantiagoDate(fechaInicio);
        if (fechaFin) fechaAsignacionFilter.lte = parseSantiagoDate(fechaFin, true);

        const servicioWhere = {
            ...(Object.keys(fechaAsignacionFilter).length ? { fechaAsignacion: fechaAsignacionFilter } : {}),
            ...(empresaId ? { empresaId } : {}),
        };

        const all = await prisma.noConformidad.findMany({
            where: Object.keys(servicioWhere).length
                ? { servicio: servicioWhere }
                : undefined,
            select: {
                estado: true,
                responsableRol: true,
                checklistTipo: true,
                itemNombre: true,
            },
        });

        const roles = ['taller', 'coordinador', 'prevencionista'] as const;

        type RolStats = { total: number; abierta: number; cerrada: number };
        const porRol: Record<string, RolStats> = {};
        for (const rol of roles) {
            porRol[rol] = { total: 0, abierta: 0, cerrada: 0 };
        }

        let totalAbierta = 0;
        let totalCerrada = 0;
        let total = 0;

        for (const nc of all) {
            const checklistTipo = nc.checklistTipo as 'TRACTO_CAMION' | 'SEMIREMOLQUE';
            if (!isChecklistItemCritico(checklistTipo, nc.itemNombre)) {
                continue;
            }

            const rol = nc.responsableRol as string;
            const estado = nc.estado as string;

            if (!porRol[rol]) {
                porRol[rol] = { total: 0, abierta: 0, cerrada: 0 };
            }

            porRol[rol].total++;
            total++;
            if (estado === 'ABIERTA') {
                porRol[rol].abierta++;
                totalAbierta++;
            } else if (estado === 'CERRADA') {
                porRol[rol].cerrada++;
                totalCerrada++;
            }
        }

        return NextResponse.json({
            total,
            abierta: totalAbierta,
            cerrada: totalCerrada,
            porRol,
        });
    } catch (error) {
        console.error('Error en /api/dashboard/no-conformidades-gestion:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
