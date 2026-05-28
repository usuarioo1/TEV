import prisma from '@/lib/prisma';
import { TRACTO_CAMION_SECCION_ROL, SEMIREMOLQUE_SECCION_ROL } from '@/lib/permissions';
import {
    getChecklistItemValor,
    isChecklistItemCritico,
    isChecklistValorNoConformidad,
} from '@/lib/checklist-critical-items';

export type TipoChecklistHallazgo = 'TRACTO_CAMION' | 'SEMIREMOLQUE';

export type HallazgoLevantado = {
    checklistTipo: TipoChecklistHallazgo;
    seccion: string;
    itemNombre: string;
    observacion: string;
    responsableRol: string;
};

interface ItemData {
    valor: 'SI' | 'NO' | 'N/A' | 'NC' | '';
    tieneObservacion?: boolean | string | null;
    observacion?: string;
    imagenes?: Array<{ url: string; publicId: string }>;
}

export type ChecklistItemsHallazgo = Record<string, Record<string, ItemData | string>>;

type HallazgoDbClient = Pick<typeof prisma, 'hallazgo'>;

type RolResolution = {
    responsableRol: string;
    seccionCanonical: string;
};

function normalizeSeccionKey(seccion: string): string {
    return seccion
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toUpperCase();
}

function normalizeValor(value: unknown): string {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}

function normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'si' || normalized === 'sí';
    }
    return false;
}

function buildHallazgoKey(seccion: string, itemNombre: string): string {
    const normalizedItem = itemNombre
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toUpperCase();

    return `${normalizeSeccionKey(seccion)}::${normalizedItem}`;
}

function normalizeItemsFromJson(rawItems: unknown): ChecklistItemsHallazgo {
    if (!rawItems || typeof rawItems !== 'object' || Array.isArray(rawItems)) {
        return {};
    }

    const normalized: ChecklistItemsHallazgo = {};

    for (const [seccion, rawSeccionItems] of Object.entries(rawItems as Record<string, unknown>)) {
        if (!rawSeccionItems || typeof rawSeccionItems !== 'object' || Array.isArray(rawSeccionItems)) {
            continue;
        }

        normalized[seccion] = {};
        for (const [itemNombre, rawItem] of Object.entries(rawSeccionItems as Record<string, unknown>)) {
            if (typeof rawItem === 'string') {
                normalized[seccion][itemNombre] = rawItem;
                continue;
            }

            if (rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)) {
                const data = rawItem as Record<string, unknown>;
                normalized[seccion][itemNombre] = {
                    valor: typeof data.valor === 'string' ? (data.valor as ItemData['valor']) : '',
                    tieneObservacion: data.tieneObservacion as ItemData['tieneObservacion'],
                    observacion: typeof data.observacion === 'string' ? data.observacion : '',
                    imagenes: Array.isArray(data.imagenes)
                        ? (data.imagenes as Array<{ url: string; publicId: string }>)
                        : [],
                };
            }
        }
    }

    return normalized;
}

function resolveResponsableRol(
    rolMap: Record<string, string>,
    seccion: string
): RolResolution | undefined {
    const trimmed = seccion.trim();

    if (rolMap[seccion]) {
        return {
            responsableRol: rolMap[seccion],
            seccionCanonical: seccion,
        };
    }

    if (rolMap[trimmed]) {
        return {
            responsableRol: rolMap[trimmed],
            seccionCanonical: trimmed,
        };
    }

    const normalizedInput = normalizeSeccionKey(trimmed);
    for (const [key, rol] of Object.entries(rolMap)) {
        if (normalizeSeccionKey(key) === normalizedInput) {
            return {
                responsableRol: rol,
                seccionCanonical: key,
            };
        }
    }

    return undefined;
}

/**
 * Sincroniza hallazgos detectados en checklist:
 * - Crea/actualiza registros para items marcados como SI con informacion adicional.
 * - Crea/actualiza registros para items NO/NC en puntos no críticos.
 * - Cierra automaticamente hallazgos ABIERTOS cuando el item deja de cumplir la condicion.
 * - Respeta hallazgos cerrados manualmente: no los reabre en resync por checklist.
 */
