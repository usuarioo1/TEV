'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operario {
    id: number;
    username: string;
    name: string | null;
}

interface CrearServicioFormProps {
    operarios: Operario[];
}

function getSantiagoNowParts() {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
    };
}

export default function CrearServicioForm({ operarios }: CrearServicioFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados del formulario
    const [codigo, setCodigo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [telefonoOrigen, setTelefonoOrigen] = useState('');
    const [telefonoDestino, setTelefonoDestino] = useState('');
    const [operarioId, setOperarioId] = useState<number | ''>('');
    const [observaciones, setObservaciones] = useState('');

    // Generar código automático si está vacío
    const generarCodigo = () => {
        const fecha = getSantiagoNowParts();
        const codigo = `SRV-${fecha.year}-${fecha.month}${fecha.day}-${fecha.hour}${fecha.minute}`;
        setCodigo(codigo);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
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

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/servicios/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo,
                    descripcion,
                    origen,
                    destino,
                    telefonoOrigen: telefonoOrigen.trim() || null,
                    telefonoDestino: telefonoDestino.trim() || null,
                    operarioId: Number(operarioId),
                    observaciones: observaciones.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear el servicio');
            }

            // Redirigir al dashboard de servicios
            router.push('/servicios');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

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
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="codigo"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="SRV-2026-001"
                            required
                        />
                        <button
                            type="button"
                            onClick={generarCodigo}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
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

                {/* Información */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                El servicio se creará en estado <strong>ASIGNADO</strong>, por lo que el operario seleccionado podrá verlo en su dashboard y deberá aceptarlo antes de iniciar las validaciones.
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
                    disabled={loading || operarios.length === 0}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creando...' : 'Crear Servicio'}
                </button>
            </div>
        </form>
    );
}
