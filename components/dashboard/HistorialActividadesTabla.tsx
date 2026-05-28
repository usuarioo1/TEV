'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ActividadRow, TablaFilters } from './tabla-actividades/types';

// ─── tipos ────────────────────────────────────────────────────────────────────

type EstadoDisplay = 'en_plazo' | 'fuera_plazo' | 'atrasada' | 'proxima';

interface ProgramadaDetail {
    id: number;
    descripcion: string;
    usuario: string;
    fechaProgramada: string | null;
    fechaLimite: string | null;
    estadoDisplay: EstadoDisplay;
    urlDetalle: string | null;
}

interface NoProgramadaDetail {
    id: number;
    descripcion: string;
    usuario: string;
    fecha: string;
    estado: string;
    urlDetalle: string;
}

interface DetalleTipo {
    programadas: ProgramadaDetail[];
    noProgramadas: NoProgramadaDetail[];
}

interface HistorialData {
    rows: ActividadRow[];
    detallePorTipo: {
        caminata: DetalleTipo;
        reporte_peligro: DetalleTipo;
        tarjeta_stop: DetalleTipo;
        control_art: DetalleTipo;
    };
}

interface Props {
    canFilterByUser: boolean;
    filters: TablaFilters;
    onTotalChange?: (total: number) => void;
}

// ─── helpers visuales ─────────────────────────────────────────────────────────

const TIPO_COLORS: Record<string, string> = {
    caminata: 'border-blue-500',
    reporte_peligro: 'border-orange-500',
    tarjeta_stop: 'border-red-500',
    control_art: 'border-purple-500',
};

function EstadoDisplayBadge({ value }: { value: EstadoDisplay }) {
    const map: Record<EstadoDisplay, { label: string; cls: string }> = {
        en_plazo: { label: 'Cumplida en plazo', cls: 'bg-green-100 text-green-700 border-green-200' },
        fuera_plazo: { label: 'Cumplida fuera de plazo', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
        atrasada: { label: 'Atrasada', cls: 'bg-red-100 text-red-700 border-red-200' },
        proxima: { label: 'Próxima', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    };
    const { label, cls } = map[value];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            {label}
        </span>
    );
}

function EstadoNoProgramadaBadge({ estado }: { estado: string }) {
    const map: Record<string, string> = {
        COMPLETADA: 'bg-green-100 text-green-700 border-green-200',
        CERRADO: 'bg-green-100 text-green-700 border-green-200',
        PENDIENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        EN_PROCESO: 'bg-blue-100 text-blue-700 border-blue-200',
        EN_REVISION: 'bg-blue-100 text-blue-700 border-blue-200',
        PENDIENTE_VERIFICACION: 'bg-purple-100 text-purple-700 border-purple-200',
        COMPLETADO: 'bg-green-100 text-green-700 border-green-200',
    };
    const labels: Record<string, string> = {
        COMPLETADA: 'Completada',
        CERRADO: 'Cerrada',
        PENDIENTE: 'Pendiente',
        EN_PROCESO: 'En proceso',
        EN_REVISION: 'En revisión',
        PENDIENTE_VERIFICACION: 'Pend. verificación',
        COMPLETADO: 'Realizado',
    };
    const cls = map[estado] ?? 'bg-gray-100 text-gray-600 border-gray-200';
    const label = labels[estado] ?? estado;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            {label}
        </span>
    );
}

function PctBadge({ value }: { value: number }) {
    const color =
        value >= 80
            ? 'bg-green-100 text-green-700 border-green-200'
            : value >= 50
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-red-100 text-red-700 border-red-200';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
            {value}%
        </span>
    );
}

function formatFecha(fecha: string | null | undefined, mode: 'scheduled' | 'local' = 'local') {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(mode === 'scheduled' ? { timeZone: 'UTC' } : {}),
    });
}

// ─── subcomponente: filas expandibles ─────────────────────────────────────────

interface FilaExpandibleProps {
    row: ActividadRow;
    detalle: DetalleTipo | undefined;
}