export async function sincronizarHallazgos(
    servicioId: number,
    checklistTipo: TipoChecklistHallazgo,
    items: ChecklistItemsHallazgo,
    db: HallazgoDbClient = prisma
): Promise<HallazgoLevantado[]> {
    const rolMap =
        checklistTipo === 'TRACTO_CAMION'
            ? TRACTO_CAMION_SECCION_ROL
            : SEMIREMOLQUE_SECCION_ROL;

    const upsertPromises: Promise<unknown>[] = [];
    const hallazgosLevantados: HallazgoLevantado[] = [];
    const hallazgosDetectadosKeys = new Set<string>();
    const seccionesSinRol = new Set<string>();

    for (const seccion in items) {
        const rolResolution = resolveResponsableRol(rolMap, seccion);
        if (!rolResolution) {
            seccionesSinRol.add(seccion);
            continue;
        }

        const { responsableRol, seccionCanonical } = rolResolution;

        const seccionItems = items[seccion];
        for (const itemNombre in seccionItems) {
            const raw = seccionItems[itemNombre];
            const itemData: ItemData =
                typeof raw === 'object' && raw !== null
                    ? (raw as ItemData)
                    : { valor: raw as ItemData['valor'] };

            const valorNormalizado = getChecklistItemValor(raw) || normalizeValor(itemData.valor);
            const observacion = itemData.observacion?.trim() || '';
            const tieneImagenes = Array.isArray(itemData.imagenes) && itemData.imagenes.length > 0;
            const tieneObservacionMarcada = normalizeBoolean(itemData.tieneObservacion);
            const usaFlagObservacion = itemData.tieneObservacion !== undefined && itemData.tieneObservacion !== null;
            const tieneObservacionConTexto = observacion.length > 0;
            const tieneInfoAdicional =
                tieneImagenes ||
                (usaFlagObservacion
                    ? (tieneObservacionMarcada && tieneObservacionConTexto)
                    : tieneObservacionConTexto);
            const itemEsCritico = isChecklistItemCritico(checklistTipo, itemNombre);

            // Hallazgo: respuesta SI con informacion adicional (observacion y/o imagenes)
            // o respuesta NO/NC en item no crítico.
            const esHallazgo =
                (valorNormalizado === 'SI' && tieneInfoAdicional) ||
                (isChecklistValorNoConformidad(valorNormalizado) && !itemEsCritico);

            if (!esHallazgo) continue;

            hallazgosDetectadosKeys.add(buildHallazgoKey(seccionCanonical, itemNombre));

            hallazgosLevantados.push({
                checklistTipo,
                seccion: seccionCanonical,
                itemNombre,
                observacion,
                responsableRol,
            });

            upsertPromises.push(
                db.hallazgo.upsert({
                    where: {
                        servicioId_checklistTipo_seccion_itemNombre: {
                            servicioId,
                            checklistTipo,
                            seccion: seccionCanonical,
                            itemNombre,
                        },
                    },
                    update: {
                        observacion,
                        imagenes: (itemData.imagenes ?? []) as object[],
                    },
                    create: {
                        servicioId,
                        checklistTipo,
                        seccion: seccionCanonical,
                        itemNombre,
                        observacion,
                        imagenes: (itemData.imagenes ?? []) as object[],
                        responsableRol,
                        estado: 'ABIERTA',
                    },
                })
            );
        }
    }

    if (seccionesSinRol.size > 0) {
        console.warn(
            `[Hallazgos] Secciones sin mapeo de rol para checklist ${checklistTipo}: ${Array.from(seccionesSinRol).join(', ')}`
        );
    }

    await Promise.all(upsertPromises);

    const hallazgosAbiertos = await db.hallazgo.findMany({
        where: {
            servicioId,
            checklistTipo,
            estado: 'ABIERTA',
        },
        select: {
            id: true,
            seccion: true,
            itemNombre: true,
        },
    });

    const hallazgosParaCerrar = hallazgosAbiertos
        .filter((hallazgo) => !hallazgosDetectadosKeys.has(buildHallazgoKey(hallazgo.seccion, hallazgo.itemNombre)))
        .map((hallazgo) => hallazgo.id);

    if (hallazgosParaCerrar.length > 0) {
        await db.hallazgo.updateMany({
            where: { id: { in: hallazgosParaCerrar } },
            data: { estado: 'CERRADA' },
        });
    }

    return hallazgosLevantados;
}

type HallazgoRebuildDbClient = Pick<typeof prisma, 'hallazgo' | 'checklistTractoCamion' | 'checklistEquipo'>;

export async function reconstruirHallazgosDesdeChecklists(
    db: HallazgoRebuildDbClient = prisma,
    options?: { servicioId?: number }
): Promise<{ serviciosProcesados: number; hallazgosDetectados: number }> {
    const whereClause = options?.servicioId
        ? { servicioId: options.servicioId }
        : undefined;

    const [checklistsTracto, checklistsEquipo] = await Promise.all([
        db.checklistTractoCamion.findMany({
            where: whereClause,
            select: {
                servicioId: true,
                items: true,
            },
        }),
        db.checklistEquipo.findMany({
            where: whereClause,
            select: {
                servicioId: true,
                items: true,
            },
        }),
    ]);

    let hallazgosDetectados = 0;
    const serviciosProcesados = new Set<number>();

    for (const checklist of checklistsTracto) {
        const items = normalizeItemsFromJson(checklist.items);
        const hallazgos = await sincronizarHallazgos(
            checklist.servicioId,
            'TRACTO_CAMION',
            items,
            db
        );
        hallazgosDetectados += hallazgos.length;
        serviciosProcesados.add(checklist.servicioId);
    }

    for (const checklist of checklistsEquipo) {
        const items = normalizeItemsFromJson(checklist.items);
        const hallazgos = await sincronizarHallazgos(
            checklist.servicioId,
            'SEMIREMOLQUE',
            items,
            db
        );
        hallazgosDetectados += hallazgos.length;
        serviciosProcesados.add(checklist.servicioId);
    }

    return {
        serviciosProcesados: serviciosProcesados.size,
        hallazgosDetectados,
    };
}
