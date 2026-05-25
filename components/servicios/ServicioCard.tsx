'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ESTADO_COLORS, ESTADO_LABELS, ESTADO_VISUAL_VOLVER_A_ENVIAR } from '@/lib/servicio-utils';
import { useSession } from '@/app/context/SessionContext';

interface ServicioCardProps {
    servicio: {
        id: number;
        codigo: string;
        fechaAsignacion: string | Date;
        estado: string;
        requiereReenvio?: boolean;
        origen: string;
        destino: string;
        telefonoOrigen?: string | null;
        telefonoDestino?: string | null;
        descripcion?: string | null;
        coordinadorId?: number | null;
        checklistEquipo?: { completado?: boolean | null } | null;
        checklistTractoCamion?: { completado?: boolean | null } | null;
        checklistFatiga?: { completado?: boolean | null } | null;
        analisisRiesgo?: { completado?: boolean | null } | null;
        operario?: { name?: string | null; username?: string | null } | null;
        coordinador?: { name?: string | null; username?: string | null } | null;
    };
}

export default function ServicioCard({ servicio }: ServicioCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { session } = useSession();
    const userRole = session?.rol ?? '';
    const userId = session?.id ?? null;
    const estadoVisual = servicio.requiereReenvio
        ? ESTADO_VISUAL_VOLVER_A_ENVIAR
        : servicio.estado;
    const estadoLabel = ESTADO_LABELS[estadoVisual as keyof typeof ESTADO_LABELS];
    const estadoColor = ESTADO_COLORS[estadoVisual as keyof typeof ESTADO_COLORS];

    const handleIniciarEjecucion = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/servicios/${servicio.id}/iniciar-ejecucion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al iniciar la ejecución');
            }

            router.refresh();
        } catch (error) {
            console.error('Error:', error);
            alert(error instanceof Error ? error.message : 'Error al iniciar la ejecución');
        } finally {
            setLoading(false);
        }
    };

    // Determinar la acción principal
    const getAccionPrincipal = () => {
        switch (estadoVisual) {
            case 'ASIGNADO':
                // Solo los operarios pueden aceptar servicios
                if (userRole === 'operario') {
                    return { texto: 'Aceptar Servicio', href: `/servicios/${servicio.id}/aceptar`, color: 'bg-blue-600 hover:bg-blue-700', type: 'link' };
                }
                // Coordinadores y otros solo ven detalles
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
            case 'ACEPTADO':
                // Solo operarios inician checklists
                if (userRole === 'operario') {
                    return { texto: 'Iniciar Checklists', href: `/servicios/${servicio.id}/checklists`, color: 'bg-green-600 hover:bg-green-700', type: 'link' };
                }
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
            case 'EN_CHECKLIST':
                // Solo operarios continúan checklists
                if (userRole === 'operario') {
                    return { texto: 'Continuar Checklists', href: `/servicios/${servicio.id}/checklists`, color: 'bg-yellow-600 hover:bg-yellow-700', type: 'link' };
                }
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
            case 'VOLVER_A_ENVIAR':
                if (userRole === 'operario') {
                    return { texto: 'Volver a Enviar', href: `/servicios/${servicio.id}/checklists`, color: 'bg-red-600 hover:bg-red-700', type: 'link' };
                }
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
            case 'APROBADO':
                // Solo operarios pueden iniciar la ejecución
                if (userRole === 'operario') {
                    return { texto: 'Iniciar Ejecución', color: 'bg-emerald-600 hover:bg-emerald-700', type: 'button', onClick: handleIniciarEjecucion };
                }
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
            case 'EN_EJECUCION':
                return { texto: 'Ver Ejecución', href: `/servicios/${servicio.id}`, color: 'bg-indigo-600 hover:bg-indigo-700', type: 'link' };
            case 'COMPLETADO':
                return { texto: 'Ver Servicio Completado', href: `/servicios/${servicio.id}`, color: 'bg-blue-600 hover:bg-blue-700', type: 'link' };
            case 'PENDIENTE_APROBACION':
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
            default:
                return { texto: 'Ver Detalles', href: `/servicios/${servicio.id}`, color: 'bg-gray-600 hover:bg-gray-700', type: 'link' };
        }
    };

    const accion = getAccionPrincipal();

    // Determinar si mostrar botón de editar
    const puedeEditar = () => {
        // Estados editables
        const estadosEditables = ['PENDIENTE', 'ASIGNADO'];
        if (!estadosEditables.includes(servicio.estado)) return false;

        // Solo coordinadores y jefaturas pueden editar
        if (userRole !== 'coordinador' && userRole !== 'jefaturas') return false;

        // Jefaturas pueden editar cualquier servicio
        if (userRole === 'jefaturas') return true;

        // Coordinadores solo pueden editar sus propios servicios
        return servicio.coordinadorId === userId;
    };

    const mostrarBotonEditar = puedeEditar();

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {servicio.codigo}
                        </h3>
                        <p className="text-sm text-gray-500">
                            Asignado el {new Date(servicio.fechaAsignacion).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                timeZone: 'America/Santiago',
                            })}
                        </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor}`}>
                        {estadoLabel}
                    </span>
                </div>

                {/* Ruta */}
                <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                        <div className="flex-1">
                            <p className="text-gray-500 mb-1">Origen</p>
                            <p className="font-medium text-gray-900">{servicio.origen}</p>
                            {servicio.telefonoOrigen && (
                                <a href={`tel:${servicio.telefonoOrigen}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1">
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {servicio.telefonoOrigen}
                                </a>
                            )}
                        </div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-gray-500 mb-1">Destino</p>
                            <p className="font-medium text-gray-900">{servicio.destino}</p>
                            {servicio.telefonoDestino && (
                                <a href={`tel:${servicio.telefonoDestino}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1">
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {servicio.telefonoDestino}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Descripción */}
                {servicio.descripcion && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {servicio.descripcion}
                    </p>
                )}

                {/* Progress Indicators */}
                <div className="mb-4 space-y-2">
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className={`h-4 w-4 mr-2 ${servicio.checklistEquipo?.completado ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Checklist de Equipo</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className={`h-4 w-4 mr-2 ${servicio.checklistTractoCamion?.completado ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Checklist de Tracto Camión</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className={`h-4 w-4 mr-2 ${servicio.checklistFatiga?.completado ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Checklist de Fatiga</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className={`h-4 w-4 mr-2 ${servicio.analisisRiesgo?.completado ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Análisis de Riesgo (AST/ART)</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    {accion.type === 'button' ? (
                        <button
                            onClick={accion.onClick}
                            disabled={loading}
                            className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${accion.color} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Iniciando...
                                </>
                            ) : (
                                accion.texto
                            )}
                        </button>
                    ) : (
                        <Link
                            href={accion.href || '#'}
                            className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${accion.color} transition-colors`}
                        >
                            {accion.texto}
                        </Link>
                    )}
                    {/* Mostrar botón de Detalles solo si el botón principal no es "Ver Detalles" */}
                    {accion.texto !== 'Ver Detalles' && (
                        <Link
                            href={`/servicios/${servicio.id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Detalles
                        </Link>
                    )}
                    {/* Botón de Editar - Solo visible para coordinadores y jefaturas en estados editables */}
                    {mostrarBotonEditar && (
                        <Link
                            href={`/servicios/${servicio.id}/editar`}
                            className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                        </Link>
                    )}
                </div>

                {/* Coordinator & Operario Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                    {servicio.operario && (
                        <p className="text-xs text-gray-500">
                            Operario: <span className="font-medium text-gray-700">{servicio.operario?.name || servicio.operario?.username}</span>
                        </p>
                    )}
                    {servicio.coordinador && (
                        <p className="text-xs text-gray-500">
                            Coordinado por: <span className="font-medium text-gray-700">{servicio.coordinador?.name || servicio.coordinador?.username}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
