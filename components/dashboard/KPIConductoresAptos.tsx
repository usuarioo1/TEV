import { Info } from 'lucide-react';
import { useState } from 'react';

interface KPIConductoresAptosProps {
    porcentaje: number;
    noAptos: number;
    reemplazo: number;
    total: number;
    onChartClick?: () => void;
}

export default function KPIConductoresAptos({ porcentaje, noAptos, reemplazo, total, onChartClick }: KPIConductoresAptosProps) {
    const [showInfo, setShowInfo] = useState(false);

    const aptos = total - noAptos;
    const noAptosNormal = noAptos - reemplazo;

    const cx = 80;
    const cy = 80;
    const r = 68;
    const innerR = 36;
    const labelR = (r + innerR) / 2;

    const rawSlices = [
        { label: 'Aptos', count: aptos, color: '#a855f7' },
        { label: 'No aptos', count: noAptosNormal, color: '#f97316' },
        { label: 'Req. reemplazo', count: reemplazo, color: '#ef4444' },
    ].filter(s => s.count > 0);

    const slices: {
        label: string; count: number; color: string;
        fraction: number; path: string; labelX: number; labelY: number;
    }[] = [];

    let startAngle = -Math.PI / 2;
    for (const s of rawSlices) {
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

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">Conductores Aptos</h3>

                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-purple-500 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </div>

            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">Indica el porcentaje de conductores que están aptos para trabajar según el checklist de fatiga contestado. Detecta si hay fatiga acumulada, falta de descanso o condiciones que requieran reemplazo.</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se consulta la tabla <span className="font-mono bg-gray-800 px-1 rounded">ChecklistFatiga</span> filtrando por <span className="font-mono bg-gray-800 px-1 rounded">completado = true</span> y por la <span className="font-mono bg-gray-800 px-1 rounded">fecha</span> declarada en el checklist. Sobre ese universo se cuenta <span className="font-mono bg-gray-800 px-1 rounded">aptoParaTrabajar = true</span> y también los casos con <span className="font-mono bg-gray-800 px-1 rounded">requiereReemplazo = true</span>.</p>
                    <p className="mt-2 text-amber-300">
                        <span className="font-bold">! </span>
                        Excluye servicios en estado <span className="font-mono bg-gray-800 px-1 rounded">RECHAZADO</span> por operario y servicios en estado <span className="font-mono bg-gray-800 px-1 rounded">ACEPTADO</span> que no tienen checklist de fatiga contestado.
                    </p>
                </div>
            )}

            {total === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-sm">
                    Sin evaluaciones registradas
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
                            ) : null
                        )}
                        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#111827">
                            {porcentaje}%
                        </text>
                        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6b7280">
                            Aptos
                        </text>
                    </svg>

                    <div className="w-full mt-2 space-y-1">
                        {slices.map((slice) => (
                            <div key={slice.label} className="flex items-center gap-2 text-xs">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                                <span className="text-gray-600 flex-1">{slice.label}</span>
                                <span className="font-semibold text-gray-900 tabular-nums">{slice.count}</span>
                                <span className="text-gray-400 tabular-nums w-9 text-right">
                                    {Math.round(slice.fraction * 100)}%
                                </span>
                            </div>
                        ))}
                        <div className="pt-1 border-t border-gray-100 text-xs text-gray-400">
                            {total} checklists de fatiga contestados
                        </div>

                    </div>


                </div>
            )}
        </div>
    );
}
