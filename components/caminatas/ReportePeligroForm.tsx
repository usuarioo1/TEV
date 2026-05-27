'use client';

import { useState, useEffect } from 'react';

interface ReportePeligroFormProps {
    caminataId: number | null;
    tareaId?: number | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface Usuario {
    id: number;
    name: string | null;
    username: string;
    rol: string;
}

interface Empresa {
    id: number;
    nombre: string;
}

export default function ReportePeligroForm({ caminataId, tareaId, onSuccess, onCancel }: ReportePeligroFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    const [formData, setFormData] = useState({
        empresaId: '',
        tipoPeligro: '',
        zonas: '',
        faena: '',
        actividad: '',
        tarea: '',
        ubicacion: '',
        responsableCierre: '',
        tipoRiesgo: '',
        plazoCierre: '',
        nivelHallazgo: '',
        descripcionPeligro: '',
        consecuenciaPotencial: '',
        medidasSugeridas: '',
    });

    // Cargar lista de usuarios
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await fetch('/api/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsuarios(data);
                }
            } catch (err) {
                console.error('Error al cargar usuarios:', err);
            }
        };

        const fetchEmpresas = async () => {
            try {
                const response = await fetch('/api/empresas');
                if (response.ok) {
                    const data = await response.json();
                    setEmpresas(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Error al cargar empresas:', err);
            }
        };

        fetchUsuarios();
        fetchEmpresas();
    }, []);

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
            const empresaIdNumber = Number.parseInt(formData.empresaId, 10);
            if (!Number.isInteger(empresaIdNumber) || empresaIdNumber <= 0) {
                throw new Error('Debes seleccionar una empresa valida');
            }

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
                        folder: 'caminatas/reportes-peligro',
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
            const reporteData = {
                ...formData,
                empresaId: empresaIdNumber,
                imagenes: imagenesUrls,
                cantidadImagenes: imagenesUrls.length,
                fechaReporte: new Date().toISOString(),
                ...(tareaId ? { _tareaId: tareaId } : {}),
            };

            // Determinar endpoint según si es reporte independiente o de caminata
            const endpoint = caminataId
                ? `/api/caminatas/${caminataId}/reportes-peligro`
                : '/api/reportes-peligro';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reporteData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear reporte');
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
                <h2 className="text-2xl font-bold text-gray-900">Reporte de Peligro</h2>
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
                    {/* Empresa */}
                    <div>
                        <label htmlFor="empresaId" className="block text-sm font-medium text-gray-700 mb-2">
                            Empresa *
                        </label>
                        <select
                            id="empresaId"
                            name="empresaId"
                            required
                            value={formData.empresaId}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        >
                            <option value="">Seleccionar empresa...</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id.toString()}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
                        {empresas.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">No hay empresas disponibles. Solicita crear una empresa antes de reportar.</p>
                        )}
                    </div>

                    {/* Tipo de Peligro */}
                    <div>
                        <label htmlFor="tipoPeligro" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Peligro *
                        </label>
                        <input
                            type="text"
                            id="tipoPeligro"
                            name="tipoPeligro"
                            required
                            value={formData.tipoPeligro}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            placeholder="Ej: Riesgo de caída, Equipo defectuoso..."
                        />
                    </div>

                    {/* Zonas */}
                    <div>
                        <label htmlFor="zonas" className="block text-sm font-medium text-gray-700 mb-2">
                            Zonas Afectadas *
                        </label>
                        <input
                            type="text"
                            id="zonas"
                            name="zonas"
                            required
                            value={formData.zonas}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            placeholder="Ej: Zona A, Sector Norte..."
                        />
                    </div>

                    {/* Faena */}
                    <div>
                        <label htmlFor="faena" className="block text-sm font-medium text-gray-700 mb-2">
                            Faena *
                        </label>
                        <input
                            type="text"
                            id="faena"
                            name="faena"
                            required
                            value={formData.faena}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            placeholder="Ej: Área de carga..."
                        />
                    </div>

                    {/* Ubicación Específica */}
                    <div>
                        <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-2">
                            Ubicación Específica *
                        </label>
                        <input
                            type="text"
                            id="ubicacion"
                            name="ubicacion"
                            required
                            value={formData.ubicacion}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            placeholder="Ej: Patio trasero, Bodega 3..."
                        />
                    </div>

                    {/* Actividad */}
                    <div>
                        <label htmlFor="actividad" className="block text-sm font-medium text-gray-700 mb-2">
                            Actividad *
                        </label>
                        <input
                            type="text"
                            id="actividad"
                            name="actividad"
                            required
                            value={formData.actividad}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            placeholder="Ej: Carga de materiales..."
                        />
                    </div>

                    {/* Tarea */}
                    <div>
                        <label htmlFor="tarea" className="block text-sm font-medium text-gray-700 mb-2">
                            Tarea *
                        </label>
                        <input
                            type="text"
                            id="tarea"
                            name="tarea"
                            required
                            value={formData.tarea}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            placeholder="Tarea específica realizada..."
                        />
                    </div>

                    {/* Responsable de Cierre / Usuario Asignado */}
                    <div>
                        <label htmlFor="responsableCierre" className="block text-sm font-medium text-gray-700 mb-2">
                            Responsable de Cierre (Usuario Asignado) *
                        </label>
                        <select
                            id="responsableCierre"
                            name="responsableCierre"
                            required
                            value={formData.responsableCierre}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        >
                            <option value="">Seleccionar responsable...</option>
                            {usuarios
                                .filter(u => u.rol !== 'operario')
                                .map(usuario => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuario.name || usuario.username} ({usuario.rol})
                                    </option>
                                ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Este usuario será responsable del cierre de la alerta y recibirá la notificación
                        </p>
                    </div>

                    {/* Tipo de Riesgo */}
                    <div>
                        <label htmlFor="tipoRiesgo" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Riesgo *
                        </label>
                        <select
                            id="tipoRiesgo"
                            name="tipoRiesgo"
                            required
                            value={formData.tipoRiesgo}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        >
                            <option value="">Selecciona un tipo</option>
                            <option value="Alto">Alto</option>
                            <option value="Medio">Medio</option>
                            <option value="Bajo">Bajo</option>
                        </select>
                    </div>

                    {/* Nivel de Hallazgo */}
                    <div>
                        <label htmlFor="nivelHallazgo" className="block text-sm font-medium text-gray-700 mb-2">
                            Nivel de Hallazgo *
                        </label>
                        <select
                            id="nivelHallazgo"
                            name="nivelHallazgo"
                            required
                            value={formData.nivelHallazgo}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        >
                            <option value="">Selecciona un nivel</option>
                            <option value="Crítico">Crítico</option>
                            <option value="Mayor">Mayor</option>
                            <option value="Menor">Menor</option>
                            <option value="Observación">Observación</option>
                        </select>
                    </div>

                    {/* Plazo de Cierre */}
                    <div className="md:col-span-2">
                        <label htmlFor="plazoCierre" className="block text-sm font-medium text-gray-700 mb-2">
                            Plazo de Cierre *
                        </label>
                        <input
                            type="date"
                            id="plazoCierre"
                            name="plazoCierre"
                            required
                            value={formData.plazoCierre}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        />
                    </div>
                </div>

                {/* Descripción del Peligro */}
                <div>
                    <label htmlFor="descripcionPeligro" className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción del Peligro *
                    </label>
                    <textarea
                        id="descripcionPeligro"
                        name="descripcionPeligro"
                        required
                        rows={3}
                        value={formData.descripcionPeligro}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-black"
                        placeholder="Describe detalladamente el peligro identificado..."
                    />
                </div>

                {/* Consecuencia Potencial */}
                <div>
                    <label htmlFor="consecuenciaPotencial" className="block text-sm font-medium text-gray-700 mb-2">
                        Consecuencia Potencial *
                    </label>
                    <textarea
                        id="consecuenciaPotencial"
                        name="consecuenciaPotencial"
                        required
                        rows={3}
                        value={formData.consecuenciaPotencial}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-black"
                        placeholder="¿Qué podría suceder si no se controla este peligro?..."
                    />
                </div>

                {/* Medidas Sugeridas */}
                <div>
                    <label htmlFor="medidasSugeridas" className="block text-sm font-medium text-gray-700 mb-2">
                        Medidas Sugeridas *
                    </label>
                    <textarea
                        id="medidasSugeridas"
                        name="medidasSugeridas"
                        required
                        rows={3}
                        value={formData.medidasSugeridas}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-black"
                        placeholder="Propón medidas de control o prevención para este peligro..."
                    />
                </div>

                {/* Adjuntar Imágenes */}
                <div className="border-t pt-6">
                    <label htmlFor="imagenes" className="block text-sm font-medium text-gray-700 mb-2">
                        Adjuntar Imágenes
                    </label>
                    <input
                        type="file"
                        id="imagenes"
                        accept="image/*"
                        multiple
                        onChange={handleImagenesChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        Puedes seleccionar múltiples imágenes (JPG, PNG, etc.)
                    </p>

                    {/* Lista de imágenes seleccionadas */}
                    {imagenes.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                Imágenes seleccionadas ({imagenes.length}):
                            </p>
                            {imagenes.map((img, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span className="text-sm text-gray-700 truncate">{img.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeImagen(index)}
                                        className="text-red-600 hover:text-red-700 ml-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Nota Informativa */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Asignación Automática</h4>
                            <p className="mt-1 text-sm text-blue-700">
                                Esta alerta será asignada automáticamente al Responsable de Cierre seleccionado anteriormente, quien recibirá la notificación correspondiente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? 'Creando...' : 'Crear Reporte de Peligro'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
