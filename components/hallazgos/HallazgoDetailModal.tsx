'use client';

import { useState, type ChangeEvent } from 'react';
import { useSession } from '@/app/context/SessionContext';
import type { Hallazgo } from '@/app/hallazgos/page';
import { exportHallazgoPdf } from '@/components/hallazgos/exportHallazgoPdf';

interface Props {
    hallazgo: Hallazgo;
    apiBasePath?: string;
    onClose: () => void;
    onUpdated: () => void;
}

interface ImagenAdjunta {
    url: string;
    publicId: string;
}

const MAX_IMAGENES_HALLAZGO = 3;
const MAX_LADO_IMAGEN_PX = 1600;
const CALIDAD_JPEG = 0.72;

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
    ABIERTA: { label: 'Abierta', color: 'bg-red-100 text-red-800' },
    CERRADA: { label: 'Cerrada', color: 'bg-green-100 text-green-800' },
};

const CHECKLIST_LABELS: Record<string, string> = {
    TRACTO_CAMION: 'Tractocamión',
    SEMIREMOLQUE: 'Semirremolque',
};

const SERVICIO_ESTADO_LABELS: Record<string, { label: string; color: string }> = {
    PENDIENTE: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
    ASIGNADO: { label: 'Asignado', color: 'bg-blue-100 text-blue-700' },
    ACEPTADO: { label: 'Aceptado', color: 'bg-sky-100 text-sky-700' },
    EN_CHECKLIST: { label: 'En Checklist', color: 'bg-yellow-100 text-yellow-700' },
    PENDIENTE_APROBACION: { label: 'Pend. Aprobación', color: 'bg-orange-100 text-orange-700' },
    APROBADO: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
    EN_EJECUCION: { label: 'En Ejecución', color: 'bg-teal-100 text-teal-700' },
    COMPLETADO: { label: 'Completado', color: 'bg-green-200 text-green-800' },
    RECHAZADO: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
    CANCELADO: { label: 'Cancelado', color: 'bg-gray-200 text-gray-500' },
};

const SECCION_LABELS: Record<string, string> = {
    DOCUMENTACION: 'Documentación',
    EPP: 'EPP',
    LUCES_Y_MICAS: 'Luces y Micas',
    CONDICIONES_GENERALES: 'Condiciones Generales',
    MECANICA_Y_MOTOR: 'Mecánica y Motor',
    CONEXIONES: 'Conexiones',
    'NEUMÁTICOS': 'Neumáticos',
    GENERAL: 'General',
    ESTRUCTURA: 'Estructura',
    'FIJACIÓN': 'Fijación',
};

