import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// Límite realista para Vercel: body total ~4.5 MB en serverless functions.
// Con compresión a 1280px/0.8, la mayoría de fotos quedan bajo 1 MB.
const MAX_IMAGES_PER_REQUEST = 6;
const MAX_IMAGE_SIZE_MB = 3;

function estimateBase64Bytes(dataUri: string): number {
    const base64 = dataUri.split(',')[1] || '';
    return Math.ceil((base64.length * 3) / 4);
}

// POST - Subir una o múltiples imágenes a Cloudinary
export async function POST(request: NextRequest) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { images, folder } = body as { images?: unknown; folder?: unknown };

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { error: 'No se proporcionaron imágenes' },
                { status: 400 }
            );
        }

        if (images.length > MAX_IMAGES_PER_REQUEST) {
            return NextResponse.json(
                { error: `Solo se permiten hasta ${MAX_IMAGES_PER_REQUEST} imágenes por solicitud` },
                { status: 400 }
            );
        }

        // Validar que todas las imágenes sean base64 válidas
        const validImages = images.filter((img: unknown) => {
            return typeof img === 'string' && img.startsWith('data:image/');
        });

        if (validImages.length === 0) {
            return NextResponse.json(
                { error: 'No se encontraron imágenes válidas' },
                { status: 400 }
            );
        }

        const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
        const tooLarge = validImages.find((img) => estimateBase64Bytes(img) > maxBytes);
        if (tooLarge) {
            return NextResponse.json(
                { error: `Una o más imágenes superan el límite de ${MAX_IMAGE_SIZE_MB}MB` },
                { status: 413 }
            );
        }

        const safeFolder = typeof folder === 'string' && folder.trim().length > 0
            ? folder.trim()
            : undefined;

        // Subir imágenes con tolerancia a fallos parciales
        const settled = await Promise.allSettled(
            validImages.map((img) => uploadToCloudinary(img, safeFolder))
        );

        const uploadedImages: Array<{ url: string; publicId: string; secureUrl: string }> = [];
        const failed: Array<{ index: number; error: string }> = [];

        settled.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                uploadedImages.push(result.value);
                return;
            }

            const reason = result.reason instanceof Error
                ? result.reason.message
                : 'Error desconocido al subir imagen';
            failed.push({ index, error: reason });
        });

        if (uploadedImages.length === 0) {
            return NextResponse.json(
                {
                    error: 'No se pudo subir ninguna imagen',
                    details: failed,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            images: uploadedImages.map(img => ({
                url: img.secureUrl,
                publicId: img.publicId,
            })),
            failed,
            partial: failed.length > 0,
        });
    } catch (error) {
        console.error('Error al subir imágenes:', error);
        const message = error instanceof Error ? error.message : 'Error al subir las imágenes';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
