'use client';

const COLORS: Record<string, string> = {
    ASIGNADO: '#3b82f6',
    ACEPTADO: '#06b6d4',
    RECHAZADO: '#ef4444',
    EN_CHECKLIST: '#8b5cf6',
    PENDIENTE_APROBACION: '#f97316',
    APROBADO: '#10b981',
    EN_EJECUCION: '#0ea5e9',
    COMPLETADO: '#22c55e',
    CANCELADO: '#6b7280',
};

const LABELS: Record<string, string> = {
    ASIGNADO: 'Asignado en espera de aceptación',
    ACEPTADO: 'Aceptado por operario',
    RECHAZADO: 'Rechazados totales',
    EN_CHECKLIST: 'En Checklist',
    PENDIENTE_APROBACION: 'Pend. Aprobación',
    APROBADO: 'Aprobado',
    EN_EJECUCION: 'En Ejecución',
    COMPLETADO: 'Completado por operario',
    CANCELADO: 'Cancelado',
};

interface Props {
    serviciosPorEstado: Record<string, number>;
    onChartClick?: () => void;
}

export default function ServiciosPorEstadoPieChart({ serviciosPorEstado, onChartClick }: Props) {
    const entries = Object.entries(serviciosPorEstado).filter(([k, v]) => v > 0 && k !== 'PENDIENTE');
    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    if (total === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center min-h-45">
                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-gray-400 text-sm">Sin datos de servicios</p>
            </div>
        );
    }

    const cx = 80;
    const cy = 80;
    const r = 68;
    const innerR = 36;
    const labelR = (r + innerR) / 2; // midpoint radius for labels

    let startAngle = -Math.PI / 2;

    const slices = entries.map(([estado, count]) => {
        const fraction = count / total;
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

        const labelX = cx + labelR * Math.cos(midAngle);
        const labelY = cy + labelR * Math.sin(midAngle);

        const slice = {
            estado,
            count,
            fraction,
            path,
            color: COLORS[estado] ?? '#94a3b8',
            labelX,
            labelY,
        };

        startAngle = endAngle;
        return slice;
    });

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600">Estado de Servicios</h3>
            </div>

            <div className="flex flex-col items-center">
                <div className="relative">
                    <svg
                        width="160"
                        height="160"
                        viewBox="0 0 160 160"
                        onClick={onChartClick}
                        role={onChartClick ? 'button' : undefined}
                        tabIndex={onChartClick ? 0 : undefined}
                        onKeyDown={onChartClick ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onChartClick();
                            }
                        } : undefined}
                        className={onChartClick ? 'cursor-pointer' : undefined}
                    >
                        {slices.length === 1 ? (
                            <>
                                <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
                                <circle cx={cx} cy={cy} r={innerR} fill="white" />
                            </>
                        ) : slices.map((slice) => (
                            <path
                                key={slice.estado}
                                d={slice.path}
                                fill={slice.color}
                                stroke="white"
                                strokeWidth="2"
                            >
                                <title>{LABELS[slice.estado] ?? slice.estado}: {slice.count} ({Math.round(slice.fraction * 100)}%)</title>
                            </path>
                        ))}
                        {slices.map((slice) =>
                            slice.fraction >= 0.05 ? (
                                <text
                                    key={`label-${slice.estado}`}
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
                            ) : null
                        )}
                        <text
                            x={cx}
                            y={cy - 6}
                            textAnchor="middle"
                            fontSize="20"
                            fontWeight="bold"
                            fill="#111827"
                        >
                            {total}
                        </text>
                        <text
                            x={cx}
                            y={cy + 10}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#6b7280"
                        >
                            Total
                        </text>
                    </svg>
                </div>

                {onChartClick && (
                    <p className="mt-2 text-[11px] text-gray-500 text-center">Haz clic en el gráfico para ver servicios de todos los estados</p>
                )}

                <div className="w-full mt-2 space-y-1">
                    {slices.map((slice) => (
                        <div key={slice.estado} className="flex items-center gap-2 text-xs">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: slice.color }}
                            />
                            <span className="text-gray-600 truncate flex-1">
                                {LABELS[slice.estado] ?? slice.estado}
                            </span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                                {slice.count}
                            </span>
                            <span className="text-gray-400 tabular-nums w-9 text-right">
                                {Math.round(slice.fraction * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
