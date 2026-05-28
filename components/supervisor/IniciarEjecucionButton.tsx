'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface IniciarEjecucionButtonProps {
    servicioId: number;
    codigoServicio: string;
}

export default function IniciarEjecucionButton({ servicioId, codigoServicio }: IniciarEjecucionButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handleIniciarEjecucion = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/servicios/${servicioId}/iniciar-ejecucion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar la ejecución');
            }

            // Refrescar la página
            router.refresh();
            setShowConfirm(false);
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    if (!showConfirm) {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Iniciar Ejecución
            </button>
        );
    }

    return (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            {error && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2">
                    <p className="text-xs text-red-600">{error}</p>
                </div>
            )}

            <p className="text-sm text-gray-700 mb-3">
                ¿Iniciar la ejecución del servicio <span className="font-semibold">{codigoServicio}</span>?
            </p>

            <div className="flex space-x-2">
                <button
                    onClick={handleIniciarEjecucion}
                    disabled={loading}
                    className="flex-1 inline-flex justify-center items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Iniciando...
                        </>
                    ) : (
                        'Confirmar'
                    )}
                </button>
                <button
                    onClick={() => {
                        setShowConfirm(false);
                        setError('');
                    }}
                    disabled={loading}
                    className="flex-1 inline-flex justify-center items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
