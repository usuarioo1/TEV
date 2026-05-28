import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildDateOnlyCompatWhere, getSantiagoDateKey } from '@/lib/date-chile';

export const dynamic = 'force-dynamic';

interface ItemBase {
    asignadoId: number;
    estado: string;
    fechaLimite: Date | null;
}

interface CaminataItem extends ItemBase {
    coordinadorId: number;
}

function getStoredDateKey(date: Date | null | undefined): string | null {
    if (!date) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function classifyItem(item: ItemBase, todayKey: string) {
    if (item.estado === 'COMPLETADA') {
        return 'realizada' as const;
    }

    const limiteKey = getStoredDateKey(item.fechaLimite);
    if (limiteKey && limiteKey < todayKey) {
        return 'atrasada' as const;
    }

    return 'proxima' as const;
}

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const canViewAll =
        session.rol === ROLES.JEFATURAS ||
        session.rol === ROLES.PREVENCIONISTA;

    if (!canViewAll) {
        return NextResponse.json(
            { error: 'No autorizado para ver distribucion global' },
            { status: 403 },
        );
    }

    const { searchParams } = new URL(request.url);
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

    const fechaProgramadaWhereCompat = buildDateOnlyCompatWhere(fechaInicioParam, fechaFinParam);
    const hasFechaProgramadaFilter = !!(fechaProgramadaWhereCompat.gte || fechaProgramadaWhereCompat.lte);
    const fechaProgramadaWhere = hasFechaProgramadaFilter ? fechaProgramadaWhereCompat : undefined;

    const rolesObjetivo = [ROLES.JEFATURAS, ROLES.SUPERVISOR, ROLES.COORDINADOR, ROLES.PREVENCIONISTA];

    const usuarios = await prisma.user.findMany({
        where: { rol: { in: rolesObjetivo } },
        select: {
            id: true,
            name: true,
            username: true,
            rol: true,
        },
        orderBy: [{ name: 'asc' }, { username: 'asc' }],
    });

    if (usuarios.length === 0) {
        return NextResponse.json({ usuarios: [] });
    }

    const userIds = usuarios.map((u) => u.id);
    const todayKey = getSantiagoDateKey(new Date());

    const [caminatasRaw, tareas] = await Promise.all([
        prisma.caminataSeguridad.findMany({
            where: {
                asignadoId: { in: userIds },
                estado: { not: 'CANCELADA' },
                ...(empresaId && { empresaId }),
                ...(fechaProgramadaWhere && { fechaProgramada: fechaProgramadaWhere }),
            },
            select: {
                asignadoId: true,
                coordinadorId: true,
                estado: true,
                fechaLimite: true,
            },
        }),
        prisma.tareaAsignada.findMany({
            where: {
                asignadoId: { in: userIds },
                tipo: { in: ['reporte_peligro', 'tarjeta_stop', 'control_art'] },
                ...(empresaId && { estado: 'COMPLETADA' }),
                ...(fechaProgramadaWhere && { fechaProgramada: fechaProgramadaWhere }),
            },
            select: {
                asignadoId: true,
                estado: true,
                fechaLimite: true,
            },
        }),
    ]);

    const statsByUser = new Map<number, { realizadas: number; proximas: number; atrasadas: number }>();

    // Se excluyen caminatas auto-asignadas para mantener la misma lógica de
    // totalProgramadas usada por /api/dashboard/tabla-actividades.
    const caminatas = (caminatasRaw as CaminataItem[]).filter(
        (c) => c.coordinadorId !== c.asignadoId,
    );

    const ensureStats = (userId: number) => {
        if (!statsByUser.has(userId)) {
            statsByUser.set(userId, { realizadas: 0, proximas: 0, atrasadas: 0 });
        }
        return statsByUser.get(userId)!;
    };

    const applyItem = (item: ItemBase) => {
        const stats = ensureStats(item.asignadoId);
        const state = classifyItem(item, todayKey);
        if (state === 'realizada') {
            stats.realizadas += 1;
        } else if (state === 'atrasada') {
            stats.atrasadas += 1;
        } else {
            stats.proximas += 1;
        }
    };

    caminatas.forEach(applyItem);
    tareas.forEach(applyItem);

    const resultado = usuarios
        .map((u) => {
            const stats = statsByUser.get(u.id) ?? {
                realizadas: 0,
                proximas: 0,
                atrasadas: 0,
            };

            const porRealizar = stats.proximas + stats.atrasadas;
            const total = stats.realizadas + porRealizar;

            return {
                id: u.id,
                name: u.name?.trim() || u.username,
                rol: u.rol,
                realizadas: stats.realizadas,
                porRealizar,
                proximas: stats.proximas,
                atrasadas: stats.atrasadas,
                total,
            };
        })
        .sort((a, b) => {
            if (b.porRealizar !== a.porRealizar) {
                return b.porRealizar - a.porRealizar;
            }
            return b.realizadas - a.realizadas;
        });

    return NextResponse.json({ usuarios: resultado });
}