export default function HallazgoDetailModal({ hallazgo: nc, apiBasePath = '/api/hallazgoschecklist', onClose, onUpdated }: Props) {
    const { session } = useSession();
    const [comentario, setComentario] = useState('');
    const [archivosAdjuntos, setArchivosAdjuntos] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [error, setError] = useState('');

    const canActuate = session?.rol === nc.responsableRol || session?.rol === 'jefaturas';
    const canCloseHallazgo = session?.rol === nc.responsableRol;
    const imagenesActuales = nc.imagenes ?? [];
    const cuposDisponibles = Math.max(0, MAX_IMAGENES_HALLAZGO - imagenesActuales.length - archivosAdjuntos.length);

    const compressImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result !== 'string') {
                    reject(new Error('Formato de archivo inválido'));
                    return;
                }

                const image = new Image();
                image.onload = () => {
                    const scale = Math.min(1, MAX_LADO_IMAGEN_PX / Math.max(image.width, image.height));
                    const targetWidth = Math.max(1, Math.round(image.width * scale));
                    const targetHeight = Math.max(1, Math.round(image.height * scale));

                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    const context = canvas.getContext('2d');
                    if (!context) {
                        reject(new Error('No se pudo procesar la imagen'));
                        return;
                    }

                    context.drawImage(image, 0, 0, targetWidth, targetHeight);
                    resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
                };
                image.onerror = () => reject(new Error('No se pudo procesar la imagen'));
                image.src = reader.result;
            };
            reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
            reader.readAsDataURL(file);
        });
    };

    const handleAdjuntosChange = (event: ChangeEvent<HTMLInputElement>) => {
        setError('');
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;

        const imagenesValidas = files.filter((file) => file.type.startsWith('image/'));
        if (imagenesValidas.length !== files.length) {
            setError('Solo se permiten archivos de imagen.');
        }

        if (cuposDisponibles <= 0) {
            setError(`Este hallazgo ya tiene el máximo de ${MAX_IMAGENES_HALLAZGO} imágenes.`);
            event.target.value = '';
            return;
        }

        const archivosAAgregar = imagenesValidas.slice(0, cuposDisponibles);
        if (archivosAAgregar.length < imagenesValidas.length) {
            setError(`Solo puedes adjuntar hasta ${MAX_IMAGENES_HALLAZGO} imágenes en total.`);
        }

        setArchivosAdjuntos((prev) => [...prev, ...archivosAAgregar]);
        event.target.value = '';
    };

    const removeAdjunto = (index: number) => {
        setArchivosAdjuntos((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleExportPdf = async () => {
        setError('');
        setExportingPdf(true);
        try {
            await exportHallazgoPdf(nc);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo generar el PDF');
        } finally {
            setExportingPdf(false);
        }
    };

    const handleSubmit = async (nuevoEstado?: string) => {
        if (!comentario.trim() && !nuevoEstado && archivosAdjuntos.length === 0) return;
        setError('');
        setSaving(true);
        try {
            const body: { estado?: string; comentario?: string; imagenes?: ImagenAdjunta[] } = {};
            if (nuevoEstado) body.estado = nuevoEstado;
            if (comentario.trim()) body.comentario = comentario.trim();

            if (archivosAdjuntos.length > 0) {
                const base64Images = await Promise.all(archivosAdjuntos.map(compressImageToBase64));

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        images: base64Images,
                        folder: 'hallazgos/adjuntos',
                    }),
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json().catch(() => ({}));
                    throw new Error(uploadError.error || 'Error al subir imágenes');
                }

                const uploadData = await uploadResponse.json() as { images?: ImagenAdjunta[] };
                if (!Array.isArray(uploadData.images) || uploadData.images.length === 0) {
                    throw new Error('No se recibieron imágenes válidas del servidor');
                }

                body.imagenes = uploadData.images;
            }

            const res = await fetch(`${apiBasePath}/${nc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al actualizar');
            }
            onUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Hallazgo #{nc.id}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_LABELS[nc.estado].color}`}>
                                {ESTADO_LABELS[nc.estado].label}
                            </span>
                            <span className="text-xs text-gray-500">
                                {CHECKLIST_LABELS[nc.checklistTipo]} · {SECCION_LABELS[nc.seccion] ?? nc.seccion}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportPdf}
                            disabled={exportingPdf}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            {exportingPdf ? 'Generando...' : 'Exportar PDF'}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="px-6 pt-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Ítem */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Item con hallazgo</p>
                        <p className="font-medium text-gray-900">{nc.itemNombre}</p>
                        {nc.observacion && (
                            <p className="text-sm text-gray-600 mt-1">{nc.observacion}</p>
                        )}
                    </div>

                    {/* Imagen(es) */}
                    {nc.imagenes?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Imágenes</p>
                            <div className="flex gap-2 flex-wrap">
                                {nc.imagenes.map((img, i) => (
                                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt={`imagen-${i}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info servicio */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información del Servicio</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <InfoRow label="Código" value={nc.servicio.codigo} />
                            <div>
                                <p className="text-xs text-gray-500">Estado del servicio</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${(SERVICIO_ESTADO_LABELS[nc.servicio.estado] ?? { color: 'bg-gray-100 text-gray-600' }).color}`}>
                                    {(SERVICIO_ESTADO_LABELS[nc.servicio.estado] ?? { label: nc.servicio.estado }).label}
                                </span>
                            </div>
                            <InfoRow label="Descripción" value={nc.servicio.descripcion} />
                            <InfoRow label="Origen" value={nc.servicio.origen} />
                            <InfoRow label="Destino" value={nc.servicio.destino} />
                            <InfoRow
                                label="Operario asignado"
                                value={nc.servicio.operario?.name ?? nc.servicio.operario?.username ?? '—'}
                            />
                            {nc.servicio.operario?.rut && (
                                <InfoRow label="RUT operario" value={nc.servicio.operario.rut} />
                            )}
                            <InfoRow
                                label="Coordinador"
                                value={nc.servicio.coordinador?.name ?? nc.servicio.coordinador?.username}
                            />
                            <InfoRow
                                label="Fecha asignación"
                                value={new Date(nc.servicio.fechaAsignacion).toLocaleDateString('es-CL')}
                            />
                            {nc.servicio.aprobacion && (
                                <>
                                    <InfoRow
                                        label="Supervisor aprobó"
                                        value={nc.servicio.aprobacion.supervisor?.name ?? nc.servicio.aprobacion.supervisor?.username}
                                    />
                                    <InfoRow
                                        label="Fecha aprobación"
                                        value={new Date(nc.servicio.aprobacion.fechaAprobacion).toLocaleDateString('es-CL')}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Historial de comentarios */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial</p>
                        {nc.comentarios.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Sin comentarios aún</p>
                        ) : (
                            <div className="space-y-3">
                                {nc.comentarios.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                            {(c.autor.name ?? c.autor.username).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-semibold text-gray-800">
                                                    {c.autor.name ?? c.autor.username}
                                                </span>
                                                <span className="text-xs text-gray-400 capitalize">{c.autor.rol}</span>
                                                <span className="text-xs text-gray-400 ml-auto">
                                                    {new Date(c.createdAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{c.contenido}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer – actions */}
                {canActuate && nc.estado !== 'CERRADA' && (
                    <div className="border-t border-gray-200 p-6 space-y-3">
                        <textarea
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
                            rows={2}
                            placeholder="Escribe un comentario sobre este hallazgo..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Adjuntar imágenes (máximo {MAX_IMAGENES_HALLAZGO})</p>
                                <p className="text-xs text-gray-400">Disponibles: {cuposDisponibles}</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleAdjuntosChange}
                                disabled={saving || cuposDisponibles <= 0}
                                className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                            />

                            {archivosAdjuntos.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {archivosAdjuntos.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                                            <span className="max-w-44 truncate">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAdjunto(index)}
                                                className="text-gray-500 hover:text-red-600"
                                                aria-label="Quitar imagen adjunta"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {/* Solo comentario */}
                            <button
                                onClick={() => handleSubmit()}
                                disabled={saving || (!comentario.trim() && archivosAdjuntos.length === 0)}
                                className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Guardando...' : 'Guardar actualización'}
                            </button>
                            {canCloseHallazgo && (
                                <button
                                    onClick={() => handleSubmit('CERRADA')}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {saving ? 'Guardando...' : 'Cerrar hallazgo'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-medium text-gray-800">{value}</p>
        </div>
    );
}
