import type { TablaActividadRow } from '../types';

interface ComparativoProgramadasNoProgramadasChartProps {
    rows: TablaActividadRow[];
}

const LABEL_BY_TYPE: Record<TablaActividadRow['tipo'], string> = {
    caminata: 'Caminatas',
    reporte_peligro: 'Reportes Peligro',
    tarjeta_stop: 'Tarjetas Alto Stop',
    control_art: 'Control Calidad ART',
};

const SEGMENTOS = [
    { key: 'programadas', label: 'Programadas', color: '#06b6d4' },
    { key: 'noProgramadas', label: 'No Programadas', color: '#f59e0b' },
] as const;

function getArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const startX = cx + radius * Math.cos(startAngle);
    const startY = cy + radius * Math.sin(startAngle);
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy + radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

export default function ComparativoProgramadasNoProgramadasChart({
    rows,
}: ComparativoProgramadasNoProgramadasChartProps) {
    const data = rows.map((row) => {
        const programadas = Math.max(0, row.totalProgramadas);
        const noProgramadas = Math.max(
            0,
            Number.isFinite(row.actividadesCumplidas)
                ? row.actividadesCumplidas
                : row.totalActividades - row.totalProgramadas,
        );

        return {
            tipo: row.tipo,
            label: LABEL_BY_TYPE[row.tipo],
            programadas,
            noProgramadas,
        };
    });

    if (data.length === 0) {
        return (
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                    Programadas vs No Programadas por Tipo
                </h2>
                <p className="text-sm text-gray-500">
                    Sin datos para graficar en el rango seleccionado.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-bold text-gray-900">
                        Programadas vs No Programadas por Tipo
                    </h2>
                    <p className="text-xs text-gray-500">
                        Compara por tipo las tareas programadas y las no programadas (fuente: tabla de actividades del dashboard).
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                        Programadas
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        No Programadas
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {data.map((item) => {
                    const total = item.programadas + item.noProgramadas;

                    let currentAngle = -Math.PI / 2;
                    const slices = SEGMENTOS.map((segmento) => {
                        const valor = item[segmento.key];
                        const porcentaje = total > 0 ? (valor / total) * 100 : 0;
                        const angle = (porcentaje / 100) * Math.PI * 2;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        const midAngle = (startAngle + endAngle) / 2;
                        currentAngle = endAngle;

                        return {
                            ...segmento,
                            valor,
                            porcentaje,
                            midAngle,
                            path: total > 0 ? getArcPath(70, 70, 58, startAngle, endAngle) : '',
                        };
                    });

                    const activeSlices = slices.filter((slice) => slice.valor > 0);
                    const hasSingleFullSlice = total > 0 && activeSlices.length === 1;

                    return (
                        <article key={item.tipo} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <h3 className="text-xs sm:text-sm text-center font-semibold text-gray-800 min-h-10 leading-tight">
                                {item.label}
                            </h3>

                            <div className="mt-2 flex justify-center">
                                {total === 0 ? (
                                    <div className="h-35 w-35 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center text-xs text-gray-400">
                                        Sin datos
                                    </div>
                                ) : (
                                    <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`Programadas vs no programadas ${item.label}`}>
                                        {hasSingleFullSlice ? (
                                            <>
                                                <circle cx="70" cy="70" r="58" fill={activeSlices[0].color} />
                                                <text
                                                    x="70"
                                                    y="70"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fill="#ffffff"
                                                    fontSize="11"
                                                    fontWeight="bold"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    100.0%
                                                </text>
                                            </>
                                        ) : (
                                            <>
                                                {slices.map((slice) => (
                                                    <path
                                                        key={`${item.tipo}-${slice.key}`}
                                                        d={slice.path}
                                                        fill={slice.color}
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                    >
                                                        <title>{`${slice.label}: ${slice.porcentaje.toFixed(1)}% (${slice.valor})`}</title>
                                                    </path>
                                                ))}
                                                {slices.map((slice) =>
                                                    slice.valor > 0 && slice.porcentaje >= 5 ? (
                                                        <text
                                                            key={`${item.tipo}-${slice.key}-label`}
                                                            x={70 + 36 * Math.cos(slice.midAngle)}
                                                            y={70 + 36 * Math.sin(slice.midAngle)}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                            fill="#ffffff"
                                                            fontSize="9"
                                                            fontWeight="bold"
                                                            style={{ pointerEvents: 'none' }}
                                                        >
                                                            {slice.porcentaje.toFixed(1)}%
                                                        </text>
                                                    ) : null
                                                )}
                                            </>
                                        )}
                                    </svg>
                                )}
                            </div>

                            <div className="mt-2 space-y-1">
                                {slices.map((slice) => (
                                    <div key={`${item.tipo}-${slice.key}-legend`} className="flex items-center justify-between text-[11px] text-gray-600">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                                            {slice.label}
                                        </span>
                                        <span className="font-semibold text-gray-800">
                                            {slice.valor}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}