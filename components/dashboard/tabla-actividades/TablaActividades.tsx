'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FiltrosTabla from './FiltrosTabla';
import FilaActividad from './FilaActividad';
import type { ActividadRow, TablaFilters } from './types';

interface Props {
    /** Jefaturas y Prevencionistas pueden filtrar por cualquier empleado */
    canFilterByUser: boolean;
    /** Callback que se dispara cuando el usuario cambia el rango de fechas */
    onFechasChange?: (fechaInicio: string, fechaFin: string) => void;
    /** Callback con el total de actividades (programadas + no programadas) cada vez que cambian los datos */
    onTotalChange?: (total: number) => void;
    /** Cuando se pasa desde el padre, este componente no muestra su propio FiltrosTabla */
    externalFilters?: TablaFilters;
}

const ENCABEZADOS = [
    {
        label: 'Actividad',
        align: 'text-left',
        tooltip: 'Tipo de actividad: Caminata de Seguridad, Reporte de Peligro, Tarjeta Alto/Stop o Control ART.',
    },
    {
        label: 'Realizadas',
        align: 'text-center',
        tooltip: 'Tareas con estado COMPLETADA cuya fecha de completación fue antes o igual a la fecha límite. Fuente: TareaAsignada (caminatas: CaminataSeguridad).',
    },
    {
        label: 'Realizadas fuera de plazo',
        align: 'text-center',
        tooltip: 'Tareas con estado COMPLETADA cuya fecha de completación superó la fecha límite. Fuente: TareaAsignada (caminatas: CaminataSeguridad).',
    },
    {
        label: 'Próximas',
        align: 'text-center',
        tooltip: 'Tareas no completadas con fecha programada futura (aún sin vencer). Fuente: TareaAsignada (caminatas: CaminataSeguridad).',
    },
    {
        label: 'Atrasadas',
        align: 'text-center',
        tooltip: 'Tareas no completadas cuya fecha límite ya pasó. Fuente: TareaAsignada (caminatas: CaminataSeguridad).',
    },
    {
        label: 'Total programadas',
        align: 'text-center',
        tooltip: 'Total de tareas asignadas al usuario dentro del período (realizadas + fuera de plazo + próximas + atrasadas). Fuente: TareaAsignada.',
    },
    {
        label: 'Cumplimiento',
        align: 'text-center',
        tooltip: 'Porcentaje: realizadas ÷ total programadas × 100.',
    },
    {
        label: 'Activ. no programadas',
        align: 'text-center',
        tooltip: 'Registros independientes (sin caminata formal) creados o cerrados por el usuario. Fuente: CaminataSeguridad auto-asignada / ReportePeligro / TarjetaStop / ControlART sin caminataId.',
    },
    {
        label: 'Total actividades',
        align: 'text-center',
        tooltip: 'Total programadas + Activ. cumplidas independientes.',
    },
    {
        label: 'Cumplimiento',
        align: 'text-center',
        tooltip: 'Porcentaje: realizadas ÷ total programadas × 100.',
    },
];

