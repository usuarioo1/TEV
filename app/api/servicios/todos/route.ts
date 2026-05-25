import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@/app/generated/prisma/client';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { ESTADOS_SERVICIO, type EstadoServicio } from '@/lib/servicio-utils';

export const dynamic = 'force-dynamic';

function isEstadoServicio(value: string): value is EstadoServicio {
    return Object.values(ESTADOS_SERVICIO).includes(value as EstadoServicio);
}

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

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener parámetros de consulta
        const searchParams = request.nextUrl.searchParams;
        const fechaDesde = searchParams.get('fechaDesde');
        const fechaHasta = searchParams.get('fechaHasta');
        const estado = searchParams.get('estado');

        // Construir filtro de consulta
        const whereClause: Prisma.ServicioWhereInput = {};

        // Filtro de fecha en zona horaria America/Santiago (DST-aware)
        if (fechaDesde || fechaHasta) {
            whereClause.fechaAsignacion = {};
            if (fechaDesde) {
                whereClause.fechaAsignacion.gte = parseSantiagoDate(fechaDesde);
            }
            if (fechaHasta) {
                whereClause.fechaAsignacion.lte = parseSantiagoDate(fechaHasta, true);
            }
        }

        if (estado && estado !== 'TODOS' && isEstadoServicio(estado)) {
            whereClause.estado = estado;
        }

        // Obtener todos los servicios con sus relaciones
        const servicios = await prisma.servicio.findMany({
            where: whereClause,
            include: {
                operario: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                checklistEquipo: true,
                checklistFatiga: true,
                analisisRiesgo: true,
                hallazgos: {
                    select: {
                        estado: true,
                    },
                },
                noConformidades: {
                    select: {
                        estado: true,
                    },
                },
                aprobacion: {
                    include: {
                        supervisor: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                fechaAsignacion: 'desc',
            },
        });

        // Transformar los datos para incluir información útil
        const serviciosConInfo = servicios.map(servicio => {
            // Calcular estado de checklists
            const checklistsCompletados = {
                equipo: !!servicio.checklistEquipo,
                fatiga: !!servicio.checklistFatiga,
                riesgos: !!servicio.analisisRiesgo,
            };

            const totalChecklists = 3;
            const completados = Object.values(checklistsCompletados).filter(Boolean).length;
            const porcentajeCompletado = Math.round((completados / totalChecklists) * 100);

            // Detectar problemas
            const problemas = [];
            if (servicio.checklistEquipo && !servicio.checklistEquipo.equipoEnCondiciones) {
                problemas.push('Equipo con fallas');
            }
            if (servicio.checklistFatiga && !servicio.checklistFatiga.aptoParaTrabajar) {
                problemas.push('Conductor no apto');
            }
            if (servicio.analisisRiesgo && !servicio.analisisRiesgo.riesgosControlados) {
                problemas.push('Riesgos no controlados');
            }

            const hallazgosAbiertos = servicio.hallazgos.filter((hallazgo) => hallazgo.estado === 'ABIERTA').length;
            const hallazgosCerrados = servicio.hallazgos.filter((hallazgo) => hallazgo.estado === 'CERRADA').length;
            const noConformidadesAbiertas = servicio.noConformidades.filter((nc) => nc.estado === 'ABIERTA').length;
            const noConformidadesCerradas = servicio.noConformidades.filter((nc) => nc.estado === 'CERRADA').length;

            return {
                id: servicio.id,
                codigo: servicio.codigo,
                descripcion: servicio.descripcion,
                origen: servicio.origen,
                destino: servicio.destino,
                estado: servicio.estado,
                fechaAsignacion: servicio.fechaAsignacion,
                fechaAceptacion: servicio.fechaAceptacion,
                fechaRechazo: servicio.fechaRechazo,
                fechaAprobacion: servicio.aprobacion?.fechaAprobacion,
                fechaInicioEjecucion: servicio.fechaInicio,
                fechaFinalizacion: servicio.fechaFinalizacion,
                observaciones: servicio.observaciones,
                operario: servicio.operario,
                coordinador: servicio.coordinador,
                checklistsCompletados,
                porcentajeCompletado,
                problemas,
                hallazgos: {
                    total: servicio.hallazgos.length,
                    abiertos: hallazgosAbiertos,
                    cerrados: hallazgosCerrados,
                },
                noConformidades: {
                    total: servicio.noConformidades.length,
                    abiertos: noConformidadesAbiertas,
                    cerrados: noConformidadesCerradas,
                },
                aprobacion: servicio.aprobacion ? {
                    aprobado: servicio.aprobacion.aprobado,
                    observaciones: servicio.aprobacion.observaciones,
                    supervisor: servicio.aprobacion.supervisor,
                    fechaDecision: servicio.aprobacion.fechaAprobacion,
                } : null,
                // Incluir datos completos de checklists para el detalle
                checklistEquipo: servicio.checklistEquipo,
                checklistFatiga: servicio.checklistFatiga,
                analisisRiesgo: servicio.analisisRiesgo,
            };
        });

        return NextResponse.json({
            servicios: serviciosConInfo,
            total: serviciosConInfo.length,
        });

    } catch (error) {
        console.error('Error al obtener servicios:', error);
        return NextResponse.json(
            { error: 'Error al obtener servicios' },
            { status: 500 }
        );
    }
}
