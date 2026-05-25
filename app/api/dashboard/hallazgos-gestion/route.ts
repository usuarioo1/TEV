import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseSantiagoDate } from '@/lib/date-chile';
import { getSession } from '@/lib/session';

type RolStats = { total: number; abierta: number; cerrada: number };

/**
 * GET /api/dashboard/hallazgos-gestion
 * Returns counts of Hallazgo records grouped by estado and responsableRol.
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

        const fechaAsignacionFilter: { gte?: Date; lte?: Date } = {};
        if (fechaInicio) fechaAsignacionFilter.gte = parseSantiagoDate(fechaInicio);
        if (fechaFin) fechaAsignacionFilter.lte = parseSantiagoDate(fechaFin, true);

        const all = await prisma.hallazgo.findMany({
            where: Object.keys(fechaAsignacionFilter).length
                ? { servicio: { fechaAsignacion: fechaAsignacionFilter } }
                : undefined,
            select: { estado: true, responsableRol: true },
        });

        const roles = ['taller', 'coordinador', 'prevencionista'] as const;

        const porRol: Record<string, RolStats> = {};
        for (const rol of roles) {
            porRol[rol] = { total: 0, abierta: 0, cerrada: 0 };
        }

        let totalAbierta = 0;
        let totalCerrada = 0;

        for (const hallazgo of all) {
            const rol = hallazgo.responsableRol as string;
            const estado = hallazgo.estado as string;

            if (!porRol[rol]) {
                porRol[rol] = { total: 0, abierta: 0, cerrada: 0 };
            }

            porRol[rol].total++;
            if (estado === 'ABIERTA') {
                porRol[rol].abierta++;
                totalAbierta++;
            } else if (estado === 'CERRADA') {
                porRol[rol].cerrada++;
                totalCerrada++;
            }
        }

        return NextResponse.json({
            total: all.length,
            abierta: totalAbierta,
            cerrada: totalCerrada,
            porRol,
        });
    } catch (error) {
        console.error('Error en /api/dashboard/hallazgos-gestion:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}