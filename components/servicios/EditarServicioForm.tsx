'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operario {
    id: number;
    username: string;
    name: string | null;
}

interface Empresa {
    id: number;
    nombre: string;
}

interface Servicio {
    id: number;
    codigo: string;
    descripcion: string;
    empresaId: number | null;
    origen: string;
    destino: string;
    telefonoOrigen: string | null;
    telefonoDestino: string | null;
    operarioId: number | null;
    observaciones: string | null;
    estado: string;
}

interface EditarServicioFormProps {
    servicio: Servicio;
    operarios: Operario[];
    empresas: Empresa[];
    editMode: 'full' | 'empresa-only';
}

export default function EditarServicioForm({ servicio, operarios, empresas, editMode }: EditarServicioFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isEmpresaOnlyMode = editMode === 'empresa-only';

    // Estados del formulario inicializados con los datos del servicio
    const [codigo, setCodigo] = useState(servicio.codigo);
    const [descripcion, setDescripcion] = useState(servicio.descripcion);
    const [empresaId, setEmpresaId] = useState<number | ''>(servicio.empresaId || '');
    const [origen, setOrigen] = useState(servicio.origen);
    const [destino, setDestino] = useState(servicio.destino);
    const [telefonoOrigen, setTelefonoOrigen] = useState(servicio.telefonoOrigen || '');
    const [telefonoDestino, setTelefonoDestino] = useState(servicio.telefonoDestino || '');
    const [operarioId, setOperarioId] = useState<number | ''>(servicio.operarioId || '');
    const [observaciones, setObservaciones] = useState(servicio.observaciones || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empresaId) {
            setError('Debes seleccionar una empresa');
            return;
        }

        if (!isEmpresaOnlyMode) {
            // Validaciones de edición completa
            if (!codigo.trim()) {
                setError('El código del servicio es requerido');
                return;
            }

            if (!descripcion.trim()) {
                setError('La descripción es requerida');
                return;
            }

            if (!origen.trim()) {
                setError('El origen es requerido');
                return;
            }

            if (!destino.trim()) {
                setError('El destino es requerido');
                return;
            }

            if (!operarioId) {
                setError('Debes seleccionar un operario');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            const payload = isEmpresaOnlyMode
                ? {
                    empresaId: Number(empresaId),
                }
                : {
                    codigo,
                    descripcion,
                    empresaId: Number(empresaId),
                    origen,
                    destino,
                    telefonoOrigen: telefonoOrigen.trim() || null,
                    telefonoDestino: telefonoDestino.trim() || null,
                    operarioId: Number(operarioId),
                    observaciones: observaciones.trim() || null,
                };

            const response = await fetch(`/api/servicios/${servicio.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al editar el servicio');
            }

            // Redirigir al dashboard de servicios
            router.push('/servicios');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    if (isEmpresaOnlyMode) {
        return (
            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-sm text-blue-700">
                            Este servicio ya fue aceptado. En este estado solo puedes editar la empresa asociada.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="empresaId" className="block text-sm font-medium text-gray-700 mb-2">
                            Empresa <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="empresaId"
                            value={empresaId}
                            onChange={(e) => setEmpresaId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            required
                        >
                            <option value="">Selecciona una empresa...</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
                        {empresas.length === 0 && (
                            <p className="mt-1 text-xs text-red-600">
                                No hay empresas disponibles para asignar.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || empresas.length === 0}
                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Guardando...' : 'Guardar Empresa'}
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Código del Servicio */}
                <div>
                    <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
                        Código del Servicio <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="codigo"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="SRV-2026-001"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Código único identificador del servicio
                    </p>
                </div>

                {/* Descripción */}
                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción del Servicio <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="descripcion"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-black"
                        placeholder="Transporte de mercancía, entrega de documentos, etc..."
                        required
                    />
                </div>

                {/* Empresa */}
                <div>
                    <label htmlFor="empresaId" className="block text-sm font-medium text-gray-700 mb-2">
                        Empresa <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="empresaId"
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                    >
                        <option value="">Selecciona una empresa...</option>
                        {empresas.map((empresa) => (
                            <option key={empresa.id} value={empresa.id}>
                                {empresa.nombre}
                            </option>
                        ))}
                    </select>
                    {empresas.length === 0 && (
                        <p className="mt-1 text-xs text-red-600">
                            No hay empresas disponibles para asignar.
                        </p>
                    )}
                </div>

                {/* Origen */}
                <div>
                    <label htmlFor="origen" className="block text-sm font-medium text-gray-700 mb-2">
                        Origen <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="origen"
                        value={origen}
                        onChange={(e) => setOrigen(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="Bodega Central, Santiago"
                        required
                    />
                </div>

                {/* Teléfono de Origen */}
                <div>
                    <label htmlFor="telefonoOrigen" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono de Contacto en Origen
                    </label>
                    <input
                        type="tel"
                        id="telefonoOrigen"
                        value={telefonoOrigen}
                        onChange={(e) => setTelefonoOrigen(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="+56 9 1234 5678"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Teléfono de contacto en el punto de origen
                    </p>
                </div>

                {/* Destino */}
                <div>
                    <label htmlFor="destino" className="block text-sm font-medium text-gray-700 mb-2">
                        Destino <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="destino"
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="Sucursal Norte, La Serena"
                        required
                    />
                </div>

                {/* Teléfono de Destino */}
                <div>
                    <label htmlFor="telefonoDestino" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono de Contacto en Destino
                    </label>
                    <input
                        type="tel"
                        id="telefonoDestino"
                        value={telefonoDestino}
                        onChange={(e) => setTelefonoDestino(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="+56 9 8765 4321"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Teléfono de contacto en el punto de destino
                    </p>
                </div>

                {/* Asignar a Operario */}
                <div>
                    <label htmlFor="operarioId" className="block text-sm font-medium text-gray-700 mb-2">
                        Asignar a Operario <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="operarioId"
                        value={operarioId}
                        onChange={(e) => setOperarioId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                    >
                        <option value="">Selecciona un operario...</option>
                        {operarios.map((operario) => (
                            <option key={operario.id} value={operario.id}>
                                {operario.name || operario.username} (@{operario.username})
                            </option>
                        ))}
                    </select>
                    {operarios.length === 0 && (
                        <p className="mt-1 text-xs text-red-600">
                            No hay operarios disponibles en el sistema
                        </p>
                    )}
                </div>

                {/* Observaciones */}
                <div>
                    <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones (opcional)
                    </label>
                    <textarea
                        id="observaciones"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="Información adicional sobre el servicio..."
                    />
                </div>

                {/* Advertencia */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <strong>Importante:</strong> La edición completa está disponible solo para servicios en estado PENDIENTE o ASIGNADO.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading || operarios.length === 0 || empresas.length === 0}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
}
