import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Obtener todos los usuarios con rol jefaturas o supervisor
        const usuarios = await prisma.user.findMany({
            where: { rol: { in: ['jefaturas', 'supervisor'] } },
            select: { id: true, name: true, username: true, rol: true },
        });

        if (usuarios.length === 0) {
            return NextResponse.json({ usuarios: [] });
        }

        const userIds = usuarios.map(u => u.id);

        // Conteos agrupados en paralelo
        const [
            caminatasGrupo,
            controlARTGrupo,
            tarjetaStopGrupo,
            reportePeligroGrupo,
            reportesCierreGrupo,
            tarjetasCierreGrupo,
            reportesVerifGrupo,
        ] = await Promise.all([
            // Caminatas pendientes/en proceso asignadas al usuario
            prisma.caminataSeguridad.groupBy({
                by: ['asignadoId'],
                where: {
                    asignadoId: { in: userIds },
                    estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
                },
                _count: { id: true },
            }),
            // Tareas tipo control_art
            prisma.tareaAsignada.groupBy({
                by: ['asignadoId'],
                where: { asignadoId: { in: userIds }, estado: 'PENDIENTE', tipo: 'control_art' },
                _count: { id: true },
            }),
            // Tareas tipo tarjeta_stop
            prisma.tareaAsignada.groupBy({
                by: ['asignadoId'],
                where: { asignadoId: { in: userIds }, estado: 'PENDIENTE', tipo: 'tarjeta_stop' },
                _count: { id: true },
            }),
            // Tareas tipo reporte_peligro
            prisma.tareaAsignada.groupBy({
                by: ['asignadoId'],
                where: { asignadoId: { in: userIds }, estado: 'PENDIENTE', tipo: 'reporte_peligro' },
                _count: { id: true },
            }),
            // Reportes peligro pendientes de cierre
            prisma.reportePeligro.groupBy({
                by: ['responsableCierreId'],
                where: {
                    responsableCierreId: { in: userIds },
                    estado: 'PENDIENTE',
                },
                _count: { id: true },
            }),
            // Tarjetas stop pendientes de cierre
            prisma.tarjetaStop.groupBy({
                by: ['responsableCierreId'],
                where: {
                    responsableCierreId: { in: userIds },
                    estado: 'PENDIENTE',
                },
                _count: { id: true },
            }),
            // Reportes pendientes de verificación
            prisma.reportePeligro.groupBy({
                by: ['responsableVerificacionId'],
                where: {
                    responsableVerificacionId: { in: userIds },
                    estado: 'PENDIENTE_VERIFICACION',
                },
                _count: { id: true },
            }),
        ]);

        // Indexar por userId para búsqueda O(1)
        const idx = <T extends { _count: { id: number } }>(
            arr: (T & { [key: string]: any })[],
            field: string
        ): Record<number, number> =>
            Object.fromEntries(arr.map(g => [g[field], g._count.id]));

        const caminatasMap = idx(caminatasGrupo, 'asignadoId');
        const controlARTMap = idx(controlARTGrupo, 'asignadoId');
        const tarjetaStopMap = idx(tarjetaStopGrupo, 'asignadoId');
        const reportePeligroMap = idx(reportePeligroGrupo, 'asignadoId');
        const reportesCierreMap = idx(reportesCierreGrupo as any[], 'responsableCierreId');
        const tarjetasCierreMap = idx(tarjetasCierreGrupo as any[], 'responsableCierreId');
        const reportesVerifMap = idx(reportesVerifGrupo as any[], 'responsableVerificacionId');

        const resultado = usuarios.map(u => {
            const caminatas = caminatasMap[u.id] ?? 0;
            const cierre = (reportesCierreMap[u.id] ?? 0) + (tarjetasCierreMap[u.id] ?? 0) + (reportesVerifMap[u.id] ?? 0);
            const controlART = controlARTMap[u.id] ?? 0;
            const tarjetaStop = tarjetaStopMap[u.id] ?? 0;
            const reportePeligro = reportePeligroMap[u.id] ?? 0;
            const total = caminatas + cierre + controlART + tarjetaStop + reportePeligro;

            return {
                id: u.id,
                name: u.name || u.username,
                rol: u.rol,
                total,
                breakdown: { caminatas, cierre, controlART, tarjetaStop, reportePeligro },
            };
        });

        // Ordenar de mayor a menor actividades pendientes
        resultado.sort((a, b) => b.total - a.total);

        return NextResponse.json({ usuarios: resultado });
    } catch (error) {
        console.error('Error al obtener actividades por usuario:', error);
        return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 });
    }
}
