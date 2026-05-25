import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { canViewNoConformidades } from '@/lib/permissions';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';

/**
 * GET /api/no-conformidades
 * Lista no conformidades filtrando por el rol del usuario autenticado.
 * - taller, coordinador, prevencionista: solo ven las de su rol
 * - jefaturas: ve todas
 */
export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !canViewNoConformidades(session.rol)) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const estado = searchParams.get('estado');           // ABIERTA | CERRADA
        const servicioId = searchParams.get('servicioId');
        const checklistTipo = searchParams.get('checklistTipo'); // TRACTO_CAMION | SEMIREMOLQUE
        const codigoBusqueda = searchParams.get('codigo');    // búsqueda por código de servicio

        const whereClause: Record<string, unknown> = {};

        // Filtrado por rol (jefaturas ve todo)
        if (session.rol !== 'jefaturas') {
            whereClause.responsableRol = session.rol;
        }
        if (estado === 'ABIERTA' || estado === 'CERRADA') {
            whereClause.estado = estado;
        }
        if (servicioId) whereClause.servicioId = parseInt(servicioId);
        if (checklistTipo) whereClause.checklistTipo = checklistTipo;
        if (codigoBusqueda) {
            whereClause.servicio = {
                codigo: { contains: codigoBusqueda.toUpperCase(), mode: 'insensitive' },
            };
        }

        const noConformidades = await prisma.noConformidad.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                servicio: {
                    select: {
                        id: true,
                        codigo: true,
                        descripcion: true,
                        origen: true,
                        destino: true,
                        estado: true,
                        fechaAsignacion: true,
                        operario: { select: { id: true, name: true, username: true, rut: true } },
                        coordinador: { select: { id: true, name: true, username: true } },
                        aprobacion: {
                            select: {
                                fechaAprobacion: true,
                                supervisor: { select: { id: true, name: true, username: true } },
                            },
                        },
                    },
                },
                comentarios: {
                    orderBy: { createdAt: 'asc' },
                    include: { autor: { select: { id: true, name: true, username: true, rol: true } } },
                },
            },
        });

        const noConformidadesCriticas = noConformidades.filter((nc) =>
            isChecklistItemCritico(nc.checklistTipo as 'TRACTO_CAMION' | 'SEMIREMOLQUE', nc.itemNombre)
        );

        return NextResponse.json(noConformidadesCriticas);
    } catch (error) {
        console.error('Error al obtener no conformidades:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
