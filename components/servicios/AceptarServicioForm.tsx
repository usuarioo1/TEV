'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AceptarServicioForm({ servicioId }: { servicioId: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accion, setAccion] = useState<'aceptar' | 'rechazar' | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accion) {
            setError('Debes seleccionar una acción');
            return;
        }

        if (accion === 'rechazar' && !motivoRechazo.trim()) {
            setError('Debes indicar el motivo del rechazo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const endpoint = accion === 'aceptar'
                ? `/api/servicios/${servicioId}/aceptar`
                : `/api/servicios/${servicioId}/rechazar`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: accion === 'rechazar' ? JSON.stringify({ motivoRechazo }) : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al procesar la solicitud');
            }

            // Redirigir según la acción
            if (accion === 'aceptar') {
                // Forzar refresh y redirigir a checklists
                router.refresh();
                router.push(`/servicios/${servicioId}/checklists`);
            } else {
                // Si rechaza, volver a la lista de servicios
                router.refresh();
                router.push('/servicios');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Decisión
            </h2>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setAccion('aceptar');
                            setError('');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${accion === 'aceptar'
                            ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-600'
                            }`}
                    >
                        <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Aceptar Servicio
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setAccion('rechazar');
                            setError('');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${accion === 'rechazar'
                            ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-600'
                            }`}
                    >
                        <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Rechazar Servicio
                        </div>
                    </button>
                </div>
            </div>

            {/* Campo de motivo de rechazo */}
            {accion === 'rechazar' && (
                <div className="mb-6">
                    <label htmlFor="motivoRechazo" className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo del Rechazo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="motivoRechazo"
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Explica por qué no puedes realizar este servicio..."
                    />
                </div>
            )}

            {/* Botón de Confirmación */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    disabled={loading}
                >
                    Volver
                </button>
                <button
                    type="submit"
                    disabled={loading || !accion}
                    className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${accion === 'aceptar'
                        ? 'bg-green-600 hover:bg-green-700'
                        : accion === 'rechazar'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading ? 'Procesando...' : 'Confirmar'}
                </button>
            </div>
        </form>
    );
}
