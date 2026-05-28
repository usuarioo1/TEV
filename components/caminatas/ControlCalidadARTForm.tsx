'use client';

import { useState } from 'react';

interface ControlCalidadARTFormProps {
    caminataId: number | null;
    tareaId?: number | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface ItemControl {
    cumple: 'SI' | 'NO' | '';
    comentario: string;
}

export default function ControlCalidadARTForm({ caminataId, tareaId, onSuccess, onCancel }: ControlCalidadARTFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagenes, setImagenes] = useState<File[]>([]);


    const [formData, setFormData] = useState({
        zonas: '',
        faenas: '',
        observaciones: '',
        area: '',
        tareaActividad: '',
    });

    // Items de control (9 items según especificación)
    const [itemsControl, setItemsControl] = useState<ItemControl[]>([
        { cumple: '', comentario: '' }, // 1.1
        { cumple: '', comentario: '' }, // 1.2
        { cumple: '', comentario: '' }, // 1.3
        { cumple: '', comentario: '' }, // 1.4
        { cumple: '', comentario: '' }, // 1.5
        { cumple: '', comentario: '' }, // 1.6
        { cumple: '', comentario: '' }, // 1.7
        { cumple: '', comentario: '' }, // 1.8
        { cumple: '', comentario: '' }, // 1.9
    ]);

    const itemsLabels = [
        'El ART-AST es específica para la tarea y no es genérica.',
        'Si cambian las condiciones o se incluyen nuevos riesgos, se evalúa nuevamente el ART-AST.',
        'Todo el personal involucrado está registrado en el ART-AST.',
        'La ART-AST la revisó el líder de la tarea y la firmó debidamente.',
        'Se identifican todos los riesgos para controlar la tarea.',
        'Los controles identificados en el documento son concordantes con los implementados en terreno.',
        'En ART-AST se identifica el procedimiento que aplica a la tarea.',
        'Los Controles críticos identificados, son evidenciables en terreno.',
        'Están correctamente identificados los controles si existe trabajos SIMULTÁNEOS.',
    ];

    // Función para convertir File a base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imagenesUrls: Array<{ url: string; publicId: string }> = [];

            // Si hay imágenes, subirlas a Cloudinary primero
            if (imagenes.length > 0) {
                setError('Subiendo imágenes...');

                // Convertir todas las imágenes a base64
                const base64Images = await Promise.all(
                    imagenes.map(img => fileToBase64(img))
                );

                // Subir a Cloudinary
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        images: base64Images,
                        folder: 'caminatas/control-calidad-art',
                    }),
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json();
                    throw new Error(uploadError.error || 'Error al subir imágenes');
                }

                const uploadData = await uploadResponse.json();
                imagenesUrls = uploadData.images;
                setError(null);
            }

            // Preparar datos incluyendo URLs de imágenes
            // Agregar descripciones a cada item
            const itemsControlConDescripcion = itemsControl.map((item, index) => ({
                ...item,
                descripcion: itemsLabels[index],
            }));

            const controlData = {
                ...formData,
                itemsControl: itemsControlConDescripcion,
                imagenes: imagenesUrls,
                cantidadImagenes: imagenesUrls.length,
                fechaReporte: new Date().toISOString(),
                usuarioAsignado: null,
                ...(tareaId ? { _tareaId: tareaId } : {}),
            };

            // Determinar endpoint según si es control independiente o de caminata
            const endpoint = caminataId
                ? `/api/caminatas/${caminataId}/control-calidad-art`
                : '/api/control-calidad-art';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(controlData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear control de calidad ART');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleItemChange = (index: number, field: 'cumple' | 'comentario', value: string) => {
        const newItems = [...itemsControl];
        if (field === 'cumple') {
            newItems[index].cumple = value as 'SI' | 'NO' | '';
        } else {
            newItems[index].comentario = value;
        }
        setItemsControl(newItems);
    };

    const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImagenes(Array.from(e.target.files));
        }
    };

    const removeImagen = (index: number) => {
        setImagenes(imagenes.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Control de Calidad de ART</h2>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Zonas */}
                    <div>
                        <label htmlFor="zonas" className="block text-sm font-medium text-gray-700 mb-2">
                            Zonas *
                        </label>
                        <input
                            type="text"
                            id="zonas"
                            name="zonas"
                            required
                            value={formData.zonas}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            placeholder="Ingrese zonas"
                        />
                    </div>

                    {/* Faenas */}
                    <div>
                        <label htmlFor="faenas" className="block text-sm font-medium text-gray-700 mb-2">
                            Faenas *
                        </label>
                        <input
                            type="text"
                            id="faenas"
                            name="faenas"
                            required
                            value={formData.faenas}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            placeholder="Ingrese faenas"
                        />
                    </div>
                </div>

                {/* Ítems de Control */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ítems de Control</h3>
                    <div className="space-y-4">
                        {itemsLabels.map((label, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start mb-3">
                                    <span className="font-medium text-gray-700 mr-2">1.{index + 1}</span>
                                    <p className="text-gray-700 flex-1">{label}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                    {/* Cumple */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cumple *
                                        </label>
                                        <select
                                            required
                                            value={itemsControl[index].cumple}
                                            onChange={(e) => handleItemChange(index, 'cumple', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                        >
                                            <option value="">Seleccione</option>
                                            <option value="SI">Sí</option>
                                            <option value="NO">No</option>
                                        </select>
                                    </div>

                                    {/* Comentario */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Comentario
                                        </label>
                                        <input
                                            type="text"
                                            value={itemsControl[index].comentario}
                                            onChange={(e) => handleItemChange(index, 'comentario', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                            placeholder="Comentario opcional"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Información Adicional */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h3>

                    {/* Observaciones */}
                    <div className="mb-4">
                        <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones
                        </label>
                        <textarea
                            id="observaciones"
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            placeholder="Escriba sus observaciones..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Área */}
                        <div>
                            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                                Área *
                            </label>
                            <input
                                type="text"
                                id="area"
                                name="area"
                                required
                                value={formData.area}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                placeholder="Ingrese el área"
                            />
                        </div>

                        {/* Tarea o Actividad */}
                        <div>
                            <label htmlFor="tareaActividad" className="block text-sm font-medium text-gray-700 mb-2">
                                Tarea o actividad que se realizaba *
                            </label>
                            <input
                                type="text"
                                id="tareaActividad"
                                name="tareaActividad"
                                required
                                value={formData.tareaActividad}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                placeholder="Ingrese la tarea o actividad"
                            />
                        </div>
                    </div>
                </div>

                {/* A
                {/* Adjuntar Archivos / Evidencia */}
                <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adjuntar Archivos / Evidencia (foto)
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagenesChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                    {imagenes.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagenes.map((img, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={URL.createObjectURL(img)}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImagen(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Reportando...' : 'Reportar'}
                    </button>
                </div>
            </form>
        </div>
    );
}
