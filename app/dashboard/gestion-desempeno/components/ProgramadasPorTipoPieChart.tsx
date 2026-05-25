import type { TablaActividadRow } from '../types';

interface ProgramadasPorTipoPieChartProps {
    rows: TablaActividadRow[];
}

const LABEL_BY_TYPE: Record<TablaActividadRow['tipo'], string> = {
    caminata: 'Caminatas',
    reporte_peligro: 'Reportes de Peligro',
    tarjeta_stop: 'Tarjetas Alto Stop',
    control_art: 'Controles ART',
};

const COLOR_BY_TYPE: Record<TablaActividadRow['tipo'], string> = {
    caminata: '#0ea5e9',
    reporte_peligro: '#f97316',
    tarjeta_stop: '#22c55e',
    control_art: '#8b5cf6',
};

export default function ProgramadasPorTipoPieChart({ rows }: ProgramadasPorTipoPieChartProps) {
    const toSafeNumber = (value: unknown) => {
        const num = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(num) ? num : 0;
    };

    const data = rows
        .map((row) => ({
            tipo: row.tipo,
            label: LABEL_BY_TYPE[row.tipo],
            totalProgramadas: Math.max(
                0,
                toSafeNumber(row.totalProgramadas),
                toSafeNumber(row.realizadas) +
                toSafeNumber(row.realizadasFueraPlazo) +
                toSafeNumber(row.proximas) +
                toSafeNumber(row.atrasadas),
            ),
            color: COLOR_BY_TYPE[row.tipo],
        }))
        .filter((item) => item.totalProgramadas > 0)
        .sort((a, b) => b.totalProgramadas - a.totalProgramadas);

    const totalGeneral = data.reduce((acc, item) => acc + item.totalProgramadas, 0);

    if (totalGeneral === 0) {
        return (
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                    Actividades por Tipo
                </h2>
                <p className="text-sm text-gray-500">
                    Sin datos de actividades para graficar en el rango seleccionado.
                </p>
            </section>
        );
    }

    const slices = data.map((item) => {
        const fraction = item.totalProgramadas / totalGeneral;
        return {
            ...item,
            fraction,
            porcentaje: fraction * 100,
        };
    });

    const chartSize = 220;
    const center = chartSize / 2;
    const labelRadius = 82;

    let acc = 0;
    const slicesWithAngles = slices.map((slice) => {
        const start = acc;
        const end = acc + slice.porcentaje;
        const mid = (start + end) / 2;
        acc = end;

        const angleRad = ((mid * 3.6) - 90) * (Math.PI / 180);
        return {
            ...slice,
            start,
            end,
            x: center + labelRadius * Math.cos(angleRad),
            y: center + labelRadius * Math.sin(angleRad),
        };
    });

    const gradientStops = slicesWithAngles.map((slice) => {
        return `${slice.color} ${slice.start.toFixed(3)}% ${slice.end.toFixed(3)}%`;
    });
    const donutBackground = `conic-gradient(${gradientStops.join(', ')})`;

    return (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold text-gray-900 mb-1">
                Actividades por Tipo
            </h2>
            <p className="text-xs text-gray-500 mb-4">
                Distribución del total de actividades programadas por tipo.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-center">
                <div className="mx-auto">
                    <div
                        className="relative h-55 w-55 rounded-full"
                        role="img"
                        aria-label="Grafico de torta de actividades por tipo"
                        style={{ background: donutBackground }}
                    >
                        {slicesWithAngles.map((slice) => (
                            <span
                                key={`pct-${slice.tipo}`}
                                className="absolute -translate-x-1/2 -translate-y-1/2 text-white font-bold leading-none"
                                style={{
                                    left: `${slice.x}px`,
                                    top: `${slice.y}px`,
                                    fontSize: slice.porcentaje >= 8 ? '11px' : '9px',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.55)',
                                    pointerEvents: 'none',
                                }}
                            >
                                {slice.porcentaje.toFixed(1)}%
                            </span>
                        ))}
                        <div className="absolute inset-13 rounded-full bg-white flex flex-col items-center justify-center">
                            <p className="text-[22px] font-bold text-gray-900 leading-none">{totalGeneral}</p>
                            <p className="text-[9px] text-gray-500 mt-1">Total</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {slicesWithAngles.map((slice) => (
                        <div key={slice.tipo} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="h-3 w-3 rounded-full shrink-0"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <span className="text-sm text-gray-700 truncate">{slice.label}</span>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-gray-900">{slice.porcentaje.toFixed(1)}%</p>
                                <p className="text-xs text-gray-500">{slice.totalProgramadas} programadas</p>
                            </div>
                        </div>
                    ))}

                    <p className="pt-1 text-[11px] text-gray-500">
                        Total: {totalGeneral} programadas.
                    </p>
                </div>
            </div>
        </section>
    );
}
