import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';

export const dynamic = 'force-dynamic';

type TipoNoConformidad = 'equipo' | 'tracto';

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
        const tipo = searchParams.get('tipo') as TipoNoConformidad | null;
        const fechaInicioParam = searchParams.get('fechaInicio');
        const fechaFinParam = searchParams.get('fechaFin');
        const empresaIdParam = searchParams.get('empresaId');

        let empresaId: number | null = null;
        if (empresaIdParam) {
            const parsedEmpresaId = Number(empresaIdParam);
            if (!Number.isInteger(parsedEmpresaId) || parsedEmpresaId <= 0) {
                return NextResponse.json({ error: 'empresaId inválido' }, { status: 400 });
            }
            empresaId = parsedEmpresaId;
        }

        if (tipo !== 'equipo' && tipo !== 'tracto') {
            return NextResponse.json({ error: 'Tipo inválido. Usa equipo o tracto.' }, { status: 400 });
        }

        const fechaInicioDate = fechaInicioParam ? parseSantiagoDate(fechaInicioParam) : null;
        const fechaFinDate = fechaFinParam ? parseSantiagoDate(fechaFinParam, true) : null;
        const hasDateFilter = !!(fechaInicioDate || fechaFinDate);
        const checklistDateWhere = {
            ...(fechaInicioDate && { gte: fechaInicioDate }),
            ...(fechaFinDate && { lte: fechaFinDate }),
        };
        const servicioWhere = {
            ...(hasDateFilter && { fechaAsignacion: checklistDateWhere }),
            ...(empresaId && { empresaId }),
        };
        const hasServicioFilter = Object.keys(servicioWhere).length > 0;

        const checklistTipo = tipo === 'equipo' ? 'SEMIREMOLQUE' : 'TRACTO_CAMION';

        const noConformidades = await prisma.noConformidad.findMany({
            where: {
                estado: 'ABIERTA',
                checklistTipo,
                ...(hasServicioFilter && { servicio: servicioWhere }),
            },
            select: {
                id: true,
                servicioId: true,
                checklistTipo: true,
                itemNombre: true,
                createdAt: true,
                servicio: {
                    select: {
                        id: true,
                        codigo: true,
                        empresa: {
                            select: {
                                nombre: true,
                            },
                        },
                        descripcion: true,
                        estado: true,
                        origen: true,
                        destino: true,
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
                        checklistEquipo: {
                            select: {
                                patente: true,
                                fecha: true,
                            },
                        },
                        checklistTractoCamion: {
                            select: {
                                patente: true,
                                fecha: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const noConformidadesCriticas = noConformidades.filter((nc) =>
            isChecklistItemCritico(nc.checklistTipo as 'TRACTO_CAMION' | 'SEMIREMOLQUE', nc.itemNombre)
        );

        const serviciosMap = new Map<number, {
            checklistId: number;
            servicioId: number;
            servicioCodigo: string;
            servicioEstado: string;
            empresaNombre: string;
            descripcion: string;
            origen: string;
            destino: string;
            patente: string;
            fechaChecklist: Date;
            operario: string;
            coordinador: string;
            ultimaDeteccion: Date;
        }>();

        noConformidadesCriticas.forEach((nc) => {
            const checklist = tipo === 'equipo' ? nc.servicio.checklistEquipo : nc.servicio.checklistTractoCamion;
            const fechaChecklist = checklist?.fecha || nc.createdAt;

            const existing = serviciosMap.get(nc.servicioId);
            if (existing) {
                if (fechaChecklist > existing.ultimaDeteccion) {
                    existing.fechaChecklist = fechaChecklist;
                    existing.ultimaDeteccion = fechaChecklist;
                    existing.checklistId = nc.id;
                }
                return;
            }

            serviciosMap.set(nc.servicioId, {
                checklistId: nc.id,
                servicioId: nc.servicio.id,
                servicioCodigo: nc.servicio.codigo,
                servicioEstado: nc.servicio.estado,
                empresaNombre: nc.servicio.empresa?.nombre || 'Sin empresa',
                descripcion: nc.servicio.descripcion,
                origen: nc.servicio.origen,
                destino: nc.servicio.destino,
                patente: checklist?.patente || 'Sin patente',
                fechaChecklist,
                operario: nc.servicio.operario?.name || nc.servicio.operario?.username || 'Sin operario',
                coordinador: nc.servicio.coordinador?.name || nc.servicio.coordinador?.username || 'Sin coordinador',
                ultimaDeteccion: fechaChecklist,
            });
        });

        const servicios = Array.from(serviciosMap.values())
            .sort((a, b) => b.ultimaDeteccion.getTime() - a.ultimaDeteccion.getTime())
            .map(({ ultimaDeteccion, ...servicio }) => servicio);

        return NextResponse.json({
            tipo,
            total: servicios.length,
            servicios,
        });
    } catch (error) {
        console.error('Error al obtener servicios con no conformidades:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
