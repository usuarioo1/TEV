import { Info } from 'lucide-react';
import { useState } from 'react';

interface KPIEquiposCondicionesProps {
    titulo: string;
    porcentaje: number;
    equiposConProblemas: number;
    totalChecklists: number;
    descripcion: string;
    onChartClick?: () => void;
}

export default function KPIEquiposCondiciones({
    titulo,
    porcentaje,
    equiposConProblemas,
    totalChecklists,
    descripcion,
    onChartClick,
}: KPIEquiposCondicionesProps) {
    const [showInfo, setShowInfo] = useState(false);

    const enCondiciones = totalChecklists - equiposConProblemas;
    const conProblemas = equiposConProblemas;

    // Donut SVG
    const cx = 80;
    const cy = 80;
    const r = 68;
    const innerR = 36;
    const labelR = (r + innerR) / 2;

    const slices: { label: string; count: number; color: string; fraction: number; path: string; labelX: number; labelY: number }[] = [];

    const rawSlices = [
        { label: 'En condiciones', count: enCondiciones, color: '#22c55e' },
        { label: 'Con no conformidades', count: conProblemas, color: '#ef4444' },
    ].filter(s => s.count > 0);

    let startAngle = -Math.PI / 2;
    for (const s of rawSlices) {
        const fraction = totalChecklists > 0 ? s.count / totalChecklists : 0;
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

    const metaColor = porcentaje >= 90 ? 'text-teal-600' : porcentaje >= 80 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">{titulo}</h3>
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-teal-500 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">{descripcion}</p>
                    <p className="font-semibold mb-1">Criterio de evaluación:</p>
                    <p className="mb-2">Cada checklist contiene items evaluados como: <span className="font-mono bg-gray-800 px-1 rounded">"SI"</span> (conforme), <span className="font-mono bg-gray-800 px-1 rounded">"NO"</span> (no conforme) u <span className="font-mono bg-gray-800 px-1 rounded">"OB"</span> (observación). Un equipo está &quot;en condiciones&quot; si <span className="font-semibold">ningún item tiene valor &quot;NO&quot;</span>.</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se consulta la tabla correspondiente al tipo de equipo, contando los que tienen <span className="font-mono bg-gray-800 px-1 rounded">equipoEnCondiciones = true</span> sobre el total de checklists completados. Meta: &gt;90%.</p>
                </div>
            )}

            {totalChecklists === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-sm">
                    Sin checklists registrados
                </div>
            ) : (
                <div className="flex flex-col items-center">
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
                                key={slice.label}
                                d={slice.path}
                                fill={slice.color}
                                stroke="white"
                                strokeWidth="2"
                            >
                                <title>{slice.label}: {slice.count} ({Math.round(slice.fraction * 100)}%)</title>
                            </path>
                        ))}
                        {slices.map((slice) =>
                            slice.fraction >= 0.05 ? (
                                <text
                                    key={`label-${slice.label}`}
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
                        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#111827">
                            {porcentaje}%
                        </text>
                        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6b7280">
                            Meta &gt;90%
                        </text>
                    </svg>

                    {onChartClick && (
                        <p className="mt-2 text-[11px] text-gray-500 text-center">Haz clic en el gráfico para ver servicios con no conformidades</p>
                    )}

                    <div className="w-full mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#22c55e' }} />
                            <span className="text-gray-600 flex-1">En condiciones</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{enCondiciones}</span>
                            <span className={`tabular-nums w-9 text-right font-bold ${metaColor}`}>{porcentaje}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#ef4444' }} />
                            <span className="text-gray-600 flex-1">Con no conformidades</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{conProblemas}</span>
                            <span className="text-red-600 tabular-nums w-9 text-right">{totalChecklists > 0 ? Math.round((conProblemas / totalChecklists) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
