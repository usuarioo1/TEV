import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildDateOnlyCompatWhere } from '@/lib/date-chile';

export const dynamic = 'force-dynamic';

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

        const checklistDateWhere = buildDateOnlyCompatWhere(fechaInicioParam, fechaFinParam);
        const hasDateFilter = !!(checklistDateWhere.gte || checklistDateWhere.lte);

        const checklists = await prisma.checklistFatiga.findMany({
            where: {
                completado: true,
                ...(hasDateFilter && { fecha: checklistDateWhere }),
            },
            select: {
                id: true,
                fecha: true,
                aptoParaTrabajar: true,
                requiereReemplazo: true,
                observaciones: true,
                servicio: {
                    select: {
                        id: true,
                        codigo: true,
                        descripcion: true,
                        origen: true,
                        destino: true,
                        estado: true,
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
                    },
                },
            },
            orderBy: {
                fecha: 'desc',
            },
        });

        const payload = checklists.map((checklist) => ({
            checklistId: checklist.id,
            aptoParaTrabajar: checklist.aptoParaTrabajar,
            requiereReemplazo: checklist.requiereReemplazo,
            observaciones: checklist.observaciones,
            fechaChecklist: checklist.fecha,
            servicioId: checklist.servicio.id,
            servicioCodigo: checklist.servicio.codigo,
            descripcion: checklist.servicio.descripcion,
            origen: checklist.servicio.origen,
            destino: checklist.servicio.destino,
            estadoServicio: checklist.servicio.estado,
            fechaAsignacion: checklist.servicio.fechaAsignacion,
            operario: checklist.servicio.operario?.name || checklist.servicio.operario?.username || 'Sin operario',
            coordinador: checklist.servicio.coordinador?.name || checklist.servicio.coordinador?.username || 'Sin coordinador',
        }));

        const noAptos = payload.filter(item => !item.aptoParaTrabajar).length;
        const conReemplazo = payload.filter(item => item.requiereReemplazo).length;

        return NextResponse.json({
            total: payload.length,
            aptos: payload.length - noAptos,
            noAptos,
            conReemplazo,
            checklists: payload,
        });
    } catch (error) {
        console.error('Error al obtener detalle de conductores aptos:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
