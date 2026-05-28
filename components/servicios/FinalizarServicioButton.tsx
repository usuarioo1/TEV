'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface FinalizarServicioButtonProps {
    servicioId: number;
    codigoServicio: string;
}

interface Participante {
    id: string;
    nombre: string;
    cargo: string;
    rut: string;
}

// Preguntas de Evaluación de Término (Hoja 3)
const PREGUNTAS_TERMINO = [
    "¿Durante la ejecución se registraron y reportaron incidentes?",
    "¿Queda algún peligro en el área que deba ser reportado?",
    "¿El área se entrega en condiciones de orden y limpieza?",
    "Dejar registro de Guía de Despacho"
];

const PREGUNTA_EVIDENCIA_INDEX = 3;
const MAX_IMAGE_DIMENSION = 1920;
const TARGET_IMAGE_BYTES = 900 * 1024;
const INITIAL_JPEG_QUALITY = 0.86;
const MIN_JPEG_QUALITY = 0.6;

export default function FinalizarServicioButton({ servicioId, codigoServicio }: FinalizarServicioButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingEvidence, setUploadingEvidence] = useState(false);
    const [evidenceStage, setEvidenceStage] = useState<'idle' | 'compressing' | 'uploading'>('idle');
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [currentStep, setCurrentStep] = useState<'confirmation' | 'cierre'>('confirmation');
    const [evidenciasArchivos, setEvidenciasArchivos] = useState<File[]>([]);
    const [evidenciasPreview, setEvidenciasPreview] = useState<string[]>([]);

    // Estados de la Hoja 3: Etapa Final y Cierre
    const [evaluacionTermino, setEvaluacionTermino] = useState<Record<number, { respuesta: string; observacion: string }>>(() => {
        const initial: Record<number, { respuesta: string; observacion: string }> = {};
        PREGUNTAS_TERMINO.forEach((_, index) => {
            initial[index] = { respuesta: '', observacion: '' };
        });
        return initial;
    });
    const [observacionesFinales, setObservacionesFinales] = useState('');
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        const urls = evidenciasArchivos.map((file) => URL.createObjectURL(file));
        setEvidenciasPreview(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [evidenciasArchivos]);

    // Funciones para manejar cambios
    const handleEvaluacionChange = (index: number, field: 'respuesta' | 'observacion', value: string) => {
        setEvaluacionTermino(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [field]: value
            }
        }));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión'));
            img.src = dataUrl;
        });
    };

    const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('No se pudo generar el archivo comprimido'));
                        return;
                    }
                    resolve(blob);
                },
                'image/jpeg',
                quality
            );
        });
    };

    const buildCompressedFileName = (originalName: string) => {
        const baseName = originalName.replace(/\.[^.]+$/, '');
        return `${baseName}-compressed.jpg`;
    };

    const compressImageFile = async (file: File): Promise<File> => {
        if (!file.type.startsWith('image/')) {
            return file;
        }

        const originalDataUrl = await fileToBase64(file);
        const image = await dataUrlToImage(originalDataUrl);

        const longestSide = Math.max(image.width, image.height);
        const needsResize = longestSide > MAX_IMAGE_DIMENSION;
        const scale = needsResize ? MAX_IMAGE_DIMENSION / longestSide : 1;

        const targetWidth = Math.max(1, Math.round(image.width * scale));
        const targetHeight = Math.max(1, Math.round(image.height * scale));

        if (!needsResize && file.size <= TARGET_IMAGE_BYTES) {
            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No se pudo inicializar el compresor de imágenes');
        }

        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        let quality = INITIAL_JPEG_QUALITY;
        let blob = await canvasToBlob(canvas, quality);

        while (blob.size > TARGET_IMAGE_BYTES && quality > MIN_JPEG_QUALITY) {
            quality = Number((quality - 0.08).toFixed(2));
            blob = await canvasToBlob(canvas, quality);
        }

        return new File([blob], buildCompressedFileName(file.name), {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });
    };

    const compressEvidencias = async (files: File[]): Promise<File[]> => {
        const comprimidas = await Promise.all(
            files.map(async (file) => {
                try {
                    return await compressImageFile(file);
                } catch (compressionError) {
                    console.warn('No se pudo comprimir una imagen, se enviará original:', compressionError);
                    return file;
                }
            })
        );

        return comprimidas;
    };

    const handleEvidenciasChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const imagenesValidas = Array.from(files).filter((file) => file.type.startsWith('image/'));

        if (imagenesValidas.length === 0) {
            setError('Solo puedes seleccionar imágenes válidas');
            return;
        }

        const total = evidenciasArchivos.length + imagenesValidas.length;
        if (total > 3) {
            setError('Puedes adjuntar como máximo 3 imágenes de evidencia');
            return;
        }

        setEvidenciasArchivos((prev) => [...prev, ...imagenesValidas]);
        setError('');
    };

    const handleRemoveEvidencia = (index: number) => {
        setEvidenciasArchivos((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadEvidencias = async (): Promise<string[]> => {
        if (evidenciasArchivos.length === 0) return [];

        setUploadingEvidence(true);
        try {
            setEvidenceStage('compressing');
            const archivosComprimidos = await compressEvidencias(evidenciasArchivos);

            setEvidenceStage('uploading');
            const base64Images = await Promise.all(
                archivosComprimidos.map((file) => fileToBase64(file))
            );

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: base64Images,
                    folder: 'servicios/cierre',
                }),
            });

            if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.json().catch(() => ({}));
                throw new Error(uploadError.error || 'Error al subir imágenes de evidencia');
            }

            const uploadData = await uploadResponse.json() as {
                images?: Array<{ url?: string }>;
            };

            const urls = Array.isArray(uploadData.images)
                ? uploadData.images
                    .map((img) => img?.url)
                    .filter((url): url is string => typeof url === 'string' && url.length > 0)
                : [];

            if (urls.length === 0) {
                throw new Error('No se pudieron obtener URLs de evidencia');
            }

            return urls;
        } finally {
            setUploadingEvidence(false);
            setEvidenceStage('idle');
        }
    };

    // Validaciones
    const evaluacionCompleta = () => {
        return PREGUNTAS_TERMINO.every((_, index) => evaluacionTermino[index]?.respuesta !== '');
    };

    const handleFinalizar = async () => {
        // Validar que la Hoja 3 esté completa
        if (!evaluacionCompleta()) {
            setError('Debes completar todas las preguntas de la evaluación de término');
            return;
        }

        const respuestaEvidencia = evaluacionTermino[PREGUNTA_EVIDENCIA_INDEX]?.respuesta;
        const requiereEvidencia = respuestaEvidencia === 'SI';

        if (requiereEvidencia && evidenciasArchivos.length === 0) {
            setError('Marcaste SI en evidencia fotográfica: debes adjuntar al menos una imagen');
            return;
        }

        if (!requiereEvidencia && evidenciasArchivos.length > 0) {
            setError('Marcaste NO/N/A en evidencia fotográfica: elimina las imágenes o responde SI');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const evidenciasFotograficas = requiereEvidencia
                ? await uploadEvidencias()
                : [];

            const response = await fetch(`/api/servicios/${servicioId}/finalizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    observacionesCierre: observaciones.trim() || null,
                    evaluacionTermino,
                    observacionesFinales: observacionesFinales || null,
                    evidenciasFotograficas,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al finalizar el servicio');
            }

            // Refrescar la página y redirigir
            router.refresh();
            router.push('/servicios');
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    const handleContinuarACierre = () => {
        setCurrentStep('cierre');
    };

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="w-full inline-flex justify-center items-center px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Finalizar Servicio
            </button>
        );
    }

    return (
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Paso 1: Confirmación y observaciones */}
            {currentStep === 'confirmation' && (
                <>
                    <div className="flex items-start mb-4">
                        <svg className="h-6 w-6 text-blue-600 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-base font-semibold text-blue-900 mb-1">
                                ¿Finalizar el servicio?
                            </h4>
                            <p className="text-sm text-blue-700">
                                Estás a punto de finalizar el servicio <span className="font-semibold">{codigoServicio}</span>.
                                Primero completaremos la Etapa Final y Cierre del Análisis de Riesgo,
                                incluyendo evidencias fotográficas si corresponde.
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="observaciones-inicial" className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones iniciales (opcional)
                        </label>
                        <textarea
                            id="observaciones-inicial"
                            rows={3}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Describe cómo se completó el servicio, si hubo algún inconveniente..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleContinuarACierre}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        >
                            Continuar con Cierre
                            <svg className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setCurrentStep('confirmation');
                                setError('');
                            }}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </>
            )}

            {/* Paso 2: Etapa Final y Cierre (Hoja 3) */}
            {currentStep === 'cierre' && (
                <div className="space-y-6">
                    <div className="flex items-start mb-4 pb-4 border-b border-gray-300">
                        <svg className="h-6 w-6 text-blue-600 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <h4 className="text-base font-semibold text-blue-900 mb-1">
                                Etapa Final y Cierre - Análisis de Riesgo
                            </h4>
                            <p className="text-sm text-blue-700">
                                Completa la evaluación de término antes de finalizar el servicio
                            </p>
                        </div>
                    </div>

                    {/* Evaluación de Término de Faena */}
                    <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Evaluación de Término de Faena</h5>
                        <div className="space-y-3">
                            {PREGUNTAS_TERMINO.map((pregunta, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <p className="text-xs font-medium text-gray-900 mb-2">
                                        {index + 1}. {pregunta}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`evaluacion-${index}`}
                                                        value="SI"
                                                        checked={evaluacionTermino[index]?.respuesta === 'SI'}
                                                        onChange={() => handleEvaluacionChange(index, 'respuesta', 'SI')}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-xs text-gray-700">SI</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`evaluacion-${index}`}
                                                        value="NO"
                                                        checked={evaluacionTermino[index]?.respuesta === 'NO'}
                                                        onChange={() => handleEvaluacionChange(index, 'respuesta', 'NO')}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-xs text-gray-700">NO</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`evaluacion-${index}`}
                                                        value="N/A"
                                                        checked={evaluacionTermino[index]?.respuesta === 'N/A'}
                                                        onChange={() => handleEvaluacionChange(index, 'respuesta', 'N/A')}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-xs text-gray-700">N/A</span>
                                                </label>
                                            </div>
                                        </div>

                                        {index === PREGUNTA_EVIDENCIA_INDEX ? (
                                            <div className="space-y-3">
                                                {evaluacionTermino[index]?.respuesta === 'SI' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Adjunta hasta 3 imágenes de evidencia
                                                            </label>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={(e) => handleEvidenciasChange(e.target.files)}
                                                                className="block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                            />
                                                            <p className="mt-1 text-[11px] text-gray-500">
                                                                Máximo 3 imágenes. Formatos recomendados: JPG o PNG.
                                                            </p>
                                                        </div>

                                                        {evidenciasPreview.length > 0 && (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {evidenciasPreview.map((previewUrl, previewIndex) => (
                                                                    <div key={`${previewUrl}-${previewIndex}`} className="relative rounded-md overflow-hidden border border-gray-200">
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={previewUrl}
                                                                            alt={`Evidencia ${previewIndex + 1}`}
                                                                            className="h-24 w-full object-cover"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveEvidencia(previewIndex)}
                                                                            className="absolute top-1 right-1 bg-white/90 text-red-600 text-[10px] px-1.5 py-0.5 rounded"
                                                                        >
                                                                            Quitar
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={evaluacionTermino[index]?.observacion || ''}
                                                    onChange={(e) => handleEvaluacionChange(index, 'observacion', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-black"
                                                    placeholder="Observaciones (Opcional)"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Observaciones Finales */}
                    <div>
                        <label htmlFor="observacionesFinales" className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones Finales
                        </label>
                        <textarea
                            id="observacionesFinales"
                            value={observacionesFinales}
                            onChange={(e) => setObservacionesFinales(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                            placeholder="Observaciones generales del cierre del servicio..."
                        />
                    </div>

                    {/* Botones finales */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-300">
                        <button
                            onClick={handleFinalizar}
                            disabled={loading}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {uploadingEvidence
                                        ? (evidenceStage === 'compressing' ? 'Comprimiendo evidencias...' : 'Subiendo evidencias...')
                                        : 'Finalizando...'}
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Confirmar Finalización
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setCurrentStep('confirmation')}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setCurrentStep('confirmation');
                                setError('');
                            }}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