export default function TablaActividades({ canFilterByUser, onFechasChange, onTotalChange, externalFilters }: Props) {
    const [rows, setRows] = useState<ActividadRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [internalFilters, setInternalFilters] = useState<TablaFilters>({
        fechaInicio: '',
        fechaFin: '',
        userId: '',
    });

    // Si hay filtros externos los usamos; si no, los internos
    const filters = externalFilters ?? internalFilters;
    const setFilters = externalFilters ? undefined : setInternalFilters;

    // Guardamos el callback en un ref para que nunca sea una dependencia reactiva
    const onFechasChangeRef = useRef(onFechasChange);
    useEffect(() => { onFechasChangeRef.current = onFechasChange; });

    const fetchData = useCallback(async (f: TablaFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (f.fechaInicio) params.set('fechaInicio', f.fechaInicio);
            if (f.fechaFin) params.set('fechaFin', f.fechaFin);
            if (f.userId) params.set('userId', f.userId);

            const res = await fetch(`/api/dashboard/tabla-actividades?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cargar datos');
            const newRows: ActividadRow[] = data.rows ?? [];
            setRows(newRows);
            const grandTotal = newRows.reduce((s, r) => s + r.totalActividades, 0);
            onTotalChange?.(grandTotal);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error inesperado');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(filters);
        onFechasChangeRef.current?.(filters.fechaInicio, filters.fechaFin);
    }, [filters, fetchData]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Cabecera */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Tabla de Actividades
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Seguimiento de actividades programadas y cumplidas por empleado
                    </p>
                </div>
                <button
                    onClick={() => fetchData(filters)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    title="Actualizar"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Actualizar
                </button>
            </div>

            {/* Filtros — solo cuando se controla internamente */}
            {!externalFilters && setFilters && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <FiltrosTabla
                        filters={filters}
                        onChange={setFilters}
                        canFilterByUser={canFilterByUser}
                    />
                </div>
            )}

            {/* Tabla */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-16 flex justify-center items-center gap-3 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                        Cargando actividades...
                    </div>
                ) : error ? (
                    <div className="py-16 text-center text-red-500 text-sm">
                        {error}
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                {ENCABEZADOS.map((h, index) => (
                                    <th
                                        key={`${h.label}-${index}`}
                                        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h.align}`}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {h.label}
                                            {h.tooltip && (
                                                <span
                                                    title={h.tooltip}
                                                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-300 text-gray-600 text-[9px] font-bold cursor-help leading-none shrink-0"
                                                >
                                                    i
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {rows.map(row => (
                                <FilaActividad key={row.tipo} row={row} />
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={ENCABEZADOS.length}
                                        className="py-12 text-center text-gray-400 text-sm"
                                    >
                                        No hay actividades para los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {rows.length > 0 && (() => {
                            const totalRealizadas = rows.reduce(
                                (s, r) => s + r.realizadas,
                                0,
                            );
                            const totalRealizadasConFueraPlazo = rows.reduce(
                                (s, r) => s + r.realizadas + r.realizadasFueraPlazo,
                                0,
                            );
                            const totalProgramadas = rows.reduce((s, r) => s + r.totalProgramadas, 0);
                            const cumplimientoPonderado = totalProgramadas > 0
                                ? Math.round((totalRealizadas / totalProgramadas) * 100)
                                : 0;
                            const cumplimientoPonderadoConFueraPlazo = totalProgramadas > 0
                                ? Math.round((totalRealizadasConFueraPlazo / totalProgramadas) * 100)
                                : 0;
                            const totalNoProgramadas = rows.reduce((s, r) => s + r.actividadesCumplidas, 0);
                            const totalActividades = rows.reduce((s, r) => s + r.totalActividades, 0);
                            const badgeColor = cumplimientoPonderado >= 80
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : cumplimientoPonderado >= 50
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-red-100 text-red-700 border-red-200';
                            const badgeColorConFueraPlazo = cumplimientoPonderadoConFueraPlazo >= 80
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : cumplimientoPonderadoConFueraPlazo >= 50
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-red-100 text-red-700 border-red-200';
                            return (
                                <tfoot>
                                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                                        <td className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Total</td>
                                        <td className="px-4 py-3" />
                                        <td className="px-4 py-3" />
                                        <td className="px-4 py-3" />
                                        <td className="px-4 py-3" />
                                        <td className="px-4 py-3" />
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                                                {cumplimientoPonderado}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center font-semibold text-purple-600">
                                            {totalNoProgramadas}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center font-semibold text-gray-800">
                                            {totalActividades}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColorConFueraPlazo}`}>
                                                {cumplimientoPonderadoConFueraPlazo}%
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            );
                        })()}
                    </table>
                )}
            </div>

            {/* Leyenda */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Realizadas: completadas dentro del plazo
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                    Fuera de plazo: completadas después del vencimiento
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    Activ. no programadas: registros independientes fuera de caminatas formales
                </span>
            </div>
        </div>
    );
}
