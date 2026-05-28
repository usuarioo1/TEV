'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Servicio } from './operaciones/types';

interface OperacionesResponse {
    servicios: Servicio[];
    total: number;
}

interface OperacionesServiciosCardProps {
    fechaDesde?: string;
    fechaHasta?: string;
    empresaId?: string;
    estadoFiltro?: string;
    onEstadoFiltroChange?: (estado: string) => void;
}

export default function OperacionesServiciosCard({
    fechaDesde = '',
    fechaHasta = '',
    empresaId = '',
    estadoFiltro,
    onEstadoFiltroChange,
}: OperacionesServiciosCardProps) {
    const router = useRouter();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [estadoFiltroInterno, setEstadoFiltroInterno] = useState('TODOS');
    const estadoFiltroActual = estadoFiltro ?? estadoFiltroInterno;

    const setEstadoFiltroActual = (nuevoEstado: string) => {
        if (onEstadoFiltroChange) {
            onEstadoFiltroChange(nuevoEstado);
            return;
        }

        setEstadoFiltroInterno(nuevoEstado);
    };

    useEffect(() => {
        fetchServicios();
    }, [fechaDesde, fechaHasta, empresaId, estadoFiltroActual]);

    const fetchServicios = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fechaDesde) params.append('fechaDesde', fechaDesde);
            if (fechaHasta) params.append('fechaHasta', fechaHasta);
            if (empresaId) params.append('empresaId', empresaId);
            if (estadoFiltroActual) params.append('estado', estadoFiltroActual);

            const response = await fetch(`/api/servicios/todos?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar servicios');

            const data: OperacionesResponse = await response.json();
            setServicios(data.servicios);
            setError(null);
        } catch (err) {
            setError('Error al cargar servicios');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadgeColor = (estado: string) => {
        const colores: Record<string, string> = {
            'ASIGNADO': 'bg-blue-100 text-blue-800',
            'ACEPTADO': 'bg-cyan-100 text-cyan-800',
            'RECHAZADO': 'bg-red-100 text-red-800',
            'PENDIENTE_APROBACION': 'bg-yellow-100 text-yellow-800',
            'APROBADO': 'bg-green-100 text-green-800',
            'EN_EJECUCION': 'bg-purple-100 text-purple-800',
            'COMPLETADO': 'bg-gray-100 text-gray-800',
        };
        return colores[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoTexto = (estado: string) => {
        const textos: Record<string, string> = {
            'ASIGNADO': 'Asignado',
            'ACEPTADO': 'Aceptado',
            'RECHAZADO': 'Rechazado',
            'PENDIENTE_APROBACION': 'Pendiente Aprobación',
            'APROBADO': 'Aprobado',
            'EN_EJECUCION': 'En Ejecución',
            'COMPLETADO': 'Completado',
        };
        return textos[estado] || estado;
    };

    const verDetalle = (servicioId: number) => {
        router.push(`/dashboard/operaciones/${servicioId}`);
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Todas las Operaciones</h2>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={estadoFiltroActual}
                            onChange={(e) => setEstadoFiltroActual(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="ASIGNADO">Asignado</option>
                            <option value="ACEPTADO">Aceptado</option>
                            <option value="RECHAZADO">Rechazado</option>
                            <option value="PENDIENTE_APROBACION">Pendiente Aprobación</option>
                            <option value="APROBADO">Aprobado</option>
                            <option value="EN_EJECUCION">En Ejecución</option>
                            <option value="COMPLETADO">Completado</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setEstadoFiltroActual('TODOS');
                            }}
                            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Limpiar estado
                        </button>
                    </div>
                </div>

                {(fechaDesde || fechaHasta || empresaId) && (
                    <div className="mb-4 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2 inline-flex items-center gap-2">
                        <span className="font-semibold">Filtros globales activos:</span>
                        {(fechaDesde || fechaHasta) && (
                            <span>
                                {fechaDesde && fechaHasta
                                    ? `${fechaDesde} -> ${fechaHasta}`
                                    : fechaDesde
                                        ? `Desde ${fechaDesde}`
                                        : `Hasta ${fechaHasta}`}
                            </span>
                        )}
                        {empresaId && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                Empresa seleccionada
                            </span>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Cargando servicios...</p>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchServicios}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            ) : servicios.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No se encontraron servicios</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Asignación</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checklists</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {servicios.map((servicio) => (
                                <tr key={servicio.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-sm font-mono text-gray-900">{servicio.codigo}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-900">{servicio.descripcion}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-sm text-gray-700">{servicio.empresa?.nombre || 'Sin empresa'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-600">
                                            {servicio.origen} → {servicio.destino}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">
                                            {servicio.operario?.name || servicio.operario?.username || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadgeColor(servicio.estado)}`}>
                                            {getEstadoTexto(servicio.estado)}
                                        </span>
                                        {servicio.problemas.length > 0 && (
                                            <span className="ml-1 text-red-500" title={servicio.problemas.join(', ')}>⚠</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-sm text-gray-600">
                                            {new Date(servicio.fechaAsignacion).toLocaleDateString('es-ES', { timeZone: 'America/Santiago' })}
                                        </span>
                                        <br />
                                        <span className="text-xs text-gray-400">
                                            {new Date(servicio.fechaAsignacion).toLocaleTimeString('es-ES', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-600">{servicio.porcentajeCompletado}%</span>
                                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${servicio.porcentajeCompletado}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button
                                            onClick={() => verDetalle(servicio.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                        >
                                            Ver Detalle →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && servicios.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                    Total: {servicios.length} servicio{servicios.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
