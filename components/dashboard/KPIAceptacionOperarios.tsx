import { Info } from 'lucide-react';
import { useState } from 'react';

interface KPIAceptacionOperariosProps {
    porcentaje: number;
    totalAsignados: number;
    aceptados: number;
    rechazados: number;
    sinRespuesta: number;
    onChartClick?: () => void;
}

export default function KPIAceptacionOperarios({ porcentaje, totalAsignados, aceptados, rechazados, sinRespuesta, onChartClick }: KPIAceptacionOperariosProps) {
    const [showInfo, setShowInfo] = useState(false);

    const tasaRechazo = totalAsignados > 0 ? Math.round((rechazados / totalAsignados) * 100) : 0;

    const cx = 80, cy = 80, r = 68, innerR = 36;
    const labelR = (r + innerR) / 2;

    const rawSlices = [
        { label: 'Operarios que aceptan servicios', count: aceptados, color: '#22c55e' },
        { label: 'Operarios que rechazan servicios', count: rechazados, color: '#ef4444' },
        { label: 'Sin respuesta (Asignado)', count: sinRespuesta, color: '#9ca3af' },
    ].filter(s => s.count > 0);

    // Usar la suma real de los slices como base del gráfico para que siempre llene el 100%
    const chartTotal = rawSlices.reduce((acc, s) => acc + s.count, 0);

    const slices: { label: string; count: number; color: string; fraction: number; path: string; labelX: number; labelY: number }[] = [];
    let startAngle = -Math.PI / 2;
    for (const s of rawSlices) {
        const fraction = chartTotal > 0 ? s.count / chartTotal : 0;
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
                    <h3 className="text-sm font-medium text-gray-600">Operarios que rechazan servicios</h3>
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
            </div>
            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">Porcentaje de servicios que los operarios rechazan cuando se les asignan. Una tasa alta puede indicar problemas en las condiciones de trabajo, asignación inadecuada o falta de recursos.</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se muestran los servicios <span className="font-mono bg-gray-800 px-1 rounded">ACEPTADO</span>, <span className="font-mono bg-gray-800 px-1 rounded">RECHAZADO</span> y <span className="font-mono bg-gray-800 px-1 rounded">SIN RESPUESTA</span> sobre el total asignado. Meta: rechazo &lt;5% indica buena asignación y condiciones laborales.</p>
                </div>
            )}
            {totalAsignados === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-sm">Sin operarios asignados</div>
            ) : (
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={onChartClick}
                        disabled={!onChartClick}
                        className={`rounded-xl transition-colors ${onChartClick ? 'cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-300/70 focus:ring-offset-2' : ''}`}
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
                            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#111827">{tasaRechazo}%</text>
                            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6b7280">Rechazo</text>
                        </svg>
                    </button>
                    {onChartClick && (
                        <p className="text-[11px] text-indigo-600 mt-1">Clic en el gráfico para ver servicios</p>
                    )}
                    <div className="w-full mt-2 space-y-1">
                        {slices.map(slice => (
                            <div key={slice.label} className="flex items-center gap-2 text-xs">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                                <span className="text-gray-600 flex-1">{slice.label}</span>
                                <span className="font-semibold text-gray-900 tabular-nums">{slice.count}</span>
                                <span className="text-gray-400 tabular-nums w-9 text-right">{Math.round(slice.fraction * 100)}%</span>
                            </div>
                        ))}
                        <div className="pt-1 border-t border-gray-100 text-xs text-gray-400">
                            {totalAsignados} operarios asignados · Meta rechazo &lt;5%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
