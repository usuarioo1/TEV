'use client';

import { useState, useEffect } from 'react';

interface TarjetaStopFormProps {
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

const MOTIVOS_TARJETA = [
    'Condición insegura detectada',
    'Acto inseguro observado',
    'Falta de equipos de protección personal',
    'Procedimiento no cumplido',
    'Riesgo inminente de accidente',
    'Condiciones climáticas adversas',
    'Equipo o herramienta en mal estado',
    'Trabajador sin autorización o capacitación',
    'Otro motivo',
];

export default function TarjetaStopForm({ caminataId, tareaId, onSuccess, onCancel }: TarjetaStopFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    const [formData, setFormData] = useState({
        empresaId: '',
        zonas: '',
        faenas: '',
        causa: '',
        responsableCierre: '',
        descripcionDetallada: '',
        medidaCorrectiva: '',
        motivoAplicacion: '',
        otroMotivo: '',
        causalDetencion: '',
        solucionImplementada: '',
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
                        folder: 'caminatas/tarjetas-stop',
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

            // Preparar datos
            const tarjetaData = {
                ...formData,
                empresaId: empresaIdNumber,
                motivoAplicacionFinal: formData.motivoAplicacion === 'Otro motivo'
                    ? formData.otroMotivo
                    : formData.motivoAplicacion,
                imagenes: imagenesUrls,
                cantidadImagenes: imagenesUrls.length,
                fechaTarjeta: new Date().toISOString(),
                ...(tareaId ? { _tareaId: tareaId } : {}),
            };

            // Determinar endpoint según si es tarjeta independiente o de caminata
            const endpoint = caminataId
                ? `/api/caminatas/${caminataId}/tarjetas-stop`
                : '/api/tarjetas-stop';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tarjetaData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear tarjeta');
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
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Tarjeta Alto/Stop
                </h2>
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                            placeholder="Ej: Zona Norte, Sector B..."
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                            placeholder="Ej: Área de trabajo, Instalación..."
                        />
                    </div>

                    {/* Causa */}
                    <div>
                        <label htmlFor="causa" className="block text-sm font-medium text-gray-700 mb-2">
                            Causa *
                        </label>
                        <input
                            type="text"
                            id="causa"
                            name="causa"
                            required
                            value={formData.causa}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                            placeholder="Causa principal de la detención..."
                        />
                    </div>

                    {/* Responsable de Cierre / Usuario Asignado */}
                    <div>
                        <label htmlFor="responsableCierre" className="block text-sm font-medium text-gray-700 mb-2">
                            Responsable del Cierre (Usuario Asignado) *
                        </label>
                        <select
                            id="responsableCierre"
                            name="responsableCierre"
                            required
                            value={formData.responsableCierre}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
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

                    {/* Causal de la Detención del Trabajo */}
                    <div className="md:col-span-2">
                        <label htmlFor="causalDetencion" className="block text-sm font-medium text-gray-700 mb-2">
                            Causal de la Detención del Trabajo *
                        </label>
                        <input
                            type="text"
                            id="causalDetencion"
                            name="causalDetencion"
                            required
                            value={formData.causalDetencion}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                            placeholder="Detalle la causal específica que motivó la detención..."
                        />
                    </div>

                    {/* Motivo de la Aplicación */}
                    <div className="md:col-span-2">
                        <label htmlFor="motivoAplicacion" className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo de la Aplicación de la Tarjeta Alto/Stop *
                        </label>
                        <select
                            id="motivoAplicacion"
                            name="motivoAplicacion"
                            required
                            value={formData.motivoAplicacion}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                        >
                            <option value="">Selecciona un motivo</option>
                            {MOTIVOS_TARJETA.map((motivo) => (
                                <option key={motivo} value={motivo}>
                                    {motivo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Otro Motivo (condicional) */}
                    {formData.motivoAplicacion === 'Otro motivo' && (
                        <div className="md:col-span-2">
                            <label htmlFor="otroMotivo" className="block text-sm font-medium text-gray-700 mb-2">
                                Especifique Otro Motivo *
                            </label>
                            <input
                                type="text"
                                id="otroMotivo"
                                name="otroMotivo"
                                required
                                value={formData.otroMotivo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                                placeholder="Describa el motivo específico..."
                            />
                        </div>
                    )}
                </div>

                {/* Descripción Detallada de la Tarjeta */}
                <div>
                    <label htmlFor="descripcionDetallada" className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción Detallada de la Tarjeta *
                    </label>
                    <textarea
                        id="descripcionDetallada"
                        name="descripcionDetallada"
                        required
                        rows={4}
                        value={formData.descripcionDetallada}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-black"
                        placeholder="Describa detalladamente la situación que motivó la aplicación de la tarjeta alto/stop..."
                    />
                </div>

                {/* Medida Correctiva */}
                <div>
                    <label htmlFor="medidaCorrectiva" className="block text-sm font-medium text-gray-700 mb-2">
                        Medida Correctiva *
                    </label>
                    <textarea
                        id="medidaCorrectiva"
                        name="medidaCorrectiva"
                        required
                        rows={3}
                        value={formData.medidaCorrectiva}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-black"
                        placeholder="Indique la medida correctiva aplicada o a aplicar..."
                    />
                </div>

                {/* Solución Implementada junto al Supervisor */}
                <div>
                    <label htmlFor="solucionImplementada" className="block text-sm font-medium text-gray-700 mb-2">
                        Solución Implementada junto al Supervisor *
                    </label>
                    <textarea
                        id="solucionImplementada"
                        name="solucionImplementada"
                        required
                        rows={4}
                        value={formData.solucionImplementada}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-black"
                        placeholder="Describa detalladamente la solución implementada en coordinación con el supervisor..."
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
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

                {/* Información adicional */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-red-900">Tarjeta Alto/Stop</h4>
                            <p className="mt-2 text-sm text-red-700">
                                La Tarjeta Alto/Stop es una herramienta de seguridad que permite detener cualquier trabajo ante la presencia de condiciones o comportamientos inseguros. Todo trabajador tiene el derecho y la obligación de detener un trabajo si identifica un riesgo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? 'Creando...' : 'Crear Tarjeta Alto/Stop'}
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
