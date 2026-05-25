import { v2 as cloudinary } from 'cloudinary';

type CloudinaryUploadResult = { url: string; publicId: string; secureUrl: string };

function getCloudinaryErrorMessage(error: unknown): string {
    if (!error) return 'Error desconocido de Cloudinary';

    if (error instanceof Error) {
        return error.message || 'Error desconocido de Cloudinary';
    }

    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
        return maybeMessage;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return 'Error desconocido de Cloudinary';
    }
}

function assertCloudinaryConfig() {
    const required = {
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    };

    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(`Configuración incompleta de Cloudinary. Faltan: ${missing.join(', ')}`);
    }
}

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary desde un buffer o base64
 * @param file - String en formato base64 o buffer
 * @param folder - Carpeta en Cloudinary donde se guardará (opcional)
 * @returns Objeto con la URL de la imagen y el public_id
 */
export async function uploadToCloudinary(
    file: string,
    folder?: string
): Promise<CloudinaryUploadResult> {
    try {
        assertCloudinaryConfig();

        if (typeof file !== 'string' || !file.startsWith('data:image/')) {
            throw new Error('Formato de imagen inválido. Se esperaba data URI base64 de imagen');
        }

        const uploadFolder = folder || process.env.CLOUDINARY_FOLDER || 'nextminer';

        const result = await cloudinary.uploader.upload(file, {
            folder: uploadFolder,
            resource_type: 'auto',
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ],
        });

        return {
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        const msg = getCloudinaryErrorMessage(error);
        console.error('Error al subir imagen a Cloudinary:', msg);
        throw new Error(`Error al subir la imagen: ${msg}`);
    }
}

/**
 * Elimina una imagen de Cloudinary
 * @param publicId - ID público de la imagen en Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error al eliminar imagen de Cloudinary:', error);
        throw new Error('Error al eliminar la imagen');
    }
}

/**
 * Sube múltiples imágenes a Cloudinary
 * @param files - Array de strings en base64
 * @param folder - Carpeta en Cloudinary
 * @returns Array de objetos con URLs y public_ids
 */
export async function uploadMultipleToCloudinary(
    files: string[],
    folder?: string
): Promise<CloudinaryUploadResult[]> {
    const settled = await Promise.allSettled(
        files.map((file) => uploadToCloudinary(file, folder))
    );

    const uploaded: CloudinaryUploadResult[] = [];
    const failed: Array<{ index: number; error: string }> = [];

    settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            uploaded.push(result.value);
            return;
        }

        failed.push({
            index,
            error: getCloudinaryErrorMessage(result.reason),
        });
    });

    if (failed.length > 0) {
        console.warn('Subida parcial a Cloudinary:', failed);
    }

    if (uploaded.length === 0) {
        const detail = failed.map((f) => `#${f.index + 1}: ${f.error}`).join(' | ');
        throw new Error(`No se pudo subir ninguna imagen. Detalle: ${detail}`);
    }

    return uploaded;
}

export default cloudinary;