function FilaExpandible({ row, detalle }: FilaExpandibleProps) {
    const [expanded, setExpanded] = useState(false);

    const colSpan = 10; // número de columnas de la tabla

    return (
        <>
            <tr
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setExpanded(v => !v)}
            >
                {/* Expand toggle + Actividad */}
                <td className={`px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap border-l-4 ${TIPO_COLORS[row.tipo]}`}>
                    <span className="inline-flex items-center gap-2">
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {row.nombre}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-green-700">{row.realizadas}</td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600">{row.realizadasFueraPlazo}</td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">{row.proximas}</td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">{row.atrasadas}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">{row.totalProgramadas}</td>
                <td className="px-4 py-3 text-center"><PctBadge value={row.cumplimiento} /></td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-purple-600">{row.actividadesCumplidas}</td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-gray-800">{row.totalActividades}</td>
                <td className="px-4 py-3 text-xs text-center text-gray-400">
                    {expanded ? 'Ocultar' : 'Detalles'}
                </td>
            </tr>

            {expanded && detalle && (
                <tr>
                    <td colSpan={colSpan} className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <div className="space-y-5">

                            {/* ── Programadas ── */}
                            {detalle.programadas.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                                        Programadas ({detalle.programadas.length})
                                    </h4>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha prog.</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha límite</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {detalle.programadas.map(p => (
                                                    <tr key={`prog-${p.id}`} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-gray-500">#{p.id}</td>
                                                        <td className="px-4 py-2 text-gray-900 max-w-xs truncate">{p.descripcion}</td>
                                                        <td className="px-4 py-2 text-gray-700">{p.usuario}</td>
                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatFecha(p.fechaProgramada, 'scheduled')}</td>
                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatFecha(p.fechaLimite, 'scheduled')}</td>
                                                        <td className="px-4 py-2"><EstadoDisplayBadge value={p.estadoDisplay} /></td>
                                                        <td className="px-4 py-2">
                                                            {p.urlDetalle && p.estadoDisplay !== 'proxima' && p.estadoDisplay !== 'atrasada' ? (
                                                                <Link
                                                                    href={p.urlDetalle}
                                                                    className="text-blue-600 hover:underline text-xs font-medium"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    Ver →
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-300 text-xs">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── No programadas ── */}
                            {detalle.noProgramadas.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                                        No programadas ({detalle.noProgramadas.length})
                                    </h4>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {detalle.noProgramadas.map(np => (
                                                    <tr key={`noprog-${np.id}`} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-gray-500">#{np.id}</td>
                                                        <td className="px-4 py-2 text-gray-900 max-w-xs truncate">{np.descripcion}</td>
                                                        <td className="px-4 py-2 text-gray-700">{np.usuario}</td>
                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatFecha(np.fecha)}</td>
                                                        <td className="px-4 py-2"><EstadoNoProgramadaBadge estado={np.estado} /></td>
                                                        <td className="px-4 py-2">
                                                            <Link
                                                                href={np.urlDetalle}
                                                                className="text-blue-600 hover:underline text-xs font-medium"
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                Ver →
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {detalle.programadas.length === 0 && detalle.noProgramadas.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    Sin registros para los filtros seleccionados
                                </p>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── componente principal ─────────────────────────────────────────────────────

const ENCABEZADOS = [
    { label: 'Actividad', align: 'text-left' },
    { label: 'Realizadas', align: 'text-center' },
    { label: 'Fuera de plazo', align: 'text-center' },
    { label: 'Próximas', align: 'text-center' },
    { label: 'Atrasadas', align: 'text-center' },
    { label: 'Total prog.', align: 'text-center' },
    { label: 'Cumplimiento', align: 'text-center' },
    { label: 'No programadas', align: 'text-center' },
    { label: 'Total actividades', align: 'text-center' },
    { label: '', align: 'text-center' },
];

export default function HistorialActividadesTabla({ canFilterByUser: _canFilterByUser, filters, onTotalChange }: Props) {
    const [data, setData] = useState<HistorialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (f: TablaFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (f.fechaInicio) params.set('fechaInicio', f.fechaInicio);
            if (f.fechaFin) params.set('fechaFin', f.fechaFin);
            if (f.userId) params.set('userId', f.userId);

            const res = await fetch(`/api/dashboard/tabla-actividades?${params}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error al cargar datos');
            setData(json);
            const grandTotal = (json.rows as ActividadRow[]).reduce((s, r) => s + r.totalActividades, 0);
            onTotalChange?.(grandTotal);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error inesperado');
        } finally {
            setLoading(false);
        }
    }, [onTotalChange]);

    useEffect(() => {
        fetchData(filters);
    }, [filters, fetchData]);

    const grandTotals = data?.rows.reduce(
        (acc, r) => ({
            realizadas: acc.realizadas + r.realizadas,
            realizadasFueraPlazo: acc.realizadasFueraPlazo + r.realizadasFueraPlazo,
            proximas: acc.proximas + r.proximas,
            atrasadas: acc.atrasadas + r.atrasadas,
            totalProgramadas: acc.totalProgramadas + r.totalProgramadas,
            actividadesCumplidas: acc.actividadesCumplidas + r.actividadesCumplidas,
            totalActividades: acc.totalActividades + r.totalActividades,
        }),
        { realizadas: 0, realizadasFueraPlazo: 0, proximas: 0, atrasadas: 0, totalProgramadas: 0, actividadesCumplidas: 0, totalActividades: 0 },
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Cabecera */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Historial de Actividades</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Mismos totales que la Tabla de Actividades · haz clic en una fila para ver los registros individuales
                    </p>
                </div>
                <button
                    onClick={() => fetchData(filters)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    title="Actualizar"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualizar
                </button>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-16 flex justify-center items-center gap-3 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                        Cargando historial...
                    </div>
                ) : error ? (
                    <div className="py-16 text-center text-red-500 text-sm">{error}</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                {ENCABEZADOS.map((h, i) => (
                                    <th
                                        key={i}
                                        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h.align}`}
                                    >
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {data?.rows.map(row => (
                                <FilaExpandible
                                    key={row.tipo}
                                    row={row}
                                    detalle={data.detallePorTipo?.[row.tipo as keyof typeof data.detallePorTipo]}
                                />
                            ))}
                            {(!data?.rows || data.rows.length === 0) && (
                                <tr>
                                    <td colSpan={ENCABEZADOS.length} className="py-12 text-center text-gray-400 text-sm">
                                        No hay actividades para los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {grandTotals && data && data.rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                                    <td className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                                    <td className="px-4 py-3 text-sm text-center text-green-700">{grandTotals.realizadas}</td>
                                    <td className="px-4 py-3 text-sm text-center text-orange-600">{grandTotals.realizadasFueraPlazo}</td>
                                    <td className="px-4 py-3 text-sm text-center text-blue-600">{grandTotals.proximas}</td>
                                    <td className="px-4 py-3 text-sm text-center text-red-600">{grandTotals.atrasadas}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">{grandTotals.totalProgramadas}</td>
                                    <td className="px-4 py-3 text-center">
                                        <PctBadge value={grandTotals.totalProgramadas > 0
                                            ? Math.round((grandTotals.realizadas / grandTotals.totalProgramadas) * 100)
                                            : 0}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-purple-600">{grandTotals.actividadesCumplidas}</td>
                                    <td className="px-4 py-3 text-base text-center font-bold text-gray-900">{grandTotals.totalActividades}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
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
