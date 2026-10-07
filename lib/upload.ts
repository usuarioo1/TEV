/**
 * Helpers para manejo de imágenes en el cliente.
 *
 * El objetivo es reducir el tamaño de las fotos antes de enviarlas al servidor,
 * evitando el límite de ~4.5 MB de body que impone Vercel en serverless functions.
 */

export interface CompressImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

/**
 * Comprime una imagen redimensionándola con canvas y exportándola como JPEG.
 * Por defecto: máximo 1280px de lado, calidad 0.8.
 */
export async function compressImage(
    file: File,
    options: CompressImageOptions = {}
): Promise<string> {
    const {
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.8,
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo crear el contexto de canvas'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };

            img.onerror = () => {
                reject(new Error(`No se pudo cargar la imagen: ${file.name}`));
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error(`No se pudo leer la imagen: ${file.name}`));
        };

        reader.readAsDataURL(file);
    });
}

export interface SafeJsonResult<T> {
    ok: boolean;
    status: number;
    data?: T;
    error?: string;
}

/**
 * Parsea una respuesta fetch como JSON de forma segura.
 * Si la respuesta es HTML/texto (p. ej. 413 "Request Entity Too Large" de Vercel),
 * devuelve un mensaje legible en vez de lanzar SyntaxError.
 */
export async function safeResponseJson<T = unknown>(
    response: Response
): Promise<SafeJsonResult<T>> {
    const text = await response.text();

    if (!text) {
        return {
            ok: response.ok,
            status: response.status,
            error: response.ok
                ? undefined
                : `Error ${response.status}: respuesta vacía del servidor`,
        };
    }

    try {
        const data = JSON.parse(text) as T;

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                error: (data as { error?: string }).error || `Error ${response.status}`,
            };
        }

        return { ok: true, status: response.status, data };
    } catch {
        const snippet = text.trim().slice(0, 120).replace(/\s+/g, ' ');
        const isTooLarge =
            response.status === 413 ||
            snippet.toLowerCase().includes('entity too large');

        const error = isTooLarge
            ? 'El archivo o formulario supera el límite permitido. Intenta con imágenes más livianas o menos imágenes.'
            : `Error ${response.status}: ${snippet || 'respuesta inesperada del servidor'}`;

        return { ok: false, status: response.status, error };
    }
}
