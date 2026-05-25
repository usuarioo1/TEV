import prisma from '@/lib/prisma';
import { TRACTO_CAMION_SECCION_ROL, SEMIREMOLQUE_SECCION_ROL } from '@/lib/permissions';
import {
    getChecklistItemValor,
    isChecklistItemCritico,
    isChecklistValorNoConformidad,
} from '@/lib/checklist-critical-items';

export type TipoChecklistNC = 'TRACTO_CAMION' | 'SEMIREMOLQUE';

export type NoConformidadLevantada = {
    checklistTipo: TipoChecklistNC;
    seccion: string;
    itemNombre: string;
    observacion: string | null;
    responsableRol: string;
};

interface ItemData {
    valor: 'SI' | 'NO' | 'N/A' | 'NC' | '';
    observacion?: string;
    imagenes?: Array<{ url: string; publicId: string }>;
}

type NoConformidadDbClient = Pick<typeof prisma, 'noConformidad'>;

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
 * Sincroniza las no conformidades de un checklist:
 * - Crea registros para ítems criticos con valor "NO" / "NC" que no existan aún.
 * - Cierra no conformidades abiertas de ítems no críticos (compatibilidad con regla anterior).
 * - No cierra automáticamente no conformidades ya abiertas si el ítem cambió a SI.
 *   El cierre se gestiona manualmente por el rol responsable.
 */
export async function sincronizarNoConformidades(
    servicioId: number,
    checklistTipo: TipoChecklistNC,
    items: Record<string, Record<string, ItemData | string>>,
    db: NoConformidadDbClient = prisma
): Promise<NoConformidadLevantada[]> {
    const rolMap =
        checklistTipo === 'TRACTO_CAMION'
            ? TRACTO_CAMION_SECCION_ROL
            : SEMIREMOLQUE_SECCION_ROL;

    const upsertPromises: Promise<unknown>[] = [];
    const noConformidadesLevantadas: NoConformidadLevantada[] = [];
    const seccionesSinRol = new Set<string>();

    for (const seccion in items) {
        const rolResolution = resolveResponsableRol(rolMap, seccion);
        if (!rolResolution) {
            seccionesSinRol.add(seccion);
            continue; // sección sin rol asignado → ignorar
        }

        const { responsableRol, seccionCanonical } = rolResolution;

        const seccionItems = items[seccion];
        for (const itemNombre in seccionItems) {
            const raw = seccionItems[itemNombre];
            const itemData: ItemData =
                typeof raw === 'object' && raw !== null
                    ? (raw as ItemData)
                    : { valor: raw as ItemData['valor'] };

            const itemEsCritico = isChecklistItemCritico(checklistTipo, itemNombre);
            const valorNormalizado = getChecklistItemValor(raw);
            const esNoConformidad = itemEsCritico && isChecklistValorNoConformidad(valorNormalizado);
            if (!esNoConformidad) continue;

            noConformidadesLevantadas.push({
                checklistTipo,
                seccion: seccionCanonical,
                itemNombre,
                observacion: itemData.observacion || null,
                responsableRol,
            });

            // Upsert: si ya existe una no conformidad abierta para este ítem,
            // la actualiza. Si no, la crea.
            upsertPromises.push(
                db.noConformidad.upsert({
                    where: {
                        servicioId_checklistTipo_seccion_itemNombre: {
                            servicioId,
                            checklistTipo,
                            seccion: seccionCanonical,
                            itemNombre,
                        },
                    },
                    update: {
                        observacion: itemData.observacion || null,
                        imagenes: (itemData.imagenes ?? []) as object[],
                    },
                    create: {
                        servicioId,
                        checklistTipo,
                        seccion: seccionCanonical,
                        itemNombre,
                        observacion: itemData.observacion || null,
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
            `[NoConformidades] Secciones sin mapeo de rol para checklist ${checklistTipo}: ${Array.from(seccionesSinRol).join(', ')}`
        );
    }

    await Promise.all(upsertPromises);

    // Cerrar NC abiertas históricas en ítems no críticos para alinear la nueva regla.
    const noConformidadesAbiertas = await db.noConformidad.findMany({
        where: {
            servicioId,
            checklistTipo,
            estado: 'ABIERTA',
        },
        select: {
            id: true,
            itemNombre: true,
        },
    });

    const noConformidadesNoCriticas = noConformidadesAbiertas
        .filter((nc) => !isChecklistItemCritico(checklistTipo, nc.itemNombre))
        .map((nc) => nc.id);

    if (noConformidadesNoCriticas.length > 0) {
        await db.noConformidad.updateMany({
            where: { id: { in: noConformidadesNoCriticas } },
            data: { estado: 'CERRADA' },
        });
    }

    return noConformidadesLevantadas;
}
