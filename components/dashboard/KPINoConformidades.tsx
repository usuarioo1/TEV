'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RolStats {
    total: number;
    abierta: number;
    cerrada: number;
}

interface NoConformidadesGestionData {
    total: number;
    abierta: number;
    cerrada: number;
    porRol: Record<string, RolStats>;
}

const ROL_LABELS: Record<string, string> = {
    taller: 'Taller',
    coordinador: 'Coordinador',
    prevencionista: 'Prevencionista',
};

interface DonutSlice {
    label: string;
    count: number;
    color: string;
    fraction: number;
    path: string;
    labelX: number;
    labelY: number;
}

function buildDonutSlices(
    rawSlices: { label: string; count: number; color: string }[],
    total: number,
): DonutSlice[] {
    const cx = 80;
    const cy = 80;
    const r = 68;
    const innerR = 36;
    const labelR = (r + innerR) / 2;
    const slices: DonutSlice[] = [];
    let startAngle = -Math.PI / 2;

    for (const s of rawSlices.filter((s) => s.count > 0)) {
        const fraction = total > 0 ? s.count / total : 0;
        const sweepAngle = 2 * Math.PI * fraction;
        const endAngle = startAngle + sweepAngle;
        const midAngle = startAngle + sweepAngle / 2;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(endAngle);
        const iy1 = cy + innerR * Math.sin(endAngle);
        const ix2 = cx + innerR * Math.cos(startAngle);
        const iy2 = cy + innerR * Math.sin(startAngle);
        const largeArc = sweepAngle > Math.PI ? 1 : 0;

        const path =
            `M ${x1.toFixed(3)} ${y1.toFixed(3)} ` +
            `A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} ` +
            `L ${ix1.toFixed(3)} ${iy1.toFixed(3)} ` +
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(3)} ${iy2.toFixed(3)} Z`;

        slices.push({
            ...s,
            fraction,
            path,
            labelX: cx + labelR * Math.cos(midAngle),
            labelY: cy + labelR * Math.sin(midAngle),
        });

        startAngle = endAngle;
    }

    return slices;
}

const CX = 80;
const CY = 80;
const INNER_R = 36;

interface KPINoConformidadesProps {
    fechaDesde?: string;
    fechaHasta?: string;
    empresaId?: string;
}

export default function KPINoConformidades({ fechaDesde, fechaHasta, empresaId }: KPINoConformidadesProps = {}) {
    const [data, setData] = useState<NoConformidadesGestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (fechaDesde) params.set('fechaInicio', fechaDesde);
        if (fechaHasta) params.set('fechaFin', fechaHasta);
        if (empresaId) params.set('empresaId', empresaId);
        const url = params.toString()
            ? `/api/dashboard/no-conformidades-gestion?${params}`
            : '/api/dashboard/no-conformidades-gestion';
        fetch(url)
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                return res.json();
            })
            .then((d) => { setData(d); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    }, [fechaDesde, fechaHasta, empresaId]);

    const slices = data
        ? buildDonutSlices(
            [
                { label: 'Abiertas', count: data.abierta, color: '#ef4444' },
                { label: 'Cerradas', count: data.cerrada, color: '#22c55e' },
            ],
            data.total,
        )
        : [];

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">No Conformidades (Gestión)</h3>
                <Link
                    href="/no-conformidades"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                    Ver todas →
                </Link>
            </div>

            {loading ? (
                <div className="py-6 text-center text-sm text-gray-400">Cargando...</div>
            ) : error ? (
                <div className="py-6 text-center text-sm text-red-500">{error}</div>
            ) : !data ? null : (
                <>
                    {/* Donut chart */}
                    <div className="flex flex-col items-center">
                        {data.total === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-sm">
                                Sin no conformidades registradas
                            </div>
                        ) : (
                            <svg width="160" height="160" viewBox="0 0 160 160">
                                {slices.length === 1 ? (
                                    <>
                                        <circle cx={CX} cy={CY} r={68} fill={slices[0].color} />
                                        <circle cx={CX} cy={CY} r={INNER_R} fill="white" />
                                    </>
                                ) : (
                                    slices.map((slice) => (
                                        <path
                                            key={slice.label}
                                            d={slice.path}
                                            fill={slice.color}
                                            stroke="white"
                                            strokeWidth="2"
                                        >
                                            <title>{slice.label}: {slice.count} ({Math.round(slice.fraction * 100)}%)</title>
                                        </path>
                                    ))
                                )}
                                {slices.map((slice) =>
                                    slice.fraction >= 0.05 ? (
                                        <text
                                            key={`lbl-${slice.label}`}
                                            x={slice.labelX.toFixed(2)}
                                            y={slice.labelY.toFixed(2)}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="9"
                                            fontWeight="bold"
                                            fill="white"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {Math.round(slice.fraction * 100)}%
                                        </text>
                                    ) : null,
                                )}
                                {/* Centro: total */}
                                <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#111827">
                                    {data.total}
                                </text>
                                <text x={CX} y={CY + 13} textAnchor="middle" fontSize="9" fill="#6b7280">
                                    total
                                </text>
                            </svg>
                        )}

                        {/* Leyenda de estados */}
                        <div className="flex flex-wrap justify-center gap-3 mt-2 mb-4">
                            {[
                                { label: 'Abiertas', count: data.abierta, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-100' },
                                { label: 'Cerradas', count: data.cerrada, color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-100' },
                            ].map((item) => (
                                <span
                                    key={item.label}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.bg} ${item.text}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${item.color} inline-block`} />
                                    {item.label}: {item.count} ({data.total > 0 ? Math.round((item.count / data.total) * 100) : 0}%)
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Desglose por rol */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        {['taller', 'coordinador', 'prevencionista'].map((rol) => {
                            const stats = data.porRol[rol];
                            if (!stats) return null;
                            return (
                                <div key={rol} className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-gray-700 w-28">{ROL_LABELS[rol]}</span>
                                    <div className="flex gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">{stats.abierta}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">{stats.cerrada}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                            <span />
                            <div className="flex gap-2">
                                <span>Abiertas</span>
                                <span>Cerradas</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
