import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildDateOnlyCompatWhere } from '@/lib/date-chile';
import { hasChecklistNoCritico, isChecklistItemCritico } from '@/lib/checklist-critical-items';

export const dynamic = 'force-dynamic';

/** Returns UTC offset in ms for America/Santiago at the given moment (positive = Chile is behind UTC, e.g. UTC-4 → 14400000) */
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

/** Parse a YYYY-MM-DD string as start/end of day in America/Santiago timezone (DST-aware) */
function parseSantiagoDate(dateStr: string, endOfDay = false): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    const noonRef = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const offsetMs = getSantiagoOffsetMs(noonRef);
    const baseMs = endOfDay
        ? Date.UTC(y, m - 1, d, 23, 59, 59, 999)
        : Date.UTC(y, m - 1, d, 0, 0, 0, 0);
    return new Date(baseMs + offsetMs);
}

const DB_RETRY_MAX_ATTEMPTS = 3;
const DB_RETRY_BASE_DELAY_MS = 350;
type EstadoKpiChecklist = 'PENDIENTE_APROBACION' | 'APROBADO' | 'EN_EJECUCION' | 'COMPLETADO' | 'RECHAZADO';
const ESTADOS_KPI_CHECKLIST: EstadoKpiChecklist[] = ['PENDIENTE_APROBACION', 'APROBADO', 'EN_EJECUCION', 'COMPLETADO', 'RECHAZADO'];

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

function getErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code?: unknown }).code;
        if (typeof code === 'string') {
            return code;
        }
    }
    return undefined;
}

function isTransientDatabaseError(error: unknown): boolean {
    const code = getErrorCode(error);
    if (code === 'P1001' || code === 'P2024') {
        return true;
    }

    const msg = getErrorMessage(error).toLowerCase();
    return [
        'failed to connect to upstream database',
        'connection terminated unexpectedly',
        'too many connections',
        'timeout',
        'timed out',
        'could not connect',
        'econnreset',
        'econnrefused',
        'eai_again',
    ].some(pattern => msg.includes(pattern));
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function withDbRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= DB_RETRY_MAX_ATTEMPTS; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const retryable = isTransientDatabaseError(error);
            const canRetry = retryable && attempt < DB_RETRY_MAX_ATTEMPTS;

            if (!canRetry) {
                throw error;
            }

            const waitMs = DB_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(`[dashboard/metrics] ${label} fallo intento ${attempt}. Reintentando en ${waitMs}ms.`);
            await delay(waitMs);
        }
    }

    throw lastError;
}

