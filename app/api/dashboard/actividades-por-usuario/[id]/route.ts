import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const usuario = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, username: true, rol: true },
        });

        if (!usuario) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const [caminatas, tareas, reportesCierre, tarjetasCierre, verificacion] = await Promise.all([
            prisma.caminataSeguridad.findMany({
                where: {
                    asignadoId: userId,
                    estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
                },
                select: {
                    id: true,
                    codigo: true,
                    zona: true,
                    faena: true,
                    actividad: true,
                    estado: true,
                    fechaCreacion: true,
                },
                orderBy: { fechaCreacion: 'desc' },
            }),
            // Tareas asignadas pendientes (ART, tarjeta stop, reporte peligro)
            prisma.tareaAsignada.findMany({
                where: {
                    asignadoId: userId,
                    estado: 'PENDIENTE',
                },
                select: {
                    id: true,
                    tipo: true,
                    descripcion: true,
                    estado: true,
                    createdAt: true,
                    creadoPor: { select: { id: true, name: true, username: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            // Reportes peligro pendientes de cierre
            prisma.reportePeligro.findMany({
                where: {
                    responsableCierreId: userId,
                    estado: 'PENDIENTE',
                },
                select: {
                    id: true,
                    datos: true,
                    estado: true,
                    createdAt: true,
                    caminata: { select: { id: true, codigo: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            // Tarjetas stop pendientes de cierre
            prisma.tarjetaStop.findMany({
                where: {
                    responsableCierreId: userId,
                    estado: 'PENDIENTE',
                },
                select: {
                    id: true,
                    datos: true,
                    estado: true,
                    createdAt: true,
                    caminata: { select: { id: true, codigo: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            // Reportes pendientes de verificación
            prisma.reportePeligro.findMany({
                where: {
                    responsableVerificacionId: userId,
                    estado: 'PENDIENTE_VERIFICACION',
                },
                select: {
                    id: true,
                    datos: true,
                    estado: true,
                    createdAt: true,
                    caminata: { select: { id: true, codigo: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        // Combinar reportes y tarjetas en una lista de cierre uniforme
        const cierre = [
            ...reportesCierre.map(r => ({ ...r, tipo: 'reporte' as const })),
            ...tarjetasCierre.map(t => ({ ...t, tipo: 'tarjeta' as const })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({
            usuario: { id: usuario.id, name: usuario.name || usuario.username, rol: usuario.rol },
            caminatas,
            tareas,
            cierre,
            verificacion,
        });
    } catch (error) {
        console.error('Error al obtener actividades del usuario:', error);
        return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 });
    }
}
