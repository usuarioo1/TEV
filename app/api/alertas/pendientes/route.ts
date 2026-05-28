import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DB_RETRY_MAX_ATTEMPTS = 2;
const DB_RETRY_BASE_DELAY_MS = 250;

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
    if (code === 'P1001' || code === 'P2024' || code === 'ETIMEDOUT') {
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
        'etimedout',
    ].some((pattern) => msg.includes(pattern));
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
            console.warn(`[alertas/pendientes] ${label} fallo intento ${attempt}. Reintentando en ${waitMs}ms.`);
            await delay(waitMs);
        }
    }

    throw lastError;
}

// GET - Obtener reportes y tarjetas pendientes del usuario actual
export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        console.log('🔍 Buscando alertas para usuario:', session.id, 'rol:', session.rol);
        const usuarioSelect = {
            id: true,
            name: true,
            username: true,
            rol: true,
        };

        const caminataSelect = {
            id: true,
            codigo: true,
            zona: true,
        };

        const [
            reportesPendientes,
            tarjetasPendientes,
            reportesCerrados,
            tarjetasCerradas,
            reportesPendientesVerificacion,
            artsPendientes,
        ] = await withDbRetry('consultar alertas del usuario', () => Promise.all([
            // Obtener reportes de peligro pendientes donde el usuario es responsable de cierre
            prisma.reportePeligro.findMany({
                where: {
                    responsableCierreId: session.id,
                    estado: 'PENDIENTE',
                },
                include: {
                    creadoPor: { select: usuarioSelect },
                    responsableCierre: { select: usuarioSelect },
                    caminata: { select: caminataSelect },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            // Obtener tarjetas stop pendientes donde el usuario es responsable de cierre
            prisma.tarjetaStop.findMany({
                where: {
                    responsableCierreId: session.id,
                    estado: 'PENDIENTE',
                },
                include: {
                    creadoPor: { select: usuarioSelect },
                    responsableCierre: { select: usuarioSelect },
                    caminata: { select: caminataSelect },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            // Obtener reportes de peligro cerrados relacionados con el usuario (como creador, responsable de cierre o de verificación)
            prisma.reportePeligro.findMany({
                where: {
                    estado: 'CERRADO',
                    OR: [
                        { creadoPorId: session.id },
                        { responsableCierreId: session.id },
                        { responsableVerificacionId: session.id },
                    ],
                },
                include: {
                    creadoPor: { select: usuarioSelect },
                    responsableCierre: { select: usuarioSelect },
                    responsableVerificacion: { select: usuarioSelect },
                    caminata: { select: caminataSelect },
                },
                orderBy: {
                    fechaVerificacion: 'desc',
                },
                take: 20,
            }),
            // Obtener tarjetas stop cerradas relacionadas con el usuario (como creador o responsable de cierre)
            prisma.tarjetaStop.findMany({
                where: {
                    estado: 'CERRADO',
                    OR: [
                        { creadoPorId: session.id },
                        { responsableCierreId: session.id },
                    ],
                },
                include: {
                    creadoPor: { select: usuarioSelect },
                    responsableCierre: { select: usuarioSelect },
                    caminata: { select: caminataSelect },
                },
                orderBy: {
                    fechaCierre: 'desc',
                },
                take: 20,
            }),
            // Obtener reportes de peligro pendientes de verificación (donde el usuario es responsable de verificación)
            prisma.reportePeligro.findMany({
                where: {
                    responsableVerificacionId: session.id,
                    estado: 'PENDIENTE_VERIFICACION',
                },
                include: {
                    creadoPor: { select: usuarioSelect },
                    responsableCierre: { select: usuarioSelect },
                    responsableVerificacion: { select: usuarioSelect },
                    caminata: { select: caminataSelect },
                },
                orderBy: {
                    fechaCierre: 'desc',
                },
            }),
            // Obtener controles de calidad ART pendientes (creados por el usuario en caminatas activas)
            prisma.controlCalidadART.findMany({
                where: {
                    creadoPorId: session.id,
                    caminata: {
                        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
                    },
                },
                select: {
                    id: true,
                    datos: true,
                    createdAt: true,
                    creadoPor: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                    caminata: { select: caminataSelect },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]));

        console.log('✅ Reportes pendientes encontrados:', reportesPendientes.length);
        console.log('✅ Tarjetas pendientes encontradas:', tarjetasPendientes.length);
        console.log('✅ Reportes verificación encontrados:', reportesPendientesVerificacion.length);
        console.log('✅ ARTs pendientes encontrados:', artsPendientes.length);

        return NextResponse.json({
            pendientes: {
                reportes: reportesPendientes,
                tarjetas: tarjetasPendientes,
                total: reportesPendientes.length + tarjetasPendientes.length,
            },
            pendientesVerificacion: {
                reportes: reportesPendientesVerificacion,
                total: reportesPendientesVerificacion.length,
            },
            cerradas: {
                reportes: reportesCerrados,
                tarjetas: tarjetasCerradas,
                total: reportesCerrados.length + tarjetasCerradas.length,
            },
            arts: artsPendientes,
        });
    } catch (error) {
        console.error('Error al obtener alertas pendientes:', error);
        return NextResponse.json({ error: 'Error al obtener alertas pendientes' }, { status: 500 });
    }
}
