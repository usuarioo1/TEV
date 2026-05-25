import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { canViewHallazgos } from '@/lib/permissions';

interface ImagenAdjunta {
    url: string;
    publicId: string;
}

const MAX_IMAGENES_HALLAZGO = 3;

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

/**
 * GET /api/hallazgoschecklist/[id]
 * Detalle de un hallazgo de checklist.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || !canViewHallazgos(session.rol)) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const hallazgo = await prisma.hallazgo.findUnique({
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

        if (!hallazgo) {
            return NextResponse.json({ message: 'Hallazgo no encontrado' }, { status: 404 });
        }

        if (session.rol !== 'jefaturas' && hallazgo.responsableRol !== session.rol) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        return NextResponse.json(hallazgo);
    } catch (error) {
        console.error('Error al obtener hallazgo checklist:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}

/**
 * PATCH /api/hallazgoschecklist/[id]
 * Permite:
 *  - cambiar estado: ABIERTA ↔ CERRADA
 *  - agregar un comentario
 *  - adjuntar imágenes (máximo 3 por hallazgo)
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || !canViewHallazgos(session.rol)) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const hallazgo = await prisma.hallazgo.findUnique({ where: { id: parseInt(id) } });
        if (!hallazgo) {
            return NextResponse.json({ message: 'Hallazgo no encontrado' }, { status: 404 });
        }

        if (session.rol !== 'jefaturas' && hallazgo.responsableRol !== session.rol) {
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

        // Jefaturas puede revisar/comentar, pero no cerrar hallazgos.
        if (session.rol === 'jefaturas' && estado === 'CERRADA') {
            return NextResponse.json({ message: 'Jefatura no puede cerrar hallazgos' }, { status: 403 });
        }

        const imagenesNuevas = normalizarImagenes(imagenes);
        if (imagenes !== undefined && (!Array.isArray(imagenes) || imagenesNuevas.length !== imagenes.length)) {
            return NextResponse.json({ message: 'Formato de imágenes inválido' }, { status: 400 });
        }
        if (imagenesNuevas.length > MAX_IMAGENES_HALLAZGO) {
            return NextResponse.json({ message: `Máximo ${MAX_IMAGENES_HALLAZGO} imágenes por operación` }, { status: 400 });
        }

        const [updatedHallazgo] = await prisma.$transaction(async (tx) => {
            const dataToUpdate: { estado?: 'ABIERTA' | 'CERRADA'; imagenes?: object[] } = {};
            if (estado) dataToUpdate.estado = estado as 'ABIERTA' | 'CERRADA';

            if (imagenesNuevas.length > 0) {
                const imagenesActuales = normalizarImagenes(hallazgo.imagenes);
                const mergeByPublicId = new Map<string, ImagenAdjunta>();

                for (const img of imagenesActuales) {
                    mergeByPublicId.set(img.publicId, img);
                }
                for (const img of imagenesNuevas) {
                    mergeByPublicId.set(img.publicId, img);
                }

                const imagenesFinales = Array.from(mergeByPublicId.values());
                if (imagenesFinales.length > MAX_IMAGENES_HALLAZGO) {
                    throw new Error(`El hallazgo admite máximo ${MAX_IMAGENES_HALLAZGO} imágenes adjuntas`);
                }

                dataToUpdate.imagenes = imagenesFinales as object[];
            }

            const updated = await tx.hallazgo.update({
                where: { id: parseInt(id) },
                data: dataToUpdate,
            });

            if (comentario && comentario.trim()) {
                await tx.comentarioHallazgo.create({
                    data: {
                        hallazgoId: parseInt(id),
                        autorId: session.id,
                        contenido: comentario.trim(),
                    },
                });
            }

            return [updated];
        });

        return NextResponse.json(updatedHallazgo);
    } catch (error) {
        console.error('Error al actualizar hallazgo checklist:', error);
        const message = error instanceof Error ? error.message : 'Error interno del servidor';
        const status = message.includes('máximo') ? 400 : 500;
        return NextResponse.json({ message }, { status });
    }
}