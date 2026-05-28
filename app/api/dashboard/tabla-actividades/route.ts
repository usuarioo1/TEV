import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildDateOnlyCompatWhere, getSantiagoDateKey } from '@/lib/date-chile';

export const dynamic = 'force-dynamic';

// ─── helpers ─────────────────────────────────────────────────────────────────

interface ActivityItem {
    estado: string;
    fechaProgramada: Date | null;
    fechaLimite: Date | null;
    fechaCompletacion?: Date | null; // caminatas
    updatedAt?: Date;                // tareas (proxy)
}

interface ActivityDetail {
    id: string;
    tipo: string;
    tarea: string;
    usuario: string;
    estado: 'cumplida' | 'vencida' | 'proxima';
}

function getStoredDateKey(date: Date | null | undefined): string | null {
    if (!date) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCompletionDateKey(date: Date | null | undefined): string | null {
    if (!date) return null;
    // La fecha de realización se evalúa por calendario Chile para evitar
    // marcar fuera de plazo cuando se completa el mismo día local.
    return getSantiagoDateKey(date);
}

function calcStats(items: ActivityItem[], todayKey: string) {
    const totalProgramadas = items.length;

    const completionDate = (i: ActivityItem) =>
        i.fechaCompletacion ?? i.updatedAt ?? null;

    const completadas = items.filter(i => i.estado === 'COMPLETADA');

    const realizadas = completadas.filter(i => {
        const limiteKey = getStoredDateKey(i.fechaLimite);
        if (!limiteKey) return true;
        const fc = completionDate(i);
        const completionKey = getCompletionDateKey(fc);
        return !completionKey || completionKey <= limiteKey;
    }).length;

    const realizadasFueraPlazo = completadas.filter(i => {
        const limiteKey = getStoredDateKey(i.fechaLimite);
        if (!limiteKey) return false;
        const fc = completionDate(i);
        const completionKey = getCompletionDateKey(fc);
        return completionKey != null && completionKey > limiteKey;
    }).length;

    const noCompletadas = items.filter(i => i.estado !== 'COMPLETADA');

    const atrasadas = noCompletadas.filter(
        i => {
            const limiteKey = getStoredDateKey(i.fechaLimite);
            return limiteKey != null && limiteKey < todayKey;
        },
    ).length;

    // Próximas: pendientes que NO están atrasadas (sin fechaLimite vencida)
    const proximas = noCompletadas.filter(
        i => {
            const limiteKey = getStoredDateKey(i.fechaLimite);
            return limiteKey == null || limiteKey >= todayKey;
        },
    ).length;

    const cumplimiento =
        totalProgramadas > 0
            ? Math.round(
                (realizadas / totalProgramadas) * 100,
            )
            : 0;

    return {
        totalProgramadas,
        realizadas,
        realizadasFueraPlazo,
        proximas,
        atrasadas,
        cumplimiento,
    };
}

function buildRow(
    tipo: string,
    nombre: string,
    stats: ReturnType<typeof calcStats>,
    actividadesCumplidas: number,
) {
    const totalActividades = stats.totalProgramadas + actividadesCumplidas;
    const estadoCumplimientoTotal =
        totalActividades > 0
            ? Math.round(
                ((stats.realizadas + actividadesCumplidas) / totalActividades) *
                100,
            )
            : 0;

    return {
        tipo,
        nombre,
        ...stats,
        actividadesRealizadas: null, // placeholder — pendiente de implementar
        actividadesCumplidas,
        totalActividades,
        estadoCumplimientoTotal,
    };
}

function normalizeUserName(user: { name: string | null; username: string } | null | undefined) {
    if (!user) return 'Sin asignar';
    return user.name?.trim() || user.username;
}

function isOverdue(item: { estado: string; fechaLimite: Date | null }, todayKey: string) {
    const limiteKey = getStoredDateKey(item.fechaLimite);
    return item.estado !== 'COMPLETADA' && limiteKey != null && limiteKey < todayKey;
}

type EstadoDisplay = 'en_plazo' | 'fuera_plazo' | 'atrasada' | 'proxima';

function getEstadoDisplayTarea(
    item: { estado: string; fechaLimite: Date | null; updatedAt: Date },
    todayKey: string,
): EstadoDisplay {
    if (item.estado === 'COMPLETADA') {
        const limiteKey = getStoredDateKey(item.fechaLimite);
        if (!limiteKey) return 'en_plazo';
        const completionKey = getCompletionDateKey(item.updatedAt);
        if (!completionKey) return 'en_plazo';
        return completionKey <= limiteKey ? 'en_plazo' : 'fuera_plazo';
    }
    const limiteKey = getStoredDateKey(item.fechaLimite);
    if (limiteKey && limiteKey < todayKey) return 'atrasada';
    return 'proxima';
}

function getEstadoDisplayCaminata(
    item: { estado: string; fechaLimite: Date | null; fechaCompletacion: Date | null },
    todayKey: string,
): EstadoDisplay {
    if (item.estado === 'COMPLETADA') {
        const limiteKey = getStoredDateKey(item.fechaLimite);
        const completionKey = getCompletionDateKey(item.fechaCompletacion);
        if (!limiteKey || !completionKey) return 'en_plazo';
        return completionKey <= limiteKey ? 'en_plazo' : 'fuera_plazo';
    }
    const limiteKey = getStoredDateKey(item.fechaLimite);
    if (limiteKey && limiteKey < todayKey) return 'atrasada';
    return 'proxima';
}

// ─── route ───────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
    const session = await getSession();
    if (!session)
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fechaInicioParam = searchParams.get('fechaInicio');
    const fechaFinParam = searchParams.get('fechaFin');
    const userIdParam = searchParams.get('userId');
    const empresaIdParam = searchParams.get('empresaId');

    let empresaId: number | null = null;
    if (empresaIdParam) {
        const parsedEmpresaId = Number(empresaIdParam);
        if (!Number.isInteger(parsedEmpresaId) || parsedEmpresaId <= 0) {
            return NextResponse.json(
                { error: 'empresaId inválido' },
                { status: 400 },
            );
        }
        empresaId = parsedEmpresaId;
    }

    const canViewAll =
        session.rol === ROLES.JEFATURAS ||
        session.rol === ROLES.PREVENCIONISTA;

    // Seguridad: usuarios normales solo pueden ver sus propios datos
    if (!canViewAll && userIdParam && parseInt(userIdParam) !== session.id) {
        return NextResponse.json(
            { error: 'No autorizado para ver datos de otro usuario' },
            { status: 403 },
        );
    }

    const targetUserId =
        canViewAll && userIdParam ? parseInt(userIdParam) : session.id;

    // Solo se calculan actividades para roles que usan esta tabla
    const rolesPermitidos = [ROLES.SUPERVISOR, ROLES.COORDINADOR, ROLES.JEFATURAS, ROLES.PREVENCIONISTA];

    // Si la vista es propia, verificar que el rol del solicitante esté permitido
    if (!canViewAll && !rolesPermitidos.includes(session.rol as typeof rolesPermitidos[number])) {
        return NextResponse.json({ rows: [], userId: targetUserId });
    }

    // Si se solicita otro usuario, verificar su rol en BD
    if (canViewAll && userIdParam) {
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { rol: true },
        });
        if (!targetUser || !rolesPermitidos.includes(targetUser.rol as typeof rolesPermitidos[number])) {
            return NextResponse.json({ rows: [], userId: targetUserId });
        }
    }

    // Modo "todos": agrega todos los usuarios con roles permitidos
    const allUsersMode = canViewAll && !userIdParam;
    let asignadoFilter: { asignadoId: number | { in: number[] } } = { asignadoId: targetUserId };
    let creadoPorFilter: { creadoPorId: number | { in: number[] } } = { creadoPorId: targetUserId };
    let coordinadorAsignadoFilter: { coordinadorId: number; asignadoId: number } | { coordinadorId: { in: number[] }; asignadoId: { in: number[] } } = { coordinadorId: targetUserId, asignadoId: targetUserId };
    let allModeIds: number[] = [];

    if (allUsersMode) {
        const permittedUsers = await prisma.user.findMany({
            where: { rol: { in: rolesPermitidos } },
            select: { id: true },
        });
        allModeIds = permittedUsers.map(u => u.id);
        asignadoFilter = { asignadoId: { in: allModeIds } };
        creadoPorFilter = { creadoPorId: { in: allModeIds } };
        coordinadorAsignadoFilter = { coordinadorId: { in: allModeIds }, asignadoId: { in: allModeIds } };
    }

    const fechaProgramadaWhereCompat = buildDateOnlyCompatWhere(fechaInicioParam, fechaFinParam);
    const hasFechaProgramadaFilter = !!(fechaProgramadaWhereCompat.gte || fechaProgramadaWhereCompat.lte);

    // createdAt se guarda como timestamp real del servidor (hora local Chile).
    // Sin la 'Z', new Date("YYYY-MM-DDT00:00:00") se interpreta como hora local,
    // cubriendo el día completo en la zona horaria del servidor.
    const createdAtInicio = fechaInicioParam
        ? new Date(fechaInicioParam + 'T00:00:00')
        : null;
    const createdAtFin = fechaFinParam
        ? new Date(fechaFinParam + 'T23:59:59.999')
        : null;

    const todayKey = getSantiagoDateKey(new Date());

    const fechaProgramadaWhere = hasFechaProgramadaFilter ? fechaProgramadaWhereCompat : undefined;

    const createdAtWhere =
        createdAtInicio || createdAtFin
            ? {
                ...(createdAtInicio && { gte: createdAtInicio }),
                ...(createdAtFin && { lte: createdAtFin }),
            }
            : undefined;

    try {
        // ── 1. CAMINATAS DE SEGURIDAD ─────────────────────────────────────
        // Query separada para programadas (filtrar por fechaProgramada) y
        // cumplidas (filtrar por createdAt), porque las auto-asignadas pueden
        // tener fechaProgramada = null y Prisma las excluye del rango.

        // Caminatas formalmente asignadas: filtradas por fechaProgramada
        const caminatasProgramadasDB = await prisma.caminataSeguridad.findMany({
            where: {
                ...asignadoFilter,
                estado: { not: 'CANCELADA' },
                ...(empresaId && { empresaId }),
                ...(fechaProgramadaWhere && {
                    fechaProgramada: fechaProgramadaWhere,
                }),
            },
            select: {
                id: true,
                actividad: true,
                coordinadorId: true,
                asignadoId: true,
                estado: true,
                fechaProgramada: true,
                fechaLimite: true,
                fechaCompletacion: true,
                asignado: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        // Solo caminatas formalmente asignadas (coordinador ≠ asignado)
        const caminatasProgramadas = caminatasProgramadasDB.filter(
            c => c.coordinadorId !== c.asignadoId,
        );

        const caminataStats = calcStats(caminatasProgramadas, todayKey);

        const detalleCaminatasCumplidas: ActivityDetail[] = caminatasProgramadas
            .filter(c => c.estado === 'COMPLETADA')
            .map(c => ({
                id: `caminata-${c.id}`,
                tipo: 'caminata',
                tarea: c.actividad || `Caminata #${c.id}`,
                usuario: normalizeUserName(c.asignado),
                estado: 'cumplida',
            }));

        const detalleCaminatasVencidas: ActivityDetail[] = caminatasProgramadas
            .filter(c => isOverdue(c, todayKey))
            .map(c => ({
                id: `caminata-${c.id}`,
                tipo: 'caminata',
                tarea: c.actividad || `Caminata #${c.id}`,
                usuario: normalizeUserName(c.asignado),
                estado: 'vencida',
            }));

        const detalleCaminatasProximas: ActivityDetail[] = caminatasProgramadas
            .filter(c => c.estado !== 'COMPLETADA' && !isOverdue(c, todayKey))
            .map(c => ({
                id: `caminata-${c.id}`,
                tipo: 'caminata',
                tarea: c.actividad || `Caminata #${c.id}`,
                usuario: normalizeUserName(c.asignado),
                estado: 'proxima',
            }));

        // Actividades cumplidas = caminatas auto-asignadas (coordinador = asignado)
        // Se filtran por createdAt para incluir caminatas espontáneas sin fechaProgramada
        const caminatasCumplidasDB = await prisma.caminataSeguridad.findMany({
            where: {
                ...asignadoFilter,
                estado: { not: 'CANCELADA' },
                ...(empresaId && { empresaId }),
                ...(createdAtWhere && {
                    createdAt: createdAtWhere,
                }),
            },
            select: {
                id: true,
                coordinadorId: true,
                asignadoId: true,
                actividad: true,
                estado: true,
                createdAt: true,
                coordinador: { select: { name: true, username: true } },
            },
        });

        const caminatasNoProgramadas = caminatasCumplidasDB.filter(
            c => c.coordinadorId === c.asignadoId,
        );
        const caminatasCumplidas = caminatasNoProgramadas.length;

        // ── 2. REPORTE DE PELIGRO ─────────────────────────────────────────
        const tareasReporte = await prisma.tareaAsignada.findMany({
            where: {
                ...asignadoFilter,
                tipo: 'reporte_peligro',
                ...(fechaProgramadaWhere && {
                    fechaProgramada: fechaProgramadaWhere,
                }),
            },
            select: {
                id: true,
                tipo: true,
                descripcion: true,
                estado: true,
                fechaProgramada: true,
                fechaLimite: true,
                createdAt: true,
                updatedAt: true,
                asignadoId: true,
                creadoPorId: true,
                asignado: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        let tareasReporteParaVista = tareasReporte;

        let reporteStats = calcStats(tareasReporteParaVista, todayKey);

        let detalleReportesCumplidos: ActivityDetail[] = tareasReporteParaVista
            .filter(t => t.estado === 'COMPLETADA')
            .map(t => ({
                id: `reporte-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Reporte de peligro #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'cumplida',
            }));

        let detalleReportesVencidos: ActivityDetail[] = tareasReporteParaVista
            .filter(t => isOverdue(t, todayKey))
            .map(t => ({
                id: `reporte-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Reporte de peligro #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'vencida',
            }));

        let detalleReportesProximos: ActivityDetail[] = tareasReporteParaVista
            .filter(t => t.estado !== 'COMPLETADA' && !isOverdue(t, todayKey))
            .map(t => ({
                id: `reporte-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Reporte de peligro #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'proxima',
            }));

        // Actividades registradas (incluye independientes y dentro de caminatas)
        const reportesNoProgWhere: any = {
            OR: allUsersMode
                ? [creadoPorFilter, { responsableCierreId: (asignadoFilter as any).asignadoId }]
                : [{ creadoPorId: targetUserId }, { responsableCierreId: targetUserId }],
            ...(createdAtWhere && { createdAt: createdAtWhere }),
        };

        if (empresaId) {
            reportesNoProgWhere.AND = [
                {
                    OR: [
                        { datos: { path: ['empresaId'], equals: empresaId } },
                        { caminata: { is: { empresaId } } },
                    ],
                },
            ];
        }

        const reportesNoProg = await prisma.reportePeligro.findMany({
            where: reportesNoProgWhere,
            select: {
                id: true,
                caminataId: true,
                estado: true,
                createdAt: true,
                creadoPor: { select: { name: true, username: true } },
            },
        });
        let reportesCumplidos = reportesNoProg.length;

        // ── 3. TARJETA ALTO STOP ──────────────────────────────────────────
        const tareasTarjeta = await prisma.tareaAsignada.findMany({
            where: {
                ...asignadoFilter,
                tipo: 'tarjeta_stop',
                ...(fechaProgramadaWhere && {
                    fechaProgramada: fechaProgramadaWhere,
                }),
            },
            select: {
                id: true,
                tipo: true,
                descripcion: true,
                estado: true,
                fechaProgramada: true,
                fechaLimite: true,
                createdAt: true,
                updatedAt: true,
                asignadoId: true,
                creadoPorId: true,
                asignado: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        let tareasTarjetaParaVista = tareasTarjeta;

        let tarjetaStats = calcStats(tareasTarjetaParaVista, todayKey);

        let detalleTarjetasCumplidas: ActivityDetail[] = tareasTarjetaParaVista
            .filter(t => t.estado === 'COMPLETADA')
            .map(t => ({
                id: `tarjeta-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Tarjeta Stop #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'cumplida',
            }));

        let detalleTarjetasVencidas: ActivityDetail[] = tareasTarjetaParaVista
            .filter(t => isOverdue(t, todayKey))
            .map(t => ({
                id: `tarjeta-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Tarjeta Stop #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'vencida',
            }));

        let detalleTarjetasProximas: ActivityDetail[] = tareasTarjetaParaVista
            .filter(t => t.estado !== 'COMPLETADA' && !isOverdue(t, todayKey))
            .map(t => ({
                id: `tarjeta-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Tarjeta Stop #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'proxima',
            }));

        const tarjetasNoProgWhere: any = {
            OR: allUsersMode
                ? [creadoPorFilter, { responsableCierreId: (asignadoFilter as any).asignadoId }]
                : [{ creadoPorId: targetUserId }, { responsableCierreId: targetUserId }],
            ...(createdAtWhere && { createdAt: createdAtWhere }),
        };

        if (empresaId) {
            tarjetasNoProgWhere.AND = [
                {
                    OR: [
                        { datos: { path: ['empresaId'], equals: empresaId } },
                        { caminata: { is: { empresaId } } },
                    ],
                },
            ];
        }

        const tarjetasNoProg = await prisma.tarjetaStop.findMany({
            where: tarjetasNoProgWhere,
            select: {
                id: true,
                caminataId: true,
                estado: true,
                createdAt: true,
                creadoPor: { select: { name: true, username: true } },
            },
        });
        let tarjetasCumplidas = tarjetasNoProg.length;

        // ── 4. CONTROL DE CALIDAD ART ─────────────────────────────────────
        const tareasControl = await prisma.tareaAsignada.findMany({
            where: {
                ...asignadoFilter,
                tipo: 'control_art',
                ...(fechaProgramadaWhere && {
                    fechaProgramada: fechaProgramadaWhere,
                }),
            },
            select: {
                id: true,
                tipo: true,
                descripcion: true,
                estado: true,
                fechaProgramada: true,
                fechaLimite: true,
                createdAt: true,
                updatedAt: true,
                asignadoId: true,
                creadoPorId: true,
                asignado: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        let tareasControlParaVista = tareasControl;

        let controlStats = calcStats(tareasControlParaVista, todayKey);

        let detalleControlesCumplidos: ActivityDetail[] = tareasControlParaVista
            .filter(t => t.estado === 'COMPLETADA')
            .map(t => ({
                id: `control-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Control ART #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'cumplida',
            }));

        let detalleControlesVencidos: ActivityDetail[] = tareasControlParaVista
            .filter(t => isOverdue(t, todayKey))
            .map(t => ({
                id: `control-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Control ART #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'vencida',
            }));

        let detalleControlesProximos: ActivityDetail[] = tareasControlParaVista
            .filter(t => t.estado !== 'COMPLETADA' && !isOverdue(t, todayKey))
            .map(t => ({
                id: `control-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Control ART #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'proxima',
            }));

        const controlesNoProgWhere: any = {
            caminataId: null,
            ...creadoPorFilter,
            ...(createdAtWhere && { createdAt: createdAtWhere }),
        };

        if (empresaId) {
            controlesNoProgWhere.AND = [
                {
                    OR: [
                        { datos: { path: ['empresaId'], equals: empresaId } },
                        { caminata: { is: { empresaId } } },
                    ],
                },
            ];
        }

        const controlesNoProg = await prisma.controlCalidadART.findMany({
            where: controlesNoProgWhere,
            select: {
                id: true,
                createdAt: true,
                creadoPor: { select: { name: true, username: true } },
            },
        });
        let controlesCumplidos = controlesNoProg.length;

        // ── Lookup de registros reales para tareas COMPLETADAS (programadas) ──
        // TareaAsignada no tiene FK al registro real; buscamos por asignadoId + fecha
        // para poder mostrar el enlace "Ver →" en las completadas (en plazo o fuera de plazo).
        type RecordRef = { id: number; createdAt: Date };
        type UserRecordMap = Map<number, RecordRef[]>;

        function buildLookupMap(records: Array<{ id: number; creadoPorId: number; createdAt: Date }>): UserRecordMap {
            const map: UserRecordMap = new Map();
            for (const r of records) {
                const list = map.get(r.creadoPorId) ?? [];
                list.push({ id: r.id, createdAt: r.createdAt });
                map.set(r.creadoPorId, list);
            }
            return map;
        }

        /** Para una tarea COMPLETADA, devuelve el registro real más cercano (por fecha de creación). */
        function findBestMatch(userId: number, taskCreatedAt: Date, taskUpdatedAt: Date, map: UserRecordMap): number | null {
            const candidates = map.get(userId) ?? [];
            // Solo registros creados DESPUÉS de que se creó la tarea
            const filtered = candidates.filter(r => r.createdAt >= taskCreatedAt);
            if (filtered.length === 0) return null;
            // El más cercano al momento en que la tarea fue marcada completada (updatedAt)
            filtered.sort((a, b) =>
                Math.abs(a.createdAt.getTime() - taskUpdatedAt.getTime()) -
                Math.abs(b.createdAt.getTime() - taskUpdatedAt.getTime())
            );
            return filtered[0].id;
        }

        // Batch queries en paralelo para las 3 tablas
        const completadasReporte = tareasReporte.filter(t => t.estado === 'COMPLETADA');
        const completadasTarjeta = tareasTarjeta.filter(t => t.estado === 'COMPLETADA');
        const completadasControl = tareasControl.filter(t => t.estado === 'COMPLETADA');

        // IMPORTANTE: cuando el formulario se completa desde una tarea asignada,
        // el registro real tiene creadoPorId = tarea.creadoPorId (el creador de la tarea,
        // el supervisor/prevencionista), NO asignadoId (el operario que la ejecuta).
        const [reportesProg, tarjetasProg, controlesProg] = await Promise.all([
            completadasReporte.length === 0 ? [] : prisma.reportePeligro.findMany({
                where: {
                    caminataId: null,
                    creadoPorId: { in: [...new Set(completadasReporte.map(t => t.creadoPorId))] },
                    ...(empresaId && { datos: { path: ['empresaId'], equals: empresaId } }),
                    createdAt: { gte: completadasReporte.reduce((m, t) => t.createdAt < m ? t.createdAt : m, completadasReporte[0].createdAt) },
                },
                select: { id: true, creadoPorId: true, createdAt: true },
            }),
            completadasTarjeta.length === 0 ? [] : prisma.tarjetaStop.findMany({
                where: {
                    caminataId: null,
                    creadoPorId: { in: [...new Set(completadasTarjeta.map(t => t.creadoPorId))] },
                    ...(empresaId && { datos: { path: ['empresaId'], equals: empresaId } }),
                    createdAt: { gte: completadasTarjeta.reduce((m, t) => t.createdAt < m ? t.createdAt : m, completadasTarjeta[0].createdAt) },
                },
                select: { id: true, creadoPorId: true, createdAt: true },
            }),
            completadasControl.length === 0 ? [] : prisma.controlCalidadART.findMany({
                where: {
                    caminataId: null,
                    creadoPorId: { in: [...new Set(completadasControl.map(t => t.creadoPorId))] },
                    ...(empresaId && { datos: { path: ['empresaId'], equals: empresaId } }),
                    createdAt: { gte: completadasControl.reduce((m, t) => t.createdAt < m ? t.createdAt : m, completadasControl[0].createdAt) },
                },
                select: { id: true, creadoPorId: true, createdAt: true },
            }),
        ]);

        const reportesProgMap = buildLookupMap(reportesProg as Array<{ id: number; creadoPorId: number; createdAt: Date }>);
        const tarjetasProgMap = buildLookupMap(tarjetasProg as Array<{ id: number; creadoPorId: number; createdAt: Date }>);
        const controlesProgMap = buildLookupMap(controlesProg as Array<{ id: number; creadoPorId: number; createdAt: Date }>);

        // Evita duplicar reportes: si un Reporte de Peligro ya fue emparejado
        // con una tarea programada COMPLETADA, no debe aparecer como "no programada".
        const reporteMatchByTaskId = new Map<number, number>();
        const matchedReporteIds = new Set<number>();

        for (const t of completadasReporte) {
            const matchId = findBestMatch(t.creadoPorId, t.createdAt, t.updatedAt, reportesProgMap);
            if (matchId) {
                reporteMatchByTaskId.set(t.id, matchId);
                matchedReporteIds.add(matchId);
            }
        }

        const reportesNoProgFiltrados = reportesNoProg.filter(r => !matchedReporteIds.has(r.id));
        reportesCumplidos = reportesNoProgFiltrados.length;

        if (empresaId) {
            tareasReporteParaVista = tareasReporte.filter(
                (t) => t.estado === 'COMPLETADA' && reporteMatchByTaskId.has(t.id),
            );
            reporteStats = calcStats(tareasReporteParaVista, todayKey);
            detalleReportesCumplidos = tareasReporteParaVista.map(t => ({
                id: `reporte-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Reporte de peligro #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'cumplida',
            }));
            detalleReportesVencidos = [];
            detalleReportesProximos = [];
        }

        // Evita duplicar tarjetas: si una Tarjeta Alto Stop ya fue emparejada
        // con una tarea programada COMPLETADA, no debe aparecer como "no programada".
        const tarjetaMatchByTaskId = new Map<number, number>();
        const matchedTarjetaIds = new Set<number>();

        for (const t of completadasTarjeta) {
            const matchId = findBestMatch(t.creadoPorId, t.createdAt, t.updatedAt, tarjetasProgMap);
            if (matchId) {
                tarjetaMatchByTaskId.set(t.id, matchId);
                matchedTarjetaIds.add(matchId);
            }
        }

        const tarjetasNoProgFiltradas = tarjetasNoProg.filter(t => !matchedTarjetaIds.has(t.id));
        tarjetasCumplidas = tarjetasNoProgFiltradas.length;

        if (empresaId) {
            tareasTarjetaParaVista = tareasTarjeta.filter(
                (t) => t.estado === 'COMPLETADA' && tarjetaMatchByTaskId.has(t.id),
            );
            tarjetaStats = calcStats(tareasTarjetaParaVista, todayKey);
            detalleTarjetasCumplidas = tareasTarjetaParaVista.map(t => ({
                id: `tarjeta-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Tarjeta Stop #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'cumplida',
            }));
            detalleTarjetasVencidas = [];
            detalleTarjetasProximas = [];
        }

        // Evita duplicar controles: si un Control ART ya fue emparejado con una
        // tarea programada COMPLETADA, no debe aparecer también como "no programada".
        const controlMatchByTaskId = new Map<number, number>();
        const matchedControlIds = new Set<number>();

        for (const t of completadasControl) {
            const matchId = findBestMatch(t.creadoPorId, t.createdAt, t.updatedAt, controlesProgMap);
            if (matchId) {
                controlMatchByTaskId.set(t.id, matchId);
                matchedControlIds.add(matchId);
            }
        }

        const controlesNoProgFiltrados = controlesNoProg.filter(c => !matchedControlIds.has(c.id));
        controlesCumplidos = controlesNoProgFiltrados.length;

        if (empresaId) {
            tareasControlParaVista = tareasControl.filter(
                (t) => t.estado === 'COMPLETADA' && controlMatchByTaskId.has(t.id),
            );
            controlStats = calcStats(tareasControlParaVista, todayKey);
            detalleControlesCumplidos = tareasControlParaVista.map(t => ({
                id: `control-${t.id}`,
                tipo: t.tipo,
                tarea: t.descripcion?.trim() || `Control ART #${t.id}`,
                usuario: normalizeUserName(t.asignado),
                estado: 'cumplida',
            }));
            detalleControlesVencidos = [];
            detalleControlesProximos = [];
        }

        // Detalles por tipo para historial expandible ────────────────────
        const detallePorTipo = {
            caminata: {
                programadas: caminatasProgramadas.map(c => ({
                    id: c.id,
                    descripcion: c.actividad || `Caminata #${c.id}`,
                    usuario: normalizeUserName(c.asignado),
                    fechaProgramada: c.fechaProgramada,
                    fechaLimite: c.fechaLimite,
                    estadoDisplay: getEstadoDisplayCaminata(c, todayKey),
                    urlDetalle: `/caminatas/${c.id}`,
                })),
                noProgramadas: caminatasNoProgramadas.map(c => ({
                    id: c.id,
                    descripcion: c.actividad || `Caminata #${c.id}`,
                    usuario: normalizeUserName(c.coordinador),
                    fecha: c.createdAt,
                    estado: c.estado as string,
                    urlDetalle: `/caminatas/${c.id}`,
                })),
            },
            reporte_peligro: {
                programadas: tareasReporteParaVista.map(t => {
                    let urlDetalle: string | null = null;
                    if (t.estado === 'COMPLETADA') {
                        const matchId = reporteMatchByTaskId.get(t.id) ?? null;
                        if (matchId) urlDetalle = `/dashboard/alertas/reporte-peligro/${matchId}`;
                    }
                    return {
                        id: t.id,
                        descripcion: t.descripcion?.trim() || `Reporte de Peligro #${t.id}`,
                        usuario: normalizeUserName(t.asignado),
                        fechaProgramada: t.fechaProgramada,
                        fechaLimite: t.fechaLimite,
                        estadoDisplay: getEstadoDisplayTarea(t, todayKey),
                        urlDetalle,
                    };
                }),
                noProgramadas: reportesNoProgFiltrados.map(r => ({
                    id: r.id,
                    descripcion: r.caminataId
                        ? `Reporte de Peligro #${r.id} (desde caminata)`
                        : `Reporte de Peligro #${r.id}`,
                    usuario: r.creadoPor.name || r.creadoPor.username,
                    fecha: r.createdAt,
                    estado: r.estado,
                    urlDetalle: `/dashboard/alertas/reporte-peligro/${r.id}`,
                })),
            },
            tarjeta_stop: {
                programadas: tareasTarjetaParaVista.map(t => {
                    let urlDetalle: string | null = null;
                    if (t.estado === 'COMPLETADA') {
                        const matchId = tarjetaMatchByTaskId.get(t.id) ?? null;
                        if (matchId) urlDetalle = `/dashboard/alertas/tarjeta-stop/${matchId}`;
                    }
                    return {
                        id: t.id,
                        descripcion: t.descripcion?.trim() || `Tarjeta Stop #${t.id}`,
                        usuario: normalizeUserName(t.asignado),
                        fechaProgramada: t.fechaProgramada,
                        fechaLimite: t.fechaLimite,
                        estadoDisplay: getEstadoDisplayTarea(t, todayKey),
                        urlDetalle,
                    };
                }),
                noProgramadas: tarjetasNoProgFiltradas.map(t => ({
                    id: t.id,
                    descripcion: t.caminataId
                        ? `Tarjeta Stop #${t.id} (desde caminata)`
                        : `Tarjeta Stop #${t.id}`,
                    usuario: t.creadoPor.name || t.creadoPor.username,
                    fecha: t.createdAt,
                    estado: t.estado,
                    urlDetalle: `/dashboard/alertas/tarjeta-stop/${t.id}`,
                })),
            },
            control_art: {
                programadas: tareasControlParaVista.map(t => {
                    let urlDetalle: string | null = null;
                    if (t.estado === 'COMPLETADA') {
                        const matchId = controlMatchByTaskId.get(t.id) ?? null;
                        if (matchId) urlDetalle = `/dashboard/alertas/control-art/${matchId}`;
                    }
                    return {
                        id: t.id,
                        descripcion: t.descripcion?.trim() || `Control ART #${t.id}`,
                        usuario: normalizeUserName(t.asignado),
                        fechaProgramada: t.fechaProgramada,
                        fechaLimite: t.fechaLimite,
                        estadoDisplay: getEstadoDisplayTarea(t, todayKey),
                        urlDetalle,
                    };
                }),
                noProgramadas: controlesNoProgFiltrados.map(c => ({
                    id: c.id,
                    descripcion: `Control ART #${c.id}`,
                    usuario: c.creadoPor.name || c.creadoPor.username,
                    fecha: c.createdAt,
                    estado: 'COMPLETADO',
                    urlDetalle: `/dashboard/alertas/control-art/${c.id}`,
                })),
            },
        };

        // ── CONSTRUIR RESPUESTA ───────────────────────────────────────────
        const rows = [
            buildRow('caminata', 'Caminatas de Seguridad', caminataStats, caminatasCumplidas),
            buildRow('reporte_peligro', 'Reporte de Peligro', reporteStats, reportesCumplidos),
            buildRow('tarjeta_stop', 'Tarjeta Alto Stop', tarjetaStats, tarjetasCumplidas),
            buildRow('control_art', 'Control de Calidad ART', controlStats, controlesCumplidos),
        ].filter((row) => !empresaId || row.totalActividades > 0);

        const detalles = {
            cumplidas: [
                ...detalleCaminatasCumplidas,
                ...detalleReportesCumplidos,
                ...detalleTarjetasCumplidas,
                ...detalleControlesCumplidos,
            ],
            vencidas: [
                ...detalleCaminatasVencidas,
                ...detalleCaminatasProximas,
                ...detalleReportesVencidos,
                ...detalleReportesProximos,
                ...detalleTarjetasVencidas,
                ...detalleTarjetasProximas,
                ...detalleControlesVencidos,
                ...detalleControlesProximos,
            ],
        };

        return NextResponse.json({ rows, detallePorTipo, detalles, userId: allUsersMode ? null : targetUserId });
    } catch (error) {
        console.error('Error al obtener tabla de actividades:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 },
        );
    }
}
