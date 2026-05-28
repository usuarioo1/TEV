import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { canViewNoConformidades } from '@/lib/permissions';
import { hasChecklistNoCritico, isChecklistItemCritico } from '@/lib/checklist-critical-items';

interface ImagenAdjunta {
    url: string;
    publicId: string;
}

const MAX_IMAGENES_NC = 3;

type ChecklistItemsMap = Record<string, Record<string, unknown>>;

function normalizarImagenes(value: unknown): ImagenAdjunta[] {
    if (!Array.isArray(value)) return [];

    const result: ImagenAdjunta[] = [];
    for (const item of value) {
        if (!item || typeof item !== 'object') continue;
        const maybe = item as { url?: unknown; publicId?: unknown };
        if (typeof maybe.url !== 'string' || typeof maybe.publicId !== 'string') continue;
        result.push({ url: maybe.url, publicId: maybe.publicId });
    }

    return result;
}

function normalizeItemName(itemName: string): string {
    return itemName
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toUpperCase();
}

function convertirItemChecklistASi(
    rawItems: unknown,
    itemNombreObjetivo: string,
    seccionObjetivo?: string,
): { updatedItems: ChecklistItemsMap | null; updated: boolean } {
    if (!rawItems || typeof rawItems !== 'object' || Array.isArray(rawItems)) {
        return { updatedItems: null, updated: false };
    }

    const clonedItems = JSON.parse(JSON.stringify(rawItems)) as ChecklistItemsMap;
    const objetivoNormalizado = normalizeItemName(itemNombreObjetivo);
    const seccionObjetivoNormalizada = seccionObjetivo
        ? normalizeItemName(seccionObjetivo)
        : null;
    let updated = false;

    const todasLasSecciones = Object.entries(clonedItems);
    let seccionesCandidatas = seccionObjetivoNormalizada
        ? todasLasSecciones.filter(([seccion]) => normalizeItemName(seccion) === seccionObjetivoNormalizada)
        : todasLasSecciones;

    // Fallback defensivo para datos legacy con diferencias de naming de sección.
    if (seccionesCandidatas.length === 0) {
        seccionesCandidatas = todasLasSecciones;
    }

    for (const [, seccionItems] of seccionesCandidatas) {
        if (!seccionItems || typeof seccionItems !== 'object' || Array.isArray(seccionItems)) {
            continue;
        }

        for (const [itemNombre, rawItem] of Object.entries(seccionItems)) {
            if (normalizeItemName(itemNombre) !== objetivoNormalizado) {
                continue;
            }

            if (rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)) {
                const item = rawItem as Record<string, unknown>;
                const valorActual = typeof item.valor === 'string'
                    ? item.valor.trim().toUpperCase()
                    : '';

                if (valorActual !== 'SI') {
                    item.valor = 'SI';
                    updated = true;
                }
            } else if (rawItem !== 'SI') {
                seccionItems[itemNombre] = 'SI';
                updated = true;
            }
        }
    }

    return { updatedItems: clonedItems, updated };
}

