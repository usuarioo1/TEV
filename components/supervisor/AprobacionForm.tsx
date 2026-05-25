'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AprobacionFormProps {
    servicioId: number;
}

type Accion = 'aprobar' | 'rechazar' | null;

export default function AprobacionForm({ servicioId }: AprobacionFormProps) {
    const router = useRouter();
    const [accion, setAccion] = useState<Accion>(null);
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accion) {
            setError('Debes seleccionar una acción (aprobar o rechazar)');
            return;
        }

        if (accion === 'rechazar' && !observaciones.trim()) {
            setError('Debes proporcionar un motivo para el rechazo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const endpoint = accion === 'aprobar'
                ? `/api/servicios/${servicioId}/aprobar-supervisor`
                : `/api/servicios/${servicioId}/rechazar-supervisor`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    observaciones: observaciones.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al procesar la solicitud');
            }

            // Redirigir al dashboard de supervisor
            router.push('/supervisor');
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Decisión de Aprobación
            </h3>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Selección de Acción */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        ¿Qué acción deseas realizar?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setAccion('aprobar')}
                            className={`p-4 border-2 rounded-lg transition-all ${accion === 'aprobar'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                                }`}
                        >
                            <div className="flex items-center justify-center mb-2">
                                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900">Aprobar Servicio</p>
                            <p className="text-xs text-gray-500 mt-1">
                                El servicio puede ejecutarse
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setAccion('rechazar')}
                            className={`p-4 border-2 rounded-lg transition-all ${accion === 'rechazar'
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-red-300'
                                }`}
                        >
                            <div className="flex items-center justify-center mb-2">
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900">Rechazar Servicio</p>
                            <p className="text-xs text-gray-500 mt-1">
                                No cumple con los requisitos
                            </p>
                        </button>
                    </div>
                </div>

                {/* Observaciones */}
                <div className="mb-6">
                    <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones {accion === 'rechazar' && <span className="text-red-600">*</span>}
                    </label>
                    <textarea
                        id="observaciones"
                        rows={4}
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder={
                            accion === 'rechazar'
                                ? 'Describe los motivos del rechazo y las acciones correctivas requeridas...'
                                : 'Observaciones adicionales (opcional)...'
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                        required={accion === 'rechazar'}
                    />
                    {accion === 'rechazar' && (
                        <p className="mt-1 text-xs text-gray-500">
                            Es obligatorio proporcionar un motivo detallado para el rechazo
                        </p>
                    )}
                </div>

                {/* Confirmación y Botones */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => router.push('/supervisor')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={loading || !accion}
                        className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors ${loading || !accion
                            ? 'bg-gray-400 cursor-not-allowed'
                            : accion === 'aprobar'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </span>
                        ) : accion === 'aprobar' ? (
                            '✓ Aprobar Servicio'
                        ) : accion === 'rechazar' ? (
                            '✗ Rechazar Servicio'
                        ) : (
                            'Selecciona una Acción'
                        )}
                    </button>
                </div>
            </form>

            {/* Nota de Seguridad */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex">
                    <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-blue-900">Importante</p>
                        <p className="text-xs text-blue-700 mt-1">
                            Esta decisión quedará registrada en el sistema y se notificará al operario y coordinador.
                            {accion === 'aprobar' && ' El servicio pasará a estado APROBADO y podrá ser ejecutado.'}
                            {accion === 'rechazar' && ' El servicio será rechazado y el operario deberá tomar acciones correctivas.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
