import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import { sincronizarNoConformidades } from '@/lib/no-conformidades';
import { sincronizarHallazgos } from '@/lib/hallazgos';
import { notifyNoConformidadesLevantadasPorRol } from '@/lib/notifications/no-conformidades-levantadas-rol';
import { notifyHallazgosLevantadosPorRol } from '@/lib/notifications/hallazgos-levantados-rol';
import { parseDateInputAsSantiagoDate } from '@/lib/date-chile';
import { hasChecklistNoCritico } from '@/lib/checklist-critical-items';

const DB_RETRY_MAX_ATTEMPTS = 3;
const DB_RETRY_BASE_DELAY_MS = 350;

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
            console.warn(`[checklist/tracto] ${label} fallo intento ${attempt}. Reintentando en ${waitMs}ms.`);
            await delay(waitMs);
        }
    }

    throw lastError;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || session.rol !== ROLES.OPERARIO) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            patente,
            anio,
            nombreConductor,
            rut,
            fecha,
            kilometraje,
            items,
            observacionesGenerales,
        } = body;

        const servicioId = parseInt(id);

        // Verificar que el servicio existe y está asignado al operario
        const servicio = await withDbRetry('buscar servicio', () =>
            prisma.servicio.findUnique({
                where: { id: servicioId },
                include: { checklistTractoCamion: true },
            })
        );

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.operarioId !== session.id) {
            return NextResponse.json(
                { message: 'No tienes permiso para modificar este servicio' },
                { status: 403 }
            );
        }

        if (servicio.estado !== 'ACEPTADO' && servicio.estado !== 'EN_CHECKLIST') {
            return NextResponse.json(
                { message: 'El servicio no está en el estado correcto para completar checklists' },
                { status: 400 }
            );
        }

        // Validar campos requeridos
        if (!patente || !anio || !nombreConductor || !rut || !fecha || !kilometraje || !items) {
            return NextResponse.json(
                { message: 'Faltan campos requeridos para el checklist' },
                { status: 400 }
            );
        }

        // En condiciones: no tiene NO/NC en ítems críticos.
        const equipoEnCondiciones = !hasChecklistNoCritico(
            'TRACTO_CAMION',
            items as Record<string, Record<string, unknown>>,
        );

        // Crear o actualizar el checklist de tracto camión
        const checklistData = {
            patente,
            anio,
            nombreConductor,
            rut,
            fecha: parseDateInputAsSantiagoDate(fecha),
            kilometraje,
            items,
            observacionesGenerales: observacionesGenerales || null,
            equipoEnCondiciones,
            completado: true,
        };

        const {
            checklist,
            noConformidadesLevantadas,
            hallazgosLevantados,
        } = await withDbRetry('guardar checklist y sincronizaciones', () =>
            prisma.$transaction(async (tx) => {
                let checklistGuardado;

                if (servicio.checklistTractoCamion) {
                    // Actualizar existente
                    checklistGuardado = await tx.checklistTractoCamion.update({
                        where: { id: servicio.checklistTractoCamion.id },
                        data: checklistData,
                    });
                } else {
                    // Crear nuevo
                    checklistGuardado = await tx.checklistTractoCamion.create({
                        data: {
                            ...checklistData,
                            servicioId,
                        },
                    });
                }

                // Detectar y persistir no conformidades (ítems con valor "NO")
                const nc = await sincronizarNoConformidades(servicioId, 'TRACTO_CAMION', items, tx);

                // Detectar y persistir hallazgos (items con valor "SI" + informacion adicional)
                const hallazgos = await sincronizarHallazgos(servicioId, 'TRACTO_CAMION', items, tx);

                // Actualizar el estado del servicio a EN_CHECKLIST si estaba en ACEPTADO
                if (servicio.estado === 'ACEPTADO') {
                    await tx.servicio.update({
                        where: { id: servicioId },
                        data: { estado: 'EN_CHECKLIST' },
                    });
                }

                return {
                    checklist: checklistGuardado,
                    noConformidadesLevantadas: nc,
                    hallazgosLevantados: hallazgos,
                };
            })
        );

        await notifyNoConformidadesLevantadasPorRol({
            checklistTipo: 'TRACTO_CAMION',
            servicio: {
                id: servicio.id,
                codigo: servicio.codigo,
                descripcion: servicio.descripcion,
                origen: servicio.origen,
                destino: servicio.destino,
            },
            noConformidades: noConformidadesLevantadas,
            operarioNombre: session.name || session.username,
        });

        await notifyHallazgosLevantadosPorRol({
            checklistTipo: 'TRACTO_CAMION',
            servicio: {
                id: servicio.id,
                codigo: servicio.codigo,
                descripcion: servicio.descripcion,
                origen: servicio.origen,
                destino: servicio.destino,
            },
            hallazgos: hallazgosLevantados,
            operarioNombre: session.name || session.username,
        });

        console.log(
            `[Checklist tracto] servicio=${servicio.codigo} nc=${noConformidadesLevantadas.length} hallazgos=${hallazgosLevantados.length}`
        );

        return NextResponse.json({
            message: 'Checklist de tracto camión guardado exitosamente',
            checklist,
            noConformidadesLevantadas: noConformidadesLevantadas.length,
            hallazgosLevantados: hallazgosLevantados.length,
        });
    } catch (error) {
        console.error('Error al guardar checklist de tracto camión:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
