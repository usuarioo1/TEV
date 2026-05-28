import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { canViewHallazgos } from '@/lib/permissions';
import { reconstruirHallazgosDesdeChecklists } from '@/lib/hallazgos';

const TIPOS_CHECKLIST_VALIDOS = new Set(['TRACTO_CAMION', 'SEMIREMOLQUE']);

/**
 * GET /api/hallazgoschecklist
 * Lista hallazgos detectados desde checklists de tractocamión y semirremolque.
 * Incluye items SI con observacion/informacion adicional y items NO/NC no críticos.
 *
 * Query params:
 * - estado: ABIERTA | CERRADA
 * - servicioId: number
 * - checklistTipo: TRACTO_CAMION | SEMIREMOLQUE
 * - codigo: búsqueda por código de servicio
 * - resync: 1 para reconstruir hallazgos desde checklists antes de listar
 */
export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !canViewHallazgos(session.rol)) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const estado = searchParams.get('estado');
        const servicioIdParam = searchParams.get('servicioId');
        const checklistTipo = searchParams.get('checklistTipo');
        const codigoBusqueda = searchParams.get('codigo');
        const resyncParam = searchParams.get('resync');

        if (estado && estado !== 'ABIERTA' && estado !== 'CERRADA') {
            return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
        }

        if (checklistTipo && !TIPOS_CHECKLIST_VALIDOS.has(checklistTipo)) {
            return NextResponse.json({ message: 'Tipo de checklist inválido' }, { status: 400 });
        }

        const servicioId = servicioIdParam ? Number.parseInt(servicioIdParam, 10) : undefined;
        if (servicioIdParam && Number.isNaN(servicioId)) {
            return NextResponse.json({ message: 'servicioId inválido' }, { status: 400 });
        }

        // Auto-reconstrucción opcional para recuperar hallazgos faltantes en históricos.
        if (resyncParam === '1') {
            await reconstruirHallazgosDesdeChecklists(prisma, { servicioId });
        }

        const whereClause: Record<string, unknown> = {};

        if (session.rol !== 'jefaturas') {
            whereClause.responsableRol = session.rol;
        }

        if (estado) {
            whereClause.estado = estado;
        }

        if (typeof servicioId === 'number') {
            whereClause.servicioId = servicioId;
        }

        if (checklistTipo) {
            whereClause.checklistTipo = checklistTipo;
        }

        if (codigoBusqueda) {
            whereClause.servicio = {
                codigo: { contains: codigoBusqueda.toUpperCase(), mode: 'insensitive' },
            };
        }

        const hallazgos = await prisma.hallazgo.findMany({
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

        return NextResponse.json(hallazgos);
    } catch (error) {
        console.error('Error al obtener hallazgos checklist:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}