/**
 * GET /api/no-conformidades/[id]
 * Detalle de una no conformidad.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || !canViewNoConformidades(session.rol)) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const nc = await prisma.noConformidad.findUnique({
            where: { id: parseInt(id) },
            include: {
                servicio: {
                    select: {
                        id: true,
                        codigo: true,
                        descripcion: true,
                        origen: true,
                        destino: true,
                        estado: true,
                        fechaAsignacion: true,
                        operario: { select: { id: true, name: true, username: true, rut: true } },
                        coordinador: { select: { id: true, name: true, username: true } },
                        aprobacion: {
                            select: {
                                fechaAprobacion: true,
                                supervisor: { select: { id: true, name: true, username: true } },
                            },
                        },
                    },
                },
                comentarios: {
                    orderBy: { createdAt: 'asc' },
                    include: { autor: { select: { id: true, name: true, username: true, rol: true } } },
                },
            },
        });

        if (!nc) {
            return NextResponse.json({ message: 'No conformidad no encontrada' }, { status: 404 });
        }

        // Rol sin acceso a esta no conformidad
        if (session.rol !== 'jefaturas' && nc.responsableRol !== session.rol) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        return NextResponse.json(nc);
    } catch (error) {
        console.error('Error al obtener no conformidad:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}

/**
 * PATCH /api/no-conformidades/[id]
 * Permite:
 *  - cambiar estado: ABIERTA ↔ CERRADA
 *  - agregar un comentario
 *  - adjuntar imágenes (máximo 3 por no conformidad)
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || !canViewNoConformidades(session.rol)) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const nc = await prisma.noConformidad.findUnique({ where: { id: parseInt(id) } });
        if (!nc) {
            return NextResponse.json({ message: 'No conformidad no encontrada' }, { status: 404 });
        }

        if (session.rol !== 'jefaturas' && nc.responsableRol !== session.rol) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { estado, comentario, imagenes } = body as {
            estado?: string;
            comentario?: string;
            imagenes?: unknown;
        };

        const validEstados = ['ABIERTA', 'CERRADA'];
        if (estado && !validEstados.includes(estado)) {
            return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
        }

        const imagenesNuevas = normalizarImagenes(imagenes);
        if (imagenes !== undefined && (!Array.isArray(imagenes) || imagenesNuevas.length !== imagenes.length)) {
            return NextResponse.json({ message: 'Formato de imágenes inválido' }, { status: 400 });
        }
        if (imagenesNuevas.length > MAX_IMAGENES_NC) {
            return NextResponse.json({ message: `Máximo ${MAX_IMAGENES_NC} imágenes por operación` }, { status: 400 });
        }

        // Ejecutar en transacción si hay comentario + cambio de estado
        const [updatedNc] = await prisma.$transaction(async (tx) => {
            const dataToUpdate: { estado?: 'ABIERTA' | 'CERRADA'; imagenes?: object[] } = {};
            if (estado) dataToUpdate.estado = estado as 'ABIERTA' | 'CERRADA';

            if (imagenesNuevas.length > 0) {
                const imagenesActuales = normalizarImagenes(nc.imagenes);
                const mergeByPublicId = new Map<string, ImagenAdjunta>();

                for (const img of imagenesActuales) {
                    mergeByPublicId.set(img.publicId, img);
                }
                for (const img of imagenesNuevas) {
                    mergeByPublicId.set(img.publicId, img);
                }

                const imagenesFinales = Array.from(mergeByPublicId.values());
                if (imagenesFinales.length > MAX_IMAGENES_NC) {
                    throw new Error(`La no conformidad admite máximo ${MAX_IMAGENES_NC} imágenes adjuntas`);
                }

                dataToUpdate.imagenes = imagenesFinales as object[];
            }

            const updated = await tx.noConformidad.update({
                where: { id: parseInt(id) },
                data: dataToUpdate,
            });

            if (
                estado === 'CERRADA'
                && nc.estado !== 'CERRADA'
                && isChecklistItemCritico(nc.checklistTipo, nc.itemNombre)
            ) {
                if (nc.checklistTipo === 'TRACTO_CAMION') {
                    const checklistTracto = await tx.checklistTractoCamion.findUnique({
                        where: { servicioId: nc.servicioId },
                        select: {
                            id: true,
                            items: true,
                        },
                    });

                    if (checklistTracto) {
                        const { updatedItems, updated: itemActualizado } = convertirItemChecklistASi(
                            checklistTracto.items,
                            nc.itemNombre,
                            nc.seccion,
                        );

                        if (updatedItems && itemActualizado) {
                            await tx.checklistTractoCamion.update({
                                where: { id: checklistTracto.id },
                                data: {
                                    items: updatedItems as object,
                                    equipoEnCondiciones: !hasChecklistNoCritico('TRACTO_CAMION', updatedItems),
                                },
                            });
                        }
                    }
                }

                if (nc.checklistTipo === 'SEMIREMOLQUE') {
                    const checklistEquipo = await tx.checklistEquipo.findUnique({
                        where: { servicioId: nc.servicioId },
                        select: {
                            id: true,
                            items: true,
                        },
                    });

                    if (checklistEquipo) {
                        const { updatedItems, updated: itemActualizado } = convertirItemChecklistASi(
                            checklistEquipo.items,
                            nc.itemNombre,
                            nc.seccion,
                        );

                        if (updatedItems && itemActualizado) {
                            await tx.checklistEquipo.update({
                                where: { id: checklistEquipo.id },
                                data: {
                                    items: updatedItems as object,
                                    equipoEnCondiciones: !hasChecklistNoCritico('SEMIREMOLQUE', updatedItems),
                                },
                            });
                        }
                    }
                }
            }

            if (comentario && comentario.trim()) {
                await tx.comentarioNoConformidad.create({
                    data: {
                        noConformidadId: parseInt(id),
                        autorId: session.id,
                        contenido: comentario.trim(),
                    },
                });
            }

            return [updated];
        });

        return NextResponse.json(updatedNc);
    } catch (error) {
        console.error('Error al actualizar no conformidad:', error);
        const message = error instanceof Error ? error.message : 'Error interno del servidor';
        const status = message.includes('máximo') ? 400 : 500;
        return NextResponse.json({ message }, { status });
    }
}