export async function GET(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo jefaturas y prevencionista pueden acceder al dashboard
    if (session.rol !== ROLES.JEFATURAS && session.rol !== ROLES.PREVENCIONISTA) {
        return NextResponse.json({ error: 'No tienes permisos para acceder al dashboard' }, { status: 403 });
    }

    // Parse filtro de fechas
    const { searchParams } = new URL(request.url);
    const fechaInicioParam = searchParams.get('fechaInicio');
    const fechaFinParam = searchParams.get('fechaFin');
    const empresaIdParam = searchParams.get('empresaId');

    let empresaId: number | null = null;
    if (empresaIdParam) {
        const parsedEmpresaId = Number(empresaIdParam);
        if (!Number.isInteger(parsedEmpresaId) || parsedEmpresaId <= 0) {
            return NextResponse.json({ error: 'empresaId invalido' }, { status: 400 });
        }
        empresaId = parsedEmpresaId;
    }

    // Parsear fechas explícitamente en zona horaria America/Santiago (maneja DST automáticamente)
    const fechaInicioDate = fechaInicioParam ? parseSantiagoDate(fechaInicioParam) : null;
    const fechaFinDate = fechaFinParam ? parseSantiagoDate(fechaFinParam, true) : null;
    const checklistFechaWhere = buildDateOnlyCompatWhere(fechaInicioParam, fechaFinParam);
    const hasChecklistDateFilter = !!(checklistFechaWhere.gte || checklistFechaWhere.lte);
    const hasDateFilter = !!(fechaInicioDate || fechaFinDate);
    const hasEmpresaFilter = !!empresaId;
    const servicioEmpresaWhere = empresaId ? { empresaId } : {};
    const hasServicioFilter = hasDateFilter || hasEmpresaFilter;
    const servicioDateWhere = {
        ...(fechaInicioDate && { gte: fechaInicioDate }),
        ...(fechaFinDate && { lte: fechaFinDate }),
    };

    try {
        // Obtener fecha actual y rangos de tiempo en hora chilena (America/Santiago, maneja DST)
        const now = new Date();
        const santiagoOffsetMs = getSantiagoOffsetMs(now);
        const nowSantiago = new Date(now.getTime() - santiagoOffsetMs); // hora local Santiago expresada como UTC
        const sy = nowSantiago.getUTCFullYear();
        const sm = nowSantiago.getUTCMonth();
        const sd = nowSantiago.getUTCDate();
        const startOfToday = new Date(Date.UTC(sy, sm, sd, 0, 0, 0, 0) + santiagoOffsetMs);
        const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(Date.UTC(sy, sm, 1, 0, 0, 0, 0) + santiagoOffsetMs);
        const startOfLastMonth = new Date(Date.UTC(sy, sm - 1, 1, 0, 0, 0, 0) + santiagoOffsetMs);
        const endOfLastMonth = new Date(Date.UTC(sy, sm, 0, 23, 59, 59, 999) + santiagoOffsetMs);

        const completadosDateFilter = hasDateFilter ? servicioDateWhere : undefined;
        const servicioFiltroNoConformidades = {
            ...(hasDateFilter && { fechaAsignacion: servicioDateWhere }),
            ...servicioEmpresaWhere,
        };
        const hasServicioFiltroNoConformidades = Object.keys(servicioFiltroNoConformidades).length > 0;

        // Ejecutar las queries en lotes para reducir picos de conexiones simultaneas.
        const [
            serviciosPorEstadoRaw,
            serviciosCompletadosHoy,
            serviciosCompletadosSemana,
            serviciosCompletadosMes,
            serviciosCompletadosMesAnterior,
            totalAnalisisRiesgo,
            analisisRiesgoControlado,
            checklistsEquipoKpi,
            checklistsTractoKpi,
        ] = await withDbRetry('lote 1 de metricas', () => Promise.all([
            // 1. SERVICIOS POR ESTADO
            prisma.servicio.groupBy({
                by: ['estado'],
                ...(hasServicioFilter && {
                    where: {
                        ...(hasDateFilter && { createdAt: servicioDateWhere }),
                        ...servicioEmpresaWhere,
                    },
                }),
                _count: true,
            }),
            // 2. COMPLETADOS HOY
            prisma.servicio.count({
                where: {
                    estado: 'COMPLETADO',
                    fechaFinalizacion: { gte: startOfToday },
                    ...(completadosDateFilter && { createdAt: completadosDateFilter }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 2b. COMPLETADOS SEMANA
            prisma.servicio.count({
                where: {
                    estado: 'COMPLETADO',
                    fechaFinalizacion: { gte: startOfWeek },
                    ...(completadosDateFilter && { createdAt: completadosDateFilter }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 2c. COMPLETADOS MES
            prisma.servicio.count({
                where: {
                    estado: 'COMPLETADO',
                    fechaFinalizacion: { gte: startOfMonth },
                    ...(completadosDateFilter && { createdAt: completadosDateFilter }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 2d. COMPLETADOS MES ANTERIOR
            prisma.servicio.count({
                where: {
                    estado: 'COMPLETADO',
                    fechaFinalizacion: { gte: startOfLastMonth, lte: endOfLastMonth },
                    ...(completadosDateFilter && { createdAt: completadosDateFilter }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 3. ANALISIS DE RIESGO TOTAL
            prisma.analisisRiesgo.count({
                where: hasServicioFilter
                    ? {
                        ...(hasDateFilter && { createdAt: servicioDateWhere }),
                        ...(hasEmpresaFilter && {
                            servicio: {
                                is: servicioEmpresaWhere,
                            },
                        }),
                    }
                    : undefined,
            }),
            // 3b. RIESGOS CONTROLADOS
            prisma.analisisRiesgo.count({
                where: {
                    riesgosControlados: true,
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...(hasEmpresaFilter && {
                        servicio: {
                            is: servicioEmpresaWhere,
                        },
                    }),
                },
            }),
            // 4. CHECKLIST EQUIPO PARA KPI CONDICIONES
            prisma.checklistEquipo.findMany({
                where: {
                    servicio: {
                        is: {
                            estado: { in: ESTADOS_KPI_CHECKLIST },
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                    },
                },
                select: {
                    items: true,
                },
            }),
            // 4b. CHECKLIST TRACTO PARA KPI CONDICIONES
            prisma.checklistTractoCamion.findMany({
                where: {
                    servicio: {
                        is: {
                            estado: { in: ESTADOS_KPI_CHECKLIST },
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                    },
                },
                select: {
                    items: true,
                },
            }),
        ]));

        const [
            totalChecklistFatiga,
            conductoresNoAptos,
            conductoresReemplazo,
            totalAprobaciones,
            aprobacionesOk,
            serviciosConTiempos,
            aprobacionesConTiempos,
            operariosProductivos,
            checklistsEquipoCompletadosKpi,
        ] = await withDbRetry('lote 2 de metricas', () => Promise.all([
            // 5. CHECKLIST FATIGA CONTESTADO TOTAL
            prisma.checklistFatiga.count({
                where: {
                    completado: true,
                    ...(hasChecklistDateFilter && { fecha: checklistFechaWhere }),
                    ...(hasEmpresaFilter && {
                        servicio: {
                            is: servicioEmpresaWhere,
                        },
                    }),
                },
            }),
            // 5b. CONDUCTORES NO APTOS
            prisma.checklistFatiga.count({
                where: {
                    completado: true,
                    aptoParaTrabajar: false,
                    ...(hasChecklistDateFilter && { fecha: checklistFechaWhere }),
                    ...(hasEmpresaFilter && {
                        servicio: {
                            is: servicioEmpresaWhere,
                        },
                    }),
                },
            }),
            // 5c. CONDUCTORES CON REEMPLAZO
            prisma.checklistFatiga.count({
                where: {
                    completado: true,
                    requiereReemplazo: true,
                    ...(hasChecklistDateFilter && { fecha: checklistFechaWhere }),
                    ...(hasEmpresaFilter && {
                        servicio: {
                            is: servicioEmpresaWhere,
                        },
                    }),
                },
            }),
            // 6. APROBACIONES TOTAL (solo decisiones de supervisor sobre checklist fatiga)
            prisma.checklistFatiga.count({
                where: {
                    completado: true,
                    servicio: {
                        is: {
                            aprobacion: {
                                isNot: null,
                            },
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                    },
                },
            }),
            // 6b. APROBACIONES OK (decisiones aprobadas por supervisor)
            prisma.checklistFatiga.count({
                where: {
                    completado: true,
                    servicio: {
                        is: {
                            aprobacion: {
                                is: {
                                    aprobado: true,
                                },
                            },
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                    },
                },
            }),
            // 7. SERVICIOS CON TIEMPOS (ciclo)
            prisma.servicio.findMany({
                where: {
                    estado: 'COMPLETADO',
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
                select: { fechaAsignacion: true, fechaFinalizacion: true },
            }),
            // 8. APROBACIONES CON TIEMPOS
            prisma.servicio.findMany({
                where: {
                    estado: { in: ['APROBADO', 'EN_EJECUCION', 'COMPLETADO'] },
                    aprobacion: { isNot: null },
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
                include: { aprobacion: true },
            }),
            // 9. OPERARIOS PRODUCTIVOS (top 5)
            prisma.user.findMany({
                where: {
                    rol: 'operario',
                    serviciosAsignados: {
                        some: {
                            ...servicioEmpresaWhere,
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    _count: {
                        select: {
                            serviciosAsignados: {
                                where: {
                                    estado: 'COMPLETADO',
                                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                                    ...servicioEmpresaWhere,
                                },
                            },
                        },
                    },
                },
                orderBy: { serviciosAsignados: { _count: 'desc' } },
                take: 5,
            }),
            // 10c. CHECKLIST EQUIPO EN SERVICIOS COMPLETADOS
            prisma.checklistEquipo.findMany({
                where: {
                    servicio: {
                        is: {
                            estado: 'COMPLETADO',
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                    },
                },
                select: {
                    items: true,
                },
            }),
        ]));

        const [
            serviciosRechazados,
            serviciosConAtencion,
            totalAsignados,
            serviciosAceptados,
            serviciosEnEspera,
            noConformidadesAbiertas,
            operariosConCumplimiento,
        ] = await withDbRetry('lote 3 de metricas', () => Promise.all([
            // 11. SERVICIOS RECHAZADOS POR OPERARIO (motivoRechazo not null = operario rechazó)
            prisma.servicio.count({
                where: {
                    estado: 'RECHAZADO',
                    motivoRechazo: { not: null },
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 13. SERVICIOS EN ATENCION
            prisma.servicio.count({
                where: {
                    OR: [
                        { checklistEquipo: { equipoEnCondiciones: false } },
                        { checklistTractoCamion: { equipoEnCondiciones: false } },
                        { checklistFatiga: { aptoParaTrabajar: false } },
                        { analisisRiesgo: { riesgosControlados: false } },
                    ],
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 15. TOTAL ASIGNADOS (excluye PENDIENTE y CANCELADO)
            prisma.servicio.count({
                where: {
                    estado: { notIn: ['PENDIENTE', 'CANCELADO'] },
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 15b. SERVICIOS ACEPTADOS
            prisma.servicio.count({
                where: {
                    estado: { in: ['ACEPTADO', 'EN_CHECKLIST', 'PENDIENTE_APROBACION', 'APROBADO', 'EN_EJECUCION', 'COMPLETADO'] },
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 15c. SERVICIOS EN ESPERA (ASIGNADO, aún sin respuesta del operario)
            prisma.servicio.count({
                where: {
                    estado: 'ASIGNADO',
                    ...(hasDateFilter && { createdAt: servicioDateWhere }),
                    ...servicioEmpresaWhere,
                },
            }),
            // 16. NO CONFORMIDADES ABIERTAS (fechaDetectada = servicio.fechaAsignacion)
            prisma.noConformidad.findMany({
                where: {
                    estado: 'ABIERTA',
                    ...(hasServicioFiltroNoConformidades && {
                        servicio: servicioFiltroNoConformidades,
                    }),
                },
                select: {
                    checklistTipo: true,
                    seccion: true,
                    itemNombre: true,
                    servicioId: true,
                    createdAt: true,
                    servicio: {
                        select: {
                            codigo: true,
                            fechaAsignacion: true,
                            checklistEquipo: {
                                select: {
                                    patente: true,
                                },
                            },
                            checklistTractoCamion: {
                                select: {
                                    patente: true,
                                },
                            },
                        },
                    },
                },
            }),
            // 14. CUMPLIMIENTO DE OPERARIOS
            prisma.user.findMany({
                where: {
                    rol: 'operario',
                    serviciosAsignados: {
                        some: {
                            estado: { in: ['PENDIENTE_APROBACION', 'APROBADO', 'EN_EJECUCION', 'COMPLETADO'] },
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    serviciosAsignados: {
                        where: {
                            estado: { in: ['PENDIENTE_APROBACION', 'APROBADO', 'EN_EJECUCION', 'COMPLETADO'] },
                            ...(hasDateFilter && { createdAt: servicioDateWhere }),
                            ...servicioEmpresaWhere,
                        },
                        include: {
                            checklistEquipo: true,
                            checklistTractoCamion: true,
                            checklistFatiga: true,
                            analisisRiesgo: true,
                        },
                        orderBy: { updatedAt: 'desc' },
                        take: 1,
                    },
                },
            }),
        ]));

        // --- Cálculos derivados ---

        const estadosMap = serviciosPorEstadoRaw.reduce((acc, item) => {
            acc[item.estado] = item._count;
            return acc;
        }, {} as Record<string, number>);

        const porcentajeRiesgosControlados = totalAnalisisRiesgo > 0
            ? Math.round((analisisRiesgoControlado / totalAnalisisRiesgo) * 100) : 0;

        const totalChecklistEquipo = checklistsEquipoKpi.length;
        const equiposConProblemas = checklistsEquipoKpi.filter((checklist) =>
            hasChecklistNoCritico('SEMIREMOLQUE', checklist.items as Record<string, Record<string, unknown>>)
        ).length;
        const equiposEnCondiciones = totalChecklistEquipo - equiposConProblemas;

        const totalChecklistTracto = checklistsTractoKpi.length;
        const tractosConProblemas = checklistsTractoKpi.filter((checklist) =>
            hasChecklistNoCritico('TRACTO_CAMION', checklist.items as Record<string, Record<string, unknown>>)
        ).length;
        const tractosEnCondiciones = totalChecklistTracto - tractosConProblemas;

        const equiposConProblemasEnCompletados = checklistsEquipoCompletadosKpi.filter((checklist) =>
            hasChecklistNoCritico('SEMIREMOLQUE', checklist.items as Record<string, Record<string, unknown>>)
        ).length;

        const totalChecklistsEquipos = totalChecklistEquipo + totalChecklistTracto;
        const totalEquiposEnCondiciones = equiposEnCondiciones + tractosEnCondiciones;
        const porcentajeEquiposOk = totalChecklistsEquipos > 0
            ? Math.round((totalEquiposEnCondiciones / totalChecklistsEquipos) * 100) : 0;

        const porcentajeConductoresAptos = totalChecklistFatiga > 0
            ? Math.round(((totalChecklistFatiga - conductoresNoAptos) / totalChecklistFatiga) * 100) : 0;

        const tasaAprobacion = totalAprobaciones > 0
            ? Math.round((aprobacionesOk / totalAprobaciones) * 100) : 0;

        const tasaAceptacionOperarios = totalAsignados > 0
            ? Math.round((serviciosAceptados / totalAsignados) * 100) : 0;
        const sinRespuesta = serviciosEnEspera;

        // 7. Tiempo promedio de ciclo
        let tiempoPromedioCiclo = 0;
        if (serviciosConTiempos.length > 0) {
            const tiempos = serviciosConTiempos
                .filter(s => s.fechaFinalizacion !== null)
                .map(s => (new Date(s.fechaFinalizacion!).getTime() - new Date(s.fechaAsignacion).getTime()) / (1000 * 60 * 60));
            if (tiempos.length > 0) {
                tiempoPromedioCiclo = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
            }
        }

        // 8. Tiempo promedio de aprobación
        let tiempoPromedioAprobacion = 0;
        const aprobacionesValidas = aprobacionesConTiempos.filter(s => s.aprobacion?.fechaAprobacion);
        if (aprobacionesValidas.length > 0) {
            const tiempos = aprobacionesValidas.map(s =>
                (new Date(s.aprobacion!.fechaAprobacion).getTime() - new Date(s.updatedAt).getTime()) / (1000 * 60)
            );
            tiempoPromedioAprobacion = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
        }

        // 12. TENDENCIA — queries del loop en paralelo (aritmética pura en ms, sin setDate/setHours)
        const msPerDay = 24 * 60 * 60 * 1000;
        const countCompletadosPorDia = async (dias: Date[]) => withDbRetry('conteo de tendencia diaria', async () => {
            const counts: number[] = [];
            const batchSize = 7;

            for (let i = 0; i < dias.length; i += batchSize) {
                const batch = dias.slice(i, i + batchSize);
                const batchCounts = await Promise.all(batch.map(dia =>
                    prisma.servicio.count({
                        where: {
                            estado: 'COMPLETADO',
                            fechaFinalizacion: { gte: dia, lt: new Date(dia.getTime() + msPerDay) },
                            ...servicioEmpresaWhere,
                        },
                    })
                ));
                counts.push(...batchCounts);
            }

            return counts;
        });

        let serviciosPorDia: { fecha: string; completados: number }[] = [];
        if (hasDateFilter && fechaInicioDate && fechaFinDate) {
            const daysInRange = Math.min(
                Math.round((fechaFinDate.getTime() - fechaInicioDate.getTime()) / msPerDay) + 1, 31
            );
            const dias = Array.from({ length: daysInRange }, (_, i) =>
                new Date(fechaInicioDate.getTime() + i * msPerDay)
            );
            const counts = await countCompletadosPorDia(dias);
            serviciosPorDia = dias.map((dia, i) => ({
                fecha: dia.toLocaleDateString('es-ES', { timeZone: 'America/Santiago', weekday: 'short', day: 'numeric' }),
                completados: counts[i],
            }));
        } else {
            const dias = Array.from({ length: 7 }, (_, i) =>
                new Date(startOfToday.getTime() - (6 - i) * msPerDay)
            );
            const counts = await countCompletadosPorDia(dias);
            serviciosPorDia = dias.map((dia, i) => ({
                fecha: dia.toLocaleDateString('es-ES', { timeZone: 'America/Santiago', weekday: 'short', day: 'numeric' }),
                completados: counts[i],
            }));
        }

        // 14. Cumplimiento de operarios
        const cumplimientoOperarios = operariosConCumplimiento
            .filter(op => op.serviciosAsignados.length > 0)
            .map(operario => {
                const servicio = operario.serviciosAsignados[0];
                const checklistEquipoOk =
                    !!servicio.checklistEquipo?.completado &&
                    !hasChecklistNoCritico(
                        'SEMIREMOLQUE',
                        servicio.checklistEquipo?.items as Record<string, Record<string, unknown>>,
                    );
                const checklistTractoOk =
                    !!servicio.checklistTractoCamion?.completado &&
                    !hasChecklistNoCritico(
                        'TRACTO_CAMION',
                        servicio.checklistTractoCamion?.items as Record<string, Record<string, unknown>>,
                    );
                const equipoOk = checklistEquipoOk || checklistTractoOk;
                const fatigaOk =
                    servicio.checklistFatiga?.completado &&
                    servicio.checklistFatiga?.aptoParaTrabajar === true;
                const riesgosOk =
                    servicio.analisisRiesgo?.completado &&
                    servicio.analisisRiesgo?.riesgosControlados === true;
                const problemas: string[] = [];
                if (!equipoOk) problemas.push('Equipo con NC');
                if (!fatigaOk) problemas.push('Conductor no apto');
                if (!riesgosOk) problemas.push('Riesgos no controlados');
                const enCumplimiento = equipoOk && fatigaOk && riesgosOk;
                return {
                    id: operario.id,
                    nombre: operario.name || operario.username,
                    servicioId: servicio.id,
                    estadoServicio: servicio.estado,
                    enCumplimiento,
                    checklistsCompletados: { equipo: equipoOk, fatiga: fatigaOk, riesgos: riesgosOk },
                    problemas,
                    ultimaActualizacion: servicio.updatedAt,
                };
            });

        const enCumplimiento = cumplimientoOperarios.filter(op => op.enCumplimiento);
        const enIncumplimiento = cumplimientoOperarios.filter(op => !op.enCumplimiento);

        // 16. No Conformidades
        const ncMap = new Map<string, {
            categoria: string;
            item: string;
            frecuencia: number;
            tipo: 'equipo' | 'tracto';
            serviciosAfectados: Set<number>;
            aparicionesPorPatente: Map<string, number>;
            ultimaDeteccion: Date;
        }>();
        const ncPorServicioMap = new Map<number, {
            servicioId: number;
            servicioCodigo: string;
            totalNC: number;
            ncEquipo: number;
            ncTracto: number;
        }>();

        noConformidadesAbiertas.forEach((noConformidad) => {
            const checklistTipo = noConformidad.checklistTipo as 'TRACTO_CAMION' | 'SEMIREMOLQUE';
            if (!isChecklistItemCritico(checklistTipo, noConformidad.itemNombre)) {
                return;
            }

            const tipo = noConformidad.checklistTipo === 'SEMIREMOLQUE' ? 'equipo' : 'tracto';
            const categoria = noConformidad.seccion;
            const item = noConformidad.itemNombre;
            const key = `${categoria}::${item}::${tipo}`;
            const fechaDeteccion = noConformidad.servicio.fechaAsignacion || noConformidad.createdAt;
            const patente = tipo === 'equipo'
                ? noConformidad.servicio.checklistEquipo?.patente
                : noConformidad.servicio.checklistTractoCamion?.patente;

            const existing = ncMap.get(key);
            if (existing) {
                existing.frecuencia += 1;
                existing.serviciosAfectados.add(noConformidad.servicioId);
                if (patente) {
                    const currentCount = existing.aparicionesPorPatente.get(patente) || 0;
                    existing.aparicionesPorPatente.set(patente, currentCount + 1);
                }
                if (fechaDeteccion > existing.ultimaDeteccion) {
                    existing.ultimaDeteccion = fechaDeteccion;
                }
            } else {
                const aparicionesPorPatente = new Map<string, number>();
                if (patente) {
                    aparicionesPorPatente.set(patente, 1);
                }

                ncMap.set(key, {
                    categoria,
                    item,
                    frecuencia: 1,
                    tipo,
                    serviciosAfectados: new Set([noConformidad.servicioId]),
                    aparicionesPorPatente,
                    ultimaDeteccion: fechaDeteccion,
                });
            }

            const existingServicio = ncPorServicioMap.get(noConformidad.servicioId);
            if (existingServicio) {
                existingServicio.totalNC += 1;
                if (tipo === 'equipo') existingServicio.ncEquipo += 1;
                if (tipo === 'tracto') existingServicio.ncTracto += 1;
            } else {
                ncPorServicioMap.set(noConformidad.servicioId, {
                    servicioId: noConformidad.servicioId,
                    servicioCodigo: noConformidad.servicio.codigo,
                    totalNC: 1,
                    ncEquipo: tipo === 'equipo' ? 1 : 0,
                    ncTracto: tipo === 'tracto' ? 1 : 0,
                });
            }
        });

        const topNC = Array.from(ncMap.values())
            .map((nc) => {
                const equiposReincidentes = Array.from(nc.aparicionesPorPatente.values())
                    .filter(count => count > 1).length;
                const serviciosAfectados = nc.serviciosAfectados.size;

                return {
                    categoria: nc.categoria,
                    item: nc.item,
                    frecuencia: nc.frecuencia,
                    tipo: nc.tipo,
                    serviciosAfectados,
                    equiposReincidentes,
                    ultimaDeteccion: nc.ultimaDeteccion.toISOString(),
                };
            })
            .sort((a, b) => {
                if (b.serviciosAfectados !== a.serviciosAfectados) return b.serviciosAfectados - a.serviciosAfectados;
                return b.frecuencia - a.frecuencia;
            });

        const totalNC = topNC.reduce((sum, nc) => sum + nc.frecuencia, 0);
        const ncPorServicio = Array.from(ncPorServicioMap.values()).sort((a, b) => b.totalNC - a.totalNC);

        return NextResponse.json({
            serviciosPorEstado: estadosMap,
            serviciosCompletados: {
                hoy: serviciosCompletadosHoy,
                semana: serviciosCompletadosSemana,
                mes: serviciosCompletadosMes,
                mesAnterior: serviciosCompletadosMesAnterior,
                crecimiento: serviciosCompletadosMesAnterior > 0
                    ? Math.round(((serviciosCompletadosMes - serviciosCompletadosMesAnterior) / serviciosCompletadosMesAnterior) * 100)
                    : 0,
            },
            seguridad: {
                porcentajeRiesgosControlados,
                totalAnalisisRiesgo,
                porcentajeEquiposOk,
                totalChecklistEquipo,
                totalChecklistTracto,
                conductoresNoAptos,
                conductoresReemplazo,
                porcentajeConductoresAptos,
                totalChecklistFatiga,
            },
            tiempos: {
                promedioCicloHoras: tiempoPromedioCiclo,
                promedioAprobacionMinutos: tiempoPromedioAprobacion,
                totalServiciosAnalizados: serviciosConTiempos.length,
            },
            aprobaciones: {
                tasaAprobacion,
                totalAprobaciones,
                aprobadas: aprobacionesOk,
                rechazadas: totalAprobaciones - aprobacionesOk,
            },
            aceptacionOperarios: {
                porcentaje: tasaAceptacionOperarios,
                totalAsignados,
                aceptados: serviciosAceptados,
                rechazados: serviciosRechazados,
                sinRespuesta,
            },
            noConformidades: {
                topNC,
                totalNC,
                porServicio: ncPorServicio,
            },
            operarios: operariosProductivos.map(op => ({
                id: op.id,
                nombre: op.name || op.username,
                serviciosCompletados: op._count.serviciosAsignados,
            })),
            alertas: {
                equiposConProblemas,
                equiposConProblemasEnCompletados,
                tractosConProblemas,
                serviciosRechazados,
                serviciosConAtencion,
            },
            tendencia: serviciosPorDia,
            cumplimientoOperarios: {
                enCumplimiento,
                enIncumplimiento,
                total: cumplimientoOperarios.length,
                porcentajeCumplimiento: cumplimientoOperarios.length > 0
                    ? Math.round((enCumplimiento.length / cumplimientoOperarios.length) * 100)
                    : 0,
            },
        });
    } catch (error) {
        const errorCode = getErrorCode(error);
        const errorMessage = getErrorMessage(error);

        console.error('Error al obtener métricas:', {
            code: errorCode,
            message: errorMessage,
            raw: error,
        });

        if (isTransientDatabaseError(error)) {
            return NextResponse.json(
                { error: 'Conexion temporalmente inestable con la base de datos. Intenta nuevamente.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Error al obtener métricas del dashboard' },
            { status: 500 }
        );
    }
}
