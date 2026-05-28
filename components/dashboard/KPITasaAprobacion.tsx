import { Info } from 'lucide-react';
import { useState } from 'react';

interface KPITasaAprobacionProps {
    porcentaje: number;
    totalAprobaciones: number;
    aprobados: number;
    rechazados: number;
    onChartClick?: () => void;
}

export default function KPITasaAprobacion({ porcentaje, totalAprobaciones, aprobados, rechazados, onChartClick }: KPITasaAprobacionProps) {
    const [showInfo, setShowInfo] = useState(false);

    const cx = 80, cy = 80, r = 68, innerR = 36;
    const labelR = (r + innerR) / 2;

    const estadoAprobacion = [
        { label: 'Aprobados por supervisor', count: aprobados, color: '#22c55e' },
        { label: 'Rechazados por supervisor', count: rechazados, color: '#ef4444' },
    ];
    const rawSlices = estadoAprobacion.filter(s => s.count > 0);

    const slices: { label: string; count: number; color: string; fraction: number; path: string; labelX: number; labelY: number }[] = [];
    let startAngle = -Math.PI / 2;
    for (const s of rawSlices) {
        const fraction = totalAprobaciones > 0 ? s.count / totalAprobaciones : 0;
        const sweepAngle = 2 * Math.PI * fraction;
        const endAngle = startAngle + sweepAngle;
        const midAngle = startAngle + sweepAngle / 2;
        const largeArc = sweepAngle > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(endAngle), iy1 = cy + innerR * Math.sin(endAngle);
        const ix2 = cx + innerR * Math.cos(startAngle), iy2 = cy + innerR * Math.sin(startAngle);
        const path =
            `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} ` +
            `L ${ix1.toFixed(3)} ${iy1.toFixed(3)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(3)} ${iy2.toFixed(3)} Z`;
        slices.push({ ...s, fraction, path, labelX: cx + labelR * Math.cos(midAngle), labelY: cy + labelR * Math.sin(midAngle) });
        startAngle = endAngle;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">Tasa de Aprobación</h3>
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">Porcentaje de decisiones de supervisor sobre checklists de fatiga que terminaron aprobadas. El universo incluye solo servicios con decisión de supervisor (aprobado o rechazado).</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se consulta <span className="font-mono bg-gray-800 px-1 rounded">ChecklistFatiga</span> con <span className="font-mono bg-gray-800 px-1 rounded">completado = true</span> y servicios con registro en <span className="font-mono bg-gray-800 px-1 rounded">AprobacionSupervisor</span>. El rango de fechas se aplica sobre <span className="font-mono bg-gray-800 px-1 rounded">Servicio.createdAt</span>, por lo que la decisión del supervisor cuenta aunque el checklist se haya contestado después. Aprobados son <span className="font-mono bg-gray-800 px-1 rounded">aprobado = true</span> y rechazados <span className="font-mono bg-gray-800 px-1 rounded">aprobado = false</span>.</p>
                </div>
            )}
            {totalAprobaciones === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-sm">Sin checklists de fatiga contestados</div>
            ) : (
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={onChartClick}
                        disabled={!onChartClick}
                        className={`rounded-xl transition-colors ${onChartClick ? 'cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-2' : ''}`}
                    >
                        <svg width="160" height="160" viewBox="0 0 160 160">
                            {slices.length === 1 ? (
                                <>
                                    <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
                                    <circle cx={cx} cy={cy} r={innerR} fill="white" />
                                </>
                            ) : slices.map(slice => (
                                <path key={slice.label} d={slice.path} fill={slice.color} stroke="white" strokeWidth="2">
                                    <title>{slice.label}: {slice.count} ({Math.round(slice.fraction * 100)}%)</title>
                                </path>
                            ))}
                            {slices.map(slice =>
                                slice.fraction >= 0.05 ? (
                                    <text key={`lbl-${slice.label}`} x={slice.labelX.toFixed(2)} y={slice.labelY.toFixed(2)}
                                        textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold"
                                        fill="white" style={{ pointerEvents: 'none' }}>
                                        {Math.round(slice.fraction * 100)}%
                                    </text>
                                ) : null
                            )}
                            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#111827">{porcentaje}%</text>
                            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6b7280">Meta &gt;90%</text>
                        </svg>
                    </button>
                    {onChartClick && (
                        <p className="text-[11px] text-indigo-600 mt-1">Clic en el gráfico para ver servicios</p>
                    )}
                    <div className="w-full mt-2 space-y-1">
                        {estadoAprobacion.map((item) => {
                            const fraction = totalAprobaciones > 0 ? item.count / totalAprobaciones : 0;
                            return (
                                <div key={item.label} className="flex items-center gap-2 text-xs">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-gray-600 flex-1">{item.label}</span>
                                    <span className="font-semibold text-gray-900 tabular-nums">{item.count}</span>
                                    <span className="text-gray-400 tabular-nums w-9 text-right">{Math.round(fraction * 100)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
