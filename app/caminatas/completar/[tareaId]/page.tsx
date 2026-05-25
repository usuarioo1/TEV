'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReportePeligroForm from '@/components/caminatas/ReportePeligroForm';
import TarjetaStopForm from '@/components/caminatas/TarjetaStopForm';
import ControlCalidadARTForm from '@/components/caminatas/ControlCalidadARTForm';

interface TareaAsignada {
    id: number;
    tipo: string;
    fechaProgramada: string | null;
    fechaLimite: string | null;
    descripcion: string | null;
    estado: string;
    createdAt: string;
    asignado: { id: number; name: string | null; username: string; rol: string };
    creadoPor: { id: number; name: string | null; username: string; rol: string };
}

const TIPO_LABELS: Record<string, string> = {
    caminata: 'Caminata de Seguridad',
    reporte_peligro: 'Reporte de Peligro',
    tarjeta_stop: 'Tarjeta Alto/Stop',
    control_art: 'Control de Calidad ART',
};

function formatScheduledDate(dateStr: string | null): string {
    if (!dateStr) return 'No definida';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'No definida';
    return date.toLocaleDateString('es-CL', { timeZone: 'UTC' });
}

export default function CompletarTareaPage() {
    const router = useRouter();
    const params = useParams();
    const tareaId = params?.tareaId as string;

    const [tarea, setTarea] = useState<TareaAsignada | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [startingCaminata, setStartingCaminata] = useState(false);

    useEffect(() => {
        if (tareaId) fetchTarea();
    }, [tareaId]);

    const fetchTarea = async () => {
        try {
            const response = await fetch(`/api/tareas-asignadas/${tareaId}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Tarea no encontrada');
                if (response.status === 403) throw new Error('No tienes permisos para acceder a esta tarea');
                throw new Error('Error al cargar la tarea');
            }
            const data = await response.json();
            if (data.estado === 'COMPLETADA') {
                setError('Esta tarea ya fue completada.');
            }
            setTarea(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = async () => {
        // Mark the task as completed
        try {
            const response = await fetch(`/api/tareas-asignadas/${tareaId}`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'No se pudo completar la tarea');
            }
        } catch (err) {
            console.error('Error al marcar tarea como completada:', err);
        }
        setCompleted(true);
    };

    const handleStartCaminata = async () => {
        setStartingCaminata(true);
        setError(null);

        try {
            const response = await fetch(`/api/tareas-asignadas/${tareaId}`, {
                method: 'PATCH',
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'No se pudo crear la caminata');
            }

            window.dispatchEvent(new CustomEvent('caminataEstadoChanged'));

            if (data.caminataId) {
                router.push(`/caminatas/${data.caminataId}`);
                return;
            }

            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar caminata');
            setStartingCaminata(false);
        }
    };

    const handleCancel = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
                    <Link href="/" className="mt-4 inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Volver a Inicio
                    </Link>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Reporte completado!</h2>
                    <p className="text-gray-600 mb-6">El reporte fue enviado correctamente y la tarea ha sido marcada como completada.</p>
                    <Link href="/" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Volver a Inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a Inicio
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Completar: {tarea ? TIPO_LABELS[tarea.tipo] || tarea.tipo : ''}
                    </h1>
                </div>

                {/* Tarea info banner */}
                {tarea && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-purple-900">
                                    Tarea asignada por {tarea.creadoPor.name || tarea.creadoPor.username}
                                </p>
                                {tarea.descripcion && (
                                    <p className="text-sm text-purple-700 mt-1">
                                        <strong>Instrucciones:</strong> {tarea.descripcion}
                                    </p>
                                )}
                                {tarea.fechaProgramada && (
                                    <p className="text-xs text-purple-700 mt-1">
                                        <strong>Inicio programado:</strong> {formatScheduledDate(tarea.fechaProgramada)}
                                    </p>
                                )}
                                {tarea.fechaLimite && (
                                    <p className="text-xs text-purple-700 mt-1">
                                        <strong>Fecha límite:</strong> {formatScheduledDate(tarea.fechaLimite)}
                                    </p>
                                )}

                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                {tarea?.tipo === 'reporte_peligro' && (
                    <ReportePeligroForm
                        caminataId={null}
                        tareaId={tarea.id}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                )}
                {tarea?.tipo === 'caminata' && (
                    <div className="bg-white rounded-lg shadow p-6 border border-purple-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Iniciar Caminata</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Al iniciar esta actividad se creará la caminata y se abrirá su detalle para completar zona, faena, actividad y acompañante.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleStartCaminata}
                                disabled={startingCaminata}
                                className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                            >
                                {startingCaminata ? 'Creando caminata...' : 'Crear y Abrir Caminata'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={startingCaminata}
                                className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
                {tarea?.tipo === 'tarjeta_stop' && (
                    <TarjetaStopForm
                        caminataId={null}
                        tareaId={tarea.id}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                )}
                {tarea?.tipo === 'control_art' && (
                    <ControlCalidadARTForm
                        caminataId={null}
                        tareaId={tarea.id}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                )}
            </div>
        </div>
    );
}
