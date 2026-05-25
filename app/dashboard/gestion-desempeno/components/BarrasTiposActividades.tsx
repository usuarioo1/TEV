import type { TablaActividadRow } from '../types';

interface BarrasTiposActividadesProps {
    rows: TablaActividadRow[];
}

const LABEL_BY_TYPE: Record<TablaActividadRow['tipo'], string> = {
    caminata: 'Caminatas',
    reporte_peligro: 'Reportes Peligro',
    tarjeta_stop: 'Tarjetas Alto Stop',
    control_art: 'Control Calidad ART',
};

const SEGMENTOS = [
    { key: 'cerradas', label: 'Cerradas', color: '#10b981' },
    { key: 'abiertas', label: 'Abiertas', color: '#ef4444' },
    { key: 'proximas', label: 'Proximas', color: '#3b82f6' },
] as const;

function getArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const startX = cx + radius * Math.cos(startAngle);
    const startY = cy + radius * Math.sin(startAngle);
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy + radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

export default function BarrasTiposActividades({ rows }: BarrasTiposActividadesProps) {
    if (rows.length === 0) {
        return (
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                    Actividades por Tipo
                </h2>
                <p className="text-sm text-gray-500">
                    Sin datos para graficar en el rango seleccionado.
                </p>
            </section>
        );
    }

    const chartData = rows.map((row) => ({
        tipo: row.tipo,
        label: LABEL_BY_TYPE[row.tipo],
        cerradas: row.realizadas + row.realizadasFueraPlazo,
        abiertas: row.atrasadas,
        proximas: row.proximas,
        programadas: row.totalProgramadas,
    }));

    return (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-bold text-gray-900">
                        Actividades por Tipo
                    </h2>
                    <p className="text-xs text-gray-500">
                        Cerradas (realizadas + fuera de plazo), abiertas (atrasadas) y proximas sobre el total de actividades programadas.
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Cerradas
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Abiertas
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Proximas
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {chartData.map((item) => {
                    const total = Math.max(item.cerradas + item.abiertas + item.proximas, 0);

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
                                    <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`Distribucion ${item.label}`}>
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

                            <p className="mt-2 text-[11px] text-gray-500 text-center">
                                {total}/{item.programadas} consideradas
                            </p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
